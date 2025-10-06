# نظام إدارة التراخيص الاحترافي

نظام متكامل لإدارة التراخيص والاشتراكات مع واجهة إدارية للمشرفين فقط، مبني باستخدام React و Supabase.

## 🎯 نظرة عامة

هذا النظام مصمم **للمشرفين فقط** لإدارة التراخيص. المستخدمون النهائيون يستخدمون التراخيص المُنشأة في تطبيقاتك الخاصة من خلال API.

## ✨ المميزات الرئيسية

### لوحة الإدارة
- ✅ تسجيل دخول آمن للمشرفين فقط
- ✅ تغيير كلمة المرور الإجباري عند أول تسجيل دخول
- ✅ إنشاء تراخيص بمدد مخصصة (بالأيام)
- ✅ تحديد عدد التفعيلات المسموحة لكل ترخيص
- ✅ مراقبة المستخدمين النشطين والتراخيص
- ✅ تفعيل/إلغاء تفعيل/حذف التراخيص
- ✅ عرض سجل كامل للمستخدمين وتراخيصهم
- ✅ إحصائيات شاملة

### للمستخدمين النهائيين (في تطبيقك)
- ✅ تسجيل وتفعيل حساب بالبريد والاسم فقط
- ✅ تفعيل الترخيص عبر مفتاح بسيط
- ✅ الوصول للتطبيق حتى بدون إنترنت
- ✅ تتبع حالة الترخيص وتاريخ الانتهاء
- ✅ واجهة عربية جميلة وسهلة الاستخدام

### للمطورين
- ✅ API كامل وموثق مع Edge Functions
- ✅ دعم الوصول غير المتصل (Offline)
- ✅ Row Level Security كامل
- ✅ توثيق شامل مع أمثلة كود جاهزة للنسخ
- ✅ سهولة الربط بأي تطبيق React

## 🏗️ البنية التقنية

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **المصادقة**: Supabase Auth
- **قاعدة البيانات**: PostgreSQL مع RLS
- **Icons**: Lucide React

## 🚀 البدء السريع

### 1. التثبيت

```bash
npm install
```

### 2. إعداد المتغيرات

تأكد من وجود ملف `.env` مع المتغيرات التالية:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. إنشاء حساب المشرف

اتبع التعليمات في ملف `SETUP.md` لإنشاء حساب المشرف الافتراضي:

**بيانات الدخول الافتراضية:**
- البريد الإلكتروني: `newvex2030@hotmail.com`
- كلمة المرور: `357357`

⚠️ **مهم**: عند أول تسجيل دخول، سيُطلب منك تغيير كلمة المرور المؤقتة.

### 4. التشغيل

```bash
npm run dev
```

## 📁 هيكل المشروع

```
src/
├── components/
│   ├── AdminLoginForm.tsx          # نموذج تسجيل دخول المشرف
│   ├── ChangePasswordModal.tsx     # نافذة تغيير كلمة المرور
│   ├── AdminDashboard.tsx          # لوحة إدارة التراخيص
│   └── Documentation.tsx           # صفحة التوثيق الشاملة
├── lib/
│   ├── supabase.ts                # إعداد Supabase Client
│   ├── auth.ts                    # خدمات المصادقة
│   └── license.ts                 # خدمات التراخيص
└── App.tsx                         # التطبيق الرئيسي
```

## 🗄️ قاعدة البيانات

### الجداول

1. **profiles**: معلومات المستخدمين
   - `id`, `email`, `full_name`, `created_at`, `updated_at`

2. **admin_users**: المشرفين
   - `id`, `user_id`, `password_changed`, `created_at`

3. **licenses**: التراخيص
   - `id`, `license_key`, `duration_days`, `max_activations`, `current_activations`, `is_active`, `notes`

4. **user_licenses**: ربط المستخدمين بالتراخيص
   - `id`, `user_id`, `license_id`, `activated_at`, `expires_at`, `is_active`, `last_validated`

## 🔌 Edge Functions API

### 1. تفعيل الترخيص
```
POST /functions/v1/activate-license
```

**Body:**
```json
{
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX"
}
```

### 2. التحقق من الترخيص
```
GET /functions/v1/validate-license
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

## 🔗 الربط بتطبيقك

راجع صفحة **التوثيق** داخل التطبيق للحصول على أمثلة كود كاملة وتعليمات مفصلة خطوة بخطوة.

### مثال سريع

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_URL', 'YOUR_KEY');

// التسجيل
async function signUp(email: string, password: string, fullName: string) {
  const { data: authData } = await supabase.auth.signUp({
    email,
    password,
  });

  await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
  });
}

// تفعيل الترخيص
async function activateLicense(licenseKey: string, userId: string) {
  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .maybeSingle();

  if (!license) return { success: false };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + license.duration_days);

  await supabase.from('user_licenses').insert({
    user_id: userId,
    license_id: license.id,
    expires_at: expiresAt.toISOString(),
  });

  return { success: true };
}
```

## 🔒 الأمان

- ✅ Row Level Security (RLS) مفعل على جميع الجداول
- ✅ المشرفون فقط يمكنهم الوصول للوحة الإدارة
- ✅ المستخدمون يرون تراخيصهم فقط
- ✅ تغيير كلمة المرور إجباري عند أول دخول
- ✅ التحقق من الترخيص عند كل وصول
- ✅ تشفير الاتصالات عبر HTTPS
- ✅ حماية من SQL Injection

## 🎨 الواجهة

- تصميم عربي كامل (RTL)
- واجهة حديثة وجميلة باستخدام Tailwind CSS
- استجابة كاملة لجميع الشاشات
- رسائل خطأ واضحة ومفيدة
- حالات تحميل سلسة

## 📝 سير العمل

### للمشرف:
1. تسجيل الدخول بالبيانات الافتراضية
2. تغيير كلمة المرور المؤقتة
3. إنشاء تراخيص جديدة
4. مراقبة المستخدمين والتفعيلات
5. إدارة التراخيص (تفعيل/إلغاء/حذف)

### للمستخدم النهائي (في تطبيقك):
1. التسجيل بالبريد الإلكتروني والاسم
2. إدخال مفتاح الترخيص
3. تفعيل الترخيص تلقائياً
4. الوصول للتطبيق (متصل أو غير متصل)
5. تتبع حالة الترخيص وتاريخ الانتهاء

## 🧪 الاختبار

### اختبار لوحة الإدارة
1. سجل الدخول بحساب المشرف
2. أنشئ ترخيصاً جديداً
3. تحقق من ظهوره في الجدول
4. جرب تفعيل/إلغاء التفعيل
5. راجع إحصائيات اللوحة

### اختبار API
1. استخدم مفتاح ترخيص صالح
2. فعّل الترخيص لمستخدم جديد
3. تحقق من التفعيل في لوحة الإدارة
4. جرب التحقق من الترخيص

## 📚 الملفات المهمة

- `SETUP.md` - دليل الإعداد التفصيلي
- `README.md` - هذا الملف
- صفحة التوثيق داخل التطبيق - أمثلة كود كاملة

## 🆘 الدعم

للمشاكل الشائعة وحلولها، راجع قسم "استكشاف الأخطاء" في ملف `SETUP.md`.

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام في مشاريعك الشخصية والتجارية.

---

**ملاحظة**: هذا النظام مصمم لإدارة التراخيص من قبل المشرفين. للمستخدمين النهائيين، قم بدمج API في تطبيقك الخاص باتباع التوثيق المتوفر.
