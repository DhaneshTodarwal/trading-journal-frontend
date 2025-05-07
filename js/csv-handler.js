// Advanced CSV Handler with Direct File System Access

// Global file handle storage
let csvFileHandle = null;
let csvDirectoryHandle = null;

// Save settings to localStorage
function saveCsvSettings() {
    const directoryPath = document.getElementById('csv-directory').value;
    localStorage.setItem('csvDirectory', directoryPath);
    showNotification('Settings saved successfully', 'success');
    
    // Try to get file system permission right away
    requestDirectoryPermission();
}

// Load settings from localStorage
function loadCsvSettings() {
    const directoryPath = localStorage.getItem('csvDirectory');
    if (directoryPath) {
        document.getElementById('csv-directory').value = directoryPath;
    }
}

// Convert trades to CSV
function tradesToCsv(trades) {
    // Define CSV headers
    const headers = [
        'id', 'date', 'stock', 'tradeType', 'strikePrice', 'stopLoss', 
        'profitLossPercentage', 'trailingStopLoss', 'profitTargets', 
        'notes', 'imagePath', 'timestamp'
    ];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    trades.forEach(trade => {
        const row = [
            trade.id || '',
            trade.date || '',
            trade.stock || '',
            trade.tradeType || '',
            trade.strikePrice || 0,
            trade.stopLoss || 0,
            trade.profitLossPercentage || 0,
            trade.trailingStopLoss || false,
            JSON.stringify(trade.profitTargets || []).replace(/,/g, '|'),
            (trade.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
            trade.screenshot ? `images/${trade.id}.png` : '',
            trade.timestamp || Date.now()
        ];
        
        // Add row to CSV
        csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
}

// Parse CSV back to trades
function csvToTrades(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const trades = [];
    
    // Process data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const trade = {};
        
        headers.forEach((header, index) => {
            if (header === 'profitTargets') {
                // Handle profitTargets special case
                const targetStr = values[index].replace(/\|/g, ',');
                try {
                    trade[header] = JSON.parse(targetStr);
                } catch (e) {
                    trade[header] = [];
                }
            } else if (header === 'trailingStopLoss') {
                // Convert string to boolean
                trade[header] = values[index] === 'true';
            } else if (header === 'stopLoss' || header === 'strikePrice' || header === 'profitLossPercentage') {
                // Convert numeric values
                trade[header] = parseFloat(values[index]) || 0;
            } else if (header === 'imagePath' && values[index]) {
                // Handle image path
                const imagePath = values[index];
                // For browser compatibility, we'll need to handle loading the image later
                trade.imagePath = imagePath;
            } else {
                trade[header] = values[index];
            }
        });
        
        trades.push(trade);
    }
    
    return trades;
}

// Check if browser supports the File System Access API
function isFileSystemAccessSupported() {
    return 'showDirectoryPicker' in window;
}

// Display appropriate UI based on browser support
function updateDirectoryUIBasedOnSupport() {
    const supportMessage = document.createElement('div');
    supportMessage.className = 'support-message';
    
    if (isFileSystemAccessSupported()) {
        supportMessage.innerHTML = `<i class="fas fa-check-circle"></i> Your browser supports direct file updates. Trades will update automatically.`;
        supportMessage.style.color = '#28a745';
    } else {
        supportMessage.innerHTML = `<i class="fas fa-info-circle"></i> Your browser doesn't support direct file updates. You'll need to manually save and replace files.`;
        supportMessage.style.color = '#f0ad4e';
    }
    
    // Add this message after the directory input
    const directoryInput = document.querySelector('.directory-input');
    if (directoryInput && !directoryInput.nextElementSibling.classList.contains('support-message')) {
        directoryInput.parentNode.insertBefore(supportMessage, directoryInput.nextElementSibling);
    }
}

// Handle file system permissions (for browsers that support it)
async function requestDirectoryPermission() {
    if (isFileSystemAccessSupported()) {
        try {
            // Request directory access
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            
            // Save the directory handle
            csvDirectoryHandle = dirHandle;
            
            // Look for existing trades.csv file
            try {
                csvFileHandle = await dirHandle.getFileHandle('trades.csv', { create: true });
                showNotification('Successfully connected to trades.csv file', 'success');
                
                // Get the directory name to display
                document.getElementById('csv-directory').value = dirHandle.name;
                
                // Try to read existing file and update app data if it exists
                await loadExistingCsv();
                
                return true;
            } catch (fileErr) {
                console.error('Error accessing CSV file:', fileErr);
                return false;
            }
        } catch (err) {
            console.error('Error selecting directory:', err);
            return false;
        }
    } else {
        alert('Your browser doesn\'t support direct file system access. Files will be downloaded to your default download location and you\'ll need to manage them manually.');
        return false;
    }
}

// Read existing CSV file and update app data
async function loadExistingCsv() {
    if (!csvFileHandle) return false;
    
    try {
        const file = await csvFileHandle.getFile();
        const content = await file.text();
        
        // Only proceed if file has content
        if (content.trim()) {
            const trades = csvToTrades(content);
            
            if (trades.length > 0) {
                // Backup current data
                const currentTrades = loadTrades();
                localStorage.setItem('tradesBackup', JSON.stringify(currentTrades));
                
                // Load new data
                saveTrades(trades);
                displayTrades();
                updateStatistics();
                showNotification(`Loaded ${trades.length} trades from CSV file`, 'success');
                return true;
            }
        }
        return false;
    } catch (err) {
        console.error('Error reading existing CSV:', err);
        return false;
    }
}

// Save trades to the CSV file (with direct file system access if available)
async function saveTradesAsCsv() {
    const trades = loadTrades();
    if (trades.length === 0) {
        showNotification('No trades to save', 'error');
        return;
    }
    
    const csvContent = tradesToCsv(trades);
    
    // If we have file system access, write directly to the file
    if (csvFileHandle && isFileSystemAccessSupported()) {
        try {
            // Create a writable stream
            const writable = await csvFileHandle.createWritable();
            
            // Write the content
            await writable.write(csvContent);
            
            // Close the stream
            await writable.close();
            
            // Save screenshots to images folder if needed
            await saveScreenshots(trades);
            
            showNotification('Trades saved directly to CSV file', 'success');
        } catch (err) {
            console.error('Error writing to CSV file:', err);
            showNotification('Error updating CSV file. Downloading instead...', 'error');
            downloadCsvFile(csvContent);
        }
    } else {
        // Fallback to download if direct access not available
        downloadCsvFile(csvContent);
    }
}

// Save screenshots to images directory
async function saveScreenshots(trades) {
    if (!csvDirectoryHandle || !isFileSystemAccessSupported()) return;
    
    try {
        // Try to get or create images directory
        const imagesDir = await csvDirectoryHandle.getDirectoryHandle('images', { create: true });
        
        // For each trade with a screenshot, save it
        for (const trade of trades) {
            if (trade.screenshot) {
                try {
                    // Convert data URL to blob
                    const response = await fetch(trade.screenshot);
                    const blob = await response.blob();
                    
                    // Create file in the images directory
                    const fileHandle = await imagesDir.getFileHandle(`${trade.id}.png`, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } catch (screenshotErr) {
                    console.error(`Error saving screenshot for trade ${trade.id}:`, screenshotErr);
                }
            }
        }
    } catch (err) {
        console.error('Error managing screenshots directory:', err);
    }
}

// Fallback: Download CSV file
function downloadCsvFile(csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'trades.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSV file downloaded. Please place it in your trading data directory.', 'info');
}

// Load trades from CSV file
async function loadTradesFromCsv() {
    if (csvFileHandle && isFileSystemAccessSupported()) {
        // If we already have a file handle, load from that file
        await loadExistingCsv();
    } else {
        // Otherwise, use file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const csvContent = e.target.result;
                    const trades = csvToTrades(csvContent);
                    
                    if (trades.length > 0) {
                        // Backup current trades
                        const currentTrades = loadTrades();
                        localStorage.setItem('tradesBackup', JSON.stringify(currentTrades));
                        
                        // Load new trades
                        saveTrades(trades);
                        displayTrades();
                        updateStatistics();
                        showNotification(`${trades.length} trades loaded from CSV`, 'success');
                    } else {
                        showNotification('No valid trades found in CSV', 'error');
                    }
                } catch (error) {
                    console.error('Failed to parse CSV:', error);
                    showNotification('Failed to parse CSV file', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
}

// Auto-update the CSV file when trades are added/modified/deleted
function autoUpdateCsv() {
    if (csvFileHandle && isFileSystemAccessSupported()) {
        saveTradesAsCsv();
    }
}

// Initialize CSV functionality
function initCsvFunctionality() {
    // Load saved settings
    loadCsvSettings();
    
    // Update UI based on browser support
    updateDirectoryUIBasedOnSupport();
    
    // Save settings button
    const saveSettingsBtn = document.getElementById('save-directory-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveCsvSettings);
    }
    
    // Select directory button
    const selectDirectoryBtn = document.getElementById('select-directory');
    if (selectDirectoryBtn) {
        selectDirectoryBtn.addEventListener('click', requestDirectoryPermission);
    }
    
    // Save to CSV button
    const saveToCsvBtn = document.getElementById('save-to-csv');
    if (saveToCsvBtn) {
        saveToCsvBtn.addEventListener('click', saveTradesAsCsv);
    }
    
    // Load from CSV button
    const loadFromCsvBtn = document.getElementById('load-from-csv');
    if (loadFromCsvBtn) {
        loadFromCsvBtn.addEventListener('click', loadTradesFromCsv);
    }
    
    // Try to restore previous file access
    if (isFileSystemAccessSupported()) {
        setTimeout(() => {
            const savedPath = localStorage.getItem('csvDirectory');
            if (savedPath) {
                // Inform user about directory access
                showNotification('Please grant access to your trading data directory', 'info');
            }
        }, 1000);
    }

    // Add sync button functionality
    const syncButton = document.getElementById('sync-csv-btn');
    if (syncButton) {
        syncButton.addEventListener('click', function() {
            this.classList.add('syncing');
            saveTradesAsCsv().finally(() => {
                setTimeout(() => {
                    this.classList.remove('syncing');
                }, 1000);
            });
        });
    }
}

// Setup settings navigation
function setupSettingsNavigation() {
    const settingsLink = document.querySelector('[data-section="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('[data-section]').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to settings link
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show settings section
            document.getElementById('settings').classList.add('active');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initCsvFunctionality();
    setupSettingsNavigation();
});