/**
 * Trading Journal UI Animations
 * Enhanced user experience with smooth animations and transitions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Apply animations to dashboard elements
    animateDashboard();
    
    // Set up navigation transitions
    setupSectionTransitions();
    
    // Add animated counters to statistics
    setupCounters();
    
    // Add confetti effect for achievements
    setupAchievements();
    
    // Add 3D card effect to important cards
    setup3DCardEffects();
    
    // Add ripple effect to buttons
    setupButtonEffects();
    
    // Setup theme system
    setupThemeSystem();
    
    // Setup customizable dashboard
    setupCustomizableDashboard();
});

/**
 * Animates dashboard elements with staggered timing
 */
function animateDashboard() {
    // Add dashboard-card class to all stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.add('dashboard-card');
    });
    
    // Add card-3d class to trade cards for hover effect
    document.querySelectorAll('.trade-item').forEach(card => {
        card.classList.add('card-3d');
    });
    
    // Add floating animation to important elements
    document.querySelectorAll('.highlight-stat, .overall-performance').forEach(el => {
        el.classList.add('floating');
    });
}

/**
 * Sets up smooth transitions between sections
 */
function setupSectionTransitions() {
    // Get all section navigation links
    const sectionLinks = document.querySelectorAll('[data-section]');
    
    sectionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Get target section
            const targetSection = document.getElementById(this.getAttribute('data-section'));
            
            if (targetSection) {
                // Remove active class from all sections
                document.querySelectorAll('section').forEach(section => {
                    section.classList.remove('section-transition');
                });
                
                // Add transition class to animate the new section
                setTimeout(() => {
                    targetSection.classList.add('section-transition');
                }, 10);
            }
        });
    });
}

/**
 * Sets up animated counters for statistics
 */
function setupCounters() {
    // Select elements that should have counting animation
    const counterElements = document.querySelectorAll('.win-rate, .total-trades, .avg-return, .net-profit');
    
    // Add counter class
    counterElements.forEach(el => {
        // Extract the current value
        const value = el.textContent;
        
        // Check if it's a number or percentage
        if (!isNaN(parseFloat(value))) {
            el.setAttribute('data-value', value);
            el.classList.add('animate-value-counter');
            
            // Animate the counter when in viewport
            animateCounterWhenVisible(el);
        }
    });
}

/**
 * Animates counter when element scrolls into view
 */
function animateCounterWhenVisible(element) {
    // Create an observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetValue = parseFloat(element.getAttribute('data-value'));
                const isPercentage = element.textContent.includes('%');
                const isCurrency = element.textContent.includes('₹') || 
                                   element.textContent.includes('$');
                
                // Start from zero
                let currentValue = 0;
                const duration = 1500; // ms
                const steps = 60;
                const increment = targetValue / steps;
                
                // Counter animation interval
                const interval = setInterval(() => {
                    currentValue += increment;
                    
                    // Format the value appropriately
                    if (currentValue >= targetValue) {
                        clearInterval(interval);
                        currentValue = targetValue;
                    }
                    
                    // Format display based on type
                    if (isPercentage) {
                        element.textContent = currentValue.toFixed(1) + '%';
                    } else if (isCurrency) {
                        // Preserve currency symbol
                        const symbol = element.textContent.trim()[0];
                        element.textContent = `${symbol}${currentValue.toLocaleString('en-IN', {
                            maximumFractionDigits: 0
                        })}`;
                    } else {
                        element.textContent = Math.round(currentValue).toString();
                    }
                    
                }, duration / steps);
                
                // Unobserve after animation starts
                observer.unobserve(element);
            }
        });
    });
    
    // Start observing the element
    observer.observe(element);
}

/**
 * Sets up confetti effects for achievements
 */
function setupAchievements() {
    // Check if win rate is above 50%
    const winRateEl = document.getElementById('win-rate');
    
    if (winRateEl) {
        const winRate = parseFloat(winRateEl.textContent);
        
        if (!isNaN(winRate) && winRate > 50) {
            // Create achievement notification
            showAchievement("Great job! Your win rate is above 50%!");
            
            // Create confetti effect
            createConfetti();
        }
    }
}

