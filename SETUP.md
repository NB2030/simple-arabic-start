# 🚀 دليل الإعداد السريع - خدمة التراخيص

## ✨ نظرة عامة

هذا نظام تراخيص مستقل بالكامل يعمل كـ **SaaS (Software as a Service)** - خدمة سحابية جاهزة للاستخدام!

**لا تحتاج لربط أي شيء بمشروعك** - فقط استخدم الـ API!

---

## 🔑 المعلومات الأساسية

### كود الوصول للمشرف
```
ADMIN-2024-VEX-SECURE
```
استخدم هذا الكود لإنشاء حساب مشرف والوصول للوحة الإدارة.

### API Base URL
```
https://iwipefxjymkqpsuxkupo.supabase.co/functions/v1/license-service-api
```

---

## 📝 خطوات الإعداد (للمشرفين)

### 1. الوصول للوحة الإدارة

1. افتح التطبيق في المتصفح
2. اضغط "إنشاء حساب جديد"
3. أدخل:
   - الاسم الكامل
   - البريد الإلكتروني
   - كلمة المرور
   - **كود الوصول:** `ADMIN-2024-VEX-SECURE`
4. ستدخل مباشرة للوحة الإدارة

### 2. إنشاء أول ترخيص

1. من لوحة الإدارة، اضغط "إنشاء ترخيص جديد"
2. حدد:
   - **المدة:** عدد الأيام (مثلاً: 30)
   - **عدد التفعيلات:** كم مستخدم يمكنه استخدام هذا الترخيص (مثلاً: 1)
   - **ملاحظات:** (اختياري)
3. اضغط "إنشاء"
4. **انسخ مفتاح الترخيص** - ستحتاجه لاحقاً

### 3. إدارة التراخيص

من لوحة الإدارة يمكنك:
- ✅ عرض جميع التراخيص
- ✅ مراقبة المستخدمين النشطين
- ✅ تفعيل/إلغاء تفعيل التراخيص
- ✅ حذف التراخيص
- ✅ عرض الإحصائيات

---

## 💻 الاستخدام في مشاريعك

### الطريقة الصحيحة ✅

**لا تقم بنسخ الكود أو ربط Supabase!**

بدلاً من ذلك، استخدم الـ API مباشرة:

```javascript
const API_BASE = 'https://iwipefxjymkqpsuxkupo.supabase.co/functions/v1/license-service-api';

// 1. تسجيل المستخدم
const register = async (email, password, fullName) => {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName })
  });
  return await res.json();
};

// 2. تفعيل الترخيص
const activateLicense = async (licenseKey, token) => {
  const res = await fetch(`${API_BASE}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey, token })
  });
  return await res.json();
};

// 3. التحقق من الترخيص
const validateLicense = async (token) => {
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return await res.json();
};
```

### مثال كامل في React

```jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://iwipefxjymkqpsuxkupo.supabase.co/functions/v1/license-service-api';

function App() {
  const [hasLicense, setHasLicense] = useState(false);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    const res = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await res.json();
    setHasLicense(data.isValid);
  };

  if (!hasLicense) {
    return <div>الرجاء تفعيل الترخيص</div>;
  }

  return <div>التطبيق الخاص بك هنا</div>;
}
```

---

## 📚 التوثيق الكامل

للتوثيق الكامل مع جميع الأمثلة، راجع:
- **`API_DOCUMENTATION.md`** - توثيق الـ API الشامل
- **صفحة التوثيق داخل التطبيق** - أمثلة كود جاهزة للنسخ

---

## 🔧 API Endpoints

### 1. التسجيل
```
POST /license-service-api/register
Body: { email, password, fullName }
```

### 2. تسجيل الدخول
```
POST /license-service-api/login
Body: { email, password }
```

### 3. تفعيل الترخيص
```
POST /license-service-api/activate
Body: { licenseKey, token }
```

### 4. التحقق من الترخيص
```
POST /license-service-api/validate
Body: { token }
```

### 5. معلومات الخدمة
```
GET /license-service-api/info
```

---

## 🎯 سير العمل

### للمشرفين:
1. سجل حساب جديد مع كود الوصول
2. أنشئ التراخيص من لوحة الإدارة
3. أعط مفاتيح التراخيص لمستخدميك
4. راقب الاستخدام والتفعيلات

### للمستخدمين (في تطبيقك):
1. المستخدم يسجل حساب عبر الـ API
2. يدخل مفتاح الترخيص
3. يُفعل الترخيص عبر الـ API
4. يحصل على وصول للتطبيق
5. يعمل حتى بدون إنترنت (بعد التفعيل)

---

## 💡 مميزات رئيسية

### ✅ لا حاجة لإعدادات معقدة
- لا تحتاج Supabase في مشروعك
- لا تحتاج قاعدة بيانات
- فقط استدعاءات API بسيطة

### ✅ يعمل مع أي تقنية
- React, Vue, Angular
- Python, PHP, Java
- Mobile Apps (React Native, Flutter)
- أي شيء يمكنه عمل HTTP requests

### ✅ دعم الوصول غير المتصل
- بعد التفعيل الأول، يعمل بدون إنترنت
- التحقق يتم من الكاش المحلي
- مزامنة تلقائية عند الاتصال

### ✅ آمن تماماً
- Row Level Security على قاعدة البيانات
- التوكنات مشفرة
- الـ API محمي بالكامل

---

## 🆘 استكشاف الأخطاء

### لا يمكنني الدخول للوحة الإدارة
- تأكد من إدخال كود الوصول الصحيح: `ADMIN-2024-VEX-SECURE`
- تأكد من ملء جميع الحقول
- جرب إنشاء حساب جديد إذا كنت تسجل دخول

### الترخيص لا يعمل
- تأكد من أن الترخيص نشط من لوحة الإدارة
- تأكد من عدم تجاوز عدد التفعيلات المسموح
- تحقق من تاريخ انتهاء الترخيص

### API لا يستجيب
- تأكد من استخدام الـ Base URL الصحيح
- تأكد من إرسال البيانات بصيغة JSON
- تحقق من التوكن المستخدم

---

## 📞 للمزيد من المساعدة

راجع:
- `API_DOCUMENTATION.md` - توثيق شامل للـ API
- `README.md` - نظرة عامة على المشروع
- صفحة التوثيق داخل التطبيق - أمثلة تفاعلية

---

## 🎉 ابدأ الآن!

1. افتح التطبيق
2. أنشئ حساب مشرف بكود الوصول
3. أنشئ ترخيصاً جديداً
4. استخدم الـ API في مشروعك

**هذا كل شيء! بسيط جداً** 🚀
