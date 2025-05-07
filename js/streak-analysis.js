// Win Streak Analysis JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for the streak analysis section
    setupStreakEvents();
    
    // Initialize if analytics is already active
    if (document.getElementById('analytics')?.classList.contains('active')) {
        analyzeStreaks();
    }
    
    // Listen for analytics section becoming active
    document.querySelector('[data-section="analytics"]')?.addEventListener('click', function() {
        setTimeout(() => {
            analyzeStreaks();
        }, 300);
    });
});

// Set up event listeners
function setupStreakEvents() {
    // Download button
    document.getElementById('streak-download')?.addEventListener('click', function() {
        downloadChart('streak-chart', 'streak-analysis');
    });
    
    // Fullscreen button
    document.getElementById('streak-fullscreen')?.addEventListener('click', function() {
        toggleFullscreen('streak-chart');
    });
}

// Main function to analyze win streaks
function analyzeStreaks() {
    // Get trades from storage
    const trades = typeof loadTrades === 'function' ? loadTrades() : [];
    console.log("Total trades found:", trades.length);
    
    if (!trades || !trades.length) {
        updateStreakUI({
            longestWinStreak: 0,
            longestLossStreak: 0,
            currentStreak: 0,
            avgWinStreakReturn: 0,
            streaks: [],
            insights: []
        });
        return;
    }
    
    // Sort trades by date (oldest first)
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
    
    console.log("Trades sorted by date:", sortedTrades.map(t => t.date));
    
    // Calculate streaks
    const streakData = calculateStreaks(sortedTrades);
    console.log("Streak data calculated:", streakData);
    
    // Update UI with streak data
    updateStreakUI(streakData);
    
    // Create streak timeline chart
    createStreakChart(streakData);
    
    // Create streak comparison chart
    createStreakComparisonChart(streakData);
    
    // Generate insights
    generateStreakInsights(streakData);
    
    // Store data for later use
    window.streakData = streakData;
}

