window.NAH_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBf4w8ctVDU3L7_YomzQLQB0ZCD1ov1IY0",
  authDomain: "neo-art-house.firebaseapp.com",
  projectId: "neo-art-house",
  storageBucket: "neo-art-house.firebasestorage.app",
  messagingSenderId: "708313349853",
  appId: "1:708313349853:web:31e909707b81ba397d6534"
};
firebase.initializeApp(window.NAH_FIREBASE_CONFIG);
window.NAH_FIREBASE = {
  auth: firebase.auth(),
  db: firebase.firestore(),
  storage: firebase.storage()
};