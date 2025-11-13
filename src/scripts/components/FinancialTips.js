/**
 * Financial Tips Component
 * Handles displaying and rotating financial education tips
 */

export class FinancialTips {
  constructor() {
    this.tips = [];
    this.currentTipIndex = 0;
    this.rotationInterval = null;
  }

  /**
   * Initialize tips
   * @param {Array} tips - Array of tip objects
   */
  init(tips) {
    this.tips = tips || [];
    this.currentTipIndex = 0;
    this.updateTipDisplay();
    this.startTipRotation();
  }

  /**
   * Update the tip display
   */
  updateTipDisplay() {
    if (this.tips.length === 0) {
      return;
    }
    
    const tip = this.tips[this.currentTipIndex];
    if (!tip) {
      return;
    }

    const categoryEl = document.getElementById('tipCategory');
    const numberEl = document.getElementById('tipNumber');
    const titleEl = document.getElementById('tipTitle');
    const contentEl = document.getElementById('tipContent');

    if (categoryEl) categoryEl.textContent = tip.category;
    if (numberEl) numberEl.textContent = `${this.currentTipIndex + 1} of ${this.tips.length}`;
    if (titleEl) titleEl.textContent = tip.title;
    if (contentEl) contentEl.textContent = tip.content;
    
    // Update navigation dots
    document.querySelectorAll('.nav-dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentTipIndex);
    });
  }

  /**
   * Go to next tip
   */
  nextTip() {
    this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
    this.updateTipDisplay();
  }

  /**
   * Go to previous tip
   */
  previousTip() {
    if (this.currentTipIndex === 0) {
      this.currentTipIndex = this.tips.length - 1;
    } else {
      this.currentTipIndex = this.currentTipIndex - 1;
    }
    this.updateTipDisplay();
  }

  /**
   * Go to specific tip
   * @param {number} index - Tip index
   */
  goToTip(index) {
    if (index >= 0 && index < this.tips.length) {
      this.currentTipIndex = index;
      this.updateTipDisplay();
    }
  }

  /**
   * Start auto-rotation of tips
   */
  startTipRotation() {
    this.stopTipRotation();
    // Auto-rotate tips every 10 seconds
    this.rotationInterval = setInterval(() => {
      this.nextTip();
    }, 10000);
  }

  /**
   * Stop auto-rotation of tips
   */
  stopTipRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }
}

// Export singleton instance
export const financialTips = new FinancialTips();

// Make globally available
window.FinancialTips = FinancialTips;
window.financialTips = financialTips;

// Export functions for backward compatibility
window.nextTip = () => financialTips.nextTip();
window.previousTip = () => financialTips.previousTip();
window.goToTip = (index) => financialTips.goToTip(index);

