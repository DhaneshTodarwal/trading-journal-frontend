// Trading Journal - Main JavaScript

// DOM Elements
const tradeForm = document.getElementById('trade-form');
const tradesList = document.getElementById('trades-list');
const searchInput = document.getElementById('search');
const filterSelect = document.getElementById('filter');
const sortSelect = document.getElementById('sort');
const winRateElement = document.getElementById('win-rate');
const totalTradesElement = document.getElementById('total-trades');
const avgReturnElement = document.getElementById('avg-return');
const netProfitElement = document.getElementById('net-profit');

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3000/api'; // Your backend API URL

// --- New DOM Element References (Auth & Dashboard) ---
const authSection = document.getElementById('auth-section');
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const loginErrorMsg = document.getElementById('login-error');
const signupErrorMsg = document.getElementById('signup-error');
const dashboardSection = document.getElementById('dashboard-section');
const userInfo = document.getElementById('user-info');
const userEmailDisplay = document.getElementById('user-email-display');
const logoutButton = document.getElementById('logout-button');
// Add references for trade error messages if you don't have them
const tradeFormError = document.getElementById('trade-form-error'); // Or use your existing notification system
const tradeListError = document.getElementById('trade-list-error'); // Or use your existing notification system
// Make sure you have a reference for the trade table body, e.g.:
const tradeTableBody = document.getElementById('trade-table-body'); // Or tradesList if that's your tbody ID

// Event handler for adding more target fields
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-target') || e.target.parentElement.classList.contains('add-target')) {
        const targetContainer = document.querySelector('.target-container');
        const newRow = document.createElement('div');
        newRow.className = 'target-row';
        newRow.innerHTML = `
            <input type="number" class="target-value" step="0.01" placeholder="Target %" min="0">
            <button type="button" class="btn-secondary remove-target"><i class="fas fa-minus"></i></button>
        `;
        targetContainer.appendChild(newRow);
    }
    
    if (e.target.classList.contains('remove-target') || e.target.parentElement.classList.contains('remove-target')) {
        const row = e.target.closest('.target-row');
        row.remove();
    }
});

// Format currency for Indian Rupees
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
}

// Load trades from localStorage
function loadTrades() {
    const tradesJSON = localStorage.getItem('trades');
    return tradesJSON ? JSON.parse(tradesJSON) : [];
}

