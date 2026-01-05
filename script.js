import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Firebase config
const firebaseConfig = {
  // PASTE YOUR CONFIG HERE
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

// UI
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const appDiv = document.getElementById("app");

// Login
loginBtn.onclick = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

// Auth state
onAuthStateChanged(auth, async user => {
  if (user) {
    loginBtn.hidden = true;
    logoutBtn.hidden = false;
    appDiv.hidden = false;
    loadUsers();
  } else {
    loginBtn.hidden = false;
    logoutBtn.hidden = true;
    appDiv.hidden = true;
  }
});

// Save profile
document.getElementById("saveProfile").onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, "users", user.uid), {
    name: user.displayName,
    language: language.value,
    book: book.value,
    chapter: chapter.value,
    photoURL: user.photoURL
  });

  loadUsers();
};

// Load all users
async function loadUsers() {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(doc => {
    const u = doc.data();
    const li = document.createElement("li");
    li.textContent = `${u.name} — ${u.book} ${u.chapter} (${u.language})`;
    list.appendChild(li);
  });
}

