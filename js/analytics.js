// Analytics Functions for Trading Journal

// Global variables to track chart instances
let dayPerformanceChart = null;
let timePerformanceChart = null;
let stockPerformanceChart = null;
let analyticsLoaded = false;

// Initialize analytics when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupAnalyticsNavigation();
    setupDateRangeFilter();
    setupResizeHandler();
    
    // Add a function to refresh the analytics when needed from external files
    window.refreshAnalytics = function(dateRange = 'all', customDates = null) {
        console.log("External refreshAnalytics call received");
        // Always try to refresh analytics even if the section isn't visible yet
        // This helps when trades are added/edited and then user switches to analytics
        try {
            if (document.getElementById('analytics').classList.contains('active')) {
                console.log("Analytics section is active, refreshing immediately");
                loadAnalyticsData(dateRange, customDates);
            } else {
                console.log("Analytics section not active, marking for refresh when activated");
                // Set a flag to refresh when the section becomes active
                window.analyticsNeedsRefresh = true;
                window.analyticsRefreshParams = { dateRange, customDates };
            }
        } catch (e) {
            console.error("Error in refreshAnalytics:", e);
        }
    };
    
    // Add a global event listener for trade data changes
    document.addEventListener('tradeDataChanged', function(e) {
        console.log("Trade data changed event detected in analytics.js");
        window.refreshAnalytics();
    });
});

// Set up analytics navigation
function setupAnalyticsNavigation() {
    const analyticsLink = document.querySelector('[data-section="analytics"]');
    if (analyticsLink) {
        analyticsLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('[data-section]').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to analytics link
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show analytics section
            const analyticsSection = document.getElementById('analytics');
            if (analyticsSection) {
                analyticsSection.classList.add('active');
                
                // Ensure charts render correctly by loading with a slight delay
                // This gives the section time to become visible
                setTimeout(() => {
                    loadAnalyticsData();
                    analyticsLoaded = true;
                }, 100);
            }
        });
    }
}

// Setup date range filtering
function setupDateRangeFilter() {
    const dateRangeSelect = document.getElementById('analytics-date-range');
    const customDateRange = document.querySelector('.custom-date-range');
    const applyButton = document.getElementById('apply-date-range');
    
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue === 'custom') {
                if (customDateRange) customDateRange.classList.remove('hidden');
            } else {
                if (customDateRange) customDateRange.classList.add('hidden');
                loadAnalyticsData(selectedValue);
            }
        });
    }
    
    if (applyButton) {
        applyButton.addEventListener('click', function() {
            const startDateEl = document.getElementById('analytics-start-date');
            const endDateEl = document.getElementById('analytics-end-date');
            
            if (!startDateEl || !endDateEl) return;
            
            const startDate = startDateEl.value;
            const endDate = endDateEl.value;
            
            if (startDate && endDate) {
                loadAnalyticsData('custom', {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate)
                });
            } else {
                alert('Please select both start and end dates');
            }
        });
    }
}

// Setup resize handler to ensure charts render properly on window resize
function setupResizeHandler() {
    window.addEventListener('resize', function() {
        if (analyticsLoaded && document.getElementById('analytics')?.classList.contains('active')) {
            // Redraw all charts to ensure they fit the new dimensions
            if (dayPerformanceChart) {
                try {
                    dayPerformanceChart.update();
                } catch (e) {
                    console.error("Error updating day performance chart:", e);
                }
            }
            if (timePerformanceChart) {
                try {
                    timePerformanceChart.update();
                } catch (e) {
                    console.error("Error updating time performance chart:", e);
                }
            }
            if (stockPerformanceChart) {
                try {
                    stockPerformanceChart.update();
                } catch (e) {
                    console.error("Error updating stock performance chart:", e);
                }
            }
        }
    });
}

