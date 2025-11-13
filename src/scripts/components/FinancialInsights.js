/**
 * Financial Insights Component
 * Handles rendering financial insights and recommendations
 */

export class FinancialInsights {
  constructor() {
    this.insights = [];
    this.recommendations = [];
  }

  /**
   * Render insights to the DOM
   * @param {Array} insights - Array of insight objects
   * @param {HTMLElement} container - Container element to render into
   */
  renderInsights(insights, container) {
    if (!insights || insights.length === 0) {
      container.innerHTML = `
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
      return;
    }

    this.insights = insights;
    container.innerHTML = insights.map(insight => `
      <div class="insight-card">
        <h3>${insight.title}</h3>
        <div class="insight-data">
          ${Object.entries(insight.data).map(([key, value]) => `
            <div class="data-point">
              <span class="data-label">${this.formatKey(key)}:</span>
              <span class="data-value">${this.formatValue(value)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Render recommendations to the DOM
   * @param {Array} recommendations - Array of recommendation objects
   * @param {HTMLElement} container - Container element to render into
   */
  renderRecommendations(recommendations, container) {
    if (!recommendations || recommendations.length === 0) {
      container.innerHTML = `
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
      return;
    }

    this.recommendations = recommendations;
    container.innerHTML = recommendations.map(rec => `
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

  /**
   * Format a key for display (convert camelCase to Title Case)
   * @param {string} key - Key to format
   * @returns {string} Formatted key
   */
  formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  /**
   * Format a value for display
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
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
    }
    return value;
  }
}

// Export singleton instance
export const financialInsights = new FinancialInsights();

// Make globally available
window.FinancialInsights = FinancialInsights;
window.financialInsights = financialInsights;

