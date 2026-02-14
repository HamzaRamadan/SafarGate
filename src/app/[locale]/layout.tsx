import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import './globals.css';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import AppProviders from '@/components/layout/app-providers';
import { LanguageSwitcher } from '@/components/language-switcher';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Import messages directly
  const messages = (await import(`@/messages/${locale}.json`)).default;
  
  const logoImage = PlaceHolderImages.find((img) => img.id === 'safar-logo');
  const isRTL = locale === 'ar';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} className="dark" suppressHydrationWarning>
      <head>
        <title>Safar Gate - بوابة سفر</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="description" content="Smart Travel Brokerage - وساطة سفر ذكية" />
        <meta name="theme-color" content="#10b981" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        {logoImage && <link rel="apple-touch-icon" href={logoImage.imageUrl} />}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SafarGate" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppProviders>
             {/* زرار تغيير اللغة في كل الصفحات */}
            <LanguageSwitcher />

            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}