/**
 * Trading Journal Rules Compliance Tracker
 * Tracks and analyzes your adherence to trading rules
 */

class RulesComplianceTracker {
  constructor() {
    // Initialize empty arrays to avoid null errors
    this.rules = [];
    this.compliance = [];
    
    // Load data
    this.rules = this.loadRules();
    this.compliance = this.loadCompliance();
    
    console.log('Rules Tracker Initialized:', {
      rulesCount: this.rules.length,
      complianceCount: this.compliance.length
    });
    
    this.initEventListeners();
  }

  // Load saved rules from local storage
  loadRules() {
    const savedRules = localStorage.getItem('tradingJournalRules');
    
    if (savedRules) {
      try {
        return JSON.parse(savedRules);
      } catch (e) {
        console.error('Error parsing saved rules:', e);
        return this.getDefaultRules();
      }
    } else {
      // Default rules if none exist
      return this.getDefaultRules();
    }
  }
  
  // Get default rules
  getDefaultRules() {
    const defaultRules = [
      { 
        id: 'rule-1', 
        title: 'Trade with the trend',
        description: 'Only take trades in the direction of the larger trend',
        impact: 'high'
      },
      { 
        id: 'rule-2', 
        title: 'Risk no more than 2% per trade',
        description: 'Never risk more than 2% of your account on a single trade',
        impact: 'high'
      },
      { 
        id: 'rule-3', 
        title: 'Have a defined stop loss',
        description: 'Every trade must have a defined stop loss before entry',
        impact: 'high'
      },
      { 
        id: 'rule-4', 
        title: 'Trade only during market hours',
        description: 'Avoid trading during pre-market or after-hours sessions',
        impact: 'medium'
      },
      { 
        id: 'rule-5', 
        title: 'Wait for confirmation',
        description: 'Wait for price action confirmation before entering',
        impact: 'medium'
      }
    ];
    
    localStorage.setItem('tradingJournalRules', JSON.stringify(defaultRules));
    return defaultRules;
  }

  // Save rules to local storage
  saveRules() {
    localStorage.setItem('tradingJournalRules', JSON.stringify(this.rules));
  }

  // Load compliance history
  loadCompliance() {
    const savedCompliance = localStorage.getItem('tradingJournalCompliance');
    
    if (savedCompliance) {
      try {
        return JSON.parse(savedCompliance);
      } catch (e) {
        console.error('Error parsing saved compliance:', e);
        return [];
      }
    } else {
      return [];
    }
  }

  // Save compliance history
  saveCompliance() {
    localStorage.setItem('tradingJournalCompliance', JSON.stringify(this.compliance));
  }

  // Add a new trading rule
  addRule(title, description, impact = 'medium') {
    if (!title.trim()) return null;
    
    const id = 'rule-' + Date.now();
    
    const newRule = {
      id,
      title: title.trim(),
      description: description.trim(),
      impact
    };
    
    this.rules.push(newRule);
    this.saveRules();
    this.renderRulesList();
    this.renderRuleComplianceChecklist();
    
    return newRule;
  }

