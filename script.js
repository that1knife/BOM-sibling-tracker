import { getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCYN4w0tFj6aE-FJXYaCgm3KD7uvXbCHVc",
  authDomain: "bom-sibling-tracker-50515.firebaseapp.com",
  projectId: "bom-sibling-tracker-50515",
  storageBucket: "bom-sibling-tracker-50515.firebasestorage.app",
  messagingSenderId: "352637559910",
  appId: "1:352637559910:web:ccbb4c93a23f6fe51fb9a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

// 🔗 DOM elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const appDiv = document.getElementById("app");
const saveProfileBtn = document.getElementById("saveProfile");

// 🔐 Login
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("Login error:", err);
  }
});

// 🚪 Logout
logoutBtn.addEventListener("click", () => signOut(auth));

// 👀 Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.hidden = true;
    logoutBtn.hidden = false;
    appDiv.hidden = false;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // First-time user
      await setDoc(userRef, {
        name: user.displayName,
        language: "",
        book: "",
        chapter: 0,
        streak: 0,
        lastRead: null,
        photoURL: user.photoURL
      });
    } else {
      // Load existing profile
      const data = snap.data();
      language.value = data.language || "";
      book.value = data.book || "";
      chapter.value = data.chapter || "";
    }

    loadUsers();
  } else {
    loginBtn.hidden = false;
    logoutBtn.hidden = true;
    appDiv.hidden = true;
  }
});


// 💾 Save profile
saveProfileBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const language = document.getElementById("language").value;
  const book = document.getElementById("book").value;
  const chapter = Number(document.getElementById("chapter").value);

  await setDoc(doc(db, "users", user.uid), {
    name: user.displayName,
    language,
    book,
    chapter,
    photoURL: user.photoURL
  });

  loadUsers();
});

// 📖 Load all users
async function loadUsers() {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(docSnap => {
    const u = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${u.name} — ${u.book} ${u.chapter} (${u.language})`;
    list.appendChild(li);
  });
}
