
// // // export const firebaseConfig = {
// // //   "projectId": "studio-9145223887-757dc",
// // //   "appId": "1:154400695338:web:04e371c9f1946cac490f53",
// // //   "apiKey": "AIzaSyDPonZuJ2vcfl4jsrtwkpnb6mJWq0b5DFg",
// // //   "authDomain": "studio-9145223887-757dc.firebaseapp.com",
// // //   "storageBucket": "studio-9145223887-757dc.appspot.com",
// // //   "messagingSenderId": "154400695338"
// // // };


// // export const firebaseConfig = {
// //   apiKey: "AIzaSyBIMZB7AnNS9a57m-tLaMhEORN1qxU3IUY",
// //   authDomain: "safargate-7f794.firebaseapp.com",
// //   projectId: "safargate-7f794",
// //   storageBucket: "safargate-7f794.firebasestorage.app",
// //   messagingSenderId: "984519891951",
// //   appId: "1:984519891951:web:16f0e8b7bc3959bee0f41a",
// //   measurementId: "G-V5C52T6SZN",
// // };

// // // Action code settings for email verification link
// // export const actionCodeSettings = {
// //   // URL to redirect back to. The domain must be whitelisted in the Firebase Console.
// //   // After verification, the user will be redirected to the history page.
// //   url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002'}/history`,
// //   // This must be true.
// //   handleCodeInApp: true,
// // };


// // firebaseConfig.ts
// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// export const firebaseConfig = {
//   apiKey: "AIzaSyBIMZB7AnNS9a57m-tLaMhEORN1qxU3IUY", 
//   authDomain: "safargate-7f794.firebaseapp.com",
//   projectId: "safargate-7f794",
//   storageBucket: "safargate-7f794.appspot.com",
//   messagingSenderId: "1234567890",
//   appId: "1:1234567890:web:abcdef123456"
// };

// export const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);


import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDPonZuJ2vcfl4jsrtwkpnb6mJWq0b5DFg",
  authDomain: "studio-9145223887-757dc.firebaseapp.com",
  projectId: "studio-9145223887-757dc",
  storageBucket: "studio-9145223887-757dc.appspot.com",
  messagingSenderId: "154400695338",
  appId: "1:154400695338:web:04e371c9f1946cac490f53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
