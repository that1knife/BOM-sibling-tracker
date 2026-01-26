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

/* ======================
   FIREBASE SETUP
====================== */

const firebaseConfig = {
  apiKey: "AIzaSyCYN4w0tFj6aE-FJXYaCgm3KD7uvXbCHVc",
  authDomain: "bom-sibling-tracker-50515.firebaseapp.com",
  projectId: "bom-sibling-tracker-50515",
  storageBucket: "bom-sibling-tracker-50515.firebasestorage.app",
  messagingSenderId: "352637559910",
  appId: "1:352637559910:web:ccbb4c93a23f6fe51fb9a7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

/* ======================
   CONSTANTS
====================== */

const START_DATE = new Date(2026, 0, 1);
const TOTAL_CHAPTERS = 239;

const BOOKS_ORDERED = [
  { name: "1 Nephi", chapters: 22 },
  { name: "2 Nephi", chapters: 33 },
  { name: "Jacob", chapters: 7 },
  { name: "Enos", chapters: 1 },
  { name: "Jarom", chapters: 1 },
  { name: "Omni", chapters: 1 },
  { name: "Words of Mormon", chapters: 1 },
  { name: "Mosiah", chapters: 29 },
  { name: "Alma", chapters: 63 },
  { name: "Helaman", chapters: 16 },
  { name: "3 Nephi", chapters: 30 },
  { name: "4 Nephi", chapters: 1 },
  { name: "Mormon", chapters: 9 },
  { name: "Ether", chapters: 15 },
  { name: "Moroni", chapters: 10 }
];

/* ======================
   APP STATE
====================== */

let viewMode = "overview";
let rankingMode = "progress";
let readingDays = [];
let currentStreak = 0;
let currentMonth = new Date(new Date().setDate(1));

/* ======================
   DOM READY
====================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- DOM LOOKUPS ---------- */

  const $ = id => document.getElementById(id);

  const loginBtn = $("loginBtn");
  const logoutBtn = $("logoutBtn");
  const loginBtnLanding = $("loginBtnLanding");
  const saveProfileBtn = $("saveProfile");
  const landing = $("landing");
  const appRoot = $("app");

  const bookSelect = $("book");
  const chapterSelect = $("chapter");

  const overviewBtn = $("overviewBtn");
  const rankingsBtn = $("rankingsBtn");
  const rankingTypeSelect = $("rankingType");


  /* ======================
     HELPERS
  ====================== */

  function calculateProgress(book, chapter = 0) {
    let completed = 0;
    for (const b of BOOKS_ORDERED) {
      if (b.name === book) return completed + chapter;
      completed += b.chapters;
    }
    return completed;
  }

  function initBookDropdown() {
    if (!bookSelect || bookSelect.children.length) return;
    BOOKS_ORDERED.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.name;
      opt.textContent = b.name;
      bookSelect.appendChild(opt);
    });
  }

  /* ======================
     MOBILE PANEL SWITCH
  ====================== */

  /* ======================
   VIEW SYSTEM
====================== */

const panels = {
  home: document.getElementById("homePanel"),
  family: document.getElementById("familyPanel"),
  practice: document.getElementById("practicePanel"),
  profile: document.getElementById("profilePanel"),
  settings: document.getElementById("settingsPanel")
};

let activeView = "home";

function setView(view) {
  activeView = view;

  Object.values(panels).forEach(p =>
    p && p.classList.remove("active")
  );

  panels[view]?.classList.add("active");

  document
    .querySelectorAll("[data-view]")
    .forEach(btn =>
      btn.classList.toggle(
        "active",
        btn.dataset.view === view
      )
    );
}

/* bind nav buttons */

document.querySelectorAll(".top-nav button[data-view]").forEach(btn => {
  btn.onclick = () => setView(btn.dataset.view);
});

document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.onclick = () => setView(btn.dataset.view);
});


  /* ======================
     AUTH EVENTS
  ====================== */

  if (loginBtn)
    loginBtn.onclick = () => signInWithPopup(auth, provider);

  if (loginBtnLanding)
    loginBtnLanding.onclick = () => signInWithPopup(auth, provider);

  if (logoutBtn)
    logoutBtn.onclick = () => signOut(auth);

  /* ======================
     NAV BUTTONS
  ====================== */


  let activeView = "home";

  const viewPanels = {
    home: document.getElementById("homePanel"),
    family: document.getElementById("familyPanel"),
    practice: document.getElementById("practicePanel"),
    profile: document.getElementById("profilePanel")
  };
  
  function setView(view) {
    activeView = view;
  
    Object.values(viewPanels).forEach(p =>
      p && p.classList.remove("active")
    );
  
    viewPanels[view]?.classList.add("active");
  
    document
      .querySelectorAll("[data-view]")
      .forEach(b => b.classList.toggle(
        "active",
        b.dataset.view === view
      ));
  }

    document.querySelectorAll(".top-nav button").forEach(btn => {
    btn.onclick = () => setView(btn.dataset.view);
  });

  

  
  /* ======================
     BOOK → CHAPTER LINK
  ====================== */

  if (bookSelect && chapterSelect) {
    bookSelect.addEventListener("change", () => {
      chapterSelect.innerHTML = `<option value="">Select chapter</option>`;
      const book = BOOKS_ORDERED.find(b => b.name === bookSelect.value);
      if (!book) return;

      for (let i = 1; i <= book.chapters; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        chapterSelect.appendChild(opt);
      }
    });
  }

  /* ======================
     AUTH STATE
  ====================== */

  onAuthStateChanged(auth, user => {
  if (!user) {
    landing.style.display = "flex";
    appRoot.hidden = true;
    return;
  }

  landing.style.display = "none";
  appRoot.hidden = false;

  setView("home");
  loadUsers();
});


  /* ======================
     SAVE PROFILE
  ====================== */

  if (saveProfileBtn)
    saveProfileBtn.onclick = async () => {
      const user = auth.currentUser;
      if (!user || !bookSelect || !chapterSelect) return;

      await setDoc(
        doc(db, "users", user.uid),
        {
          book: bookSelect.value,
          chapter: Number(chapterSelect.value || 0),
          updatedAt: new Date()
        },
        { merge: true }
      );

      loadUsers();
    };

  /* ======================
     LOAD USERS
  ====================== */

  async function loadUsers() {
    const container = $("userCards");
    if (!container) return;

    container.innerHTML = "";
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map(d => d.data());

    users.forEach(u => {
      const progress = calculateProgress(u.book, u.chapter || 0);
      const percent = (progress / TOTAL_CHAPTERS) * 100;

      const card = document.createElement("div");
      card.className = "overview-card card-base";
      card.innerHTML = `
        <img src="${u.photoURL || "https://via.placeholder.com/64"}">
        <div class="overview-name">${u.name || "Unknown"}</div>
        <div>${u.book || "-"} ${u.chapter || 0}</div>
        <div>🔥 ${u.streak || 0}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width:${percent}%"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }

});
