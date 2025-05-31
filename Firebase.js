import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBDCJZmII8QfUnqqjwPbUB2ssAGu7SrMdo",
  authDomain: "track-it-fin.firebaseapp.com",
  projectId: "track-it-fin",
  storageBucket: "track-it-fin.appspot.com",
  messagingSenderId: "262821642188",
  appId: "1:262821642188:web:5f7c28d54cea6fc25d6769",
  measurementId: "G-KJTBRLNT7Y"
};

const app = initializeApp(firebaseConfig);

// ✅ تفعيل الحفظ التلقائي للحالة
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
