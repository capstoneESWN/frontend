// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAh6u5bxFzwLK2gPAlOp9XNTlwJprzpjnQ",
    authDomain: "capsulton.firebaseapp.com",
    projectId: "capsulton",
    storageBucket: "capsulton.firebasestorage.app",
    messagingSenderId: "992379674943",
    appId: "1:992379674943:web:e35b8b916fe20327caf38a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 