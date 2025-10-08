import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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
        JSON.stringify({ error: 'No data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: KofiWebhookData = JSON.parse(dataString);
    console.log('Parsed Ko-fi data:', { 
      email: data.email, 
      amount: data.amount, 
      type: data.type,
      message_id: data.message_id 
    });

    // Verify token
    if (data.verification_token !== verificationToken) {
      console.error('Invalid verification token');
      return new Response(
        JSON.stringify({ error: 'Invalid verification token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already processed
    const { data: existingOrder } = await supabase
      .from('kofi_orders')
      .select('id')
      .eq('message_id', data.message_id)
      .maybeSingle();

    if (existingOrder) {
      console.log('Order already processed:', data.message_id);
      return new Response(
        JSON.stringify({ success: true, message: 'Order already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    if (data.shop_items && data.shop_items.length > 0) {
      // Try to match by variation_name or direct_link_code
      const firstItem = data.shop_items[0];
      console.log('Shop item:', firstItem);

      // Check if variation_name or direct_link_code matches a pricing tier
      const { data: tierByName } = await supabase
        .from('pricing_tiers')
        .select('*')
        .ilike('name', `%${firstItem.variation_name || firstItem.direct_link_code}%`)
        .eq('is_active', true)
        .maybeSingle();

      if (tierByName) {
        durationDays = tierByName.duration_days;
        tierUsed = tierByName.name;
        console.log('Matched tier by name:', tierUsed);
      } else {
        // Fallback to amount-based pricing
        const amount = parseFloat(data.amount);
        const { data: pricingTiers } = await supabase
          .from('pricing_tiers')
          .select('*')
          .lte('amount', amount)
          .eq('is_active', true)
          .order('amount', { ascending: false })
          .limit(1);

        const tier = pricingTiers?.[0];
        durationDays = tier?.duration_days || 30;
        tierUsed = tier?.name || 'افتراضي';
      }
    } else {
      // Regular donation - use amount-based pricing
      const amount = parseFloat(data.amount);
      const { data: pricingTiers } = await supabase
        .from('pricing_tiers')
        .select('*')
        .lte('amount', amount)
        .eq('is_active', true)
        .order('amount', { ascending: false })
        .limit(1);

      const tier = pricingTiers?.[0];
      durationDays = tier?.duration_days || 30;
      tierUsed = tier?.name || 'افتراضي';
    }

    console.log('Duration days:', durationDays, 'Tier:', tierUsed);

    // Create license for the purchase
    const licenseKey = `KOFI-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const { data: newLicense, error: licenseError } = await supabase
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

    console.log('License created:', licenseKey);

    // Store Ko-fi order
    const { error: orderError } = await supabase
      .from('kofi_orders')
      .insert({
        verification_token: data.verification_token,
        message_id: data.message_id,
        timestamp: data.timestamp,
        type: data.type,
        is_public: data.is_public,
        from_name: data.from_name,
        message: data.message,
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
        license_id: newLicense.id,
        user_id: profile?.id || null,
        processed: false,
      });

    if (orderError) {
      console.error('Error storing order:', orderError);
      throw orderError;
    }

    // If user exists, activate license automatically
    if (profile) {
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
    } else {
      console.log('No user found - license created but not activated');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment processed successfully',
        license_key: licenseKey,
        user_found: !!profile,
        auto_activated: !!profile,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing Ko-fi webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});