/**
 * Shows achievement notification
 */
function showAchievement(message) {
    // Create achievement element
    const achievement = document.createElement('div');
    achievement.className = 'achievement-notification animate-slide-in-right';
    
    achievement.innerHTML = `
        <div class="achievement-content">
            <i class="fas fa-trophy"></i>
            <span>${message}</span>
        </div>
        <button class="achievement-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to body
    document.body.appendChild(achievement);
    
    // Add close button handler
    achievement.querySelector('.achievement-close').addEventListener('click', () => {
        achievement.classList.replace('animate-slide-in-right', 'animate-slide-out-right');
        setTimeout(() => {
            document.body.removeChild(achievement);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(achievement)) {
            achievement.classList.replace('animate-slide-in-right', 'animate-slide-out-right');
            setTimeout(() => {
                if (document.body.contains(achievement)) {
                    document.body.removeChild(achievement);
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Creates confetti animation
 */
function createConfetti() {
    // Create container
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    
    // Add to body
    document.body.appendChild(container);
    
    // Create confetti pieces
    const colors = ['#ff6b35', '#f7c59f', '#004e89', '#1a659e', '#7fb069', '#efefd0'];
    
    for (let i = 0; i < 100; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.width = Math.random() * 10 + 5 + 'px';
        piece.style.height = Math.random() * 10 + 5 + 'px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = Math.random() * 3 + 2 + 's';
        piece.style.animationDelay = Math.random() * 2 + 's';
        
        container.appendChild(piece);
        
        // Start animation
        setTimeout(() => {
            piece.classList.add('animate');
        }, 0);
    }
    
    // Remove container after animations complete
    setTimeout(() => {
        document.body.removeChild(container);
    }, 7000);
}

/**
 * Sets up 3D card effects for important cards
 */
function setup3DCardEffects() {
    const cards = document.querySelectorAll('.card-3d');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top; // y position within the element
            
            // Calculate rotation based on mouse position
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Max rotation in degrees
            const maxRotation = 5;
            
            // Calculate rotation
            const rotateY = maxRotation * ((x - centerX) / centerX);
            const rotateX = -1 * maxRotation * ((y - centerY) / centerY);
            
            // Apply transformation
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
        });
        
        // Reset on mouse leave
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

/**
 * Sets up ripple effect for buttons
 */
function setupButtonEffects() {
    // Add btn-animated class to all buttons
    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-action').forEach(button => {
        button.classList.add('btn-animated');
    });
    
    // Add ripple effect on click
    document.querySelectorAll('.btn-animated').forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Set the ripple position
            this.style.setProperty('--ripple-x', x + 'px');
            this.style.setProperty('--ripple-y', y + 'px');
        });
    });
}

/**
 * Shows loading placeholders while data loads
 */
function showLoadingPlaceholders() {
    // Replace charts with placeholders while loading
    document.querySelectorAll('.chart-container').forEach(container => {
        const canvas = container.querySelector('canvas');
        
        // If chart exists, hide it and show placeholder
        if (canvas) {
            canvas.style.display = 'none';
            
            const placeholder = document.createElement('div');
            placeholder.className = 'chart-placeholder';
            container.appendChild(placeholder);
            
            // Remove placeholder after delay
            setTimeout(() => {
                if (container.contains(placeholder)) {
                    container.removeChild(placeholder);
                    canvas.style.display = 'block';
                }
            }, 1200);
        }
    });
}

/**
 * Updates UI when data refreshes
 */
function refreshUI() {
    // Add refreshing class to refresh icon
    const refreshIcon = document.querySelector('.refresh-icon');
    
    if (refreshIcon) {
        refreshIcon.classList.add('refreshing');
        
        // Remove class after animation completes
        setTimeout(() => {
            refreshIcon.classList.remove('refreshing');
        }, 1000);
    }
    
    // Show loading placeholders
    showLoadingPlaceholders();
    
    // Re-animate dashboard
    setTimeout(() => {
        animateDashboard();
        setupCounters();
    }, 1200);
}

/**
 * Sets up theme system with multiple theme options
 */
function setupThemeSystem() {
    // Add transition class to body for smooth theme changes
    document.body.classList.add('theme-transition');
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('tradingJournalTheme') || 'light';
    applyTheme(savedTheme);
    
    // Set the active theme in dropdown
    setActiveThemeOption(savedTheme);
    
    // Theme selector dropdown functionality
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            applyTheme(theme);
            setActiveThemeOption(theme);
        });
    });
    
    // Theme selector button - if user wants to use click rather than hover
    const themeSelectorBtn = document.querySelector('.theme-selector-btn');
    const themeSelectorDropdown = document.querySelector('.theme-selector-dropdown');
    
    if (themeSelectorBtn && themeSelectorDropdown) {
        themeSelectorBtn.addEventListener('click', function() {
            themeSelectorDropdown.classList.toggle('visible');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.theme-selector')) {
                themeSelectorDropdown.classList.remove('visible');
            }
        });
    }
    
    // Legacy dark mode toggle compatibility
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = savedTheme === 'dark';
        darkModeToggle.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            applyTheme(theme);
            setActiveThemeOption(theme);
        });
    }
}

/**
 * Sets the active theme option in the dropdown
 */
function setActiveThemeOption(theme) {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

/**
 * Applies the selected theme to the document
 */
function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove(
        'light-theme', 
        'dark-theme', 
        'blue-theme', 
        'purple-theme', 
        'green-theme', 
        'high-contrast-theme'
    );
    
    // Add the selected theme class
    document.body.classList.add(`${theme}-theme`);
    
    // Save theme preference
    localStorage.setItem('tradingJournalTheme', theme);
    
    // Update legacy dark mode toggle if it exists
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = theme === 'dark';
    }
    
    // Custom event for theme change that other scripts can listen for
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    
    // Update chart themes if Chart.js is loaded
    updateChartsForTheme(theme);
}

/**
 * Update Chart.js charts based on current theme
 */
function updateChartsForTheme(theme) {
    if (window.Chart) {
        // Get theme colors for charts
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-color').trim();
        const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();
        const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim();
        
        // Update global chart options
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = borderColor;
        
        // Find all charts in the document and update them
        const charts = Chart.instances || [];
        charts.forEach(chart => {
            if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            
            if (chart.options && chart.options.scales) {
                // Update X and Y axis labels and ticks
                for (let scaleId in chart.options.scales) {
                    const scale = chart.options.scales[scaleId];
                    if (scale) {
                        if (scale.ticks) scale.ticks.color = textColor;
                        if (scale.title) scale.title.color = textColor;
                        scale.grid = scale.grid || {};
                        scale.grid.color = borderColor;
                    }
                }
            }
            
            // Update and re-render the chart
            chart.update();
        });
    }
}

/**
 * Sets up customizable dashboard layout
 */
function setupCustomizableDashboard() {
    const dashboard = document.querySelector('.customizable-dashboard');
    if (!dashboard) return;
    
    // Load saved layout from localStorage
    loadDashboardLayout();
    
    // Setup widget drag and drop
    setupWidgetDragDrop();
    
    // Setup widget resize
    setupWidgetResize();
    
    // Setup widget controls (minimize, close, etc)
    setupWidgetControls();
    
    // Add widget button functionality
    setupAddWidgetButton();
}

/**
 * Loads saved dashboard layout from localStorage
 */
function loadDashboardLayout() {
    const savedLayout = localStorage.getItem('tradingJournalDashboardLayout');
    if (!savedLayout) return;
    
    try {
        const layout = JSON.parse(savedLayout);
        const dashboard = document.querySelector('.customizable-dashboard');
        
        if (!dashboard) return;
        
        // Clear existing widgets if we're loading a saved layout
        dashboard.innerHTML = '';
        
        // Create each widget from the saved layout
        layout.widgets.forEach(widget => {
            createDashboardWidget(
                widget.type, 
                widget.title, 
                widget.size, 
                widget.content, 
                widget.position
            );
        });
    } catch (error) {
        console.error('Error loading dashboard layout:', error);
    }
}

/**
 * Saves current dashboard layout to localStorage
 */
function saveDashboardLayout() {
    const dashboard = document.querySelector('.customizable-dashboard');
    if (!dashboard) return;
    
    const widgets = [];
    
    // Get all widgets and their current state
    dashboard.querySelectorAll('.dashboard-widget').forEach((widget, index) => {
        const type = widget.dataset.widgetType;
        const title = widget.querySelector('.widget-title').textContent;
        const size = widget.className.match(/widget-size-(\d+)/)[1];
        
        // Get content based on widget type
        let content = {};
        
        // For chart widgets, save chart type and options
        if (type === 'chart') {
            const chartCanvas = widget.querySelector('canvas');
            if (chartCanvas && chartCanvas.chart) {
                content = {
                    chartType: chartCanvas.chart.config.type,
                    options: chartCanvas.chart.config.options
                };
            }
        } 
        // For stat widgets, save stats
        else if (type === 'stats') {
            const stats = [];
            widget.querySelectorAll('.widget-stat-item').forEach(stat => {
                stats.push({
                    label: stat.querySelector('.stat-label').textContent,
                    value: stat.querySelector('.stat-value').textContent,
                });
            });
            content = { stats };
        }
        // For custom widgets, save content HTML
        else if (type === 'custom') {
            content = {
                html: widget.querySelector('.widget-content').innerHTML
            };
        }
        
        widgets.push({
            type,
            title,
            size,
            content,
            position: index
        });
    });
    
    // Save to localStorage
    localStorage.setItem('tradingJournalDashboardLayout', JSON.stringify({ widgets }));
}

/**
 * Creates a new dashboard widget
 */
function createDashboardWidget(type, title, size = 2, content = {}, position = -1) {
    const dashboard = document.querySelector('.customizable-dashboard');
    if (!dashboard) return;
    
    // Create widget element
    const widget = document.createElement('div');
    widget.className = `dashboard-widget widget-size-${size}`;
    widget.dataset.widgetType = type;
    
    // Create widget header
    const header = document.createElement('div');
    header.className = 'widget-header';
    
    const widgetTitle = document.createElement('div');
    widgetTitle.className = 'widget-title';
    
    // Add icon based on type
    let icon = 'chart-line';
    if (type === 'stats') icon = 'chart-bar';
    if (type === 'table') icon = 'table';
    if (type === 'custom') icon = 'code';
    
    widgetTitle.innerHTML = `<i class="fas fa-${icon}"></i> ${title}`;
    
    const controls = document.createElement('div');
    controls.className = 'widget-controls';
    controls.innerHTML = `
        <button class="widget-control widget-control-edit" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="widget-control widget-control-minimize" title="Minimize"><i class="fas fa-minus"></i></button>
        <button class="widget-control widget-control-close" title="Remove"><i class="fas fa-times"></i></button>
    `;
    
    header.appendChild(widgetTitle);
    header.appendChild(controls);
    widget.appendChild(header);
    
    // Create content container
    const widgetContent = document.createElement('div');
    widgetContent.className = 'widget-content';
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'widget-resize-handle';
    
    widget.appendChild(widgetContent);
    widget.appendChild(resizeHandle);
    
    // Add to dashboard
    if (position >= 0 && dashboard.children.length > position) {
        dashboard.insertBefore(widget, dashboard.children[position]);
    } else {
        dashboard.appendChild(widget);
    }
    
    // Initialize content based on type
    initializeWidgetContent(widget, type, content);
    
    // Save the layout after adding a new widget
    saveDashboardLayout();
    
    return widget;
}

/**
 * Initializes widget content based on type
 */
function initializeWidgetContent(widget, type, content = {}) {
    const widgetContent = widget.querySelector('.widget-content');
    
    // Show loading state
    widgetContent.innerHTML = `
        <div class="widget-loading">
            <div class="spinner"></div>
        </div>
    `;
    
    // Initialize content based on type with a small delay to show loading effect
    setTimeout(() => {
        switch (type) {
            case 'chart':
                initializeChartWidget(widgetContent, content);
                break;
            case 'stats':
                initializeStatsWidget(widgetContent, content);
                break;
            case 'table':
                initializeTableWidget(widgetContent, content);
                break;
            case 'custom':
                initializeCustomWidget(widgetContent, content);
                break;
            default:
                widgetContent.innerHTML = 'Unknown widget type';
        }
    }, 500);
}

/**
 * Initializes a chart widget
 */
function initializeChartWidget(container, content) {
    const chartType = content.chartType || 'line';
    const chartData = content.data || generateDummyChartData(chartType);
    const options = content.options || {};
    
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    if (window.Chart) {
        const chart = new Chart(canvas, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...options
            }
        });
        
        canvas.chart = chart;
    } else {
        container.innerHTML = 'Chart.js is not available';
    }
}

/**
 * Generates dummy chart data for preview
 */
function generateDummyChartData(chartType) {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    if (chartType === 'line' || chartType === 'bar') {
        return {
            labels,
            datasets: [{
                label: 'Sample Data',
                data: labels.map(() => Math.floor(Math.random() * 100)),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            }]
        };
    } else if (chartType === 'pie' || chartType === 'doughnut') {
        return {
            labels,
            datasets: [{
                data: labels.map(() => Math.floor(Math.random() * 100)),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ]
            }]
        };
    }
    
    return {
        labels,
        datasets: [{
            label: 'Sample Data',
            data: labels.map(() => Math.floor(Math.random() * 100))
        }]
    };
}

/**
 * Initializes stats widget
 */
function initializeStatsWidget(container, content) {
    const stats = content.stats || [
        { label: 'Win Rate', value: '52%' },
        { label: 'Profit Factor', value: '1.5' },
        { label: 'Avg. Return', value: '2.3%' }
    ];
    
    let html = '<div class="widget-stats-container">';
    
    stats.forEach(stat => {
        html += `
            <div class="widget-stat-item">
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Initializes table widget
 */
function initializeTableWidget(container, content) {
    const headers = content.headers || ['Date', 'Stock', 'P/L'];
    const rows = content.rows || [
        ['2023-04-19', 'AAPL', '+2.3%'],
        ['2023-04-18', 'MSFT', '-1.2%'],
        ['2023-04-17', 'GOOGL', '+1.8%']
    ];
    
    let html = '<div class="responsive-table"><table class="widget-table">';
    
    // Table header
    html += '<thead><tr>';
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead>';
    
    // Table body
    html += '<tbody>';
    rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    
    container.innerHTML = html;
}

/**
 * Initializes custom widget
 */
function initializeCustomWidget(container, content) {
    container.innerHTML = content.html || '<div class="custom-widget-placeholder">Custom Widget</div>';
}

/**
 * Sets up widget drag and drop functionality
 */
function setupWidgetDragDrop() {
    const dashboard = document.querySelector('.customizable-dashboard');
    if (!dashboard) return;
    
    let draggedWidget = null;
    let dragPlaceholder = null;
    
    // Make all widget headers draggable
    dashboard.querySelectorAll('.widget-header').forEach(header => {
        header.addEventListener('mousedown', startDrag);
    });
    
    function startDrag(e) {
        // Only start drag on left mouse button and if clicking the header (not controls)
        if (e.button !== 0 || e.target.closest('.widget-controls')) return;
        
        const widget = e.target.closest('.dashboard-widget');
        if (!widget) return;
        
        e.preventDefault();
        
        draggedWidget = widget;
        draggedWidget.classList.add('widget-dragging');
        
        // Create placeholder with same dimensions
        const rect = draggedWidget.getBoundingClientRect();
        dragPlaceholder = document.createElement('div');
        dragPlaceholder.className = 'widget-placeholder';
        dragPlaceholder.style.width = rect.width + 'px';
        dragPlaceholder.style.height = rect.height + 'px';
        
        // Position the dragged widget at mouse position
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        // Start tracking mouse movement
        function drag(e) {
            // Position the dragged widget at cursor
            draggedWidget.style.position = 'fixed';
            draggedWidget.style.zIndex = '1000';
            draggedWidget.style.left = (e.clientX - offsetX) + 'px';
            draggedWidget.style.top = (e.clientY - offsetY) + 'px';
            
            // Find drop position
            const target = getDropTarget(e.clientX, e.clientY);
            
            if (target && target !== draggedWidget) {
                // Insert placeholder
                if (target.parentNode === dashboard) {
                    dashboard.insertBefore(dragPlaceholder, target);
                }
            }
        }
        
        function stopDrag() {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            
            // Remove placeholder and reset widget style
            if (dragPlaceholder.parentNode) {
                dashboard.insertBefore(draggedWidget, dragPlaceholder);
                dashboard.removeChild(dragPlaceholder);
            }
            
            draggedWidget.style.position = '';
            draggedWidget.style.zIndex = '';
            draggedWidget.style.left = '';
            draggedWidget.style.top = '';
            draggedWidget.classList.remove('widget-dragging');
            
            // Save the new layout
            saveDashboardLayout();
            
            draggedWidget = null;
            dragPlaceholder = null;
        }
    }
    
    function getDropTarget(x, y) {
        const elements = document.elementsFromPoint(x, y);
        
        for (const element of elements) {
            // Find the first dashboard-widget that is not the dragged widget
            if (element.classList.contains('dashboard-widget') && 
                element !== draggedWidget) {
                return element;
            }
            
            // Or find the customizable dashboard itself for append
            if (element.classList.contains('customizable-dashboard')) {
                return null;
            }
        }
        
        return null;
    }
}

/**
 * Sets up widget resize functionality
 */
function setupWidgetResize() {
    const dashboard = document.querySelector('.customizable-dashboard');
    if (!dashboard) return;
    
    dashboard.querySelectorAll('.widget-resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', startResize);
    });
    
    function startResize(e) {
        e.preventDefault();
        
        const widget = e.target.closest('.dashboard-widget');
        if (!widget) return;
        
        const startX = e.clientX;
        const startWidth = widget.getBoundingClientRect().width;
        
        widget.classList.add('widget-resizing');
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        function resize(e) {
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;
            
            // Determine new size class based on percentage of dashboard width
            const dashboardWidth = dashboard.getBoundingClientRect().width;
            const widthPercentage = (newWidth / dashboardWidth) * 100;
            
            // Remove existing size classes
            const sizeClasses = ['widget-size-1', 'widget-size-2', 'widget-size-3', 'widget-size-4', 'widget-size-5'];
            widget.classList.remove(...sizeClasses);
            
            // Add new size class
            let newSizeClass;
            if (widthPercentage < 25) {
                newSizeClass = 'widget-size-1';
            } else if (widthPercentage < 40) {
                newSizeClass = 'widget-size-2';
            } else if (widthPercentage < 60) {
                newSizeClass = 'widget-size-3';
            } else if (widthPercentage < 80) {
                newSizeClass = 'widget-size-4';
            } else {
                newSizeClass = 'widget-size-5';
            }
            
            widget.classList.add(newSizeClass);
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            
            widget.classList.remove('widget-resizing');
            
            // Save the new layout
            saveDashboardLayout();
        }
    }
}

