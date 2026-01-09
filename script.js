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
  const landing = document.getElementById("landing");
  const loginBtnLanding = document.getElementById("loginBtnLanding");

  let viewMode = "overview"; // or "rankings"
  let rankingMode = "progress";
  let readingDays = [];
  let currentStreak = 0;
  
  const START_DATE = new Date(2026, 0, 1)
  let currentMonth = new Date();
  currentMonth.setDate(1);




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

  loginBtnLanding.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert("Sign-in failed");
      console.error(err);
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
  if (!user) {
    // 🚪 LOGGED OUT
    landing.style.display = "flex";
    appDiv.hidden = true;
    loginBtn.hidden = false;
    logoutBtn.hidden = true;
    return;
  }

  // 🔓 LOGGED IN (THIS RUNS FOR BOTH NEW + RETURNING USERS)
  landing.style.display = "none";
  appDiv.hidden = false;
  loginBtn.hidden = true;
  logoutBtn.hidden = false;

  document.getElementById("profilePic").src =
    user.photoURL || "https://via.placeholder.com/96";

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // 🆕 First-time login
    await setDoc(userRef, {
      name: user.displayName,
      email: user.email,
      language: "",
      book: "",
      chapter: 0,
      readingDays: [],
      streak: 0,
      photoURL: user.photoURL,
      createdAt: new Date()
    });
  } else {
    // 🔁 Returning user
    const data = snap.data();

    readingDays = data.readingDays || [];
    currentStreak = data.streak || 0;
    renderCalendar();

    document.getElementById("language").value = data.language || "";

    if (data.book && BOOKS[data.book]) {
      bookSelect.value = data.book;
      bookSelect.dispatchEvent(new Event("change"));
      if (data.chapter) {
        chapterSelect.value = data.chapter;
      }
    }
  }

  document.getElementById("streakCount").textContent = currentStreak;
  loadUsers();
});


  // Calendar
  function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const label = document.getElementById("calendarMonth");
  
    grid.innerHTML = "";
    label.textContent = currentMonth.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });
  
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
  
    const daysInMonth = new Date(year, month + 1, 0).getDate();
  
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];
  
      const div = document.createElement("div");
      div.className = "calendar-day";
      div.textContent = day;
  
      const isTooEarly = date < START_DATE;
      const isFuture = date > today;
  
      if (isTooEarly || isFuture) {
        div.classList.add("disabled");
      } else {
        if (readingDays.includes(dateStr)) {
          div.classList.add("marked");
        }
  
        div.addEventListener("click", () => {
          toggleReadingDay(dateStr);
        });
      }
  
      grid.appendChild(div);
    }
  }

  function toggleReadingDay(dateStr) {
    if (readingDays.includes(dateStr)) {
      readingDays = readingDays.filter(d => d !== dateStr);
    } else {
      readingDays.push(dateStr);
    }
  
    readingDays.sort();
    updateStreak();
    saveCalendar();
    renderCalendar();
  }

  //Streak updating
  function updateStreak() {
    let streak = 0;
    let day = new Date();
  
    while (true) {
      const dateStr = day.toISOString().split("T")[0];
      if (readingDays.includes(dateStr)) {
        streak++;
        day.setDate(day.getDate() - 1);
      } else {
        break;
      }
    }
  
    currentStreak = streak;
    document.getElementById("streakCount").textContent = currentStreak;
  }

  async function saveCalendar() {
    const user = auth.currentUser;
    if (!user) return;
  
    await setDoc(
      doc(db, "users", user.uid),
      {
        readingDays,
        streak: currentStreak
      },
      { merge: true }
    );
  
    loadUsers();
  }


  document.getElementById("prevMonth").onclick = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    if (prev >= START_DATE) {
      currentMonth = prev;
      renderCalendar();
    }
  };
  
  document.getElementById("nextMonth").onclick = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    if (next <= new Date()) {
      currentMonth = next;
      renderCalendar();
    }
  };


  // 💾 Save profile
  saveProfileBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    const language = document.getElementById("language").value;
    const book = bookSelect.value;
    const chapter = Number(chapterSelect.value) || 0;
  
    if (!book || !chapter) {
      alert("Please select a book and chapter first.");
      return;
    }
  
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
  let users = snapshot.docs.map(d => d.data());

  // SORT for rankings
  if (viewMode === "rankings") {
    if (rankingMode === "progress") {
      users.sort((a, b) => (b.chapter || 0) - (a.chapter || 0));
    } else if (rankingMode === "streak") {
      users.sort((a, b) => (b.streak || 0) - (a.streak || 0));
    }
  
    // Header
    const header = document.createElement("div");
    header.className = "leaderboard-row leaderboard-header";
    header.innerHTML = `
      <div>#</div>
      <div></div>
      <div>Name</div>
      <div>${rankingMode === "progress" ? "Chapter" : "Streak"}</div>
    `;
    container.appendChild(header);

    users.forEach((u, i) => {
      const row = document.createElement("div");
      row.className = "leaderboard-row";
    
      const medal =
        i === 0 ? "🥇" :
        i === 1 ? "🥈" :
        i === 2 ? "🥉" :
        `#${i + 1}`;
    
      row.innerHTML = `
        <div class="rank">${medal}</div>
        <img class="leaderboard-avatar" src="${u.photoURL || "https://via.placeholder.com/40"}">
        <div class="leaderboard-info">
          <strong>${u.name || "Unknown"}</strong>
          <small>${u.book || "-"} ${u.chapter || 0}</small>
        </div>
        <div class="leaderboard-stat">
          ${rankingMode === "progress"
            ? `📖 ${u.chapter || 0}`
            : `🔥 ${u.streak || 0}`}
        </div>
      `;
    
      container.appendChild(row);
    });


    return;
  }

  // OVERVIEW CARDS
  users.forEach(u => {
    const chapterNum = Number(u.chapter) || 0;
    const bookName = u.book || "-";
    const progressPercent = Math.min((chapterNum / 50) * 100, 100);

    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = u.photoURL || "https://via.placeholder.com/48";
    card.appendChild(img);

    const nameElem = document.createElement("h3");
    nameElem.textContent = u.name || "Unknown";
    card.appendChild(nameElem);

    const lang = document.createElement("p");
    lang.textContent = `Language: ${u.language || "-"}`;
    card.appendChild(lang);

    const bookElem = document.createElement("p");
    bookElem.textContent = `Reading: ${bookName} ${chapterNum}`;
    card.appendChild(bookElem);

    const streakElem = document.createElement("p");
    streakElem.textContent = `🔥 Streak: ${u.streak || 0} days`;
    card.appendChild(streakElem);


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
