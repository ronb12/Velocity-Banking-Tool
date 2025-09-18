// Accessibility Enhancement Utilities
class AccessibilityUtils {
  constructor() {
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusTrapStack = [];
    this.announcer = null;
  }
  
  // Initialize accessibility features
  init() {
    this.setupKeyboardNavigation();
    this.setupARIALabels();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
    this.setupHighContrastMode();
    this.setupReducedMotion();
    this.createLiveRegion();
  }
  
  // Setup keyboard navigation
  setupKeyboardNavigation() {
    // Handle Tab key navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      } else if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      } else if (e.key === 'Enter' || e.key === ' ') {
        this.handleActivationKey(e);
      }
    });
    
    // Add focus indicators
    this.addFocusIndicators();
  }
  
  // Handle Tab navigation
  handleTabNavigation(e) {
    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  // Handle Escape key
  handleEscapeKey(e) {
    // Close any open modals or dropdowns
    const modals = document.querySelectorAll('.modal, .profile-modal, .dropdown');
    modals.forEach(modal => {
      if (modal.style.display !== 'none' && modal.style.display !== '') {
        modal.style.display = 'none';
        // Return focus to trigger element
        const trigger = document.querySelector(`[aria-controls="${modal.id}"]`);
        if (trigger) trigger.focus();
      }
    });
  }
  
  // Handle Enter and Space key activation
  handleActivationKey(e) {
    const target = e.target;
    
    // Handle custom button elements
    if (target.getAttribute('role') === 'button' && !target.disabled) {
      e.preventDefault();
      target.click();
    }
    
    // Handle card elements that act as buttons
    if (target.classList.contains('tool-card') || target.classList.contains('stat-tile')) {
      e.preventDefault();
      target.click();
    }
  }
  
  // Add focus indicators
  addFocusIndicators() {
    const style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
      }
      
      .focus-visible {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #2563eb;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Setup ARIA labels and roles
  setupARIALabels() {
    // Add skip link
    this.addSkipLink();
    
    // Add ARIA labels to interactive elements
    this.addARIALabels();
    
    // Setup landmark roles
    this.setupLandmarks();
  }
  
  // Add skip link for keyboard users
  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  // Add ARIA labels to elements
  addARIALabels() {
    // Tool cards
    document.querySelectorAll('.tool-card').forEach((card, index) => {
      const title = card.querySelector('h3');
      const description = card.querySelector('p');
      
      if (title && description) {
        card.setAttribute('aria-label', `${title.textContent}: ${description.textContent}`);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
      }
    });
    
    // Stat tiles
    document.querySelectorAll('.stat-tile').forEach(tile => {
      const title = tile.querySelector('h3');
      const value = tile.querySelector('.stat-value');
      
      if (title && value) {
        tile.setAttribute('aria-label', `${title.textContent}: ${value.textContent}`);
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
      }
    });
    
    // Buttons
    document.querySelectorAll('button').forEach(button => {
      if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
        button.setAttribute('aria-label', 'Button');
      }
    });
    
    // Form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
          input.setAttribute('aria-labelledby', label.id || 'label-' + input.id);
        } else {
          input.setAttribute('aria-label', input.placeholder || input.name || 'Input field');
        }
      }
    });
  }
  
  // Setup landmark roles
  setupLandmarks() {
    const header = document.querySelector('header');
    if (header) header.setAttribute('role', 'banner');
    
    const main = document.querySelector('main') || document.querySelector('.dashboard');
    if (main) {
      main.setAttribute('role', 'main');
      main.id = 'main-content';
    }
    
    const nav = document.querySelector('nav');
    if (nav) nav.setAttribute('role', 'navigation');
    
    const footer = document.querySelector('footer');
    if (footer) footer.setAttribute('role', 'contentinfo');
  }
  
  // Setup focus management
  setupFocusManagement() {
    // Track focus changes
    document.addEventListener('focusin', (e) => {
      this.announceFocusChange(e.target);
    });
    
    // Handle focus trapping in modals
    this.setupFocusTrapping();
  }
  
  // Announce focus changes to screen readers
  announceFocusChange(element) {
    const label = this.getElementLabel(element);
    if (label) {
      this.announce(label);
    }
  }
  
  // Get accessible label for element
  getElementLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('aria-labelledby') ||
           element.textContent?.trim() ||
           element.alt ||
           element.title;
  }
  
  // Setup focus trapping for modals
  setupFocusTrapping() {
    const modals = document.querySelectorAll('.modal, .profile-modal');
    
    modals.forEach(modal => {
      const focusableElements = modal.querySelectorAll(this.focusableElements);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      });
    });
  }
  
  // Setup screen reader support
  setupScreenReaderSupport() {
    // Create live region for announcements
    this.createLiveRegion();
    
    // Add screen reader only text
    this.addScreenReaderOnlyText();
    
    // Setup form validation announcements
    this.setupFormValidationAnnouncements();
  }
  
  // Create live region for announcements
  createLiveRegion() {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.announcer);
  }
  
  // Announce message to screen readers
  announce(message) {
    if (this.announcer) {
      this.announcer.textContent = message;
      setTimeout(() => {
        this.announcer.textContent = '';
      }, 1000);
    }
  }
  
  // Add screen reader only text
  addScreenReaderOnlyText() {
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
      
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Setup form validation announcements
  setupFormValidationAnnouncements() {
    document.addEventListener('invalid', (e) => {
      const message = e.target.validationMessage;
      this.announce(`Error: ${message}`);
    });
    
    document.addEventListener('input', (e) => {
      if (e.target.checkValidity()) {
        this.announce('Field is valid');
      }
    });
  }
  
  // Setup high contrast mode support
  setupHighContrastMode() {
    // Check for high contrast mode
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast');
    }
    
    // Listen for changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      if (e.matches) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    });
  }
  
  // Setup reduced motion support
  setupReducedMotion() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }
    
    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (e.matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });
  }
  
  // Get focusable elements
  getFocusableElements() {
    return Array.from(document.querySelectorAll(this.focusableElements))
      .filter(element => {
        return !element.disabled && 
               !element.hidden && 
               element.offsetParent !== null;
      });
  }
  
  // Focus first focusable element
  focusFirst() {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
  
  // Focus last focusable element
  focusLast() {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }
  
  // Focus element by ID
  focusElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    }
  }
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + M: Focus main content
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        this.focusElement('main-content');
      }
      
      // Alt + N: Focus navigation
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        const nav = document.querySelector('nav');
        if (nav) nav.focus();
      }
      
      // Alt + H: Go to home
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = 'index.html';
      }
    });
  }
  
  // Initialize all accessibility features
  initAll() {
    this.init();
    this.setupKeyboardShortcuts();
    
    // Announce page load
    this.announce('Page loaded');
  }
}

// Create global instance and initialize
window.AccessibilityUtils = new AccessibilityUtils();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AccessibilityUtils.initAll();
  });
} else {
  window.AccessibilityUtils.initAll();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityUtils;
}