// Calculate win and loss streaks
function calculateStreaks(trades) {
    if (!trades.length) return {
        longestWinStreak: 0,
        longestLossStreak: 0,
        currentStreak: 0,
        avgWinStreakReturn: 0,
        streaks: [],
        patterns: {}
    };
    
    let currentStreak = 0;
    let currentStreakType = null;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let streaks = [];
    let currentStreakTrades = [];
    
    // Track win/loss patterns for transition analysis - initialize with better structure
    const patterns = {
        winAfterLoss: { count: 0, trades: [], totalPL: 0 },
        lossAfterWin: { count: 0, trades: [], totalPL: 0 },
        winAfterWin: { count: 0, trades: [], totalPL: 0 },
        lossAfterLoss: { count: 0, trades: [], totalPL: 0 }
    };
    
    // Process each trade for streaks
    trades.forEach((trade, i) => {
        const pl = parseFloat(trade.profitLossPercentage || trade.profitLoss || 0);
        const isWin = pl > 0;
        const previousTrade = i > 0 ? trades[i-1] : null;
        
        // Track patterns for transition analysis (if not first trade)
        if (previousTrade) {
            const prevPL = parseFloat(previousTrade.profitLossPercentage || previousTrade.profitLoss || 0);
            const prevIsWin = prevPL > 0;
            
            if (isWin && !prevIsWin) {
                patterns.winAfterLoss.count++;
                patterns.winAfterLoss.trades.push(trade);
                patterns.winAfterLoss.totalPL += pl;
            } else if (!isWin && prevIsWin) {
                patterns.lossAfterWin.count++;
                patterns.lossAfterWin.trades.push(trade);
                patterns.lossAfterWin.totalPL += pl;
            } else if (isWin && prevIsWin) {
                patterns.winAfterWin.count++;
                patterns.winAfterWin.trades.push(trade);
                patterns.winAfterWin.totalPL += pl;
            } else if (!isWin && !prevIsWin) {
                patterns.lossAfterLoss.count++;
                patterns.lossAfterLoss.trades.push(trade);
                patterns.lossAfterLoss.totalPL += pl;
            }
        }
        
        // Start a new streak or continue current streak
        if (currentStreakType === null) {
            // First trade, start a new streak
            currentStreakType = isWin ? 'win' : 'loss';
            currentStreak = 1;
            currentStreakTrades = [trade];
        } else if ((isWin && currentStreakType === 'win') || (!isWin && currentStreakType === 'loss')) {
            // Continue current streak
            currentStreak++;
            currentStreakTrades.push(trade);
        } else {
            // End of streak, record it
            streaks.push({
                type: currentStreakType,
                length: currentStreak,
                startDate: currentStreakTrades[0].date,
                endDate: currentStreakTrades[currentStreakTrades.length - 1].date,
                trades: currentStreakTrades,
                totalPL: currentStreakTrades.reduce((sum, t) => {
                    const tradePL = parseFloat(t.profitLossPercentage || t.profitLoss || 0);
                    return sum + tradePL;
                }, 0)
            });
            
            // Start a new streak
            currentStreakType = isWin ? 'win' : 'loss';
            currentStreak = 1;
            currentStreakTrades = [trade];
        }
        
        // Update longest streaks
        if (currentStreakType === 'win' && currentStreak > longestWinStreak) {
            longestWinStreak = currentStreak;
        } else if (currentStreakType === 'loss' && currentStreak > longestLossStreak) {
            longestLossStreak = currentStreak;
        }
    });
    
    // Add the final streak
    if (currentStreakType !== null) {
        streaks.push({
            type: currentStreakType,
            length: currentStreak,
            startDate: currentStreakTrades[0].date,
            endDate: currentStreakTrades[currentStreakTrades.length - 1].date,
            trades: currentStreakTrades,
            totalPL: currentStreakTrades.reduce((sum, t) => {
                const tradePL = parseFloat(t.profitLossPercentage || t.profitLoss || 0);
                return sum + tradePL;
            }, 0)
        });
    }
    
    // Calculate average return for win streaks
    const winStreaks = streaks.filter(streak => streak.type === 'win');
    const avgWinStreakReturn = winStreaks.length ? 
        winStreaks.reduce((sum, streak) => sum + streak.totalPL, 0) / winStreaks.length : 0;
    
    // Calculate transition metrics properly
    Object.keys(patterns).forEach(key => {
        if (patterns[key].count > 0) {
            patterns[key].avgPL = patterns[key].totalPL / patterns[key].count;
            
            // Add additional stats that help understand the pattern better
            patterns[key].maxPL = Math.max(...patterns[key].trades.map(t => 
                parseFloat(t.profitLossPercentage || t.profitLoss || 0)));
            patterns[key].minPL = Math.min(...patterns[key].trades.map(t => 
                parseFloat(t.profitLossPercentage || t.profitLoss || 0)));
        } else {
            patterns[key].avgPL = 0;
            patterns[key].maxPL = 0;
            patterns[key].minPL = 0;
        }
    });
    
    return {
        longestWinStreak,
        longestLossStreak,
        currentStreak,
        currentStreakType,
        avgWinStreakReturn,
        streaks,
        patterns
    };
}

