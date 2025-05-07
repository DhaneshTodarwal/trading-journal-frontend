// AI Assistant Module - Provides personalized trading insights
// This module analyzes trading patterns and generates personalized insights

// Main class for AI Assistant functionality
class TradingAIAssistant {
    constructor() {
        this.patterns = {};
        this.insights = [];
        this.lastAnalysisDate = null;
    }

    // Analyze trades to generate insights
    analyzeTrades(trades) {
        // Skip if no trades or not enough trades for meaningful analysis
        if (!trades || trades.length < 5) {
            this.insights = [{
                type: 'info',
                title: 'Not Enough Data',
                message: 'Record at least 5 trades to receive personalized insights.',
                action: 'Add more trades to unlock powerful insights about your trading patterns.'
            }];
            return this.insights;
        }

        // Reset insights array
        this.insights = [];

        // Get performance patterns
        this.analyzePerformancePatterns(trades);
        
        // Analyze trade timing
        this.analyzeTradeTimingPatterns(trades);
        
        // Analyze trade sizing
        this.analyzePositionSizing(trades);
        
        // Analyze strategy performance
        this.analyzeStrategyPerformance(trades);

        // Analyze day-of-week patterns
        this.analyzeDayOfWeekPatterns(trades);

        // Analyze stock/instrument performance
        this.analyzeStockPerformance(trades);
        
        // Analyze trading session time
        this.analyzeSessionPerformance(trades);
        
        // Analyze psychological patterns
        this.analyzePsychologicalPatterns(trades);
        
        // Analyze rules compliance impact
        this.analyzeRulesComplianceImpact(trades);
        
        // Analyze volatility performance
        this.analyzeVolatilityPerformance(trades);
        
        // Analyze journal consistency
        this.analyzeJournalConsistency(trades);

        // Generate recommendation for improvement
        this.generateRecommendations(trades);
        
        // Update last analysis date
        this.lastAnalysisDate = new Date();
        
        return this.insights;
    }
    
    // Analyze performance trends
    analyzePerformancePatterns(trades) {
        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Get last 10 trades
        const recentTrades = sortedTrades.slice(-10);
        
        // Calculate win/loss streak
        let currentStreak = 1;
        let streakType = parseFloat(recentTrades[recentTrades.length - 1]?.profitLossPercentage) >= 0 ? 'win' : 'loss';
        
        for (let i = recentTrades.length - 2; i >= 0; i--) {
            const isWin = parseFloat(recentTrades[i].profitLossPercentage) >= 0;
            if ((streakType === 'win' && isWin) || (streakType === 'loss' && !isWin)) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        // Add insight if streak is notable (3 or more)
        if (currentStreak >= 3) {
            this.insights.push({
                type: streakType === 'win' ? 'success' : 'warning',
                title: `${streakType === 'win' ? 'Winning' : 'Losing'} Streak Alert`,
                message: `You're on a ${currentStreak}-trade ${streakType} streak.`,
                action: streakType === 'win' ? 'Keep your strategy consistent and avoid overconfidence.' : 'Consider taking a short break or reducing position size.',
                priority: streakType === 'loss' ? 'high' : 'medium'
            });
        }
        
        // Check for trend reversal
        if (recentTrades.length >= 5) {
            let reversalDetected = true;
            const lastTradeProfit = parseFloat(recentTrades[recentTrades.length - 1].profitLossPercentage) >= 0;
            
            for (let i = recentTrades.length - 2; i >= recentTrades.length - 4; i--) {
                const isProfit = parseFloat(recentTrades[i].profitLossPercentage) >= 0;
                if (isProfit === lastTradeProfit) {
                    reversalDetected = false;
                    break;
                }
            }
            
            if (reversalDetected) {
                this.insights.push({
                    type: lastTradeProfit ? 'success' : 'warning',
                    title: 'Trend Reversal Detected',
                    message: `Your last trade broke a string of ${lastTradeProfit ? 'losses' : 'wins'}.`,
                    action: lastTradeProfit ? 'Analyze what you did differently in this trade to succeed.' : 'Review this trade carefully to avoid repeating mistakes.',
                    priority: 'medium'
                });
            }
        }
    }

    // Analyze patterns in trade timing
    analyzeTradeTimingPatterns(trades) {
        // Set specific timeframes to check
        const checkFrequentTrading = trades.length >= 10;
        
        if (checkFrequentTrading) {
            // Sort trades by date
            const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Get the most recent trades
            const recentTrades = sortedTrades.slice(-10);
            
            // Check for excessive trading in short period
            const firstDate = new Date(recentTrades[0].date);
            const lastDate = new Date(recentTrades[recentTrades.length - 1].date);
            const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff <= 3 && recentTrades.length >= 6) {
                // Calculate win rate during this period
                const winCount = recentTrades.filter(t => parseFloat(t.profitLossPercentage) > 0).length;
                const winRate = (winCount / recentTrades.length) * 100;
                
                if (winRate < 50) {
                    this.insights.push({
                        type: 'warning',
                        title: 'Overtrading Alert',
                        message: `You made ${recentTrades.length} trades in ${Math.round(daysDiff)} days with only ${winRate.toFixed(1)}% win rate.`,
                        action: 'Consider slowing down. Quality trades over quantity.',
                        priority: 'high'
                    });
                }
            }
        }
    }

