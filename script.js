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

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const appDiv = document.getElementById("app");
  const saveProfileBtn = document.getElementById("saveProfile");
  let viewMode = "overview"; // or "rankings"
  let rankingMode = "progress";



// Set BOM books
const BOOKS = {
  "1 Nephi": 22,
  "2 Nephi": 33,
  "Jacob": 7,
  "Enos": 1,
  "Jarom": 1,
  "Omni": 1,
  "Words of Mormon": 1,
  "Mosiah": 29,
  "Alma": 63,
  "Helaman": 16,
  "3 Nephi": 30,
  "4 Nephi": 1,
  "Mormon": 9,
  "Ether": 15,
  "Moroni": 10
};

const bookSelect = document.getElementById("book");
const chapterSelect = document.getElementById("chapter");

// Populate book dropdown
Object.keys(BOOKS).forEach(book => {
  const option = document.createElement("option");
  option.value = book;
  option.textContent = book;
  bookSelect.appendChild(option);
});

// When book changes → update chapters
bookSelect.addEventListener("change", () => {
  const selectedBook = bookSelect.value;
  chapterSelect.innerHTML = '<option value="">Select chapter</option>';
  chapterSelect.value = "";

  if (!selectedBook) {
    chapterSelect.disabled = true;
    return;
  }

  const totalChapters = BOOKS[selectedBook];
  chapterSelect.disabled = false;

  for (let i = 1; i <= totalChapters; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    chapterSelect.appendChild(opt);
  }
});

  // View buttons
  const overviewBtn = document.getElementById("overviewBtn");
  const rankingsBtn = document.getElementById("rankingsBtn");
  const rankingTypeSelect = document.getElementById("rankingType");
  
  overviewBtn.addEventListener("click", () => {
    viewMode = "overview";
    overviewBtn.classList.add("active");
    rankingsBtn.classList.remove("active");
    rankingTypeSelect.hidden = true;
    loadUsers();
  });
  
  rankingsBtn.addEventListener("click", () => {
    viewMode = "rankings";
    rankingsBtn.classList.add("active");
    overviewBtn.classList.remove("active");
    rankingTypeSelect.hidden = false;
    loadUsers();
  });
  
  rankingTypeSelect.addEventListener("change", () => {
    rankingMode = rankingTypeSelect.value;
    loadUsers();
  });

  
  // 🔐 Login
  loginBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Check console for details.");
    }
  });

  // 🚪 Logout
  logoutBtn.addEventListener("click", () => signOut(auth));

  // 👀 Auth state listener
  onAuthStateChanged(auth, async (user) => {

    if (user) {
      document.getElementById("profilePic").src =
      user.photoURL || "https://via.placeholder.com/96";
      
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
      
        if (data.book && BOOKS[data.book]) {
          bookSelect.value = data.book;
          bookSelect.dispatchEvent(new Event("change"));
      
          if (data.chapter) {
            chapterSelect.value = data.chapter;
          }
        }
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
    if (!book) {
  alert("Please select a book and chapter first.");
  return;
}

    const language = document.getElementById("language").value;
    const book = bookSelect.value;
    const chapter = Number(chapterSelect.value) || 0;

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

      // Safe defaults
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
      const nameElem = document.createElement("h3");
      nameElem.textContent = u.name || "Unknown";
      card.appendChild(nameElem);

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
