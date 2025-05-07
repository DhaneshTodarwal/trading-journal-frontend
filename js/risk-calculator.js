/**
 * Advanced Risk Management and Position Sizing Calculator
 * For Indian Trading Journal
 */

class RiskManager {
    constructor() {
        // Wait a small amount of time to ensure DOM is fully loaded
        setTimeout(() => {
            this.initElements();
            this.initEventListeners();
            this.loadSettings();
            // Perform an initial calculation with default values
            this.calculatePosition();
        }, 100);
    }

    // Initialize DOM elements
    initElements() {
        // We need to target elements specifically in the risk-calculator section
        // to avoid conflicts with other calculator sections
        const riskCalculatorSection = document.getElementById('risk-calculator');
        
        if (riskCalculatorSection) {
            // Advanced calculator elements
            this.accountSizeInput = riskCalculatorSection.querySelector('#account-size');
            this.riskPercentInput = riskCalculatorSection.querySelector('#risk-percent');
            this.entryPriceInput = riskCalculatorSection.querySelector('#entry-price');
            this.stopLossPriceInput = riskCalculatorSection.querySelector('#stop-loss-price');
            this.calculateButton = riskCalculatorSection.querySelector('#calculate-position');
            
            // Result elements
            this.amountAtRiskElement = riskCalculatorSection.querySelector('#amount-at-risk');
            this.positionSizeElement = riskCalculatorSection.querySelector('#position-size');
            this.positionValueElement = riskCalculatorSection.querySelector('#position-value');
            this.targetTableBody = riskCalculatorSection.querySelector('#targets-table-body');
        } else {
            console.error('Risk calculator section not found');
            return;
        }
        
        // Log elements found to help debug
        console.log('RiskManager Elements:', {
            accountSize: this.accountSizeInput,
            riskPercent: this.riskPercentInput,
            entryPrice: this.entryPriceInput,
            stopLossPrice: this.stopLossPriceInput,
            calculateButton: this.calculateButton,
            results: {
                amountAtRisk: this.amountAtRiskElement,
                positionSize: this.positionSizeElement,
                positionValue: this.positionValueElement,
                targetTableBody: this.targetTableBody
            }
        });
        
        // Risk parameters
        this.defaultAccountSize = 100000; // ₹1,00,000
        this.defaultRiskPercent = 2; // 2%
        this.defaultRiskRewardRatios = [1, 2, 3, 4, 5]; // R:R ratios to calculate
    }