    // Analyze position sizing patterns
    analyzePositionSizing(trades) {
        if (trades.length < 5) return;
        
        // Find the trades with highest P&L %
        const sortedByProfitPercent = [...trades].sort((a, b) => 
            parseFloat(b.profitLossPercentage) - parseFloat(a.profitLossPercentage));
            
        // Calculate average position size of top 3 profitable trades
        const topTrades = sortedByProfitPercent.slice(0, 3);
        
        // If all top trades have position size and profit > 5%
        if (topTrades.every(t => t.strikePrice && parseFloat(t.profitLossPercentage) > 5)) {
            this.insights.push({
                type: 'success',
                title: 'Position Sizing Success Pattern',
                message: 'Your most profitable trades have consistent position sizing.',
                action: 'Continue this disciplined approach to position sizing.',
                priority: 'medium'
            });
        }
    }

    // Analyze strategy performance
    analyzeStrategyPerformance(trades) {
        if (trades.length < 8) return;
        
        // Group trades by strategy
        const strategies = {};
        
        trades.forEach(trade => {
            const strategy = trade.strategy || 'Undefined';
            if (!strategies[strategy]) {
                strategies[strategy] = {
                    count: 0,
                    wins: 0,
                    totalPL: 0
                };
            }
            
            strategies[strategy].count++;
            if (parseFloat(trade.profitLossPercentage) > 0) {
                strategies[strategy].wins++;
            }
            strategies[strategy].totalPL += parseFloat(trade.profitLossPercentage) || 0;
        });
        
        // Find best and worst strategies with at least 3 trades
        let bestStrategy = { name: null, winRate: 0, avgPL: 0 };
        let worstStrategy = { name: null, winRate: 100, avgPL: 0 };
        
        for (const [name, data] of Object.entries(strategies)) {
            if (data.count >= 3) {
                const winRate = (data.wins / data.count) * 100;
                const avgPL = data.totalPL / data.count;
                
                if (winRate > bestStrategy.winRate) {
                    bestStrategy = { name, winRate, avgPL, count: data.count };
                }
                
                if (winRate < worstStrategy.winRate) {
                    worstStrategy = { name, winRate, avgPL, count: data.count };
                }
            }
        }
        
        // Add insights about best strategy
        if (bestStrategy.name && bestStrategy.winRate > 60) {
            this.insights.push({
                type: 'success',
                title: 'Top Performing Strategy',
                message: `${bestStrategy.name} strategy has ${bestStrategy.winRate.toFixed(1)}% win rate (${bestStrategy.count} trades).`,
                action: 'Consider allocating more capital to this strategy.',
                priority: 'high'
            });
        }
        
        // Add insights about worst strategy
        if (worstStrategy.name && worstStrategy.winRate < 40 && worstStrategy.name !== 'Undefined') {
            this.insights.push({
                type: 'warning',
                title: 'Underperforming Strategy',
                message: `${worstStrategy.name} strategy has only ${worstStrategy.winRate.toFixed(1)}% win rate (${worstStrategy.count} trades).`,
                action: 'Review or consider reducing exposure to this strategy.',
                priority: 'high'
            });
        }
    }