// Update UI with streak data
function updateStreakUI(data) {
    console.log("Updating streak UI with data:", data);
    
    // Update metric values
    document.getElementById('longest-win-streak').textContent = data.longestWinStreak;
    document.getElementById('longest-loss-streak').textContent = data.longestLossStreak;
    
    // Update current streak with direction indicator
    const currentStreakEl = document.getElementById('current-streak');
    if (data.currentStreakType === 'win') {
        currentStreakEl.textContent = '+' + data.currentStreak;
        currentStreakEl.className = 'metric-value positive';
    } else if (data.currentStreakType === 'loss') {
        currentStreakEl.textContent = '-' + data.currentStreak;
        currentStreakEl.className = 'metric-value negative';
    } else {
        currentStreakEl.textContent = '0';
        currentStreakEl.className = 'metric-value';
    }
    
    // Update average win streak return
    const avgReturnEl = document.getElementById('avg-streak-return');
    if (avgReturnEl) {
        avgReturnEl.textContent = data.avgWinStreakReturn.toFixed(1) + '%';
    }
    
    // Update streak transition stats
    if (data.patterns) {
        // Add debug logs
        console.log("Pattern data:", {
            winAfterLoss: data.patterns.winAfterLoss,
            lossAfterWin: data.patterns.lossAfterWin,
            winAfterWin: data.patterns.winAfterWin,
            lossAfterLoss: data.patterns.lossAfterLoss
        });
        
        // Win after loss stats
        const winAfterLossEl = document.getElementById('win-after-loss');
        if (winAfterLossEl) {
            if (data.patterns.winAfterLoss && data.patterns.winAfterLoss.count > 0) {
                const avgPL = data.patterns.winAfterLoss.avgPL;
                winAfterLossEl.textContent = avgPL.toFixed(1) + '%';
                winAfterLossEl.className = 'stat-value ' + (avgPL > 0 ? 'positive' : 'negative');
                console.log("Updated win-after-loss:", avgPL.toFixed(1) + '%');
            } else {
                winAfterLossEl.textContent = 'N/A';
                winAfterLossEl.className = 'stat-value neutral';
            }
        }
        
        // Loss after win stats
        const lossAfterWinEl = document.getElementById('loss-after-win');
        if (lossAfterWinEl) {
            if (data.patterns.lossAfterWin && data.patterns.lossAfterWin.count > 0) {
                const avgPL = data.patterns.lossAfterWin.avgPL;
                lossAfterWinEl.textContent = avgPL.toFixed(1) + '%';
                lossAfterWinEl.className = 'stat-value ' + (avgPL > 0 ? 'positive' : 'negative');
                console.log("Updated loss-after-win:", avgPL.toFixed(1) + '%');
            } else {
                lossAfterWinEl.textContent = 'N/A';
                lossAfterWinEl.className = 'stat-value neutral';
            }
        }
        
        // Post streak behavior
        const behaviorEl = document.getElementById('post-streak-behavior');
        if (behaviorEl) {
            // Determine post-streak behavior pattern using detailed logic
            let behavior = 'Neutral';
            let behaviorClass = 'neutral';
            
            // Only analyze if we have enough data points
            if (data.patterns.winAfterLoss.count > 0 && data.patterns.lossAfterWin.count > 0) {
                const winAfterLossPL = data.patterns.winAfterLoss.avgPL;
                const lossAfterWinPL = data.patterns.lossAfterWin.avgPL;
                const winAfterWinPL = data.patterns.winAfterWin.avgPL || 0;
                const lossAfterLossPL = data.patterns.lossAfterLoss.avgPL || 0;
                
                // Calculate momentum score - higher score means better recovery from losses
                const momentumScore = winAfterLossPL - lossAfterWinPL;
                const streakScore = (winAfterWinPL - lossAfterLossPL) / 2;
                
                console.log("Behavior calculation:", {
                    winAfterLossPL, lossAfterWinPL, 
                    winAfterWinPL, lossAfterLossPL,
                    momentumScore, streakScore
                });
                
                if (momentumScore > 4 && streakScore > 0) {
                    behavior = 'Strong Recovery';
                    behaviorClass = 'positive';
                } else if (winAfterLossPL > 0 && lossAfterWinPL > -2) {
                    behavior = 'Positive Bias';
                    behaviorClass = 'positive';
                } else if (winAfterLossPL < 0 && lossAfterWinPL < -2) {
                    behavior = 'Momentum Sensitive';
                    behaviorClass = 'negative';
                } else if (Math.abs(winAfterLossPL) < 1 && Math.abs(lossAfterWinPL) < 1) {
                    behavior = 'Consistent';
                    behaviorClass = 'neutral';
                } else if (winAfterLossPL < lossAfterWinPL) {
                    behavior = 'Struggles After Loss';
                    behaviorClass = 'negative';
                }
            } else {
                behavior = 'Insufficient Data';
                behaviorClass = 'neutral';
            }
            
            behaviorEl.textContent = behavior;
            behaviorEl.className = 'stat-value ' + behaviorClass;
            console.log("Updated behavior:", behavior);
        }
        
        // Additional streak stats if they exist
        const winStreakReturnEl = document.getElementById('win-streak-return');
        if (winStreakReturnEl && data.streaks) {
            const winStreaks = data.streaks.filter(s => s.type === 'win');
            if (winStreaks.length > 0) {
                const avgReturn = winStreaks.reduce((sum, s) => sum + s.totalPL, 0) / winStreaks.length;
                winStreakReturnEl.textContent = avgReturn.toFixed(1) + '%';
            } else {
                winStreakReturnEl.textContent = 'N/A';
            }
        }
    }
}