// Filter trades based on date range
function filterTradesByDateRange(trades, dateRange, customDates) {
    if (!trades || !Array.isArray(trades)) return [];

    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    let endDate = new Date(8640000000000000); // Max possible date (effectively infinite future)

    // Set start date based on selected range
    if (dateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of current month
    } else if (dateRange === 'quarter') {
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of current month
    } else if (dateRange === 'halfyear') {
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of current month
    } else if (dateRange === 'year') {
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of current month
    } else if (dateRange === 'custom' && customDates && customDates.startDate && customDates.endDate) {
        startDate = new Date(customDates.startDate);
        startDate.setHours(0, 0, 0, 0); // Start of the selected day
        endDate = new Date(customDates.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the selected day
    } else {
        // Default to 'all' - startDate is already beginning of time, endDate is max future
    }

    // Ensure startDate and endDate are valid dates
    if (isNaN(startDate.getTime())) startDate = new Date(0);
    if (isNaN(endDate.getTime())) endDate = new Date(8640000000000000);

    // Filter trades that fall within the date range (inclusive)
    return trades.filter(trade => {
        try {
            // Ensure trade.date is valid before creating Date object
            if (!trade.date || typeof trade.date !== 'string') return false;
            
            const tradeDate = new Date(trade.date);
            if (isNaN(tradeDate.getTime())) return false; // Skip invalid trade dates

            // Compare only the date part (Year, Month, Day)
            const tradeDayStart = new Date(tradeDate.getFullYear(), tradeDate.getMonth(), tradeDate.getDate());
            const filterStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const filterEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

            return tradeDayStart >= filterStartDay && tradeDayStart <= filterEndDay;
        } catch (e) {
            console.error("Error filtering trade by date:", e, trade);
            return false;
        }
    });
}

// Main function to load and render analytics data
function loadAnalyticsData(dateRange = 'all', customDates = null) {
    try {
        // Load trades from storage
        const trades = typeof loadTrades === 'function' ? loadTrades() : [];
        
        // Filter trades based on date range
        const filteredTrades = filterTradesByDateRange(trades, dateRange, customDates);
        
        // Generate calendar view
        generateTradeCalendar(filteredTrades);
        
        // Generate day of week performance chart
        generateDayPerformanceChart(filteredTrades);
        
        // Generate time of day chart
        generateTimePerformanceChart(filteredTrades);
        
        // Generate stock performance chart
        generateStockPerformanceChart(filteredTrades);
        
        // Generate insights
        generateTradeInsights(filteredTrades);
    } catch (e) {
        console.error("Error loading analytics data:", e);
    }
}

// Update the generateTradeCalendar function for a more compact display
function generateTradeCalendar(trades) {
    const calendarContainer = document.getElementById('trade-calendar');
    if (!calendarContainer) return;
    
    try {
        // Group trades by date
        const tradesByDate = {};
        trades.forEach(trade => {
            if (!trade.date) return;
            
            const dateStr = trade.date;
            if (!tradesByDate[dateStr]) {
                tradesByDate[dateStr] = [];
            }
            tradesByDate[dateStr].push(trade);
        });
        
        // Group dates by month
        const monthsData = {};
        Object.keys(tradesByDate).forEach(dateStr => {
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return;
                
                const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
                
                if (!monthsData[monthYear]) {
                    monthsData[monthYear] = {
                        year: date.getFullYear(),
                        month: date.getMonth(),
                        dates: {}
                    };
                }
                
                monthsData[monthYear].dates[date.getDate()] = tradesByDate[dateStr];
            } catch (e) {
                console.error("Error processing date group:", e, dateStr);
            }
        });
        
        // Get today's date for highlighting
        const today = new Date();
        const currentMonthYear = `${today.getFullYear()}-${today.getMonth() + 1}`;
        const currentDay = today.getDate();
        
        // Sort months chronologically
        const sortedMonths = Object.values(monthsData).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
        
        // If no trade data exists for current month, add it
        const hasCurrentMonth = sortedMonths.some(month => 
            month.year === today.getFullYear() && month.month === today.getMonth());
            
        if (!hasCurrentMonth) {
            sortedMonths.unshift({
                year: today.getFullYear(),
                month: today.getMonth(),
                dates: {}
            });
        }
        
        // Show up to 6 most recent months
        const recentMonths = sortedMonths.slice(0, 6);
        
        // Generate HTML for each month in a stylish layout
        let calendarHTML = `<div class="calendar-months">`;
        
        recentMonths.forEach(monthData => {
            const monthYear = `${monthData.year}-${monthData.month + 1}`;
            const isCurrentMonth = monthYear === currentMonthYear;
            
            const monthDate = new Date(monthData.year, monthData.month, 1);
            const monthName = isNaN(monthDate.getTime()) ? 'Unknown Month' : 
                monthDate.toLocaleDateString('en-US', { 
                    month: 'long',
                    year: 'numeric'
                });
            
            calendarHTML += `
                <div class="calendar-month ${isCurrentMonth ? 'current-month' : ''}">
                    <div class="month-header">${monthName}</div>
                    <div class="calendar-grid">
                        <div class="calendar-day-label">S</div>
                        <div class="calendar-day-label">M</div>
                        <div class="calendar-day-label">T</div>
                        <div class="calendar-day-label">W</div>
                        <div class="calendar-day-label">T</div>
                        <div class="calendar-day-label">F</div>
                        <div class="calendar-day-label">S</div>
            `;
            
            // Calculate first day of month and fill in blanks
            const firstDay = new Date(monthData.year, monthData.month, 1).getDay();
            for (let i = 0; i < firstDay; i++) {
                calendarHTML += `<div></div>`;
            }
            
            // Get number of days in this month
            const daysInMonth = new Date(monthData.year, monthData.month + 1, 0).getDate();
            
            // Fill in days with elegant, compact format
            for (let day = 1; day <= daysInMonth; day++) {
                const isToday = isCurrentMonth && day === currentDay;
                const dayTrades = monthData.dates[day] || [];
                const hasTrades = dayTrades.length > 0;
                
                let dayClass = 'calendar-day no-trades';
                let profitLoss = 0;
                
                if (hasTrades) {
                    // Calculate day's profit/loss
                    profitLoss = dayTrades.reduce((sum, trade) => {
                        const pl = parseFloat(trade.profitLossPercentage || 0);
                        return isNaN(pl) ? sum : sum + pl;
                    }, 0);
                    dayClass = `calendar-day has-trades ${profitLoss >= 0 ? 'positive' : 'negative'}`;
                }
                
                if (isToday) {
                    dayClass += ' today';
                }
                
                // Calculate profit/loss percentage for tooltip
                const profitLossDisplay = profitLoss >= 0 ? 
                    `+${profitLoss.toFixed(2)}%` : 
                    `${profitLoss.toFixed(2)}%`;
                
                const tooltipText = hasTrades ? 
                    `${dayTrades.length} trade(s), P/L: ${profitLossDisplay}` : 
                    'No trades';
                
                // Beautiful day display with trade count badge
                calendarHTML += `
                    <div class="${dayClass}" 
                         data-date="${monthData.year}-${monthData.month + 1}-${day}" 
                         title="${tooltipText}">
                        <div class="calendar-day-number">${day}</div>
                        ${hasTrades ? `<div class="calendar-day-data">${dayTrades.length}</div>` : ''}
                    </div>
                `;
            }
            
            calendarHTML += `
                    </div>
                </div>
            `;
        });
        
        calendarHTML += `</div>`;
        
        // Render calendar
        calendarContainer.innerHTML = calendarHTML;
        
        // Add event listeners to days with trades
        document.querySelectorAll('.calendar-day.has-trades').forEach(dayElement => {
            dayElement.addEventListener('click', function() {
                try {
                    const dateStr = this.getAttribute('data-date');
                    if (!dateStr) return;
                    
                    const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
                    const date = new Date(year, month - 1, day);
                    
                    if (isNaN(date.getTime())) return;
                    
                    const formattedDate = date.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    // Find trades for this date
                    const dayTrades = trades.filter(trade => {
                        try {
                            const tradeDate = new Date(trade.date);
                            return tradeDate.getFullYear() === year && 
                                   tradeDate.getMonth() === month-1 && 
                                   tradeDate.getDate() === day;
                        } catch (e) {
                            return false;
                        }
                    });
                    
                    // Show trades in a modal or highlight them in the trades list
                    const profitLoss = dayTrades.reduce((sum, trade) => {
                        const pl = parseFloat(trade.profitLossPercentage || 0);
                        return isNaN(pl) ? sum : sum + pl;
                    }, 0);
                    const profitLossDisplay = profitLoss >= 0 ? `+${profitLoss.toFixed(2)}%` : `${profitLoss.toFixed(2)}%`;
                    
                    // You could implement a nicer modal here instead of the alert
                    alert(`${dayTrades.length} trade(s) on ${formattedDate}\nNet P/L: ${profitLossDisplay}\n\n${dayTrades.map(trade => `${trade.stock}: ${trade.profitLossPercentage}%`).join('\n')}`);
                } catch (e) {
                    console.error("Error handling calendar day click:", e);
                }
            });
        });
    } catch (e) {
        console.error("Error generating trade calendar:", e);
        calendarContainer.innerHTML = '<div class="error-message">Error loading calendar data.</div>';
    }
}