  // Update an existing rule
  updateRule(ruleId, updates) {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { 
        ...this.rules[ruleIndex], 
        ...updates 
      };
      
      this.saveRules();
      this.renderRulesList();
      this.renderRuleComplianceChecklist();
    }
  }

  // Delete a rule
  deleteRule(ruleId) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    this.saveRules();
    this.renderRulesList();
    this.renderRuleComplianceChecklist();
  }

  // Record rule compliance for a trade
  recordCompliance(tradeId, compliantRules, nonCompliantRules) {
    // Add compliance record
    const complianceRecord = {
      tradeId,
      date: new Date().toISOString(),
      compliantRules,
      nonCompliantRules
    };
    
    this.compliance.push(complianceRecord);
    this.saveCompliance();
    
    return complianceRecord;
  }

  // Get compliance rate for a specific rule
  getRuleComplianceRate(ruleId) {
    const allTradesWithRule = this.compliance.filter(record => 
      record.compliantRules.includes(ruleId) || record.nonCompliantRules.includes(ruleId)
    );
    
    if (allTradesWithRule.length === 0) return 0;
    
    const compliantTrades = allTradesWithRule.filter(record => 
      record.compliantRules.includes(ruleId)
    );
    
    return (compliantTrades.length / allTradesWithRule.length) * 100;
  }

  // Get overall compliance rate
  getOverallComplianceRate() {
    if (this.compliance.length === 0) return 0;
    
    const totalRuleChecks = this.compliance.reduce((sum, record) => {
      return sum + record.compliantRules.length + record.nonCompliantRules.length;
    }, 0);
    
    if (totalRuleChecks === 0) return 0;
    
    const totalCompliantRules = this.compliance.reduce((sum, record) => {
      return sum + record.compliantRules.length;
    }, 0);
    
    return (totalCompliantRules / totalRuleChecks) * 100;
  }

  // Get compliance statistics
  getComplianceStats() {
    const totalTrades = this.compliance.length;
    const overallRate = this.getOverallComplianceRate();
    
    // Get rule-specific compliance rates
    const ruleComplianceRates = this.rules.map(rule => {
      return {
        id: rule.id,
        title: rule.title,
        impact: rule.impact,
        complianceRate: this.getRuleComplianceRate(rule.id)
      };
    });
    
    // Sort by compliance rate (ascending)
    ruleComplianceRates.sort((a, b) => a.complianceRate - b.complianceRate);
    
    // Get most and least followed rules
    const mostFollowedRule = [...ruleComplianceRates].sort((a, b) => 
      b.complianceRate - a.complianceRate
    )[0] || null;
    
    const leastFollowedRule = ruleComplianceRates[0] || null;
    
    return {
      totalTrades,
      overallRate,
      ruleComplianceRates,
      mostFollowedRule,
      leastFollowedRule
    };
  }

  // Initialize Event Listeners
  initEventListeners() {
    // NOTE: Removed the redundant inner DOMContentLoaded wrapper
    console.log('Initializing rules compliance event listeners');

    // Add Rule Button
    const addRuleBtn = document.getElementById('add-rule-btn');
    const addRuleForm = document.getElementById('add-rule-form');
    const cancelRuleBtn = document.getElementById('cancel-rule-btn');
    const closeRuleForm = document.getElementById('close-rule-form');

    // Add debug logging
    console.log('Trading Rules Event Listeners Elements:', {
      addRuleBtn: !!addRuleBtn,
      addRuleForm: !!addRuleForm,
      cancelRuleBtn: !!cancelRuleBtn,
      closeRuleForm: !!closeRuleForm
    });

    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => {
        console.log('Add Rule button clicked');
        if (addRuleForm) {
          console.log('Showing add rule form');
          addRuleForm.classList.remove('hidden');
          // Clear potential edit state
          const ruleIdField = document.getElementById('rule-id');
          if (ruleIdField) ruleIdField.value = '';
          const ruleFormTitle = addRuleForm.querySelector('.rule-form-title');
          if (ruleFormTitle) ruleFormTitle.textContent = 'Add New Rule';
          // Reset form fields
          const ruleForm = document.getElementById('rule-form');
          if(ruleForm) ruleForm.reset();
          // Focus on the title field
          document.getElementById('rule-title')?.focus();
        } else {
          console.error('Add rule form (add-rule-form) not found');
        }
      });
    } else {
      console.error('Add rule button (add-rule-btn) not found');
    }

    const hideForm = () => {
      if (addRuleForm) {
        addRuleForm.classList.add('hidden');
        const ruleForm = document.getElementById('rule-form');
        if (ruleForm) ruleForm.reset();
      }
    };

    if (cancelRuleBtn) {
      cancelRuleBtn.addEventListener('click', hideForm);
    }

    if (closeRuleForm) {
      closeRuleForm.addEventListener('click', hideForm);
    }

    // Rule Form Submission
    const ruleForm = document.getElementById('rule-form');
    if (ruleForm) {
      ruleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Rule form submitted');

        const titleInput = document.getElementById('rule-title');
        const descriptionInput = document.getElementById('rule-description');
        const impactInput = document.getElementById('rule-impact');
        const ruleIdInput = document.getElementById('rule-id');

        const title = titleInput ? titleInput.value : '';
        const description = descriptionInput ? descriptionInput.value : '';
        const impact = impactInput ? impactInput.value : 'medium';
        const ruleId = ruleIdInput ? ruleIdInput.value : '';

        if (title.trim()) {
          if (ruleId) {
            // Update existing rule
            console.log(`Updating rule: ${ruleId}`);
            this.updateRule(ruleId, { title, description, impact });
          } else {
            // Add new rule
            console.log(`Adding new rule: ${title}`);
            this.addRule(title, description, impact);
          }

          ruleForm.reset();
          if (addRuleForm) {
            addRuleForm.classList.add('hidden');
          }
        } else {
           console.warn('Rule title is empty, not saving.');
           if(titleInput) titleInput.focus();
        }
      });
    } else {
      console.error('Rule form (rule-form) not found');
    }

    // Event delegation for rule list actions (Edit/Delete)
    // Ensure the container exists before adding the listener
    const rulesListContainer = document.getElementById('trading-rules-list');
    if (rulesListContainer) {
        rulesListContainer.addEventListener('click', (e) => {
            // Edit rule button
            const editBtn = e.target.closest('.rule-edit-btn');
            if (editBtn) {
                const ruleItem = editBtn.closest('.trading-rule-item');
                if (ruleItem) {
                    const ruleId = ruleItem.dataset.ruleId;
                    console.log(`Edit button clicked for rule: ${ruleId}`);
                    this.editRule(ruleId);
                }
            }

            // Delete rule button
            const deleteBtn = e.target.closest('.rule-delete-btn');
            if (deleteBtn) {
                const ruleItem = deleteBtn.closest('.trading-rule-item');
                if (ruleItem) {
                    const ruleId = ruleItem.dataset.ruleId;
                    console.log(`Delete button clicked for rule: ${ruleId}`);
                    if (confirm('Are you sure you want to delete this rule?')) {
                        this.deleteRule(ruleId);
                    }
                }
            }
        });
    } else {
        // If the list container doesn't exist yet, maybe add a mutation observer
        // or rely on renderRulesList to attach listeners if needed, but direct is better.
        console.warn('Could not find trading-rules-list for event delegation initially.');
    }

    // Initial rendering calls (should happen after listeners are set)
    this.renderRulesList();
    this.renderRuleComplianceChecklist();
    this.renderComplianceCharts();
  }

  // Render the rules list in the UI
  renderRulesList() {
    console.log('Rendering rules list', { rules: this.rules });
    
    // Try to get the trading rules list container in multiple ways
    const tradingRulesSection = document.getElementById('trading-rules');
    let rulesListContainer = document.getElementById('trading-rules-list');
    
    // If we couldn't find the container directly, try other means
    if (!rulesListContainer && tradingRulesSection) {
      // Look within the trading rules section
      rulesListContainer = tradingRulesSection.querySelector('#trading-rules-list');
    }
    
    // Try a more general selector if we still can't find it
    if (!rulesListContainer) {
      rulesListContainer = document.querySelector('#trading-rules-list');
    }
    
    if (!rulesListContainer) {
      console.error('Could not find rules list container');
      return;
    }
    
    console.log('Found rules list container:', rulesListContainer);
    
    if (this.rules.length === 0) {
      rulesListContainer.innerHTML = `
        <div class="empty-rules-state">
          <i class="fas fa-clipboard-list"></i>
          <p>You haven't created any trading rules yet.</p>
          <button id="add-first-rule-btn" class="btn-primary">
            <i class="fas fa-plus"></i> Add Your First Rule
          </button>
        </div>
      `;
      
      // Add listener for the "Add First Rule" button
      const addFirstRuleBtn = document.getElementById('add-first-rule-btn');
      if (addFirstRuleBtn) {
        addFirstRuleBtn.addEventListener('click', () => {
          const addRuleForm = document.getElementById('add-rule-form');
          if (addRuleForm) {
            addRuleForm.classList.remove('hidden');
            document.getElementById('rule-title').focus();
          }
        });
      }
      
      return;
    }
    
    // Generate HTML for rules list
    let rulesHtml = '';
    
    this.rules.forEach(rule => {
      // Get compliance rate for this rule
      const complianceRate = this.getRuleComplianceRate(rule.id);
      
      rulesHtml += `
        <div class="trading-rule-item" data-rule-id="${rule.id}">
          <div class="rule-info">
            <div class="rule-title">
              ${rule.title}
              <span class="rule-impact impact-${rule.impact}">${rule.impact}</span>
            </div>
            <div class="rule-description">${rule.description}</div>
            
            <div class="rule-progress-container">
              <div class="rule-progress-bar">
                <div class="rule-progress-fill" style="width: ${complianceRate}%"></div>
              </div>
              <div class="rule-progress-label">
                <span>Compliance Rate</span>
                <span>${complianceRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div class="rule-actions">
            <button class="rule-action-btn rule-edit-btn" title="Edit rule">
              <i class="fas fa-edit"></i>
            </button>
            <button class="rule-action-btn rule-delete-btn" title="Delete rule">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    rulesListContainer.innerHTML = rulesHtml;
    console.log('Updated rules list HTML');

    // Ensure event delegation listener is attached if container was initially missing
    if (rulesListContainer && !this._delegationListenerAttached) {
        rulesListContainer.addEventListener('click', (e) => {
             // Edit rule button
            const editBtn = e.target.closest('.rule-edit-btn');
            if (editBtn) {
                const ruleItem = editBtn.closest('.trading-rule-item');
                if (ruleItem) {
                    const ruleId = ruleItem.dataset.ruleId;
                    this.editRule(ruleId);
                }
            }

            // Delete rule button
            const deleteBtn = e.target.closest('.rule-delete-btn');
            if (deleteBtn) {
                const ruleItem = deleteBtn.closest('.trading-rule-item');
                if (ruleItem) {
                    const ruleId = ruleItem.dataset.ruleId;
                    if (confirm('Are you sure you want to delete this rule?')) {
                        this.deleteRule(ruleId);
                    }
                }
            }
        });
        this._delegationListenerAttached = true; // Flag to prevent multiple attachments
    }
  }

  // Render the compliance checklist in the trade form
  renderRuleComplianceChecklist() {
    const complianceContainer = document.getElementById('rule-compliance-checklist');
    if (!complianceContainer) {
      console.warn('Compliance checklist container not found');
      return;
    }
    
    console.log('Rendering compliance checklist', { rulesCount: this.rules.length });
    
    if (this.rules.length === 0) {
      complianceContainer.innerHTML = `
        <p class="no-rules-message">You haven't created any trading rules yet. Go to the Rules section to create some!</p>
      `;
      return;
    }
    
    let checklistHtml = '';
    
    this.rules.forEach(rule => {
      checklistHtml += `
        <div class="compliance-item">
          <input type="checkbox" id="rule-check-${rule.id}" class="compliance-checkbox" data-rule-id="${rule.id}">
          <label for="rule-check-${rule.id}" class="compliance-label">
            <span class="rule-name">${rule.title}</span>
            <span class="rule-note">${rule.description}</span>
          </label>
        </div>
      `;
    });
    
    complianceContainer.innerHTML = checklistHtml;
    console.log('Updated compliance checklist HTML');
  }

  // Edit an existing rule
  editRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return;
    
    const addRuleForm = document.getElementById('add-rule-form');
    const ruleTitleField = document.getElementById('rule-title');
    const ruleDescriptionField = document.getElementById('rule-description');
    const ruleImpactField = document.getElementById('rule-impact');
    const ruleIdField = document.getElementById('rule-id');
    const ruleFormTitle = document.querySelector('.rule-form-title');
    
    if (addRuleForm && ruleTitleField && ruleDescriptionField && ruleImpactField) {
      // Set form title to Edit mode
      if (ruleFormTitle) {
        ruleFormTitle.textContent = 'Edit Trading Rule';
      }
      
      // Populate form with rule data
      ruleTitleField.value = rule.title;
      ruleDescriptionField.value = rule.description;
      ruleImpactField.value = rule.impact;
      
      // Store rule ID in hidden field if it exists
      if (ruleIdField) {
        ruleIdField.value = rule.id;
      }
      
      // Show the form
      addRuleForm.classList.remove('hidden');
      ruleTitleField.focus();
    }
  }

  // Render compliance charts in the Analytics section
  renderComplianceCharts() {
    const stats = this.getComplianceStats();
    const complianceChartCanvas = document.getElementById('compliance-chart');
    const ruleCorrelationCanvas = document.getElementById('rule-correlation-chart');
    
    if (complianceChartCanvas && typeof Chart !== 'undefined') {
      // Clear any existing chart
      if (window.complianceChart) {
        window.complianceChart.destroy();
      }
      
      // Prepare data for compliance rate by rule
      const labels = stats.ruleComplianceRates.map(r => r.title);
      const data = stats.ruleComplianceRates.map(r => r.complianceRate);
      const colors = stats.ruleComplianceRates.map(r => {
        if (r.complianceRate >= 80) return 'rgba(76, 175, 80, 0.7)';
        if (r.complianceRate >= 50) return 'rgba(255, 152, 0, 0.7)';
        return 'rgba(244, 67, 54, 0.7)';
      });
      
      // Create the chart
      window.complianceChart = new Chart(complianceChartCanvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Compliance Rate (%)',
            data: data,
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Compliance Rate (%)'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const rule = stats.ruleComplianceRates[context.dataIndex];
                  return [
                    `Compliance: ${rule.complianceRate.toFixed(1)}%`,
                    `Impact: ${rule.impact}`
                  ];
                }
              }
            }
          }
        }
      });
    }
    
    // Update statistics in the UI
    this.updateStatistics(stats);
  }

  // Update the statistics display in the UI
  updateStatistics(stats) {
    // Update overall compliance rate
    const overallRateElement = document.getElementById('overall-compliance-rate');
    if (overallRateElement) {
      overallRateElement.textContent = `${stats.overallRate.toFixed(1)}%`;
    }
    
    // Update total trades
    const totalTradesElement = document.getElementById('compliance-total-trades');
    if (totalTradesElement) {
      totalTradesElement.textContent = stats.totalTrades;
    }
    
    // Update most followed rule
    const mostFollowedElement = document.getElementById('most-followed-rule');
    if (mostFollowedElement && stats.mostFollowedRule) {
      mostFollowedElement.textContent = `${stats.mostFollowedRule.title} (${stats.mostFollowedRule.complianceRate.toFixed(1)}%)`;
    } else if (mostFollowedElement) {
      mostFollowedElement.textContent = 'None';
    }
    
    // Update least followed rule
    const leastFollowedElement = document.getElementById('least-followed-rule');
    if (leastFollowedElement && stats.leastFollowedRule) {
      leastFollowedElement.textContent = `${stats.leastFollowedRule.title} (${stats.leastFollowedRule.complianceRate.toFixed(1)}%)`;
    } else if (leastFollowedElement) {
      leastFollowedElement.textContent = 'None';
    }
  }
}

// Initialize the Rules Compliance Tracker when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded - Initializing Rules Compliance Tracker');
  if (!window.rulesTracker) { // Prevent double initialization
      window.rulesTracker = new RulesComplianceTracker();
  } else {
      console.warn('Rules Tracker already initialized.');
  }

  // Removed the trade form onsubmit override from here - it should be in app.js or similar

  // Add direct navigation event handlers to force UI refresh
  document.querySelectorAll('nav a[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
      // Standard navigation logic should handle showing/hiding sections
      // We just need to ensure the relevant components are re-rendered if needed
      const targetSectionId = this.getAttribute('data-section');
      console.log(`Navigation link clicked for section: ${targetSectionId}`);

      // Use a small timeout to allow the section transition to potentially start
      setTimeout(() => {
          if (window.rulesTracker) {
              if (targetSectionId === 'trading-rules') {
                  console.log('Refreshing Trading Rules section UI');
                  window.rulesTracker.renderRulesList();
                  window.rulesTracker.renderComplianceCharts();
              } else if (targetSectionId === 'new-trade') {
                  console.log('Refreshing New Trade section UI (compliance checklist)');
                  window.rulesTracker.renderRuleComplianceChecklist();
              }
          }
      }, 50); // Short delay
    });
  });
});