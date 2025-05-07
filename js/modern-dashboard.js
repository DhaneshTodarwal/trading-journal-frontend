// Modern Dashboard Layout with Drag-and-Drop Widget Positioning
// Enhances the dashboard with a grid-based layout and customizable widgets

// Use Sortable.js library for drag and drop functionality
// First, make sure the library is loaded
function loadSortableJS() {
    return new Promise((resolve, reject) => {
        if (window.Sortable) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Sortable.js'));
        document.head.appendChild(script);
    });
}

// Initialize the modern dashboard
async function initModernDashboard() {
    try {
        // Load required libraries
        await loadSortableJS();
        
        // Configure the dashboard grid
        setupDashboardGrid();
        
        // Make widgets draggable
        setupDraggableWidgets();
        
        // Setup layout persistence
        setupLayoutPersistence();
        
        // Add dashboard controls
        addDashboardControls();
        
        // Initialize dashboard widgets with data
        initDashboardWidgets();
        
        // Add AI Insights widget to the dashboard
        if (typeof window.addInsightsWidget === 'function') {
            window.addInsightsWidget();
        }
        
        console.log('Modern dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing modern dashboard:', error);
    }
}

// Initialize dashboard widgets with data
function initDashboardWidgets() {
    // Update recent trades widget if the function exists
    if (typeof displayRecentTrades === 'function') {
        displayRecentTrades();
    }
    
    // Call the main dashboard update function if it exists
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
}

// Setup the dashboard grid layout
function setupDashboardGrid() {
    const dashboard = document.querySelector('#dashboard');
    if (!dashboard) return;
    
    // Create grid container for widgets if it doesn't exist
    let gridContainer = dashboard.querySelector('.dashboard-grid');
    if (!gridContainer) {
        // Preserve the welcome message at the top
        const welcomeMessage = dashboard.querySelector('.dashboard-welcome');
        
        // Create grid container
        gridContainer = document.createElement('div');
        gridContainer.className = 'dashboard-grid';
        
        // Insert grid after welcome message if it exists, otherwise at the beginning
        if (welcomeMessage) {
            welcomeMessage.after(gridContainer);
        } else {
            dashboard.prepend(gridContainer);
        }
    }
    
    // Convert existing dashboard components into widgets
    convertToWidgets(dashboard, gridContainer);
}

// Convert existing components into draggable widgets
function convertToWidgets(dashboard, gridContainer) {
    // List of elements to convert to widgets
    const elementsToConvert = [
        { selector: '.stats-container', title: 'Key Metrics', icon: 'fa-chart-bar', size: 'full' },
        { selector: '.performance-summary-card', title: 'Performance Summary', icon: 'fa-chart-line', size: 'half' },
        { selector: '.risk-metrics-card', title: 'Risk Management', icon: 'fa-shield-alt', size: 'half' },
        { selector: '.chart-container.line-chart', title: 'Performance History', icon: 'fa-chart-line', size: 'half' },
        { selector: '.chart-container.pie-chart', title: 'Win/Loss Ratio', icon: 'fa-chart-pie', size: 'half' },
        { selector: '.consistency-chart', title: 'Trade Consistency', icon: 'fa-sliders-h', size: 'full' },
        { selector: '.market-events-widget', title: 'Market Events', icon: 'fa-calendar-alt', size: 'full' },
        { selector: '.recent-trades', title: 'Recent Trades', icon: 'fa-history', size: 'full' }
    ];
    
    // Process each element
    elementsToConvert.forEach(element => {
        const el = dashboard.querySelector(element.selector);
        if (el && !el.closest('.dashboard-widget')) { // Only convert if not already a widget
            // Create widget container
            const widget = createWidget(element.title, element.icon, el, element.size);
            
            // Add to grid
            gridContainer.appendChild(widget);
            
            // Remove original element (it's now inside the widget)
            if (el.parentNode !== widget.querySelector('.widget-content')) {
                el.remove();
            }
        }
    });
}

// Create a widget with the specified properties
function createWidget(title, icon, content, size = 'half') {
    const widget = document.createElement('div');
    widget.className = `dashboard-widget widget-${size}`;
    widget.setAttribute('data-widget-id', title.toLowerCase().replace(/\s+/g, '-'));
    
    // Create widget header with drag handle
    const header = document.createElement('div');
    header.className = 'widget-header';
    header.innerHTML = `
        <div class="widget-drag-handle">
            <i class="fas fa-grip-horizontal"></i>
        </div>
        <h3><i class="fas ${icon}"></i> ${title}</h3>
        <div class="widget-controls">
            <button class="widget-control widget-resize" title="Resize Widget">
                <i class="fas fa-expand-alt"></i>
            </button>
            <button class="widget-control widget-settings" title="Widget Settings">
                <i class="fas fa-cog"></i>
            </button>
        </div>
    `;
    
    // Create widget content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'widget-content';
    
    // If content is provided, move it inside
    if (content) {
        contentContainer.appendChild(content);
    }
    
    // Combine widget parts
    widget.appendChild(header);
    widget.appendChild(contentContainer);
    
    return widget;
}