// Save trades to localStorage
function saveTrades(trades) {
    localStorage.setItem('trades', JSON.stringify(trades));
    
    console.log("Saving trades and dispatching update events...");
    
    // Dispatch a custom event that trade data has changed
    // This will be captured by the analytics.js event listener
    try {
        const event = new CustomEvent('tradeDataChanged', { 
            detail: { timestamp: Date.now() } 
        });
        document.dispatchEvent(event);
        console.log("Trade data changed event dispatched");
        
        // Also directly trigger analytics refresh if it's loaded
        // This ensures we don't depend solely on the event system
        if (window.refreshAnalytics && typeof window.refreshAnalytics === 'function') {
            console.log("Directly calling refreshAnalytics after data change");
            // Add a small delay to ensure storage is updated first
            setTimeout(() => {
                window.refreshAnalytics();
            }, 50);
        }
    } catch (e) {
        console.error("Error dispatching trade data event:", e);
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Calculate profit/loss
function calculateProfitLoss(entryPrice, exitPrice, quantity, tradeType) {
    if (tradeType === 'Long') {
        return (exitPrice - entryPrice) * quantity;
    } else if (tradeType === 'Short') {
        return (entryPrice - exitPrice) * quantity;
    } else if (tradeType === 'Option Call') {
        return (exitPrice - entryPrice) * quantity * 100; // Assuming lot size of 100
    } else if (tradeType === 'Option Put') {
        return (entryPrice - exitPrice) * quantity * 100; // Assuming lot size of 100
    }
    return 0;
}

// Calculate profit/loss percentage
function calculateProfitLossPercentage(entryPrice, exitPrice, tradeType) {
    if (tradeType === 'Long') {
        return ((exitPrice - entryPrice) / entryPrice) * 100;
    } else if (tradeType === 'Short') {
        return ((entryPrice - exitPrice) / entryPrice) * 100;
    } else {
        return ((exitPrice - entryPrice) / entryPrice) * 100;
    }
}

// Add new trade
function addTrade(trade) {
    const trades = loadTrades();
    trade.id = generateId();
    trade.timestamp = new Date().getTime();
    trades.push(trade);
    saveTrades(trades);
    displayTrades();
    updateStatistics();
    // Update recent trades in dashboard
    displayRecentTrades();
    showNotification('Trade added successfully!', 'success');
    
    // Auto-update CSV file
    if (typeof autoUpdateCsv === 'function') {
        autoUpdateCsv();
    }
    
    // Refresh analytics if visible
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        console.log('Analytics section is active, refreshing analytics data...');
        if (typeof loadAnalyticsData === 'function') {
            // Use a small timeout to ensure data is saved before reloading analytics
            setTimeout(() => {
                loadAnalyticsData(); // Reload all analytics data, including the calendar
            }, 100);
        } else {
            console.warn('loadAnalyticsData function not found.');
        }
    }
}

// Delete trade
function deleteTrade(id) {
    if (confirm('Are you sure you want to delete this trade?')) {
        // Load current trades
        const trades = loadTrades();
        
        // Filter out the trade to be deleted
        const updatedTrades = trades.filter(trade => trade.id !== id);
        
        // Save the updated trades list
        saveTrades(updatedTrades);
        
        // Refresh the trades display
        displayTrades();
        
        // Update statistics
        updateStatistics();
        
        // Update recent trades in dashboard
        displayRecentTrades();
        
        // Show notification
        showNotification('Trade deleted successfully', 'success');
        
        // Auto-update CSV file
        if (typeof autoUpdateCsv === 'function') {
            autoUpdateCsv();
        }
        
        // Refresh analytics if visible
        const analyticsSection = document.getElementById('analytics');
        if (analyticsSection && analyticsSection.classList.contains('active')) {
            console.log('Analytics section is active, refreshing analytics data after deletion...');
            if (typeof loadAnalyticsData === 'function') {
                // Use a small timeout to ensure data is saved before reloading analytics
                setTimeout(() => {
                    loadAnalyticsData(); // Reload all analytics data, including the calendar
                }, 100);
            } else {
                console.warn('loadAnalyticsData function not found.');
            }
        }
    }
}

// Edit trade (opens form with trade data)
function editTrade(id) {
    const trades = loadTrades();
    const trade = trades.find(t => t.id === id);
    
    if (!trade) return;
    
    // Switch to trade form section
    document.querySelector('[data-section="new-trade"]').click();
    
    // Fill form with trade data
    document.getElementById('date').value = trade.date;
    document.getElementById('stock').value = trade.stock;
    document.getElementById('trade-type').value = trade.tradeType;
    document.getElementById('strike-price').value = trade.strikePrice;
    document.getElementById('stop-loss').value = trade.stopLoss || '';
    document.getElementById('actual-profit').value = trade.profitLossPercentage;
    document.getElementById('trailing-sl').checked = trade.trailingStopLoss || false;
    document.getElementById('notes').value = trade.notes || '';
    
    // Handle profit targets
    const targetContainer = document.querySelector('.target-container');
    // Clear existing target rows except the first one
    const targetRows = targetContainer.querySelectorAll('.target-row');
    for (let i = 1; i < targetRows.length; i++) {
        targetRows[i].remove();
    }
    
    // Set the first target or clear it
    const firstTargetInput = targetContainer.querySelector('.target-value');
    firstTargetInput.value = '';
    
    // Add target rows for each saved target
    if (trade.profitTargets && trade.profitTargets.length > 0) {
        firstTargetInput.value = trade.profitTargets[0];
        
        // Add additional target rows for targets beyond the first
        for (let i = 1; i < trade.profitTargets.length; i++) {
            const newRow = document.createElement('div');
            newRow.className = 'target-row';
            newRow.innerHTML = `
                <input type="number" class="target-value" step="0.01" placeholder="Target %" min="0" value="${trade.profitTargets[i]}">
                <button type="button" class="btn-secondary remove-target"><i class="fas fa-minus"></i></button>
            `;
            targetContainer.appendChild(newRow);
        }
    }
    
    // Set form to edit mode
    tradeForm.dataset.mode = 'edit';
    tradeForm.dataset.tradeId = id;
    
    // Change button text
    document.querySelector('#trade-form .btn-primary').textContent = 'Update Trade';
}

// View trade details
function viewTrade(id) {
    const trades = loadTrades();
    const trade = trades.find(t => t.id === id);
    
    if (!trade) return;
    
    const modal = document.getElementById('trade-modal');
    const modalContent = document.getElementById('modal-content');
    
    // Format date
    const tradeDate = new Date(trade.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Determine profit/loss class
    const profitLossClass = parseFloat(trade.profitLossPercentage) >= 0 ? 'profit' : 'loss';
    
    // Prepare targets HTML
    let targetsHtml = '';
    if (trade.profitTargets && trade.profitTargets.length > 0) {
        targetsHtml += '<div class="targets-wrapper">';
        trade.profitTargets.forEach((target, index) => {
            targetsHtml += `<span class="target-badge">Target ${index + 1}: ${target}%</span>`;
        });
        targetsHtml += '</div>';
    }
    
    // Create modal content
    modalContent.innerHTML = `
        <h2>${trade.stock} Trade Details</h2>
        <div class="trade-details">
            <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${tradeDate}</span>
            </div>
            <div class="detail-row">
                <span class="label">Stock:</span>
                <span class="value">${trade.stock}</span>
            </div>
            <div class="detail-row">
                <span class="label">Trade Type:</span>
                <span class="value">${trade.tradeType}</span>
            </div>
            <div class="detail-row">
                <span class="label">Strike Price:</span>
                <span class="value">${formatCurrency(trade.strikePrice)}</span>
            </div>
            ${trade.stopLoss ? `
            <div class="detail-row">
                <span class="label">Stop Loss:</span>
                <span class="value"><span class="stop-loss-badge">${trade.stopLoss}%</span></span>
            </div>
            ` : ''}
            ${trade.profitTargets && trade.profitTargets.length > 0 ? `
            <div class="detail-row">
                <span class="label">Profit Targets:</span>
                <span class="value">${targetsHtml}</span>
            </div>
            ` : ''}
            ${trade.trailingStopLoss ? `
            <div class="detail-row">
                <span class="label">Trailing SL:</span>
                <span class="value"><span class="trailing-badge">Yes</span></span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="label">Actual P/L:</span>
                <span class="value ${profitLossClass}">${trade.profitLossPercentage}%</span>
            </div>
            ${trade.screenshot ? `
                <div class="screenshot">
                    <h3>Screenshot</h3>
                    <img src="${trade.screenshot}" alt="Trade Screenshot">
                </div>
            ` : ''}
            ${trade.notes ? `
                <div class="notes-section">
                    <h3>Notes</h3>
                    <div class="notes">${trade.notes}</div>
                </div>
            ` : ''}
            ${trade.mood ? `
            <div class="detail-row">
                <span class="label">Mood:</span>
                <span class="value">${trade.mood}</span>
            </div>
            ` : ''}
            ${trade.strategy ? `
            <div class="detail-row">
                <span class="label">Strategy:</span>
                <span class="value">${trade.strategy}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    // Display modal
    modal.classList.add('active');
    
    // Close modal when clicking on close button
    document.querySelector('.close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Display trades
function displayTrades(tradesToDisplay = null) {
    const trades = tradesToDisplay || loadTrades();
    
    if (trades.length === 0) {
        tradesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <p>No trades found. Start by adding your first trade!</p>
                <button class="btn-primary" onclick="document.querySelector('[data-section=\\'new-trade\\']').click()">
                    Add Your First Trade
                </button>
            </div>
        `;
        return;
    }
    
    // Create table
    let html = `
        <table class="trades-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Stock</th>
                    <th>Type</th>
                    <th>Stop Loss</th>
                    <th>P/L (%)</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody class="animate-list">
    `;
    
    // Add table rows with data validation
    trades.forEach(trade => {
        // Handle possible undefined values with defaults
        const date = trade.date ? new Date(trade.date).toLocaleDateString('en-IN') : 'N/A';
        const stock = trade.stock || 'Unknown';
        const tradeType = trade.tradeType || 'Unknown';
        const profitLoss = trade.profitLossPercentage !== undefined ? 
            parseFloat(trade.profitLossPercentage).toFixed(2) : '0.00';
        const stopLoss = trade.stopLoss ? `${trade.stopLoss}%` : 'N/A';
        
        const profitLossClass = parseFloat(profitLoss) >= 0 ? 'trade-profit' : 'trade-loss';
        const tradeTypeClass = tradeType.toLowerCase().replace(' ', '-');
        
        html += `
            <tr>
                <td>${date}</td>
                <td class="stock-symbol">${stock}</td>
                <td><span class="trade-type ${tradeTypeClass}">${tradeType}</span></td>
                <td>${stopLoss}</td>
                <td class="${profitLossClass}">${profitLoss}%</td>
                <td class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewTrade('${trade.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editTrade('${trade.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteTrade('${trade.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    tradesList.innerHTML = html;
}

// Update statistics
function updateStatistics() {
    const trades = loadTrades();
    
    // No trades yet
    if (trades.length === 0) {
        winRateElement.textContent = '0%';
        totalTradesElement.textContent = '0';
        avgReturnElement.textContent = '0%';
        netProfitElement.textContent = formatCurrency(0);
        return;
    }
    
    // Calculate statistics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => parseFloat(trade.profitLossPercentage) > 0).length;
    const winRate = (winningTrades / totalTrades) * 100;
    
    // Calculate average return
    const totalReturn = trades.reduce((total, trade) => total + parseFloat(trade.profitLossPercentage), 0);
    const avgReturn = totalReturn / totalTrades;
    
    // Calculate net profit (assuming trade.profitLoss exists)
    let netProfit = 0;
    trades.forEach(trade => {
        if (trade.profitLoss) {
            netProfit += parseFloat(trade.profitLoss);
        } else {
            // If profitLoss not directly stored, calculate it
            const pl = (parseFloat(trade.profitLossPercentage) / 100) * trade.strikePrice;
            netProfit += pl;
        }
    });
    
    // Update UI
    winRateElement.textContent = winRate.toFixed(2) + '%';
    totalTradesElement.textContent = totalTrades;
    avgReturnElement.textContent = avgReturn.toFixed(2) + '%';
    netProfitElement.textContent = formatCurrency(netProfit);
    
    // Update charts if they exist
    if (typeof updateCharts === 'function') {
        updateCharts(trades);
    }
}

// Filter trades
function filterTrades() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterType = filterSelect.value;
    const trades = loadTrades();
    
    let filtered = trades;
    
    // Filter by type if not "all"
    if (filterType !== 'all') {
        filtered = filtered.filter(trade => trade.tradeType === filterType);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(trade => 
            trade.stock.toLowerCase().includes(searchTerm) ||
            trade.tradeType.toLowerCase().includes(searchTerm) ||
            (trade.notes && trade.notes.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort according to current sort selection
    sortTrades(null, filtered);
}

// Sort trades
function sortTrades(field, tradesToSort = null) {
    // If no field provided, use the one from sortSelect
    if (!field) {
        const sortOption = sortSelect.value;
        const [sortField, sortDirection] = sortOption.split('-');
        field = sortField;
    }
    
    let trades = tradesToSort || loadTrades();
    const sortOption = sortSelect.value;
    const [sortField, sortDirection] = sortOption.split('-');
    
    trades.sort((a, b) => {
        let valueA, valueB;
        
        // Determine values to compare based on field
        if (field === 'date' || field === sortField === 'date') {
            valueA = new Date(a.date).getTime();
            valueB = new Date(b.date).getTime();
        } else if (field === 'profitLossPercentage' || sortField === 'profit') {
            valueA = parseFloat(a.profitLossPercentage);
            valueB = parseFloat(b.profitLossPercentage);
        } else if (field === 'strikePrice') {
            valueA = parseFloat(a.strikePrice);
            valueB = parseFloat(b.strikePrice);
        } else {
            valueA = a[field];
            valueB = b[field];
        }
        
        // Compare based on direction
        if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    displayTrades(trades);
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type} animate-slide-in-right`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Add close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.replace('animate-slide-in-right', 'animate-slide-out-right');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.replace('animate-slide-in-right', 'animate-slide-out-right');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Handle form submission
function handleTradeFormSubmit(event) {
    event.preventDefault();
    
    // Get form values with validation
    const date = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
    const stock = document.getElementById('stock').value || 'Unknown';
    const tradeType = document.getElementById('trade-type').value;
    const strikePrice = parseFloat(document.getElementById('strike-price').value) || 0;
    const stopLoss = parseFloat(document.getElementById('stop-loss').value) || 0;
    const actualProfit = parseFloat(document.getElementById('actual-profit').value) || 0;
    const notes = document.getElementById('notes').value || '';
    
    // Validate essential fields
    if (!stock || !tradeType) {
        showNotification('Please enter stock symbol and trade type', 'error');
        return;
    }
    
    // Collect all profit targets
    const targetInputs = document.querySelectorAll('.target-value');
    const profitTargets = [];
    targetInputs.forEach(input => {
        if (input.value) {
            profitTargets.push(parseFloat(input.value) || 0);
        }
    });
    
    const trailingStopLoss = document.getElementById('trailing-sl')?.checked || false;
    
    // Create trade object with validated data
    const tradeData = {
        date,
        stock,
        tradeType,
        strikePrice,
        stopLoss,
        profitTargets,
        trailingStopLoss,
        profitLossPercentage: actualProfit,
        notes
    };
    
    // Handle mood and strategy selection if available
    const selectedMood = document.querySelector('input[name="mood"]:checked');
    if (selectedMood) {
        tradeData.mood = selectedMood.value;
    }
    
    const selectedStrategy = document.querySelector('input[name="strategy"]:checked');
    if (selectedStrategy) {
        tradeData.strategy = selectedStrategy.value;
    }

    // Handle trade rules compliance tracking
    const compliantRules = [];
    const nonCompliantRules = [];
    
    document.querySelectorAll('.compliance-checkbox').forEach(checkbox => {
        const ruleId = checkbox.dataset.ruleId;
        if (checkbox.checked) {
            compliantRules.push(ruleId);
        } else {
            nonCompliantRules.push(ruleId);
        }
    });
    
    // Check if we're in edit mode
    const isEditMode = tradeForm.dataset.mode === 'edit';
    const editTradeId = isEditMode ? tradeForm.dataset.tradeId : null;
    
    // Process screenshot if uploaded
    const screenshotInput = document.getElementById('screenshot');
    if (screenshotInput && screenshotInput.files.length > 0) {
        processScreenshot(screenshotInput.files[0], (dataUrl) => {
            tradeData.screenshot = dataUrl;
            
            if (isEditMode && editTradeId) {
                // Update existing trade
                updateTradeById(editTradeId, tradeData);
            } else {
                // Add new trade
                addTrade(tradeData);
                
                // Record compliance using the new trade's ID
                if (window.rulesTracker && (compliantRules.length > 0 || nonCompliantRules.length > 0)) {
                    const lastTrades = loadTrades();
                    const newestTrade = lastTrades[lastTrades.length - 1]; 
                    window.rulesTracker.recordCompliance(newestTrade.id, compliantRules, nonCompliantRules);
                    
                    // Force render the compliance statistics with the new data
                    setTimeout(() => {
                        if (window.rulesTracker) {
                            window.rulesTracker.renderRulesList();
                            window.rulesTracker.renderComplianceCharts();
                        }
                    }, 500);
                }
            }
        });
    } else {
        // No screenshot to process
        if (isEditMode && editTradeId) {
            // Preserve existing screenshot if present in the edited trade
            const trades = loadTrades();
            const existingTrade = trades.find(t => t.id === editTradeId);
            if (existingTrade && existingTrade.screenshot) {
                tradeData.screenshot = existingTrade.screenshot;
            }
            
            // Update existing trade
            updateTradeById(editTradeId, tradeData);
        } else {
            // Add new trade
            addTrade(tradeData);
            
            // Record compliance after adding the trade
            if (window.rulesTracker && (compliantRules.length > 0 || nonCompliantRules.length > 0)) {
                const lastTrades = loadTrades();
                const newestTrade = lastTrades[lastTrades.length - 1]; 
                window.rulesTracker.recordCompliance(newestTrade.id, compliantRules, nonCompliantRules);
                
                // Force render the compliance statistics with the new data
                setTimeout(() => {
                    if (window.rulesTracker) {
                        window.rulesTracker.renderRulesList();
                        window.rulesTracker.renderComplianceCharts();
                    }
                }, 500);
            }
        }
    }
    
    // Reset form and form mode
    tradeForm.reset();
    tradeForm.dataset.mode = 'add';
    tradeForm.dataset.tradeId = '';
    document.querySelector('#trade-form .btn-primary').textContent = 'Save Trade';
    
    // Reset target fields
    const targetContainer = document.querySelector('.target-container');
    if (targetContainer) {
        const targetRows = targetContainer.querySelectorAll('.target-row');
        // Keep first row, remove others
        for (let i = 1; i < targetRows.length; i++) {
            targetRows[i].remove();
        }
        // Clear the value of the first row
        const firstTargetInput = targetContainer.querySelector('.target-value');
        if (firstTargetInput) {
            firstTargetInput.value = '';
        }
    }
    
    // Switch to trade history view
    document.querySelector('[data-section="trade-history"]').click();
}

// Helper function to update a trade by ID
function updateTradeById(tradeId, updatedTradeData) {
    const trades = loadTrades();
    const tradeIndex = trades.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) {
        showNotification('Trade not found.', 'error');
        return;
    }
    
    // Preserve the ID and timestamp of the original trade
    updatedTradeData.id = tradeId;
    updatedTradeData.timestamp = trades[tradeIndex].timestamp;
    
    // Call the existing updateExistingTrade function
    updateExistingTrade(updatedTradeData, tradeIndex);
    
    // Explicitly refresh analytics if needed
    if (window.refreshAnalytics && typeof window.refreshAnalytics === 'function') {
        console.log('Explicitly refreshing analytics after trade update');
        window.refreshAnalytics();
    }
}

// Helper function to update existing trade
function updateExistingTrade(updatedTrade, index) {
    const trades = loadTrades();
    trades[index] = updatedTrade;
    saveTrades(trades);
    displayTrades();
    updateStatistics();
    // Update recent trades in dashboard
    displayRecentTrades();
    showNotification('Trade updated successfully!', 'success');
    
    // Refresh analytics if visible
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        console.log('Analytics section is active, refreshing analytics data after trade update...');
        if (typeof loadAnalyticsData === 'function') {
            // Use a small timeout to ensure data is saved before reloading analytics
            setTimeout(() => {
                loadAnalyticsData(); // Reload all analytics data, including the calendar
            }, 100);
        } else {
            console.warn('loadAnalyticsData function not found.');
        }
    }
    
    // Auto-update CSV file if available
    if (typeof autoUpdateCsv === 'function') {
        autoUpdateCsv();
    }
}

// Process screenshot file to base64
function processScreenshot(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Initialize charts
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded. Charts will not be displayed.');
        return;
    }
    
    // Create charts if chart elements exist
    if (document.getElementById('profit-loss-chart')) {
        initProfitLossChart();
    }
    
    if (document.getElementById('win-loss-chart')) {
        initWinLossChart();
    }
    
    // Update charts with current data
    updateCharts(loadTrades());
}

// Initialize the profit/loss chart
function initProfitLossChart() {
    const ctx = document.getElementById('profit-loss-chart').getContext('2d');
    window.profitLossChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'P/L (%)',
                data: [],
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `P/L: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Profit/Loss (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Trades'
                    }
                }
            }
        }
    });
}

// Initialize the win/loss chart
function initWinLossChart() {
    const ctx = document.getElementById('win-loss-chart').getContext('2d');
    window.winLossChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Winning Trades', 'Losing Trades'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#4caf50', '#f44336'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// Update charts with new data
function updateCharts(trades) {
    // Update profit/loss chart
    if (window.profitLossChart) {
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Create meaningful labels with dates
        const labels = sortedTrades.map(trade => {
            const date = new Date(trade.date);
            return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        });
        
        const data = sortedTrades.map(trade => parseFloat(trade.profitLossPercentage));
        
        // Calculate cumulative performance for line chart
        const cumulativeData = [];
        let cumulative = 0;
        data.forEach(value => {
            cumulative += value;
            cumulativeData.push(cumulative);
        });
        
        // Update chart with gradients
        const ctx = window.profitLossChart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 107, 53, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 107, 53, 0)');
        
        window.profitLossChart.data.labels = labels;
        window.profitLossChart.data.datasets[0].data = data;
        window.profitLossChart.data.datasets[0].backgroundColor = gradient;
        window.profitLossChart.update();
    }
    
    // Update win/loss chart
    if (window.winLossChart) {
        const winningTrades = trades.filter(trade => parseFloat(trade.profitLossPercentage) > 0).length;
        const losingTrades = trades.length - winningTrades;
        
        window.winLossChart.data.datasets[0].data = [winningTrades, losingTrades];
        
        // Add custom tooltip with percentages
        window.winLossChart.options.plugins.tooltip.callbacks = {
            label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = winningTrades + losingTrades;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
            }
        };
        
        window.winLossChart.update();
    }
}

// Export trades to JSON file
function exportTrades() {
    const trades = loadTrades();
    const dataStr = JSON.stringify(trades, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'trade-history.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Trade history exported successfully!', 'success');
}

// Import trades from JSON file
function importTrades(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const trades = JSON.parse(e.target.result);
            saveTrades(trades);
            displayTrades();
            updateStatistics();
            showNotification('Trade history imported successfully!', 'success');
        } catch (error) {
            showNotification('Failed to import trades. Invalid file format.', 'error');
        }
    };
    reader.readAsText(file);
}

// Add this function to fetch market data
async function fetchMarketData() {
    try {
        // Note: In a production app, you would use a real API
        // This is a simulation for demonstration
        const marketData = {
            nifty: {
                price: 19850 + Math.random() * 200,
                change: -0.5 + Math.random() * 2
            },
            sensex: {
                price: 66500 + Math.random() * 500,
                change: -0.7 + Math.random() * 2.5
            },
            banknifty: {
                price: 45200 + Math.random() * 300,
                change: -1 + Math.random() * 3
            },
            usdinr: {
                price: 82 + Math.random(),
                change: -0.2 + Math.random() * 0.5
            }
        };

        // Update UI with market data
        updateMarketData(marketData);
    } catch (error) {
        console.error('Error fetching market data:', error);
    }
}

// Add this function to update the UI with market data
function updateMarketData(data) {
    try {
        // Check if elements exist before updating
        const niftyPrice = document.getElementById('nifty-price');
        const niftyChange = document.getElementById('nifty-change');
        const sensexPrice = document.getElementById('sensex-price');
        const sensexChange = document.getElementById('sensex-change');
        const bankniftyPrice = document.getElementById('banknifty-price');
        const bankniftyChange = document.getElementById('banknifty-change');
        const usdinrPrice = document.getElementById('usdinr-price');
        const usdinrChange = document.getElementById('usdinr-change');
        
        // Only update if elements exist
        if (niftyPrice) niftyPrice.textContent = data.nifty.price.toFixed(2);
        if (niftyChange) updateChangeElement('nifty-change', data.nifty.change);
        
        if (sensexPrice) sensexPrice.textContent = data.sensex.price.toFixed(2);
        if (sensexChange) updateChangeElement('sensex-change', data.sensex.change);
        
        if (bankniftyPrice) bankniftyPrice.textContent = data.banknifty.price.toFixed(2);
        if (bankniftyChange) updateChangeElement('banknifty-change', data.banknifty.change);
        
        if (usdinrPrice) usdinrPrice.textContent = data.usdinr.price.toFixed(2);
        if (usdinrChange) updateChangeElement('usdinr-change', data.usdinr.change);
    } catch (error) {
        console.log('Market data elements not found in the current view:', error);
    }
}

function updateChangeElement(elementId, changeValue) {
    const element = document.getElementById(elementId);
    const isPositive = changeValue >= 0;
    
    element.textContent = `${isPositive ? '+' : ''}${changeValue.toFixed(2)}%`;
    element.className = `market-change ${isPositive ? 'positive' : 'negative'}`;
    
    // Add icon
    const iconClass = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
    element.innerHTML = `<i class="fas ${iconClass}"></i>${element.textContent}`;
}

// Add risk calculator functionality
function initRiskCalculator() {
    const capitalInput = document.getElementById('calc-capital');
    const riskInput = document.getElementById('calc-risk');
    const entryInput = document.getElementById('calc-entry');
    const stoplossInput = document.getElementById('calc-stoploss');
    
    // Results elements
    const riskAmountEl = document.getElementById('risk-amount');
    const positionSizeEl = document.getElementById('position-size');
    const riskRewardEl = document.getElementById('risk-reward');
    
    // Target elements
    const target1El = document.getElementById('target-1');
    const target2El = document.getElementById('target-2');
    const target3El = document.getElementById('target-3');
    const profit1El = document.getElementById('profit-1');
    const profit2El = document.getElementById('profit-2');
    const profit3El = document.getElementById('profit-3');
    
    // Add event listeners
    [capitalInput, riskInput, entryInput, stoplossInput].forEach(input => {
        input.addEventListener('input', calculateRisk);
    });
    
    function calculateRisk() {
        const capital = parseFloat(capitalInput.value) || 0;
        const riskPercent = parseFloat(riskInput.value) || 0;
        const entry = parseFloat(entryInput.value) || 0;
        const stoploss = parseFloat(stoplossInput.value) || 0;
        
        if (capital <= 0 || riskPercent <= 0 || entry <= 0 || stoploss <= 0) {
            // If any value is missing or invalid, clear results
            riskAmountEl.textContent = '₹0.00';
            positionSizeEl.textContent = '0 shares';
            riskRewardEl.textContent = '0:1';
            
            target1El.textContent = '₹0.00';
            target2El.textContent = '₹0.00';
            target3El.textContent = '₹0.00';
            profit1El.textContent = '₹0.00';
            profit2El.textContent = '₹0.00';
            profit3El.textContent = '₹0.00';
            return;
        }
        
        // Calculate risk amount
        const riskAmount = capital * (riskPercent / 100);
        
        // Calculate position size
        const riskPerShare = Math.abs(entry - stoploss);
        const shares = Math.floor(riskAmount / riskPerShare);
        
        // Update results
        riskAmountEl.textContent = formatCurrency(riskAmount);
        positionSizeEl.textContent = `${shares} shares`;
        
        // Calculate targets based on risk/reward
        const isLong = entry > stoploss;
        const risk = isLong ? entry - stoploss : stoploss - entry;
        
        // 1:1 risk/reward
        const target1 = isLong ? entry + risk : entry - risk;
        const profit1 = shares * risk;
        
        // 2:1 risk/reward
        const target2 = isLong ? entry + (risk * 2) : entry - (risk * 2);
        const profit2 = shares * risk * 2;
        
        // 3:1 risk/reward
        const target3 = isLong ? entry + (risk * 3) : entry - (risk * 3);
        const profit3 = shares * risk * 3;
        
        // Update target elements
        target1El.textContent = formatCurrency(target1);
        target2El.textContent = formatCurrency(target2);
        target3El.textContent = formatCurrency(target3);
        profit1El.textContent = formatCurrency(profit1);
        profit2El.textContent = formatCurrency(profit2);
        profit3El.textContent = formatCurrency(profit3);
        
        // Update risk/reward ratio
        const targetPrice = document.getElementById('calc-target-price')?.value || 0;
        if (targetPrice > 0) {
            const reward = isLong ? targetPrice - entry : entry - targetPrice;
            const riskRewardRatio = (reward / risk).toFixed(1);
            riskRewardEl.textContent = `${riskRewardRatio}:1`;
        } else {
            riskRewardEl.textContent = 'Set target';
        }
    }
}

// Add dark mode toggle functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Skip if the toggle element doesn't exist
    if (!darkModeToggle) {
        console.log('Dark mode toggle not found in the current view');
        return;
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        darkModeToggle.checked = true;
    }
    
    // Toggle theme when checkbox changes
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
        
        // Update charts for better visibility in dark mode
        updateChartsForTheme();
    });
}

// Update chart colors based on theme
function updateChartsForTheme() {
    const isDarkMode = document.body.classList.contains('dark-theme');
    
    const textColor = isDarkMode ? '#e6edf3' : '#212529';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Update all charts
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    
    // Update existing charts if they exist
    if (window.profitLossChart) {
        window.profitLossChart.options.scales.x.grid.color = gridColor;
        window.profitLossChart.options.scales.y.grid.color = gridColor;
        window.profitLossChart.update();
    }
    
    if (window.winLossChart) {
        window.winLossChart.options.plugins.legend.labels.color = textColor;
        window.winLossChart.update();
    }
    
    if (window.strategyChart) {
        window.strategyChart.options.plugins.legend.labels.color = textColor;
        window.strategyChart.update();
    }
    
    if (window.monthlyChart) {
        window.monthlyChart.options.scales.x.grid.color = gridColor;
        window.monthlyChart.options.scales.y.grid.color = gridColor;
        window.monthlyChart.update();
    }
}

// Add screenshot uploader functionality
function initScreenshotUploader() {
    const uploadArea = document.getElementById('upload-area');
    const screenshotInput = document.getElementById('screenshot');
    const previewArea = document.getElementById('screenshot-preview');
    
    if (!uploadArea || !screenshotInput || !previewArea) return;
    
    // Click on upload area to trigger file input
    uploadArea.addEventListener('click', () => {
        screenshotInput.click();
    });
    
    // File selected
    screenshotInput.addEventListener('change', () => {
        handleFiles(screenshotInput.files);
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    // Process files
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.match('image.*')) {
            showNotification('Please select an image file.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewArea.innerHTML = `
                <div class="screenshot-preview-container">
                    <img src="${e.target.result}" alt="Trade Screenshot">
                    <div class="remove-screenshot"><i class="fas fa-times"></i></div>
                </div>
            `;
            previewArea.style.display = 'block';
            
            // Add remove functionality
            const removeBtn = previewArea.querySelector('.remove-screenshot');
            removeBtn.addEventListener('click', () => {
                previewArea.innerHTML = '';
                previewArea.style.display = 'none';
                screenshotInput.value = '';
            });
        };
        reader.readAsDataURL(file);
    }
}

// --- Function to display error messages ---
function displayError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
    }
    // Alternatively, adapt this to use your showNotification function
    // if (message) {
    //     showNotification(message, 'error');
    // }
}

// Add this to your existing DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    // Display initial trades
    displayTrades();
    updateStatistics();
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
    
    // Set up form submission
    if (tradeForm) {
        tradeForm.addEventListener('submit', handleTradeFormSubmit);
    }
    
    // Set up search input
    if (searchInput) {
        searchInput.addEventListener('input', filterTrades);
    }
    
    // Set up filter select
    if (filterSelect) {
        filterSelect.addEventListener('change', filterTrades);
    }
    
    // Set up sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', () => sortTrades());
    }
    
    // Set up export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTrades);
    }
    
    // Set up import button
    const importInput = document.getElementById('import-input');
    if (importInput) {
        importInput.addEventListener('change', importTrades);
    }
    
    // Set up section navigation
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('[data-section]').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show targeted section
            const targetId = this.getAttribute('data-section');
            document.getElementById(targetId).classList.add('active');
            
            // If we're switching to the analytics section, refresh the data
            if (targetId === 'analytics') {
                console.log('Switching to analytics section, refreshing data...');
                
                // Check if there's a pending refresh requested when section wasn't visible
                if (window.analyticsNeedsRefresh) {
                    console.log('Applying pending analytics refresh...');
                    const params = window.analyticsRefreshParams || { dateRange: 'all', customDates: null };
                    
                    if (typeof loadAnalyticsData === 'function') {
                        // Apply the pending refresh with the saved parameters
                        setTimeout(() => {
                            loadAnalyticsData(params.dateRange, params.customDates);
                            analyticsLoaded = true;
                            // Reset the pending flag
                            window.analyticsNeedsRefresh = false;
                            window.analyticsRefreshParams = null;
                        }, 100);
                    }
                } else {
                    // Normal refresh when switching to analytics tab
                    if (typeof loadAnalyticsData === 'function') {
                        // Add a small delay to ensure the section is visible first
                        setTimeout(() => {
                            loadAnalyticsData(); // This will refresh all analytics, including the calendar
                            analyticsLoaded = true;
                        }, 100);
                    } else {
                        console.warn('loadAnalyticsData function not found when navigating to analytics');
                    }
                }
            }
        });
    });
    
    // Close modal when clicking on close button
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('trade-modal').classList.remove('active');
        });
    });

    // Fetch market data initially and refresh every 30 seconds
    fetchMarketData();
    setInterval(fetchMarketData, 30000);

    // Initialize risk calculator
    initRiskCalculator();

    // Initialize dark mode
    initDarkMode();

    // Initialize screenshot uploader
    initScreenshotUploader();

    // Initialize calendar
    initCalendar();
    
    // Initialize theme toggle
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
        // Check for saved theme preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        }
        
        // Handle theme toggle
        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
    
    // Add navigation link for risk calculator if needed
    const navList = document.querySelector('nav ul');
    if (navList && !document.querySelector('[data-section="risk-calculator"]')) {
        const riskCalcLink = document.createElement('li');
        riskCalcLink.innerHTML = '<a href="#" data-section="risk-calculator">Risk Calculator</a>';
        navList.appendChild(riskCalcLink);
        
        // Make sure to add event listener for the new link
        riskCalcLink.querySelector('a').addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('[data-section]').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show targeted section
            const targetId = this.getAttribute('data-section');
            document.getElementById(targetId).classList.add('active');
        });
    }

    // Add event listener for clear all trades button
    const clearTradesBtn = document.getElementById('clear-trades-btn');
    if (clearTradesBtn) {
        clearTradesBtn.addEventListener('click', clearAllTrades);
    }
});

// Update all dashboard elements
function updateDashboard() {
    updateCurrentDate();
    updateStatistics(); // This updates main stats and charts
    displayRecentTrades(); // Display recent trades in the dashboard

    // Explicitly update the enhanced dashboard cards
    if (typeof renderPerformanceSummaryCard === 'function') {
        renderPerformanceSummaryCard();
    }
    if (typeof renderRiskManagementMetrics === 'function') {
        renderRiskManagementMetrics();
    }
    if (typeof renderConsistencyChart === 'function') {
        renderConsistencyChart();
    }
    // Add calls for other enhancement card render functions if they exist
    // e.g., if (typeof renderUpcomingEventsWidget === 'function') { renderUpcomingEventsWidget(); }

    // Update charts with the latest data (already called within updateStatistics)
    // const trades = loadTrades();
    // updateCharts(trades); // This might be redundant if updateStatistics already calls it
}

// Function to display recent trades in the dashboard widget
function displayRecentTrades() {
    // Find the recent trades list container
    const recentTradesList = document.getElementById('recent-trades-list');
    if (!recentTradesList) return;
    
    // Get all trades and sort by date (newest first)
    const trades = loadTrades();
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Sort in descending order (newest first)
    });
    
    // Get the 5 most recent trades
    const recentTrades = sortedTrades.slice(0, 5);
    
    // If no trades, show empty state
    if (recentTrades.length === 0) {
        recentTradesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No recent trades found.</p>
                <button class="btn-primary" onclick="document.querySelector('[data-section=\\'new-trade\\']').click()">
                    Record Your First Trade
                </button>
            </div>
        `;
        return;
    }
    
    // Create HTML for recent trades list
    let html = `
        <div class="recent-trades-list">
            <table class="recent-trades-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Stock</th>
                        <th>Type</th>
                        <th>P/L</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add each recent trade
    recentTrades.forEach(trade => {
        // Format date
        const date = trade.date ? new Date(trade.date).toLocaleDateString('en-IN') : 'N/A';
        // Get profit/loss value and determine class
        const profitLoss = trade.profitLossPercentage !== undefined ? 
            parseFloat(trade.profitLossPercentage).toFixed(2) : '0.00';
        const profitLossClass = parseFloat(profitLoss) >= 0 ? 'trade-profit' : 'trade-loss';
        // Get trade type and class
        const tradeType = trade.tradeType || 'Unknown';
        const tradeTypeClass = tradeType.toLowerCase().replace(' ', '-');
        
        html += `
            <tr>
                <td>${date}</td>
                <td class="stock-symbol">${trade.stock || 'Unknown'}</td>
                <td><span class="trade-type ${tradeTypeClass}">${tradeType}</span></td>
                <td class="${profitLossClass}">${profitLoss}%</td>
                <td class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewTrade('${trade.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            <div class="see-all-link">
                <a href="#" onclick="document.querySelector('[data-section=\\'trade-history\\']').click(); return false;">
                    See all trades <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
    
    recentTradesList.innerHTML = html;
}

// Function to update the current date display in the dashboard
function updateCurrentDate() {
    const dateDisplay = document.querySelector('.dashboard-date');
    if (dateDisplay) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-IN', options);
    }
}

// Clear all trades
function clearAllTrades() {
    if (confirm('Are you sure you want to delete ALL trades? This action cannot be undone.')) {
        // Clear trades from localStorage
        localStorage.removeItem('trades');

        // Clear related data if necessary (e.g., reviews, statistics caches)
        localStorage.removeItem('tradeReviews'); // Example: Clear reviews if linked
        localStorage.removeItem('tradingRules'); // Clear rules if desired
        localStorage.removeItem('tradeTags'); // Clear tags if desired
        // Add any other related data clearing here

        // Refresh the trades display (will show empty state)
        displayTrades();

        // Update statistics (will reset to zero)
        updateStatistics();

        // Update recent trades in dashboard (will show empty state)
        displayRecentTrades();

        // Update charts (will clear or show empty state)
        if (typeof updateCharts === 'function') {
            updateCharts([]); // Pass empty array to clear charts
        }

        // Refresh analytics if visible
        const analyticsSection = document.getElementById('analytics');
        if (analyticsSection && analyticsSection.classList.contains('active')) {
            if (typeof loadAnalyticsData === 'function') {
                loadAnalyticsData(); // Reload analytics which should now show no data
            }
        }

        // Refresh trade review section if visible and applicable
        const reviewSection = document.getElementById('trade-review');
        if (reviewSection && reviewSection.classList.contains('active')) {
            if (window.tradeReviewSystem && typeof window.tradeReviewSystem.loadPreviousReviews === 'function') {
                window.tradeReviewSystem.loadPreviousReviews(); // Reload reviews
                window.tradeReviewSystem.populateTradeSelection(); // Repopulate dropdown
                window.tradeReviewSystem.updateReviewStats(); // Update review stats
            }
        }

        // Refresh statistics dashboard if visible
        const statsDashboardSection = document.getElementById('statistics');
        if (statsDashboardSection && statsDashboardSection.classList.contains('active')) {
            if (window.tradeStatsDashboard && typeof window.tradeStatsDashboard.loadTrades === 'function') {
                window.tradeStatsDashboard.loadTrades(); // Reload stats dashboard
            }
        }

        // Refresh rules compliance section if visible
        const rulesSection = document.getElementById('trading-rules');
        if (rulesSection && rulesSection.classList.contains('active')) {
            if (typeof loadRules === 'function') {
                loadRules(); // Reload rules list
            }
            if (typeof updateComplianceStats === 'function') {
                updateComplianceStats(); // Update compliance stats
            }
        }

        // Refresh tag filters
        if (typeof loadTagsForFiltering === 'function') {
            loadTagsForFiltering();
        }

        // Show notification
        showNotification('All trades and related data have been cleared.', 'success');

        // Optional: Clear the associated CSV file if auto-update is used
        if (typeof clearCsvFile === 'function') { // Assuming a function exists to clear/reset the CSV
            clearCsvFile();
        } else if (typeof autoUpdateCsv === 'function') {
            // Or trigger an update which will write an empty file
            autoUpdateCsv();
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... existing listeners ...

    // Set up clear all trades button
    const clearTradesBtn = document.getElementById('clear-all-trades-btn');
    if (clearTradesBtn) {
        clearTradesBtn.addEventListener('click', clearAllTrades);
    }

    // ... rest of DOMContentLoaded ...
});

// --- UI Update Functions ---
function showAuthSection() {
    if (authSection) authSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
    showLoginView(); // Default to login view
}

function showDashboardSection() {
    if (authSection) authSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    const userEmail = localStorage.getItem('userEmail');
    if (userEmailDisplay && userEmail) {
        userEmailDisplay.textContent = userEmail;
    }
    displayError(loginErrorMsg, '');
    displayError(signupErrorMsg, '');
    fetchUserTrades(); // Fetch trades when showing dashboard
}

function showLoginView() {
    if (loginView) loginView.style.display = 'block';
    if (signupView) signupView.style.display = 'none';
    displayError(signupErrorMsg, '');
}

function showSignupView() {
    if (loginView) loginView.style.display = 'none';
    if (signupView) signupView.style.display = 'block';
    displayError(loginErrorMsg, '');
}

// --- Authentication Logic ---
async function handleSignup(event) {
    event.preventDefault();
    displayError(signupErrorMsg, '');
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    if (!email || !password) {
        displayError(signupErrorMsg, 'Email and password are required.'); return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.msg || `HTTP error! status: ${response.status}`); }
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        showDashboardSection();
        if (signupForm) signupForm.reset();
    } catch (error) {
        console.error('Signup failed:', error);
        displayError(signupErrorMsg, `Signup failed: ${error.message}`);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    displayError(loginErrorMsg, '');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
        displayError(loginErrorMsg, 'Email and password are required.'); return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.msg || `HTTP error! status: ${response.status}`); }
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        showDashboardSection();
        if (loginForm) loginForm.reset();
    } catch (error) {
        console.error('Login failed:', error);
        displayError(loginErrorMsg, `Login failed: ${error.message}`);
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    showAuthSection();
    if (tradeTableBody) { tradeTableBody.innerHTML = ''; } // Clear trades UI
    // Optionally clear statistics display
    // updateStatistics([]); // Pass empty array if needed
    displayError(tradeFormError, '');
    displayError(tradeListError, '');
}

