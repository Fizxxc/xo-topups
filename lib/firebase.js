import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyCTra71Vq4b0nPZ8hdfgY_Sxxr-REk9-9E",
  authDomain: "topup-2c5db.firebaseapp.com",
  projectId: "topup-2c5db",
  storageBucket: "topup-2c5db.firebasestorage.app",
  messagingSenderId: "384342388781",
  appId: "1:384342388781:web:230ec4dc05ede15d7588a4",
  measurementId: "G-QJY9J2Y6QZ"
};




const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
