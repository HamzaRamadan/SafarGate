'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { deleteUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Trash2, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useTranslations } from 'next-intl'; // ✅
import { useLocale } from 'next-intl';

const profileFormSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
const t = useTranslations('Profile'); 
const locale = useLocale();
const isRTL = locale === 'ar';

  
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { profile } = useUserProfile();

  const userProfileRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || user?.email || '',
        phoneNumber: profile.phoneNumber || user?.phoneNumber || '',
      });
    } else if (user) {
      form.reset({
        ...form.getValues(),
        email: user.email || '',
        phoneNumber: user?.phoneNumber || '',
      });
    }
  }, [profile, user, form]);

  function onUserSubmit(data: ProfileFormValues) {
    if (!userProfileRef) return;
    updateDoc(userProfileRef, data);
    toast({ title: t('profileUpdated.title'), description: t('profileUpdated.description') });
  }

  const handleDeleteAccount = async () => {
    if (!user || !auth || !firestore) {
      toast({ variant: 'destructive', title: t('deleteError.title'), description: t('deleteError.description') });
      setIsDeleteConfirmOpen(false);
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await deleteDoc(userDocRef);
      await deleteUser(user);
      toast({ title: t('deleteSuccess.title'), description: t('deleteSuccess.description') });
      router.push('/signup');
    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: t('deleteRequiresRecentLogin.title'),
          description: t('deleteRequiresRecentLogin.description')
        });
        router.push('/login');
      } else {
        toast({
          variant: 'destructive',
          title: t('deleteFailed.title'),
          description: t('deleteFailed.description')
        });
      }
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      <AppLayout>
        <div className={`max-w-4xl mx-auto space-y-8 w-full`} dir={isRTL ? 'rtl' : 'ltr'}>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUserSubmit)} className="space-y-8">
              
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">{t('identitySettings')}</CardTitle>
                  <CardDescription>{t('identitySettingsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6 rtl:space-x-reverse">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                      <AvatarFallback>{profile?.firstName ? profile.firstName.charAt(0) : user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" type="button" onClick={() => toast({ title: t('comingSoon.title'), description: t('comingSoon.desc') })}>
                      <Upload className="ml-2 h-4 w-4" /> {t('changePhoto')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>{t('firstName')}</FormLabel><FormControl><Input placeholder={t('firstNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>{t('lastName')}</FormLabel><FormControl><Input placeholder={t('lastNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>{t('email')}</FormLabel><FormControl><Input type="email" placeholder={t('emailPlaceholder')} {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (<FormItem><FormLabel>{t('phoneNumber')}</FormLabel><FormControl><Input type="tel" placeholder={t('phoneNumberPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit">{t('saveChanges')}</Button>
              </div>
            </form>
          </Form>

          <Card className="border-destructive shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert /> {t('dangerZone')}</CardTitle>
              <CardDescription>{t('dangerZoneDesc')}</CardDescription>
            </CardHeader>
            <CardContent><p>{t('dangerZoneWarning')}</p></CardContent>
            <CardFooter>
                <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)}>
                    <Trash2 className="ml-2 h-4 w-4" />
                    {t('deleteAccount')}
                </Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500" /> {t('confirmDeleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('confirmDeleteAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}






// 'use client';
// import { useForm } from 'react-hook-form';
// import { z } from 'zod';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { AppLayout } from '@/components/app-layout';
// import { Button } from '@/components/ui/button';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { useToast } from '@/hooks/use-toast';
// import { useUser, useFirestore, useAuth } from '@/firebase';
// import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
// import { useEffect, useState, useMemo, useRef } from 'react';
// import { deleteUser } from 'firebase/auth';
// import { useRouter } from 'next/navigation';
// import { ShieldAlert, Trash2, Camera, Loader2, User } from 'lucide-react';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
// import { useUserProfile } from '@/hooks/use-user-profile';
// import { useTranslations } from 'next-intl';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// const profileFormSchema = z.object({
//   fullName: z.string().min(2),
//   email: z.string().email(),
//   phoneNumber: z.string().optional(),
// });

// type ProfileFormValues = z.infer<typeof profileFormSchema>;

// export default function ProfilePage() {
//   const t = useTranslations('Profile');
//   const isRTL = true; // لو عربي

//   const { toast } = useToast();
//   const { user } = useUser();
//   const firestore = useFirestore();
//   const auth = useAuth();
//   const router = useRouter();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const storage = getStorage();

//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

//   const { profile, userProfileRef, isLoading } = useUserProfile();

//   const userProfileDocRef = useMemo(() => {
//     if (!firestore || !user) return null;
//     return doc(firestore, 'users', user.uid);
//   }, [firestore, user]);

//   const form = useForm<ProfileFormValues>({
//     resolver: zodResolver(profileFormSchema),
//     defaultValues: {
//       fullName: '',
//       email: '',
//       phoneNumber: '',
//     },
//   });

//   useEffect(() => {
//     if (profile) {
//       form.reset({
//         fullName: profile.fullName || '',
//         email: profile.email || user?.email || '',
//         phoneNumber: profile.phoneNumber || user?.phoneNumber || '',
//       });
//       setImagePreview(profile.photoURL || null);
//     } else if (user) {
//       form.reset({
//         ...form.getValues(),
//         email: user.email || '',
//         phoneNumber: user?.phoneNumber || '',
//       });
//       setImagePreview(user.photoURL || null);
//     }
//   }, [profile, user, form]);

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setSelectedFile(file);

//     const reader = new FileReader();
//     reader.onloadend = () => setImagePreview(reader.result as string);
//     reader.readAsDataURL(file);
//   };

//   const onUserSubmit = async (data: ProfileFormValues) => {
//     if (!user || !userProfileRef) return;
//     setIsSaving(true);

//     try {
//       let photoURL = profile?.photoURL || null;

//       if (selectedFile) {
//         const imageRef = ref(storage, `profile-images/${user.uid}/${Date.now()}-${selectedFile.name}`);
//         await uploadBytes(imageRef, selectedFile);
//         photoURL = await getDownloadURL(imageRef);
//       }

//       await updateDoc(userProfileRef, {
//         fullName: data.fullName,
//         phoneNumber: data.phoneNumber,
//         photoURL,
//       });

//       setImagePreview(photoURL);
//       setSelectedFile(null);
//       toast({ title: t('profileUpdated.title'), description: t('profileUpdated.description') });
//     } catch (err) {
//       console.error(err);
//       toast({ title: t('saveError.title'), description: t('saveError.description'), variant: 'destructive' });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleDeleteAccount = async () => {
//     if (!user || !auth || !firestore) {
//       toast({ variant: 'destructive', title: t('deleteError.title'), description: t('deleteError.description') });
//       setIsDeleteConfirmOpen(false);
//       return;
//     }

//     const userDocRef = doc(firestore, 'users', user.uid);

//     try {
//       await deleteDoc(userDocRef);
//       await deleteUser(user);
//       toast({ title: t('deleteSuccess.title'), description: t('deleteSuccess.description') });
//       router.push('/signup');
//     } catch (error: any) {
//       console.error(error);
//       if (error.code === 'auth/requires-recent-login') {
//         toast({ variant: 'destructive', title: t('deleteRequiresRecentLogin.title'), description: t('deleteRequiresRecentLogin.description') });
//         router.push('/login');
//       } else {
//         toast({ variant: 'destructive', title: t('deleteFailed.title'), description: t('deleteFailed.description') });
//       }
//     } finally {
//       setIsDeleteConfirmOpen(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center p-10">
//         <Loader2 className="animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <>
//       <AppLayout>
//         <div className={`container max-w-2xl mx-auto p-4 space-y-8`} dir={isRTL ? 'rtl' : 'ltr'}>
          
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onUserSubmit)} className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>{t('identitySettings')}</CardTitle>
//                   <CardDescription>{t('identitySettingsDesc')}</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {/* Avatar */}
//                   <div className="relative w-fit mx-auto">
//                     <Avatar className="h-24 w-24 border-2 border-primary overflow-hidden">
//                       {imagePreview ? <img src={imagePreview} className="h-full w-full object-cover" /> : <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>}
//                     </Avatar>

//                     <Button
//                       type="button"
//                       size="icon"
//                       variant="outline"
//                       className="absolute bottom-0 right-0 rounded-full"
//                       onClick={() => fileInputRef.current?.click()}
//                     >
//                       <Camera className="h-4 w-4" />
//                     </Button>

//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       accept="image/*"
//                       hidden
//                       onChange={handleImageChange}
//                     />
//                   </div>

//                   {/* Full Name */}
//                   <FormField
//                     control={form.control}
//                     name="fullName"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>{t('fullName')}</FormLabel>
//                         <FormControl><Input placeholder={t('fullNamePlaceholder')} {...field} /></FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   {/* Phone */}
//                   <FormField
//                     control={form.control}
//                     name="phoneNumber"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>{t('phoneNumber')}</FormLabel>
//                         <FormControl><Input type="tel" placeholder={t('phoneNumberPlaceholder')} {...field} /></FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   {/* Email */}
//                   <FormField
//                     control={form.control}
//                     name="email"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>{t('email')}</FormLabel>
//                         <FormControl><Input type="email" placeholder={t('emailPlaceholder')} {...field} disabled /></FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <div className="flex justify-end">
//                     <Button type="submit" disabled={isSaving}>
//                       {isSaving ? <Loader2 className="ml-2 animate-spin h-4 w-4" /> : t('saveChanges')}
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             </form>
//           </Form>

//           {/* Danger Zone */}
//           <Card className="border-destructive shadow-lg">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert /> {t('dangerZone')}</CardTitle>
//               <CardDescription>{t('dangerZoneDesc')}</CardDescription>
//             </CardHeader>
//             <CardContent><p>{t('dangerZoneWarning')}</p></CardContent>
//             <CardFooter>
//               <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)}>
//                 <Trash2 className="ml-2 h-4 w-4" />
//                 {t('deleteAccount')}
//               </Button>
//             </CardFooter>
//           </Card>
//         </div>
//       </AppLayout>

//       <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
//         <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
//           <AlertDialogHeader>
//             <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-red-500" /> {t('confirmDeleteTitle')}</AlertDialogTitle>
//             <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
//             <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('confirmDeleteAction')}</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// }
