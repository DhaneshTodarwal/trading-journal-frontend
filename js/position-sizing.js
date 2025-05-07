// Position Sizing Calculator
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const accountSizeInput = document.getElementById('account-size');
    const riskPercentageInput = document.getElementById('risk-percentage');
    const entryPriceInput = document.getElementById('entry-price');
    const stopLossPriceInput = document.getElementById('stop-loss-price');
    const isFuturesCheckbox = document.getElementById('is-futures');
    const futuresOptionsDiv = document.getElementById('futures-options');
    const lotSizeInput = document.getElementById('lot-size');
    const marginRequiredInput = document.getElementById('margin-required');
    const calculateButton = document.getElementById('calculate-position');
    const positionResultsDiv = document.getElementById('position-results');
    const riskAmountOutput = document.getElementById('risk-amount');
    const positionSizeOutput = document.getElementById('position-size');
    const targetsTableBody = document.getElementById('targets-table-body');
    const saveSettingsButton = document.getElementById('save-calculator-settings');

    // Load saved settings if they exist
    loadCalculatorSettings();

    // Initialize the calculator if we're on the position sizing page
    if (accountSizeInput && calculateButton) {
        // Toggle futures/options fields
        if (isFuturesCheckbox) {
            isFuturesCheckbox.addEventListener('change', function() {
                futuresOptionsDiv.style.display = this.checked ? 'block' : 'none';
            });
        }

        // Calculate position size
        if (calculateButton) {
            calculateButton.addEventListener('click', calculatePositionSize);
        }

        // Save default settings
        if (saveSettingsButton) {
            saveSettingsButton.addEventListener('click', saveCalculatorSettings);
        }
    }

    // Load saved settings from localStorage
    function loadCalculatorSettings() {
        if (!accountSizeInput) return;
        
        const savedSettings = JSON.parse(localStorage.getItem('positionCalculatorSettings')) || {};
        
        if (savedSettings.accountSize) accountSizeInput.value = savedSettings.accountSize;
        if (savedSettings.riskPercentage) riskPercentageInput.value = savedSettings.riskPercentage;
        if (savedSettings.isFutures && isFuturesCheckbox) {
            isFuturesCheckbox.checked = savedSettings.isFutures;
            futuresOptionsDiv.style.display = savedSettings.isFutures ? 'block' : 'none';
        }
        if (savedSettings.lotSize && lotSizeInput) lotSizeInput.value = savedSettings.lotSize;
        if (savedSettings.marginRequired && marginRequiredInput) marginRequiredInput.value = savedSettings.marginRequired;
    }

    // Save settings to localStorage
    function saveCalculatorSettings() {
        if (!accountSizeInput) return;
        
        const settings = {
            accountSize: accountSizeInput.value,
            riskPercentage: riskPercentageInput.value,
            isFutures: isFuturesCheckbox ? isFuturesCheckbox.checked : false,
            lotSize: lotSizeInput ? lotSizeInput.value : 1,
            marginRequired: marginRequiredInput ? marginRequiredInput.value : 0
        };
        
        localStorage.setItem('positionCalculatorSettings', JSON.stringify(settings));
        showNotification('Calculator settings saved successfully!', 'success');
    }

    // Calculate position size based on risk parameters
    function calculatePositionSize() {
        // Get values from inputs
        const accountSize = parseFloat(accountSizeInput.value) || 0;
        const riskPercentage = parseFloat(riskPercentageInput.value) || 0;
        const entryPrice = parseFloat(entryPriceInput.value) || 0;
        const stopLossPrice = parseFloat(stopLossPriceInput.value) || 0;
        const isFutures = isFuturesCheckbox ? isFuturesCheckbox.checked : false;
        const lotSize = isFutures ? parseInt(lotSizeInput.value) || 1 : 1;
        
        // Validate inputs
        if (accountSize <= 0 || riskPercentage <= 0 || entryPrice <= 0 || stopLossPrice <= 0) {
            showNotification('Please enter valid values for all fields', 'error');
            return;
        }
        
        if (entryPrice === stopLossPrice) {
            showNotification('Entry price and stop loss price cannot be the same', 'error');
            return;
        }
        
        // Calculate risk amount (amount willing to lose)
        const riskAmount = accountSize * (riskPercentage / 100);
        
        // Determine if it's a long or short trade
        const isLongTrade = entryPrice > stopLossPrice;
        
        // Calculate risk per share
        const riskPerShare = Math.abs(entryPrice - stopLossPrice);
        
        // Calculate position size (number of shares)
        let positionSize = Math.floor(riskAmount / riskPerShare);
        
        // For futures/options, make sure the position size is in multiples of lot size
        if (isFutures && lotSize > 1) {
            positionSize = Math.floor(positionSize / lotSize) * lotSize;
        }
        
        // Display results
        riskAmountOutput.textContent = formatCurrency(riskAmount);
        positionSizeOutput.textContent = isFutures ? 
            `${positionSize} shares (${positionSize / lotSize} lots)` : 
            `${positionSize} shares`;
        
        // Show the results section
        positionResultsDiv.style.display = 'block';
        
        // Calculate and display risk-to-reward targets
        generateTargetsTable(entryPrice, stopLossPrice, positionSize, isLongTrade);
    }

    // Generate the targets table based on risk-to-reward ratios
    function generateTargetsTable(entry, stopLoss, positionSize, isLong) {
        // Clear existing table rows
        targetsTableBody.innerHTML = '';
        
        // Calculate risk amount per share
        const riskPerShare = Math.abs(entry - stopLoss);
        
        // Generate rows for different R:R ratios (1:1, 2:1, 3:1, 4:1)
        for (let ratio = 1; ratio <= 4; ratio++) {
            const targetPrice = isLong ? 
                entry + (riskPerShare * ratio) : 
                entry - (riskPerShare * ratio);
            
            const potentialProfit = (riskPerShare * ratio) * positionSize;
            const percentGain = (riskPerShare * ratio * 100) / entry;
            
            // Create table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${ratio}:1</strong></td>
                <td>${formatCurrency(targetPrice)}</td>
                <td>${formatCurrency(potentialProfit)}</td>
                <td>${percentGain.toFixed(2)}%</td>
            `;
            
            targetsTableBody.appendChild(row);
        }
    }
});