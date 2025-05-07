/**
 * Advanced Charts for Trading Journal
 * Provides interactive and comprehensive data visualization
 */

class TradingCharts {
    constructor() {
        this.chartInstances = {};
        this.chartColors = {
            profit: 'rgba(75, 192, 192, 0.7)',
            loss: 'rgba(255, 99, 132, 0.7)',
            neutral: 'rgba(255, 206, 86, 0.7)',
            line: 'rgba(54, 162, 235, 0.7)',
            area: 'rgba(153, 102, 255, 0.2)',
            grid: 'rgba(0, 0, 0, 0.1)'
        };
    }

    /**
     * Initialize all charts on the page
     */
    init() {
        // Listen for theme changes
        document.addEventListener('themeChanged', (e) => {
            this.updateChartsForTheme(e.detail.theme);
        });
        
        // Create performance breakdown chart
        this.createPerformanceChart();
        
        // Create win/loss ratio chart
        this.createWinLossChart();
        
        // Create drawdown chart
        this.createDrawdownChart();
        
        // Create profit factor by setup chart
        this.createProfitFactorChart();
        
        // Create equity curve
        this.createEquityCurve();
        
        // Create heatmap
        this.createTradeHeatmap();
        
        // Make charts responsive
        window.addEventListener('resize', this.resizeAllCharts.bind(this));
    }
    
    /**
     * Update all charts when theme changes
     */
    updateChartsForTheme(theme) {
        // Get theme colors
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-color').trim();
        const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim();
        const backgroundColor = getComputedStyle(document.body).getPropertyValue('--card-background').trim();
        
        // Update colors for each chart
        for (const chartId in this.chartInstances) {
            const chart = this.chartInstances[chartId];
            
            if (chart && chart.options) {
                // Update grid colors
                if (chart.options.scales) {
                    for (const axisKey in chart.options.scales) {
                        const axis = chart.options.scales[axisKey];
                        axis.grid.color = borderColor;
                        axis.ticks.color = textColor;
                        if (axis.title) {
                            axis.title.color = textColor;
                        }
                    }
                }
                
                // Update legend colors
                if (chart.options.plugins && chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels.color = textColor;
                }
                
                // Update chart
                chart.update();
            }
        }
    }
    
