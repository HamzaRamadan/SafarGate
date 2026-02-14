'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPinned, ArrowLeft, Bus, Shield } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function LandingScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const bgImage = PlaceHolderImages.find((img) => img.id === 'login-background');
  
  const router = useRouter();
  const auth = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogoClick = () => {
    setShowAdminModal(true);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        setError(t('errors.unauthorized'));
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAdminModal(false);
      router.push(`/${locale}/admin`); 
    } catch (err) {
      setError(t('errors.loginFailed'));
    }
  };

  return (
    <>
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        
       

        {bgImage && (
          <Image
            src={bgImage.imageUrl}
            alt="Safar Gate Background"
            fill
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-90"
            priority
          />
        )}
        <div className="absolute inset-0 -z-10 bg-black/60 backdrop-blur-[2px]" />

        <div className="w-full max-w-5xl z-10 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="text-center space-y-4 mb-4">
              <div onClick={handleLogoClick} className="flex justify-center">
                  <div className="cursor-pointer hover:scale-110 transition-transform duration-300">
                    <Logo />
                  </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                {t('common.appName')}
              </h1>
              <p className="text-lg text-gray-200 max-w-lg mx-auto leading-relaxed">
                {t('common.welcome')}
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-2 px-4">
            
            <Card className="group relative overflow-hidden border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-2xl hover:shadow-primary/20 hover:border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white text-2xl">
                  <MapPinned className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  {t('traveler.title')}
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  {t('traveler.searchTrips')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login?role=traveler" className="absolute inset-0 z-20">
                  <span className="sr-only">{t('nav.login')}</span>
                </Link>
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-12 group-hover:translate-x-1 transition-transform">
                  {t('traveler.bookNow')} <ArrowLeft className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-2xl hover:shadow-amber-500/20 hover:border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white text-2xl">
                  <Bus className="h-8 w-8 text-amber-500 group-hover:scale-110 transition-transform" />
                  {t('carrier.title')}
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  {t('carrier.addTrip')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login?role=carrier" className="absolute inset-0 z-20">
                   <span className="sr-only">{t('nav.login')}</span>
                </Link>
                <Button variant="outline" className="w-full gap-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white text-lg h-12 group-hover:translate-x-1 transition-transform bg-transparent">
                  {t('carrier.myTrips')} <ArrowLeft className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

          </div>
          
          <div className="text-xs text-gray-500 mt-8 font-mono">
            © 2026 {t('common.appName')}
          </div>

        </div>
      </div>
      
      {/* نافذة البوابة السرية */}
      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent className="sm:max-w-md bg-card border-primary">
          <form onSubmit={handleAdminLogin}>
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary"/> 
                    {t('admin.login')}
                  </DialogTitle>
                  <DialogDescription>
                      {t('admin.title')}
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <div className="space-y-2">
                      <Label htmlFor="email-secret" className="text-right">
                          {t('auth.email')}
                      </Label>
                      <Input
                          id="email-secret"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          dir="ltr"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="password-secret" className="text-right">
                          {t('auth.password')}
                      </Label>
                      <Input
                          id="password-secret"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          dir="ltr"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setShowAdminModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{t('nav.login')}</Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}