/**
 * Sets up widget controls (minimize, close, etc)
 */
function setupWidgetControls() {
    const dashboard = document.querySelector('.customizable-dashboard');
    if (!dashboard) return;
    
    dashboard.addEventListener('click', function(e) {
        // Close button
        if (e.target.closest('.widget-control-close')) {
            const widget = e.target.closest('.dashboard-widget');
            if (widget && confirm('Remove this widget?')) {
                widget.remove();
                saveDashboardLayout();
            }
        }
        
        // Minimize button
        if (e.target.closest('.widget-control-minimize')) {
            const widget = e.target.closest('.dashboard-widget');
            if (widget) {
                const content = widget.querySelector('.widget-content');
                const control = e.target.closest('.widget-control-minimize');
                
                if (content.style.display === 'none') {
                    content.style.display = '';
                    control.innerHTML = '<i class="fas fa-minus"></i>';
                } else {
                    content.style.display = 'none';
                    control.innerHTML = '<i class="fas fa-plus"></i>';
                }
                
                saveDashboardLayout();
            }
        }
        
        // Edit button
        if (e.target.closest('.widget-control-edit')) {
            const widget = e.target.closest('.dashboard-widget');
            if (widget) {
                editWidget(widget);
            }
        }
    });
}

/**
 * Opens widget editor
 */