    // Analyze day-of-week patterns
    analyzeDayOfWeekPatterns(trades) {
        if (trades.length < 10) return;
        
        const dayStats = {
            0: {name: 'Sunday', count: 0, wins: 0, totalPL: 0},
            1: {name: 'Monday', count: 0, wins: 0, totalPL: 0},
            2: {name: 'Tuesday', count: 0, wins: 0, totalPL: 0},
            3: {name: 'Wednesday', count: 0, wins: 0, totalPL: 0},
            4: {name: 'Thursday', count: 0, wins: 0, totalPL: 0},
            5: {name: 'Friday', count: 0, wins: 0, totalPL: 0},
            6: {name: 'Saturday', count: 0, wins: 0, totalPL: 0}
        };
        
        // Collect stats by day of week
        trades.forEach(trade => {
            const date = new Date(trade.date);
            const day = date.getDay();
            const pl = parseFloat(trade.profitLossPercentage) || 0;
            
            dayStats[day].count++;
            if (pl > 0) dayStats[day].wins++;
            dayStats[day].totalPL += pl;
        });
        
        // Find best and worst days with at least 3 trades
        let bestDay = null;
        let worstDay = null;
        
        Object.values(dayStats).forEach(day => {
            if (day.count >= 3) {
                const avgPL = day.totalPL / day.count;
                const winRate = (day.wins / day.count) * 100;
                
                if (!bestDay || avgPL > bestDay.avgPL) {
                    bestDay = {...day, avgPL, winRate};
                }
                
                if (!worstDay || avgPL < worstDay.avgPL) {
                    worstDay = {...day, avgPL, winRate};
                }
            }
        });
        
        // Add best day insight
        if (bestDay && bestDay.avgPL > 0 && bestDay.count >= 3) {
            this.insights.push({
                type: 'success',
                title: 'Best Trading Day',
                message: `${bestDay.name}s show ${bestDay.winRate.toFixed(0)}% win rate with avg. return of ${bestDay.avgPL.toFixed(2)}%.`,
                action: 'Consider increasing position size on this day.',
                priority: 'medium'
            });
        }
        
        // Add worst day insight
        if (worstDay && worstDay.avgPL < 0 && worstDay.count >= 3) {
            this.insights.push({
                type: 'warning',
                title: 'Challenging Trading Day',
                message: `${worstDay.name}s show ${worstDay.winRate.toFixed(0)}% win rate with avg. return of ${worstDay.avgPL.toFixed(2)}%.`,
                action: 'Consider reducing position size or avoiding trades on this day.',
                priority: 'medium'
            });
        }
    }

    // Analyze stock/instrument performance
    analyzeStockPerformance(trades) {
        if (trades.length < 8) return;
        
        // Group trades by stock/instrument
        const stocks = {};
        
        trades.forEach(trade => {
            const stock = trade.stock || 'Unknown';
            if (!stocks[stock]) {
                stocks[stock] = {
                    count: 0,
                    wins: 0,
                    totalPL: 0,
                    avgPL: 0
                };
            }
            
            stocks[stock].count++;
            if (parseFloat(trade.profitLossPercentage) > 0) {
                stocks[stock].wins++;
            }
            stocks[stock].totalPL += parseFloat(trade.profitLossPercentage) || 0;
        });
        
        // Calculate average P&L and win rate for each stock
        for (const stock in stocks) {
            if (stocks[stock].count > 0) {
                stocks[stock].avgPL = stocks[stock].totalPL / stocks[stock].count;
                stocks[stock].winRate = (stocks[stock].wins / stocks[stock].count) * 100;
            }
        }
        
        // Find best and worst performing stocks with at least 3 trades
        let bestStock = { name: null, avgPL: -Infinity, winRate: 0, count: 0 };
        let worstStock = { name: null, avgPL: Infinity, winRate: 0, count: 0 };
        
        for (const [name, data] of Object.entries(stocks)) {
            if (data.count >= 3) {
                if (data.avgPL > bestStock.avgPL) {
                    bestStock = { name, avgPL: data.avgPL, winRate: data.winRate, count: data.count };
                }
                
                if (data.avgPL < worstStock.avgPL) {
                    worstStock = { name, avgPL: data.avgPL, winRate: data.winRate, count: data.count };
                }
            }
        }
        
        // Add insights about best performing stock
        if (bestStock.name && bestStock.avgPL > 0) {
            this.insights.push({
                type: 'success',
                title: 'Top Performing Stock',
                message: `${bestStock.name} shows ${bestStock.winRate.toFixed(1)}% win rate with avg. return of ${bestStock.avgPL.toFixed(2)}% (${bestStock.count} trades).`,
                action: 'Consider focusing more on this stock or similar ones in this sector.',
                priority: 'high'
            });
        }
        
        // Add insights about worst performing stock if significantly negative
        if (worstStock.name && worstStock.avgPL < -3) {
            this.insights.push({
                type: 'warning',
                title: 'Challenging Stock',
                message: `${worstStock.name} shows only ${worstStock.winRate.toFixed(1)}% win rate with avg. return of ${worstStock.avgPL.toFixed(2)}% (${worstStock.count} trades).`,
                action: 'Consider avoiding this stock or improve your strategy specifically for it.',
                priority: 'high'
            });
        }
    }
    
