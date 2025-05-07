/**
 * Trading Journal - Report Generator
 * Provides functionality to generate and download performance reports in PDF format
 * Requires jspdf and chart.js libraries
 */

class ReportGenerator {
    constructor() {
        this.initEventListeners();
        this.tradeData = []; // Will be populated from localStorage or CSV
        
        // Default report settings
        this.reportSettings = {
            title: "Trading Performance Report",
            periods: {
                week: { label: "This Week", days: 7 },
                month: { label: "This Month", days: 30 },
                quarter: { label: "Last 3 Months", days: 90 },
                ytd: { label: "Year to Date", days: null }, // Special case handled in code
                year: { label: "Last Year", days: 365 },
                all: { label: "All Time", days: null }, // All data
                custom: { label: "Custom Range", days: null } // Uses date inputs
            },
            selectedPeriod: 'month',
            customStartDate: null,
            customEndDate: null,
            includeCharts: true,
            includeTrades: true,
            includeTagAnalysis: true
        };
        
        // Load PDF libraries on initialization
        this.loadJsPDF();
    }

    /**
     * Initialize event listeners for report-related UI elements
     */
    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Handle report period change
            const reportPeriodSelect = document.getElementById('report-period');
            if (reportPeriodSelect) {
                reportPeriodSelect.addEventListener('change', this.handlePeriodChange.bind(this));
            }

            // Handle report generation (button INSIDE the modal)
            const generateReportBtn = document.getElementById('download-report-btn');
            if (generateReportBtn) {
                // The listener for this is now correctly added at the end of the file
                // generateReportBtn.addEventListener('click', this.generatePDF.bind(this));
            }
            
            // Handle custom date range visibility
            const reportCustomDates = document.getElementById('report-custom-dates');
            const mainReportPeriodSelect = document.getElementById('report-period'); // Use the correct ID
            if (reportCustomDates && mainReportPeriodSelect) {
                mainReportPeriodSelect.addEventListener('change', (e) => {
                    console.log("Report period changed to:", e.target.value);
                    reportCustomDates.style.display = e.target.value === 'custom' ? 'block' : 'none';
                });
                // Initial check in case 'custom' is pre-selected
                reportCustomDates.style.display = mainReportPeriodSelect.value === 'custom' ? 'block' : 'none';
            }

