/**
 * Dashboard Data Management
 * Handles loading and updating dashboard statistics
 */

export class DashboardData {
  constructor(auth, db) {
    this.auth = auth;
    this.db = db;
    this.stats = {
      creditUtilization: null,
      netWorth: null,
      totalDebt: null,
      savingsProgress: null,
    };
  }

  /**
   * Check if user is the test user
   * @param {Object} user - Firebase user object
   * @returns {boolean} True if user is the test user
   */
  isTestUser(user) {
    if (!user || !user.email) return false;
    // Use config's allowUnverifiedAccounts list for consistency
    const testEmails = (window.CONFIG?.security?.allowUnverifiedAccounts || []).map(e => e.toLowerCase());
    return testEmails.includes(user.email.toLowerCase());
  }

  /**
   * Load dashboard data from Firestore
   * @param {boolean} useFirestore - Whether to use Firestore
   */
  async loadDashboardData(useFirestore) {
    if (!this.auth || !this.db) {
      console.warn('[DashboardData] Auth or DB not available');
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      console.log('[DashboardData] No user logged in');
      // For localhost, try to show sample data even if not logged in
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[DashboardData] On localhost, trying to apply local test data...');
        this.applyLocalDashboardData();
      }
      return;
    }
    
    console.log('[DashboardData] Loading dashboard data for user:', user.email, 'isTestUser:', this.isTestUser(user));

