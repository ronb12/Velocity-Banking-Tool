// Enhanced data loading with error handling
auth.onAuthStateChanged(async user => {
  if (user) {
    if (USE_FIRESTORE) {
      try {
      const userRef = doc(db, 'users', user.uid);
      
      // First, ensure the user document exists
      try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || '',
            joined: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            creditUtilization: 0,
            netWorth: 0,
            totalDebt: 0,
            savingsProgress: 0
          });
          console.log('User document created successfully');
        }
      } catch (error) {
        console.error('Error creating user document:', error);
        // Continue without the user document for now
      }
      
      // Try to set up Firestore listener with error handling
      try {
        onSnapshot(userRef, 
          docSnap => {
            try {
              const data = docSnap.data() || {};
              
              // Update credit utilization with validation
              const creditUtil = data.creditUtilization;
              const creditElement = document.getElementById('creditUtilizationValue');
              if (creditElement) {
                if (creditUtil !== undefined && !isNaN(creditUtil)) {
                  creditElement.textContent = `${Number(creditUtil).toFixed(1)}%`;
                  creditElement.style.color = creditUtil < 30 ? '#22c55e' : creditUtil < 50 ? '#f59e42' : '#ef4444';
                } else {
                  creditElement.textContent = 'No data yet';
                  creditElement.style.color = '#64748b';
                }
              }
              
              // Update net worth with validation
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
                } else {
                  netWorthElement.textContent = 'No data yet';
                  netWorthElement.style.color = '#64748b';
                }
              }
              
              // Update total debt with validation
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
                } else {
                  debtElement.textContent = 'No data yet';
                  debtElement.style.color = '#64748b';
                }
              }
              
              // Update savings progress with validation
              const savings = data.savingsProgress;
              const savingsElement = document.getElementById('savingsValue');
              if (savingsElement) {
                if (savings !== undefined && !isNaN(savings)) {
                  savingsElement.textContent = `${Number(savings).toFixed(1)}% of goals`;
                  savingsElement.style.color = savings >= 100 ? '#22c55e' : savings >= 50 ? '#f59e42' : '#ef4444';
                } else {
                  savingsElement.textContent = 'No data yet';
                  savingsElement.style.color = '#64748b';
                }
              }
            } catch (error) {
              console.warn('Error updating dashboard data:', error);
            }
          },
          error => {
            console.warn('Firestore listener error (non-critical):', error.message);
            // Set default values when Firestore fails
            const elements = ['creditUtilizationValue', 'netWorthValue', 'debtSummaryValue', 'savingsValue'];
            elements.forEach(id => {
              const element = document.getElementById(id);
              if (element) {
                element.textContent = 'No data yet';
                element.style.color = '#64748b';
              }
            });
          }
        );
      } catch (error) {
        console.warn('Could not set up Firestore listener:', error.message);
        // Set default values
        const elements = ['creditUtilizationValue', 'netWorthValue', 'debtSummaryValue', 'savingsValue'];
        elements.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.textContent = 'No data yet';
            element.style.color = '#64748b';
          }
        });
      }
      } catch (error) {
        ErrorHandler.handleFirebaseError(error);
      }
    } else {
      console.log('Firestore disabled in local environment; using default dashboard placeholders.');
  applyLocalDashboardData();
    }
  } else {
    // Reset to default state
    const elements = ['creditUtilizationValue', 'netWorthValue', 'debtSummaryValue', 'savingsValue'];
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = 'No data yet';
        element.style.color = '#64748b';
      }
    });
  }
});

// Profile Modal Logic
const profileButton = document.getElementById('profileButton');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');

console.log('Profile button found:', profileButton);
console.log('Profile modal found:', profileModal);

if (profileButton) {
  profileButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile button clicked, opening modal');
    if (profileModal) {
      profileModal.style.display = 'flex';
      console.log('Modal display set to flex');
      updateProfileStats();
      initializeThemeSelector();
      
      
      // Debug: Check if avatar elements exist
      setTimeout(() => {
        console.log('Avatar container:', document.querySelector('.avatar-container'));
        console.log('Avatar upload button:', document.querySelector('.avatar-upload-btn'));
        console.log('Profile modal visible:', profileModal.style.display);
        console.log('Profile modal computed style:', window.getComputedStyle(profileModal).display);
      }, 100);
    } else {
      console.error('Profile modal not found!');
    }
  });
} else {
  console.error('Profile button not found!');
}
closeProfileModal && closeProfileModal.addEventListener('click', () => {
  profileModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === profileModal) profileModal.style.display = 'none';
});

// Sync profile modal with Firebase
if (USE_FIRESTORE) {
  auth.onAuthStateChanged(async user => {
    if (user) {
      document.getElementById('profileName').textContent = user.displayName || 'User';
      document.getElementById('profileEmail').textContent = user.email;
      const userRef = doc(db, 'users', user.uid);
      onSnapshot(userRef, docSnap => {
        const data = docSnap.data() || {};
        document.getElementById('profileNetWorth').textContent =
          data.netWorth !== undefined ? `$${Number(data.netWorth).toLocaleString()}` : '-';
        document.getElementById('profileCreditUtilization').textContent =
          data.creditUtilization !== undefined ? `${data.creditUtilization}%` : '-';
        document.getElementById('profileTotalDebt').textContent =
          data.totalDebt !== undefined ? `$${Number(data.totalDebt).toLocaleString()}` : '-';
        document.getElementById('profileSavings').textContent =
          data.savingsProgress !== undefined ? `${data.savingsProgress}%` : '-';
      });
    }
  });
}

// Educational Tips Functions
function updateTipDisplay() {
  const tip = financialTips[currentTipIndex];
  document.getElementById('tipCategory').textContent = tip.category;
  document.getElementById('tipNumber').textContent = `${currentTipIndex + 1} of ${financialTips.length}`;
  document.getElementById('tipTitle').textContent = tip.title;
  document.getElementById('tipContent').textContent = tip.content;
  
  // Update navigation dots
  document.querySelectorAll('.nav-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === currentTipIndex);
  });
}

function nextTip() {
  currentTipIndex = (currentTipIndex + 1) % financialTips.length;
  updateTipDisplay();
}

function previousTip() {
  currentTipIndex = currentTipIndex === 0 ? financialTips.length - 1 : currentTipIndex - 1;
  updateTipDisplay();
}

function goToTip(index) {
  currentTipIndex = index;
  updateTipDisplay();
}

function startTipRotation() {
  // Auto-rotate tips every 10 seconds
  setInterval(() => {
    nextTip();
  }, 10000);
}

// Make tip functions globally available
window.nextTip = nextTip;
window.previousTip = previousTip;
window.goToTip = goToTip;

// Avatar and Settings Functions
function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const avatarImg = document.getElementById('profileAvatar');
      avatarImg.src = e.target.result;
      
      // Save to localStorage
      localStorage.setItem('userAvatar', e.target.result);
      
      // Show success message
      showNotification('Avatar updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }
}