// Setup draggable functionality for widgets
function setupDraggableWidgets() {
    const gridContainer = document.querySelector('.dashboard-grid');
    if (!gridContainer) return;
    
    // Initialize Sortable on the grid
    window.dashboardSortable = Sortable.create(gridContainer, {
        animation: 150,
        handle: '.widget-drag-handle',
        ghostClass: 'widget-ghost',
        chosenClass: 'widget-chosen',
        dragClass: 'widget-drag',
        onEnd: function() {
            saveLayout();
        }
    });
    
    // Set up resize functionality for widgets
    setupWidgetResize();
}

// Setup widget resize functionality
function setupWidgetResize() {
    document.addEventListener('click', function(e) {
        if (!e.target.matches('.widget-resize, .widget-resize *')) return;
        
        const button = e.target.closest('.widget-resize');
        const widget = button.closest('.dashboard-widget');
        
        if (widget.classList.contains('widget-full')) {
            widget.classList.remove('widget-full');
            widget.classList.add('widget-half');
            button.innerHTML = '<i class="fas fa-expand-alt"></i>';
            button.title = 'Expand Widget';
        } else {
            widget.classList.remove('widget-half');
            widget.classList.add('widget-full');
            button.innerHTML = '<i class="fas fa-compress-alt"></i>';
            button.title = 'Shrink Widget';
        }
        
        // Save updated layout
        saveLayout();
    });
}

// Save the current dashboard layout
function saveLayout() {
    const gridContainer = document.querySelector('.dashboard-grid');
    if (!gridContainer) return;
    
    const widgets = gridContainer.querySelectorAll('.dashboard-widget');
    const layout = Array.from(widgets).map(widget => {
        return {
            id: widget.getAttribute('data-widget-id'),
            size: widget.classList.contains('widget-full') ? 'full' : 'half'
        };
    });
    
    // Save layout to localStorage
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
}

// Load saved dashboard layout
function loadLayout() {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (!savedLayout) return;
    
    try {
        const layout = JSON.parse(savedLayout);
        const gridContainer = document.querySelector('.dashboard-grid');
        if (!gridContainer) return;
        
        // Create a DocumentFragment to batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // For each widget in the saved layout
        layout.forEach(item => {
            const widget = gridContainer.querySelector(`[data-widget-id="${item.id}"]`);
            if (widget) {
                // Update widget size
                widget.className = `dashboard-widget widget-${item.size}`;
                
                // Update resize button icon
                const resizeBtn = widget.querySelector('.widget-resize');
                if (resizeBtn) {
                    if (item.size === 'full') {
                        resizeBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
                        resizeBtn.title = 'Shrink Widget';
                    } else {
                        resizeBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
                        resizeBtn.title = 'Expand Widget';
                    }
                }
                
                // Move widget to fragment in correct order
                fragment.appendChild(widget);
            }
        });
        
        // Replace grid children with the reordered fragment
        gridContainer.innerHTML = '';
        gridContainer.appendChild(fragment);
        
    } catch (error) {
        console.error('Error loading dashboard layout:', error);
    }
}

// Setup layout persistence
function setupLayoutPersistence() {
    // Load layout when dashboard is shown
    loadLayout();
    
    // Add event listener for tab changes to reload layout if needed
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            if (targetSection === 'dashboard') {
                // Wait for the section to become active
                setTimeout(loadLayout, 100);
            }
        });
    });
}

// Add dashboard customization controls
function addDashboardControls() {
    // Function intentionally left empty to remove dashboard customization buttons
    // The buttons "Customize Dashboard" and "Reset Layout" have been removed as requested
    return;
}

// Open dashboard customizer modal
function openDashboardCustomizer() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('dashboard-customizer-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dashboard-customizer-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-columns"></i> Customize Dashboard</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="customizer-section">
                        <h3>Widget Visibility</h3>
                        <p>Select which widgets to show on your dashboard:</p>
                        <div id="widget-toggle-list">
                            <!-- Widget toggle checkboxes will be inserted here -->
                        </div>
                    </div>
                    <div class="customizer-section">
                        <h3>Layout Options</h3>
                        <div class="layout-options">
                            <div class="layout-option">
                                <input type="radio" id="layout-compact" name="layout" value="compact">
                                <label for="layout-compact">Compact</label>
                            </div>
                            <div class="layout-option">
                                <input type="radio" id="layout-comfortable" name="layout" value="comfortable" checked>
                                <label for="layout-comfortable">Comfortable</label>
                            </div>
                            <div class="layout-option">
                                <input type="radio" id="layout-spacious" name="layout" value="spacious">
                                <label for="layout-spacious">Spacious</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="apply-dashboard-settings" class="btn-primary">Apply Changes</button>
                    <button id="cancel-dashboard-settings" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup close functionality for the modal
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('#cancel-dashboard-settings');
        const applyBtn = modal.querySelector('#apply-dashboard-settings');
        
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        cancelBtn.addEventListener('click', () => modal.style.display = 'none');
        applyBtn.addEventListener('click', applyDashboardSettings);
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) modal.style.display = 'none';
        });
    }
    
    // Populate widget toggle list
    populateWidgetToggles();
    
    // Show the modal
    modal.style.display = 'block';
}

