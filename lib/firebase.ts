import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBN2a3Cht8Yi2sGKB_42TWfDtn5ow9rJh8",
  authDomain: "kas-rt-4928a.firebaseapp.com",
  projectId: "kas-rt-4928a",
  storageBucket: "kas-rt-4928a.firebasestorage.app",
  messagingSenderId: "788451630434",
  appId: "1:788451630434:web:3eba60654f697d6f44603b",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);