    // Analyze performance by trading session (time of day)
    analyzeSessionPerformance(trades) {
        if (trades.length < 10) return;
        
        // Categorize trades by session (assuming Indian market hours)
        const sessions = {
            'Opening Hour (9:15-10:15)': { count: 0, wins: 0, totalPL: 0 },
            'Morning (10:15-12:00)': { count: 0, wins: 0, totalPL: 0 },
            'Lunch (12:00-13:30)': { count: 0, wins: 0, totalPL: 0 },
            'Afternoon (13:30-15:00)': { count: 0, wins: 0, totalPL: 0 },
            'Closing Hour (15:00-15:30)': { count: 0, wins: 0, totalPL: 0 }
        };
        
        // Helper to determine session from time
        const getSession = (dateStr) => {
            const date = new Date(dateStr);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const totalMinutes = hours * 60 + minutes;
            
            if (totalMinutes >= 9*60+15 && totalMinutes < 10*60+15) return 'Opening Hour (9:15-10:15)';
            if (totalMinutes >= 10*60+15 && totalMinutes < 12*60) return 'Morning (10:15-12:00)';
            if (totalMinutes >= 12*60 && totalMinutes < 13*60+30) return 'Lunch (12:00-13:30)';
            if (totalMinutes >= 13*60+30 && totalMinutes < 15*60) return 'Afternoon (13:30-15:00)';
            if (totalMinutes >= 15*60 && totalMinutes < 15*60+30) return 'Closing Hour (15:00-15:30)';
            return null;
        };
        
        // Process trades with time information
        trades.forEach(trade => {
            if (!trade.date) return;
            
            const session = getSession(trade.date);
            if (!session) return;
            
            sessions[session].count++;
            if (parseFloat(trade.profitLossPercentage) > 0) {
                sessions[session].wins++;
            }
            sessions[session].totalPL += parseFloat(trade.profitLossPercentage) || 0;
        });
        
        // Find best and worst session with at least 3 trades
        let bestSession = null;
        let worstSession = null;
        
        for (const [name, data] of Object.entries(sessions)) {
            if (data.count >= 3) {
                const winRate = (data.wins / data.count) * 100;
                const avgPL = data.totalPL / data.count;
                
                if (!bestSession || avgPL > bestSession.avgPL) {
                    bestSession = { name, winRate, avgPL, count: data.count };
                }
                
                if (!worstSession || avgPL < worstSession.avgPL) {
                    worstSession = { name, winRate, avgPL, count: data.count };
                }
            }
        }
        
        // Add insight about best session
        if (bestSession && bestSession.avgPL > 0) {
            this.insights.push({
                type: 'success',
                title: 'Best Trading Session',
                message: `${bestSession.name} shows ${bestSession.winRate.toFixed(1)}% win rate with avg. return of ${bestSession.avgPL.toFixed(2)}%.`,
                action: 'Consider focusing more on trades during this time period.',
                priority: 'medium'
            });
        }
        
        // Add insight about worst session if significantly negative
        if (worstSession && worstSession.avgPL < -2) {
            this.insights.push({
                type: 'warning',
                title: 'Challenging Trading Session',
                message: `${worstSession.name} shows only ${worstSession.winRate.toFixed(1)}% win rate with avg. return of ${worstSession.avgPL.toFixed(2)}%.`,
                action: 'Consider reducing trading activity during this time period.',
                priority: 'medium'
            });
        }
    }
    
