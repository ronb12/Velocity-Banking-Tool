import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Load configuration from config.js
const firebaseConfig = window.CONFIG?.firebase || {
  apiKey: "AIzaSyDrdga_hOO52nicYN3AwqqDjSbcnre6iM4",
  authDomain: "mobile-debt-tracker.firebaseapp.com",
  projectId: "mobile-debt-tracker",
  storageBucket: "mobile-debt-tracker.appspot.com",
  messagingSenderId: "153601029964",
  appId: "1:153601029964:web:ddd1880ba21bce2e9041e9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 