// --- Check Login Status on Page Load ---
function checkInitialAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        showDashboardSection();
    } else {
        showAuthSection();
    }
}

// --- Check Login Status on Page Load (for index.html) ---
function checkInitialAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // No token found, redirect to login page
        console.log("No token found, redirecting to login.");
        window.location.href = 'login.html';
    } else {
        // Token exists, proceed to load dashboard data
        console.log("Token found, loading dashboard.");
        // Ensure dashboard is visible (remove display:none if it was set)
        if (dashboardSection) dashboardSection.style.display = 'block'; // Or remove the style attribute entirely
        const userEmail = localStorage.getItem('userEmail');
         if (userEmailDisplay && userEmail) {
             userEmailDisplay.textContent = userEmail;
         }
        fetchUserTrades(); // Fetch user data now
    }
}

// --- API-based Trade Data Logic ---
async function fetchUserTrades() {
    displayError(tradeListError, '');
    const token = localStorage.getItem('authToken');
    if (!token) { handleLogout(); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/trades`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.status === 401) { handleLogout(); return; }
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.msg || `HTTP error! status: ${response.status}`); }

        const trades = await response.json();

        // --- ADD THIS LOG ---
        console.log('--- Raw trades received from API:', JSON.stringify(trades));
        // --- END ADD LOG ---

        displayTrades(trades); // Call your existing display function
        updateStatistics(trades); // Call your existing statistics function

    } catch (error) {
        console.error('Error fetching or processing trades:', error);
        displayError(tradeListError, `Failed to load trades: ${error.message}`);
    }
}

async function handleAddTrade(event) {
    // This function should be called by your trade form's submit listener
    event.preventDefault();
    displayError(tradeFormError, '');
    const token = localStorage.getItem('authToken');
    if (!token) { handleLogout(); return; }

    // --- Get trade data from your form ---
    // Adapt this part to match the IDs and structure of YOUR trade form
    const symbol = document.getElementById('symbol').value; // Example ID
    const entryPrice = document.getElementById('entryPrice').value; // Example ID
    const exitPrice = document.getElementById('exitPrice').value || null; // Example ID
    const quantity = document.getElementById('quantity').value || null; // Example ID
    const notes = document.getElementById('notes').value; // Example ID
    const tradeDateInput = document.getElementById('tradeDate'); // Example ID if you have one
    // --- End form data retrieval ---

    const tradeData = {
        symbol,
        entryPrice: parseFloat(entryPrice),
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        quantity: quantity ? parseFloat(quantity) : null,
        notes,
        tradeDate: tradeDateInput ? tradeDateInput.value : undefined // Send if available
    };

    // Basic validation (add more if needed)
    if (!tradeData.symbol || isNaN(tradeData.entryPrice)) {
         displayError(tradeFormError, 'Symbol and valid Entry Price are required.');
         // Or use: showNotification('Symbol and valid Entry Price are required.', 'error');
         return;
    }


    try {
        const response = await fetch(`${API_BASE_URL}/trades`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(tradeData)
        });
        if (response.status === 401) { handleLogout(); return; }
        const newTrade = await response.json();
        if (!response.ok) { throw new Error(newTrade.msg || `HTTP error! status: ${response.status}`); }

        fetchUserTrades(); // Refresh the list from backend
        if (addTradeForm) addTradeForm.reset(); // Reset your form
        // showNotification('Trade added successfully!', 'success'); // Use your notification

    } catch (error) {
        console.error('Error adding trade:', error);
        displayError(tradeFormError, `Failed to add trade: ${error.message}`);
        // Or use: showNotification(`Failed to add trade: ${error.message}`, 'error');
    }
}

async function handleDeleteTrade(tradeId) {
     // This function should be called by your delete button listeners
     const token = localStorage.getItem('authToken');
     if (!token) { handleLogout(); return; }

     // Optional: Confirmation
     // if (!confirm('Are you sure you want to delete this trade?')) { return; }

     try {
         const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${token}` }
         });
         if (response.status === 401) { handleLogout(); return; }
         const data = await response.json();
         if (!response.ok) { throw new Error(data.msg || `HTTP error! status: ${response.status}`); }

         // showNotification('Trade deleted successfully!', 'success'); // Use your notification
         fetchUserTrades(); // Refresh list

     } catch (error) {
         console.error('Error deleting trade:', error);
         displayError(tradeListError, `Failed to delete trade: ${error.message}`);
         // Or use: showNotification(`Failed to delete trade: ${error.message}`, 'error');
     }
}

 // --- TODO: Implement handleEditTrade similarly ---
 // It will need to:
 // 1. Get tradeId and token.
 // 2. Get updated data from the form/modal.
 // 3. Make a PUT request to `${API_BASE_URL}/trades/${tradeId}` with the data.
 // 4. Call fetchUserTrades() on success.