function toggleDarkModeSetting() {
  console.log('toggleDarkModeSetting called');
  const darkModeToggle = document.getElementById('settingsDarkMode');
  console.log('Dark mode toggle element:', darkModeToggle);
  
  if (!darkModeToggle) {
    console.error('Dark mode toggle not found!');
    return;
  }
  
  const isDarkMode = darkModeToggle.checked;
  console.log('Dark mode state:', isDarkMode);
  
  if (isDarkMode) {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('darkMode', 'true');
    console.log('Dark mode enabled - body classes:', document.body.className);
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('darkMode', 'false');
    console.log('Dark mode disabled - body classes:', document.body.className);
  }
  
  // Show notification
  showNotification(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`, 'success');
}

function toggleNotifications() {
  const notificationsToggle = document.getElementById('settingsNotifications');
  const enabled = notificationsToggle.checked;
  
  localStorage.setItem('notificationsEnabled', enabled.toString());
  
  if (enabled && 'Notification' in window) {
    Notification.requestPermission();
  }
  
  showNotification(`Notifications ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

function toggleAutoSave() {
  const autoSaveToggle = document.getElementById('settingsAutoSave');
  const enabled = autoSaveToggle.checked;
  
  localStorage.setItem('autoSaveEnabled', enabled.toString());
  showNotification(`Auto-save ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

function toggleShowTips() {
  const showTipsToggle = document.getElementById('settingsShowTips');
  const enabled = showTipsToggle.checked;
  
  localStorage.setItem('showTipsEnabled', enabled.toString());
  
  const tipsSection = document.querySelector('.financial-education');
  if (tipsSection) {
    tipsSection.style.display = enabled ? 'block' : 'none';
  }
  
  showNotification(`Tips ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

// Initialize theme selector as dropdown
function initializeThemeSelector() {
  console.log('[Theme Selector] Initializing dropdown...', {
    hasThemeManager: !!window.themeManager
  });
  
  // Wait for themeManager with retry
  if (!window.themeManager) {
    console.log('[Theme Selector] ThemeManager not available, retrying in 100ms...');
    setTimeout(initializeThemeSelector, 100);
    return;
  }
  
  const button = document.getElementById('themeDropdownButton');
  const menu = document.getElementById('themeDropdownMenu');
  const swatch = document.getElementById('themeDropdownSwatch');
  const text = document.getElementById('themeDropdownText');
  
  if (!button || !menu || !swatch || !text) {
    console.log('[Theme Selector] Elements not found, retrying in 100ms...');
    setTimeout(initializeThemeSelector, 100);
    return;
  }
  
  // Verify themeManager methods exist
  if (typeof window.themeManager.getAvailableThemes !== 'function' ||
      typeof window.themeManager.getThemeInfo !== 'function' ||
      typeof window.themeManager.getThemeColor !== 'function') {
    console.error('[Theme Selector] ThemeManager methods not found');
    return;
  }
  
  // Get themes and current theme
  let themes, currentTheme;
  try {
    themes = window.themeManager.getAvailableThemes();
    currentTheme = window.themeManager.getCurrentTheme();
  } catch (error) {
    console.error('[Theme Selector] Error getting themes:', error);
    return;
  }
  
  if (!themes || themes.length === 0) {
    console.error('[Theme Selector] No themes available');
    return;
  }
  
  // Update button with current theme
  function updateButton() {
    const current = window.themeManager.getCurrentTheme();
    const info = window.themeManager.getThemeInfo(current);
    const color = window.themeManager.getThemeColor(current);
    
    if (info && color) {
      swatch.style.background = color;
      text.textContent = info.name;
    }
  }
  
  // Populate dropdown menu
  menu.innerHTML = '';
  themes.forEach(themeId => {
    try {
      const info = window.themeManager.getThemeInfo(themeId);
      if (!info) return;
      
      const color = window.themeManager.getThemeColor(themeId);
      const isActive = themeId === currentTheme;
      
      const item = document.createElement('div');
      item.className = `theme-dropdown-item ${isActive ? 'active' : ''}`;
      item.setAttribute('data-theme', themeId);
      item.innerHTML = `
        <span class="theme-dropdown-item-swatch" style="background: ${color};"></span>
        <span class="theme-dropdown-item-icon">${info.icon}</span>
        <span class="theme-dropdown-item-name">${info.name}</span>
        ${isActive ? '<span class="theme-dropdown-item-check">✓</span>' : ''}
      `;
      item.onclick = (e) => {
        e.stopPropagation();
        window.themeManager.setTheme(themeId);
        updateButton();
        updateThemeSelector();
        closeDropdown();
        if (typeof showNotification === 'function') {
          showNotification(`Theme changed to ${info.name}`, 'success');
        }
      };
      menu.appendChild(item);
    } catch (error) {
      console.error('[Theme Selector] Error creating theme option:', error);
    }
  });
  
  // Update button initially
  updateButton();
  
  // Toggle dropdown
  function toggleDropdown() {
    const isOpen = menu.classList.contains('show');
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }
  
  function openDropdown() {
    menu.classList.add('show');
    button.classList.add('active');
    button.setAttribute('aria-expanded', 'true');
  }
  
  function closeDropdown() {
    menu.classList.remove('show');
    button.classList.remove('active');
    button.setAttribute('aria-expanded', 'false');
  }
  
  // Event listeners
  button.onclick = (e) => {
    e.stopPropagation();
    toggleDropdown();
  };
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!button.contains(e.target) && !menu.contains(e.target)) {
      closeDropdown();
    }
  });
  
  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('show')) {
      closeDropdown();
    }
  });
  
  console.log('[Theme Selector] Dropdown initialized successfully');
}

// Make function globally available
window.initializeThemeSelector = initializeThemeSelector;

// Make openProfileModal globally available
window.openProfileModal = function() {
  const profileModal = document.getElementById('profileModal');
  if (profileModal) {
    profileModal.style.display = 'flex';
    updateProfileStats();
    // Initialize theme selector with retry logic to ensure themeManager is loaded
    let retries = 0;
    const maxRetries = 20; // 2 seconds total
    const tryInit = () => {
      if (window.themeManager && document.getElementById('themeSelectorList')) {
        initializeThemeSelector();
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(tryInit, 100);
      } else {
        console.error('[Theme Selector] Failed to initialize after', maxRetries, 'retries');
      }
    };
    tryInit();
  }
};

// Update theme selector when theme changes
function updateThemeSelector() {
  if (!window.themeManager) return;
  
  const button = document.getElementById('themeDropdownButton');
  const menu = document.getElementById('themeDropdownMenu');
  const swatch = document.getElementById('themeDropdownSwatch');
  const text = document.getElementById('themeDropdownText');
  
  if (!button || !menu || !swatch || !text) return;
  
  const currentTheme = window.themeManager.getCurrentTheme();
  const info = window.themeManager.getThemeInfo(currentTheme);
  const color = window.themeManager.getThemeColor(currentTheme);
  
  // Update button
  if (info && color) {
    swatch.style.background = color;
    text.textContent = info.name;
  }
  
  // Update menu items
  menu.querySelectorAll('.theme-dropdown-item').forEach(item => {
    const themeId = item.getAttribute('data-theme');
    const isActive = themeId === currentTheme;
    item.classList.toggle('active', isActive);
    
    // Update check mark
    let checkMark = item.querySelector('.theme-dropdown-item-check');
    if (isActive && !checkMark) {
      checkMark = document.createElement('span');
      checkMark.className = 'theme-dropdown-item-check';
      checkMark.textContent = '✓';
      item.appendChild(checkMark);
    } else if (!isActive && checkMark) {
      checkMark.remove();
    }
  });
}

// Listen for theme changes
window.addEventListener('themechange', updateThemeSelector);


function openAdvancedSettings() {
  console.log('Opening Advanced Settings...');
  
  // Check if modal already exists and remove it
  const existingModal = document.querySelector('.advanced-settings-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create advanced settings modal
  const modal = document.createElement('div');
  modal.className = 'advanced-settings-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(30,41,59,0.25);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s;
  `;
  
  modal.innerHTML = `
    <div class="advanced-settings-content" style="
      background: ${document.body.classList.contains('dark') ? '#232946' : '#fff'};
      color: ${document.body.classList.contains('dark') ? '#f4f4f9' : '#1e293b'};
      border-radius: 1.5rem;
      box-shadow: 0 8px 32px rgba(37,99,235,0.12);
      padding: 2rem;
      min-width: 400px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    ">
      <button class="close-advanced-settings" style="
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #64748b;
        cursor: pointer;
      ">&times;</button>
      
      <h2 style="margin: 0 0 1.5rem 0; color: #1e293b; font-size: 1.5rem;">Advanced Settings</h2>
      
      <div class="export-section" style="margin-bottom: 2rem;">
        <h3 style="margin: 0 0 1rem 0; color: #374151; font-size: 1.1rem;">📤 Data Export</h3>
        <p style="margin: 0 0 1rem 0; color: #6b7280; font-size: 0.9rem;">
          Export all your financial data for backup or migration purposes.
        </p>
        
        <div class="export-options" style="display: flex; flex-direction: column; gap: 0.75rem;">
          <button onclick="exportAllData('json')" class="export-btn" style="
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">📄 Export as JSON</button>
          
          <button onclick="exportAllData('csv')" class="export-btn" style="
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">📊 Export as CSV</button>
          
          <button onclick="exportAllData('pdf')" class="export-btn" style="
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">📋 Export as PDF Report</button>
        </div>
      </div>
      
      <div class="data-info" style="
        background: #f8fafc;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
      ">
        <h4 style="margin: 0 0 0.5rem 0; color: #374151; font-size: 0.9rem;">📊 Export Includes:</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #6b7280; font-size: 0.85rem;">
          <li>Debt information and payment history</li>
          <li>Budget data and expense tracking</li>
          <li>Savings goals and progress</li>
          <li>Net worth calculations</li>
          <li>Velocity banking calculations</li>
          <li>Tax calculations (1099)</li>
          <li>User preferences and settings</li>
        </ul>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal handlers
  const closeBtn = modal.querySelector('.close-advanced-settings');
  closeBtn.onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  // Add hover effects to export buttons
  modal.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });
  });
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-weight: 600;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Load saved settings on page load
function loadSettings() {
  // Load dark mode setting
  const darkModeToggle = document.getElementById('settingsDarkMode');
  const darkMode = localStorage.getItem('darkMode') === 'true' || localStorage.getItem('theme') === 'dark';
  if (darkModeToggle) {
    darkModeToggle.checked = darkMode;
  }

  if (darkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  // Load other settings
  const notificationsToggle = document.getElementById('settingsNotifications');
  const autoSaveToggle = document.getElementById('settingsAutoSave');
  const showTipsToggle = document.getElementById('settingsShowTips');
  if (notificationsToggle) {
    notificationsToggle.checked = localStorage.getItem('notificationsEnabled') !== 'false';
  }
  if (autoSaveToggle) {
    autoSaveToggle.checked = localStorage.getItem('autoSaveEnabled') !== 'false';
  }
  if (showTipsToggle) {
    showTipsToggle.checked = localStorage.getItem('showTipsEnabled') !== 'false';
  }

  // Load saved avatar
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    document.getElementById('profileAvatar').src = savedAvatar;
  }
  
  console.log('Settings loaded - Dark mode:', darkMode);
}

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  console.log('Settings loaded successfully');
});