function editWidget(widget) {
    // This is a placeholder for widget editing functionality
    // In a full implementation, this would open a modal with widget settings
    alert('Widget editing functionality would go here');
}

/**
 * Sets up the Add Widget button
 */
function setupAddWidgetButton() {
    const addButton = document.getElementById('add-widget-btn');
    const dropdown = document.querySelector('.add-widget-dropdown');
    
    if (!addButton) {
        // Create the button if it doesn't exist
        const dashboard = document.querySelector('.customizable-dashboard');
        if (!dashboard) return;
        
        const controls = document.createElement('div');
        controls.className = 'dashboard-controls';
        controls.innerHTML = `
            <div class="dashboard-control-btn" id="add-widget-btn">
                <i class="fas fa-plus"></i> Add Widget
            </div>
            <div class="add-widget-dropdown">
                <div class="widget-options">
                    <div class="widget-option" data-type="chart" data-chart-type="line">
                        <i class="fas fa-chart-line"></i>
                        Line Chart
                    </div>
                    <div class="widget-option" data-type="chart" data-chart-type="bar">
                        <i class="fas fa-chart-bar"></i>
                        Bar Chart
                    </div>
                    <div class="widget-option" data-type="chart" data-chart-type="pie">
                        <i class="fas fa-chart-pie"></i>
                        Pie Chart
                    </div>
                    <div class="widget-option" data-type="stats">
                        <i class="fas fa-tachometer-alt"></i>
                        Stats
                    </div>
                    <div class="widget-option" data-type="table">
                        <i class="fas fa-table"></i>
                        Recent Trades
                    </div>
                    <div class="widget-option" data-type="custom">
                        <i class="fas fa-code"></i>
                        Custom
                    </div>
                </div>
            </div>
        `;
        
        dashboard.parentNode.insertBefore(controls, dashboard);
        
        // Update references
        const addButton = document.getElementById('add-widget-btn');
        const dropdown = document.querySelector('.add-widget-dropdown');
        
        // Add event listeners
        addButton.addEventListener('click', function() {
            dropdown.classList.toggle('visible');
        });
        
        document.addEventListener('click', function(event) {
            if (!event.target.closest('#add-widget-btn') && 
                !event.target.closest('.add-widget-dropdown')) {
                dropdown.classList.remove('visible');
            }
        });
        
        // Add widget option click handling
        document.querySelectorAll('.widget-option').forEach(option => {
            option.addEventListener('click', function() {
                const type = this.dataset.type;
                let title = '';
                
                switch (type) {
                    case 'chart':
                        const chartType = this.dataset.chartType || 'line';
                        title = chartType.charAt(0).toUpperCase() + chartType.slice(1) + ' Chart';
                        createDashboardWidget('chart', title, 3, { chartType });
                        break;
                    case 'stats':
                        title = 'Trading Statistics';
                        createDashboardWidget('stats', title, 2);
                        break;
                    case 'table':
                        title = 'Recent Trades';
                        createDashboardWidget('table', title, 3);
                        break;
                    case 'custom':
                        title = 'Custom Widget';
                        createDashboardWidget('custom', title, 2, { html: '<div class="custom-content">Custom content goes here</div>' });
                        break;
                }
                
                dropdown.classList.remove('visible');
            });
        });
    }
}

// Expose functions for use in other scripts
window.tradingJournalUI = {
    refreshUI,
    showAchievement,
    createConfetti,
    applyTheme,
    updateChartsForTheme,
    createDashboardWidget,
    saveDashboardLayout,
    loadDashboardLayout
};