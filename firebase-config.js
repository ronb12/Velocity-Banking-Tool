// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrdga_hOO52nicYN3AwqqDjSbcnre6iM4",
  authDomain: "mobile-debt-tracker.firebaseapp.com",
  projectId: "mobile-debt-tracker",
  storageBucket: "mobile-debt-tracker.appspot.com",
  messagingSenderId: "153601029964",
  appId: "1:153601029964:web:ddd1880ba21bce2e9041e9"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db }; 