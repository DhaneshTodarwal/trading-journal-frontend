/**
 * Market Heat Map Implementation
 * Provides a visual representation of market sectors/stocks performance
 * Can use Yahoo Finance API data or fall back to mock data
 */

class MarketHeatMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.marketData = [];
        this.sectors = [];
        this.colorScale = ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'];
        this.initialized = false;
        
        // Check if Yahoo Finance API is available
        this.useYahooFinance = window.yahooFinanceAPI && window.yahooFinanceAPI.isAPIAvailable();
        
        // Cache data in localStorage
        this.localStorageKey = 'marketHeatmapData';
    }

    /**
     * Initialize the heat map
     */
    async init() {
        if (!this.container) {
            console.error(`Container with id ${this.containerId} not found`);
            return;
        }

        // Create the heat map structure
        this.createHeatMapStructure();
        
        try {
            // Show loading state
            this.showLoading();
            
            // Load market data
            await this.loadMarketData();
            
            // Render the heat map
            this.renderHeatMap();
            
            // Hide loading state
            this.hideLoading();
            
            // Add event listeners
            this.addEventListeners();
            
            // Set up automatic updates if using Yahoo Finance
            if (this.useYahooFinance) {
                this.setupAutomaticUpdates();
            }
            
            // Update the data source indicator
            this.updateDataSourceIndicator();
            
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing market heatmap:', error);
            this.showError('Failed to initialize market heatmap. Please try again later.');
        }
    }

    /**
     * Create the heat map structure
     */
    createHeatMapStructure() {
        // Create header
        const header = document.createElement('div');
        header.className = 'heatmap-header';
        header.innerHTML = `
            <h3><i class="fas fa-fire-alt"></i> Market Heat Map</h3>
            <div class="heatmap-controls">
                <select id="heatmap-view-selector">
                    <option value="sectors">Sectors</option>
                    <option value="nifty50">Nifty 50</option>
                    <option value="nifty100">Nifty 100</option>
                </select>
                <select id="heatmap-timeframe-selector">
                    <option value="1d">Today</option>
                    <option value="5d">5 Days</option>
                    <option value="1mo">1 Month</option>
                </select>
                <button id="refresh-heatmap" class="btn-icon" title="Refresh data">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        `;
        this.container.appendChild(header);

        // Create heat map content
        const content = document.createElement('div');
        content.className = 'heatmap-content';
        content.innerHTML = `
            <div class="heatmap-legend">
                <div class="legend-title">Change %</div>
                <div class="legend-scale">
                    <div class="legend-color" style="background-color: #d73027"></div>
                    <div class="legend-color" style="background-color: #f46d43"></div>
                    <div class="legend-color" style="background-color: #fdae61"></div>
                    <div class="legend-color" style="background-color: #fee08b"></div>
                    <div class="legend-color" style="background-color: #d9ef8b"></div>
                    <div class="legend-color" style="background-color: #a6d96a"></div>
                    <div class="legend-color" style="background-color: #66bd63"></div>
                    <div class="legend-color" style="background-color: #1a9850"></div>
                </div>
                <div class="legend-labels">
                    <span>-3%+</span>
                    <span>-2%</span>
                    <span>-1%</span>
                    <span>0%</span>
                    <span>+1%</span>
                    <span>+2%</span>
                    <span>+3%+</span>
                </div>
            </div>
            <div class="heatmap-visualization" id="heatmap-visualization">
                <div class="heatmap-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading market data...</p>
                </div>
            </div>
            <div class="heatmap-footer">
                <span class="heatmap-timestamp">Last updated: --:--:--</span>
                <span class="heatmap-source">Data: Mock Data</span>
            </div>
        `;
        this.container.appendChild(content);
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const visualization = document.getElementById('heatmap-visualization');
        if (visualization) {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'heatmap-loading';
            loadingElement.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading market data...</p>
            `;
            visualization.innerHTML = '';
            visualization.appendChild(loadingElement);
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingElement = document.querySelector('.heatmap-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Load market data from API or static source
     */
    async loadMarketData() {
        try {
            // Check if we should use Yahoo Finance API
            if (this.useYahooFinance) {
                await this.loadYahooFinanceData();
            } else {
                // Use mock data
                this.marketData = this.getMockData();
            }
            
            // Extract sectors
            this.sectors = [...new Set(this.marketData.map(item => item.sector))];
            
            // Update timestamp display
            this.updateTimestampDisplay();
        } catch (error) {
            console.error('Error loading market data:', error);
            
            // Fall back to mock data if API fails
            this.marketData = this.getMockData();
            this.sectors = [...new Set(this.marketData.map(item => item.sector))];
            
            // Update data source to indicate we're using mock data
            this.useYahooFinance = false;
            this.updateDataSourceIndicator();
        }
    }
    
    /**
     * Load data from Yahoo Finance API
     */
    async loadYahooFinanceData() {
        try {
            // Check if we have cached data
            const cachedData = this.getLocalStorageData();
            const today = new Date().toLocaleDateString('en-IN');
            const isMarketClosed = window.yahooFinanceAPI.checkMarketStatus();
            
            // Use cached data if it's from today and market is closed
            if (cachedData && cachedData.date === today && 
                (isMarketClosed || (cachedData.isMarketClosed === true))) {
                console.log('Using cached market data from today');
                this.marketData = cachedData.data;
            } else {
                // Fetch new data
                const timeframe = document.getElementById('heatmap-timeframe-selector')?.value || '1d';
                const symbols = window.yahooFinanceAPI.getNifty100Symbols();
                
                const apiData = await window.yahooFinanceAPI.fetchMarketData(symbols, timeframe);
                
                if (apiData && apiData.length > 0) {
                    this.marketData = apiData;
                    
                    // Save to local storage
                    this.saveToLocalStorage(this.marketData, isMarketClosed);
                } else {
                    throw new Error('Failed to fetch data from Yahoo Finance');
                }
            }
        } catch (error) {
            console.error('Error loading Yahoo Finance data:', error);
            throw error; // Let the calling function handle the error
        }
    }
    
    /**
     * Local storage helpers
     */
    getLocalStorageData() {
        try {
            const data = localStorage.getItem(this.localStorageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    }
    
    saveToLocalStorage(data, isMarketClosed) {
        try {
            const storageObject = {
                date: new Date().toLocaleDateString('en-IN'),
                timestamp: new Date().toISOString(),
                isMarketClosed: isMarketClosed,
                data: data
            };
            localStorage.setItem(this.localStorageKey, JSON.stringify(storageObject));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }
    
    /**
     * Update timestamp display
     */
    updateTimestampDisplay() {
        const timestampEl = this.container.querySelector('.heatmap-timestamp');
        if (timestampEl) {
            const now = new Date();
            timestampEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
            
            // Add market status if using Yahoo Finance
            if (this.useYahooFinance) {
                const isMarketClosed = window.yahooFinanceAPI.checkMarketStatus();
                timestampEl.textContent += ` • Market: ${isMarketClosed ? 'Closed' : 'Open'}`;
            }
        }
    }
    
    /**
     * Update data source indicator
     */
    updateDataSourceIndicator() {
        const sourceEl = this.container.querySelector('.heatmap-source');
        if (sourceEl) {
            sourceEl.textContent = `Data: ${this.useYahooFinance ? 'Yahoo Finance' : 'Mock Data'}`;
        }
    }
    
    /**
     * Set up automatic updates
     */
    setupAutomaticUpdates() {
        // Check for market close every 5 minutes
        setInterval(async () => {
            const wasMarketClosedBefore = this.getLocalStorageData()?.isMarketClosed;
            const isMarketClosedNow = window.yahooFinanceAPI.checkMarketStatus();
            
            // If market just closed, update data
            if (!wasMarketClosedBefore && isMarketClosedNow) {
                console.log('Market just closed, updating data...');
                await this.loadMarketData();
                this.renderHeatMap();
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    /**
     * Render the heat map based on current data
     */
    renderHeatMap() {
        const visualization = document.getElementById('heatmap-visualization');
        visualization.innerHTML = ''; // Clear previous content
        
        const viewSelector = document.getElementById('heatmap-view-selector');
        const currentView = viewSelector.value;
        
        if (currentView === 'sectors') {
            this.renderSectorsView(visualization);
        } else {
            this.renderStocksView(visualization, currentView);
        }
    }

    /**
     * Render sectors view
     */
    renderSectorsView(container) {
        const sectorData = {};
        
        // Calculate average performance for each sector
        this.sectors.forEach(sector => {
            const sectorStocks = this.marketData.filter(item => item.sector === sector);
            const avgChange = sectorStocks.reduce((acc, stock) => acc + stock.percentChange, 0) / sectorStocks.length;
            sectorData[sector] = {
                name: sector,
                percentChange: avgChange,
                marketCap: sectorStocks.reduce((acc, stock) => acc + stock.marketCap, 0)
            };
        });
        
        // Convert to array and sort by market cap
        const sectorsArray = Object.values(sectorData).sort((a, b) => b.marketCap - a.marketCap);
        
        // Create sector tiles
        sectorsArray.forEach(sector => {
            const tile = this.createTile(sector.name, sector.percentChange, 'sector');
            container.appendChild(tile);
        });
    }

    /**
     * Render stocks view
     */
    renderStocksView(container, view) {
        // Filter stocks based on view (nifty50 or nifty100)
        let stocks = [];
        if (view === 'nifty50') {
            stocks = this.marketData.filter(stock => stock.index === 'NIFTY50');
        } else if (view === 'nifty100') {
            stocks = this.marketData.filter(stock => stock.index === 'NIFTY100' || stock.index === 'NIFTY50');
        }
        
        // Sort by market cap
        stocks.sort((a, b) => b.marketCap - a.marketCap);
        
        // Create stock tiles
        stocks.forEach(stock => {
            const tile = this.createTile(stock.symbol, stock.percentChange, 'stock', stock);
            container.appendChild(tile);
        });
    }

    /**
     * Create a heatmap tile element
     */
    createTile(name, percentChange, type, data = null) {
        const tile = document.createElement('div');
        tile.className = `heatmap-tile ${type}-tile`;
        
        // Determine color based on percent change
        const color = this.getColorForPercentage(percentChange);
        tile.style.backgroundColor = color;
        
        // Create content
        tile.innerHTML = `
            <div class="tile-name">${name}</div>
            <div class="tile-value ${percentChange >= 0 ? 'positive' : 'negative'}">${percentChange.toFixed(2)}%</div>
        `;
        
        // Add data attributes for tooltips
        if (data) {
            tile.setAttribute('data-symbol', data.symbol);
            tile.setAttribute('data-sector', data.sector);
            tile.setAttribute('data-price', data.price);
            tile.setAttribute('data-change', data.percentChange);
        }
        
        // Add event listener for tile click
        tile.addEventListener('click', () => this.handleTileClick(tile, data || { name, percentChange, type }));
        
        return tile;
    }

    /**
     * Handle tile click event
     */
    handleTileClick(tile, data) {
        // Show detailed information for the clicked tile
        if (data.type === 'sector') {
            // Filter stocks by sector and display them
            const sectorStocks = this.marketData.filter(stock => stock.sector === data.name);
            this.showSectorDetails(data.name, sectorStocks);
        } else {
            // Show stock details popup
            this.showStockDetails(data);
        }
    }

    /**
     * Show sector details
     */
    showSectorDetails(sectorName, stocks) {
        console.log(`Showing details for sector: ${sectorName}`, stocks);
        // Implementation for showing sector details would go here
    }

    /**
     * Show stock details
     */
    showStockDetails(stock) {
        console.log(`Showing details for stock: ${stock.symbol}`, stock);
        // Implementation for showing stock details would go here
    }

    /**
     * Get color based on percentage change
     */
    getColorForPercentage(percentage) {
        // Map percentage change to color
        if (percentage <= -3) return this.colorScale[0];
        if (percentage <= -2) return this.colorScale[1];
        if (percentage <= -1) return this.colorScale[2];
        if (percentage < 0) return this.colorScale[3];
        if (percentage === 0) return '#EEEEEE';
        if (percentage < 1) return this.colorScale[4];
        if (percentage < 2) return this.colorScale[5];
        if (percentage < 3) return this.colorScale[6];
        return this.colorScale[7];
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // View selector change event
        const viewSelector = document.getElementById('heatmap-view-selector');
        viewSelector.addEventListener('change', () => this.renderHeatMap());
        
        // Timeframe selector change event
        const timeframeSelector = document.getElementById('heatmap-timeframe-selector');
        timeframeSelector.addEventListener('change', async () => {
            await this.loadMarketData();
            this.renderHeatMap();
        });
        
        // Refresh button click event
        const refreshButton = document.getElementById('refresh-heatmap');
        refreshButton.addEventListener('click', async () => {
            refreshButton.classList.add('rotating');
            await this.loadMarketData();
            this.renderHeatMap();
            setTimeout(() => refreshButton.classList.remove('rotating'), 1000);
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const visualization = document.getElementById('heatmap-visualization');
        visualization.innerHTML = `
            <div class="heatmap-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Get mock market data for demonstration
     */
    getMockData() {
        return [
            { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', price: 2456.75, previousClose: 2422.30, percentChange: 1.42, marketCap: 1662000, index: 'NIFTY50' },
            { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', price: 3421.50, previousClose: 3456.80, percentChange: -1.02, marketCap: 1254000, index: 'NIFTY50' },
            { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Financial Services', price: 1678.25, previousClose: 1665.40, percentChange: 0.77, marketCap: 1152000, index: 'NIFTY50' },
            { symbol: 'INFY', name: 'Infosys', sector: 'IT', price: 1432.60, previousClose: 1450.20, percentChange: -1.21, marketCap: 602000, index: 'NIFTY50' },
            { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', price: 2568.30, previousClose: 2534.90, percentChange: 1.32, marketCap: 602000, index: 'NIFTY50' },
            { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Financial Services', price: 942.75, previousClose: 930.50, percentChange: 1.32, marketCap: 656000, index: 'NIFTY50' },
            { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Financial Services', price: 1763.25, previousClose: 1782.40, percentChange: -1.07, marketCap: 350000, index: 'NIFTY50' },
            { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Construction', price: 2145.60, previousClose: 2110.30, percentChange: 1.67, marketCap: 301000, index: 'NIFTY50' },
            { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Financial Services', price: 962.45, previousClose: 970.20, percentChange: -0.80, marketCap: 296000, index: 'NIFTY50' },
            { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financial Services', price: 6320.50, previousClose: 6280.75, percentChange: 0.63, marketCap: 382000, index: 'NIFTY50' },
            { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services', price: 568.70, previousClose: 560.30, percentChange: 1.50, marketCap: 507000, index: 'NIFTY50' },
            { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer Durables', price: 2765.30, previousClose: 2730.60, percentChange: 1.27, marketCap: 245000, index: 'NIFTY50' },
            { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer Durables', price: 3120.45, previousClose: 3180.25, percentChange: -1.88, marketCap: 299000, index: 'NIFTY50' },
            { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Financial Services', price: 1543.25, previousClose: 1520.40, percentChange: 1.50, marketCap: 245000, index: 'NIFTY50' },
            { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Automobile', price: 9768.55, previousClose: 9650.30, percentChange: 1.23, marketCap: 295000, index: 'NIFTY50' },
            { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Healthcare', price: 1023.60, previousClose: 1045.70, percentChange: -2.11, marketCap: 245000, index: 'NIFTY50' },
            { symbol: 'ITC', name: 'ITC', sector: 'FMCG', price: 434.50, previousClose: 428.90, percentChange: 1.31, marketCap: 541000, index: 'NIFTY50' },
            { symbol: 'WIPRO', name: 'Wipro', sector: 'IT', price: 401.25, previousClose: 410.60, percentChange: -2.28, marketCap: 220000, index: 'NIFTY50' },
            { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', price: 1145.70, previousClose: 1167.30, percentChange: -1.85, marketCap: 310000, index: 'NIFTY50' },
            { symbol: 'ADANIPORTS', name: 'Adani Ports', sector: 'Infrastructure', price: 789.45, previousClose: 775.20, percentChange: 1.84, marketCap: 170000, index: 'NIFTY50' },
            { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Construction', price: 8235.60, previousClose: 8145.30, percentChange: 1.11, marketCap: 237000, index: 'NIFTY50' },
            { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', price: 1210.35, previousClose: 1235.70, percentChange: -2.05, marketCap: 118000, index: 'NIFTY50' },
            { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', price: 22543.25, previousClose: 22340.60, percentChange: 0.91, marketCap: 217000, index: 'NIFTY50' },
            { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals', price: 128.75, previousClose: 131.90, percentChange: -2.39, marketCap: 157000, index: 'NIFTY50' },
            { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Financial Services', price: 1345.30, previousClose: 1328.70, percentChange: 1.25, marketCap: 104000, index: 'NIFTY50' },
            { symbol: 'NTPC', name: 'NTPC', sector: 'Energy', price: 240.65, previousClose: 236.80, percentChange: 1.63, marketCap: 233000, index: 'NIFTY50' },
            { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', price: 1563.25, previousClose: 1540.60, percentChange: 1.47, marketCap: 194000, index: 'NIFTY50' },
            { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Energy', price: 243.45, previousClose: 240.30, percentChange: 1.31, marketCap: 227000, index: 'NIFTY50' },
            { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', price: 678.30, previousClose: 685.90, percentChange: -1.11, marketCap: 260000, index: 'NIFTY50' },
            { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals', price: 765.20, previousClose: 781.40, percentChange: -2.07, marketCap: 183000, index: 'NIFTY50' },
            
            // Adding the remaining 20 Nifty 50 stocks
            { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', price: 945.30, previousClose: 930.50, percentChange: 1.59, marketCap: 527000, index: 'NIFTY50' },
            { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation', sector: 'Energy', price: 210.45, previousClose: 206.90, percentChange: 1.72, marketCap: 264000, index: 'NIFTY50' },
            { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Cement', price: 1890.75, previousClose: 1860.20, percentChange: 1.64, marketCap: 124000, index: 'NIFTY50' },
            { symbol: 'CIPLA', name: 'Cipla', sector: 'Healthcare', price: 1145.60, previousClose: 1130.40, percentChange: 1.34, marketCap: 92500, index: 'NIFTY50' },
            { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', sector: 'Healthcare', price: 5231.45, previousClose: 5180.30, percentChange: 0.99, marketCap: 87000, index: 'NIFTY50' },
            { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Automobile', price: 7123.50, previousClose: 7045.75, percentChange: 1.10, marketCap: 206000, index: 'NIFTY50' },
            { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Insurance', price: 645.25, previousClose: 655.40, percentChange: -1.55, marketCap: 138000, index: 'NIFTY50' },
            { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories', sector: 'Healthcare', price: 3567.80, previousClose: 3520.60, percentChange: 1.34, marketCap: 94700, index: 'NIFTY50' },
            { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', price: 5245.30, previousClose: 5190.75, percentChange: 1.05, marketCap: 75300, index: 'NIFTY50' },
            { symbol: 'COALINDIA', name: 'Coal India', sector: 'Energy', price: 326.45, previousClose: 320.80, percentChange: 1.76, marketCap: 201000, index: 'NIFTY50' },
            { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Insurance', price: 1423.60, previousClose: 1408.90, percentChange: 1.04, marketCap: 142500, index: 'NIFTY50' },
            { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Automobile', price: 3756.20, previousClose: 3720.50, percentChange: 0.96, marketCap: 102700, index: 'NIFTY50' },
            { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG', price: 4756.35, previousClose: 4690.20, percentChange: 1.41, marketCap: 114500, index: 'NIFTY50' },
            { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Automobile', price: 3145.70, previousClose: 3120.40, percentChange: 0.81, marketCap: 62900, index: 'NIFTY50' },
            { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', price: 512.45, previousClose: 523.80, percentChange: -2.17, marketCap: 114800, index: 'NIFTY50' },
            { symbol: 'ADANIGREEN', name: 'Adani Green Energy', sector: 'Energy', price: 1456.30, previousClose: 1420.75, percentChange: 2.50, marketCap: 230500, index: 'NIFTY50' },
            { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Energy', price: 456.75, previousClose: 450.30, percentChange: 1.43, marketCap: 99000, index: 'NIFTY50' },
            { symbol: 'SHREECEM', name: 'Shree Cement', sector: 'Cement', price: 25436.50, previousClose: 25120.80, percentChange: 1.26, marketCap: 91800, index: 'NIFTY50' },
            { symbol: 'UPL', name: 'UPL Limited', sector: 'Chemicals', price: 623.45, previousClose: 640.70, percentChange: -2.69, marketCap: 46900, index: 'NIFTY50' },
            { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG', price: 945.60, previousClose: 930.30, percentChange: 1.64, marketCap: 87600, index: 'NIFTY50' },
            
            // Additional stocks for Nifty 100
            { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Infrastructure', price: 2435.60, previousClose: 2390.30, percentChange: 1.89, marketCap: 277000, index: 'NIFTY100' },
            { symbol: 'DMART', name: 'Avenue Supermarts', sector: 'Retail', price: 3645.70, previousClose: 3690.20, percentChange: -1.21, marketCap: 236000, index: 'NIFTY100' },
            { symbol: 'PIIND', name: 'PI Industries', sector: 'Chemicals', price: 3267.50, previousClose: 3230.80, percentChange: 1.14, marketCap: 49000, index: 'NIFTY100' },
            // ... more Nifty 100 stocks would be here
        ];
    }
}

// Initialize the heat map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a page where the heat map should be displayed
    const heatmapContainer = document.getElementById('market-heatmap-container');
    if (heatmapContainer) {
        const heatmap = new MarketHeatMap('market-heatmap-container');
        heatmap.init();
    }
});