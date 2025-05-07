// Win Streak Analysis JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for the win streak section
    setupWinStreakEvents();
    
    // If analytics is already active, load win streak data
    if (document.getElementById('analytics')?.classList.contains('active')) {
        analyzeWinStreaks();
    }
    
    // Listen for analytics section becoming active
    document.querySelector('[data-section="analytics"]')?.addEventListener('click', function() {
        // Wait a moment for data to load
        setTimeout(() => {
            analyzeWinStreaks();
        }, 300);
    });
});

// Set up event listeners
function setupWinStreakEvents() {
    // Download button
    document.getElementById('streak-download')?.addEventListener('click', function() {
        downloadChart('streak-chart', 'win-streak-analysis');
    });
    
    // Fullscreen button
    document.getElementById('streak-fullscreen')?.addEventListener('click', function() {
        toggleFullscreen('streak-chart');
    });
}

// Main function to analyze win streaks
function analyzeWinStreaks() {
    // Get trades from storage (using your existing function)
    const trades = typeof loadTrades === 'function' ? loadTrades() : [];
    
    if (!trades || !trades.length) {
        updateStreakUI({
            longestWinStreak: 0,
            longestLossStreak: 0,
            currentStreak: 0,
            averageStreakLength: 0,
            streaks: [],
            isWinning: false
        });
        return;
    }
    
    // Sort trades by date (oldest first)
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
    
    // Calculate streaks
    const streakData = calculateStreaks(sortedTrades);
    
    // Update UI with streak data
    updateStreakUI(streakData);
    
    // Create streak chart
    createStreakChart(streakData);
}

// Calculate win/loss streaks from trade data
function calculateStreaks(trades) {
    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let isWinning = false;
    let streakStartDate = null;
    const streaks = [];
    let totalStreakLength = 0;
    let streakCount = 0;
    
    // Process each trade
    trades.forEach((trade, index) => {
        const pl = parseFloat(trade.profitLossPercentage || 0);
        const isWin = pl > 0;
        
        // First trade initializes the streak
        if (index === 0) {
            currentStreak = 1;
            isWinning = isWin;
            streakStartDate = trade.date;
            return;
        }
        
        // Continue or break streak
        if ((isWin && isWinning) || (!isWin && !isWinning)) {
            // Continue the streak
            currentStreak++;
        } else {
            // Streak broken - record it
            streaks.push({
                length: currentStreak,
                isWin: isWinning,
                startDate: streakStartDate,
                endDate: trades[index - 1].date
            });
            
            totalStreakLength += currentStreak;
            streakCount++;
            
            // Update longest streak records
            if (isWinning) {
                longestWinStreak = Math.max(longestWinStreak, currentStreak);
            } else {
                longestLossStreak = Math.max(longestLossStreak, currentStreak);
            }
            
            // Start new streak
            currentStreak = 1;
            isWinning = isWin;
            streakStartDate = trade.date;
        }
        
        // Handle the last trade
        if (index === trades.length - 1) {
            // Update longest streak records
            if (isWinning) {
                longestWinStreak = Math.max(longestWinStreak, currentStreak);
            } else {
                longestLossStreak = Math.max(longestLossStreak, currentStreak);
            }
            
            // Add the final streak
            streaks.push({
                length: currentStreak,
                isWin: isWinning,
                startDate: streakStartDate,
                endDate: trade.date
            });
            
            totalStreakLength += currentStreak;
            streakCount++;
        }
    });
    
    // Calculate average streak length
    const averageStreakLength = streakCount > 0 ? (totalStreakLength / streakCount).toFixed(1) : 0;
    
    return {
        longestWinStreak,
        longestLossStreak,
        currentStreak,
        isWinning,
        averageStreakLength,
        streaks
    };
}

// Update UI elements with streak data
function updateStreakUI(streakData) {
    // Update metric values
    const longestWinEl = document.getElementById('longest-win-streak');
    const longestLossEl = document.getElementById('longest-loss-streak');
    const currentStreakEl = document.getElementById('current-streak');
    const avgStreakEl = document.getElementById('avg-streak-length');
    
    if (longestWinEl) longestWinEl.textContent = streakData.longestWinStreak;
    if (longestLossEl) longestLossEl.textContent = streakData.longestLossStreak;
    
    if (currentStreakEl) {
        currentStreakEl.textContent = `${streakData.currentStreak}`;
        currentStreakEl.classList.add(streakData.isWinning ? 'positive' : 'negative');
    }
    
    if (avgStreakEl) avgStreakEl.textContent = streakData.averageStreakLength;
    
    // Create streak timeline
    createStreakTimeline(streakData);
    
    // Generate insights
    generateStreakInsights(streakData);
}

