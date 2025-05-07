/**
 * Trading Streak & Milestone Tracking System
 * 
 * This file contains functionality for tracking trading streaks and milestones.
 * To remove this feature, simply remove this file and the corresponding CSS file.
 */

class StreakMilestoneTracker {
    constructor() {
        this.storageKey = 'tradingStreakData';
        this.streakData = this.loadStreakData();
        this.initialized = false;
        this.containerId = 'streak-milestone-container';
    }

    /**
     * Initialize the streak and milestone tracker
     */
    init() {
        if (this.initialized) return;
        
        // Create the streak widget structure
        this.createStreakWidget();
        
        // Add event listeners
        this.addEventListeners();
        
        // Update streak when trades are added or deleted
        this.setupTradeListeners();
        
        this.initialized = true;
    }

    /**
     * Create streak widget structure
     */
    createStreakWidget() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID ${this.containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="streak-milestone-widget">
                <div class="streak-header">
                    <h3><i class="fas fa-fire"></i> Trading Streak & Milestones</h3>
                </div>
                <div class="streak-tabs">
                    <div class="streak-tab active" data-tab="current">Current Streak</div>
                    <div class="streak-tab" data-tab="milestones">Milestones</div>
                    <div class="streak-tab" data-tab="history">History</div>
                </div>
                <div class="streak-content">
                    <div class="streak-tab-content active" id="streak-tab-current">
                        <div class="streak-display">
                            <div class="streak-counter">${this.getCurrentStreak()}</div>
                            <div class="streak-label">Day Trading Streak</div>
                            <div class="streak-separator"></div>
                            <div class="streak-subtext">Keep trading consistently to build your streak!</div>
                        </div>
                    </div>
                    <div class="streak-tab-content" id="streak-tab-milestones">
                        ${this.renderMilestones()}
                    </div>
                    <div class="streak-tab-content" id="streak-tab-history">
                        ${this.renderStreakHistory()}
                    </div>
                </div>
            </div>
        `;

        // Update the UI
        this.updateStreakDisplay();
    }

    /**
     * Add event listeners for the widget
     */
    addEventListeners() {
        // Tab switching
        const tabs = document.querySelectorAll('.streak-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabContents = document.querySelectorAll('.streak-tab-content');
                tabContents.forEach(content => content.classList.remove('active'));
                
                const targetTab = tab.getAttribute('data-tab');
                document.getElementById(`streak-tab-${targetTab}`).classList.add('active');
            });
        });
    }

    /**
     * Setup listeners for trade changes
     */
    setupTradeListeners() {
        // Use MutationObserver to detect when trades are added or deleted
        const tradesList = document.getElementById('trades-list');
        if (tradesList) {
            const observer = new MutationObserver(() => {
                this.updateStreak();
            });
            
            observer.observe(tradesList, { childList: true, subtree: true });
        }
        
        // Intercept the addTrade function to update streak
        const originalAddTrade = window.addTrade;
        if (originalAddTrade) {
            window.addTrade = (trade) => {
                originalAddTrade(trade);
                this.updateStreak();
            };
        }
        
        // Intercept the deleteTrade function to update streak
        const originalDeleteTrade = window.deleteTrade;
        if (originalDeleteTrade) {
            window.deleteTrade = (id) => {
                originalDeleteTrade(id);
                this.updateStreak();
            };
        }
    }

    /**
     * Load streak data from localStorage
     */
    loadStreakData() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            return JSON.parse(data);
        }
        
        // Default data structure
        return {
            currentStreak: 0,
            bestStreak: 0,
            lastTradeDate: null,
            streakHistory: [],
            completedMilestones: []
        };
    }

    /**
     * Save streak data to localStorage
     */
    saveStreakData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.streakData));
    }

    /**
     * Get the current streak
     */
    getCurrentStreak() {
        return this.streakData.currentStreak || 0;
    }

    /**
     * Get the best streak
     */
    getBestStreak() {
        return this.streakData.bestStreak || 0;
    }

    /**
     * Update the streak based on trade history
     */
    updateStreak() {
        const trades = this.loadTrades();
        if (!trades || trades.length === 0) {
            this.streakData.currentStreak = 0;
            this.streakData.lastTradeDate = null;
            this.saveStreakData();
            this.updateStreakDisplay();
            return;
        }
        
        // Sort trades by date
        trades.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Get dates of trades
        const tradeDates = trades.map(trade => {
            const date = new Date(trade.date);
            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        });
        
        // Get unique dates
        const uniqueDates = [...new Set(tradeDates)];
        
        // Calculate streak
        let currentStreak = 1;
        let maxStreak = 1;
        let streaks = [];
        
        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            
            // Check if dates are consecutive trading days (excluding weekends)
            const dayDiff = this.getBusinessDaysDifference(prevDate, currDate);
            
            if (dayDiff === 1) {
                currentStreak++;
            } else {
                // Record the streak that just ended
                if (currentStreak > 1) {
                    streaks.push({
                        endDate: uniqueDates[i - 1],
                        length: currentStreak
                    });
                }
                currentStreak = 1;
            }
            
            maxStreak = Math.max(maxStreak, currentStreak);
        }
        
        // Add the final streak to history if it's significant
        if (currentStreak > 1) {
            streaks.push({
                endDate: uniqueDates[uniqueDates.length - 1],
                length: currentStreak
            });
        }
        
        // Update streak data
        const lastTradeDate = uniqueDates[uniqueDates.length - 1];
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        
        // Check if the streak is still active (last trade is today or yesterday was a business day)
        let isStreakActive = lastTradeDate === todayStr;
        
        if (!isStreakActive) {
            const lastDate = new Date(lastTradeDate);
            const dayDiff = this.getBusinessDaysDifference(lastDate, today);
            isStreakActive = dayDiff <= 1;
        }
        
        // Update streak data
        this.streakData.currentStreak = isStreakActive ? currentStreak : 0;
        this.streakData.bestStreak = Math.max(this.streakData.bestStreak, maxStreak);
        this.streakData.lastTradeDate = lastTradeDate;
        
        // Update streak history with unique entries
        if (streaks.length > 0) {
            // Merge with existing history, avoiding duplicates
            const existingEndDates = this.streakData.streakHistory.map(s => s.endDate);
            const newStreaks = streaks.filter(s => !existingEndDates.includes(s.endDate));
            
            this.streakData.streakHistory = [
                ...this.streakData.streakHistory,
                ...newStreaks
            ].sort((a, b) => new Date(b.endDate) - new Date(a.endDate)).slice(0, 10); // Keep only last 10
        }
        
        // Check for milestone achievements
        this.checkMilestones();
        
        // Save updated data
        this.saveStreakData();
        
        // Update the UI
        this.updateStreakDisplay();
    }

    /**
     * Calculate business days between two dates (excluding weekends)
     */
    getBusinessDaysDifference(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set to beginning of day
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Calculate the difference in days
        let daysDiff = Math.round((end - start) / (1000 * 60 * 60 * 24));
        
        // Adjust for weekends
        let startDay = start.getDay(); // 0=Sunday, 6=Saturday
        let endDay = end.getDay();
        
        // Count weekends
        const fullWeeks = Math.floor(daysDiff / 7);
        const weekendDays = fullWeeks * 2;
        
        // Handle remaining days
        let extraDays = daysDiff % 7;
        let extraWeekends = 0;
        
        if (extraDays > 0) {
            // Check if the remaining days span a weekend
            if (startDay === 6) {
                extraWeekends += 1; // Saturday is always counted as weekend
            }
            
            if (startDay + extraDays >= 7) {
                extraWeekends += 1; // Sunday is encountered
            }
        }
        
        // Subtract weekends from total days
        return daysDiff - (weekendDays + extraWeekends);
    }

    /**
     * Check for achieved milestones
     */
    checkMilestones() {
        const milestones = this.getMilestones();
        const currentStreak = this.streakData.currentStreak;
        const bestStreak = this.streakData.bestStreak;
        
        // Check streak-based milestones
        milestones
            .filter(m => m.type === 'streak' && m.target <= bestStreak)
            .forEach(milestone => {
                if (!this.streakData.completedMilestones.includes(milestone.id)) {
                    this.streakData.completedMilestones.push(milestone.id);
                    
                    // Show celebration notification
                    this.showMilestoneNotification(milestone);
                }
            });
    }

    /**
     * Show milestone achievement notification
     */
    showMilestoneNotification(milestone) {
        if (typeof showNotification === 'function') {
            showNotification(`🏆 Milestone Achieved: ${milestone.title}`, 'success');
        }
    }

    /**
     * Update the streak display
     */
    updateStreakDisplay() {
        const counterElement = document.querySelector('.streak-counter');
        if (counterElement) {
            const oldStreak = parseInt(counterElement.textContent);
            const newStreak = this.getCurrentStreak();
            
            // Update the counter
            counterElement.textContent = newStreak;
            
            // Show animation if streak increased
            if (newStreak > oldStreak) {
                counterElement.classList.add('celebrate-animation');
                setTimeout(() => {
                    counterElement.classList.remove('celebrate-animation');
                }, 1000);
            }
        }
        
        // Update milestones tab
        const milestonesTab = document.getElementById('streak-tab-milestones');
        if (milestonesTab) {
            milestonesTab.innerHTML = this.renderMilestones();
        }
        
        // Update history tab
        const historyTab = document.getElementById('streak-tab-history');
        if (historyTab) {
            historyTab.innerHTML = this.renderStreakHistory();
        }
    }

    /**
     * Get predefined milestones
     */
    getMilestones() {
        return [
            { 
                id: 'streak-3', 
                title: '3-Day Streak', 
                description: 'Trade for 3 consecutive days',
                type: 'streak', 
                target: 3 
            },
            { 
                id: 'streak-5', 
                title: '5-Day Streak', 
                description: 'Trade for 5 consecutive days',
                type: 'streak', 
                target: 5 
            },
            { 
                id: 'streak-10', 
                title: '10-Day Streak', 
                description: 'Trade for 10 consecutive days',
                type: 'streak', 
                target: 10 
            },
            { 
                id: 'streak-15', 
                title: '15-Day Streak', 
                description: 'Trade for 15 consecutive days',
                type: 'streak', 
                target: 15 
            },
            { 
                id: 'streak-20', 
                title: '20-Day Streak', 
                description: 'Trade for 20 consecutive days',
                type: 'streak', 
                target: 20 
            },
            { 
                id: 'streak-30', 
                title: '30-Day Streak', 
                description: 'Trade for 30 consecutive days',
                type: 'streak', 
                target: 30 
            }
        ];
    }

    /**
     * Render milestone progress
     */
    renderMilestones() {
        const milestones = this.getMilestones();
        const bestStreak = this.getBestStreak();
        const currentStreak = this.getCurrentStreak();
        
        if (milestones.length === 0) {
            return `
                <div class="empty-streak">
                    <i class="fas fa-trophy"></i>
                    <p>No milestones available yet.</p>
                </div>
            `;
        }
        
        let milestonesHtml = `<ul class="milestone-list">`;
        
        milestones.forEach(milestone => {
            const isCompleted = this.streakData.completedMilestones.includes(milestone.id);
            const isInProgress = !isCompleted && currentStreak > 0;
            const progress = isCompleted ? 100 : Math.min(100, Math.round((currentStreak / milestone.target) * 100));
            
            let statusClass = isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'future';
            let badgeClass = isCompleted ? 'badge-completed' : isInProgress ? 'badge-in-progress' : 'badge-future';
            let badgeText = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Future';
            let iconClass = isCompleted ? 'fa-check' : isInProgress ? 'fa-spinner' : 'fa-hourglass';
            
            milestonesHtml += `
                <li class="milestone-item">
                    <div class="milestone-icon ${statusClass}">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="milestone-details">
                        <div class="milestone-title">${milestone.title}</div>
                        <div class="milestone-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="progress-text">${progress}%</div>
                        </div>
                    </div>
                    <div class="milestone-badge ${badgeClass}">${badgeText}</div>
                </li>
            `;
        });
        
        milestonesHtml += `</ul>`;
        return milestonesHtml;
    }

    /**
     * Render streak history
     */
    renderStreakHistory() {
        const history = this.streakData.streakHistory || [];
        
        if (history.length === 0) {
            return `
                <div class="empty-streak">
                    <i class="fas fa-history"></i>
                    <p>No streak history available yet.</p>
                </div>
            `;
        }
        
        let historyHtml = `<div class="streak-history">`;
        
        history.forEach((record, index) => {
            const endDate = new Date(record.endDate);
            const formattedDate = endDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            historyHtml += `
                <div class="history-item">
                    <div class="history-date">${formattedDate}</div>
                    <div class="history-streak">${record.length} day streak</div>
                </div>
            `;
        });
        
        historyHtml += `</div>`;
        return historyHtml;
    }

    /**
     * Load trades from localStorage (using the app's existing function)
     */
    loadTrades() {
        if (typeof window.loadTrades === 'function') {
            return window.loadTrades();
        }
        
        // Fallback if loadTrades not available
        const trades = localStorage.getItem('trades');
        return trades ? JSON.parse(trades) : [];
    }
}

// Initialize the streak tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add the container for the streak tracker if it doesn't exist
    const dashboardEl = document.querySelector('.dashboard');
    if (dashboardEl && !document.getElementById('streak-milestone-container')) {
        const container = document.createElement('div');
        container.id = 'streak-milestone-container';
        
        // Insert after the recent trades section
        const recentTrades = dashboardEl.querySelector('.recent-trades');
        if (recentTrades) {
            recentTrades.insertAdjacentElement('afterend', container);
        } else {
            dashboardEl.appendChild(container);
        }
    }
    
    // Initialize the streak tracker
    window.streakTracker = new StreakMilestoneTracker();
    window.streakTracker.init();
});