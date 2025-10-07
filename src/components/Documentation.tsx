import { Book, Code, Key, User, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function Documentation() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-8 h-8" />
            <h1 className="text-3xl font-bold">توثيق نظام التراخيص والاشتراكات</h1>
          </div>
          <p className="text-blue-100">
            دليل شامل لربط نظام التراخيص بتطبيقك باستخدام API مع دعم الوصول غير المتصل
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Code className="w-6 h-6 text-blue-600" />
              نظرة عامة على النظام
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
              <p>
                نظام التراخيص هذا يوفر حلاً متكاملاً لإدارة التراخيص والاشتراكات في تطبيقاتك.
                يدعم النظام:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>إنشاء وإدارة تراخيص بمدد محددة</li>
                <li>تفعيل التراخيص للمستخدمين</li>
                <li>التحقق من صلاحية التراخيص</li>
                <li>دعم الوصول غير المتصل بالإنترنت</li>
                <li>لوحة تحكم للمشرفين</li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600" />
              المرحلة 1: إعداد Supabase Client
            </h2>
            <p className="text-gray-700 mb-4">
              قم بإنشاء ملف لإعداد Supabase في تطبيقك:
            </p>

            <div className="relative">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${supabaseUrl}';
const supabaseAnonKey = 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`,
                      'setup'
                    )
                  }
                  className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {copiedCode === 'setup' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-sm">
                  <code>{`// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${supabaseUrl}';
const supabaseAnonKey = 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`}</code>
                </pre>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ملاحظة:</strong> استبدل YOUR_ANON_KEY بمفتاح API الخاص بك من لوحة تحكم Supabase
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              المرحلة 2: إنشاء نظام التسجيل والدخول
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">1. التسجيل (Sign Up)</h3>
            <div className="relative">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `async function signUp(email: string, password: string, fullName: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
  });

  if (profileError) throw profileError;
  return authData.user;
}`,
                      'signup'
                    )
                  }
                  className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {copiedCode === 'signup' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-sm">
                  <code>{`// التسجيل