// Create a timeline visualization of recent trades
function createStreakTimeline(streakData) {
    const timelineEl = document.getElementById('streak-timeline');
    if (!timelineEl) return;
    
    // Get trades (assuming they're available in the global scope or via a function)
    const trades = typeof loadTrades === 'function' ? loadTrades() : [];
    
    // Clear the container
    timelineEl.innerHTML = '';
    
    if (!trades || !trades.length) {
        timelineEl.innerHTML = '<div class="no-data">No trade data available</div>';
        return;
    }
    
    // Sort trades by date (newest first for timeline)
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    // Take the 30 most recent trades for the timeline
    const recentTrades = sortedTrades.slice(0, 30).reverse();
    
    // Track streaks for visualization
    let currentStreak = 0;
    let isWinning = null;
    
    // Create a dot for each trade
    recentTrades.forEach((trade, index) => {
        const pl = parseFloat(trade.profitLossPercentage || 0);
        const isWin = pl > 0;
        
        // Determine if part of a streak
        if (index === 0) {
            currentStreak = 1;
            isWinning = isWin;
        } else {
            if ((isWin && isWinning) || (!isWin && !isWinning)) {
                currentStreak++;
            } else {
                currentStreak = 1;
                isWinning = isWin;
            }
        }
        
        // Format date for display
        const tradeDate = new Date(trade.date);
        const formattedDate = tradeDate.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Create the trade dot
        const dot = document.createElement('div');
        dot.className = `trade-dot ${isWin ? 'win' : 'loss'}`;
        dot.title = `${trade.stock}: ${pl > 0 ? '+' : ''}${pl}%`;
        
        // Add date label
        const dateLabel = document.createElement('div');
        dateLabel.className = 'trade-date';
        dateLabel.textContent = `${formattedDate}`;
        dot.appendChild(dateLabel);
        
        // Mark significant streaks (5 or more)
        if (currentStreak === 5 || currentStreak === 10 || currentStreak === 15) {
            const marker = document.createElement('div');
            marker.className = 'streak-marker';
            marker.textContent = `${currentStreak}`;
            dot.appendChild(marker);
        }
        
        // Add to timeline
        timelineEl.appendChild(dot);
    });
}

