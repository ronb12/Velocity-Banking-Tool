/**
 * Data Export Component
 * Handles exporting financial data in various formats (JSON, CSV, PDF)
 */

export class DataExport {
  constructor() {
    this.jsPDFLoaderPromise = null;
  }

  /**
   * Load jsPDF library dynamically
   * @returns {Promise} Promise that resolves with jsPDF constructor
   */
  async loadJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) {
      return window.jspdf.jsPDF;
    }

    if (this.jsPDFLoaderPromise) {
      return this.jsPDFLoaderPromise;
    }

    this.jsPDFLoaderPromise = new Promise((resolve, reject) => {
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

    return this.jsPDFLoaderPromise;
  }

  /**
   * Export all financial data
   * @param {string} format - Export format ('json', 'csv', or 'pdf')
   * @param {Function} showNotification - Notification function
   * @param {Function} gatherAllFinancialData - Function to gather data
   * @param {Function} calculateSummaryMetrics - Function to calculate metrics
   */
  async exportAllData(format, showNotification, gatherAllFinancialData, calculateSummaryMetrics) {
    try {
      showNotification('Preparing data export...', 'info');

      const financialData = await gatherAllFinancialData();
      const summary = calculateSummaryMetrics(financialData);
      const accountInfo = {
        displayName: localStorage.getItem('profileName') || window.auth?.currentUser?.displayName || "Bradley's Finance Hub Member",
        email: localStorage.getItem('profileEmail') || window.auth?.currentUser?.email || 'Not linked',
        uid: window.auth?.currentUser?.uid || '',
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
        this.exportAsJSON(exportData);
      } else if (format === 'csv') {
        this.exportAsCSV(exportData);
      } else if (format === 'pdf') {
        await this.exportAsPDF(exportData);
      }
      
      showNotification(`Data exported successfully as ${format.toUpperCase()}!`, 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Export failed. Please try again.', 'error');
    }
  }

  /**
   * Export data as JSON
   * @param {Object} data - Data to export
   */
  exportAsJSON(data) {
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

  /**
   * Export data as CSV
   * @param {Object} data - Data to export
   */
  exportAsCSV(data) {
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
        dataArray.forEach((item) => {
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

  /**
   * Export data as PDF
   * @param {Object} data - Data to export
   */
  async exportAsPDF(data) {
    try {
      const jsPDFConstructor = await this.loadJsPDF();
      if (!jsPDFConstructor) {
        throw new Error('Unable to load jsPDF library');
      }

      // This is a simplified version - the full PDF export logic would go here
      // For now, we'll create a basic PDF
      const doc = new jsPDFConstructor({ unit: 'pt', format: 'letter' });
      
      doc.setFontSize(22);
      doc.text("Bradley's Finance Hub - Financial Report", 50, 50);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 50, 80);
      
      // Add more content here based on the full export logic
      
      doc.save(`bradley-financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataExport = new DataExport();

// Make globally available
window.DataExport = DataExport;
window.dataExport = dataExport;