async function signUp(email: string, password: string, fullName: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
  });

  if (profileError) throw profileError;
  return authData.user;
}`}</code>
                </pre>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2. تسجيل الدخول (Sign In)</h3>
            <div className="relative">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}`,
                      'signin'
                    )
                  }
                  className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {copiedCode === 'signin' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-sm">
                  <code>{`// تسجيل الدخول
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}`}</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600" />
              المرحلة 3: تفعيل الترخيص
            </h2>

            <p className="text-gray-700 mb-4">
              بعد تسجيل الدخول، استخدم Edge Function لتفعيل الترخيص:
            </p>

            <div className="relative">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `async function activateLicense(licenseKey: string) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(
    '${supabaseUrl}/functions/v1/activate-license',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${session.access_token}\`,
      },
      body: JSON.stringify({ licenseKey }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}`,
                      'activate'
                    )
                  }
                  className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {copiedCode === 'activate' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-sm">
                  <code>{`async function activateLicense(licenseKey: string) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(
    '${supabaseUrl}/functions/v1/activate-license',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${session.access_token}\`,
      },
      body: JSON.stringify({ licenseKey }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}`}</code>
                </pre>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ملاحظة:</strong> يتطلب هذا Edge Function توكن المصادقة في الـ Authorization header
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              المرحلة 4: التحقق من صلاحية الترخيص
            </h2>

            <p className="text-gray-700 mb-4">
              استخدم Edge Function للتحقق من أن المستخدم لديه ترخيص نشط:
            </p>

            <div className="relative">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `async function checkUserLicense() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(
    '${supabaseUrl}/functions/v1/validate-license',
    {
      method: 'GET',
      headers: {
        'Authorization': \`Bearer \${session.access_token}\`,
      },
    }
  );

  const data = await response.json();

  if (!data.isValid) {
    return { isValid: false, message: data.message };
  }

  return {
    isValid: true,
    expiresAt: data.expiresAt,
    license: data.license
  };
}`,
                      'check'
                    )
                  }
                  className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {copiedCode === 'check' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-sm">
                  <code>{`async function checkUserLicense() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(
    '${supabaseUrl}/functions/v1/validate-license',
    {
      method: 'GET',
      headers: {
        'Authorization': \`Bearer \${session.access_token}\`,
      },
    }
  );

  const data = await response.json();

  if (!data.isValid) {
    return { isValid: false, message: data.message };
  }

  return {
    isValid: true,
    expiresAt: data.expiresAt,
    license: data.license
  };
}`}</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              المرحلة 5: دعم الوصول غير المتصل
            </h2>

            <p className="text-gray-700 mb-4">
              لدعم الوصول غير المتصل، احفظ بيانات الترخيص في localStorage:
            </p>

            <div className="relative">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `const OFFLINE_LICENSE_KEY = 'app_license_offline';

function saveOfflineLicense(data) {
  localStorage.setItem(OFFLINE_LICENSE_KEY, JSON.stringify({
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    licenseKey: data.licenseKey,
    expiresAt: data.expiresAt,
    lastValidated: new Date().toISOString(),
  }));
}

function checkOfflineLicense() {
  const data = localStorage.getItem(OFFLINE_LICENSE_KEY);
  if (!data) return false;

  const license = JSON.parse(data);
  const now = new Date();
  const expiresAt = new Date(license.expiresAt);

  return expiresAt > now;
}`,
                      'offline'
                    )
                  }
                  className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {copiedCode === 'offline' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-sm">
                  <code>{`const OFFLINE_LICENSE_KEY = 'app_license_offline';

function saveOfflineLicense(data) {
  localStorage.setItem(OFFLINE_LICENSE_KEY, JSON.stringify({
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    licenseKey: data.licenseKey,
    expiresAt: data.expiresAt,
    lastValidated: new Date().toISOString(),
  }));
}

function checkOfflineLicense() {
  const data = localStorage.getItem(OFFLINE_LICENSE_KEY);
  if (!data) return false;

  const license = JSON.parse(data);
  const now = new Date();
  const expiresAt = new Date(license.expiresAt);

  return expiresAt > now;
}`}</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edge Functions API</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. تفعيل الترخيص</h3>
                <div className="bg-gray-100 p-3 rounded-lg mb-2">
                  <code className="text-sm">POST {supabaseUrl}/functions/v1/activate-license</code>
                </div>
                <p className="text-sm text-gray-600 mb-2">Headers:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm mb-2">
                  <pre>{`Authorization: Bearer <access_token>
Content-Type: application/json`}</pre>
                </div>
                <p className="text-sm text-gray-600 mb-2">Body:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm mb-2">
                  <pre>{`{
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX"
}`}</pre>
                </div>
                <p className="text-sm text-gray-600 mb-2">Response:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm">
                  <pre>{`{
  "success": true,
  "message": "License activated successfully",
  "expiresAt": "2024-11-05T12:00:00.000Z"
}`}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. التحقق من الترخيص</h3>
                <div className="bg-gray-100 p-3 rounded-lg mb-2">
                  <code className="text-sm">GET {supabaseUrl}/functions/v1/validate-license</code>
                </div>
                <p className="text-sm text-gray-600 mb-2">Headers:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm mb-2">
                  <pre>{`Authorization: Bearer <access_token>`}</pre>
                </div>
                <p className="text-sm text-gray-600 mb-2">Response:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm">
                  <pre>{`{
  "isValid": true,
  "expiresAt": "2024-11-05T12:00:00.000Z",
  "license": {
    "license_key": "XXXXX-XXXXX-XXXXX-XXXXX",
    "duration_days": 30
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ملخص سير العمل</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <p className="text-gray-700">المستخدم يقوم بالتسجيل أو تسجيل الدخول (Supabase Auth)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <p className="text-gray-700">المستخدم يدخل مفتاح الترخيص</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <p className="text-gray-700">استدعاء activate-license Edge Function بالتوكن</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <p className="text-gray-700">يتم حفظ بيانات الترخيص محلياً للوصول غير المتصل</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  5
                </div>
                <p className="text-gray-700">التحقق الدوري باستخدام validate-license Edge Function</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  6
                </div>
                <p className="text-gray-700">المستخدم يمكنه الوصول للتطبيق حتى بدون إنترنت (من الكاش)</p>
              </div>
            </div>
          </section>

          {/* New Migration Section */}
          <section className="bg-white rounded-xl shadow-sm p-6 border-2 border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">دليل الترحيل من النسخة السابقة</h2>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              <div className="bg-amber-50 border-r-4 border-amber-400 p-4 rounded-lg">
                <p className="font-bold text-amber-900 mb-2">⚠️ مهم: تحديثات أمنية</p>
                <p className="text-amber-800">
                  تم تحسين النظام بإضافة طبقة أمان إضافية للتحقق من صلاحيات المشرفين. يجب عليك تحديث كود التحقق من صلاحيات الأدمن.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. التغييرات الرئيسية</h3>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li><strong>التحقق من صلاحيات الأدمن:</strong> الآن يتم عبر Edge Function بدلاً من الاستعلام المباشر من جهة العميل</li>
                  <li><strong>استيراد Supabase:</strong> تم تحديث جميع Edge Functions لاستخدام ESM imports</li>
                  <li><strong>التحقق من كلمة المرور:</strong> تم تطبيق معايير أقوى للتحقق من صحة كلمات المرور</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. تحديث Edge Functions</h3>
                <p className="mb-3">قم بتحديث استيراد Supabase في جميع Edge Functions:</p>
                <div className="relative">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `// ❌ الطريقة القديمة
import { createClient } from '@supabase/supabase-js';

// ✅ الطريقة الجديدة
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';`,
                          'migration-imports'
                        )
                      }
                      className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      {copiedCode === 'migration-imports' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <pre className="text-sm">
                      <code>{`// ❌ الطريقة القديمة
import { createClient } from '@supabase/supabase-js';

// ✅ الطريقة الجديدة
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. إضافة Edge Function للتحقق من صلاحيات الأدمن</h3>
                <p className="mb-3">قم بإنشاء Edge Function جديد للتحقق الآمن من صلاحيات المشرفين:</p>
                <div className="relative">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `// supabase/functions/check-admin/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ isAdmin: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await serviceRoleClient.rpc('is_admin', {
      check_user_id: user.id,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ isAdmin: !!data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ isAdmin: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});`,
                          'migration-check-admin'
                        )
                      }
                      className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      {copiedCode === 'migration-check-admin' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <pre className="text-sm overflow-x-auto">
                      <code>{`// supabase/functions/check-admin/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ isAdmin: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await serviceRoleClient.rpc('is_admin', {
      check_user_id: user.id,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ isAdmin: !!data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ isAdmin: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. تحديث كود التطبيق</h3>
                <p className="mb-3">استبدل كود التحقق من صلاحيات الأدمن في تطبيقك:</p>
                <div className="relative mb-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `// ❌ الطريقة القديمة (غير آمنة)