// Debug function to check if elements exist
function debugProfileModal() {
  console.log('Profile modal elements:');
  console.log('Avatar container:', document.querySelector('.avatar-container'));
  console.log('Settings section:', document.querySelector('.profile-settings'));
  console.log('Settings toggles:', document.querySelectorAll('.toggle-switch'));
  console.log('Avatar upload button:', document.querySelector('.avatar-upload-btn'));
}

// Make debug function available globally
window.debugProfileModal = debugProfileModal;

// Function to open profile modal (for the fallback button)
function openProfileModal() {
  console.log('Opening profile modal via fallback button');
  const profileModal = document.getElementById('profileModal');
  if (profileModal) {
    profileModal.style.display = 'flex';
    console.log('Profile modal opened successfully');
    updateProfileStats();
    
    
    // Debug: Check if avatar elements exist
    setTimeout(() => {
      console.log('Avatar container:', document.querySelector('.avatar-container'));
      console.log('Avatar upload button:', document.querySelector('.avatar-upload-btn'));
    }, 100);
  } else {
    console.error('Profile modal not found!');
  }
}

// Function to update profile stats with current data
function updateProfileStats() {
  console.log('Updating profile stats...');
  const currentUser = auth.currentUser;
  if (currentUser) {
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    if (nameEl) {
      nameEl.textContent = currentUser.displayName || 'User';
    }
    if (emailEl) {
      emailEl.textContent = currentUser.email || 'Email';
    }
  }
  
  // Get current financial data from localStorage or calculate from current state
  let netWorth = null;
  let totalDebt = null;
  let creditUtilization = null;
  let savingsProgress = null;
  let totalCreditLimit = null;
  let totalCreditBalance = null;

  const setDebtMetricsFromArray = (debts = []) => {
    if (!Array.isArray(debts)) return;
    const debtBalance = debts.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
    if (!Number.isNaN(debtBalance)) {
      totalDebt = debtBalance;
    }

    const creditCards = debts.filter(debt => debt.type === 'credit');
    const limit = creditCards.reduce((sum, debt) => sum + (parseFloat(debt.limit) || 0), 0);
    const balance = creditCards.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
    totalCreditLimit = limit;
    totalCreditBalance = balance;
    if (limit > 0) {
      creditUtilization = (balance / limit) * 100;
    } else if (creditUtilization === null && balance === 0) {
      creditUtilization = 0;
    }
  };
  
  try {
    // Try to get data from localStorage first
    const debtsData = localStorage.getItem('debts');
    if (debtsData) {
      setDebtMetricsFromArray(JSON.parse(debtsData));
    }

    if (totalDebt === null) {
      const localDebtsData = localStorage.getItem('local_test_debts');
      if (localDebtsData) {
        setDebtMetricsFromArray(JSON.parse(localDebtsData));
      }
    }
    
    // Get net worth data
    const netWorthData = localStorage.getItem('netWorth');
    if (netWorthData) {
      const netWorthObj = JSON.parse(netWorthData);
      if (netWorthObj && netWorthObj.history && netWorthObj.history.length > 0) {
        const latest = netWorthObj.history[netWorthObj.history.length - 1];
        const value = parseFloat(latest.netWorth);
        if (!Number.isNaN(value)) {
          netWorth = value;
        }
      }
    }

    if (netWorth === null) {
      const localNetWorth = localStorage.getItem('local_test_networth');
      if (localNetWorth) {
        const netWorthObj = JSON.parse(localNetWorth);
        if (netWorthObj && netWorthObj.history && netWorthObj.history.length > 0) {
          const latest = netWorthObj.history[netWorthObj.history.length - 1];
          const value = parseFloat(latest.netWorth);
          if (!Number.isNaN(value)) {
            netWorth = value;
          }
        }
      }
    }
    
    // Get savings progress
    const savingsData = localStorage.getItem('savingsGoals');
    if (savingsData) {
      const savings = JSON.parse(savingsData);
      if (Array.isArray(savings) && savings.length > 0) {
        const totalTarget = savings.reduce((sum, goal) => sum + (parseFloat(goal.target) || 0), 0);
        const totalSaved = savings.reduce((sum, goal) => sum + (parseFloat(goal.saved) || 0), 0);
        if (totalTarget > 0) {
          savingsProgress = (totalSaved / totalTarget) * 100;
        } else if (savingsProgress === null) {
          savingsProgress = 0;
        }
      }
    }

    if (savingsProgress === null) {
      const localSavings = localStorage.getItem('local_test_savings');
      if (localSavings) {
        const savings = JSON.parse(localSavings);
        if (Array.isArray(savings) && savings.length > 0) {
          const totalTarget = savings.reduce((sum, goal) => sum + (parseFloat(goal.target) || 0), 0);
          const totalSaved = savings.reduce((sum, goal) => sum + (parseFloat(goal.saved) || 0), 0);
          if (totalTarget > 0) {
            savingsProgress = (totalSaved / totalTarget) * 100;
          } else {
            savingsProgress = 0;
          }
        }
      }
    }

    if (typeof window.getLocalTestData === 'function') {
      try {
        const stats = window.getLocalTestData('userStats');
        if (stats) {
          if (typeof stats.netWorth === 'number') {
            netWorth = stats.netWorth;
          }
          if (typeof stats.totalDebt === 'number') {
            totalDebt = stats.totalDebt;
          }
          if (typeof stats.creditUtilization === 'number') {
            creditUtilization = stats.creditUtilization;
          }
          if (typeof stats.savingsProgress === 'number') {
            savingsProgress = stats.savingsProgress;
          }
        }
      } catch (testDataError) {
        console.warn('Unable to read local test stats:', testDataError);
      }
    }
    
    // Update the profile stats display
    const netWorthElement = document.getElementById('profileNetWorth');
    const totalDebtElement = document.getElementById('profileTotalDebt');
    const creditUtilElement = document.getElementById('profileCreditUtilization');
    const savingsElement = document.getElementById('profileSavings');

    if (netWorthElement) {
      netWorthElement.textContent = Number.isFinite(netWorth) ? `$${Math.round(netWorth).toLocaleString()}` : '-';
    }
    if (totalDebtElement) {
      totalDebtElement.textContent = Number.isFinite(totalDebt) ? `$${Math.round(totalDebt).toLocaleString()}` : '-';
    }
    if (creditUtilElement) {
      creditUtilElement.textContent = Number.isFinite(creditUtilization) ? `${creditUtilization.toFixed(1)}%` : '-';
    }
    if (savingsElement) {
      savingsElement.textContent = Number.isFinite(savingsProgress) ? `${savingsProgress.toFixed(1)}%` : '-';
    }
    
    console.log('Profile stats updated:', {
      netWorth,
      totalDebt,
      creditUtilization,
      savingsProgress
    });
    
  } catch (error) {
    console.error('Error updating profile stats:', error);
    // Set fallback values
    document.getElementById('profileNetWorth').textContent = '-';
    document.getElementById('profileTotalDebt').textContent = '-';
    document.getElementById('profileCreditUtilization').textContent = '-';
    document.getElementById('profileSavings').textContent = '-';
  }
}

// Make functions globally available
window.openProfileModal = openProfileModal;
window.updateProfileStats = updateProfileStats;
window.toggleDarkModeSetting = toggleDarkModeSetting;
window.toggleNotifications = toggleNotifications;
window.toggleAutoSave = toggleAutoSave;
window.toggleShowTips = toggleShowTips;
window.openAdvancedSettings = openAdvancedSettings;

