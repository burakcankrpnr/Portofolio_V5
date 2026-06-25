// NOTE: Firebase client config is public by design (API keys are exposed in client-side apps).
// Firestore Security Rules MUST be configured in Firebase Console to restrict access.
// Do NOT put sensitive data or secrets in client-side Firebase config.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { collection, addDoc, getDocs } from "@firebase/firestore";


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-lfUt1adpQ0KYcFFW_oAWTJVfHDOOZy8",
  authDomain: "portofolio-web-3e8e8.firebaseapp.com",
  projectId: "portofolio-web-3e8e8",
  storageBucket: "portofolio-web-3e8e8.appspot.com",
  messagingSenderId: "25195509306",
  appId: "1:25195509306:web:2b635dcf997137bf612703"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc };