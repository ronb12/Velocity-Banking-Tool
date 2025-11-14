// ✅ No firebase.initializeApp here anymore
// ✅ No const auth = firebase.auth() here anymore
// ✅ Only pure syncing functions

// Import Firestore functions
import { doc, onSnapshot, collection } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Don't import auth/db directly - use window.auth and window.db instead
// This prevents "Cannot access before initialization" errors
// auth.js already sets window.auth and window.db globally

const IS_LOCALHOST = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Auto-listeners for dashboard tiles
// Wait for auth to be ready before using it
if (!IS_LOCALHOST) {
  // Use a small delay to ensure auth is initialized
  const initSync = () => {
    try {
      // Get auth from window - auth.js should have set it
      const currentAuth = window.auth;
      const currentDb = window.db;
      
      if (!currentAuth || typeof currentAuth.onAuthStateChanged !== 'function') {
        // Auth not ready yet, retry (max 50 times = 5 seconds)
        if (initSync._retries === undefined) initSync._retries = 0;
        if (initSync._retries < 50) {
          initSync._retries++;
          setTimeout(initSync, 100);
        } else {
          console.warn('[Sync] Auth not available after waiting, giving up');
        }
        return;
      }
      
      // Reset retry counter on success
      initSync._retries = 0;
      
      currentAuth.onAuthStateChanged(async user => {
        if (!user) return window.location.href = "login.html";

        if (window.location.pathname.includes("index.html")) {
          const networthRef = doc(currentDb, "networth", user.uid);
          const budgetRef = doc(currentDb, "budgets", user.uid + "_" + new Date().toISOString().slice(0,7));
          const debtsRef = doc(currentDb, "debts", user.uid);

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
    } catch (error) {
      console.warn('[Sync] Error initializing auth listener:', error);
      // Retry after a delay
      setTimeout(initSync, 500);
    }
  };
  
  // Start initialization after a small delay to ensure auth is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSync, 200);
    });
  } else {
    setTimeout(initSync, 200);
  }
} else {
  console.log('[Sync] Firestore listeners disabled on localhost; using local data only.');
}

// Credit Utilization Monitor for Dashboard
// Only run if firebase compat is available (for backward compatibility)
if (!IS_LOCALHOST && typeof firebase !== 'undefined' && firebase.auth && window.db) {
  try {
    const firebaseAuth = firebase.auth();
    if (firebaseAuth && typeof firebaseAuth.onAuthStateChanged === 'function') {
      firebaseAuth.onAuthStateChanged(user => {
        if (!user) return;
        const currentDb = window.db;
        if (!currentDb) return;
        doc(currentDb, 'users', user.uid).onSnapshot(doc => {
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
  } catch (error) {
    console.warn('[Sync] Error initializing credit utilization monitor:', error);
  }
}
