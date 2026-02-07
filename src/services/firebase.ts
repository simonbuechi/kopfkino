import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDdRWhC2W1Tel4XXjEiKjnPSJnxrKMkPA8",
    authDomain: "kopfkino-f2499.firebaseapp.com",
    projectId: "kopfkino-f2499",
    storageBucket: "kopfkino-f2499.firebasestorage.app",
    messagingSenderId: "206702636188",
    appId: "1:206702636188:web:1aae1ec3d7098fd3db1159",
    measurementId: "G-H7MYJDJ05R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
