// ✅ No firebase.initializeApp here anymore
// ✅ No const auth = firebase.auth() here anymore
// ✅ Only pure syncing functions

// Auto-listeners for dashboard tiles
auth.onAuthStateChanged(async user => {
  if (!user) return window.location.href = "login.html";

  const db = firebase.firestore(); // Reuse same firebase instance

  if (window.location.pathname.includes("index.html")) {
    const networthRef = db.collection("networth").doc(user.uid);
    const budgetRef = db.collection("budgets").doc(user.uid + "_" + new Date().toISOString().slice(0,7));
    const debtsRef = db.collection("debts").doc(user.uid);

    networthRef.onSnapshot(doc => {
      if (doc.exists && document.getElementById("netWorthTile")) {
        const assets = doc.data().assets || [];
        const liabilities = doc.data().liabilities || [];
        const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
        document.getElementById("netWorthTile").innerText = `🧮 Total Net Worth: $${(totalAssets - totalLiabilities).toFixed(2)}`;
      }
    });

    budgetRef.onSnapshot(doc => {
      if (doc.exists && document.getElementById("monthlyBudgetTile")) {
        const income = doc.data().incomes.reduce((sum, i) => sum + i.amount, 0);
        const expenses = doc.data().expenses.reduce((sum, e) => sum + e.budgeted, 0);
        document.getElementById("monthlyBudgetTile").innerText = `💰 Monthly Budget: $${income.toFixed(2)}`;
        document.getElementById("remainingToBudgetTile").innerText = `📉 Remaining to Budget: $${(income - expenses).toFixed(2)}`;
      }
    });

    debtsRef.onSnapshot(doc => {
      if (doc.exists && document.getElementById("topDebtsTile")) {
        const debts = doc.data().debts || [];
        const topDebts = debts.sort((a,b) => b.interest - a.interest).slice(0,3).map(d => d.name).join(", ");
        document.getElementById("topDebtsTile").innerText = `🔥 Top 3 Debts: ${topDebts || "N/A"}`;

        const utilization = doc.data().creditUtilization || 0;
        const utilTile = document.getElementById("creditUtilizationTile");
        let badge = "";

        if (utilization < 30) {
          utilTile.style.borderLeft = "5px solid #28a745";
          badge = "(Good ✅)";
        } else if (utilization < 50) {
          utilTile.style.borderLeft = "5px solid #ffc107";
          badge = "(Warning ⚠️)";
        } else {
          utilTile.style.borderLeft = "5px solid #dc3545";
          badge = "(Danger ❌)";
        }
        utilTile.innerText = `💳 Credit Utilization: ${parseFloat(utilization).toFixed(2)}% ${badge}`;
      }
    });
  }
});