// Create streak timeline chart
function createStreakChart(data) {
    const chartCanvas = document.getElementById('streak-chart');
    if (!chartCanvas || !data.streaks || !data.streaks.length) return;
    
    // Prepare chart data
    const streaks = data.streaks;
    
    // Create labels and data points
    const labels = [];
    const datasets = [];
    
    // Create a dataset for win streaks and loss streaks
    const winStreakPoints = [];
    const lossStreakPoints = [];
    
    streaks.forEach((streak, i) => {
        // Start dates as labels
        const date = new Date(streak.startDate);
        labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        
        // Plot streak points (win streaks positive, loss streaks negative)
        if (streak.type === 'win') {
            winStreakPoints.push(streak.length);
            lossStreakPoints.push(null);
        } else {
            winStreakPoints.push(null);
            lossStreakPoints.push(-streak.length); // Negative for loss streaks
        }
    });
    
    // Add datasets
    datasets.push({
        label: 'Win Streaks',
        data: winStreakPoints,
        backgroundColor: 'rgba(76, 175, 80, 0.5)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(76, 175, 80, 1)',
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
        segment: {
            borderColor: ctx => 'rgba(0,0,0,0)'
        },
        spanGaps: false
    });
    
    datasets.push({
        label: 'Loss Streaks',
        data: lossStreakPoints,
        backgroundColor: 'rgba(244, 67, 54, 0.5)',
        borderColor: 'rgba(244, 67, 54, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(244, 67, 54, 1)',
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
        segment: {
            borderColor: ctx => 'rgba(0,0,0,0)'
        },
        spanGaps: false
    });
    
    // Destroy existing chart
    if (window.streakChart instanceof Chart) {
        window.streakChart.destroy();
    }
    
    // Create new chart
    window.streakChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Streak Length'
                    },
                    ticks: {
                        callback: function(value) {
                            return Math.abs(value); // Show absolute values on y-axis
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const streak = streaks[index];
                            return `${streak.type.charAt(0).toUpperCase() + streak.type.slice(1)} Streak`;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const streak = streaks[index];
                            
                            if (context.dataset.label === 'Win Streaks' && streak.type === 'win') {
                                return [
                                    `Length: ${streak.length} trades`,
                                    `Total: ${streak.totalPL.toFixed(2)}%`,
                                    `Avg: ${(streak.totalPL / streak.length).toFixed(2)}%`
                                ];
                            } else if (context.dataset.label === 'Loss Streaks' && streak.type === 'loss') {
                                return [
                                    `Length: ${streak.length} trades`,
                                    `Total: ${streak.totalPL.toFixed(2)}%`,
                                    `Avg: ${(streak.totalPL / streak.length).toFixed(2)}%`
                                ];
                            }
                            return [];
                        }
                    }
                },
                legend: {
                    labels: {
                        usePointStyle: true
                    }
                }
            }
        }
    });
    
    // Apply dark theme if needed
    if (document.body.classList.contains('dark-theme')) {
        applyDarkThemeToChart(window.streakChart);
    }
}

