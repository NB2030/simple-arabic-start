import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// Zod schema for Ko-fi webhook validation
const kofiWebhookSchema = z.object({
  verification_token: z.string().min(1),
  message_id: z.string().min(1).max(255),
  timestamp: z.string(),
  type: z.enum(['Donation', 'Subscription', 'Shop Order', 'Commission']),
  from_name: z.string().max(255),
  email: z.string().email().max(255),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3),
  is_public: z.boolean(),
  url: z.string().max(500),
  message: z.string().max(1000).nullable().optional(),
  is_subscription_payment: z.boolean(),
  is_first_subscription_payment: z.boolean(),
  kofi_transaction_id: z.string().max(255).optional(),
  shop_items: z.array(z.object({
    direct_link_code: z.string().max(100),
    variation_name: z.string().max(255),
    quantity: z.number().int().positive()
  })).nullable().optional(),
  tier_name: z.string().max(255).nullable().optional(),
  shipping: z.object({
    full_name: z.string().max(255),
    street_address: z.string().max(500),
    city: z.string().max(100),
    state_or_province: z.string().max(100),
    postal_code: z.string().max(20),
    country: z.string().max(100),
    country_code: z.string().max(10),
    telephone: z.string().max(50)
  }).nullable().optional()
});

// Sanitize text to prevent XSS (basic implementation)
function sanitizeText(text: string | null | undefined): string | null {
  if (!text) return null;
  // Remove HTML tags and limit length
  return text.replace(/<[^>]*>/g, '').slice(0, 1000);
}

// Generate cryptographically secure license key
function generateSecureLicenseKey(): string {
  const array = new Uint8Array(12); // 12 bytes = 96 bits of entropy
  crypto.getRandomValues(array);
  
  const hex = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
    
  // Format as XXXXX-XXXXX-XXXXX-XXXXX
  return `${hex.slice(0,5)}-${hex.slice(5,10)}-${hex.slice(10,15)}-${hex.slice(15,20)}`;
}

// Map errors to safe user messages
function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('duplicate key')) return 'This item already exists';
    if (msg.includes('foreign key')) return 'Referenced item not found';
    if (msg.includes('permission denied')) return 'Access denied';
    if (msg.includes('violates row-level security')) return 'Access denied';
  }
  return 'An error occurred processing your request';
}

interface KofiWebhookData {
  verification_token: string;
  message_id: string;
  timestamp: string;
  type: string;
  is_public: boolean;
  from_name: string;
  message: string | null;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
  shop_items?: Array<{
    direct_link_code: string;
    variation_name: string;
    quantity: number;
  }>;
  tier_name?: string | null;
  shipping?: {
    full_name: string;
    street_address: string;
    city: string;
    state_or_province: string;
    postal_code: string;
    country: string;
    country_code: string;
    telephone: string;
  } | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const verificationToken = Deno.env.get('KOFI_VERIFICATION_TOKEN')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Ko-fi webhook received');

    const formData = await req.formData();
    const dataString = formData.get('data') as string;
    
