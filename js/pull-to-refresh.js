/**
 * Pull-to-refresh functionality for Trading Journal
 * Allows users to pull down on mobile to refresh trading data
 */

class PullToRefresh {
    constructor(options = {}) {
        this.targetElement = options.targetElement || document.querySelector('.dashboard-content');
        this.threshold = options.threshold || 70;
        this.maxPull = options.maxPull || 150;
        this.refreshFunction = options.refreshFunction || this.defaultRefresh;
        this.indicatorClass = options.indicatorClass || 'pull-to-refresh';
        
        this.init();
    }
    
    init() {
        // Only initialize on touch devices and if target element exists
        if (!('ontouchstart' in window) || !this.targetElement) {
            console.log('Pull-to-refresh not initialized: not a touch device or target element not found');
            return;
        }
        
        this.createIndicator();
        this.setupEventListeners();
        console.log('Pull-to-refresh initialized successfully');
    }
    
    createIndicator() {
        // Create the refresh indicator element
        this.indicator = document.createElement('div');
        this.indicator.className = this.indicatorClass;
        this.indicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
        document.body.appendChild(this.indicator);
    }
    
    setupEventListeners() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        let scrollTop = 0;
        
        // Touch start event
        this.targetElement.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            scrollTop = this.targetElement.scrollTop;
            
            // Only activate if at the top of the element
            if (scrollTop <= 0) {
                pulling = true;
            }
        }, { passive: true });
        
        // Touch move event
        this.targetElement.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            // Only activate pull if scrolled to top and pulling down
            if (pullDistance > 0 && scrollTop <= 0) {
                // Calculate how far down to pull (with resistance)
                const pullDistanceWithResistance = Math.min(this.maxPull, pullDistance / 2);
                
                // Show and position the indicator
                this.indicator.classList.add('visible');
                if (pullDistanceWithResistance >= this.threshold) {
                    this.indicator.classList.add('pulling');
                } else {
                    this.indicator.classList.remove('pulling');
                }
                
                // Prevent regular scrolling behavior
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
        
        // Touch end event
        this.targetElement.addEventListener('touchend', () => {
            if (!pulling) return;
            pulling = false;
            
            const pullDistance = currentY - startY;
            
            if (pullDistance >= this.threshold && scrollTop <= 0) {
                // Trigger refresh
                this.indicator.classList.remove('pulling');
                this.indicator.classList.add('refreshing');
                this.indicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
                
                // Call the refresh function
                this.refreshFunction()
                    .then(() => {
                        // Success - hide indicator after a delay
                        setTimeout(() => {
                            this.indicator.classList.remove('visible', 'refreshing');
                        }, 500);
                    })
                    .catch((error) => {
                        // Error - show error state
                        console.error('Refresh failed:', error);
                        this.indicator.innerHTML = '<i class="fas fa-times"></i>';
                        
                        // Hide after delay
                        setTimeout(() => {
                            this.indicator.classList.remove('visible', 'refreshing');
                        }, 1000);
                    });
            } else {
                // Not pulled far enough, hide indicator
                this.indicator.classList.remove('visible', 'pulling');
            }
        });
    }
    
    // Default refresh function - override this with your own implementation
    defaultRefresh() {
        return new Promise((resolve) => {
            console.log('Refreshing data...');
            
            // Simulate API call - replace with actual data refresh
            setTimeout(() => {
                console.log('Data refreshed successfully');
                
                // Show notification to user
                if (window.showNotification) {
                    window.showNotification('Data refreshed successfully', 'success');
                }
                
                resolve();
            }, 1500);
        });
    }
}

// Initialize once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pullToRefresh = new PullToRefresh({
        // Custom refresh function to update trading data
        refreshFunction: async () => {
            try {
                // Fetch updated trade data
                await updateTradeData();
                
                // Update dashboard statistics
                if (window.updateDashboardStats) {
                    window.updateDashboardStats();
                }
                
                // Update charts
                if (window.updateCharts) {
                    window.updateCharts();
                }
                
                return Promise.resolve();
            } catch (error) {
                console.error('Error refreshing data:', error);
                return Promise.reject(error);
            }
        }
    });
});

// Function to update trade data
async function updateTradeData() {
    try {
        // Get user ID from local storage
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('User not logged in');
        }
        
        // Fetch updated trade data from your backend
        const response = await fetch(`https://trading-journal-backend.onrender.com/api/trades?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch trade data');
        }
        
        const trades = await response.json();
        
        // Update the trades in local storage or state management
        localStorage.setItem('trades', JSON.stringify(trades));
        
        // Update the UI with new trade data
        if (window.renderTrades) {
            window.renderTrades(trades);
        }
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error updating trade data:', error);
        return Promise.reject(error);
    }
}