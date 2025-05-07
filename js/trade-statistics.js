/**
 * Trade Statistics Dashboard
 * Provides comprehensive analytics and visualizations for trading performance
 */

// Main controller for the Trade Statistics Dashboard
class TradeStatisticsDashboard {
    constructor() {
        this.trades = [];
        this.filteredTrades = [];
        this.dateRange = 'all'; // all, thisMonth, thisWeek, custom
        this.customStartDate = null;
        this.customEndDate = null;
        this.charts = {};
        
        this.initialize();
    }
    
    initialize() {
        // Set up event listeners for date filters
        document.getElementById('stats-date-filter')?.addEventListener('change', (e) => {
            this.dateRange = e.target.value;
            this.applyFilters();
            this.renderDashboard();
        });
        
        document.getElementById('custom-start-date')?.addEventListener('change', (e) => {
            this.customStartDate = new Date(e.target.value);
        });
        
        document.getElementById('custom-end-date')?.addEventListener('change', (e) => {
            this.customEndDate = new Date(e.target.value);
        });
        
        document.getElementById('apply-custom-dates')?.addEventListener('click', () => {
            if (this.customStartDate && this.customEndDate) {
                this.dateRange = 'custom';
                this.applyFilters();
                this.renderDashboard();
            }
        });
        
        // Initial data load
        this.loadTrades();
    }
    
    // Load trades from localStorage
    loadTrades() {
        const savedTrades = localStorage.getItem('trades');
        if (savedTrades) {
            this.trades = JSON.parse(savedTrades);
            // Convert date strings to Date objects
            this.trades.forEach(trade => {
                trade.date = new Date(trade.date);
            });
            
            this.applyFilters();
            this.renderDashboard();
        }
    }
    
    // Apply date filters to trades
    applyFilters() {
        const now = new Date();
        
        switch (this.dateRange) {
            case 'thisWeek':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                
                this.filteredTrades = this.trades.filter(trade => 
                    trade.date >= startOfWeek
                );
                break;
                
            case 'thisMonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                
                this.filteredTrades = this.trades.filter(trade => 
                    trade.date >= startOfMonth
                );
                break;
                
            case 'custom':
                if (this.customStartDate && this.customEndDate) {
                    // Add one day to end date to include the end date in results
                    const adjustedEndDate = new Date(this.customEndDate);
                    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
                    
                    this.filteredTrades = this.trades.filter(trade => 
                        trade.date >= this.customStartDate && 
                        trade.date < adjustedEndDate
                    );
                }
                break;
                
            case 'all':
            default:
                this.filteredTrades = [...this.trades];
                break;
        }
        
        // Sort by date
        this.filteredTrades.sort((a, b) => a.date - b.date);
    }
    
    // Calculate key performance metrics
    calculateMetrics() {
        const trades = this.filteredTrades;
        if (!trades.length) return null;
        
        // Basic metrics
        const winningTrades = trades.filter(t => parseFloat(t.profitLoss) > 0);
        const losingTrades = trades.filter(t => parseFloat(t.profitLoss) < 0);
        const breakEvenTrades = trades.filter(t => parseFloat(t.profitLoss) === 0);
        
        const totalTrades = trades.length;
        const winRate = totalTrades ? (winningTrades.length / totalTrades) * 100 : 0;
        
        const totalProfitLoss = trades.reduce((sum, t) => sum + parseFloat(t.profitLoss), 0);
        const avgProfitLoss = totalTrades ? totalProfitLoss / totalTrades : 0;
        
        // Average win and loss
        const avgWin = winningTrades.length 
            ? winningTrades.reduce((sum, t) => sum + parseFloat(t.profitLoss), 0) / winningTrades.length 
            : 0;
            
        const avgLoss = losingTrades.length 
            ? losingTrades.reduce((sum, t) => sum + parseFloat(t.profitLoss), 0) / losingTrades.length 
            : 0;
        
        // Risk reward ratio
        const riskRewardRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
        
        // Expectancy
        const expectancy = (winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss;
        
        // Profit factor
        const grossProfit = winningTrades.reduce((sum, t) => sum + parseFloat(t.profitLoss), 0);
        const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.profitLoss), 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
        
        // By day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const tradesByDay = [0, 0, 0, 0, 0, 0, 0];
        const profitByDay = [0, 0, 0, 0, 0, 0, 0];
        
        trades.forEach(trade => {
            const dayIndex = trade.date.getDay();
            tradesByDay[dayIndex]++;
            profitByDay[dayIndex] += parseFloat(trade.profitLoss);
        });
        
        // By trade setup/tag
        const setupPerformance = {};
        trades.forEach(trade => {
            if (trade.tags) {
                const tags = trade.tags.split(',').map(tag => tag.trim());
                tags.forEach(tag => {
                    if (!setupPerformance[tag]) {
                        setupPerformance[tag] = {
                            count: 0,
                            totalPL: 0,
                            wins: 0
                        };
                    }
                    
                    setupPerformance[tag].count++;
                    setupPerformance[tag].totalPL += parseFloat(trade.profitLoss);
                    if (parseFloat(trade.profitLoss) > 0) {
                        setupPerformance[tag].wins++;
                    }
                });
            }
        });
        
        // Calculate win rate and average P/L for each setup
        Object.keys(setupPerformance).forEach(tag => {
            const setup = setupPerformance[tag];
            setup.winRate = setup.count > 0 ? (setup.wins / setup.count) * 100 : 0;
            setup.avgPL = setup.count > 0 ? setup.totalPL / setup.count : 0;
        });
        
        return {
            totalTrades,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            breakEvenTrades: breakEvenTrades.length,
            winRate,
            totalProfitLoss,
            avgProfitLoss,
            avgWin,
            avgLoss,
            riskRewardRatio,
            expectancy,
            profitFactor,
            tradesByDay,
            profitByDay,
            dayNames,
            setupPerformance
        };
    }
    