    // Set up event listeners
    initEventListeners() {
        if (!this.calculateButton) {
            console.warn('Calculate button not found!');
            return;
        }

        // Calculate button click
        this.calculateButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any form submission
            console.log('Calculate button clicked');
            this.calculatePosition();
        });
        
        // Live calculation on input changes
        const inputFields = [this.accountSizeInput, this.riskPercentInput, this.entryPriceInput, this.stopLossPriceInput];
        inputFields.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.calculatePosition());
            } else {
                console.warn('Missing input field in risk calculator');
            }
        });
        
        // Save settings when inputs change
        [this.accountSizeInput, this.riskPercentInput].forEach(input => {
            if (input) {
                input.addEventListener('change', () => this.saveSettings());
            }
        });
    }

    // Load saved risk settings
    loadSettings() {
        try {
            const savedSettings = JSON.parse(localStorage.getItem('riskSettings')) || {};
            
            if (this.accountSizeInput) {
                this.accountSizeInput.value = savedSettings.accountSize || this.defaultAccountSize;
            }
            
            if (this.riskPercentInput) {
                this.riskPercentInput.value = savedSettings.riskPercent || this.defaultRiskPercent;
            }
        } catch (error) {
            console.error('Error loading risk settings:', error);
            // Use default values if there's an error
            if (this.accountSizeInput) this.accountSizeInput.value = this.defaultAccountSize;
            if (this.riskPercentInput) this.riskPercentInput.value = this.defaultRiskPercent;
        }
    }

    // Save risk settings
    saveSettings() {
        try {
            const settings = {
                accountSize: parseFloat(this.accountSizeInput?.value) || this.defaultAccountSize,
                riskPercent: parseFloat(this.riskPercentInput?.value) || this.defaultRiskPercent
            };
            
            localStorage.setItem('riskSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving risk settings:', error);
        }
    }

    // Calculate position size
    calculatePosition() {
        try {
            // Get values from inputs with fallbacks
            const accountSize = parseFloat(this.accountSizeInput?.value) || this.defaultAccountSize;
            const riskPercent = parseFloat(this.riskPercentInput?.value) || this.defaultRiskPercent;
            const entryPrice = parseFloat(this.entryPriceInput?.value) || 0;
            const stopLossPrice = parseFloat(this.stopLossPriceInput?.value) || 0;
            
            console.log('Calculating position with values:', { accountSize, riskPercent, entryPrice, stopLossPrice });
            
            // Validate inputs
            if (!entryPrice || !stopLossPrice) {
                console.log('Missing entry price or stop loss price');
                this.displayResults(0, 0, 0);
                this.clearTargets();
                return;
            }
            
            // Calculate risk amount (capital × risk percentage)
            const riskAmount = accountSize * (riskPercent / 100);
            
            // Calculate risk per share
            const riskPerShare = Math.abs(entryPrice - stopLossPrice);
            if (riskPerShare === 0) {
                console.log('Risk per share is zero (entry price equals stop loss price)');
                this.displayResults(0, 0, 0);
                this.clearTargets();
                return;
            }
            
            // Calculate position size (shares)
            const shares = Math.floor(riskAmount / riskPerShare);
            
            // Calculate position value
            const positionValue = shares * entryPrice;
            
            console.log('Calculated position results:', { riskAmount, shares, positionValue });
            
            // Display results
            this.displayResults(riskAmount, shares, positionValue);
            
            // Calculate and display targets
            this.calculateTargets(entryPrice, stopLossPrice, shares);
        } catch (error) {
            console.error('Error in position calculation:', error);
        }
    }

    // Display results in the UI
    displayResults(riskAmount, shares, positionValue) {
        try {
            if (this.amountAtRiskElement) {
                this.amountAtRiskElement.textContent = this.formatCurrency(riskAmount);
            } else {
                console.warn('Amount at risk element not found');
            }
            
            if (this.positionSizeElement) {
                this.positionSizeElement.textContent = shares.toLocaleString('en-IN');
            } else {
                console.warn('Position size element not found');
            }
            
            if (this.positionValueElement) {
                this.positionValueElement.textContent = this.formatCurrency(positionValue);
            } else {
                console.warn('Position value element not found');
            }
        } catch (error) {
            console.error('Error displaying results:', error);
        }
    }

    // Calculate profit targets based on risk-reward ratios
    calculateTargets(entryPrice, stopLossPrice, shares) {
        try {
            if (!this.targetTableBody) {
                console.warn('Target table body not found');
                return;
            }
            
            // Clear previous targets
            this.clearTargets();
            
            // Determine if trade is long or short
            const isLong = entryPrice > stopLossPrice;
            
            // Calculate risk per share
            const riskPerShare = Math.abs(entryPrice - stopLossPrice);
            
            // Generate target rows
            let html = '';
            this.defaultRiskRewardRatios.forEach(ratio => {
                // Calculate target price
                const targetPrice = isLong ? 
                    entryPrice + (riskPerShare * ratio) : 
                    entryPrice - (riskPerShare * ratio);
                
                // Calculate potential profit
                const profitPerShare = Math.abs(targetPrice - entryPrice);
                const totalProfit = profitPerShare * shares;
                
                // Create table row
                html += `
                    <tr>
                        <td>${ratio}:1</td>
                        <td>${this.formatCurrency(targetPrice)}</td>
                        <td class="profit">${this.formatCurrency(totalProfit)}</td>
                    </tr>
                `;
            });
            
            this.targetTableBody.innerHTML = html;
        } catch (error) {
            console.error('Error calculating targets:', error);
        }
    }

    // Clear target table
    clearTargets() {
        if (this.targetTableBody) {
            this.targetTableBody.innerHTML = '';
        }
    }

    // Format currency in Indian Rupees
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Initialize Risk Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.riskManager = new RiskManager();

    // Add direct click handler as a fallback
    const riskCalculatorSection = document.getElementById('risk-calculator');
    if (riskCalculatorSection) {
        const calculateBtn = riskCalculatorSection.querySelector('#calculate-position');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Direct calculate button click handler');
                if (window.riskManager) {
                    window.riskManager.calculatePosition();
                } else {
                    console.error('Risk manager not initialized!');
                }
            });
        }
    }
});