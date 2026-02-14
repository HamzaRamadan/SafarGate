// [SC-023] Security Fix: Removed hardcoded key dependency
require('dotenv').config({ path: '.env.local' }); // Load env vars
const admin = require('firebase-admin');

// التحقق من وجود المفتاح في البيئة
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FATAL ERROR: FIREBASE_SERVICE_ACCOUNT is missing from .env.local');
  console.error('   Please add the JSON content as a string to your environment variables.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

console.log('🔒 Security Check: Initialized with Environment Variables.');

const db = admin.firestore();
const auth = admin.auth();

const targetEmail = process.argv[2]; 
const TEMP_PASSWORD = "Safar2026"; // كلمة المرور الافتراضية

if (!targetEmail) {
    console.error("❌ خطأ: يجب كتابة البريد الإلكتروني!");
    process.exit(1);
}

async function ensureUserExists(email) {
  try {
    // محاولة العثور على المستخدم
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`⚠️ المستخدم غير موجود. جاري إنشاء حساب جديد لـ ${email}...`);
      // إنشاء المستخدم إذا لم يكن موجوداً
      return await auth.createUser({
        email: email,
        password: TEMP_PASSWORD,
        displayName: "Admin Owner",
        emailVerified: true
      });
    }
    throw error;
  }
}

async function promoteToOwner() {
  try {
    console.log(`🔍 جاري معالجة الحساب: ${targetEmail}...`);
    
    // 1. التأكد من وجود الحساب (أو إنشاؤه)
    const user = await ensureUserExists(targetEmail);
    console.log(`✅ تم تأكيد الحساب (UID: ${user.uid})`);

    // 2. الترقية في قاعدة البيانات
    await db.collection('users').doc(user.uid).set({
      role: 'owner',
      isAdmin: true,
      email: targetEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`\n🎉🎉 تم بنجاح!`);
    console.log(`🛡️ الحساب: ${targetEmail}`);
    console.log(`🔑 كلمة المرور (إذا تم إنشاؤه للتو): ${TEMP_PASSWORD}`);
    console.log(`👑 الرتبة الحالية: مالك (Owner)`);

  } catch (error) {
    console.error('❌ حدث خطأ:', error.message);
  }
}

promoteToOwner();