            // Handle modal close buttons
            const reportModal = document.getElementById('report-modal');
            if (reportModal) {
                const closeBtns = reportModal.querySelectorAll('.close, .modal-close'); // Select both 'x' and 'Cancel' button
                closeBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        console.log("Closing report modal via button.");
                        reportModal.style.display = 'none';
                    });
                });

                // Close when clicking outside the modal content
                window.addEventListener('click', (e) => {
                    if (e.target === reportModal) {
                        console.log("Closing report modal via outside click.");
                        reportModal.style.display = 'none';
                    }
                });
            }
        });
    }

    /**
     * Show the report generation modal
     * This function might not be strictly needed if the external listener handles opening.
     * Kept for potential future use or direct calls.
     */
    showReportModal() {
        console.log("showReportModal called (potentially redundant)");
        const reportModal = document.getElementById('report-modal');
        if (reportModal) {
            reportModal.style.display = 'block';
            
            // Load trade data when modal opens
            this.loadTradeData();
            
            // Set default dates if needed (consider moving this to the opening listener)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            const startDateInput = document.getElementById('report-start-date');
            const endDateInput = document.getElementById('report-end-date');
            
            if (startDateInput && endDateInput) {
                if (!startDateInput.value) startDateInput.valueAsDate = startDate;
                if (!endDateInput.value) endDateInput.valueAsDate = endDate;
            }
        } else {
            console.error("Report modal element not found in showReportModal");
        }
    }

    /**
     * Handle report period dropdown change
     */
    handlePeriodChange(e) {
        this.reportSettings.selectedPeriod = e.target.value;
        const reportCustomDates = document.getElementById('report-custom-dates');
        
        if (reportCustomDates) {
            reportCustomDates.style.display = e.target.value === 'custom' ? 'block' : 'none';
        }
    }

    /**
     * Load trade data from localStorage or via CSV handler
     */
    loadTradeData() {
        // Try to get trades from localStorage
        const tradesJSON = localStorage.getItem('trades');
        if (tradesJSON) {
            try {
                this.tradeData = JSON.parse(tradesJSON);
                console.log(`Loaded ${this.tradeData.length} trades for reporting`);
                return;
            } catch (e) {
                console.error('Error parsing trade data from localStorage:', e);
            }
        }
        
        // If no trades in localStorage or error parsing, try getting from CSV handler if available
        if (window.csvHandler && typeof window.csvHandler.loadTrades === 'function') {
            window.csvHandler.loadTrades((trades) => {
                this.tradeData = trades;
                console.log(`Loaded ${this.tradeData.length} trades from CSV handler`);
            });
        } else {
            console.warn('No trade data available for reporting');
            this.tradeData = [];
        }
    }

    /**
     * Filter trades based on selected report period
     */
    getFilteredTrades() {
        if (!this.tradeData || this.tradeData.length === 0) {
            return [];
        }
        
        const now = new Date();
        let startDate = null;
        let endDate = now;
        
        // Determine date range based on selected period
        const period = this.reportSettings.selectedPeriod;
        
        if (period === 'custom') {
            // Get dates from inputs
            const startInput = document.getElementById('report-start-date');
            const endInput = document.getElementById('report-end-date');
            
            if (startInput && startInput.value) {
                startDate = new Date(startInput.value);
            }
            
            if (endInput && endInput.value) {
                endDate = new Date(endInput.value);
                // Set to end of day
                endDate.setHours(23, 59, 59, 999);
            }
        } else if (period === 'ytd') {
            // Year to date - Jan 1 of current year
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (period === 'all') {
            // No date filter
            startDate = null;
        } else if (this.reportSettings.periods[period]) {
            // Standard periods (week, month, quarter, year)
            const days = this.reportSettings.periods[period].days;
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
        }
        
        // Filter trades based on date range
        return this.tradeData.filter(trade => {
            const tradeDate = new Date(trade.date);
            return (!startDate || tradeDate >= startDate) && 
                   (!endDate || tradeDate <= endDate);
        });
    }

    /**
     * Calculate performance statistics based on filtered trades
     */
    calculateStats(filteredTrades) {
        if (!filteredTrades || filteredTrades.length === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                netProfit: 0,
                avgReturn: 0,
                profitFactor: 0,
                largestWin: 0,
                largestLoss: 0,
                avgWin: 0,
                avgLoss: 0,
                winningTrades: 0,
                losingTrades: 0
            };
        }

        let winningTrades = 0;
        let losingTrades = 0;
        let totalProfit = 0;
        let totalLoss = 0;
        let largestWin = 0;
        let largestLoss = 0;
        let totalReturn = 0;
        
        // Process each trade
        filteredTrades.forEach(trade => {
            const profit = parseFloat(trade.actualProfit) || 0;
            totalReturn += profit;
            
            if (profit > 0) {
                winningTrades++;
                totalProfit += profit;
                largestWin = Math.max(largestWin, profit);
            } else if (profit < 0) {
                losingTrades++;
                totalLoss += Math.abs(profit);
                largestLoss = Math.max(largestLoss, Math.abs(profit));
            }
        });
        
        // Calculate statistics
        const totalTrades = filteredTrades.length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const avgReturn = totalTrades > 0 ? totalReturn / totalTrades : 0;
        const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
        const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
        
        return {
            totalTrades,
            winRate,
            netProfit: totalProfit - totalLoss,
            avgReturn,
            profitFactor,
            largestWin,
            largestLoss,
            avgWin,
            avgLoss,
            winningTrades,
            losingTrades
        };
    }

    /**
     * Analyze performance by tags
     */
    analyzeTagPerformance(filteredTrades) {
        if (!filteredTrades || filteredTrades.length === 0) {
            return [];
        }
        
        // Collect all unique tags across trades
        const tagStats = {};
        
        filteredTrades.forEach(trade => {
            if (!trade.tags || !Array.isArray(trade.tags)) return;
            
            trade.tags.forEach(tag => {
                if (!tagStats[tag]) {
                    tagStats[tag] = {
                        name: tag,
                        trades: 0,
                        wins: 0,
                        losses: 0,
                        totalProfit: 0
                    };
                }
                
                const profit = parseFloat(trade.actualProfit) || 0;
                tagStats[tag].trades++;
                tagStats[tag].totalProfit += profit;
                
                if (profit > 0) {
                    tagStats[tag].wins++;
                } else if (profit < 0) {
                    tagStats[tag].losses++;
                }
            });
        });
        
        // Convert to array and calculate additional metrics
        return Object.values(tagStats).map(tag => {
            tag.winRate = tag.trades > 0 ? (tag.wins / tag.trades) * 100 : 0;
            tag.avgProfit = tag.trades > 0 ? tag.totalProfit / tag.trades : 0;
            return tag;
        }).sort((a, b) => b.totalProfit - a.totalProfit);
    }

    /**
     * Add performance chart to PDF if possible
     * Creates a temporary canvas to generate the chart.
     */
    async addChartToPDF(doc, filteredTrades) { // Added filteredTrades parameter
        if (!window.Chart || !filteredTrades || filteredTrades.length === 0) {
            console.log("Chart.js not loaded or no trades for chart.");
            return; // Cannot generate chart if Chart.js or data is missing
        }

        // Create a temporary off-screen canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 800; // Set desired width for chart resolution
        tempCanvas.height = 400; // Set desired height
        tempCanvas.style.display = 'none'; // Keep it hidden
        document.body.appendChild(tempCanvas); // Add to body temporarily
        const ctx = tempCanvas.getContext('2d');

        try {
            // Prepare data for a simple cumulative P/L chart
            const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
            let cumulativePL = 0;
            const chartLabels = [];
            const chartDataPoints = [];

            sortedTrades.forEach((trade, index) => {
                const profit = parseFloat(trade.actualProfit) || 0;
                cumulativePL += profit;
                // Add label for every N trades or specific dates if needed
                if (index === 0 || index === sortedTrades.length - 1 || (index + 1) % Math.max(1, Math.floor(sortedTrades.length / 10)) === 0) {
                     chartLabels.push(new Date(trade.date).toLocaleDateString());
                } else {
                    chartLabels.push(''); // Keep labels sparse
                }
                chartDataPoints.push(cumulativePL);
            });

            // Generate the chart on the temporary canvas
            const tempChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Cumulative P/L (₹)',
                        data: chartDataPoints,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: false, // Important for off-screen canvas
                    animation: {
                        duration: 0 // Disable animation for faster rendering to image
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Cumulative Profit/Loss Over Period'
                        },
                        legend: {
                            display: false
                        }
                    },
                     scales: {
                        y: {
                            title: { display: true, text: 'Cumulative P/L (₹)' }
                        },
                        x: {
                             title: { display: true, text: 'Trade Date (Approx.)' }
                        }
                    }
                }
            });

            // Wait for chart to render (slight delay might be needed)
            await new Promise(resolve => setTimeout(resolve, 500)); // Adjust delay if needed

            doc.addPage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("Performance Chart", 105, 20, { align: 'center' });

            // Convert chart to image data URL
            const imgData = tempCanvas.toDataURL('image/png');

            // Add chart image to PDF (adjust dimensions as needed)
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = 170; // Width in PDF (mm)
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            doc.addImage(imgData, 'PNG', 20, 30, pdfWidth, pdfHeight);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text("Cumulative profit/loss over the selected period.", 105, 35 + pdfHeight, { align: 'center' });

            // Destroy the temporary chart instance
            tempChart.destroy();

        } catch (e) {
            console.error('Error adding chart to PDF:', e);
            // Optionally add a note to the PDF that the chart failed
             doc.addPage();
             doc.setFont('helvetica', 'italic');
             doc.setFontSize(12);
             doc.text("Chart generation failed.", 20, 20);
        } finally {
            // Remove the temporary canvas from the DOM
            if (tempCanvas.parentNode) {
                tempCanvas.parentNode.removeChild(tempCanvas);
            }
        }
    }

    /**
     * Generate PDF report with filtered trade data
     */
    async generatePDF() { // Make this function async to await chart generation
        console.log("generatePDF called"); // Add log
        // Show loading indicator
        const downloadBtn = document.getElementById('download-report-btn');
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            downloadBtn.disabled = true;
        }

        try {
            // Ensure jsPDF library is available - this is critical
            if (!window.jspdf || !window.jspdf.jsPDF || 
                typeof window.jspdf.jsPDF.prototype.autoTable === 'undefined') {
                
                console.log("jsPDF or AutoTable not ready, attempting to load...");
                
                // Try to load the libraries
                await this.loadJsPDF();
                
                // Double check after loading attempt
                if (!window.jspdf || !window.jspdf.jsPDF || 
                    typeof window.jspdf.jsPDF.prototype.autoTable === 'undefined') {
                    
                    throw new Error("Failed to initialize PDF libraries after load attempt.");
                }
                
                console.log("jsPDF and AutoTable ready after dynamic load.");
            }

            // Get selected options from the modal
            const periodSelect = document.getElementById('report-period');
            const includeChartsCheckbox = document.getElementById('include-charts');
            const includeTradesCheckbox = document.getElementById('include-trades');
            const includeTagAnalysisCheckbox = document.getElementById('include-tag-analysis');

            // Set report settings
            this.reportSettings.selectedPeriod = periodSelect ? periodSelect.value : 'month';
            this.reportSettings.includeCharts = includeChartsCheckbox ? includeChartsCheckbox.checked : true;
            this.reportSettings.includeTrades = includeTradesCheckbox ? includeTradesCheckbox.checked : true;
            this.reportSettings.includeTagAnalysis = includeTagAnalysisCheckbox ? includeTagAnalysisCheckbox.checked : true;

            // Handle custom date range
            if (this.reportSettings.selectedPeriod === 'custom') {
                const startInput = document.getElementById('report-start-date');
                const endInput = document.getElementById('report-end-date');
                this.reportSettings.customStartDate = startInput ? startInput.value : null;
                this.reportSettings.customEndDate = endInput ? endInput.value : null;
                
                if (!this.reportSettings.customStartDate || !this.reportSettings.customEndDate) {
                    alert("Please select both start and end dates for the custom range.");
                    if (downloadBtn) {
                        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Generate Report';
                        downloadBtn.disabled = false;
                    }
                    return;
                }
            }

            // Load fresh data before generating
            this.loadTradeData();

            // Get filtered trades based on selected period
            const filteredTrades = this.getFilteredTrades();
            console.log(`Generating report for ${filteredTrades.length} trades.`);
            
            if (filteredTrades.length === 0) {
                alert("No trade data available for the selected period");
                if (downloadBtn) {
                    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Generate Report';
                    downloadBtn.disabled = false;
                }
                return;
            }

            // Create a new PDF document
            console.log("Creating jsPDF instance...");
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // ... (rest of the PDF generation logic remains largely the same) ...
            // Add title and date
            const now = new Date();
            const reportDate = now.toLocaleDateString();

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text(this.reportSettings.title, 105, 20, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`Generated on ${reportDate}`, 105, 28, { align: 'center' });

            // Add period info
            const periodLabel = this.reportSettings.periods[this.reportSettings.selectedPeriod]?.label || 'Custom Period';
            doc.text(`Period: ${periodLabel}`, 105, 35, { align: 'center' });

            if (this.reportSettings.selectedPeriod === 'custom') {
                doc.text(`Date Range: ${this.reportSettings.customStartDate} to ${this.reportSettings.customEndDate}`, 105, 42, { align: 'center' });
            }

            // Add separator line
            doc.setLineWidth(0.5);
            doc.line(20, 45, 190, 45);

            // Calculate and add statistics
            const stats = this.calculateStats(filteredTrades);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("Performance Summary", 20, 55);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);

            const formatPercent = (value) => `${value.toFixed(2)}%`;
            const formatCurrency = (value) => `₹${value.toFixed(2)}`; // Assuming INR

            // Create stats table
            const statsData = [
                ["Total Trades", stats.totalTrades.toString()],
                ["Win Rate", formatPercent(stats.winRate)],
                ["Net Profit", formatCurrency(stats.netProfit)],
                ["Avg Return / Trade", formatCurrency(stats.avgReturn)],
                ["Profit Factor", stats.profitFactor === Infinity ? 'Infinity' : stats.profitFactor.toFixed(2)],
                ["Winning Trades", stats.winningTrades.toString()],
                ["Losing Trades", stats.losingTrades.toString()],
                ["Avg Win", formatCurrency(stats.avgWin)],
                ["Avg Loss", formatCurrency(stats.avgLoss)],
                ["Largest Win", formatCurrency(stats.largestWin)],
                ["Largest Loss", formatCurrency(stats.largestLoss)]
            ];

            doc.autoTable({
                startY: 60,
                head: [],
                body: statsData,
                theme: 'grid',
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50 },
                    1: { halign: 'right', cellWidth: 'auto'}
                },
                 didParseCell: function (data) {
                    data.cell.styles.font = 'helvetica';
                    data.cell.styles.fontSize = 10;
                 },
                margin: { left: 20, right: 20 }
            });

            let currentY = doc.lastAutoTable.finalY + 10;

            // Add tag performance analysis if requested
            if (this.reportSettings.includeTagAnalysis) {
                const tagStats = this.analyzeTagPerformance(filteredTrades);
                if (tagStats.length > 0) {
                    if (currentY + 50 > doc.internal.pageSize.height) {
                         doc.addPage();
                         currentY = 20;
                    }

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(16);
                    doc.text("Performance by Tag", 20, currentY);
                    currentY += 7;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);

                    const tagTableData = tagStats.map(tag => [
                        tag.name,
                        tag.trades.toString(),
                        formatPercent(tag.winRate),
                        formatCurrency(tag.totalProfit),
                        formatCurrency(tag.avgProfit)
                    ]);

                    doc.autoTable({
                        startY: currentY,
                        head: [['Tag', 'Trades', 'Win Rate', 'Net P/L', 'Avg P/L']],
                        body: tagTableData,
                        theme: 'striped',
                        headStyles: {
                            fillColor: [90, 90, 90],
                            textColor: [255, 255, 255],
                            font: 'helvetica',
                            fontStyle: 'bold',
                            fontSize: 10
                        },
                         didParseCell: function (data) {
                            data.cell.styles.font = 'helvetica';
                            data.cell.styles.fontSize = 9;
                         },
                         columnStyles: {
                             0: { cellWidth: 'auto' },
                             1: { halign: 'right' },
                             2: { halign: 'right' },
                             3: { halign: 'right' },
                             4: { halign: 'right' }
                         },
                        margin: { left: 20, right: 20 }
                    });
                     currentY = doc.lastAutoTable.finalY + 10;
                }
            }

            // Add recent trades table if requested
            if (this.reportSettings.includeTrades) {
                 if (currentY + 60 > doc.internal.pageSize.height) {
                     doc.addPage();
                     currentY = 20;
                 }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text("Recent Trades", 20, currentY);
                 currentY += 7;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

                const sortedTradesForTable = [...filteredTrades].sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );
                const recentTrades = sortedTradesForTable.slice(0, 20);

                const tradeTableData = recentTrades.map(trade => [
                    new Date(trade.date).toLocaleDateString(),
                    trade.stock,
                    trade.tradeType,
                    formatCurrency(parseFloat(trade.actualProfit) || 0),
                    trade.tags ? trade.tags.join(', ') : ''
                ]);

                doc.autoTable({
                    startY: currentY,
                    head: [['Date', 'Symbol', 'Type', 'P/L', 'Tags']],
                    body: tradeTableData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [90, 90, 90],
                        textColor: [255, 255, 255],
                        font: 'helvetica',
                        fontStyle: 'bold',
                        fontSize: 10
                    },
                     didParseCell: function (data) {
                        data.cell.styles.font = 'helvetica';
                        data.cell.styles.fontSize = 9;
                     },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 30 },
                        2: { cellWidth: 20 },
                        3: { halign: 'right', cellWidth: 30 },
                        4: { cellWidth: 'auto' }
                    },
                    margin: { left: 20, right: 20 }
                });
                 currentY = doc.lastAutoTable.finalY + 10;
            }

            // Add charts if requested
            if (this.reportSettings.includeCharts) {
                 if (currentY + 120 > doc.internal.pageSize.height) {
                     doc.addPage();
                     currentY = 20;
                 }
                await this.addChartToPDF(doc, filteredTrades);
            }

            // Add footer with page numbers
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }

            // Save the PDF
            const periodText = this.reportSettings.selectedPeriod === 'custom' ? 'custom' : periodLabel.replace(/\s+/g, '_').toLowerCase();
            const fileName = `Trading_Report_${periodText}_${reportDate.replace(/\//g, '-')}.pdf`;

            doc.save(fileName);

            // Hide the modal after generating report
            const reportModal = document.getElementById('report-modal');
            if (reportModal) {
                reportModal.style.display = 'none';
            }

            // Show success notification
            if (window.showNotification) {
                window.showNotification('Report generated and downloaded successfully', 'success');
            }

        } catch (error) {
            console.error('Error generating PDF report:', error);
            alert("Error generating report: " + error.message + "\nCheck console for details.");
        } finally {
            // Reset button
            if (downloadBtn) {
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> Generate Report';
                downloadBtn.disabled = false;
            }
        }
    }

    /**
     * Load the jsPDF library dynamically if not already loaded
     * Returns a Promise that resolves when libraries are loaded.
     */
    loadJsPDF() {
        return new Promise((resolve, reject) => {
            try {
                // Check if both jspdf and autotable are loaded and attached
                if (window.jspdf && window.jspdf.jsPDF && typeof window.jspdf.jsPDF.prototype.autoTable !== 'undefined') {
                    console.log("jsPDF and AutoTable already loaded and attached.");
                    resolve();
                    return;
                }

                console.log('Loading jsPDF libraries using direct script tags...');

                // Show loading notification
                if (window.showNotification) {
                    window.showNotification('Loading PDF generation libraries...', 'info', 5000);
                }

                // Remove any existing script tags to ensure fresh load
                const existingJsPDF = document.querySelector('script[src*="jspdf.umd.min.js"]');
                const existingAutoTable = document.querySelector('script[src*="jspdf.plugin.autotable.min.js"]');
                
                if (existingJsPDF) {
                    existingJsPDF.parentNode.removeChild(existingJsPDF);
                    console.log("Removed existing jsPDF script tag");
                }
                
                if (existingAutoTable) {
                    existingAutoTable.parentNode.removeChild(existingAutoTable);
                    console.log("Removed existing AutoTable script tag");
                }

                // Create both script tags but don't add them to the DOM yet
                const jspdfScript = document.createElement('script');
                jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                jspdfScript.async = false; // Important: Load in order
                
                const autotableScript = document.createElement('script');
                autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
                autotableScript.async = false; // Important: Load in order

                // Set up error handling for jsPDF script
                jspdfScript.onerror = (e) => {
                    console.error(`Failed to load jsPDF script:`, e);
                    reject(new Error(`Failed to load jsPDF script`));
                };

                // Set up success handler for jsPDF
                jspdfScript.onload = () => {
                    console.log('jsPDF loaded successfully. Loading AutoTable plugin...');
                    
                    // Set up error handling for AutoTable script
                    autotableScript.onerror = (e) => {
                        console.error(`Failed to load AutoTable script:`, e);
                        reject(new Error(`Failed to load AutoTable script`));
                    };
                    
                    // Set up success handler for AutoTable
                    autotableScript.onload = () => {
                        console.log('AutoTable plugin loaded. Checking attachment...');
                        
                        // Give a little time for everything to initialize
                        setTimeout(() => {
                            try {
                                // Check if AutoTable got attached properly
                                if (window.jspdf && window.jspdf.jsPDF && 
                                    typeof window.jspdf.jsPDF.prototype.autoTable !== 'undefined') {
                                    console.log("Both libraries loaded successfully and AutoTable is attached.");
                                    resolve();
                                    return;
                                }
                                
                                // If we get here, we need to manually attach AutoTable
                                console.log("AutoTable not automatically attached. Attempting manual attachment...");
                                
                                if (window.jspdf && window.jspdf.jsPDF) {
                                    if (typeof window.autoTable === 'function') {
                                        console.log("Found window.autoTable function, manually attaching it...");
                                        window.jspdf.jsPDF.prototype.autoTable = window.autoTable;
                                        
                                        if (typeof window.jspdf.jsPDF.prototype.autoTable === 'function') {
                                            console.log("Manual attachment successful!");
                                            resolve();
                                            return;
                                        } else {
                                            console.error("Manual attachment failed: autoTable not a function after assignment");
                                        }
                                    } else {
                                        console.error("Could not find window.autoTable function to attach");
                                    }
                                } else {
                                    console.error("jsPDF not found after loading script");
                                }
                                
                                // Last resort - try to load directly from window globals
                                if (window.jsPDF && typeof window.jsPDF === 'function') {
                                    console.log("Found legacy window.jsPDF, using it as fallback...");
                                    window.jspdf = { jsPDF: window.jsPDF };
                                    
                                    if (typeof window.autoTable === 'function') {
                                        window.jspdf.jsPDF.prototype.autoTable = window.autoTable;
                                        console.log("Attached autoTable to legacy jsPDF");
                                        resolve();
                                        return;
                                    }
                                }
                                
                                reject(new Error("Failed to initialize PDF libraries correctly"));
                            } catch (err) {
                                console.error("Error during final library check:", err);
                                reject(err);
                            }
                        }, 200);
                    };
                    
                    // Now add AutoTable script to the document
                    document.head.appendChild(autotableScript);
                };
                
                // Add jsPDF script to the document to start loading
                document.head.appendChild(jspdfScript);
                
            } catch (error) {
                console.error('Error loading PDF libraries:', error);
                reject(error);
            }
        });
    }
}

