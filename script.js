
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
    getDoc,
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
document.addEventListener("DOMContentLoaded", () => {
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
        // 🆕 First-time login → create profile
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          language: "",
          book: "",
          chapter: 0,
          streak: 0,
          lastRead: null,
          photoURL: user.photoURL,
          createdAt: new Date()
        });
      } else {
        // 🔁 Returning user → load profile
        const data = snap.data();
        document.getElementById("language").value = data.language || "";
        document.getElementById("book").value = data.book || "";
        document.getElementById("chapter").value = data.chapter || "";
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
  
    await setDoc(
      doc(db, "users", user.uid),
      {
        language,
        book,
        chapter,
        updatedAt: new Date()
      },
      { merge: true }
    );
  
    loadUsers();
  });
  
  
  // 📖 Load all users
  async function loadUsers() {
  const container = document.getElementById("userCards");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(docSnap => {
    const u = docSnap.data();

    // Only declare once
    const chapterNum = Number(u.chapter) || 0;
    const bookName = u.book || "-";
    const progressPercent = Math.min((chapterNum / 50) * 100, 100);

    // Create card
    const card = document.createElement("div");
    card.className = "card";

    // Profile picture
    const img = document.createElement("img");
    img.src = u.photoURL || "https://via.placeholder.com/48";
    card.appendChild(img);

    // Name
    const name = document.createElement("h3");
    name.textContent = u.name;
    card.appendChild(name);

    // Language
    const lang = document.createElement("p");
    lang.textContent = `Language: ${u.language || "-"}`;
    card.appendChild(lang);

    // Book + Chapter
    const bookElem = document.createElement("p");
    bookElem.textContent = `Reading: ${bookName} ${chapterNum}`;
    card.appendChild(bookElem);

    // Progress bar
    const barContainer = document.createElement("div");
    barContainer.className = "progress-bar-container";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = `${progressPercent}%`;
    barContainer.appendChild(bar);
    card.appendChild(barContainer);

    container.appendChild(card);
  });
}

});