    // Analyze psychological patterns
    analyzePsychologicalPatterns(trades) {
        if (trades.length < 10) return;
        
        // Group trades by mood
        const moods = {};
        
        trades.forEach(trade => {
            const mood = trade.mood || 'Not Recorded';
            if (!moods[mood]) {
                moods[mood] = {
                    count: 0,
                    wins: 0,
                    totalPL: 0
                };
            }
            
            moods[mood].count++;
            if (parseFloat(trade.profitLossPercentage) > 0) {
                moods[mood].wins++;
            }
            moods[mood].totalPL += parseFloat(trade.profitLossPercentage) || 0;
        });
        
        // Calculate statistics for each mood
        for (const mood in moods) {
            if (moods[mood].count > 0) {
                moods[mood].winRate = (moods[mood].wins / moods[mood].count) * 100;
                moods[mood].avgPL = moods[mood].totalPL / moods[mood].count;
            }
        }
        
        // Find best and worst mood with at least 3 trades
        let bestMood = null;
        let worstMood = null;
        
        for (const [name, data] of Object.entries(moods)) {
            if (data.count >= 3) {
                if (!bestMood || data.winRate > bestMood.winRate) {
                    bestMood = { name, winRate: data.winRate, avgPL: data.avgPL, count: data.count };
                }
                
                if (!worstMood || data.winRate < worstMood.winRate) {
                    worstMood = { name, winRate: data.winRate, avgPL: data.avgPL, count: data.count };
                }
            }
        }
        
        // Add insight about psychological state impact
        if (bestMood && worstMood && bestMood.name !== 'Not Recorded' && worstMood.name !== 'Not Recorded' && bestMood.winRate - worstMood.winRate > 20) {
            this.insights.push({
                type: 'info',
                title: 'Psychological State Impact',
                message: `Trading while feeling "${bestMood.name}" yields ${bestMood.winRate.toFixed(1)}% win rate vs. only ${worstMood.winRate.toFixed(1)}% when feeling "${worstMood.name}"`,
                action: `Pay attention to your mental state before trading. Avoid trading when feeling "${worstMood.name}".`,
                priority: 'high'
            });
        }
        
        // Special insight for FOMO or Revenge trading
        if (moods['FOMO'] && moods['FOMO'].count >= 2 && moods['FOMO'].avgPL < 0) {
            this.insights.push({
                type: 'warning',
                title: 'FOMO Trading Alert',
                message: `Trades driven by FOMO have ${moods['FOMO'].winRate.toFixed(1)}% win rate with avg. return of ${moods['FOMO'].avgPL.toFixed(2)}%.`,
                action: 'Implement a cooling-off period before entering trades when you feel FOMO.',
                priority: 'high'
            });
        }
        
        if (moods['Revenge'] && moods['Revenge'].count >= 2 && moods['Revenge'].avgPL < 0) {
            this.insights.push({
                type: 'warning',
                title: 'Revenge Trading Alert',
                message: `Revenge trades have ${moods['Revenge'].winRate.toFixed(1)}% win rate with avg. return of ${moods['Revenge'].avgPL.toFixed(2)}%.`,
                action: 'Take a break after losses. Don\'t trade to recover losses immediately.',
                priority: 'high'
            });
        }
    }
    
