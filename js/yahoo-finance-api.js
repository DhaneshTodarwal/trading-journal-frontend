/**
 * Yahoo Finance API Integration
 * 
 * This module provides functionality to fetch market data from Yahoo Finance.
 * It is designed to be easily removable if needed in the future.
 */

(function() {
    'use strict';
    
    // Namespace for Yahoo Finance API
    window.yahooFinanceAPI = window.yahooFinanceAPI || {};
    
    // API configurations
    const config = {
        baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart/',
        corsProxyUrl: 'https://api.allorigins.win/raw?url=', // Switched to allorigins proxy
        useCorsProxy: true,                                // Re-enabled CORS proxy
        endpoints: {
            chart: '/chart',
            quote: '/quote',
        },
        cacheExpiry: 15 * 60 * 1000,  // 15 minutes in milliseconds
        marketHours: {
            open: {
                hour: 9,
                minute: 15
            },
            close: {
                hour: 15,
                minute: 30
            },
            timezone: 'Asia/Kolkata', // IST for Indian markets
            weekdays: [1, 2, 3, 4, 5] // Monday to Friday
        },
        apiKeys: {}  // Reserved for future use if Yahoo starts requiring API keys
    };

    // Nifty 50 symbols
    const nifty50Symbols = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS", 
        "ICICIBANK.NS", "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS", "BAJFINANCE.NS", 
        "SBIN.NS", "TITAN.NS", "ASIANPAINT.NS", "BAJAJFINSV.NS", "MARUTI.NS", 
        "SUNPHARMA.NS", "ITC.NS", "WIPRO.NS", "HCLTECH.NS", "ADANIPORTS.NS", 
        "ULTRACEMCO.NS", "TECHM.NS", "NESTLEIND.NS", "TATASTEEL.NS", "INDUSINDBK.NS", 
        "NTPC.NS", "M&M.NS", "POWERGRID.NS", "TATAMOTORS.NS", "JSWSTEEL.NS", 
        "BHARTIARTL.NS", "ONGC.NS", "GRASIM.NS", "CIPLA.NS", "DRREDDY.NS", 
        "BAJAJ-AUTO.NS", "HDFCLIFE.NS", "DIVISLAB.NS", "APOLLOHOSP.NS", "COALINDIA.NS", 
        "SBILIFE.NS", "EICHERMOT.NS", "BRITANNIA.NS", "HEROMOTOCO.NS", "HINDALCO.NS", 
        "ADANIGREEN.NS", "BPCL.NS", "SHREECEM.NS", "UPL.NS", "TATACONSUM.NS"
    ];
    
    // Nifty Next 50 symbols (to combine with Nifty50 for Nifty100)
    const niftyNext50Symbols = [
        "ADANIENT.NS", "DMART.NS", "PIIND.NS", "INDUSTOWER.NS", "HAVELLS.NS", 
        "GODREJCP.NS", "DABUR.NS", "MARICO.NS", "ICICIPRULI.NS", "COLPAL.NS", 
        "ADANITRANS.NS", "BANKBARODA.NS", "DLF.NS", "LUPIN.NS", "GAIL.NS", 
        "VEDL.NS", "NAUKRI.NS", "SIEMENS.NS", "TORNTPHARM.NS", "MUTHOOTFIN.NS", 
        "PGHH.NS", "BIOCON.NS", "PIDILITIND.NS", "BOSCHLTD.NS", "AMBUJACEM.NS", 
        "INDIGO.NS", "MCDOWELL-N.NS", "CADILAHC.NS", "ACC.NS", "ICICIGI.NS", 
        "BERGEPAINT.NS", "MOTHERSON.NS", "BANDHANBNK.NS", "OFSS.NS", "PEL.NS", 
        "ABBOTINDIA.NS", "PAGEIND.NS", "GLAND.NS", "NMDC.NS", "PETRONET.NS", 
        "AUROPHARMA.NS", "CHOLAFIN.NS", "SAIL.NS", "JINDALSTEL.NS", "CONCOR.NS", 
        "YESBANK.NS", "IDEA.NS", "HAL.NS", "BEL.NS", "PNB.NS"
    ];
    
    // Sectoral mapping for Indian stocks
    const sectorMapping = {
        "RELIANCE.NS": "Energy",
        "TCS.NS": "IT",
        "HDFCBANK.NS": "Financial Services",
        // ... additional mappings would go here
    };
    
    /**
     * Check if Yahoo Finance API is available
     * @returns {boolean} True if API is available
     */
    window.yahooFinanceAPI.isAPIAvailable = function() {
        // Simple check to see if we're online
        return navigator.onLine;
    };
    
    /**
     * Get Nifty 50 symbols
     * @returns {Array} Array of Nifty 50 symbols
     */
    window.yahooFinanceAPI.getNifty50Symbols = function() {
        return [...nifty50Symbols]; // Return a copy to prevent modification
    };
    
    /**
     * Get Nifty 100 symbols (Nifty 50 + Nifty Next 50)
     * @returns {Array} Array of Nifty 100 symbols
     */
    window.yahooFinanceAPI.getNifty100Symbols = function() {
        return [...nifty50Symbols, ...niftyNext50Symbols];
    };
    
    /**
     * Check if the market is currently closed
     * Based on Indian market hours: 9:15 AM to 3:30 PM IST, Monday to Friday
     * @returns {boolean} True if market is closed, false if open
     */
    window.yahooFinanceAPI.checkMarketStatus = function() {
        const now = new Date();
        
        try {
            // Try to use the user's timezone for more accurate results
            const options = { timeZone: config.marketHours.timezone };
            const indiaTime = new Intl.DateTimeFormat('en-US', { ...options, hour: 'numeric', minute: 'numeric', hour12: false }).format(now);
            const [hour, minute] = indiaTime.split(':').map(Number);
            const day = now.getDay();
            
            // Check if it's a weekend (0 = Sunday, 6 = Saturday)
            if (day === 0 || day === 6) {
                return true; // Market is closed on weekends
            }
            
            // Check if it's within market hours
            const openTime = config.marketHours.open.hour * 60 + config.marketHours.open.minute;
            const closeTime = config.marketHours.close.hour * 60 + config.marketHours.close.minute;
            const currentTime = hour * 60 + minute;
            
            return currentTime < openTime || currentTime >= closeTime;
        } catch (error) {
            console.error('Error checking market status:', error);
            // Fallback if timezone conversion fails - assuming IST (UTC+5:30)
            const indiaHour = (now.getUTCHours() + 5) % 24;
            const indiaMinute = (now.getUTCMinutes() + 30) % 60;
            const indiaDay = ((now.getUTCHours() + 5) >= 24) ? (now.getUTCDay() + 1) % 7 : now.getUTCDay();
            
            // Check if it's a weekend
            if (indiaDay === 0 || indiaDay === 6) {
                return true;
            }
            
            // Check if it's within market hours
            const openTime = config.marketHours.open.hour * 60 + config.marketHours.open.minute;
            const closeTime = config.marketHours.close.hour * 60 + config.marketHours.close.minute;
            const currentTime = indiaHour * 60 + indiaMinute;
            
            return currentTime < openTime || currentTime >= closeTime;
        }
    };
    
    /**
     * Build Yahoo Finance URL
     * @param {string} symbol - Stock symbol
     * @param {string} range - Time range (e.g. 1d, 5d, 1mo)
     * @param {string} interval - Data interval (e.g. 1m, 5m, 1d)
     * @returns {string} Yahoo Finance API URL
     */
    function buildUrl(symbol, range = '1d', interval = '1d') {
        let url = config.baseUrl + symbol;
        url += `?range=${range}`;
        url += `&interval=${interval}`;
        url += '&includePrePost=false';
        
        if (config.useCorsProxy) {
            url = config.corsProxyUrl + encodeURIComponent(url);
        }
        
        return url;
    }
    
    /**
     * Fetch market data from Yahoo Finance API
     * @param {Array|string} symbols - Stock symbols to fetch data for
     * @param {string} timeframe - Timeframe to fetch data for (e.g. 1d, 5d, 1mo)
     * @returns {Promise<Array>} Promise that resolves to an array of stock data
     */
    window.yahooFinanceAPI.fetchMarketData = async function(symbols, timeframe = '1d') {
        try {
            // Convert single symbol to array
            if (typeof symbols === 'string') {
                symbols = [symbols];
            }
            
            // Map timeframe to interval (if needed)
            let interval = '1d';
            if (timeframe === '1d') {
                interval = '1d';
            } else if (timeframe === '5d') {
                interval = '1d';
            } else if (timeframe === '1mo') {
                interval = '1d';
            }
            
            // Batch API calls to avoid rate limiting (5 symbols at a time)
            const batchSize = 5;
            const batches = [];
            
            for (let i = 0; i < symbols.length; i += batchSize) {
                const batch = symbols.slice(i, i + batchSize);
                batches.push(batch);
                
                // Add a small delay between batches
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Process batches
            const allResults = [];
            for (const batch of batches) {
                const batchRequests = batch.map(symbol => {
                    const url = buildUrl(symbol, timeframe, interval);
                    console.log(`Fetching URL: ${url}`); // Log the URL being fetched
                    return fetch(url)
                        .then(response => {
                            if (!response.ok) {
                                // Log more details on error
                                console.error(`API Error Details: Status=${response.status}, StatusText=${response.statusText}, URL=${response.url}`);
                                throw new Error(`API error: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => processYahooData(data, symbol, timeframe))
                        .catch(error => {
                            // Log the specific symbol and the caught error
                            console.error(`Error fetching or processing data for ${symbol}:`, error);
                            return null;
                        });
                });
                
                // Wait for all requests in the batch to complete
                const batchResults = await Promise.all(batchRequests);
                allResults.push(...batchResults.filter(Boolean)); // Filter out nulls
                
                // Add a small delay between batches
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            return allResults;
        } catch (error) {
            console.error('General error in fetchMarketData:', error);
            throw error;
        }
    };
    
    /**
     * Process raw Yahoo Finance API data into a standardized format
     * @param {Object} data - Yahoo Finance API response
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - Timeframe of data
     * @returns {Object} Processed stock data
     */
    function processYahooData(data, symbol, timeframe) {
        try {
            // Extract chart data
            const result = data?.chart?.result?.[0];
            if (!result) {
                throw new Error(`Invalid data format for ${symbol}`);
            }
            
            const meta = result.meta || {};
            const timestamps = result.timestamp || [];
            const quotes = result.indicators?.quote?.[0] || {};
            const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];
            
            // Get the sector (if available) or use a default
            const sector = sectorMapping[symbol] || 'Other';
            
            // Determine if this is part of Nifty50 or Nifty100
            let index = 'OTHER';
            if (nifty50Symbols.includes(symbol)) {
                index = 'NIFTY50';
            } else if (niftyNext50Symbols.includes(symbol)) {
                index = 'NIFTY100';
            }
            
            // Get current price and previous close
            const currentPrice = meta.regularMarketPrice || quotes.close?.[quotes.close.length - 1];
            const previousClose = meta.chartPreviousClose || quotes.close?.[0];
            
            // Calculate percent change
            let percentChange = 0;
            if (previousClose && currentPrice) {
                percentChange = ((currentPrice - previousClose) / previousClose) * 100;
            }
            
            // Calculate market cap (if available)
            let marketCap = meta.marketCap || 0;
            // Convert to crores if in raw form (supporting different scale formats)
            if (marketCap > 1000000000) {
                marketCap = Math.round(marketCap / 10000000); // Convert to crores
            }
            
            // Extract stock name from symbol (remove .NS suffix)
            const name = meta.instrumentName || symbol.replace('.NS', '');
            
            // Return in the format expected by market heatmap
            return {
                symbol: symbol.replace('.NS', ''),
                name: name,
                sector: sector,
                price: currentPrice || 0,
                previousClose: previousClose || 0,
                percentChange: percentChange,
                marketCap: marketCap,
                index: index,
                // Additional data that might be useful
                dayHigh: meta.regularMarketDayHigh || 0,
                dayLow: meta.regularMarketDayLow || 0,
                volume: meta.regularMarketVolume || 0
            };
        } catch (error) {
            console.error(`Error processing Yahoo data for ${symbol}:`, error);
            return null;
        }
    }
})();