    /**
     * Create performance breakdown chart
     */
    createPerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        if (!ctx) return;
        
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Winning Trades',
                    data: [15, 12, 18, 14, 16, 19],
                    backgroundColor: this.chartColors.profit
                },
                {
                    label: 'Losing Trades',
                    data: [8, 10, 7, 9, 6, 8],
                    backgroundColor: this.chartColors.loss
                }
            ]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        footer: (tooltipItems) => {
                            // Calculate win ratio
                            const dataIndex = tooltipItems[0].dataIndex;
                            const winning = data.datasets[0].data[dataIndex];
                            const losing = data.datasets[1].data[dataIndex];
                            const total = winning + losing;
                            const winRate = ((winning / total) * 100).toFixed(1);
                            
                            return `Win Rate: ${winRate}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Number of Trades'
                    }
                }
            }
        };
        
        this.chartInstances.performance = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    /**
     * Create win/loss ratio chart
     */
    createWinLossChart() {
        const ctx = document.getElementById('win-loss-chart');
        if (!ctx) return;
        
        const data = {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [65, 35],
                backgroundColor: [
                    this.chartColors.profit,
                    this.chartColors.loss
                ],
                hoverOffset: 4
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${percentage}%`;
                        }
                    }
                }
            }
        };
        
        this.chartInstances.winLoss = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });
    }
    
    /**
     * Create drawdown chart
     */
    createDrawdownChart() {
        const ctx = document.getElementById('drawdown-chart');
        if (!ctx) return;
        
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Drawdown %',
                data: [0, -2, -4, -1, -3, -5, -2, -7, -3, -1, -2, -1],
                borderColor: this.chartColors.loss,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `Drawdown: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Drawdown %'
                    },
                    max: 0,
                    min: -10
                }
            }
        };
        
        this.chartInstances.drawdown = new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }
    
    /**
     * Create profit factor by setup chart
     */
    createProfitFactorChart() {
        const ctx = document.getElementById('profit-factor-chart');
        if (!ctx) return;
        
        const data = {
            labels: ['Breakout', 'Reversal', 'Trend Following', 'Scalping', 'Swing', 'Gap Fill'],
            datasets: [{
                label: 'Profit Factor',
                data: [2.1, 1.5, 1.9, 0.8, 1.7, 1.3],
                backgroundColor: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    return value >= 1.5 ? this.chartColors.profit : 
                           value >= 1 ? this.chartColors.neutral : 
                           this.chartColors.loss;
                },
                borderWidth: 1
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const value = context.raw;
                            let rating;
                            
                            if (value >= 2) rating = 'Excellent';
                            else if (value >= 1.5) rating = 'Good';
                            else if (value >= 1) rating = 'Fair';
                            else rating = 'Poor';
                            
                            return `Rating: ${rating}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Trade Setup'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Profit Factor'
                    },
                    min: 0
                }
            }
        };
        
        this.chartInstances.profitFactor = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    /**
     * Create equity curve
     */
    createEquityCurve() {
        const ctx = document.getElementById('equity-curve');
        if (!ctx) return;
        
        // Generate equity curve points
        const trades = 100;
        const labels = Array.from({length: trades}, (_, i) => i + 1);
        const winRate = 0.55;
        const avgWin = 2;
        const avgLoss = 1;
        
        let equity = 10000; // Starting capital
        const equityPoints = [equity];
        
        for (let i = 1; i < trades; i++) {
            const isWin = Math.random() < winRate;
            const tradeResult = isWin ? equity * (avgWin / 100) : -equity * (avgLoss / 100);
            equity += tradeResult;
            equityPoints.push(equity);
        }
        
        const data = {
            labels: labels,
            datasets: [{
                label: 'Equity',
                data: equityPoints,
                borderColor: this.chartColors.line,
                backgroundColor: this.chartColors.area,
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `Equity: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Trade #'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Equity ($)'
                    }
                }
            }
        };
        
        this.chartInstances.equity = new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }
    
    /**
     * Create trade heatmap for best times/days
     */
    createTradeHeatmap() {
        const ctx = document.getElementById('trade-heatmap');
        if (!ctx) return;
        
        // Days of week
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Hours of day (trading hours)
        const hours = ['9:30', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '15:30'];
        
        // Generate some sample data - each cell is a profit factor for that day/time
        const profitFactors = [
            [1.8, 1.5, 0.9, 0.7, 1.2, 1.9, 2.1], // Monday
            [1.2, 1.7, 2.1, 1.4, 1.0, 1.1, 1.3], // Tuesday
            [2.0, 2.3, 1.5, 1.1, 0.8, 1.2, 1.5], // Wednesday
            [1.1, 1.3, 1.7, 1.9, 1.6, 1.4, 0.9], // Thursday
            [0.7, 1.0, 1.2, 1.5, 1.8, 2.0, 1.4]  // Friday
        ];
        
        // Prepare data for heatmap
        const data = [];
        days.forEach((day, i) => {
            hours.forEach((hour, j) => {
                const value = profitFactors[i][j] || Math.random() * 2;
                data.push({
                    x: hour,
                    y: day,
                    v: value
                });
            });
        });
        
        const ctx2d = ctx.getContext('2d');
        ctx.height = 250;
        
        // Create heatmap
        const getColor = (value) => {
            if (value >= 2) return 'rgba(75, 192, 192, 0.9)';
            if (value >= 1.5) return 'rgba(75, 192, 192, 0.7)';
            if (value >= 1) return 'rgba(255, 206, 86, 0.7)';
            if (value >= 0.5) return 'rgba(255, 99, 132, 0.5)';
            return 'rgba(255, 99, 132, 0.9)';
        };
        
        // Draw heatmap manually since Chart.js doesn't have built-in heatmap
        const drawHeatmap = () => {
            const width = ctx.width;
            const height = ctx.height;
            const cellWidth = width / hours.length;
            const cellHeight = height / days.length;
            
            ctx2d.clearRect(0, 0, width, height);
            
            // Draw cells
            data.forEach(point => {
                const x = hours.indexOf(point.x) * cellWidth;
                const y = days.indexOf(point.y) * cellHeight;
                
                ctx2d.fillStyle = getColor(point.v);
                ctx2d.fillRect(x, y, cellWidth, cellHeight);
                
                // Draw text
                ctx2d.fillStyle = '#fff';
                ctx2d.font = '12px Arial';
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText(point.v.toFixed(1), x + cellWidth / 2, y + cellHeight / 2);
            });
            
            // Draw axes
            ctx2d.strokeStyle = '#ccc';
            ctx2d.lineWidth = 0.5;
            
            // Vertical lines
            for (let i = 0; i <= hours.length; i++) {
                const x = i * cellWidth;
                ctx2d.beginPath();
                ctx2d.moveTo(x, 0);
                ctx2d.lineTo(x, height);
                ctx2d.stroke();
            }
            
            // Horizontal lines
            for (let i = 0; i <= days.length; i++) {
                const y = i * cellHeight;
                ctx2d.beginPath();
                ctx2d.moveTo(0, y);
                ctx2d.lineTo(width, y);
                ctx2d.stroke();
            }
            
            // Draw labels
            ctx2d.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color').trim();
            ctx2d.font = '14px Arial';
            
            // Hour labels (bottom)
            ctx2d.textAlign = 'center';
            ctx2d.textBaseline = 'top';
            hours.forEach((hour, i) => {
                const x = i * cellWidth + cellWidth / 2;
                ctx2d.fillText(hour, x, height + 5);
            });
            
            // Day labels (left)
            ctx2d.textAlign = 'right';
            ctx2d.textBaseline = 'middle';
            days.forEach((day, i) => {
                const y = i * cellHeight + cellHeight / 2;
                ctx2d.fillText(day, -5, y);
            });
        };
        
        // Call immediately and on resize
        drawHeatmap();
        window.addEventListener('resize', drawHeatmap);
    }
    
    /**
     * Resize all charts
     */
    resizeAllCharts() {
        for (const chartId in this.chartInstances) {
            if (this.chartInstances[chartId]) {
                this.chartInstances[chartId].resize();
            }
        }
    }
    
    /**
     * Update charts with new data
     */
    updateChartsWithData(data) {
        // Implementation would depend on your data structure
        console.log('Updating charts with new data:', data);
        
        // Example for updating performance chart
        if (data.performance && this.chartInstances.performance) {
            this.chartInstances.performance.data.labels = data.performance.labels;
            this.chartInstances.performance.data.datasets[0].data = data.performance.wins;
            this.chartInstances.performance.data.datasets[1].data = data.performance.losses;
            this.chartInstances.performance.update();
        }
        
        // You would update other charts similarly
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    const tradingCharts = new TradingCharts();
    tradingCharts.init();
    
    // Make it globally available
    window.tradingCharts = tradingCharts;
});