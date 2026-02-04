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
import { getDoc } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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

let loadingUsers = false;

/* -===- PWA Mobile check and setup -===- */

const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if (isStandalone) {
  document.body.classList.add("pwa");
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/BOM-sibling-tracker/sw.js");
  });
}


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

  initBookDropdown();


  /* ======================
     HELPERS
  ====================== */

  function calculateProgress(book, chapter = 0) {
    if (!book) return 0;
  
    let completed = 0;
  
    for (const b of BOOKS_ORDERED) {
      if (b.name === book) return completed + chapter;
      completed += b.chapters;
    }
  
    return 0;
  }

  function initBookDropdown() {
    if (!bookSelect || bookSelect.children.length) return;
  
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select book";
    placeholder.disabled = true;
    placeholder.selected = true;
    bookSelect.appendChild(placeholder);
  
    BOOKS_ORDERED.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.name;
      opt.textContent = b.name;
      bookSelect.appendChild(opt);
    });
  }

  
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

  onAuthStateChanged(auth, async user => {
    if (!user) {
      landing.style.display = "flex";
      appRoot.hidden = true;
      return;
    }
  
    landing.style.display = "none";
    appRoot.hidden = false;
  
    setView("home");

    await loadHomeProfile(user);
    await loadUsers();

  });

  
    /* ======================
     Load home profile
  ====================== */

async function loadHomeProfile(user) {

  // defaults from auth
  document.getElementById("homeAvatar").src =
    user.photoURL || "https://via.placeholder.com/96";

  document.getElementById("homeName").textContent =
    user.displayName || "Unknown";

  document.getElementById("homeBook").textContent =
    "No reading logged yet";

  document.getElementById("homeProgressBar").style.width = "0%";
  document.getElementById("homePercent").textContent = "0% complete";

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const me = snap.data();

  const progress = calculateProgress(me.book, me.chapter || 0);
  const percent = Math.round(progress / TOTAL_CHAPTERS * 100);

  if (me.photoURL)
    document.getElementById("homeAvatar").src = me.photoURL;

  document.getElementById("homeName").textContent =
    me.name || user.displayName;

  document.getElementById("homeBook").textContent =
    me.book
      ? `${me.book} ${me.chapter}`
      : "No reading logged yet";

  document.getElementById("homeProgressBar").style.width =
    percent + "%";

  document.getElementById("homePercent").textContent =
    `${percent}% complete`;
}


  
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
          name: user.displayName,
          photoURL: user.photoURL,
  
          book: bookSelect.value,
          chapter: Number(chapterSelect.value || 0),
  
          updatedAt: new Date()
        },
        { merge: true }
      );
  
      await loadUsers();
      await loadHomeProfile(user);
    };


  
  /* ======================
     LOAD USERS
  ====================== */
  
  async function loadUsers() {
    if (loadingUsers) return;
    loadingUsers = true;
  
    const familyContainer = document.getElementById("userCards");
    const homeContainer = document.getElementById("homeFamilyCards");
  
    if (!familyContainer) {
      loadingUsers = false;
      return;
    }
  
    const familyFrag = document.createDocumentFragment();
    const homeFrag = document.createDocumentFragment();
  
    const snap = await getDocs(collection(db, "users"));
    let users = snap.docs.map(d => d.data());
  
    if (rankingMode === "streak") {
      users.sort((a, b) => (b.streak || 0) - (a.streak || 0));
    } else {
      users.sort((a, b) => {
        const aProg = calculateProgress(a.book, a.chapter || 0);
        const bProg = calculateProgress(b.book, b.chapter || 0);
        return bProg - aProg;
      });
    }
  
    users.forEach((u, idx) => {
      const progress = calculateProgress(u.book, u.chapter || 0);
      const percent = Math.round(progress / TOTAL_CHAPTERS * 100);
  
      /* ---------- FAMILY LEADERBOARD CARD ---------- */
  
      const lb = document.createElement("div");
      lb.className = "leaderboard-card card-base";
  
      lb.innerHTML = `
        <div class="lb-rank">${idx + 1}</div>
        <img src="${u.photoURL || "https://via.placeholder.com/64"}">
        <div class="leaderboard-main">
          <strong>${u.name || "Unknown"}</strong>
          <small>${u.book || "-"} ${u.chapter || 0}</small>
        </div>
  
        <div class="lb-streak">🔥 ${u.streak || 0}</div>
  
        <div class="lb-progress">
          <span>${percent}%</span>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width:${percent}%"></div>
          </div>
        </div>
      `;
  
      familyFrag.appendChild(lb);
  
      homeFrag.appendChild(lb.cloneNode(true));
    });
  
    familyContainer.replaceChildren(familyFrag);
  
    if (homeContainer) {
      homeContainer.replaceChildren(homeFrag);
    }
  
    loadingUsers = false;
  }

});
