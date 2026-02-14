'use client';
import { 
  type Firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  doc, 
  setDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { 
  type Auth, 
  signInAnonymously, 
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/data';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

/**
 * 1. الرادار (Check Only)
 * وظيفتها: استطلاع فقط. لا تنشئ حساباً، لا تحجز UID، لا تلمس Auth.
 * النتيجة: صفر تكديس.
 */
export async function checkUserExistence(db: Firestore, phone: string) {
  // Bypass for test traveler
  if (phone === '0790000000') {
    return {
      exists: true,
      data: {
        firstName: "مسافر تجريبي",
        lastName: "مؤقت",
        role: "traveler",
        id: "test-traveler-id-001"
      }
    };
  }
  try {
    const q = query(collection(db, 'users'), where('phoneNumber', '==', phone), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return { exists: true, data: snapshot.docs[0].data() };
    }
    return { exists: false, data: null };
  } catch (error) {
    console.error("Check Error:", error);
    // في حالة الخطأ نعتبره غير موجود مؤقتاً لتجنب الإغلاق
    return { exists: false, data: null };
  }
}

/**
 * 2. التسجيل الفعلي (Execution)
 * وظيفتها: تُستدعى حصراً للمستخدم الجديد بعد أن يكتب اسمه.
 */
export async function registerNewUser(db: Firestore, auth: Auth, phone: string, name: string, role: string) {
  try {
    // SC-113: Operation Stop the Bleeding (The Fix)
    // Check if we already have a session, otherwise create one.
    let user = auth.currentUser;
    if (!user) {
      const result = await signInAnonymously(auth);
      user = result.user;
    }

    // Guard against a failed session creation.
    if (!user) {
        throw new Error("Authentication failed: Could not get or create a user session.");
    }
    
    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      phoneNumber: phone,
      firstName: name,
      role: role,
      createdAt: serverTimestamp(),
      isPartial: true,
      status: 'active'
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error };
  }
}


// [SC-145] Inject: Email & Password Logic (Unified Gateway)
type UserProfileCreation = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;

export async function initiateEmailSignUp(
    auth: Auth, 
    firestore: Firestore,
    email: string, 
    password: string,
    profileData: UserProfileCreation
): Promise<UserCredential | null> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user) {
             console.error('[Signup Error] User credential created but user is null');
             toast({
                variant: "destructive",
                title: "فشل إنشاء الحساب",
                description: "لم يتم إرجاع بيانات المستخدم بعد الإنشاء.",
            });
            return null;
        }
        
        const userRef = doc(firestore, 'users', user.uid);
        
        const finalProfileData = { 
            ...profileData,
            role: profileData.role || 'traveler',
            createdAt: serverTimestamp(), 
            updatedAt: serverTimestamp() 
        };
        
        await setDoc(userRef, finalProfileData);
        
        return userCredential;

    } catch (error: any) {
        console.error('[Signup Error]', error);
        
        let description = "حدث خطأ غير متوقع أثناء إنشاء الحساب.";
        if (error.code === 'auth/email-already-in-use') {
            description = "هذا البريد الإلكتروني مسجل بالفعل. الرجاء تسجيل الدخول بدلاً من ذلك.";
        } else if (error.code === 'auth/weak-password') {
            description = "كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.";
        }
        
        toast({
            variant: "destructive",
            title: "فشل إنشاء الحساب",
            description: description,
        });
        return null;
    }
}


export async function signInWithEmail(auth: Auth, firestore: Firestore, email: string, password: string): Promise<UserCredential | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    // Auto-create owner account if it doesn't exist
    if (error.code === 'auth/user-not-found') {
        toast({ title: "المستخدم غير موجود", description: "جاري إنشاء حساب مالك جديد..." });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const [firstName] = email.split('@');

            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                firstName: firstName,
                lastName: 'Owner',
                email: email,
                role: 'owner', // Set role to owner
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            
            toast({ title: "تم إنشاء حساب المالك بنجاح", description: "جاري تسجيل الدخول..." });
            return userCredential;

        } catch (creationError: any) {
             toast({
                variant: "destructive",
                title: "فشل إنشاء الحساب",
                description: creationError.message,
            });
            return null;
        }
    }

    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
         toast({
            variant: "destructive",
            title: "فشل تسجيل الدخول",
            description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "فشل تسجيل الدخول",
            description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        });
    }
    return null;
  }
}

export async function initiateGoogleSignIn(auth: Auth, firestore: Firestore): Promise<boolean> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
      const newUserProfile: UserProfileCreation = {
        firstName: firstName || '',
        lastName: lastNameParts.join(' '),
        email: user.email!,
        phoneNumber: user.phoneNumber || '',
        role: 'traveler' // Default role for new Google sign-ups
        ,
        fullName: ''
      };
      await setDoc(userRef, { ...newUserProfile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    
    return true;
  } catch (error: any) {
    if (error.code === 'auth/operation-not-allowed') {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'Google Sign-In is not enabled. Please check Firebase settings.',
        });
    } else {
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Failed',
          description: error.message || 'An unexpected error occurred. Please try again.',
        });
    }
    return false;
  }
}

export async function performSignOut(auth: Auth) {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