    // Analyze rules compliance impact
    analyzeRulesComplianceImpact(trades) {
        const recentTrades = trades.filter(trade => trade.rulesFollowed !== undefined);
        if (recentTrades.length < 5) return;
        
        // Group trades by rules compliance level
        let highComplianceTrades = [];
        let lowComplianceTrades = [];
        
        recentTrades.forEach(trade => {
            const rulesFollowed = trade.rulesFollowed || [];
            const ruleCount = Array.isArray(rulesFollowed) ? rulesFollowed.length : 0;
            const totalRules = trade.totalRules || 0;
            
            if (totalRules === 0) return;
            
            const complianceRate = (ruleCount / totalRules) * 100;
            
            if (complianceRate >= 80) {
                highComplianceTrades.push(trade);
            } else if (complianceRate <= 50) {
                lowComplianceTrades.push(trade);
            }
        });
        
        // Calculate statistics for high compliance trades
        let highWinRate = 0;
        let highAvgPL = 0;
        
        if (highComplianceTrades.length > 0) {
            const highWins = highComplianceTrades.filter(t => parseFloat(t.profitLossPercentage) > 0).length;
            highWinRate = (highWins / highComplianceTrades.length) * 100;
            highAvgPL = highComplianceTrades.reduce((sum, t) => sum + parseFloat(t.profitLossPercentage), 0) / highComplianceTrades.length;
        }
        
        // Calculate statistics for low compliance trades
        let lowWinRate = 0;
        let lowAvgPL = 0;
        
        if (lowComplianceTrades.length > 0) {
            const lowWins = lowComplianceTrades.filter(t => parseFloat(t.profitLossPercentage) > 0).length;
            lowWinRate = (lowWins / lowComplianceTrades.length) * 100;
            lowAvgPL = lowComplianceTrades.reduce((sum, t) => sum + parseFloat(t.profitLossPercentage), 0) / lowComplianceTrades.length;
        }
        
        // Add insight about rules compliance impact
        if (highComplianceTrades.length >= 3 && lowComplianceTrades.length >= 3) {
            const winRateDiff = highWinRate - lowWinRate;
            const plDiff = highAvgPL - lowAvgPL;
            
            if (winRateDiff > 15 || plDiff > 3) {
                this.insights.push({
                    type: 'info',
                    title: 'Rules Compliance Impact',
                    message: `High rule compliance trades: ${highWinRate.toFixed(1)}% win rate, ${highAvgPL.toFixed(2)}% avg. return vs. Low compliance: ${lowWinRate.toFixed(1)}% win rate, ${lowAvgPL.toFixed(2)}% avg. return`,
                    action: 'Follow your trading rules consistently for better results.',
                    priority: 'high'
                });
            }
        }
    }
    
    // Analyze volatility performance
    analyzeVolatilityPerformance(trades) {
        if (trades.length < 10) return;
        
        // Try to detect high volatility periods using large price swings in trades
        const highVolatilityTrades = trades.filter(trade => {
            const stopLoss = parseFloat(trade.stopLoss) || 0;
            return stopLoss > 3; // Using stop loss percentage as a proxy for volatility
        });
        
        const normalTrades = trades.filter(trade => {
            const stopLoss = parseFloat(trade.stopLoss) || 0;
            return stopLoss > 0 && stopLoss <= 3;
        });
        
        // Calculate statistics for high volatility trades
        let highVolWinRate = 0;
        let highVolAvgPL = 0;
        
        if (highVolatilityTrades.length > 0) {
            const highVolWins = highVolatilityTrades.filter(t => parseFloat(t.profitLossPercentage) > 0).length;
            highVolWinRate = (highVolWins / highVolatilityTrades.length) * 100;
            highVolAvgPL = highVolatilityTrades.reduce((sum, t) => sum + parseFloat(t.profitLossPercentage), 0) / highVolatilityTrades.length;
        }
        
        // Calculate statistics for normal volatility trades
        let normalWinRate = 0;
        let normalAvgPL = 0;
        
        if (normalTrades.length > 0) {
            const normalWins = normalTrades.filter(t => parseFloat(t.profitLossPercentage) > 0).length;
            normalWinRate = (normalWins / normalTrades.length) * 100;
            normalAvgPL = normalTrades.reduce((sum, t) => sum + parseFloat(t.profitLossPercentage), 0) / normalTrades.length;
        }
        
        // Add insight about volatility performance if there's a meaningful difference
        if (highVolatilityTrades.length >= 3 && normalTrades.length >= 3) {
            const betterInHighVol = highVolAvgPL > normalAvgPL;
            const difference = Math.abs(highVolAvgPL - normalAvgPL);
            
            if (difference > 1.5) {
                this.insights.push({
                    type: 'info',
                    title: 'Volatility Performance',
                    message: betterInHighVol ? 
                        `You perform better in high volatility conditions (${highVolAvgPL.toFixed(2)}% avg. return vs ${normalAvgPL.toFixed(2)}%)` :
                        `You perform better in normal volatility conditions (${normalAvgPL.toFixed(2)}% avg. return vs ${highVolAvgPL.toFixed(2)}%)`,
                    action: betterInHighVol ? 
                        'Consider increasing position size during high volatility periods.' :
                        'Consider reducing position size during high volatility periods.',
                    priority: 'medium'
                });
            }
        }
    }
    