    if (!dataString) {
      console.error('No data in webhook');
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate webhook data
    let data;
    try {
      const parsed = JSON.parse(dataString);
      data = kofiWebhookSchema.parse(parsed);
      console.log('Validated Ko-fi data:', { 
        email: data.email, 
        amount: data.amount, 
        type: data.type,
        message_id: data.message_id 
      });
    } catch (validationError) {
      console.error('Invalid webhook data format:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    if (data.verification_token !== verificationToken) {
      console.error('Invalid verification token');
      return new Response(
        JSON.stringify({ error: 'Invalid verification token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already processed by message_id (idempotency)
    const { data: existingOrder } = await supabase
      .from('kofi_orders')
      .select('id, license_id')
      .eq('message_id', data.message_id)
      .maybeSingle();

    if (existingOrder) {
      console.log('Order already processed (message_id):', data.message_id);
      return new Response(
        JSON.stringify({ success: true, message: 'Order already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Additional idempotency: check by kofi_transaction_id
    if (data.kofi_transaction_id) {
      const { data: existingByTxn } = await supabase
        .from('kofi_orders')
        .select('id, license_id')
        .eq('kofi_transaction_id', data.kofi_transaction_id)
        .maybeSingle();

      if (existingByTxn) {
        console.log('Order already processed (kofi_transaction_id):', data.kofi_transaction_id);
        return new Response(
          JSON.stringify({ success: true, message: 'Order already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', data.email.toLowerCase())
      .maybeSingle();

    console.log('User found:', profile ? 'Yes' : 'No');

    // Determine duration based on shop items or amount
    let durationDays = 30; // default
    let tierUsed = 'افتراضي';
    let shouldCreateLicense = true;

    if (data.shop_items && data.shop_items.length > 0) {
      // Shop Order - match by direct_link_code for digital products
      const firstItem = data.shop_items[0];
      const productCode = firstItem.direct_link_code;
      console.log('Shop item - direct link code:', productCode);

      // Look for product-type pricing tier
      const { data: productTier } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('tier_type', 'product')
        .eq('product_identifier', productCode)
        .eq('is_active', true)
        .maybeSingle();

      if (productTier) {
        durationDays = productTier.duration_days;
        tierUsed = productTier.name;
        console.log('Matched product tier:', tierUsed, 'with code:', productCode);
      } else {
        // No matching product tier found
        shouldCreateLicense = false;
        tierUsed = '-';
        console.log('No product tier found for direct_link_code:', productCode);
      }
    } else {
      // Donation - match by amount with donation-type tiers
      const amount = parseFloat(data.amount);
      const { data: donationTiers } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('tier_type', 'donation')
        .lte('amount', amount)
        .gt('amount', 0)
        .eq('is_active', true)
        .order('amount', { ascending: false })
        .limit(1);

      const tier = donationTiers?.[0];
      if (tier) {
        durationDays = tier.duration_days;
        tierUsed = tier.name;
        console.log('Matched donation tier:', tierUsed, 'for amount:', amount);
      } else {
        shouldCreateLicense = false;
        tierUsed = '-';
        console.log('No donation tier found for amount:', amount);
      }
    }

    console.log('Duration days:', durationDays, 'Tier:', tierUsed, 'Create?', shouldCreateLicense);

    let licenseKey: string | null = null;
    let newLicense: any = null;

    if (shouldCreateLicense) {
      // Create license for the purchase with cryptographically secure key
      licenseKey = `KOFI-${generateSecureLicenseKey()}`;

      const { data: created, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          license_key: licenseKey,
          duration_days: durationDays,
          max_activations: 1,
          current_activations: 0,
          is_active: true,
          notes: `Ko-fi ${data.type} - ${data.from_name} - ${data.amount} ${data.currency} - ${tierUsed}`,
        })
        .select()
        .single();

      if (licenseError) {
        console.error('Error creating license:', licenseError);
        throw licenseError;
      }

      newLicense = created;
      console.log('License created:', licenseKey);
    } else {
      console.log('No matching pricing tier - recording order without license');
    }

    // Store Ko-fi order with sanitized text fields
    const { error: orderError } = await supabase
      .from('kofi_orders')
      .insert({
        verification_token: data.verification_token,
        message_id: data.message_id,
        timestamp: data.timestamp,
        type: data.type,
        is_public: data.is_public,
        from_name: sanitizeText(data.from_name),
        message: sanitizeText(data.message),
        amount: data.amount,
        url: data.url,
        email: data.email.toLowerCase(),
        currency: data.currency,
        is_subscription_payment: data.is_subscription_payment,
        is_first_subscription_payment: data.is_first_subscription_payment,
        kofi_transaction_id: data.kofi_transaction_id,
        shop_items: data.shop_items,
        tier_name: data.tier_name,
        shipping: data.shipping,
        license_id: newLicense ? newLicense.id : null,
        user_id: profile?.id || null,
        processed: false,
      });

    if (orderError) {
      console.error('Error storing order:', orderError);
      throw orderError;
    }

    // If user exists, activate license automatically
    if (profile && newLicense) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error: activationError } = await supabase
        .from('user_licenses')
        .insert({
          user_id: profile.id,
          license_id: newLicense.id,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        });

      if (activationError) {
        console.error('Error activating license:', activationError);
      } else {
        console.log('License activated for user:', profile.email);
        
        // Update license activation count
        await supabase
          .from('licenses')
          .update({ current_activations: 1 })
          .eq('id', newLicense.id);

        // Mark order as processed
        await supabase
          .from('kofi_orders')
          .update({ processed: true })
          .eq('message_id', data.message_id);
      }
    } else if (!profile) {
      console.log('No user found - license (if created) not activated');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: shouldCreateLicense ? 'Payment processed successfully' : 'Order recorded without license (no matching tier)',
        license_key: licenseKey,
        user_found: !!profile,
        auto_activated: !!profile && !!newLicense,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log full error details server-side only
    console.error('Error processing Ko-fi webhook:', error);
    
    // Return safe error message to client
    return new Response(
      JSON.stringify({ error: getSafeErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});