// Populate widget toggle checkboxes in customizer
function populateWidgetToggles() {
    const toggleList = document.getElementById('widget-toggle-list');
    if (!toggleList) return;
    
    // Clear existing toggles
    toggleList.innerHTML = '';
    
    // Get all widgets
    const widgets = document.querySelectorAll('.dashboard-widget');
    
    // Create toggle for each widget
    widgets.forEach(widget => {
        const widgetId = widget.getAttribute('data-widget-id');
        const widgetTitle = widget.querySelector('.widget-header h3').innerText.trim();
        
        const isVisible = !widget.classList.contains('widget-hidden');
        
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'widget-toggle-item';
        toggleContainer.innerHTML = `
            <input type="checkbox" id="toggle-${widgetId}" data-widget-id="${widgetId}" ${isVisible ? 'checked' : ''}>
            <label for="toggle-${widgetId}">${widgetTitle}</label>
        `;
        
        toggleList.appendChild(toggleContainer);
    });
}

// Apply dashboard customization settings
function applyDashboardSettings() {
    // Get widget visibility settings
    const toggles = document.querySelectorAll('#widget-toggle-list input[type="checkbox"]');
    toggles.forEach(toggle => {
        const widgetId = toggle.getAttribute('data-widget-id');
        const widget = document.querySelector(`.dashboard-widget[data-widget-id="${widgetId}"]`);
        
        if (widget) {
            if (toggle.checked) {
                widget.classList.remove('widget-hidden');
            } else {
                widget.classList.add('widget-hidden');
            }
        }
    });
    
    // Get layout density setting
    const layoutSetting = document.querySelector('input[name="layout"]:checked').value;
    const dashboardGrid = document.querySelector('.dashboard-grid');
    
    if (dashboardGrid) {
        // Remove existing layout classes
        dashboardGrid.classList.remove('layout-compact', 'layout-comfortable', 'layout-spacious');
        // Add selected layout class
        dashboardGrid.classList.add(`layout-${layoutSetting}`);
    }
    
    // Save settings
    saveWidgetVisibility();
    saveLayoutSettings(layoutSetting);
    
    // Close the modal
    const modal = document.getElementById('dashboard-customizer-modal');
    if (modal) modal.style.display = 'none';
}

// Save widget visibility settings
function saveWidgetVisibility() {
    const widgets = document.querySelectorAll('.dashboard-widget');
    const visibilitySettings = Array.from(widgets).map(widget => {
        return {
            id: widget.getAttribute('data-widget-id'),
            visible: !widget.classList.contains('widget-hidden')
        };
    });
    
    localStorage.setItem('dashboard-widget-visibility', JSON.stringify(visibilitySettings));
}

// Save layout density settings
function saveLayoutSettings(layout) {
    localStorage.setItem('dashboard-layout-density', layout);
}

// Load widget visibility settings
function loadWidgetVisibility() {
    const savedVisibility = localStorage.getItem('dashboard-widget-visibility');
    if (!savedVisibility) return;
    
    try {
        const settings = JSON.parse(savedVisibility);
        settings.forEach(setting => {
            const widget = document.querySelector(`.dashboard-widget[data-widget-id="${setting.id}"]`);
            if (widget) {
                if (setting.visible) {
                    widget.classList.remove('widget-hidden');
                } else {
                    widget.classList.add('widget-hidden');
                }
            }
        });
    } catch (error) {
        console.error('Error loading widget visibility:', error);
    }
}

// Load layout density settings
function loadLayoutSettings() {
    const layoutDensity = localStorage.getItem('dashboard-layout-density') || 'comfortable';
    const dashboardGrid = document.querySelector('.dashboard-grid');
    
    if (dashboardGrid) {
        // Remove existing layout classes
        dashboardGrid.classList.remove('layout-compact', 'layout-comfortable', 'layout-spacious');
        // Add saved layout class
        dashboardGrid.classList.add(`layout-${layoutDensity}`);
    }
    
    // Update radio button in customizer if it's open
    const radioButton = document.querySelector(`input[name="layout"][value="${layoutDensity}"]`);
    if (radioButton) radioButton.checked = true;
}

// Reset dashboard layout to default
function resetDashboardLayout() {
    if (!confirm('Reset dashboard to default layout? This will remove any customizations you have made.')) return;
    
    // Remove saved layout data
    localStorage.removeItem('dashboard-layout');
    localStorage.removeItem('dashboard-widget-visibility');
    localStorage.removeItem('dashboard-layout-density');
    
    // Reload the page to reset everything
    window.location.reload();
}

// Initialize the modern dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize if we're on the dashboard
    if (document.querySelector('[data-section="dashboard"].active')) {
        initModernDashboard();
    }
    
    // Update when switching to dashboard
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            if (targetSection === 'dashboard') {
                // Wait for the section to become active
                setTimeout(initModernDashboard, 100);
            }
        });
    });
});