// Add event listener for advanced settings button as backup
document.addEventListener('DOMContentLoaded', function() {
  const advancedSettingsBtn = document.getElementById('advancedSettingsBtn');
  if (advancedSettingsBtn) {
    console.log('Advanced Settings button found, adding event listener');
    advancedSettingsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Advanced Settings button clicked via event listener');
      openAdvancedSettings();
    });
  } else {
    console.log('Advanced Settings button not found on DOMContentLoaded');
  }
});

// Test all profile settings features
function testProfileSettings() {
  console.log('🧪 Testing Profile Settings Features...');
  
  // Test 1: Dark Mode Toggle
  console.log('1. Testing Dark Mode Toggle...');
  const darkModeToggle = document.getElementById('settingsDarkMode');
  if (darkModeToggle) {
    console.log('✅ Dark Mode toggle found');
    console.log('Current state:', darkModeToggle.checked);
  } else {
    console.log('❌ Dark Mode toggle not found');
  }
  
  // Test 2: Notifications Toggle
  console.log('2. Testing Notifications Toggle...');
  const notificationsToggle = document.getElementById('settingsNotifications');
  if (notificationsToggle) {
    console.log('✅ Notifications toggle found');
    console.log('Current state:', notificationsToggle.checked);
  } else {
    console.log('❌ Notifications toggle not found');
  }
  
  // Test 3: Auto-save Toggle
  console.log('3. Testing Auto-save Toggle...');
  const autoSaveToggle = document.getElementById('settingsAutoSave');
  if (autoSaveToggle) {
    console.log('✅ Auto-save toggle found');
    console.log('Current state:', autoSaveToggle.checked);
  } else {
    console.log('❌ Auto-save toggle not found');
  }
  
  // Test 4: Show Tips Toggle
  console.log('4. Testing Show Tips Toggle...');
  const showTipsToggle = document.getElementById('settingsShowTips');
  if (showTipsToggle) {
    console.log('✅ Show Tips toggle found');
    console.log('Current state:', showTipsToggle.checked);
  } else {
    console.log('❌ Show Tips toggle not found');
  }
  
  // Test 5: Avatar Upload
  console.log('5. Testing Avatar Upload...');
  const avatarInput = document.getElementById('avatarInput');
  const avatarImg = document.getElementById('profileAvatar');
  const avatarUploadBtn = document.querySelector('.avatar-upload-btn');
  
  if (avatarInput && avatarImg && avatarUploadBtn) {
    console.log('✅ Avatar upload elements found');
    console.log('Avatar input:', avatarInput);
    console.log('Avatar image:', avatarImg);
    console.log('Upload button:', avatarUploadBtn);
  } else {
    console.log('❌ Some avatar upload elements missing');
  }
  
  // Test 6: Advanced Settings Button
  console.log('6. Testing Advanced Settings Button...');
  const advancedSettingsBtn = document.querySelector('.settings-btn');
  if (advancedSettingsBtn) {
    console.log('✅ Advanced Settings button found');
  } else {
    console.log('❌ Advanced Settings button not found');
  }
  
  // Test 7: Logout Button
  console.log('7. Testing Logout Button...');
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    console.log('✅ Logout button found');
  } else {
    console.log('❌ Logout button not found');
  }
  
  // Test 8: Local Storage
  console.log('8. Testing Local Storage...');
  console.log('Dark mode setting:', localStorage.getItem('darkMode'));
  console.log('Theme setting:', localStorage.getItem('theme'));
  console.log('Notifications setting:', localStorage.getItem('notificationsEnabled'));
  console.log('Auto-save setting:', localStorage.getItem('autoSaveEnabled'));
  console.log('Show tips setting:', localStorage.getItem('showTipsEnabled'));
  console.log('User avatar:', localStorage.getItem('userAvatar') ? 'Present' : 'Not set');
  
  console.log('🧪 Profile Settings Test Complete!');
}

// Test actual functionality of settings
function testSettingsFunctionality() {
  console.log('🔧 Testing Settings Functionality...');
  
  // Test Dark Mode functionality
  console.log('Testing Dark Mode toggle...');
  const darkModeToggle = document.getElementById('settingsDarkMode');
  if (darkModeToggle) {
    const originalState = darkModeToggle.checked;
    darkModeToggle.checked = !originalState;
    toggleDarkModeSetting();
    console.log('Dark mode toggled from', originalState, 'to', darkModeToggle.checked);
    console.log('Body has dark class:', document.body.classList.contains('dark'));
    
    // Toggle back
    darkModeToggle.checked = originalState;
    toggleDarkModeSetting();
    console.log('Dark mode restored to', originalState);
  }
  
  // Test Notifications functionality
  console.log('Testing Notifications toggle...');
  const notificationsToggle = document.getElementById('settingsNotifications');
  if (notificationsToggle) {
    const originalState = notificationsToggle.checked;
    notificationsToggle.checked = !originalState;
    toggleNotifications();
    console.log('Notifications toggled from', originalState, 'to', notificationsToggle.checked);
    console.log('Local storage value:', localStorage.getItem('notificationsEnabled'));
    
    // Toggle back
    notificationsToggle.checked = originalState;
    toggleNotifications();
    console.log('Notifications restored to', originalState);
  }
  
  // Test Auto-save functionality
  console.log('Testing Auto-save toggle...');
  const autoSaveToggle = document.getElementById('settingsAutoSave');
  if (autoSaveToggle) {
    const originalState = autoSaveToggle.checked;
    autoSaveToggle.checked = !originalState;
    toggleAutoSave();
    console.log('Auto-save toggled from', originalState, 'to', autoSaveToggle.checked);
    console.log('Local storage value:', localStorage.getItem('autoSaveEnabled'));
    
    // Toggle back
    autoSaveToggle.checked = originalState;
    toggleAutoSave();
    console.log('Auto-save restored to', originalState);
  }
  
  // Test Show Tips functionality
  console.log('Testing Show Tips toggle...');
  const showTipsToggle = document.getElementById('settingsShowTips');
  if (showTipsToggle) {
    const originalState = showTipsToggle.checked;
    showTipsToggle.checked = !originalState;
    toggleShowTips();
    console.log('Show Tips toggled from', originalState, 'to', showTipsToggle.checked);
    console.log('Local storage value:', localStorage.getItem('showTipsEnabled'));
    
    const tipsSection = document.querySelector('.financial-education');
    console.log('Tips section display:', tipsSection ? tipsSection.style.display : 'Not found');
    
    // Toggle back
    showTipsToggle.checked = originalState;
    toggleShowTips();
    console.log('Show Tips restored to', originalState);
  }
  
  // Test Advanced Settings
  console.log('Testing Advanced Settings button...');
  openAdvancedSettings();
  
  console.log('🔧 Settings Functionality Test Complete!');
}

// Data Export Functions
let jsPDFLoaderPromise = null;

async function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) {
    return window.jspdf.jsPDF;
  }

  if (jsPDFLoaderPromise) {
    return jsPDFLoaderPromise;
  }

  jsPDFLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-jspdf="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.jspdf && window.jspdf.jsPDF) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(new Error('jsPDF loaded but constructor missing'));
        }
      });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load jsPDF script')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.async = true;
    script.dataset.jspdf = 'true';
    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(new Error('jsPDF loaded but constructor missing'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF script'));
    document.head.appendChild(script);
  });

  return jsPDFLoaderPromise;
}

async function exportAllData(format) {
  try {
    showNotification('Preparing data export...', 'info');

    const financialData = await gatherAllFinancialData();
    const summary = calculateSummaryMetrics(financialData);
    const accountInfo = {
      displayName: localStorage.getItem('profileName') || auth?.currentUser?.displayName || "Bradley's Finance Hub Member",
      email: localStorage.getItem('profileEmail') || auth?.currentUser?.email || 'Not linked',
      uid: auth?.currentUser?.uid || '',
      generatedAt: new Date().toISOString()
    };

    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        format: format,
        userAgent: navigator.userAgent
      },
      account: accountInfo,
      userSettings: {
        darkMode: localStorage.getItem('darkMode') === 'true',
        theme: localStorage.getItem('theme'),
        notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
        autoSaveEnabled: localStorage.getItem('autoSaveEnabled') !== 'false',
        showTipsEnabled: localStorage.getItem('showTipsEnabled') !== 'false',
        userAvatar: localStorage.getItem('userAvatar') ? 'Present' : 'Not set'
      },
      financialData,
      summary
    };
    
    if (format === 'json') {
      exportAsJSON(exportData);
    } else if (format === 'csv') {
      exportAsCSV(exportData);
    } else if (format === 'pdf') {
      await exportAsPDF(exportData);
    }
    
    showNotification(`Data exported successfully as ${format.toUpperCase()}!`, 'success');
    
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Export failed. Please try again.', 'error');
  }
}