    // Render the dashboard with all charts and metrics
    renderDashboard() {
        const metrics = this.calculateMetrics();
        if (!metrics) {
            document.getElementById('stats-dashboard').innerHTML = '<div class="no-data">No trade data available for the selected time period.</div>';
            return;
        }
        
        this.renderKeyMetrics(metrics);
        this.renderProfitLossChart(metrics);
        this.renderWinRateByDay(metrics);
        this.renderSetupPerformance(metrics);
        this.renderEquityCurve(metrics);
    }
    
    // Render key performance metrics
    renderKeyMetrics(metrics) {
        const keyMetricsElement = document.getElementById('key-metrics');
        if (!keyMetricsElement) return;
        
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        });
        
        keyMetricsElement.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-item">
                    <div class="metric-label">Total Trades</div>
                    <div class="metric-value">${metrics.totalTrades}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Win Rate</div>
                    <div class="metric-value">${metrics.winRate.toFixed(2)}%</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Net P/L</div>
                    <div class="metric-value ${metrics.totalProfitLoss >= 0 ? 'positive' : 'negative'}">
                        ${formatter.format(metrics.totalProfitLoss)}
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Average P/L</div>
                    <div class="metric-value ${metrics.avgProfitLoss >= 0 ? 'positive' : 'negative'}">
                        ${formatter.format(metrics.avgProfitLoss)}
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Average Win</div>
                    <div class="metric-value positive">
                        ${formatter.format(metrics.avgWin)}
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Average Loss</div>
                    <div class="metric-value negative">
                        ${formatter.format(metrics.avgLoss)}
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Risk/Reward</div>
                    <div class="metric-value">
                        ${metrics.riskRewardRatio.toFixed(2)}
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Profit Factor</div>
                    <div class="metric-value">
                        ${metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render profit/loss chart
    renderProfitLossChart(metrics) {
        const plChartElement = document.getElementById('pl-chart');
        if (!plChartElement) return;
        
        // Clear existing chart
        if (this.charts.plChart) {
            this.charts.plChart.destroy();
        }
        
        const ctx = plChartElement.getContext('2d');
        
        // Prepare data for profit/loss chart
        const labels = this.filteredTrades.map(trade => {
            const date = new Date(trade.date);
            return date.toLocaleDateString();
        });
        
        const data = this.filteredTrades.map(trade => parseFloat(trade.profitLoss));
        
        this.charts.plChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Profit/Loss',
                    data: data,
                    backgroundColor: data.map(value => value >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'),
                    borderColor: data.map(value => value >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
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
                                const value = context.raw;
                                return `P/L: ${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Render win rate by day of week
    renderWinRateByDay(metrics) {
        const dayChartElement = document.getElementById('day-chart');
        if (!dayChartElement) return;
        
        // Clear existing chart
        if (this.charts.dayChart) {
            this.charts.dayChart.destroy();
        }
        
        const ctx = dayChartElement.getContext('2d');
        
        // Calculate win rate by day
        const winRateByDay = [];
        const tradeCountByDay = [];
        
        metrics.dayNames.forEach((day, index) => {
            const tradeCount = metrics.tradesByDay[index];
            tradeCountByDay.push(tradeCount);
            
            if (tradeCount > 0) {
                const winningTrades = this.filteredTrades.filter(trade => 
                    trade.date.getDay() === index && parseFloat(trade.profitLoss) > 0
                ).length;
                
                const dayWinRate = (winningTrades / tradeCount) * 100;
                winRateByDay.push(dayWinRate);
            } else {
                winRateByDay.push(0);
            }
        });
        
        this.charts.dayChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: metrics.dayNames,
                datasets: [
                    {
                        label: 'Win Rate (%)',
                        data: winRateByDay,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Number of Trades',
                        data: tradeCountByDay,
                        type: 'line',
                        fill: false,
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgb(153, 102, 255)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgb(153, 102, 255)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Win Rate (%)'
                        },
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Number of Trades'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Render setup performance
    renderSetupPerformance(metrics) {
        const setupChartElement = document.getElementById('setup-chart');
        if (!setupChartElement || !metrics.setupPerformance) return;
        
        // Clear existing chart
        if (this.charts.setupChart) {
            this.charts.setupChart.destroy();
        }
        
        const ctx = setupChartElement.getContext('2d');
        
        // Get the top 5 setups by number of trades
        const sortedSetups = Object.entries(metrics.setupPerformance)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);
        
        const labels = sortedSetups.map(setup => setup[0]);
        const winRates = sortedSetups.map(setup => setup[1].winRate);
        const avgPLs = sortedSetups.map(setup => setup[1].avgPL);
        const counts = sortedSetups.map(setup => setup[1].count);
        
        this.charts.setupChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Win Rate (%)',
                        data: winRates,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Avg. P/L',
                        data: avgPLs,
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgb(255, 159, 64)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Win Rate (%)'
                        },
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Avg. P/L'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const index = context.dataIndex;
                                return `Trades: ${counts[index]}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Render equity curve
    renderEquityCurve(metrics) {
        const equityChartElement = document.getElementById('equity-chart');
        if (!equityChartElement) return;
        
        // Clear existing chart
        if (this.charts.equityChart) {
            this.charts.equityChart.destroy();
        }
        
        const ctx = equityChartElement.getContext('2d');
        
        // Calculate cumulative equity
        let cumulativeEquity = 0;
        const equityData = [];
        const labels = [];
        
        this.filteredTrades.forEach(trade => {
            cumulativeEquity += parseFloat(trade.profitLoss);
            equityData.push(cumulativeEquity);
            
            const date = new Date(trade.date);
            labels.push(date.toLocaleDateString());
        });
        
        // Calculate drawdowns
        let peak = 0;
        const drawdowns = [];
        const drawdownPercentages = [];
        
        equityData.forEach((equity, i) => {
            if (equity > peak) {
                peak = equity;
            }
            
            const drawdown = peak - equity;
            drawdowns.push(drawdown);
            
            // Calculate percentage drawdown
            const drawdownPercentage = peak !== 0 ? (drawdown / peak) * 100 : 0;
            drawdownPercentages.push(drawdownPercentage);
        });
        
        // Find maximum drawdown
        const maxDrawdown = Math.max(...drawdowns);
        const maxDrawdownIndex = drawdowns.indexOf(maxDrawdown);
        const maxDrawdownPercentage = drawdownPercentages[maxDrawdownIndex];
        
        this.charts.equityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Equity Curve',
                        data: equityData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Drawdown',
                        data: drawdowns,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 1,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Equity'
                        },
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        reverse: true,
                        title: {
                            display: true,
                            text: 'Drawdown'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterFooter: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                return `Drawdown: ${drawdowns[index].toFixed(2)} (${drawdownPercentages[index].toFixed(2)}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Display max drawdown info
        const drawdownInfoElement = document.getElementById('max-drawdown-info');
        if (drawdownInfoElement) {
            drawdownInfoElement.innerHTML = `
                <div class="info-item">
                    <span class="info-label">Maximum Drawdown:</span>
                    <span class="info-value negative">$${maxDrawdown.toFixed(2)} (${maxDrawdownPercentage.toFixed(2)}%)</span>
                </div>
            `;
        }
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new TradeStatisticsDashboard();
    
    // Make the dashboard available globally for debugging
    window.tradeStatsDashboard = dashboard;
});