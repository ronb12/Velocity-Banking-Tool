// ✅ NO firebase.initializeApp here
// ✅ Only reference the already-initialized firebase
const db = firebase.firestore();
const auth = firebase.auth();

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
  } else if (path.includes("index.html") || path.endsWith("/")) {
    loadDashboardData();
  }
});

// ✅ Dashboard Tile Loader for index.html
function loadDashboardData() {
  const user = auth.currentUser;
  if (!user) return;

  // 🔵 Net Worth
  db.collection("networth").doc(user.uid).onSnapshot(doc => {
    if (doc.exists) {
      const d = doc.data();
      const assets = d.assets || [];
      const liabilities = d.liabilities || [];
      const total = assets.reduce((s, a) => s + (a.value || 0), 0) - liabilities.reduce((s, l) => s + (l.value || 0), 0);
      document.getElementById("netWorthTile").innerText = `🧰 Total Net Worth: $${total.toFixed(2)}`;
    }
  });

  // 🟡 Budget
  const month = new Date().toISOString().slice(0, 7);
  db.collection("budgets").doc(`${user.uid}_${month}`).onSnapshot(doc => {
    if (doc.exists) {
      const d = doc.data();
      const income = (d.incomes || []).reduce((s, i) => s + (i.amount || 0), 0);
      const expenses = (d.expenses || []).reduce((s, e) => s + (e.budgeted || 0), 0);
      document.getElementById("monthlyBudgetTile").innerText = `💰 Monthly Budget: $${income.toFixed(2)}`;
      document.getElementById("remainingToBudgetTile").innerText = `📉 Remaining to Budget: $${(income - expenses).toFixed(2)}`;
    }
  });

  // 🔴 Debts + Credit Utilization
  db.collection("users").doc(user.uid).collection("debts").onSnapshot(snapshot => {
    const debts = snapshot.docs.map(doc => doc.data());
    const top = debts.sort((a, b) => (b.interest || 0) - (a.interest || 0)).slice(0, 3).map(d => d.name).join(", ");
    document.getElementById("topDebtsTile").innerText = `🔥 Top 3 Debts: ${top || "N/A"}`;

    const creditDebts = debts.filter(d => (d.type || '').toLowerCase() === 'credit' && parseFloat(d.limit || 0) > 0);
    const used = creditDebts.reduce((sum, d) => sum + parseFloat(d.balance || 0), 0);
    const limit = creditDebts.reduce((sum, d) => sum + parseFloat(d.limit || 0), 0);
    const utilization = limit > 0 ? (used / limit) * 100 : 0;

    let color = "#007bff", badge = "";
    if (utilization < 30) { color = "#28a745"; badge = "(Good ✅)"; }
    else if (utilization < 50) { color = "#ffc107"; badge = "(Warning ⚠️)"; }
    else { color = "#dc3545"; badge = "(Danger ❌)"; }

    const utilTile = document.getElementById("creditUtilizationTile");
    utilTile.style.borderLeft = `5px solid ${color}`;
    utilTile.innerText = `💳 Credit Utilization: ${utilization.toFixed(2)}% ${badge}`;
  });
}

// ✅ Functions for specific pages

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
    table.addEventListener("input", function () {
      showSaving();
      clearTimeout(window.autoSaveTimer);
      window.autoSaveTimer = setTimeout(() => {
        saveDebts();
        showSaved();
        logActivity('save', 'Debt Tracker Auto-Saved');
      }, 1000);
    });
  }
}

function listenForBudgetUpdates() {
  const user = auth.currentUser;
  if (user) {
    const month = new Date().toISOString().slice(0, 7);
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
    table.addEventListener("input", function () {
      showSaving();
      clearTimeout(window.autoSaveTimer);
      window.autoSaveTimer = setTimeout(() => {
        saveBudget();
        showSaved();
        logActivity('save', 'Budget Auto-Saved');
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
    table.addEventListener("input", function () {
      showSaving();
      clearTimeout(window.autoSaveTimer);
      window.autoSaveTimer = setTimeout(() => {
        saveNetWorth();
        showSaved();
        logActivity('save', 'Net Worth Tracker Auto-Saved');
      }, 1000);
    });
  }
}

// ✅ Master Activity Logger
function logActivity(type, text) {
  const feed = JSON.parse(localStorage.getItem('masterActivityFeed') || '[]');
  const icons = {
    save: '💾',
    expense: '💸',
    income: '💰',
    note: '📝',
    default: '📌'
  };
  const icon = icons[type] || icons.default;

  feed.push({
    type,
    icon,
    text,
    timestamp: new Date().toISOString()
  });

  localStorage.setItem('masterActivityFeed', JSON.stringify(feed));
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