// Create streak comparison chart
function createStreakComparisonChart(data) {
    const chartCanvas = document.getElementById('streak-comparison-chart');
    if (!chartCanvas || !data.streaks || !data.streaks.length) return;
    
    // Group streaks by length
    const streakGroups = {
        win: { 
            1: { count: 0, totalPL: 0, trades: [] },
            2: { count: 0, totalPL: 0, trades: [] },
            3: { count: 0, totalPL: 0, trades: [] },
            '4+': { count: 0, totalPL: 0, trades: [] }
        },
        loss: {
            1: { count: 0, totalPL: 0, trades: [] },
            2: { count: 0, totalPL: 0, trades: [] },
            3: { count: 0, totalPL: 0, trades: [] },
            '4+': { count: 0, totalPL: 0, trades: [] }
        }
    };
    
    // Process streaks into groups - more accurately track individual trades
    data.streaks.forEach(streak => {
        const type = streak.type;
        let group = streak.length <= 3 ? streak.length.toString() : '4+';
        
        streakGroups[type][group].count++;
        streakGroups[type][group].totalPL += streak.totalPL;
        streakGroups[type][group].trades.push(...streak.trades);
    });
    
    // Calculate average P/L for each group - recalculate based on actual trade data
    Object.keys(streakGroups).forEach(type => {
        Object.keys(streakGroups[type]).forEach(group => {
            const groupData = streakGroups[type][group];
            if (groupData.count > 0) {
                // Calculate both streak-based average and trade-based average
                groupData.avgPL = groupData.totalPL / groupData.count;
                
                // Calculate per-trade average for more granular analysis
                if (groupData.trades.length > 0) {
                    groupData.avgPerTradePL = groupData.totalPL / groupData.trades.length;
                    
                    // Calculate statistical values for deeper insights
                    const plValues = groupData.trades.map(t => 
                        parseFloat(t.profitLossPercentage || t.profitLoss || 0));
                    groupData.maxPL = Math.max(...plValues);
                    groupData.minPL = Math.min(...plValues);
                    
                    // Calculate volatility (standard deviation)
                    if (plValues.length > 1) {
                        const mean = plValues.reduce((a, b) => a + b, 0) / plValues.length;
                        const variance = plValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / plValues.length;
                        groupData.volatility = Math.sqrt(variance);
                    }
                }
            }
        });
    });
    
    // Prepare chart data
    const labels = ['1 Trade', '2 Trades', '3 Trades', '4+ Trades'];
    
    const winData = [
        streakGroups.win['1'].avgPL || 0,
        streakGroups.win['2'].avgPL || 0,
        streakGroups.win['3'].avgPL || 0,
        streakGroups.win['4+'].avgPL || 0
    ];
    
    const lossData = [
        streakGroups.loss['1'].avgPL || 0,
        streakGroups.loss['2'].avgPL || 0,
        streakGroups.loss['3'].avgPL || 0,
        streakGroups.loss['4+'].avgPL || 0
    ];
    
    // Count data for bar width reference
    const countData = [
        (streakGroups.win['1'].count || 0) + (streakGroups.loss['1'].count || 0),
        (streakGroups.win['2'].count || 0) + (streakGroups.loss['2'].count || 0),
        (streakGroups.win['3'].count || 0) + (streakGroups.loss['3'].count || 0),
        (streakGroups.win['4+'].count || 0) + (streakGroups.loss['4+'].count || 0)
    ];
    
    // Destroy existing chart
    if (window.streakComparisonChart instanceof Chart) {
        window.streakComparisonChart.destroy();
    }
    
    // Create new chart
    window.streakComparisonChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Win Streak Avg P/L',
                    data: winData,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.6
                },
                {
                    label: 'Loss Streak Avg P/L',
                    data: lossData,
                    backgroundColor: 'rgba(244, 67, 54, 0.7)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Average P/L %'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const type = context.dataset.label.includes('Win') ? 'win' : 'loss';
                            const group = index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : '4+';
                            const groupData = streakGroups[type][group];
                            
                            const result = [
                                `Avg P/L: ${context.parsed.y.toFixed(2)}%`,
                                `Count: ${groupData.count} streaks`,
                                `Total: ${groupData.totalPL.toFixed(2)}%`
                            ];
                            
                            if (groupData.volatility) {
                                result.push(`Volatility: ${groupData.volatility.toFixed(2)}%`);
                            }
                            
                            if (groupData.maxPL) {
                                result.push(`Best: ${groupData.maxPL.toFixed(2)}%`);
                            }
                            
                            if (groupData.minPL) {
                                result.push(`Worst: ${groupData.minPL.toFixed(2)}%`);
                            }
                            
                            return result;
                        }
                    }
                },
                legend: {
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
    
    // Apply dark theme if needed
    if (document.body.classList.contains('dark-theme')) {
        applyDarkThemeToChart(window.streakComparisonChart);
    }
}