    if (useFirestore) {
      try {
        // Import Firestore v9 functions dynamically
        const { doc, getDoc, setDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
        const userRef = doc(this.db, 'users', user.uid);
        
        // First, ensure the user document exists with sample data
        // ONLY initialize sample data for the test user
        try {
          const userDoc = await getDoc(userRef);
          const isTest = this.isTestUser(user);
          
          if (!userDoc.exists()) {
            // Initialize with sample data ONLY for test user
            if (isTest) {
              console.log('[DashboardData] Test user detected, initializing sample data...');
              await this.initializeSampleData(user);
            } else {
              console.log('[DashboardData] New user (not test user), creating empty document...');
              // Create empty document for regular users
              await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || '',
                joined: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                creditUtilization: 0,
                netWorth: 0,
                totalDebt: 0,
                savingsProgress: 0
              }, { merge: true });
            }
          } else {
            // Check if user has empty/default data and needs sample data
            // ONLY for test user
            const data = userDoc.data();
            const hasEmptyData = 
              (!data.creditUtilization || data.creditUtilization === 0) &&
              (!data.netWorth || data.netWorth === 0) &&
              (!data.totalDebt || data.totalDebt === 0) &&
              (!data.sampleDataInitialized);
            
            if (hasEmptyData && isTest) {
              console.log('[DashboardData] Test user has empty data, initializing sample data...');
              await this.initializeSampleData(user);
              // After initializing, reload the document to get the new data
              const updatedDoc = await getDoc(userRef);
              if (updatedDoc.exists()) {
                const updatedData = updatedDoc.data();
                this.updateStatsFromData(updatedData);
              }
            } else if (hasEmptyData && !isTest) {
              console.log('[DashboardData] Regular user has empty data, keeping empty (no sample data)');
            } else {
              // User has data, update the UI immediately
              this.updateStatsFromData(data);
            }
          }
        } catch (error) {
          console.error('[DashboardData] Error checking/initializing user document:', error);
          // Only show sample data for test user if Firestore fails
          if (this.isTestUser(user)) {
            this.applyLocalDashboardData();
          } else {
            this.setDefaultValues();
          }
        }
        
        // Set up Firestore listener
        try {
          onSnapshot(userRef,
            docSnap => {
              try {
                if (!docSnap.exists()) {
                  // Document doesn't exist - initialize sample data for test user
                  if (this.isTestUser(user)) {
                    console.log('[DashboardData] Document not found, initializing sample data...');
                    this.initializeSampleData(user);
                  } else {
                    this.setDefaultValues();
                  }
                  return;
                }
                const data = docSnap.data() || {};
                
                // If data is empty and user is test user, initialize sample data
                const hasEmptyData = 
                  (!data.creditUtilization || data.creditUtilization === 0) &&
                  (!data.netWorth || data.netWorth === 0) &&
                  (!data.totalDebt || data.totalDebt === 0) &&
                  (!data.sampleDataInitialized);
                
                if (hasEmptyData && this.isTestUser(user)) {
                  console.log('[DashboardData] Empty data detected for test user, initializing...');
                  this.initializeSampleData(user).then(() => {
                    // After initializing, the listener will fire again with new data
                    // But also update UI immediately with sample stats
                    let sampleStats = {
                      creditUtilization: 37.5,
                      netWorth: 54200,
                      totalDebt: 23300,
                      savingsProgress: 44
                    };
                    // Try to get from local test data
                    if (typeof window.getLocalTestData === 'function') {
                      const stats = window.getLocalTestData('userStats');
                      if (stats) {
                        sampleStats = stats;
                      }
                    } else if (window.LOCAL_TEST_DATA?.userStats) {
                      Object.assign(sampleStats, window.LOCAL_TEST_DATA.userStats);
                    }
                    this.updateStatsFromData(sampleStats);
                  });
                  return;
                }
                
                // Update UI with the data
                console.log('[DashboardData] onSnapshot: Updating dashboard with data:', data);
                this.updateStatsFromData(data);
              } catch (error) {
                console.warn('[DashboardData] Error updating dashboard data:', error);
              }
            },
            error => {
              console.warn('[DashboardData] Firestore listener error (non-critical):', error.message);
              // Only show sample data for test user
              if (this.isTestUser(user)) {
                this.applyLocalDashboardData();
              } else {
                this.setDefaultValues();
              }
            }
          );
        } catch (error) {
          console.warn('[DashboardData] Could not set up Firestore listener:', error.message);
          // Only show sample data for test user
          if (this.isTestUser(user)) {
            this.applyLocalDashboardData();
          } else {
            this.setDefaultValues();
          }
        }
      } catch (error) {
        console.error('[DashboardData] Error loading dashboard data:', error);
        if (window.ErrorHandler) {
          window.ErrorHandler.handleFirebaseError(error);
        }
        // Only show sample data for test user
        if (this.isTestUser(user)) {
          this.applyLocalDashboardData();
        } else {
          this.setDefaultValues();
        }
      }
    } else {
      console.log('[DashboardData] Firestore disabled in local environment; using default dashboard placeholders.');
      // Only show sample data for test user in local mode
      if (this.isTestUser(user)) {
        this.applyLocalDashboardData();
      } else {
        this.setDefaultValues();
      }
    }
  }

  /**
   * Update stats from Firestore data
   * @param {Object} data - User data from Firestore
   */
  updateStatsFromData(data) {
    // Update credit utilization
    const creditUtil = data.creditUtilization;
    const creditElement = document.getElementById('creditUtilizationValue');
    if (creditElement) {
      if (creditUtil !== undefined && !isNaN(creditUtil)) {
        creditElement.textContent = `${Number(creditUtil).toFixed(1)}%`;
        creditElement.style.color = creditUtil < 30 ? '#22c55e' : creditUtil < 50 ? '#f59e42' : '#ef4444';
        this.stats.creditUtilization = creditUtil;
      } else {
        creditElement.textContent = 'No data yet';
        creditElement.style.color = '#64748b';
      }
    }
    
    // Update net worth
    const netWorth = data.netWorth;
    const netWorthElement = document.getElementById('netWorthValue');
    if (netWorthElement) {
      if (netWorth !== undefined && !isNaN(netWorth)) {
        const formatted = Number(netWorth).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        netWorthElement.textContent = formatted;
        netWorthElement.style.color = netWorth >= 0 ? '#22c55e' : '#ef4444';
        this.stats.netWorth = netWorth;
      } else {
        netWorthElement.textContent = 'No data yet';
        netWorthElement.style.color = '#64748b';
      }
    }
    
    // Update total debt
    const totalDebt = data.totalDebt;
    const debtElement = document.getElementById('debtSummaryValue');
    if (debtElement) {
      if (totalDebt !== undefined && !isNaN(totalDebt)) {
        const formatted = Number(totalDebt).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        debtElement.textContent = formatted;
        debtElement.style.color = totalDebt > 0 ? '#ef4444' : '#22c55e';
        this.stats.totalDebt = totalDebt;
      } else {
        debtElement.textContent = 'No data yet';
        debtElement.style.color = '#64748b';
      }
    }
    
    // Update savings progress
    const savings = data.savingsProgress;
    const savingsElement = document.getElementById('savingsValue');
    if (savingsElement) {
      if (savings !== undefined && !isNaN(savings)) {
        savingsElement.textContent = `${Number(savings).toFixed(1)}% of goals`;
        savingsElement.style.color = savings >= 100 ? '#22c55e' : savings >= 50 ? '#f59e42' : '#ef4444';
        this.stats.savingsProgress = savings;
      } else {
        savingsElement.textContent = 'No data yet';
        savingsElement.style.color = '#64748b';
      }
    }
  }

  /**
   * Set default values when Firestore fails
   */
  setDefaultValues() {
    const elements = ['creditUtilizationValue', 'netWorthValue', 'debtSummaryValue', 'savingsValue'];
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = 'No data yet';
        element.style.color = '#64748b';
      }
    });
  }

  /**
   * Apply local dashboard data (fallback)
   */
  applyLocalDashboardData() {
    // Try to get sample data from local-test-data.js
    let sampleData = null;
    
    console.log('[DashboardData] applyLocalDashboardData called');
    console.log('[DashboardData] Checking for test data...', {
      hasGetLocalTestData: typeof window.getLocalTestData === 'function',
      hasLOCAL_TEST_DATA: !!window.LOCAL_TEST_DATA,
      LOCAL_TEST_DATA_keys: window.LOCAL_TEST_DATA ? Object.keys(window.LOCAL_TEST_DATA) : []
    });
    
    if (typeof window.getLocalTestData === 'function') {
      sampleData = window.getLocalTestData('userStats');
      console.log('[DashboardData] Got sample data from getLocalTestData:', sampleData);
    } else if (window.LOCAL_TEST_DATA?.userStats) {
      sampleData = window.LOCAL_TEST_DATA.userStats;
      console.log('[DashboardData] Got sample data from LOCAL_TEST_DATA:', sampleData);
    }
    
    if (sampleData) {
      console.log('[DashboardData] Using sample data for dashboard:', sampleData);
      // Update UI with sample data
      this.updateStatsFromData(sampleData);
    } else {
      // Fallback to default sample stats if no local test data available
      console.warn('[DashboardData] No sample data from local-test-data.js, using default sample stats');
      const defaultSampleData = {
        creditUtilization: 37.5,
        netWorth: 54200,
        totalDebt: 23300,
        savingsProgress: 44
      };
      console.log('[DashboardData] Using default sample data:', defaultSampleData);
      this.updateStatsFromData(defaultSampleData);
    }
  }
  
  /**
   * Initialize sample data for test user only
   */
  async initializeSampleData(user) {
    if (!user || !this.db) {
      return;
    }
    
    // Double-check: Only initialize for test user
    if (!this.isTestUser(user)) {
      console.log('[DashboardData] Not test user, skipping sample data initialization');
      return;
    }
    
    try {
      const { doc, getDoc, setDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      const userRef = doc(this.db, 'users', user.uid);
      
      const userDoc = await getDoc(userRef);
      
      // Only initialize if user document doesn't exist or has default values
      if (!userDoc.exists() || 
          (userDoc.data().creditUtilization === 0 && 
           userDoc.data().netWorth === 0 && 
           userDoc.data().totalDebt === 0)) {
        
        // Calculate sample stats from sample data if available
        let sampleStats = {
          creditUtilization: 37.5,
          netWorth: 54200,
          totalDebt: 23300,
          savingsProgress: 44
        };
        
        // Try to get from local test data (loaded from local-test-data.js)
        if (typeof window.getLocalTestData === 'function') {
          const stats = window.getLocalTestData('userStats');
          if (stats) {
            sampleStats = stats;
            console.log('[DashboardData] Using sample stats from local-test-data.js:', sampleStats);
          }
        } else if (window.LOCAL_TEST_DATA?.userStats) {
          sampleStats = window.LOCAL_TEST_DATA.userStats;
          console.log('[DashboardData] Using sample stats from LOCAL_TEST_DATA:', sampleStats);
        } else {
          console.log('[DashboardData] Using default sample stats (local-test-data.js not loaded):', sampleStats);
        }
        
        // Create or update user document with sample data
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || '',
          joined: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          creditUtilization: sampleStats.creditUtilization || 0,
          netWorth: sampleStats.netWorth || 0,
          totalDebt: sampleStats.totalDebt || 0,
          savingsProgress: sampleStats.savingsProgress || 0,
          sampleDataInitialized: true
        }, { merge: true });
        
        console.log('[DashboardData] Sample data initialized for test user:', sampleStats);
        
        // Update UI immediately - don't wait for listener
        this.updateStatsFromData(sampleStats);
        
        // Also trigger a small delay update to ensure UI is refreshed
        setTimeout(() => {
          this.updateStatsFromData(sampleStats);
        }, 100);
      }
    } catch (error) {
      console.warn('[DashboardData] Could not initialize sample data:', error.message);
    }
  }

  /**
   * Get current stats
   * @returns {Object} Current statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export for use
export default DashboardData;

