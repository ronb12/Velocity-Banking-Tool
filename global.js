// ✅ NO Firebase.initializeApp here
// ✅ Only reference the already-initialized firebase
const db = firebase.firestore();

// ✅ Global logout
function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

// ✅ Toggle profile box
function toggleProfile() {
  const box = document.getElementById("profileBox");
  if (box) box.style.display = box.style.display === "none" ? "block" : "none";
}

// ✅ Global Save Status
function showSaving() {
  const saveStatus = document.getElementById("saveStatus");
  if (!saveStatus) return;
  saveStatus.innerText = "💾 Saving...";
  saveStatus.style.color = "orange";
}

function showSaved() {
  const now = new Date();
  const saveStatus = document.getElementById("saveStatus");
  if (!saveStatus) return;
  saveStatus.innerText = `✅ Auto-Saved at ${now.toLocaleTimeString()}`;
  saveStatus.style.color = "green";
  setTimeout(() => {
    saveStatus.innerText = "";
  }, 3000);
}

// ✅ Global onAuthStateChanged
auth.onAuthStateChanged(async user => {
  if (!user) return window.location.href = "login.html";

  const userRef = db.collection("users").doc(user.uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({ email: user.email, joined: new Date().toISOString() });
  }
  const data = (await userRef.get()).data();
  if (document.getElementById("profileEmail")) {
    document.getElementById("profileEmail").innerText = `Email: ${data.email}`;
  }
  if (document.getElementById("profileJoinDate")) {
    document.getElementById("profileJoinDate").innerText = `Joined: ${new Date(data.joined).toLocaleDateString()}`;
  }
  if (document.getElementById("notification")) {
    document.getElementById("notification").innerText = `🔔 Welcome back, ${data.email}`;
    document.getElementById("notification").style.display = "block";
  }

  // 🧠 Smart page detection
  const path = window.location.pathname;

  if (path.includes("Debt_Tracker.html")) {
    listenForDebtUpdates();
    setupDebtAutoSave();
  } else if (path.includes("budget.html")) {
    listenForBudgetUpdates();
    setupBudgetAutoSave();
  } else if (path.includes("net_worth_tracker.html")) {
    listenForNetWorthUpdates();
    setupNetWorthAutoSave();
  }
});

// ✅ Functions per page

function listenForDebtUpdates() {
  const user = auth.currentUser;
  if (user) {
    db.collection("debts").doc(user.uid)
      .onSnapshot(doc => {
        if (doc.exists && document.getElementById("debtTable")) {
          const debts = doc.data().debts || [];
          document.querySelector("#debtTable tbody").innerHTML = "";
          debts.forEach(d => addDebt(d.name, d.balance, d.rate, d.payment, d.limit));
          calculateSummary();
        }
      });
  }
}

function setupDebtAutoSave() {
  const table = document.querySelector("#debtTable");
  if (table) {
    table.addEventListener("input", function() {
      showSaving();
      clearTimeout(window.autoSaveTimer);
      window.autoSaveTimer = setTimeout(() => {
        saveDebts();
        showSaved();
      }, 1000);
    });
  }
}

function listenForBudgetUpdates() {
  const user = auth.currentUser;
  if (user) {
    const month = new Date().toISOString().slice(0,7);
    db.collection("budgets").doc(user.uid + "_" + month)
      .onSnapshot(doc => {
        if (doc.exists && document.getElementById("budgetTable")) {
          loadBudgetFromDoc(doc.data());
        }
      });
  }
}

function setupBudgetAutoSave() {
  const table = document.querySelector("#budgetTable");
  if (table) {
    table.addEventListener("input", function() {
      showSaving();
      clearTimeout(window.autoSaveTimer);
      window.autoSaveTimer = setTimeout(() => {
        saveBudget();
        showSaved();
      }, 1000);
    });
  }
}

function listenForNetWorthUpdates() {
  const user = auth.currentUser;
  if (user) {
    db.collection("networth").doc(user.uid)
      .onSnapshot(doc => {
        if (doc.exists && document.getElementById("netWorthTile")) {
          const assets = doc.data().assets || [];
          const liabilities = doc.data().liabilities || [];
          const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
          const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
          document.getElementById("netWorthTile").innerText = `🧮 Total Net Worth: $${(totalAssets - totalLiabilities).toFixed(2)}`;
        }
      });
  }
}

function setupNetWorthAutoSave() {
  const table = document.querySelector("#netWorthTable");
  if (table) {
    table.addEventListener("input", function() {
      showSaving();
      clearTimeout(window.autoSaveTimer);
      window.autoSaveTimer = setTimeout(() => {
        saveNetWorth();
        showSaved();
      }, 1000);
    });
  }
}
// ✅ Master Activity Logger
function logActivity(message) {
  const feedKey = 'activityFeedLogs';
  const feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
  feed.push({
    message,
    timestamp: Date.now()
  });
  localStorage.setItem(feedKey, JSON.stringify(feed));
}

// ✅ Theme Toggle
function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  if (currentTheme === 'light') {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

window.addEventListener('load', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }
});