    // Analyze journal consistency
    analyzeJournalConsistency(trades) {
        if (trades.length < 10) return;
        
        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Check for regular journal entries over the last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const recentTrades = sortedTrades.filter(trade => {
            const tradeDate = new Date(trade.date);
            return tradeDate >= thirtyDaysAgo && tradeDate <= now;
        });
        
        // Calculate days with journal entries
        const tradesDays = new Set();
        
        recentTrades.forEach(trade => {
            const dateStr = new Date(trade.date).toLocaleDateString('en-IN');
            tradesDays.add(dateStr);
        });
        
        const daysWithEntries = tradesDays.size;
        const tradingDays = this.getWorkdaysInRange(thirtyDaysAgo, now);
        
        // Check if notes and tags are consistently used
        let notesCount = 0;
        let tagsCount = 0;
        
        recentTrades.forEach(trade => {
            if (trade.notes && trade.notes.length > 20) notesCount++;
            if (trade.tags && trade.tags.length > 0) tagsCount++;
        });
        
        const notesPercentage = (notesCount / recentTrades.length) * 100;
        const tagsPercentage = (tagsCount / recentTrades.length) * 100;
        
        // Add journal consistency insight
        if (daysWithEntries < tradingDays * 0.7) {
            this.insights.push({
                type: 'info',
                title: 'Journal Consistency',
                message: `You've journaled trades on ${daysWithEntries} out of approximately ${tradingDays} trading days in the last month.`,
                action: 'Consider adding entries more consistently for better pattern recognition.',
                priority: 'low'
            });
        }
        
        // Add insight about notes and tags usage
        if (notesPercentage < 70 || tagsPercentage < 70) {
            this.insights.push({
                type: 'info',
                title: 'Journal Completeness',
                message: `${notesPercentage.toFixed(0)}% of your trades have detailed notes and ${tagsPercentage.toFixed(0)}% have tags.`,
                action: 'Add more detailed notes and consistent tags to improve your analysis.',
                priority: 'low'
            });
        }
    }
    
