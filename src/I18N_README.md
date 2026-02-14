# دعم اللغات المتعددة في SafarGate
## Multilingual Support in SafarGate

تم إضافة دعم اللغتين العربية والإنجليزية للمشروع باستخدام مكتبة `next-intl`.

---

## 📦 المكتبات المطلوبة | Required Packages

يجب تثبيت المكتبة التالية:

```bash
npm install next-intl
```

---

## 📁 البنية الجديدة | New Structure

```
src/
├── app/
│   └── [locale]/           # جميع الصفحات الآن داخل [locale]
│       ├── layout.tsx
│       ├── page.tsx
│       ├── dashboard/
│       ├── carrier/
│       └── ...
├── i18n/
│   ├── routing.ts         # إعدادات الروتينج
│   └── request.ts         # إعدادات الطلبات
├── messages/
│   ├── ar.json           # الترجمات العربية
│   └── en.json           # الترجمات الإنجليزية
├── components/
│   └── language-switcher.tsx  # مبدل اللغة
└── middleware.ts         # Middleware لدعم اللغات
```

---

## 🚀 كيفية الاستخدام | How to Use

### 1. استخدام الترجمة في Component

```typescript
'use client';

import {useTranslations} from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button>{t('search')}</button>
    </div>
  );
}
```

### 2. استخدام الروابط

```typescript
import {Link} from '@/i18n/routing';

<Link href="/dashboard">{t('nav.dashboard')}</Link>
```

### 3. إضافة مبدل اللغة

```typescript
import {LanguageSwitcher} from '@/components/language-switcher';

export default function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

---

## 🌍 اللغات المتاحة | Available Languages

- **العربية (ar)** - اللغة الافتراضية
- **English (en)**

---

## 📝 إضافة ترجمات جديدة | Adding New Translations

لإضافة ترجمات جديدة، قم بتحديث ملفات الترجمة:

**ar.json:**
```json
{
  "mySection": {
    "title": "العنوان",
    "description": "الوصف"
  }
}
```

**en.json:**
```json
{
  "mySection": {
    "title": "Title",
    "description": "Description"
  }
}
```

**الاستخدام:**
```typescript
const t = useTranslations('mySection');
console.log(t('title')); // "العنوان" أو "Title"
```

---

## 🔄 كيف يعمل RTL/LTR | How RTL/LTR Works

- العربية تستخدم `dir="rtl"` تلقائياً
- الإنجليزية تستخدم `dir="ltr"` تلقائياً
- يتم ضبط اتجاه النص في الـ `layout.tsx`

---

## 🛠️ الأوامر | Commands

```bash
# تثبيت المكتبات
npm install

# تشغيل المشروع
npm run dev

# بناء المشروع
npm run build
```

---

## 📱 الروابط | URLs

- **العربية (افتراضي):** `https://yoursite.com/`
- **الإنجليزية:** `https://yoursite.com/en`

---

## ✨ الميزات | Features

✅ دعم اللغة العربية والإنجليزية
✅ RTL/LTR تلقائي
✅ روابط محلية (Localized Links)
✅ SEO محسّن
✅ مبدل لغة سهل الاستخدام
✅ ترجمات منظمة في JSON

---

## 🎯 ملاحظات مهمة | Important Notes

1. جميع الصفحات الآن يجب أن تكون داخل `app/[locale]/`
2. استخدم `import {Link} from '@/i18n/routing'` بدلاً من `next/link`
3. استخدم `useTranslations` للحصول على الترجمات
4. اللغة الافتراضية هي العربية
5. يمكن تغيير اللغة الافتراضية من `src/i18n/routing.ts`

---

## 📞 الدعم | Support

للمزيد من المعلومات، راجع:
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

---

**تم التطوير بواسطة | Developed by:** Claude AI 🤖
**التاريخ | Date:** 2026
