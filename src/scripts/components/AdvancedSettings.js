/**
 * Advanced Settings Component
 * Handles advanced settings modal and functionality
 */

export class AdvancedSettings {
  constructor() {
    this.modal = null;
    this.isOpen = false;
  }

  /**
   * Open advanced settings modal
   */
  openAdvancedSettings() {
    // Check if modal already exists
    let modal = document.getElementById('advancedSettingsModal');
    
    if (!modal) {
      // Create modal
      modal = document.createElement('div');
      modal.id = 'advancedSettingsModal';
      modal.className = 'modal';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h2>⚙️ Advanced Settings</h2>
            <button class="close-btn" id="closeAdvancedSettings">&times;</button>
          </div>
          <div class="modal-body">
            <div class="settings-section">
              <h3>Data Management</h3>
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enableAutoBackup" checked>
                  Enable automatic data backup
                </label>
                <p class="setting-description">Automatically backup your data to cloud storage</p>
              </div>
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enableDataSync" checked>
                  Enable data synchronization
                </label>
                <p class="setting-description">Sync your data across all devices</p>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Performance</h3>
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enableCaching" checked>
                  Enable browser caching
                </label>
                <p class="setting-description">Cache data locally for faster loading</p>
              </div>
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enableLazyLoading" checked>
                  Enable lazy loading
                </label>
                <p class="setting-description">Load content as needed for better performance</p>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Privacy & Security</h3>
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enableAnalytics" checked>
                  Enable analytics
                </label>
                <p class="setting-description">Help us improve by sharing anonymous usage data</p>
              </div>
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enableErrorReporting" checked>
                  Enable error reporting
                </label>
                <p class="setting-description">Automatically report errors to help fix issues</p>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Experimental Features</h3>
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enableBetaFeatures">
                  Enable beta features
                </label>
                <p class="setting-description">Try out new features before they're released</p>
              </div>
            </div>
            
            <div class="settings-actions">
              <button class="btn btn-primary" id="saveAdvancedSettings">Save Settings</button>
              <button class="btn btn-secondary" id="resetAdvancedSettings">Reset to Defaults</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add styles if not already present
      if (!document.getElementById('advancedSettingsStyles')) {
        const style = document.createElement('style');
        style.id = 'advancedSettingsStyles';
        style.textContent = `
          #advancedSettingsModal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
          }
          #advancedSettingsModal .modal-content {
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          #advancedSettingsModal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          #advancedSettingsModal .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
          }
          #advancedSettingsModal .close-btn {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #advancedSettingsModal .close-btn:hover {
            color: #1f2937;
          }
          #advancedSettingsModal .settings-section {
            margin-bottom: 24px;
          }
          #advancedSettingsModal .settings-section h3 {
            margin-bottom: 12px;
            font-size: 1.1rem;
            color: #374151;
          }
          #advancedSettingsModal .setting-item {
            margin-bottom: 16px;
          }
          #advancedSettingsModal .setting-item label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-weight: 500;
          }
          #advancedSettingsModal .setting-item input[type="checkbox"] {
            margin-right: 8px;
            width: 18px;
            height: 18px;
            cursor: pointer;
          }
          #advancedSettingsModal .setting-description {
            margin: 4px 0 0 26px;
            font-size: 0.875rem;
            color: #6b7280;
          }
          #advancedSettingsModal .settings-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          #advancedSettingsModal .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }
          #advancedSettingsModal .btn-primary {
            background: #2563eb;
            color: white;
          }
          #advancedSettingsModal .btn-primary:hover {
            background: #1d4ed8;
          }
          #advancedSettingsModal .btn-secondary {
            background: #e5e7eb;
            color: #374151;
          }
          #advancedSettingsModal .btn-secondary:hover {
            background: #d1d5db;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Add event listeners
      const closeBtn = modal.querySelector('#closeAdvancedSettings');
      const saveBtn = modal.querySelector('#saveAdvancedSettings');
      const resetBtn = modal.querySelector('#resetAdvancedSettings');
      
      closeBtn.addEventListener('click', () => this.closeAdvancedSettings());
      saveBtn.addEventListener('click', () => this.saveAdvancedSettings());
      resetBtn.addEventListener('click', () => this.resetAdvancedSettings());
      
      // Close on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAdvancedSettings();
        }
      });
      
      // Load current settings
      this.loadAdvancedSettings();
    }
    
    this.modal = modal;
    modal.style.display = 'flex';
    this.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close advanced settings modal
   */
  closeAdvancedSettings() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.isOpen = false;
      document.body.style.overflow = '';
    }
  }

  /**
   * Load advanced settings from localStorage
   */
  loadAdvancedSettings() {
    if (!this.modal) return;
    
    const settings = {
      enableAutoBackup: localStorage.getItem('advanced_autoBackup') !== 'false',
      enableDataSync: localStorage.getItem('advanced_dataSync') !== 'false',
      enableCaching: localStorage.getItem('advanced_caching') !== 'false',
      enableLazyLoading: localStorage.getItem('advanced_lazyLoading') !== 'false',
      enableAnalytics: localStorage.getItem('advanced_analytics') !== 'false',
      enableErrorReporting: localStorage.getItem('advanced_errorReporting') !== 'false',
      enableBetaFeatures: localStorage.getItem('advanced_betaFeatures') === 'true',
    };
    
    // Apply to checkboxes
    Object.entries(settings).forEach(([key, value]) => {
      const checkbox = this.modal.querySelector(`#${key}`);
      if (checkbox) {
        checkbox.checked = value;
      }
    });
  }

  /**
   * Save advanced settings to localStorage
   */
  saveAdvancedSettings() {
    if (!this.modal) return;
    
    const settings = {
      autoBackup: this.modal.querySelector('#enableAutoBackup').checked,
      dataSync: this.modal.querySelector('#enableDataSync').checked,
      caching: this.modal.querySelector('#enableCaching').checked,
      lazyLoading: this.modal.querySelector('#enableLazyLoading').checked,
      analytics: this.modal.querySelector('#enableAnalytics').checked,
      errorReporting: this.modal.querySelector('#enableErrorReporting').checked,
      betaFeatures: this.modal.querySelector('#enableBetaFeatures').checked,
    };
    
    // Save to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(`advanced_${key}`, value.toString());
    });
    
    // Show notification
    if (typeof window.showNotification === 'function') {
      window.showNotification('Advanced settings saved successfully!', 'success');
    }
    
    this.closeAdvancedSettings();
  }

  /**
   * Reset advanced settings to defaults
   */
  resetAdvancedSettings() {
    if (!this.modal) return;
    
    if (confirm('Are you sure you want to reset all advanced settings to defaults?')) {
      // Clear advanced settings from localStorage
      const keys = ['autoBackup', 'dataSync', 'caching', 'lazyLoading', 'analytics', 'errorReporting', 'betaFeatures'];
      keys.forEach(key => {
        localStorage.removeItem(`advanced_${key}`);
      });
      
      // Reload settings
      this.loadAdvancedSettings();
      
      // Show notification
      if (typeof window.showNotification === 'function') {
        window.showNotification('Advanced settings reset to defaults', 'info');
      }
    }
  }
}

// Export singleton instance
export const advancedSettings = new AdvancedSettings();

// Make globally available
window.AdvancedSettings = AdvancedSettings;
window.advancedSettings = advancedSettings;
window.openAdvancedSettings = () => advancedSettings.openAdvancedSettings();