async function gatherAllFinancialData() {
  const data = {};
  
  // Get data from localStorage (fallback for when Firebase is not available)
  try {
    // Debts
    const debtsData = localStorage.getItem('debts');
    if (debtsData) {
      data.debts = JSON.parse(debtsData);
    }
    
    // Budgets
    const budgetsData = localStorage.getItem('budgets');
    if (budgetsData) {
      data.budgets = JSON.parse(budgetsData);
    }
    
    // Savings Goals
    const savingsData = localStorage.getItem('savingsGoals');
    if (savingsData) {
      data.savingsGoals = JSON.parse(savingsData);
    }
    
    // Net Worth
    const netWorthData = localStorage.getItem('netWorth');
    if (netWorthData) {
      data.netWorth = JSON.parse(netWorthData);
    }
    
    // Velocity Calculations
    const velocityData = localStorage.getItem('velocityCalculations');
    if (velocityData) {
      data.velocityCalculations = JSON.parse(velocityData);
    }
    
    // Tax Calculations
    const taxData = localStorage.getItem('taxCalculations');
    if (taxData) {
      data.taxCalculations = JSON.parse(taxData);
    }
    
    // Activity Logs
    const activityData = localStorage.getItem('activityLogs');
    if (activityData) {
      data.activityLogs = JSON.parse(activityData);
    }
    
  } catch (error) {
    console.warn('Error gathering local data:', error);
  }
  
  return data;
}

function calculateSummaryMetrics(financialData) {
  const metrics = {
    totalDebt: 0,
    creditBalance: 0,
    creditLimit: 0,
    creditUtilization: null,
    netWorth: null,
    netWorthChange: null,
    netWorthChangePercent: null,
    incomeTotal: 0,
    expenseBudgeted: 0,
    expenseActual: 0,
    netCashFlow: null,
    savingsProgress: null,
    savingsTarget: 0,
    savingsSaved: 0
  };

  const datasetCounts = {};

  const debts = Array.isArray(financialData.debts) ? financialData.debts : [];
  datasetCounts.debts = debts.length;
  debts.forEach(debt => {
    const balance = parseFloat(debt.balance) || 0;
    metrics.totalDebt += balance;
    if ((debt.type || '').toLowerCase() === 'credit') {
      metrics.creditBalance += balance;
      metrics.creditLimit += parseFloat(debt.limit) || 0;
    }
  });
  if (metrics.creditLimit > 0) {
    metrics.creditUtilization = (metrics.creditBalance / metrics.creditLimit) * 100;
  } else if (metrics.creditBalance > 0) {
    metrics.creditUtilization = 100;
  } else {
    metrics.creditUtilization = 0;
  }

  let netWorthHistory = [];
  const netWorthRaw = financialData.netWorth;
  if (Array.isArray(netWorthRaw)) {
    netWorthHistory = netWorthRaw;
  } else if (netWorthRaw && typeof netWorthRaw === 'object') {
    if (Array.isArray(netWorthRaw.history)) {
      netWorthHistory = netWorthRaw.history;
    }
  }
  datasetCounts.netWorthHistory = netWorthHistory.length;
  if (netWorthHistory.length) {
    const ordered = netWorthHistory
      .slice()
      .sort((a, b) => new Date(a.date || a.timestamp || 0) - new Date(b.date || b.timestamp || 0));
    const latest = ordered[ordered.length - 1];
    const previous = ordered[ordered.length - 2];
    metrics.netWorth = parseFloat(latest?.netWorth) || 0;
    if (previous) {
      const prevValue = parseFloat(previous.netWorth) || 0;
      const delta = metrics.netWorth - prevValue;
      metrics.netWorthChange = delta;
      if (prevValue !== 0) {
        metrics.netWorthChangePercent = (delta / Math.abs(prevValue)) * 100;
      }
    }
  }

  const savingsGoals = Array.isArray(financialData.savingsGoals) ? financialData.savingsGoals : [];
  datasetCounts.savingsGoals = savingsGoals.length;
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + (parseFloat(goal.saved ?? goal.current ?? 0) || 0), 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + (parseFloat(goal.target ?? 0) || 0), 0);
  metrics.savingsSaved = totalSaved;
  metrics.savingsTarget = totalTarget;
  if (totalTarget > 0) {
    metrics.savingsProgress = (totalSaved / totalTarget) * 100;
  }

  let budgetRecords = [];
  if (Array.isArray(financialData.budgets)) {
    budgetRecords = financialData.budgets;
  } else if (financialData.budgets && typeof financialData.budgets === 'object') {
    budgetRecords = Object.values(financialData.budgets);
  } else if (financialData.budget && typeof financialData.budget === 'object') {
    budgetRecords = [financialData.budget];
  }
  datasetCounts.budgets = budgetRecords.length;

  budgetRecords.forEach(record => {
    const incomes = Array.isArray(record.incomes) ? record.incomes : (Array.isArray(record.income) ? record.income : []);
    incomes.forEach(entry => {
      metrics.incomeTotal += parseFloat(entry.amount) || 0;
    });
    const expenses = Array.isArray(record.expenses) ? record.expenses : [];
    expenses.forEach(exp => {
      metrics.expenseBudgeted += parseFloat(exp.budgeted ?? exp.amount ?? 0) || 0;
      metrics.expenseActual += parseFloat(exp.spent ?? exp.amount ?? 0) || 0;
    });
  });
  metrics.netCashFlow = metrics.incomeTotal - metrics.expenseActual;

  const velocityCalculations = Array.isArray(financialData.velocityCalculations) ? financialData.velocityCalculations : [];
  datasetCounts.velocityCalculations = velocityCalculations.length;

  const taxCalculations = Array.isArray(financialData.taxCalculations) ? financialData.taxCalculations : [];
  datasetCounts.taxCalculations = taxCalculations.length;

  const activityLogs = Array.isArray(financialData.activityLogs) ? financialData.activityLogs : [];
  datasetCounts.activityLogs = activityLogs.length;

  if (typeof window !== 'undefined') {
    try {
      const localStats = typeof window.getLocalTestData === 'function'
        ? window.getLocalTestData('userStats')
        : window.LOCAL_TEST_DATA?.userStats;
      if (localStats) {
        if ((metrics.netWorth ?? null) === null || metrics.netWorth === 0) {
          metrics.netWorth = typeof localStats.netWorth === 'number' ? localStats.netWorth : metrics.netWorth;
        }
        if ((metrics.totalDebt ?? null) === null || metrics.totalDebt === 0) {
          metrics.totalDebt = typeof localStats.totalDebt === 'number' ? localStats.totalDebt : metrics.totalDebt;
        }
        if (metrics.creditUtilization === null || Number.isNaN(metrics.creditUtilization)) {
          if (typeof localStats.creditUtilization === 'number') {
            metrics.creditUtilization = localStats.creditUtilization;
          }
        }
        if (metrics.savingsProgress === null || Number.isNaN(metrics.savingsProgress)) {
          if (typeof localStats.savingsProgress === 'number') {
            metrics.savingsProgress = localStats.savingsProgress;
          }
        }
      }
    } catch (error) {
      console.warn('Unable to merge local summary stats:', error);
    }
  }

  datasetCounts.totalDatasets = Object.values(datasetCounts).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    datasetCounts
  };
}