    // Helper method to calculate working days between dates
    getWorkdaysInRange(startDate, endDate) {
        let count = 0;
        const curDate = new Date(startDate.getTime());
        while (curDate <= endDate) {
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++; // Skip weekends (0 = Sunday, 6 = Saturday)
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    }

    // Generate overall recommendations
    generateRecommendations(trades) {
        if (trades.length < 8) return;
        
        // Calculate overall statistics
        const winningTrades = trades.filter(t => parseFloat(t.profitLossPercentage) > 0);
        const losingTrades = trades.filter(t => parseFloat(t.profitLossPercentage) <= 0);
        
        const avgWin = winningTrades.reduce((sum, t) => sum + parseFloat(t.profitLossPercentage), 0) / winningTrades.length;
        const avgLoss = losingTrades.reduce((sum, t) => sum + parseFloat(t.profitLossPercentage), 0) / losingTrades.length;
        
        // Check win/loss ratio
        const winLossRatio = Math.abs(avgWin / avgLoss);
        
        // Add insights based on risk-reward ratio
        if (winLossRatio < 1 && winningTrades.length / trades.length > 0.5) {
            this.insights.push({
                type: 'info',
                title: 'Risk-Reward Improvement',
                message: `Your average win (${avgWin.toFixed(2)}%) is smaller than your average loss (${avgLoss.toFixed(2)}%).`,
                action: 'Try to let your winners run longer or cut losses quicker.',
                priority: 'medium'
            });
        } else if (winLossRatio > 2) {
            this.insights.push({
                type: 'success',
                title: 'Excellent Risk-Reward Ratio',
                message: `Your average win is ${winLossRatio.toFixed(1)}× your average loss - well done!`,
                action: 'Maintain this excellent risk management approach.',
                priority: 'low'
            });
        }
    }

    // Render insights in the widget
    renderInsights(container) {
        if (!container) return;
        
        // Check if we have insights
        if (!this.insights || this.insights.length === 0) {
            container.innerHTML = `
                <div class="empty-insights">
                    <i class="fas fa-brain"></i>
                    <p>No insights available yet. Add trades to get personalized recommendations.</p>
                </div>
            `;
            return;
        }
        
        // Sort insights by priority
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        const sortedInsights = [...this.insights].sort((a, b) => {
            return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
        });
        
        // Generate HTML for insights
        let html = `<div class="insights-list">`;
        
        sortedInsights.forEach(insight => {
            const iconClass = insight.type === 'success' ? 'fa-check-circle' : 
                             (insight.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle');
            
            html += `
                <div class="insight-card insight-${insight.type}">
                    <div class="insight-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.message}</p>
                        <div class="insight-action">
                            <i class="fas fa-lightbulb"></i> ${insight.action}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Add last analyzed date
        if (this.lastAnalysisDate) {
            html += `
                <div class="insights-footer">
                    <p>Last analyzed: ${this.lastAnalysisDate.toLocaleString('en-IN')}</p>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
}

// Initialize AI Assistant
let tradingAI = null;

function initAIAssistant() {
    tradingAI = new TradingAIAssistant();
}

// Helper function to add AI Insights widget to dashboard
function addInsightsWidget() {
    // Check if widget already exists to prevent duplicates
    if (document.querySelector('[data-widget-id="trading-insights"]')) {
        // Widget already exists, just update the insights
        updateInsights();
        return;
    }
    
    // Find the dashboard section
    const dashboardSection = document.getElementById('dashboard');
    if (!dashboardSection) return;
    
    // Find the recent trades section to insert after it
    const recentTrades = dashboardSection.querySelector('.recent-trades');
    if (!recentTrades) return;
    
    // Create widget
    const widget = document.createElement('div');
    widget.className = 'dashboard-widget widget-full personalized-insights';
    widget.setAttribute('data-widget-id', 'trading-insights');
    
    // Create widget header
    widget.innerHTML = `
        <div class="widget-header">
            <div class="widget-drag-handle">
                <i class="fas fa-grip-horizontal"></i>
            </div>
            <h3><i class="fas fa-brain"></i> Personalized Trading Insights</h3>
            <div class="widget-controls">
                <button class="widget-control widget-refresh" title="Refresh Insights">
                    <i class="fas fa-sync"></i>
                </button>
                <button class="widget-control widget-resize" title="Resize Widget">
                    <i class="fas fa-expand-alt"></i>
                </button>
            </div>
        </div>
        <div class="widget-content">
            <div id="ai-insights-container">
                <div class="loading-insights">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Analyzing your trading patterns...</p>
                </div>
            </div>
        </div>
    `;
    
    // Insert after recent trades section
    recentTrades.insertAdjacentElement('afterend', widget);
    
    // Add event listener for refresh button
    widget.querySelector('.widget-refresh').addEventListener('click', updateInsights);
    
    // Initialize insights
    updateInsights();
}

// Update insights
function updateInsights() {
    if (!tradingAI) initAIAssistant();
    
    const insightsContainer = document.getElementById('ai-insights-container');
    if (!insightsContainer) return;
    
    // Show loading state
    insightsContainer.innerHTML = `
        <div class="loading-insights">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analyzing your trading patterns...</p>
        </div>
    `;
    
    // Get trades data
    const trades = loadTrades();
    
    // Simulate AI processing time for better UX
    setTimeout(() => {
        // Analyze trades
        tradingAI.analyzeTrades(trades);
        
        // Render insights
        tradingAI.renderInsights(insightsContainer);
    }, 800);
}

// Initialize AI assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AI assistant
    initAIAssistant();
    
    // Add to window object so it can be called from other scripts
    window.tradingAI = tradingAI;
    window.addInsightsWidget = addInsightsWidget;
    
    // Add insights widget if we're on the dashboard
    if (document.querySelector('[data-section="dashboard"].active')) {
        addInsightsWidget();
    }
    
    // Initialize insights widget when switching to dashboard
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            if (targetSection === 'dashboard') {
                // Wait for the section to become active
                setTimeout(() => {
                    // Check if widget already exists
                    if (!document.querySelector('[data-widget-id="trading-insights"]')) {
                        addInsightsWidget();
                    } else {
                        // Just update insights if widget exists
                        updateInsights();
                    }
                }, 100);
            }
        });
    });
});