// ... rest of your app.js ...

document.addEventListener('DOMContentLoaded', () => {
    // --- Your existing initializations ---
    // e.g., initDarkMode();
    // e.g., loadTrades(); // <-- DELETE THIS LINE (loading from localStorage)
    // e.g., setup event listeners for search, filter, sort, original trade form submit, etc.

    // --- Add New Authentication Listeners ---
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (showSignupBtn) showSignupBtn.addEventListener('click', showSignupView);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginView);

    // --- Modify Trade Form Listener ---
    // Find your existing listener for the trade form submission
    // Example: if (tradeForm) tradeForm.addEventListener('submit', handleTradeFormSubmit);
    // CHANGE that listener to call the NEW handleAddTrade function:
    if (tradeForm) { // Or use your specific form ID (e.g., addTradeForm)
         tradeForm.removeEventListener('submit', yourOldSubmitHandler); // Remove old listener if needed
         tradeForm.addEventListener('submit', handleAddTrade); // Add the new listener
    }

    // --- Modify Delete Button Listener ---
    // Find where you add listeners for delete buttons (maybe in displayTrades or separately)
    // CHANGE that listener logic to call the NEW handleDeleteTrade function, passing the trade ID.
    // Example using event delegation (if tradesList is your tbody):
    if (tradeTableBody) { // Or tradesList
        tradeTableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-btn')) { // Use your delete button class
                const tradeId = event.target.dataset.id; // Assumes button has data-id attribute
                if (tradeId) {
                    handleDeleteTrade(tradeId);
                }
            }
            // Add similar logic for edit buttons if needed
            // if (event.target.classList.contains('edit-btn')) { ... call handleEditTrade(tradeId) ... }
        });
    }


    // --- Initial Check ---
    checkInitialAuthStatus(); // Check if user is logged in when page loads

}); // End of DOMContentLoaded

// ... other variables ...
const userDisplayElement = document.getElementById('user-email-display'); // Get the span element

// ... other functions ...

// --- Check Auth Status & Update UI ---
function checkInitialAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail'); // Get stored email

    if (!token) {
        // If no token, redirect to login page
        if (window.location.pathname !== '/login.html' && !window.location.pathname.endsWith('/login.html')) {
            window.location.href = 'login.html';
        }
    } else {
        // If token exists, update the welcome message
        if (userDisplayElement && userEmail) {
            // Extract name part from email (before '@')
            const namePart = userEmail.split('@')[0];
            // Capitalize the first letter
            const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
            userDisplayElement.textContent = displayName; // Update the span content
        } else if (userDisplayElement) {
            userDisplayElement.textContent = 'User'; // Fallback if email not found
        }

        // Fetch user-specific data
        fetchUserTrades();
        // fetchTradingRules(); // Uncomment if using rules
        // fetchTags(); // Uncomment if using tags
        // Initialize other dashboard components that depend on login
    }
}

// ... rest of app.js ...

// Make sure to call checkInitialAuthStatus when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkInitialAuthStatus(); // Check auth status on page load

    // ... rest of DOMContentLoaded listener ...
});