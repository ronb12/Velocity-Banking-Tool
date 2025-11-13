/**
 * Profile Modal Component
 * Handles user profile display and settings
 */

export class ProfileModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    this.modal = document.getElementById('profileModal');
    if (!this.modal) {
      console.warn('[ProfileModal] Modal element not found');
      return;
    }

    this.setupEventListeners();
    this.isInitialized = true;
  }

  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById('closeProfileModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  open() {
    if (!this.modal) {
      this.init();
    }
    
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.updateProfileStats();
      this.initializeThemeSelector();
    }
  }

  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  isOpen() {
    return this.modal && this.modal.style.display === 'flex';
  }

  updateProfileStats() {
    // Update profile statistics
    // This would be called from the main dashboard
    if (typeof window.updateProfileStats === 'function') {
      window.updateProfileStats();
    }
  }

  initializeThemeSelector() {
    // Initialize theme selector when modal opens
    if (typeof window.initializeThemeSelector === 'function') {
      window.initializeThemeSelector();
    }
  }
}

// Export singleton instance
export const profileModal = new ProfileModal();

// Make globally available
window.ProfileModal = ProfileModal;
window.profileModal = profileModal;