// Generate streak insights
function generateStreakInsights(data) {
    const container = document.getElementById('streak-insights');
    if (!container || !data.streaks || !data.streaks.length) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Prepare insights array
    const insights = [];
    
    // Insight 1: Longest streak analysis
    if (data.longestWinStreak > 0 || data.longestLossStreak > 0) {
        const longestType = data.longestWinStreak >= data.longestLossStreak ? 'win' : 'loss';
        const longestStreak = longestType === 'win' ? data.longestWinStreak : data.longestLossStreak;
        
        let streakMessage = '';
        let streakPattern = '';
        
        if (longestType === 'win') {
            streakMessage = `Your longest winning streak was ${longestStreak} trades. Identifying what worked during this period could help replicate success.`;
            streakPattern = 'strong';
        } else {
            streakMessage = `Your longest losing streak was ${longestStreak} trades. Review these trades to identify and address common mistakes.`;
            streakPattern = 'weak';
        }
        
        insights.push({
            title: 'Longest Streak Analysis',
            icon: 'chart-line',
            pattern: streakPattern,
            content: streakMessage
        });
    }
    
    // Insight 2: Win-after-loss recovery pattern
    if (data.patterns && data.patterns.winAfterLoss.count > 0) {
        const avgRecovery = data.patterns.winAfterLoss.avgPL;
        let recoveryMessage = '';
        let recoveryPattern = '';
        
        if (avgRecovery > 3) {
            recoveryMessage = `You excel at bouncing back after losses with an average gain of ${avgRecovery.toFixed(1)}%. You show strong resilience and ability to learn from mistakes.`;
            recoveryPattern = 'strong';
        } else if (avgRecovery > 0) {
            recoveryMessage = `You tend to recover from losses with modest gains (${avgRecovery.toFixed(1)}%). This shows resilience, but consider reviewing your recovery trades for opportunities to improve.`;
            recoveryPattern = 'neutral';
        } else {
            recoveryMessage = `You struggle to recover after losses, with an average P/L of ${avgRecovery.toFixed(1)}%. Consider taking a short break after losses to reset mentally.`;
            recoveryPattern = 'weak';
        }
        
        insights.push({
            title: 'Recovery Pattern',
            icon: 'sync',
            pattern: recoveryPattern,
            content: recoveryMessage
        });
    }
    
    // Insight 3: Post-win behavior
    if (data.patterns && data.patterns.lossAfterWin.count > 0) {
        const avgFollowUp = data.patterns.lossAfterWin.avgPL;
        let followUpMessage = '';
        let followUpPattern = '';
        
        if (avgFollowUp > 0) {
            followUpMessage = `You maintain positive momentum after wins with an average gain of ${avgFollowUp.toFixed(1)}%. This suggests good emotional control and consistency.`;
            followUpPattern = 'strong';
        } else if (avgFollowUp > -3) {
            followUpMessage = `You tend to give back some gains after wins (${avgFollowUp.toFixed(1)}%). Be cautious of overconfidence or increasing position size after successful trades.`;
            followUpPattern = 'neutral';
        } else {
            followUpMessage = `You often experience significant losses after wins (${avgFollowUp.toFixed(1)}%). This could indicate overconfidence or strategy drift following success.`;
            followUpPattern = 'weak';
        }
        
        insights.push({
            title: 'Post-Win Behavior',
            icon: 'trophy',
            pattern: followUpPattern,
            content: followUpMessage
        });
    }
    
    // Insight 4: Optimal streak length analysis
    if (data.streaks && data.streaks.length >= 3) {
        // Find most profitable win streak length
        const winStreaksByLength = {};
        data.streaks.filter(s => s.type === 'win').forEach(streak => {
            const length = streak.length <= 3 ? streak.length : 4; // Group 4+ together
            
            if (!winStreaksByLength[length]) {
                winStreaksByLength[length] = { count: 0, totalPL: 0, avgPL: 0 };
            }
            
            winStreaksByLength[length].count++;
            winStreaksByLength[length].totalPL += streak.totalPL;
        });
        
        // Calculate averages
        Object.keys(winStreaksByLength).forEach(length => {
            const group = winStreaksByLength[length];
            if (group.count > 0) {
                group.avgPL = group.totalPL / group.count;
                group.avgPerTrade = group.totalPL / (group.count * parseInt(length));
            }
        });
        
        // Find best and worst performing streak lengths
        let bestLength = null;
        let bestAvgPL = -Infinity;
        let worstLength = null;
        let worstAvgPL = Infinity;
        
        Object.keys(winStreaksByLength).forEach(length => {
            const group = winStreaksByLength[length];
            if (group.count >= 2) { // Only consider lengths with enough samples
                if (group.avgPerTrade > bestAvgPL) {
                    bestAvgPL = group.avgPerTrade;
                    bestLength = length;
                }
                
                if (group.avgPerTrade < worstAvgPL) {
                    worstAvgPL = group.avgPerTrade;
                    worstLength = length;
                }
            }
        });
        
        // Generate insight about optimal streak length
        if (bestLength && worstLength) {
            const bestLengthText = bestLength === '4' ? '4+ trades' : `${bestLength} trades`;
            const optimalMessage = `Your most profitable win streaks are ${bestLengthText} long (${bestAvgPL.toFixed(1)}% per trade). Consider evaluating your trading approach when streaks reach this length to capitalize on momentum.`;
            
            insights.push({
                title: 'Optimal Streak Length',
                icon: 'ruler',
                pattern: 'info',
                content: optimalMessage
            });
        }
    }
    
    // Insight 5: Current streak assessment
    if (data.currentStreak >= 2) {
        let currentStreakMessage = '';
        let currentStreakPattern = '';
        
        if (data.currentStreakType === 'win') {
            const avgWinStreakLen = data.streaks
                .filter(s => s.type === 'win')
                .reduce((sum, s) => sum + s.length, 0) / data.streaks.filter(s => s.type === 'win').length;
            
            if (data.currentStreak > avgWinStreakLen) {
                currentStreakMessage = `You're on a ${data.currentStreak}-trade winning streak, which is above your average. Watch for potential overconfidence while capitalizing on your current edge.`;
                currentStreakPattern = 'strong';
            } else {
                currentStreakMessage = `You're on a ${data.currentStreak}-trade winning streak. Maintain your discipline and continue with your current approach that's working.`;
                currentStreakPattern = 'info';
            }
        } else {
            const avgLossStreakLen = data.streaks
                .filter(s => s.type === 'loss')
                .reduce((sum, s) => sum + s.length, 0) / data.streaks.filter(s => s.type === 'loss').length;
            
            if (data.currentStreak > avgLossStreakLen) {
                currentStreakMessage = `You're on a ${data.currentStreak}-trade losing streak, which is above your average. Consider taking a short break or reducing position size until momentum shifts.`;
                currentStreakPattern = 'weak';
            } else {
                currentStreakMessage = `You're on a ${data.currentStreak}-trade losing streak. Review your recent trades for common errors, but avoid drastic strategy changes based on a small sample.`;
                currentStreakPattern = 'neutral';
            }
        }
        
        insights.push({
            title: 'Current Streak Assessment',
            icon: 'chess-board',
            pattern: currentStreakPattern,
            content: currentStreakMessage
        });
    }
    
    // Add insights to container
    insights.forEach(insight => {
        const card = document.createElement('div');
        card.className = 'streak-insight-card';
        
        card.innerHTML = `
            <div class="insight-header">
                <i class="insight-icon fas fa-${insight.icon}"></i>
                <div class="insight-title">${insight.title}
                    <span class="streak-pattern pattern-${insight.pattern}">${insight.pattern}</span>
                </div>
            </div>
            <div class="insight-content">${insight.content}</div>
        `;
        
        container.appendChild(card);
    });
    
    // If no insights, add a default message
    if (!insights.length) {
        const card = document.createElement('div');
        card.className = 'streak-insight-card';
        
        card.innerHTML = `
            <div class="insight-header">
                <i class="insight-icon fas fa-info-circle"></i>
                <div class="insight-title">No Streak Data</div>
            </div>
            <div class="insight-content">Add more trades to see streak insights.</div>
        `;
        
        container.appendChild(card);
    }
}

// Helper function to apply dark theme to chart
function applyDarkThemeToChart(chart) {
    if (!chart) return;
    
    // Update scale colors
    chart.options.scales.x.ticks.color = '#e0e0e0';
    chart.options.scales.y.ticks.color = '#e0e0e0';
    chart.options.scales.x.title.color = '#e0e0e0';
    chart.options.scales.y.title.color = '#e0e0e0';
    chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.05)';
    
    // Update title color
    if (chart.options.plugins.title) {
        chart.options.plugins.title.color = '#e0e0e0';
    }
    
    // Update legend colors
    if (chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = '#e0e0e0';
    }
    
    // Apply changes
    chart.update();
}

// Helper function to download chart as image
function downloadChart(chartId, filename) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
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
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}