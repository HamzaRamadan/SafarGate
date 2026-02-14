// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useUserProfile } from "@/hooks/use-user-profile";
// import { updateDoc, serverTimestamp } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { initializeFirebase } from "@/firebase";

// // import { storage } from '@/lib/firebase';

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// import { Loader2, Save, User, Camera } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// export default function CarrierProfilePage() {
//   const { user, profile, isLoading, userProfileRef } = useUserProfile();
//   const { toast } = useToast();
// const { storage } = initializeFirebase();

//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     phoneNumber: "",
//   });

//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (profile) {
//       setFormData({
//         fullName: profile.fullName || "",
//         email: profile.email || "",
//         phoneNumber: profile.phoneNumber || user?.phoneNumber || "",
//       });

//       setImagePreview(profile.photoURL || null);
//     }
//   }, [profile, user]);

//   /* ========= Preview فوري ========= */
//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setSelectedFile(file);

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImagePreview(reader.result as string);
//     };
//     reader.readAsDataURL(file);
//   };

//   /* ========= حفظ ========= */
//   const handleSave = async () => {
//     if (!user || !userProfileRef) return;

//     setIsSaving(true);

//     try {
//       let photoURL = profile?.photoURL || null;

//       // if (selectedFile) {
//       //   const imageRef = ref(
//       //     storage,
//       //     `profile-images/${user.uid}/${Date.now()}-${selectedFile.name}`
//       //   );

//       //   await uploadBytes(imageRef, selectedFile);
//       //   photoURL = await getDownloadURL(imageRef);
//       // }

//       await updateDoc(userProfileRef, {
//         ...formData,
//         photoURL,
//         updatedAt: serverTimestamp(),
//       });

//       setImagePreview(photoURL);
//       setSelectedFile(null);

//       toast({ title: "تم الحفظ بنجاح" });
//     } catch (err) {
//       console.error(err);
//       toast({
//         title: "خطأ",
//         description: "فشل حفظ البيانات",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
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
//     <div className="container max-w-2xl mx-auto p-4" dir="rtl">
//       <Card>
//         <CardHeader>
//           <CardTitle>الملف الشخصي</CardTitle>
//           <CardDescription>تعديل بيانات الحساب</CardDescription>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {/* Avatar */}
//           <div className="relative w-fit mx-auto">
//             <Avatar className="h-24 w-24 border-2 border-primary overflow-hidden">
//               {imagePreview ? (
//                 <img
//                   src={imagePreview}
//                   alt="profile"
//                   className="h-full w-full object-cover"
//                 />
//               ) : (
//                 <AvatarFallback>
//                   <User className="h-10 w-10" />
//                 </AvatarFallback>
//               )}
//             </Avatar>

//             <Button
//               type="button"
//               size="icon"
//               variant="outline"
//               className="absolute bottom-0 right-0 rounded-full"
//               onClick={() => fileInputRef.current?.click()}
//             >
//               <Camera className="h-4 w-4" />
//             </Button>

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               hidden
//               onChange={handleImageChange}
//             />
//           </div>

//           {/* الاسم */}
//           <div className="space-y-2">
//             <Label>الاسم بالكامل</Label>
//             <Input
//               value={formData.fullName}
//               onChange={(e) =>
//                 setFormData({ ...formData, fullName: e.target.value })
//               }
//             />
//           </div>

//           {/* الهاتف */}
//           <div className="space-y-2">
//             <Label>رقم الهاتف</Label>
//             <Input
//               value={formData.phoneNumber}
//               onChange={(e) =>
//                 setFormData({ ...formData, phoneNumber: e.target.value })
//               }
//             />
//           </div>

//           {/* البريد */}
//           <div className="space-y-2">
//             <Label>البريد الإلكتروني</Label>
//             <Input
//               value={formData.email}
//               onChange={(e) =>
//                 setFormData({ ...formData, email: e.target.value })
//               }
//             />
//           </div>

//           <Button className="w-full" onClick={handleSave} disabled={isSaving}>
//             {isSaving ? (
//               <Loader2 className="ml-2 animate-spin" />
//             ) : (
//               <Save className="ml-2 h-4 w-4" />
//             )}
//             حفظ البيانات
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useRef } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Loader2, Save, User, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CarrierProfilePage() {
  const { user, profile, isLoading, userProfileRef } = useUserProfile();
  const { toast } = useToast();

  const { storage } = initializeFirebase();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ========= تحميل البيانات ========= */
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || user?.phoneNumber || "",
      });

      setImagePreview(profile.photoURL || null);
    }
  }, [profile, user]);

  /* ========= Preview فوري ========= */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ========= حفظ البيانات ========= */
  const handleSave = async () => {
    if (!user || !userProfileRef) return;

    setIsSaving(true);

    try {
      let photoURL = profile?.photoURL || null;

      /* ===== رفع الصورة على Firebase Storage ===== */
      if (selectedFile) {
        const imageRef = ref(
          storage,
          `profile-images/${user.uid}/${Date.now()}-${selectedFile.name}`
        );

        await uploadBytes(imageRef, selectedFile);
        photoURL = await getDownloadURL(imageRef);
      }

      /* ===== تحديث Firestore ===== */
      await updateDoc(userProfileRef, {
        ...formData,
        photoURL,
        updatedAt: serverTimestamp(),
      });

      setSelectedFile(null);
      setImagePreview(photoURL);

      toast({ title: "تم الحفظ بنجاح ✅" });
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ",
        description: "فشل حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
          <CardDescription>تعديل بيانات الحساب</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="relative w-fit mx-auto">
            <Avatar className="h-24 w-24 border-2 border-primary overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              )}
            </Avatar>

            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute bottom-0 right-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </div>

          {/* الاسم */}
          <div className="space-y-2">
            <Label>الاسم بالكامل</Label>
            <Input
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>

          {/* الهاتف */}
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
            />
          </div>

          {/* البريد */}
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="ml-2 animate-spin" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            حفظ البيانات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