// Ensure this runs after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed for report generator setup."); // Add log

    const reportModal = document.getElementById('report-modal');
    const openReportBtn = document.getElementById('generate-report-btn'); // Button to OPEN the modal
    // Corrected selector for the 'x' close button inside the modal
    const closeReportBtn = reportModal ? reportModal.querySelector('.modal-content > .close') : null;
    const cancelReportBtn = document.getElementById('cancel-report-btn'); // Assuming a 'Cancel' button exists with this ID
    const downloadReportBtn = document.getElementById('download-report-btn'); // Button INSIDE modal
    const periodSelect = document.getElementById('report-period');
    const customDateDiv = document.getElementById('report-custom-dates'); // Correct ID for the div

    // Initialize the report generator class/object
    // Ensure it's created before listeners that depend on it
    if (!window.reportGenerator) {
        console.log("Initializing ReportGenerator instance.");
        window.reportGenerator = new ReportGenerator();
    } else {
        console.log("ReportGenerator instance already exists.");
    }

    // --- Functionality to OPEN the modal ---
    if (openReportBtn && reportModal) {
        openReportBtn.addEventListener('click', () => {
            console.log("Generate Report button clicked, attempting to open modal...");
            reportModal.style.display = 'block';
            // Pre-fill dates or reset options
            if (periodSelect) {
                 periodSelect.value = window.reportGenerator.reportSettings.selectedPeriod || 'month'; // Use default or last setting
                 // Trigger change event to ensure custom dates visibility is correct
                 periodSelect.dispatchEvent(new Event('change'));
            }
            // Set default custom dates if not already set
            const startDateInput = document.getElementById('report-start-date');
            const endDateInput = document.getElementById('report-end-date');
            if (startDateInput && !startDateInput.value) {
                const defaultStart = new Date();
                defaultStart.setDate(defaultStart.getDate() - 30);
                startDateInput.valueAsDate = defaultStart;
            }
            if (endDateInput && !endDateInput.value) {
                endDateInput.valueAsDate = new Date();
            }

             // Reset button state in case it was left loading
             if (downloadReportBtn) {
                 downloadReportBtn.innerHTML = '<i class="fas fa-download"></i> Generate Report';
                 downloadReportBtn.disabled = false;
             }
             // Ensure PDF libs are loaded (or start loading)
             window.reportGenerator.loadJsPDF().catch(err => console.error("Error pre-loading PDF libs on modal open:", err));
        });
    } else {
        if (!openReportBtn) console.error("Button with ID 'generate-report-btn' not found.");
        if (!reportModal) console.error("Modal with ID 'report-modal' not found.");
    }

    // --- Functionality to CLOSE the modal (using the 'x' or 'Cancel' button) ---
    const closeButtons = reportModal ? reportModal.querySelectorAll('.close, .modal-close') : [];
    if (closeButtons.length > 0) {
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log("Close/Cancel button clicked, closing modal.");
                reportModal.style.display = 'none';
            });
        });
    } else {
        console.warn("Could not find close buttons (.close, .modal-close) inside the report modal.");
    }

    // --- Functionality to CLOSE the modal if clicking outside of it ---
    if (reportModal) {
        window.addEventListener('click', (event) => {
            if (event.target == reportModal) { // Check if the click is directly on the modal background
                console.log("Clicked outside modal content, closing modal.");
                reportModal.style.display = 'none';
            }
        });
    }

    // --- Handle period select change to show/hide custom dates ---
    // This listener is now correctly inside initEventListeners, called by the instance.
    // if (periodSelect && customDateDiv) { ... } // Removed redundant listener here

    // --- Attach the PDF generation logic to the button INSIDE the modal ---
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', () => {
            console.log("Download Report button clicked."); // Add log
            if (window.reportGenerator && typeof window.reportGenerator.generatePDF === 'function') {
                 window.reportGenerator.generatePDF(); // Call the instance method
            } else {
                console.error("window.reportGenerator or its generatePDF method is not available.");
                alert("Error: Report generation function is not ready.");
            }
        });
    } else {
         console.error("Button with ID 'download-report-btn' not found inside the modal.");
    }

}); // End of DOMContentLoaded

// // Initialize the report generator - MOVED inside DOMContentLoaded to ensure elements exist
// const reportGenerator = new ReportGenerator();
// // Make it available globally
// window.reportGenerator = reportGenerator;