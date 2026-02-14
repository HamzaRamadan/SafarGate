# خطوات التثبيت والتشغيل
# Installation & Setup Instructions

## 1️⃣ تثبيت المكتبة المطلوبة | Install Required Package

```bash
npm install next-intl
```

## 2️⃣ تحديث next.config.mjs | Update next.config.mjs

أضف هذا الكود في بداية ملف `next.config.mjs`:

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
```

ثم غلّف الـ config:

```javascript
export default withNextIntl(nextConfig);
```

**مثال كامل:**

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // باقي إعداداتك هنا
};

export default withNextIntl(nextConfig);
```

## 3️⃣ تشغيل المشروع | Run the Project

```bash
npm run dev
```

## 4️⃣ فتح المتصفح | Open Browser

- العربية: http://localhost:3000
- الإنجليزية: http://localhost:3000/en

---

## ✅ تم إضافة الملفات التالية | Added Files

```
src/
├── i18n/
│   ├── routing.ts          ✅ إعدادات الروتينج
│   └── request.ts          ✅ إعدادات الطلبات
├── messages/
│   ├── ar.json            ✅ الترجمات العربية
│   └── en.json            ✅ الترجمات الإنجليزية
├── components/
│   └── language-switcher.tsx  ✅ مبدل اللغة
├── middleware.ts          ✅ Middleware للغات
└── app/
    └── [locale]/         ✅ جميع الصفحات الآن هنا
        └── layout.tsx    ✅ Layout محدث
```

---

## 🎨 استخدام مبدل اللغة | Using Language Switcher

أضف هذا الكود في أي component (مثلاً في الـ Header):

```typescript
import {LanguageSwitcher} from '@/components/language-switcher';

export default function Header() {
  return (
    <header>
      {/* باقي محتوى الـ Header */}
      <LanguageSwitcher />
    </header>
  );
}
```

---

## 📝 مثال استخدام الترجمة | Translation Example

```typescript
'use client';

import {useTranslations} from 'next-intl';

export default function WelcomePage() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('appName')}</p>
      <button>{t('search')}</button>
    </div>
  );
}
```

---

## 🚨 مهم جداً | Very Important

1. ⚠️ لا تنسى تحديث `next.config.mjs` كما موضح أعلاه
2. ⚠️ شغّل `npm install next-intl` قبل التشغيل
3. ⚠️ كل الصفحات الآن في `app/[locale]/`

---

**جاهز للتشغيل! 🚀 | Ready to Run! 🚀**
