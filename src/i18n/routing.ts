import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // قائمة اللغات المدعومة
  locales: ['ar', 'en'],
  
  // اللغة الافتراضية (العربي)
  defaultLocale: 'ar',
  
  // إضافة prefix للغة فقط إذا لم تكن اللغة الافتراضية
  localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);