// Create the streak chart with enhanced visual design
function createStreakChart(streakData) {
    const chartCanvas = document.getElementById('streak-chart');
    if (!chartCanvas) return;
    
    // Make sure Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not available. Please include the library.');
        return;
    }
    
    // Prepare data for chart
    const labels = [];
    const winData = [];
    const lossData = [];
    
    // Last 10 streaks for the chart
    const recentStreaks = streakData.streaks.slice(-10);
    
    recentStreaks.forEach((streak, index) => {
        // Format label to show start date
        const startDate = new Date(streak.startDate);
        const formattedDate = startDate.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric'
        });
        
        labels.push(formattedDate);
        
        if (streak.isWin) {
            winData.push(streak.length);
            lossData.push(0);
        } else {
            winData.push(0);
            lossData.push(-streak.length); // Negative for visual effect
        }
    });
    
    // Destroy existing chart if it exists
    if (window.streakChart instanceof Chart) {
        window.streakChart.destroy();
    }
    
    // Create chart with enhanced design
    window.streakChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Win Streaks',
                    data: winData,
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8,
                    hoverBackgroundColor: 'rgba(76, 175, 80, 1)',
                    hoverBorderColor: '#ffffff',
                    hoverBorderWidth: 2
                },
                {
                    label: 'Loss Streaks',
                    data: lossData,
                    backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 2,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8,
                    hoverBackgroundColor: 'rgba(244, 67, 54, 1)',
                    hoverBorderColor: '#ffffff',
                    hoverBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 15,
                    right: 25,
                    bottom: 5,
                    left: 25
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 10,
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Streak Start Date',
                        padding: {
                            top: 10,
                            bottom: 0
                        },
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        padding: 10,
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        callback: function(value) {
                            return Math.abs(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Streak Length (Trades)',
                        padding: {
                            top: 0,
                            bottom: 10
                        },
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 6,
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const streak = recentStreaks[index];
                            const startDate = new Date(streak.startDate).toLocaleDateString();
                            const endDate = new Date(streak.endDate).toLocaleDateString();
                            return `${streak.isWin ? 'Win' : 'Loss'} Streak: ${startDate} - ${endDate}`;
                        },
                        label: function(context) {
                            const value = Math.abs(context.raw);
                            return `${value} ${value === 1 ? 'trade' : 'trades'} in a row`;
                        },
                        afterBody: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const streak = recentStreaks[index];
                            return streak.isWin 
                                ? ['Maintaining win streaks builds momentum.'] 
                                : ['Consider reducing position size during loss streaks.'];
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        boxWidth: 10,
                        boxHeight: 10,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 2,
                            borderDash: [6, 4]
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Apply dark theme adjustments if needed
    applyDarkThemeToChart(window.streakChart);
}

// Helper function to apply dark theme to chart if needed
function applyDarkThemeToChart(chart) {
    // Check if dark theme is active
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    if (isDarkTheme && chart) {
        // Update grid lines
        chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.05)';
        
        // Update font colors
        chart.options.scales.x.ticks.color = '#e0e0e0';
        chart.options.scales.y.ticks.color = '#e0e0e0';
        chart.options.scales.x.title.color = '#e0e0e0';
        chart.options.scales.y.title.color = '#e0e0e0';
        
        // Update center line
        if (chart.options.plugins.annotation?.annotations?.line1) {
            chart.options.plugins.annotation.annotations.line1.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
        
        // Update legend colors
        chart.options.plugins.legend.labels.color = '#e0e0e0';
        
        // Apply changes
        chart.update();
    }
}

// Generate insights based on streak data
function generateStreakInsights(streakData) {
    const insightsContainer = document.getElementById('streak-insights');
    if (!insightsContainer) return;
    
    // Clear existing insights
    insightsContainer.innerHTML = '';
    
    // If no streaks, show message
    if (!streakData.streaks.length) {
        const noDataCard = document.createElement('div');
        noDataCard.className = 'streak-insight-card';
        noDataCard.innerHTML = `
            <div class="insight-header">
                <i class="insight-icon fas fa-info-circle"></i>
                <div class="insight-title">No Streak Data</div>
            </div>
            <div class="insight-content">
                Add more trades to see streak analysis and insights.
            </div>
        `;
        insightsContainer.appendChild(noDataCard);
        return;
    }
    
    // Insight 1: Longest win streak
    if (streakData.longestWinStreak > 1) {
        const winStreakCard = createInsightCard(
            'trophy',
            'Longest Win Streak',
            `Your longest winning streak was ${streakData.longestWinStreak} trades in a row. Building on consecutive wins can boost your confidence and trading psychology.`
        );
        insightsContainer.appendChild(winStreakCard);
    }
    
    // Insight 2: Longest loss streak
    if (streakData.longestLossStreak > 1) {
        const lossStreakCard = createInsightCard(
            'exclamation-triangle',
            'Risk Management Alert',
            `Your longest losing streak was ${streakData.longestLossStreak} trades. Consider reducing position sizes after 2 consecutive losses to protect your capital.`
        );
        insightsContainer.appendChild(lossStreakCard);
    }
    
    // Insight 3: Current streak
    const currentStreakCard = createInsightCard(
        streakData.isWinning ? 'chart-line' : 'sync',
        streakData.isWinning ? 'Winning Momentum' : 'Recovery Opportunity',
        streakData.isWinning 
            ? `You're currently on a ${streakData.currentStreak}-trade winning streak. Maintain your discipline and strategy.` 
            : `After ${streakData.currentStreak} losses, review your strategy and look for a setup with higher probability.`
    );
    insightsContainer.appendChild(currentStreakCard);
    
    // Insight 4: Win/Loss streak ratio
    const winStreaks = streakData.streaks.filter(s => s.isWin);
    const lossStreaks = streakData.streaks.filter(s => !s.isWin);
    
    const avgWinLength = winStreaks.length ? 
        (winStreaks.reduce((sum, s) => sum + s.length, 0) / winStreaks.length).toFixed(1) : 0;
    
    const avgLossLength = lossStreaks.length ? 
        (lossStreaks.reduce((sum, s) => sum + s.length, 0) / lossStreaks.length).toFixed(1) : 0;
    
    const streakCompareCard = createInsightCard(
        'balance-scale',
        'Streak Comparison',
        `Your average win streak (${avgWinLength}) is ${
            avgWinLength > avgLossLength ? 'longer' : 'shorter'
        } than your average loss streak (${avgLossLength}). ${
            avgWinLength > avgLossLength 
                ? 'This positive pattern suggests good trade management.'
                : 'Work on cutting losses quicker and letting winners run.'
        }`
    );
    insightsContainer.appendChild(streakCompareCard);
}

// Helper function to create insight cards
function createInsightCard(icon, title, content) {
    const card = document.createElement('div');
    card.className = 'streak-insight-card';
    
    card.innerHTML = `
        <div class="insight-header">
            <i class="insight-icon fas fa-${icon}"></i>
            <div class="insight-title">${title}</div>
        </div>
        <div class="insight-content">${content}</div>
    `;
    
    return card;
}

// Helper function to download chart as image
function downloadChart(chartId, filename) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    // Try-catch in case of security errors in some browsers
    try {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        console.error('Error downloading chart:', e);
        alert('Unable to download chart image due to browser security restrictions.');
    }
}

// Helper function to toggle fullscreen
function toggleFullscreen(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    // Get parent container
    const container = canvas.closest('.analytics-card');
    
    // Check if fullscreen API is available
    if (document.fullscreenEnabled || 
        document.webkitFullscreenEnabled || 
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled) {
        
        // If not in fullscreen, enter fullscreen
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    } else {
        alert('Fullscreen mode is not supported in your browser.');
    }
}