const { data } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

const isAdmin = !!data;

// ✅ الطريقة الجديدة (آمنة)
const { data, error } = await supabase.functions.invoke('check-admin');

if (error || !data?.isAdmin) {
  console.error('Admin verification failed');
  await supabase.auth.signOut();
  return;
}

const isAdmin = true;`,
                          'migration-client-code'
                        )
                      }
                      className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      {copiedCode === 'migration-client-code' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <pre className="text-sm">
                      <code>{`// ❌ الطريقة القديمة (غير آمنة)
const { data } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

const isAdmin = !!data;

// ✅ الطريقة الجديدة (آمنة)
const { data, error } = await supabase.functions.invoke('check-admin');

if (error || !data?.isAdmin) {
  console.error('Admin verification failed');
  await supabase.auth.signOut();
  return;
}

const isAdmin = true;`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. التحقق من صحة كلمة المرور</h3>
                <p className="mb-3">تأكد من استخدام التحقق القوي من كلمات المرور في جميع أنحاء التطبيق:</p>
                <div className="relative">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, { message: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل' })
  .regex(/[A-Z]/, { message: 'يجب أن تحتوي على حرف كبير واحد على الأقل' })
  .regex(/[a-z]/, { message: 'يجب أن تحتوي على حرف صغير واحد على الأقل' })
  .regex(/[0-9]/, { message: 'يجب أن تحتوي على رقم واحد على الأقل' });

// استخدام
const result = passwordSchema.safeParse(password);
if (!result.success) {
  console.error(result.error.issues[0].message);
}`,
                          'migration-password-validation'
                        )
                      }
                      className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      {copiedCode === 'migration-password-validation' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <pre className="text-sm">
                      <code>{`import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, { message: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل' })
  .regex(/[A-Z]/, { message: 'يجب أن تحتوي على حرف كبير واحد على الأقل' })
  .regex(/[a-z]/, { message: 'يجب أن تحتوي على حرف صغير واحد على الأقل' })
  .regex(/[0-9]/, { message: 'يجب أن تحتوي على رقم واحد على الأقل' });

// استخدام
const result = passwordSchema.safeParse(password);
if (!result.success) {
  console.error(result.error.issues[0].message);
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-r-4 border-green-400 p-4 rounded-lg">
                <p className="font-bold text-green-900 mb-2">✅ نصائح مهمة بعد الترحيل:</p>
                <ul className="list-disc list-inside space-y-1 text-green-800">
                  <li>اختبر جميع وظائف التسجيل والدخول</li>
                  <li>تأكد من عمل Edge Functions بشكل صحيح</li>
                  <li>راجع أذونات قاعدة البيانات (RLS)</li>
                  <li>قم بتحديث أي وثائق API في مشروعك</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
