// sync.js

// ✅ Initialize Firebase (if not already initialized)
if (!firebase.apps.length) {
  const firebaseConfig = {
    apiKey: "AIzaSyDrdga_hOO52nicYN3AwqqDjSbcnre6iM4",
    authDomain: "mobile-debt-tracker.firebaseapp.com",
    projectId: "mobile-debt-tracker"
  };
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let userUID = null; // 🌟 Will store the logged-in user ID

// ✅ Auto-detect table
const tableBody = document.querySelector("#debtTable tbody") || document.querySelector("#budgetTable tbody") || document.querySelector("#netWorthTable tbody");

// ✅ Function to auto-save data
function autoSaveData() {
  if (!tableBody || !userUID) return;
  const data = [];

  tableBody.querySelectorAll("tr").forEach(row => {
    const inputs = row.querySelectorAll("input");
    if (inputs.length > 0) {
      data.push({
        name: inputs[0].value,
        balance: parseFloat(inputs[2]?.value) || 0,
        rate: parseFloat(inputs[3]?.value) || 0,
        payment: parseFloat(inputs[4]?.value) || 0,
        limit: parseFloat(inputs[1]?.value) || 0
      });
    }
  });

  const docRef = db.collection(getCollectionName()).doc(userUID);
  docRef.set({ data })
    .then(() => console.log("✅ Auto-Saved Successfully"))
    .catch(err => console.error("❌ Auto-Save Error:", err));
}

// ✅ Function to auto-load data
function autoLoadData() {
  if (!tableBody || !userUID) return;
  const docRef = db.collection(getCollectionName()).doc(userUID);
  docRef.get().then(doc => {
    if (doc.exists && doc.data().data) {
      const rows = doc.data().data;
      tableBody.innerHTML = "";
      rows.forEach(d => addRow(d));
      console.log("✅ Auto-Loaded Successfully");
    }
  }).catch(err => console.error("❌ Auto-Load Error:", err));
}

// ✅ Helper: Detect page and pick correct Firestore collection
function getCollectionName() {
  const path = window.location.pathname;
  if (path.includes("Debt_Tracker")) return "debts";
  if (path.includes("budget")) return "budgets";
  if (path.includes("net_worth_tracker")) return "networth";
  return "misc"; // Default fallback
}

// ✅ Helper: Add row to table
function addRow(d) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input value="${d.name || ''}" /></td>
    <td><input type="number" value="${d.limit || 0}" /></td>
    <td><input type="number" value="${d.balance || 0}" /></td>
    <td><input type="number" value="${d.rate || 0}" /></td>
    <td><input type="number" value="${d.payment || 0}" /></td>
  `;
  tableBody.appendChild(row);
}

// ✅ Watch for typing to auto-save
function startAutoSaveWatcher() {
  if (!tableBody) return;
  tableBody.addEventListener("input", () => {
    clearTimeout(window.autoSaveTimer);
    window.autoSaveTimer = setTimeout(() => {
      autoSaveData();
    }, 1000);
  });
}

// ✅ Wait for user authentication
auth.onAuthStateChanged(user => {
  if (user) {
    userUID = user.uid;
    autoLoadData();
    startAutoSaveWatcher();
  } else {
    console.log("❌ No user logged in");
  }
});
