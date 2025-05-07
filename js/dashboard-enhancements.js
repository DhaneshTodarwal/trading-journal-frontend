// Dashboard Enhancements - Additional widgets for Trading Journal
// This file adds four new dashboard components:
// 1. Performance Summary Card
// 2. Risk Management Metrics
// 3. Trade Consistency Chart
// 4. Upcoming Market Events Calendar

// ======================= Performance Summary Card =======================

// Function to render the Performance Summary Card
function renderPerformanceSummaryCard() {
    // Find container to add the card
    const dashboardCharts = document.querySelector('.dashboard-charts');
    if (!dashboardCharts) return;
    
    // Check if the card already exists to prevent duplication
    if (document.querySelector('.performance-summary-card')) {
        return;
    }
    
    // Calculate monthly P&L
    const trades = loadTrades();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
    });
    
    // Calculate monthly P&L
    let monthlyPL = 0;
    monthlyTrades.forEach(trade => {
        if (trade.profitLoss) {
            monthlyPL += parseFloat(trade.profitLoss);
        } else if (trade.profitLossPercentage && trade.strikePrice) {
            // Calculate approximate P&L if actual amount isn't stored
            const pl = (parseFloat(trade.profitLossPercentage) / 100) * parseFloat(trade.strikePrice);
            monthlyPL += pl;
        }
    });
    
    // Calculate win rate
    const winningTrades = trades.filter(t => parseFloat(t.profitLossPercentage) > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(1) : 0;
    
    // Find best performing setup/strategy
    let strategies = {};
    let bestStrategy = 'N/A';
    let bestStrategyReturn = -Infinity;
    
    trades.forEach(trade => {
        if (trade.strategy) {
            if (!strategies[trade.strategy]) {
                strategies[trade.strategy] = {
                    count: 0,
                    totalReturn: 0,
                    wins: 0
                };
            }
            
            strategies[trade.strategy].count++;
            strategies[trade.strategy].totalReturn += parseFloat(trade.profitLossPercentage) || 0;
            
            if (parseFloat(trade.profitLossPercentage) > 0) {
                strategies[trade.strategy].wins++;
            }
        }
    });
    
    // Find strategy with best average return
    for (let strategy in strategies) {
        if (strategies[strategy].count >= 3) { // Minimum 3 trades to consider
            const avgReturn = strategies[strategy].totalReturn / strategies[strategy].count;
            if (avgReturn > bestStrategyReturn) {
                bestStrategyReturn = avgReturn;
                bestStrategy = strategy;
            }
        }
    }
    
    // Create the performance summary card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'chart-container performance-summary-card';
    summaryCard.innerHTML = `
        <h3><i class="fas fa-chart-line"></i> Performance Summary</h3>
        <div class="performance-summary">
            <div class="summary-item">
                <div class="summary-label">Monthly P&L</div>
                <div class="summary-value ${monthlyPL >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(monthlyPL)}
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Win Rate</div>
                <div class="summary-value ${winRate >= 50 ? 'positive' : 'negative'}">
                    ${winRate}%
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Best Setup</div>
                <div class="summary-value">
                    ${bestStrategy} ${bestStrategyReturn > 0 ? `(+${bestStrategyReturn.toFixed(1)}%)` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Insert the card at the beginning
    dashboardCharts.insertBefore(summaryCard, dashboardCharts.firstChild);
    
    // Add styles
    addStyles(`
        .performance-summary-card {
            grid-column: span 2;
            margin-bottom: 20px;
        }
        
        .performance-summary {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 15px;
            margin-top: 15px;
        }
        
        .summary-item {
            flex: 1;
            min-width: 150px;
            padding: 15px;
            border-radius: 8px;
            background-color: rgba(255, 255, 255, 0.05);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        
        .dark-theme .summary-item {
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }
        
        .summary-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dark-theme .summary-item:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }
        
        .summary-label {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #666;
        }
        
        .dark-theme .summary-label {
            color: #aaa;
        }
        
        .summary-value {
            font-size: 20px;
            font-weight: 700;
        }
        
        .summary-value.positive {
            color: #28a745;
        }
        
        .summary-value.negative {
            color: #dc3545;
        }
        
        .dark-theme .summary-value.positive {
            color: #5cb85c;
        }
        
        .dark-theme .summary-value.negative {
            color: #d9534f;
        }
        
        @media (max-width: 768px) {
            .summary-item {
                min-width: 100%;
            }
        }
    `);
}

// ======================= Risk Management Metrics =======================

// Function to render Risk Management Metrics
function renderRiskManagementMetrics() {
    // Find container to add the metrics
    const dashboardCharts = document.querySelector('.dashboard-charts');
    if (!dashboardCharts) return;
    
    // Check if the card already exists to prevent duplication
    if (document.querySelector('.risk-metrics-card')) {
        return;
    }
    
    const trades = loadTrades();
    
    // Calculate metrics
    const metrics = calculateRiskMetrics(trades);
    
    // Create the risk metrics card
    const riskCard = document.createElement('div');
    riskCard.className = 'chart-container risk-metrics-card';
    riskCard.innerHTML = `
        <h3><i class="fas fa-shield-alt"></i> Risk Management Metrics</h3>
        <div class="risk-metrics">
            <div class="risk-metric">
                <div class="metric-icon">
                    <i class="fas fa-chart-area"></i>
                </div>
                <div class="metric-details">
                    <div class="metric-label">Max Drawdown</div>
                    <div class="metric-value ${metrics.maxDrawdown > 20 ? 'negative' : 'neutral'}">
                        ${metrics.maxDrawdown.toFixed(2)}%
                    </div>
                </div>
            </div>
            
            <div class="risk-metric">
                <div class="metric-icon">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="metric-details">
                    <div class="metric-label">Kelly %</div>
                    <div class="metric-value ${metrics.kellyPercentage < 0 ? 'negative' : 'positive'}">
                        ${metrics.kellyPercentage.toFixed(1)}%
                    </div>
                </div>
            </div>
            
            <div class="risk-metric">
                <div class="metric-icon">
                    <i class="fas fa-balance-scale"></i>
                </div>
                <div class="metric-details">
                    <div class="metric-label">Profit Factor</div>
                    <div class="metric-value ${metrics.profitFactor >= 1.5 ? 'positive' : (metrics.profitFactor < 1 ? 'negative' : 'neutral')}">
                        ${metrics.profitFactor.toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="risk-metric">
                <div class="metric-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="metric-details">
                    <div class="metric-label">Optimal Position</div>
                    <div class="metric-value">
                        ${metrics.optimalPosition.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert after performance summary card
    if (dashboardCharts.querySelector('.performance-summary-card')) {
        dashboardCharts.insertBefore(riskCard, dashboardCharts.querySelector('.performance-summary-card').nextSibling);
    } else {
        dashboardCharts.insertBefore(riskCard, dashboardCharts.firstChild);
    }
    
    // Add styles
    addStyles(`
        .risk-metrics-card {
            grid-column: span 2;
            margin-bottom: 20px;
        }
        
        .risk-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .risk-metric {
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        
        .dark-theme .risk-metric {
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }
        
        .risk-metric:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dark-theme .risk-metric:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }
        
        .metric-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: rgba(0, 123, 255, 0.1);
            color: #007bff;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 18px;
        }
        
        .dark-theme .metric-icon {
            background-color: rgba(0, 123, 255, 0.2);
            color: #3a9fff;
        }
        
        .metric-details {
            flex: 1;
        }
        
        .metric-label {
            font-size: 13px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .dark-theme .metric-label {
            color: #aaa;
        }
        
        .metric-value {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        .dark-theme .metric-value {
            color: #e1e1e1;
        }
        
        .metric-value.positive {
            color: #28a745;
        }
        
        .metric-value.negative {
            color: #dc3545;
        }
        
        .metric-value.neutral {
            color: #fd7e14;
        }
        
        .dark-theme .metric-value.positive {
            color: #5cb85c;
        }
        
        .dark-theme .metric-value.negative {
            color: #d9534f;
        }
        
        .dark-theme .metric-value.neutral {
            color: #f0ad4e;
        }
        
        @media (max-width: 768px) {
            .risk-metrics {
                grid-template-columns: 1fr;
            }
        }
    `);
}

// Helper function to calculate risk metrics
function calculateRiskMetrics(trades) {
    // Default values if not enough data
    if (!trades || trades.length < 5) {
        return {
            maxDrawdown: 0,
            kellyPercentage: 0,
            profitFactor: 0,
            optimalPosition: 2 // Default to 2% if not enough data
        };
    }
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate maximum drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let equity = 0;
    
    sortedTrades.forEach(trade => {
        const profitLossPercent = parseFloat(trade.profitLossPercentage) || 0;
        equity += profitLossPercent;
        
        if (equity > peak) {
            peak = equity;
        }
        
        const drawdown = ((peak - equity) / (100 + peak)) * 100;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });
    
    // Calculate profit factor
    let grossProfit = 0;
    let grossLoss = 0;
    
    trades.forEach(trade => {
        const profitLossPercent = parseFloat(trade.profitLossPercentage) || 0;
        if (profitLossPercent > 0) {
            grossProfit += profitLossPercent;
        } else {
            grossLoss += Math.abs(profitLossPercent);
        }
    });
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    // Calculate Kelly percentage
    const winCount = trades.filter(t => parseFloat(t.profitLossPercentage) > 0).length;
    const lossCount = trades.filter(t => parseFloat(t.profitLossPercentage) <= 0).length;
    
    const winRate = trades.length > 0 ? winCount / trades.length : 0;
    const lossRate = trades.length > 0 ? lossCount / trades.length : 0;
    
    const avgWin = winCount > 0 ? (grossProfit / winCount) : 0;
    const avgLoss = lossCount > 0 ? (grossLoss / lossCount) : 1; // Avoid division by zero
    
    // Kelly formula: f* = (p * b - q) / b
    // where p = probability of win, q = probability of loss (1-p), b = win/loss ratio
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 1;
    const kellyPercentage = (winRate * winLossRatio - lossRate) / winLossRatio * 100;
    
    // Calculate optimal position size (half-Kelly for safety)
    const optimalPosition = Math.max(0.5, Math.min(5, kellyPercentage / 2));
    
    return {
        maxDrawdown,
        kellyPercentage,
        profitFactor,
        optimalPosition
    };
}

// ======================= Trade Consistency Chart =======================

// Function to render Trade Consistency Chart
function renderConsistencyChart() {
    const dashboardCharts = document.querySelector('.dashboard-charts');
    if (!dashboardCharts) return;
    
    // Check if the chart already exists to prevent duplication
    if (document.querySelector('.consistency-chart')) {
        return;
    }
    
    // Get trades sorted by date
    const trades = loadTrades();
    if (trades.length < 5) return; // Need at least 5 trades for meaningful consistency
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get the last 20 trades or all if less than 20
    const recentTrades = sortedTrades.slice(-20);
    
    // Create data for chart
    const labels = recentTrades.map((trade, index) => {
        const date = new Date(trade.date);
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    });
    
    const data = recentTrades.map(trade => parseFloat(trade.profitLossPercentage) || 0);
    
    // Create container for the chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container consistency-chart';
    chartContainer.innerHTML = `
        <h3><i class="fas fa-sliders-h"></i> Trade Consistency</h3>
        <canvas id="consistency-chart"></canvas>
    `;
    
    // Insert before the existing charts
    dashboardCharts.appendChild(chartContainer);
    
    // Initialize the chart
    const ctx = document.getElementById('consistency-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'P&L %',
                data: data,
                backgroundColor: data.map(value => value >= 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'),
                borderColor: data.map(value => value >= 0 ? 'rgb(40, 167, 69)' : 'rgb(220, 53, 69)'),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 5,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return recentTrades[tooltipItems[0].dataIndex].stock;
                        },
                        label: function(context) {
                            const trade = recentTrades[context.dataIndex];
                            const value = context.parsed.y;
                            return [
                                `Date: ${new Date(trade.date).toLocaleDateString('en-IN')}`,
                                `P&L: ${value}%`,
                                `Type: ${trade.tradeType || 'N/A'}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'P&L %',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Recent Trades',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Add styles
    addStyles(`
        .consistency-chart {
            grid-column: span 2;
            margin-top: 20px;
            height: 300px;
        }
        
        .consistency-chart canvas {
            min-height: 250px;
        }
    `);
}

// ======================= Upcoming Market Events Calendar =======================

// Function to render Upcoming Market Events Calendar
function renderUpcomingEventsWidget() {
    // Find container to add events
    const dashboardContainer = document.querySelector('#dashboard');
    if (!dashboardContainer) return;
    
    // Check if the widget already exists to prevent duplication
    if (document.querySelector('.market-events-widget')) {
        return;
    }
    
    // Create market events widget
    const eventsWidget = document.createElement('div');
    eventsWidget.className = 'market-events-widget';
    eventsWidget.innerHTML = `
        <h3><i class="fas fa-calendar-alt"></i> Upcoming Market Events</h3>
        <div class="market-events">
            <!-- Event data will be loaded here -->
        </div>
    `;
    
    // Insert the widget after the dashboard charts section
    const dashboardCharts = document.querySelector('.dashboard-charts');
    if (dashboardCharts) {
        dashboardCharts.parentNode.insertBefore(eventsWidget, dashboardCharts.nextSibling);
    } else {
        dashboardContainer.appendChild(eventsWidget);
    }
    
    // Load market events (this would normally come from an API)
    loadMarketEvents();
    
    // Add styles
    addStyles(`
        .market-events-widget {
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            background-color: #fff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .dark-theme .market-events-widget {
            background-color: #22272e;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .market-events-widget h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: 600;
        }
        
        .market-events {
            max-height: 320px;
            overflow-y: auto;
            padding-right: 5px;
        }
        
        .event {
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
            background-color: #f8f9fa;
            transition: all 0.3s ease;
            border-left: 4px solid #007bff;
        }
        
        .dark-theme .event {
            background-color: #2d333b;
            border-left: 4px solid #0d6efd;
        }
        
        .event:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .dark-theme .event:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .event-date {
            min-width: 80px;
            text-align: center;
            padding: 8px 0;
            font-weight: 600;
            font-size: 14px;
            border-radius: 5px;
            margin-right: 15px;
            background-color: rgba(0, 123, 255, 0.1);
            color: #0d6efd;
        }
        
        .dark-theme .event-date {
            background-color: rgba(13, 110, 253, 0.2);
            color: #669eff;
        }
        
        .event-details {
            flex: 1;
        }
        
        .event-name {
            font-weight: 500;
            margin-bottom: 5px;
            font-size: 15px;
        }
        
        .event-time {
            display: inline-block;
            font-size: 13px;
            color: #666;
            margin-right: 10px;
        }
        
        .dark-theme .event-time {
            color: #aaa;
        }
        
        .event-impact {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            color: #fff;
        }
        
        .event-impact.high {
            background-color: #dc3545;
        }
        
        .event-impact.medium {
            background-color: #fd7e14;
        }
        
        .event-impact.low {
            background-color: #28a745;
        }
        
        .event.past {
            opacity: 0.6;
        }
        
        .event.current {
            border-left-color: #dc3545;
            background-color: rgba(220, 53, 69, 0.05);
        }
        
        .dark-theme .event.current {
            border-left-color: #ff6b6b;
            background-color: rgba(220, 53, 69, 0.15);
        }
    `);
}

// Helper function to load market events
function loadMarketEvents() {
    const eventsContainer = document.querySelector('.market-events');
    if (!eventsContainer) return;
    
    // These would normally come from an API or backend
    // Here we're hard-coding some sample events for April 2025
    const events = [
        {
            date: 'Apr 21',
            name: 'RBI Policy Meeting',
            time: '10:00 AM',
            impact: 'high',
            description: 'Reserve Bank of India Monetary Policy Meeting'
        },
        {
            date: 'Apr 23',
            name: 'Inflation Data',
            time: '11:30 AM',
            impact: 'medium',
            description: 'Monthly inflation figures release'
        },
        {
            date: 'Apr 25',
            name: 'GDP Forecast',
            time: '09:00 AM',
            impact: 'high',
            description: 'Quarterly GDP forecast announcement'
        },
        {
            date: 'Apr 27',
            name: 'US FOMC Meeting',
            time: '07:30 PM',
            impact: 'high',
            description: 'Federal Open Market Committee Meeting'
        },
        {
            date: 'Apr 28',
            name: 'Auto Sales Data',
            time: '03:00 PM',
            impact: 'low',
            description: 'Monthly auto sales figures release'
        },
        {
            date: 'Apr 30',
            name: 'Manufacturing PMI',
            time: '10:30 AM',
            impact: 'medium',
            description: 'Manufacturing Purchasing Managers Index release'
        },
        {
            date: 'May 2',
            name: 'Unemployment Rate',
            time: '11:00 AM',
            impact: 'medium',
            description: 'Monthly unemployment figures'
        }
    ];
    
    // Generate HTML for events
    let eventsHTML = '';
    
    if (events.length === 0) {
        eventsHTML = '<div class="no-events">No upcoming market events found</div>';
    } else {
        events.forEach(event => {
            eventsHTML += `
                <div class="event">
                    <div class="event-date">${event.date}</div>
                    <div class="event-details">
                        <div class="event-name">${event.name}</div>
                        <div class="event-info">
                            <span class="event-time"><i class="far fa-clock"></i> ${event.time}</span>
                            <span class="event-impact ${event.impact}">${event.impact.charAt(0).toUpperCase() + event.impact.slice(1)} Impact</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    eventsContainer.innerHTML = eventsHTML;
}

// Helper function to add styles to the page
function addStyles(css) {
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
}

// Initialize all new dashboard components
function initDashboardEnhancements() {
    renderPerformanceSummaryCard();
    renderRiskManagementMetrics();
    renderConsistencyChart();
    renderUpcomingEventsWidget();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add to window object so it can be called from other scripts
    window.initDashboardEnhancements = initDashboardEnhancements;
    
    // Initialize if we're on the dashboard
    if (document.querySelector('[data-section="dashboard"].active')) {
        initDashboardEnhancements();
    }
    
    // Update dashboard enhancements when switching to dashboard
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            if (targetSection === 'dashboard') {
                // Wait for the section to become active
                setTimeout(() => {
                    initDashboardEnhancements();
                }, 100);
            }
        });
    });
});