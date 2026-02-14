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


const targetEmail = process.argv[2];

async function setAdminClaims() {
  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    
    // هذا هو الأمر الذي يضع الختم على الهوية
    await admin.auth().setCustomUserClaims(user.uid, { 
      role: 'owner', 
      isAdmin: true 
    });

    console.log(`✅ تم تثبيت "الختم الملكي" (Custom Claims) بنجاح!`);
    console.log(`🆔 الحساب: ${targetEmail}`);
    console.log(`⚠️  هام جداً: يجب عليك تسجيل الخروج والدخول مرة أخرى لتفعيل الختم.`);

  } catch (error) {
    console.error('❌ حدث خطأ:', error.message);
  }
}

setAdminClaims();
