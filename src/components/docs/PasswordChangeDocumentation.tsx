export default function PasswordChangeDocumentation() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">تطبيق ميزة تغيير كلمة المرور</h2>
        <p className="text-gray-700 mb-4">
          يوفر النظام ميزة تغيير كلمة المرور للمستخدمين والمدراء بطريقة آمنة.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">1. للمستخدمين العاديين</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <p className="text-gray-700">
            يمكن للمستخدمين تغيير كلمة المرور من خلال Supabase Auth مباشرة:
          </p>
          
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">الكود في React Component:</p>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto" dir="ltr">
{`import { supabase } from '@/lib/supabase';
import { useState } from 'react';

function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      alert('تم تغيير كلمة المرور بنجاح');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword}>
      <input
        type="password"
        placeholder="كلمة المرور الجديدة"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="تأكيد كلمة المرور"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
      </button>
    </form>
  );
}`}</pre>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">2. للمدراء - تغيير كلمة مرور المستخدمين</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <p className="text-gray-700">
            يمكن للمدراء تغيير كلمات مرور المستخدمين باستخدام Admin API:
          </p>
          
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">الكود في لوحة التحكم:</p>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto" dir="ltr">
{`const handleResetUserPassword = async (userId: string, newPassword: string) => {
  try {
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;
    
    alert('تم تحديث كلمة المرور بنجاح');
  } catch (error: any) {
    console.error('Error:', error);
    alert('فشل تحديث كلمة المرور');
  }
};`}</pre>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> يتطلب استخدام <code className="bg-blue-100 px-1 rounded">supabase.auth.admin</code> أن يكون المستخدم لديه صلاحيات المدير.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">3. إضافة التحقق من قوة كلمة المرور</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <p className="text-gray-700">
            استخدم Zod للتحقق من قوة كلمة المرور:
          </p>
          
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto" dir="ltr">
{`import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'يجب أن تكون كلمة المرور 8 أحرف على الأقل')
  .max(128, 'كلمة المرور طويلة جداً')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
  .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم');

// الاستخدام
try {
  passwordSchema.parse(newPassword);
  // كلمة المرور صحيحة
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error(err.issues[0].message);
  }
}`}</pre>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">4. إعادة تعيين كلمة المرور عبر البريد</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <p className="text-gray-700">
            لإرسال رابط إعادة تعيين كلمة المرور للمستخدم:
          </p>
          
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto" dir="ltr">
{`const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://yourapp.com/reset-password',
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك');
};`}</pre>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm text-yellow-800">
              <strong>تنبيه:</strong> تأكد من تفعيل إعادة تعيين كلمة المرور في إعدادات Supabase Auth.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">5. أفضل الممارسات الأمنية</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>استخدم HTTPS دائماً لنقل كلمات المرور</li>
            <li>لا تخزن كلمات المرور في localStorage أو sessionStorage</li>
            <li>استخدم التحقق بخطوتين (2FA) إن أمكن</li>
            <li>أجبر المستخدمين على تغيير كلمة المرور المؤقتة عند أول تسجيل دخول</li>
            <li>استخدم معايير قوية لكلمات المرور (8 أحرف على الأقل، أحرف كبيرة وصغيرة، أرقام)</li>
            <li>لا تعرض رسائل خطأ مفصلة تكشف معلومات حساسة</li>
            <li>سجّل محاولات تغيير كلمة المرور للمراجعة الأمنية</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">6. معالجة الأخطاء</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto" dir="ltr">
{`// معالجة الأخطاء الشائعة
const handlePasswordError = (error: any) => {
  switch (error.message) {
    case 'Password should be at least 6 characters':
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    case 'New password should be different from the old password':
      return 'كلمة المرور الجديدة يجب أن تختلف عن القديمة';
    case 'Invalid login credentials':
      return 'كلمة المرور الحالية غير صحيحة';
    default:
      return 'حدث خطأ أثناء تغيير كلمة المرور';
  }
};`}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}
