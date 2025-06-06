// ✅ No firebase.initializeApp here anymore
// ✅ No const auth = firebase.auth() here anymore
// ✅ Only pure syncing functions

import { auth, db } from './firebase-config.js';
import { doc, onSnapshot, collection } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Auto-listeners for dashboard tiles
auth.onAuthStateChanged(async user => {
  if (!user) return window.location.href = "login.html";

  if (window.location.pathname.includes("index.html")) {
    const networthRef = doc(db, "networth", user.uid);
    const budgetRef = doc(db, "budgets", user.uid + "_" + new Date().toISOString().slice(0,7));
    const debtsRef = doc(db, "debts", user.uid);

    onSnapshot(networthRef, docSnap => {
      if (docSnap.exists() && document.getElementById("netWorthTile")) {
        const data = docSnap.data();
        const assets = data.assets || [];
        const liabilities = data.liabilities || [];
        const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
        document.getElementById("netWorthTile").innerText = `🧮 Total Net Worth: $${(totalAssets - totalLiabilities).toFixed(2)}`;
      }
    });

    onSnapshot(budgetRef, docSnap => {
      if (docSnap.exists() && document.getElementById("monthlyBudgetTile")) {
        const data = docSnap.data();
        const income = (data.incomes || []).reduce((sum, i) => sum + i.amount, 0);
        const expenses = (data.expenses || []).reduce((sum, e) => sum + e.budgeted, 0);
        document.getElementById("monthlyBudgetTile").innerText = `💰 Monthly Budget: $${income.toFixed(2)}`;
        document.getElementById("remainingToBudgetTile").innerText = `📉 Remaining to Budget: $${(income - expenses).toFixed(2)}`;
      }
    });

    onSnapshot(debtsRef, docSnap => {
      const debtTile = document.getElementById("debtSummaryTile");
      if (docSnap.exists() && debtTile) {
        const data = docSnap.data();
        const totalDebt = (data.debts || []).reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
        debtTile.innerText = `📊 Total Debt: $${totalDebt.toFixed(2)}`;
      }
    });
  }
});

// Credit Utilization Monitor for Dashboard
if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return;
    doc(db, 'users', user.uid).onSnapshot(doc => {
      const utilization = doc.data().creditUtilization || 0;
      const utilTile = document.getElementById('creditUtilizationTile');
      if (!utilTile) return;
      let badge = '';
      if (utilization < 30) {
        badge = '🟢';
        utilTile.style.borderLeftColor = '#28a745';
      } else if (utilization < 50) {
        badge = '🟡';
        utilTile.style.borderLeftColor = '#ffc107';
      } else {
        badge = '🔴';
        utilTile.style.borderLeftColor = '#dc3545';
      }
      utilTile.innerText = `💳 Credit Utilization: ${parseFloat(utilization).toFixed(2)}% ${badge}`;
    });
  });
}