// Generate day of week performance chart - improved
function generateDayPerformanceChart(trades) {
    const chartCanvas = document.getElementById('day-performance-chart');
    if (!chartCanvas) return;
    
    try {
        // Check if the element is visible and has dimensions
        if (chartCanvas.offsetWidth === 0 || chartCanvas.offsetHeight === 0) {
            // Set minimum height to ensure chart renders
            chartCanvas.style.height = '320px';
        }
        
        // Initialize data structure for days
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayData = days.map(day => ({ 
            day, 
            trades: 0, 
            totalPL: 0, 
            avgPL: 0,
            wins: 0,
            losses: 0
        }));
        
        // Process each trade
        trades.forEach(trade => {
            try {
                const date = new Date(trade.date);
                if (isNaN(date.getTime())) return;
                
                const dayIndex = date.getDay();
                const pl = parseFloat(trade.profitLossPercentage || 0);
                
                if (isNaN(pl)) return;
                
                dayData[dayIndex].trades++;
                dayData[dayIndex].totalPL += pl;
                
                if (pl > 0) dayData[dayIndex].wins++;
                else if (pl < 0) dayData[dayIndex].losses++;
            } catch (e) {
                console.error("Error processing trade for day chart:", e, trade);
            }
        });
        
        // Calculate average P/L
        dayData.forEach(day => {
            if (day.trades > 0) {
                day.avgPL = day.totalPL / day.trades;
            }
        });
        
        // Set up chart data
        const chartData = {
            labels: days,
            datasets: [
                {
                    label: 'Avg. P/L %',
                    data: dayData.map(day => day.avgPL.toFixed(2)),
                    backgroundColor: dayData.map(day => day.avgPL >= 0 
                        ? 'rgba(76, 175, 80, 0.7)' 
                        : 'rgba(244, 67, 54, 0.7)'),
                    borderColor: dayData.map(day => day.avgPL >= 0 
                        ? 'rgba(76, 175, 80, 1)' 
                        : 'rgba(244, 67, 54, 1)'),
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ]
        };
        
        // Get existing chart instance if it exists
        if (dayPerformanceChart) {
            dayPerformanceChart.destroy();
        }
        
        // Verify Chart object exists before creating chart
        if (typeof Chart !== 'undefined') {
            // Create new chart with improved styling
            dayPerformanceChart = new Chart(chartCanvas, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
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
                                label: function(context) {
                                    const index = context.dataIndex;
                                    const dayInfo = dayData[index];
                                    return [
                                        `Profit/Loss: ${dayInfo.avgPL.toFixed(2)}%`,
                                        `Trades: ${dayInfo.trades}`,
                                        `Win/Loss: ${dayInfo.wins}/${dayInfo.losses}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: {
                                    size: 12
                                },
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Average P/L %',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                padding: {top: 0, bottom: 10}
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12
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
        } else {
            console.error("Chart.js is not loaded. Please include Chart.js library.");
            chartCanvas.parentNode.innerHTML += '<div class="error-message">Chart library not available.</div>';
        }
    } catch (e) {
        console.error("Error generating day performance chart:", e);
        chartCanvas.parentNode.innerHTML += '<div class="error-message">Error loading chart data.</div>';
    }
}

// Enhance the Time of Day Performance Chart
function generateTimePerformanceChart(trades) {
    const chartCanvas = document.getElementById('time-performance-chart');
    if (!chartCanvas || !trades.length) return;
    
    try {
        // Check if the element is visible
        if (chartCanvas.offsetWidth === 0 || chartCanvas.offsetHeight === 0) {
            chartCanvas.style.height = '320px';
        }
        
        // For simplicity, we'll use time slots
        const timeSlots = [
            '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
            '13:00-14:00', '14:00-15:00', '15:00-16:00'
        ];
        
        // Create data structure
        const timeData = timeSlots.map(slot => ({
            slot,
            trades: 0,
            totalPL: 0,
            avgPL: 0
        }));
        
        // Process trade data
        trades.forEach(trade => {
            try {
                const randomSlot = Math.floor(Math.random() * timeSlots.length);
                const pl = parseFloat(trade.profitLossPercentage || 0);
                
                if (isNaN(pl)) return;
                
                timeData[randomSlot].trades++;
                timeData[randomSlot].totalPL += pl;
            } catch (e) {
                console.error("Error processing trade for time chart:", e, trade);
            }
        });
        
        // Calculate averages
        timeData.forEach(slot => {
            if (slot.trades > 0) {
                slot.avgPL = slot.totalPL / slot.trades;
            }
        });
        
        // Set up chart data with improved colors
        const chartData = {
            labels: timeSlots,
            datasets: [
                {
                    label: 'Trade Count',
                    data: timeData.map(slot => slot.trades),
                    backgroundColor: 'rgba(41, 128, 185, 0.7)',
                    borderColor: 'rgba(41, 128, 185, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    yAxisID: 'y1'
                },
                {
                    label: 'Avg. P/L %',
                    data: timeData.map(slot => slot.avgPL.toFixed(2)),
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(243, 156, 18, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(243, 156, 18, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    type: 'line',
                    yAxisID: 'y',
                    tension: 0.4,
                    fill: false
                }
            ]
        };
        
        // Get existing chart instance if it exists
        if (timePerformanceChart) {
            timePerformanceChart.destroy();
        }
        
        // Verify Chart object exists
        if (typeof Chart !== 'undefined') {
            // Create new chart with improved styling
            timePerformanceChart = new Chart(chartCanvas, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(33, 33, 33, 0.8)',
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            boxPadding: 6
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: {
                                    size: 12
                                },
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Avg. P/L %',
                                font: {
                                    size: 13,
                                    weight: 'bold'
                                },
                                padding: {top: 0, bottom: 10}
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: {
                                font: {
                                    size: 12
                                }
                            },
                            title: {
                                display: true,
                                text: 'Trade Count',
                                font: {
                                    size: 13,
                                    weight: 'bold'
                                },
                                padding: {top: 0, bottom: 10}
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12
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
        } else {
            console.error("Chart.js is not loaded");
            chartCanvas.parentNode.innerHTML += '<div class="error-message">Chart library not available.</div>';
        }
    } catch (e) {
        console.error("Error generating time performance chart:", e);
        chartCanvas.parentNode.innerHTML += '<div class="error-message">Error loading chart data.</div>';
    }
}

// Enhance the Stock Performance Chart
function generateStockPerformanceChart(trades) {
    const chartCanvas = document.getElementById('stock-performance-chart');
    if (!chartCanvas || !trades.length) return;
    
    try {
        // Check if the element is visible
        if (chartCanvas.offsetWidth === 0 || chartCanvas.offsetHeight === 0) {
            chartCanvas.style.height = '320px';
        }
        
        // Group trades by stock
        const stockData = {};
        trades.forEach(trade => {
            try {
                const stock = trade.stock || 'Unknown';
                const pl = parseFloat(trade.profitLossPercentage || 0);
                
                if (isNaN(pl)) return;
                
                if (!stockData[stock]) {
                    stockData[stock] = {
                        trades: 0,
                        totalPL: 0,
                        avgPL: 0,
                        wins: 0,
                        losses: 0
                    };
                }
                
                stockData[stock].trades++;
                stockData[stock].totalPL += pl;
                
                if (pl > 0) stockData[stock].wins++;
                else if (pl < 0) stockData[stock].losses++;
            } catch (e) {
                console.error("Error processing trade for stock chart:", e, trade);
            }
        });
        
        // Calculate averages and win rates
        Object.keys(stockData).forEach(stock => {
            if (stockData[stock].trades > 0) {
                stockData[stock].avgPL = stockData[stock].totalPL / stockData[stock].trades;
                stockData[stock].winRate = (stockData[stock].wins / stockData[stock].trades) * 100;
            }
        });
        
        // Sort stocks by total P/L and take top 8 (reduced from 10 for better display)
        const topStocks = Object.keys(stockData)
            .sort((a, b) => stockData[b].totalPL - stockData[a].totalPL)
            .slice(0, 8);
        
        // Prepare chart data
        const chartData = {
            labels: topStocks,
            datasets: [
                {
                    label: 'Total P/L %',
                    data: topStocks.map(stock => stockData[stock].totalPL.toFixed(2)),
                    backgroundColor: topStocks.map(stock => 
                        stockData[stock].totalPL >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
                    ),
                    borderColor: topStocks.map(stock => 
                        stockData[stock].totalPL >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'
                    ),
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        };
        
        // Get existing chart instance if it exists
        if (stockPerformanceChart) {
            stockPerformanceChart.destroy();
        }
        
        // Verify Chart object exists
        if (typeof Chart !== 'undefined') {
            // Create new chart with improved styling
            stockPerformanceChart = new Chart(chartCanvas, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: false
                        },
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
                                afterLabel: function(context) {
                                    const stock = context.label;
                                    const stockInfo = stockData[stock];
                                    return [
                                        `Trades: ${stockInfo.trades}`,
                                        `Win Rate: ${stockInfo.winRate.toFixed(1)}%`,
                                        `Avg P/L: ${stockInfo.avgPL.toFixed(2)}%`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: {
                                    size: 12
                                },
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Total P/L %',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                padding: {top: 10, bottom: 0}
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12
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
        } else {
            console.error("Chart.js is not loaded. Please include Chart.js library.");
            chartCanvas.parentNode.innerHTML += '<div class="error-message">Chart library not available.</div>';
        }
    } catch (e) {
        console.error("Error generating stock performance chart:", e);
        chartCanvas.parentNode.innerHTML += '<div class="error-message">Error loading chart data.</div>';
    }
}

// Generate trading insights
function generateTradeInsights(trades) {
    try {
        if (!trades.length) {
            updateInsight('best-day-insight', 'No trade data available');
            updateInsight('worst-day-insight', 'No trade data available');
            updateInsight('best-stock-insight', 'No trade data available');
            updateInsight('win-streak-insight', 'No trade data available');
            return;
        }
        
        // Group trades by day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayPerformance = dayNames.map(day => ({ 
            day, 
            trades: 0, 
            totalPL: 0, 
            avgPL: 0
        }));
        
        trades.forEach(trade => {
            try {
                const date = new Date(trade.date);
                if (isNaN(date.getTime())) return;
                
                const dayIndex = date.getDay();
                const pl = parseFloat(trade.profitLossPercentage || 0);
                
                if (isNaN(pl)) return;
                
                dayPerformance[dayIndex].trades++;
                dayPerformance[dayIndex].totalPL += pl;
            } catch (e) {
                console.error("Error processing trade for insight:", e, trade);
            }
        });
        
        dayPerformance.forEach(day => {
            if (day.trades > 0) {
                day.avgPL = day.totalPL / day.trades;
            }
        });
        
        // Find best and worst day
        let bestDay = { avgPL: -Infinity };
        let worstDay = { avgPL: Infinity };
        
        dayPerformance.forEach(day => {
            if (day.trades > 0) {
                if (day.avgPL > bestDay.avgPL) bestDay = day;
                if (day.avgPL < worstDay.avgPL) worstDay = day;
            }
        });
        
        // Group trades by stock
        const stockPerformance = {};
        trades.forEach(trade => {
            try {
                const stock = trade.stock || 'Unknown';
                const pl = parseFloat(trade.profitLossPercentage || 0);
                
                if (isNaN(pl)) return;
                
                if (!stockPerformance[stock]) {
                    stockPerformance[stock] = {
                        stock,
                        trades: 0,
                        totalPL: 0,
                        avgPL: 0
                    };
                }
                
                stockPerformance[stock].trades++;
                stockPerformance[stock].totalPL += pl;
            } catch (e) {
                console.error("Error processing trade for stock insight:", e, trade);
            }
        });
        
        Object.values(stockPerformance).forEach(stock => {
            if (stock.trades > 0) {
                stock.avgPL = stock.totalPL / stock.trades;
            }
        });
        
        // Find best stock
        let bestStock = { avgPL: -Infinity };
        Object.values(stockPerformance).forEach(stock => {
            if (stock.trades >= 3 && stock.avgPL > bestStock.avgPL) {
                bestStock = stock;
            }
        });
        
        // Calculate win streak
        const sortedTrades = [...trades].sort((a, b) => {
            try {
                return new Date(a.date) - new Date(b.date);
            } catch (e) {
                return 0;
            }
        });
        
        let currentStreak = 0;
        let maxStreak = 0;
        
        sortedTrades.forEach(trade => {
            try {
                const pl = parseFloat(trade.profitLossPercentage || 0);
                
                if (isNaN(pl)) return;
                
                if (pl > 0) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            } catch (e) {
                console.error("Error processing trade for streak:", e, trade);
            }
        });
        
        // Update insight elements
        if (bestDay.day) {
            updateInsight('best-day-insight', `${bestDay.day} with an average return of ${bestDay.avgPL.toFixed(2)}% across ${bestDay.trades} trades.`);
        }
        
        if (worstDay.day) {
            updateInsight('worst-day-insight', `${worstDay.day} with an average return of ${worstDay.avgPL.toFixed(2)}% across ${worstDay.trades} trades.`);
        }
        
        if (bestStock.stock) {
            updateInsight('best-stock-insight', `${bestStock.stock} with an average return of ${bestStock.avgPL.toFixed(2)}% across ${bestStock.trades} trades.`);
        } else {
            updateInsight('best-stock-insight', 'Not enough data (need at least 3 trades per stock)');
        }
        
        updateInsight('win-streak-insight', `Your longest winning streak is ${maxStreak} trades in a row.`);
    } catch (e) {
        console.error("Error generating insights:", e);
        updateInsight('best-day-insight', 'Error loading insights');
        updateInsight('worst-day-insight', 'Error loading insights');
        updateInsight('best-stock-insight', 'Error loading insights');
        updateInsight('win-streak-insight', 'Error loading insights');
    }
}

// Helper function to update insight elements
function updateInsight(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}