function exportAsJSON(data) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bradley-financial-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportAsCSV(data) {
  let csvContent = 'Data Type,Field,Value,Timestamp\n';
  
  // Add export info
  csvContent += `Export Info,Format,${data.exportInfo.format},${data.exportInfo.timestamp}\n`;
  csvContent += `Export Info,Version,${data.exportInfo.version},${data.exportInfo.timestamp}\n`;
  
  // Add user settings
  Object.entries(data.userSettings).forEach(([key, value]) => {
    csvContent += `User Settings,${key},${value},${data.exportInfo.timestamp}\n`;
  });
  
  // Add financial data
  Object.entries(data.financialData).forEach(([dataType, dataArray]) => {
    if (Array.isArray(dataArray)) {
      dataArray.forEach((item, index) => {
        Object.entries(item).forEach(([field, value]) => {
          csvContent += `${dataType},${field},${value},${data.exportInfo.timestamp}\n`;
        });
      });
    } else if (typeof dataArray === 'object') {
      Object.entries(dataArray).forEach(([field, value]) => {
        csvContent += `${dataType},${field},${JSON.stringify(value)},${data.exportInfo.timestamp}\n`;
      });
    }
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bradley-financial-data-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportAsPDF(data) {
  try {
    const jsPDFConstructor = await loadJsPDF();
    if (!jsPDFConstructor) {
      throw new Error('Unable to load jsPDF library');
    }

    const doc = new jsPDFConstructor({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 56;
    const marginY = 120;
    let cursorY = marginY;

    const colors = {
      primary: [23, 37, 84],
      accent: [59, 130, 246],
      text: [55, 65, 81],
      muted: [100, 116, 139],
      lightGray: [226, 232, 240]
    };

    const addHeader = () => {
      doc.setFillColor(...colors.primary);
      const headerHeight = 90;
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Bradley's Finance Hub", marginX, 44);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text("Personal Financial Intelligence Suite", marginX, 62);
      if (data.account) {
        const displayName = data.account.displayName || 'Client';
        const email = data.account.email || '';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(displayName, pageWidth - marginX, 40, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        if (email) {
          doc.text(email, pageWidth - marginX, 56, { align: 'right' });
        }
      }
      doc.setTextColor(...colors.text);
    };

    const addFooter = (pageNumber) => {
      doc.setDrawColor(...colors.lightGray);
      doc.setLineWidth(0.5);
      doc.line(marginX, pageHeight - 50, pageWidth - marginX, pageHeight - 50);
      doc.setFontSize(9);
      doc.setTextColor(...colors.muted);
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, pageHeight - 30);
      doc.text(`Confidential · For Bradley's Finance Hub account holder`, marginX, pageHeight - 15);
      doc.text(`Page ${pageNumber}`, pageWidth - marginX - 40, pageHeight - 15);
      doc.setTextColor(...colors.text);
    };

    let pageNumber = 1;
    addHeader();
    addFooter(pageNumber);

    const ensureSpace = (spaceNeeded = 24) => {
      if (cursorY + spaceNeeded > pageHeight - marginY) {
        doc.addPage();
        pageNumber += 1;
        cursorY = marginY;
        addHeader();
        addFooter(pageNumber);
      }
    };

    const addSectionTitle = (title, subtitle = '') => {
      ensureSpace(40);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text(title.toUpperCase(), marginX, cursorY);
      cursorY += 18;
      if (subtitle) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.muted);
        doc.text(subtitle, marginX, cursorY);
        cursorY += 18;
      }
      doc.setDrawColor(...colors.accent);
      doc.setLineWidth(1);
      doc.line(marginX, cursorY - 12, marginX + 200, cursorY - 12);
      doc.setTextColor(...colors.text);
    };

    const addKeyValue = (label, value) => {
      ensureSpace(24);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.muted);
      doc.text(label.toUpperCase(), marginX, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      const lines = doc.splitTextToSize(String(value), pageWidth - marginX * 2);
      doc.text(lines, marginX, cursorY + 14);
      cursorY += 24 + (lines.length - 1) * 12;
    };

    const addParagraph = (text, fontSize = 11) => {
      ensureSpace(24);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      const lines = doc.splitTextToSize(text, pageWidth - marginX * 2);
      lines.forEach(line => {
        ensureSpace(16);
        doc.text(line, marginX, cursorY);
        cursorY += 14;
      });
      cursorY += 6;
    };

    const addMetricCards = (cards = []) => {
      if (!cards.length) return;
      const cardsPerRow = 2;
      const spacing = 20;
      const cardWidth = (pageWidth - marginX * 2 - spacing * (cardsPerRow - 1)) / cardsPerRow;
      const cardHeight = 110;

      cards.forEach((card, index) => {
        const col = index % cardsPerRow;
        if (col === 0) {
          ensureSpace(cardHeight + spacing);
        }
        const cardX = marginX + col * (cardWidth + spacing);
        const cardY = cursorY;

        const fill = card.fill || colors.primary;
        doc.setFillColor(...fill);
        doc.setDrawColor(...fill);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 12, 12, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(card.title, cardX + 16, cardY + 26);

        doc.setFontSize(26);
        doc.text(card.value, cardX + 16, cardY + 62);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text(card.caption, cardX + 16, cardY + 84);

        if (col === cardsPerRow - 1 || index === cards.length - 1) {
          cursorY = cardY + cardHeight + spacing;
        }
      });

      doc.setTextColor(...colors.text);
    };

    const addBulletList = (items = []) => {
      if (!items.length) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      items.forEach(item => {
        ensureSpace(18);
        doc.setFillColor(...colors.accent);
        doc.circle(marginX + 4, cursorY - 4, 2, 'F');
        const lines = doc.splitTextToSize(item, pageWidth - marginX * 2 - 16);
        doc.text(lines, marginX + 14, cursorY);
        cursorY += 14 + (lines.length - 1) * 12;
      });
      cursorY += 6;
    };

    const addTable = (columns = [], rows = []) => {
      if (!columns.length || !rows.length) return;

      ensureSpace(40);
      const startY = cursorY;
      const columnWidth = (pageWidth - marginX * 2) / columns.length;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(...colors.lightGray);
      doc.rect(marginX, startY, pageWidth - marginX * 2, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.primary);
      columns.forEach((column, colIndex) => {
        doc.text(column.toUpperCase(), marginX + columnWidth * colIndex + 6, startY + 16);
      });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      let currentY = startY + 30;

      rows.forEach(row => {
        ensureSpace(30);
        doc.setDrawColor(...colors.lightGray);
        doc.line(marginX, currentY, pageWidth - marginX, currentY);

        row.forEach((cell, colIndex) => {
          const cellText = cell === undefined || cell === null ? '' : String(cell);
          const lines = doc.splitTextToSize(cellText, columnWidth - 12);
          doc.text(lines, marginX + columnWidth * colIndex + 6, currentY + 14);
        });

        currentY += 22;
        cursorY = currentY;
      });

      cursorY += 16;
    };

    const formatCurrency = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '—';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(Number(value));
    };

    const formatPercent = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '—';
      return `${Number(value).toFixed(1)}%`;
    };

    const formatDate = (value) => {
      if (!value) return '—';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString();
    };

    const summary = data.summary || {};
    const metrics = summary.metrics || {};
    const datasetCounts = summary.datasetCounts || {};
    const account = data.account || {};

    addSectionTitle('Executive Summary', 'Snapshot of account health and preferences');

    const metricCards = [
      {
        title: 'Credit Utilization',
        value: formatPercent(metrics.creditUtilization),
        caption: metrics.creditLimit
          ? `${formatCurrency(metrics.creditBalance)} of ${formatCurrency(metrics.creditLimit)} in use`
          : 'No revolving credit on file',
        fill: [59, 130, 246]
      },
      {
        title: 'Total Debt',
        value: formatCurrency(metrics.totalDebt),
        caption: `${datasetCounts.debts || 0} active accounts tracked`,
        fill: [239, 68, 68]
      },
      {
        title: 'Net Worth',
        value: formatCurrency(metrics.netWorth),
        caption: metrics.netWorthChange !== null && metrics.netWorthChange !== undefined
          ? `${metrics.netWorthChange >= 0 ? '+' : ''}${formatCurrency(metrics.netWorthChange)} vs last period`
          : 'Trend pending additional history',
        fill: [16, 185, 129]
      },
      {
        title: 'Savings Progress',
        value: formatPercent(metrics.savingsProgress),
        caption: `Saved ${formatCurrency(metrics.savingsSaved)} of ${formatCurrency(metrics.savingsTarget)}`,
        fill: [168, 85, 247]
      }
    ];

    addMetricCards(metricCards);

    const insightsBoxHeight = 90;
    ensureSpace(insightsBoxHeight + 20);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...colors.lightGray);
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, insightsBoxHeight, 10, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.text('Client Overview', marginX + 18, cursorY + 26);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.text(`Prepared for: ${account.displayName || 'Member'}`, marginX + 18, cursorY + 44);
    doc.text(`Email: ${account.email || 'Not linked'}`, marginX + 18, cursorY + 60);
    doc.text(`User ID: ${account.uid || '—'}`, marginX + 18, cursorY + 76);
    doc.text(`Report generated: ${formatDate(account.generatedAt || summary.generatedAt || data.exportInfo.timestamp)}`, marginX + 300, cursorY + 44);
    doc.text(`Version: ${data.exportInfo.version}`, marginX + 300, cursorY + 60);
    cursorY += insightsBoxHeight + 28;

    addSectionTitle('Executive Overview', 'Narrative summary of current financial posture');
    const overviewBullets = [
      metrics.netWorth !== null
        ? `Net worth is ${formatCurrency(metrics.netWorth)}${metrics.netWorthChange !== null ? ` (${metrics.netWorthChange >= 0 ? '+' : ''}${formatCurrency(metrics.netWorthChange)} since last period).` : '.'}`
        : 'Net worth will appear once asset and debt history is recorded.',
      metrics.netCashFlow !== null
        ? `Cash flow this period: ${formatCurrency(metrics.incomeTotal)} income minus ${formatCurrency(metrics.expenseActual)} spending = ${formatCurrency(metrics.netCashFlow)}.`
        : 'Add income and expenses in the budget tracker to see cash flow.',
      metrics.creditUtilization !== null
        ? `Credit utilization: ${formatPercent(metrics.creditUtilization)} (${formatCurrency(metrics.creditBalance)} used of ${formatCurrency(metrics.creditLimit)} in limits).`
        : 'Link credit accounts to monitor utilization.',
      metrics.savingsProgress !== null
        ? `Savings progress: ${formatCurrency(metrics.savingsSaved)} saved toward ${formatCurrency(metrics.savingsTarget)} (${formatPercent(metrics.savingsProgress)} complete).`
        : 'Create savings goals to track progress toward targets.'
    ];
    addBulletList(overviewBullets);

    addSectionTitle('Data Coverage', 'Overview of datasets included in this export');
    const friendlyLabel = (key) => ({
      debts: 'Debt Accounts',
      budgets: 'Budget Plans',
      savingsGoals: 'Savings Goals',
      netWorthHistory: 'Net Worth Entries',
      velocityCalculations: 'Velocity Strategies',
      taxCalculations: 'Tax Scenarios',
      activityLogs: 'Activity Logs'
    })[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const datasetBullets = Object.entries(datasetCounts)
      .filter(([key, value]) => key !== 'totalDatasets' && value !== undefined && value !== null)
      .map(([key, value]) => `${friendlyLabel(key)} · ${value} record${value === 1 ? '' : 's'}`);

    if (datasetBullets.length) {
      addBulletList(datasetBullets);
    } else {
      addParagraph('No datasets were detected for this account. Use the JSON export for raw data if needed.');
    }

    const debts = Array.isArray(data.financialData.debts) ? data.financialData.debts : [];
    const budgets = (() => {
      if (Array.isArray(data.financialData.budgets)) return data.financialData.budgets;
      if (data.financialData.budgets && typeof data.financialData.budgets === 'object') {
        return Object.values(data.financialData.budgets);
      }
      if (data.financialData.budget && typeof data.financialData.budget === 'object') return [data.financialData.budget];
      return [];
    })();
    const savingsGoals = Array.isArray(data.financialData.savingsGoals) ? data.financialData.savingsGoals : [];
    const netWorthHistory = (() => {
      const raw = data.financialData.netWorth;
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === 'object') {
        if (Array.isArray(raw.history)) return raw.history;
      }
      return [];
    })();
    const activityLogs = Array.isArray(data.financialData.activityLogs) ? data.financialData.activityLogs : [];

    addSectionTitle('Debt Portfolio', 'Top balances and repayment metrics');
    if (debts.length) {
      const topDebts = debts
        .slice()
        .sort((a, b) => (parseFloat(b.balance) || 0) - (parseFloat(a.balance) || 0))
        .slice(0, 4)
        .map(debt => {
          const name = debt.name || 'Account';
          const rate = debt.interestRate !== undefined ? `${Number(debt.interestRate).toFixed(2)}% APR` : 'rate unavailable';
          const payment = debt.minPayment ? ` · $${Number(debt.minPayment).toFixed(2)} minimum payment` : '';
          const type = debt.type ? ` · ${debt.type.toString().toUpperCase()}` : '';
          return `${name}: ${formatCurrency(debt.balance)} outstanding (${rate}${payment}${type})`;
        });
      addBulletList(topDebts);
    } else {
      addParagraph('No debt records were found. Add credit or loan accounts to monitor repayment progress.');
    }

    addSectionTitle('Budget Snapshot', 'Income and spending performance across tracked plans');
    const allExpenses = budgets.flatMap(record => Array.isArray(record.expenses) ? record.expenses : []);
    const allIncomes = budgets.flatMap(record => Array.isArray(record.incomes) ? record.incomes : (Array.isArray(record.income) ? record.income : []));

    addParagraph(`Scheduled income totals ${formatCurrency(metrics.incomeTotal)} while actual spending reached ${formatCurrency(metrics.expenseActual)}. Net cash flow stands at ${formatCurrency(metrics.netCashFlow)}.`);

    const expenseHighlights = allExpenses
      .slice()
      .sort((a, b) => (parseFloat(b.spent ?? b.amount ?? 0) || 0) - (parseFloat(a.spent ?? a.amount ?? 0) || 0))
      .slice(0, 4)
      .map(exp => {
        const spent = formatCurrency(exp.spent ?? exp.amount ?? 0);
        const budgeted = exp.budgeted ? ` vs ${formatCurrency(exp.budgeted)} budgeted` : '';
        const paidFrom = exp.paidFrom ? ` · Paid from ${exp.paidFrom}` : '';
        return `${exp.category || exp.name || 'Expense'}: ${spent}${budgeted}${paidFrom}`;
      });
    if (expenseHighlights.length) {
      addBulletList(expenseHighlights);
    } else {
      addParagraph('No expense items found. Enter income and expenses in the budget tracker to build this section.');
    }

    addSectionTitle('Savings Goal Progress', 'Milestones toward your target balances');
    if (savingsGoals.length) {
      const savingsRows = savingsGoals
        .slice()
        .sort((a, b) => {
          const progressA = (parseFloat(a.saved ?? 0) || 0) / (parseFloat(a.target ?? 1) || 1);
          const progressB = (parseFloat(b.saved ?? 0) || 0) / (parseFloat(b.target ?? 1) || 1);
          return progressB - progressA;
        })
        .slice(0, 4)
        .map(goal => {
          const saved = parseFloat(goal.saved ?? goal.current ?? 0) || 0;
          const target = parseFloat(goal.target ?? 0) || 0;
          const progress = target > 0 ? `${((saved / target) * 100).toFixed(1)}%` : '—';
          const category = goal.category ? `${goal.category} · ` : '';
          const targetDate = goal.targetDate ? ` · Target date ${formatDate(goal.targetDate)}` : '';
          return `${goal.name || 'Goal'}: ${category}${formatCurrency(saved)} saved of ${formatCurrency(target)} (${progress})${targetDate}`;
        });
      addBulletList(savingsRows);
    } else {
      addParagraph('No savings goals recorded. Create goals to visualize growth toward major milestones.');
    }

    addSectionTitle('Net Worth Trend', 'Historical perspective on total assets vs liabilities');
    if (netWorthHistory.length) {
      const historyRows = netWorthHistory
        .slice()
        .sort((a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp))
        .slice(-4)
        .map(entry => {
          const date = formatDate(entry.date || entry.timestamp);
          const assets = formatCurrency(entry.assets ?? entry.totalAssets);
          const liabilities = formatCurrency(entry.liabilities ?? entry.totalLiabilities);
          return `${date}: Net worth ${formatCurrency(entry.netWorth)} (Assets ${assets} · Liabilities ${liabilities})`;
        });
      addBulletList(historyRows);
    } else {
      addParagraph('Net worth history will appear once two or more monthly positions are recorded.');
    }

    addSectionTitle('Recent Activity', 'Most recent account events captured in the system');
    if (activityLogs.length) {
      const activityRows = activityLogs
        .slice()
        .sort((a, b) => new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0))
        .slice(0, 6)
        .map(activity => {
          const date = formatDate(activity.timestamp || activity.date);
          const type = (activity.type || 'activity').toString().replace(/_/g, ' ').toUpperCase();
          return `${date} · ${type} · ${activity.text || activity.description || 'No description provided'}`;
        });
      addBulletList(activityRows);
    } else {
      addParagraph('Activity feed will populate as actions are recorded across the platform.');
    }

    addSectionTitle('Insights & Recommendations', 'Tailored guidance based on your current metrics');
    const recommendations = [];
    if (metrics.creditUtilization !== null && metrics.creditUtilization !== undefined) {
      if (metrics.creditUtilization > 50) {
        recommendations.push('Credit utilization is above 50%. Prioritize paying down revolving balances to improve credit health.');
      } else if (metrics.creditUtilization > 30) {
        recommendations.push('Credit utilization is above 30%. A small pay down will optimize credit scoring models.');
      } else {
        recommendations.push('Credit utilization is in a healthy range. Maintain current habits to preserve credit strength.');
      }
    } else {
      recommendations.push('No credit utilization data available. Link credit accounts to monitor utilization trends.');
    }

    if (metrics.netCashFlow !== null && metrics.netCashFlow !== undefined) {
      if (metrics.netCashFlow < 0) {
        recommendations.push('Spending exceeds income this period. Review budget allocations to identify reduction opportunities.');
      } else if (metrics.netCashFlow < 200) {
        recommendations.push('Cash flow is positive but tight. Consider boosting emergency fund contributions.');
      } else {
        recommendations.push('Cash flow is positive. Allocate surplus toward priority goals or accelerated debt payoff.');
      }
    }

    if (metrics.savingsProgress !== null && metrics.savingsProgress !== undefined) {
      if (metrics.savingsProgress >= 100) {
        recommendations.push('Congratulations on achieving your current savings targets. Create new goals to sustain momentum.');
      } else if (metrics.savingsProgress >= 50) {
        recommendations.push('Savings goals are over halfway funded. Stay consistent to reach completion on schedule.');
      } else {
        recommendations.push('Savings goals are in early stages. Automate transfers to accelerate progress.');
      }
    }

    if (!recommendations.length) {
      recommendations.push('Add financial data across debts, savings, and budgets to unlock personalized insights.');
    }

    addBulletList(recommendations);

    addSectionTitle('Next Steps', 'Continue building financial momentum with Bradley’s Finance Hub');
    addBulletList([
      'Use the JSON export option for a machine-readable backup or advisor hand-off.',
      'Review each dashboard module to update inputs before your next reporting cycle.',
      'Invite accountability partners or advisors to review this PDF and align on action items.'
    ]);

    ensureSpace(50);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text(
      "This report mirrors the Bradley’s Finance Hub dashboard experience. Secure the document and consult trusted professionals as needed.",
      marginX,
      cursorY
    );
    doc.setTextColor(...colors.text);

    doc.save(`bradley-financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    showNotification('PDF export failed. Please try again.', 'error');
  }
}

// Make test functions globally available
window.testProfileSettings = testProfileSettings;
window.testSettingsFunctionality = testSettingsFunctionality;

// Make export functions globally available
window.exportAllData = exportAllData;

// Debug function to check for duplicate elements
function checkForDuplicates() {
  console.log('🔍 Checking for duplicate elements...');
  
  const logoutButtons = document.querySelectorAll('.logout-btn');
  console.log('Logout buttons found:', logoutButtons.length);
  logoutButtons.forEach((btn, index) => {
    console.log(`Logout button ${index + 1}:`, btn);
  });
  
  const profileModals = document.querySelectorAll('#profileModal');
  console.log('Profile modals found:', profileModals.length);
  
  const advancedSettingsButtons = document.querySelectorAll('.settings-btn');
  console.log('Advanced settings buttons found:', advancedSettingsButtons.length);
  
  const darkModeToggles = document.querySelectorAll('#settingsDarkMode');
  console.log('Dark mode toggles found:', darkModeToggles.length);
}

// Make debug function globally available
window.checkForDuplicates = checkForDuplicates;

// Simple test function for advanced settings
function testAdvancedSettings() {
  console.log('🧪 Testing Advanced Settings...');
  console.log('openAdvancedSettings function:', typeof openAdvancedSettings);
  console.log('Advanced Settings button:', document.getElementById('advancedSettingsBtn'));
  
  try {
    openAdvancedSettings();
    console.log('✅ Advanced Settings function executed successfully');
  } catch (error) {
    console.error('❌ Error executing Advanced Settings:', error);
  }
}

// Make test function globally available
window.testAdvancedSettings = testAdvancedSettings;

// Get financial data with Firestore and local storage fallback
async function getFinancialData(userId) {
  // Try Firestore first
  try {
    const firestoreData = await gatherUserData(userId);
    if (firestoreData && Object.keys(firestoreData).length > 0) {
      // Save to local storage as backup
      localStorage.setItem(`financialData_${userId}`, JSON.stringify(firestoreData));
      return firestoreData;
    }
  } catch (error) {
    console.warn('Firestore access failed, trying local storage:', error.message);
  }
  
  // Fallback to local storage
  try {
    const localData = localStorage.getItem(`financialData_${userId}`);
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (error) {
    console.warn('Local storage access failed:', error.message);
  }
  
  // Return default empty data
  return {
    debts: [],
    budget: { expenses: [], incomes: [] },
    netWorth: [],
    savings: []
  };
}

// Gather user data from Firestore
async function gatherUserData(userId) {
  const userData = {};
  
  if (!USE_FIRESTORE) {
    throw new Error('Firestore disabled in local environment');
  }
  
  try {
    // Get debts
    try {
      const debtsRef = doc(db, 'debts', userId);
      const debtsSnap = await getDoc(debtsRef);
      if (debtsSnap.exists()) {
        userData.debts = debtsSnap.data().debts || [];
        console.log('Fetched debts from Firestore:', userData.debts);
        console.log('Sample debt interest rates:', userData.debts.map(d => ({ name: d.name, interestRate: d.interestRate, type: typeof d.interestRate })));
        console.log('First debt full object:', userData.debts[0]);
      } else {
        console.log('No debts document found for user:', userId);
      }
    } catch (error) {
      console.warn('Could not fetch debts:', error.message);
    }
    
    // Get budget
    try {
      const budgetRef = doc(db, 'budgets', userId + '_' + new Date().toISOString().slice(0,7));
      const budgetSnap = await getDoc(budgetRef);
      if (budgetSnap.exists()) {
        userData.budget = budgetSnap.data();
      }
    } catch (error) {
      console.warn('Could not fetch budget:', error.message);
    }
    
    // Get net worth
    try {
      const netWorthRef = doc(db, 'networth', userId);
      const netWorthSnap = await getDoc(netWorthRef);
      if (netWorthSnap.exists()) {
        userData.netWorth = netWorthSnap.data().history || [];
      }
    } catch (error) {
      console.warn('Could not fetch net worth:', error.message);
    }
    
    // Get savings
    try {
      const savingsRef = doc(db, 'savings', userId);
      const savingsSnap = await getDoc(savingsRef);
      if (savingsSnap.exists()) {
        userData.savings = savingsSnap.data().goals || [];
      }
    } catch (error) {
      console.warn('Could not fetch savings:', error.message);
    }
    
  } catch (error) {
    console.error('Error gathering user data:', error);
    throw error; // Re-throw to be handled by caller
  }
  
  return userData;
}

// Render insights
function renderInsights(insights) {
  if (!insights || insights.length === 0) {
    return `
      <div class="info-state">
        <h3>💡 Get Started with Financial Insights</h3>
        <p>Add some financial data using the tools above to get personalized insights and recommendations:</p>
        <ul style="text-align: left; margin: 1rem 0;">
          <li>📋 Use the <strong>Debt Tracker</strong> to add your debts</li>
          <li>💰 Use the <strong>Budget Tracker</strong> to set up your budget</li>
          <li>💎 Use the <strong>Net Worth Tracker</strong> to track your assets</li>
          <li>🎯 Use the <strong>Savings Goal Tracker</strong> to set savings goals</li>
        </ul>
        <p>Once you add some data, we'll provide personalized insights and recommendations!</p>
      </div>
    `;
  }
  
  return insights.map(insight => `
    <div class="insight-card">
      <h3>${insight.title}</h3>
      <div class="insight-data">
        ${Object.entries(insight.data).map(([key, value]) => `
          <div class="data-point">
            <span class="data-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
            <span class="data-value">${formatValue(value)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Render recommendations
function renderRecommendations(recommendations) {
  if (!recommendations || recommendations.length === 0) {
    return `
      <div class="info-state">
        <h3>🎯 Personalized Recommendations</h3>
        <p>Once you start using the financial tools above, we'll analyze your data and provide personalized recommendations to help you:</p>
        <ul style="text-align: left; margin: 1rem 0;">
          <li>💳 Optimize your credit utilization</li>
          <li>📊 Improve your debt payoff strategy</li>
          <li>💰 Better manage your budget</li>
          <li>🎯 Reach your savings goals faster</li>
        </ul>
        <p>Start by adding some financial data using the tools above!</p>
      </div>
    `;
  }
  
  return recommendations.map(rec => `
    <div class="recommendation-card priority-${rec.priority}">
      <div class="recommendation-header">
        <h3>${rec.title}</h3>
        <span class="priority-badge">Priority ${rec.priority}</span>
      </div>
      <p class="recommendation-description">${rec.description}</p>
      <div class="recommendation-action">
        <strong>Action:</strong> ${rec.action}
      </div>
    </div>
  `).join('');
}

// Format values for display
function formatValue(value) {
  if (typeof value === 'number') {
    // Handle currency values (large numbers)
    if (value > 1000) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    // Handle percentages (values less than 1, or specific percentage fields)
    else if (value < 1 || (typeof value === 'number' && value <= 100 && value > 0)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    // Handle regular numbers with appropriate decimal places
    else if (value < 10) {
      return value.toFixed(2);
    } else {
      return value.toFixed(1);
    }
  }
  // Handle objects (like highestInterestDebt)
  if (typeof value === 'object' && value !== null) {
    if (value.name && value.interestRate !== undefined) {
      return `${value.name} (${value.interestRate.toFixed(1)}%)`;
    }
    return JSON.stringify(value);
