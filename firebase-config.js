const firebaseConfig = {
  apiKey: "AIzaSyB5VL_gm2SNvhlxvOFk0zsMc4weD2ji9RY",
  authDomain: "bp-mobiles-hub-dgl.firebaseapp.com",
  projectId: "bp-mobiles-hub-dgl",
  storageBucket: "bp-mobiles-hub-dgl.firebasestorage.app",
  messagingSenderId: "94584402681",
  appId: "1:94584402681:web:cdfad566c87ecc3eb4e828"
};

// Everything below this line — no need to touch.
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();
