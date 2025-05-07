/**
 * Mobile Optimization for Trading Journal
 * Enhances the mobile experience with touch-friendly controls and responsive design
 */

class MobileOptimizer {
    constructor() {
        this.touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.smallScreen = window.innerWidth < 768;
        this.init();
    }
    
    init() {
        // Add mobile detection class to body
        this.setDeviceClass();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Enhance UI for touch devices
        if (this.touchDevice) {
            this.enhanceTouchControls();
        }
        
        // Optimize for small screens
        if (this.smallScreen) {
            this.optimizeForSmallScreens();
        }
        
        // Create mobile navigation drawer
        this.createMobileNavDrawer();
        
        // Setup double tap prevention for iOS
        this.preventDoubleTapZoom();
        
        console.log(`Mobile optimization initialized. Touch device: ${this.touchDevice}, Small screen: ${this.smallScreen}`);
    }
    
    setDeviceClass() {
        if (this.touchDevice) {
            document.body.classList.add('touch-device');
        } else {
            document.body.classList.add('no-touch');
        }
        
        if (this.smallScreen) {
            document.body.classList.add('small-screen');
        }
    }
    
    setupEventListeners() {
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        
        // Listen for resize events (with debounce)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });
        
        // Setup mobile drawer toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('#mobile-drawer-toggle, #mobile-drawer-toggle *')) {
                this.toggleNavDrawer();
            } else if (e.target.matches('#mobile-drawer-backdrop')) {
                this.closeNavDrawer();
            }
        });
    }
    
    handleOrientationChange() {
        // Wait for orientation change to complete
        setTimeout(() => {
            this.smallScreen = window.innerWidth < 768;
            this.setDeviceClass();
            this.optimizeForSmallScreens();
            
            // Force layout recalculation on charts if they exist
            if (typeof Chart !== 'undefined' && Chart.instances) {
                Chart.instances.forEach(chart => chart.resize());
            }
        }, 200);
    }
    
    handleResize() {
        const wasSmallScreen = this.smallScreen;
        this.smallScreen = window.innerWidth < 768;
        
        // If screen size category changed
        if (wasSmallScreen !== this.smallScreen) {
            this.setDeviceClass();
            this.optimizeForSmallScreens();
            
            // Force layout recalculation on charts if they exist
            if (typeof Chart !== 'undefined' && Chart.instances) {
                Chart.instances.forEach(chart => chart.resize());
            }
            
            // Close drawer if transitioning to large screen
            if (!this.smallScreen) {
                this.closeNavDrawer();
            }
        }
    }
    
    enhanceTouchControls() {
        // Increase touch target sizes
        this.addStyles(`
            .btn, 
            button,
            select,
            input[type="checkbox"] + label,
            input[type="radio"] + label,
            .nav a,
            .widget-control,
            .theme-option,
            .tag {
                min-height: 44px;
                min-width: 44px;
            }
            
            .widget-drag-handle {
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            input, select, textarea {
                padding: 12px;
            }
            
            .form-group label {
                margin-bottom: 8px;
            }
            
            .close, .toggle-label {
                transform: scale(1.2);
            }
        `);
        
        // Add swipe functionality for common UI elements
        this.setupSwipeHandlers();
        
        // Make table rows more touch-friendly
        this.enhanceTables();
        
        // Add momentum scrolling for overflow containers
        this.enhanceScrolling();
    }
    
    setupSwipeHandlers() {
        // Elements that can be swiped (e.g., trade items, cards)
        const swipeableElements = document.querySelectorAll('.trade-item, .card, .analytics-card');
        
        swipeableElements.forEach(element => {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;
            
            element.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });
            
            element.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                
                // Calculate swipe distance and direction
                const diffX = touchStartX - touchEndX;
                const diffY = touchStartY - touchEndY;
                
                // Only recognize horizontal swipes that are more horizontal than vertical
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        // Swipe left - reveal action buttons if available
                        if (element.classList.contains('trade-item')) {
                            element.classList.add('show-actions');
                        }
                    } else {
                        // Swipe right - hide action buttons if available
                        if (element.classList.contains('trade-item')) {
                            element.classList.remove('show-actions');
                        }
                    }
                }
            }, { passive: true });
        });
    }
    
    enhanceTables() {
        document.querySelectorAll('table').forEach(table => {
            // Ensure tables can be scrolled horizontally on mobile
            if (!table.parentElement.classList.contains('table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
            
            // Make table rows more tappable
            table.querySelectorAll('tbody tr').forEach(row => {
                row.classList.add('touch-row');
            });
        });
    }
    
    enhanceScrolling() {
        // Find scrollable containers and enhance them
        const scrollContainers = document.querySelectorAll('.chart-container, .scrollable, .table-responsive');
        
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overflowScrolling = 'touch';
        });
    }
    
    optimizeForSmallScreens() {
        // Only perform these optimizations on small screens
        if (!this.smallScreen) return;
        
        // Simplify the UI by hiding or collapsing non-essential elements
        this.simplifyUI();
        
        // Optimize form layouts
        this.optimizeForms();
        
        // Ensure proper stacking of elements
        this.ensureProperStacking();
    }
    
    simplifyUI() {
        // Identify elements that could be simplified on mobile
        const longLabels = document.querySelectorAll('.btn span, .nav a span');
        longLabels.forEach(label => {
            if (label.textContent.length > 10) {
                label.setAttribute('data-full-text', label.textContent);
                label.textContent = label.textContent.substring(0, 7) + '...';
            }
        });
        
        // Collapse long form instructions
        const instructions = document.querySelectorAll('.form-description, .section-description');
        instructions.forEach(instruction => {
            if (instruction.textContent.length > 100) {
                const originalText = instruction.innerHTML;
                instruction.innerHTML = `${instruction.innerHTML.substring(0, 100)}... <button class="btn-show-more">Show more</button>`;
                
                const showMoreBtn = instruction.querySelector('.btn-show-more');
                let expanded = false;
                
                showMoreBtn.addEventListener('click', () => {
                    if (expanded) {
                        instruction.innerHTML = `${originalText.substring(0, 100)}... <button class="btn-show-more">Show more</button>`;
                        expanded = false;
                    } else {
                        instruction.innerHTML = `${originalText} <button class="btn-show-more">Show less</button>`;
                        expanded = true;
                    }
                    
                    // Re-attach event listener to the new button
                    instruction.querySelector('.btn-show-more').addEventListener('click', () => {
                        expanded = !expanded;
                        if (expanded) {
                            instruction.innerHTML = `${originalText} <button class="btn-show-more">Show less</button>`;
                        } else {
                            instruction.innerHTML = `${originalText.substring(0, 100)}... <button class="btn-show-more">Show more</button>`;
                        }
                    });
                });
            }
        });
    }
    
    optimizeForms() {
        // Convert horizontal forms to vertical layout on mobile
        document.querySelectorAll('.form-row').forEach(formRow => {
            formRow.classList.add('mobile-vertical');
        });
        
        // Ensure proper input field sizes
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.classList.add('mobile-field');
        });
    }
    
    ensureProperStacking() {
        // Make sure elements stack properly on small screens
        document.querySelectorAll('.stats-container, .dashboard-charts, .analytics-grid').forEach(container => {
            container.classList.add('mobile-stack');
        });
    }
    
    createMobileNavDrawer() {
        // Only create mobile drawer if we don't have one yet
        if (document.getElementById('mobile-drawer') || !document.querySelector('nav ul')) {
            return;
        }
        
        // Create mobile drawer toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'mobile-drawer-toggle';
        toggleButton.className = 'mobile-drawer-toggle';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Add toggle button to the header
        const header = document.querySelector('header');
        if (header) {
            const existingNav = header.querySelector('nav');
            if (existingNav) {
                existingNav.insertBefore(toggleButton, existingNav.firstChild);
            } else {
                header.appendChild(toggleButton);
            }
        } else {
            document.body.insertBefore(toggleButton, document.body.firstChild);
        }
        
        // Create mobile drawer
        const drawer = document.createElement('div');
        drawer.id = 'mobile-drawer';
        drawer.className = 'mobile-drawer';
        
        // Clone navigation items into drawer
        const navItems = document.querySelector('nav ul');
        if (navItems) {
            drawer.innerHTML = `
                <div class="drawer-header">
                    <h3>Menu</h3>
                    <button class="drawer-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="drawer-content">
                    ${navItems.outerHTML}
                </div>
            `;
        }
        
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'mobile-drawer-backdrop';
        backdrop.className = 'mobile-drawer-backdrop';
        
        // Add drawer and backdrop to body
        document.body.appendChild(drawer);
        document.body.appendChild(backdrop);
        
        // Add close drawer event
        const closeBtn = drawer.querySelector('.drawer-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeNavDrawer());
        }
        
        // Add click handlers for navigation items
        const drawerLinks = drawer.querySelectorAll('a[data-section]');
        drawerLinks.forEach(link => {
            link.addEventListener('click', () => this.closeNavDrawer());
        });
    }
    
    toggleNavDrawer() {
        const drawer = document.getElementById('mobile-drawer');
        const backdrop = document.getElementById('mobile-drawer-backdrop');
        
        if (drawer && backdrop) {
            drawer.classList.toggle('active');
            backdrop.classList.toggle('active');
            
            // Prevent body scrolling when drawer is open
            if (drawer.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }
    
    closeNavDrawer() {
        const drawer = document.getElementById('mobile-drawer');
        const backdrop = document.getElementById('mobile-drawer-backdrop');
        
        if (drawer && backdrop) {
            drawer.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    preventDoubleTapZoom() {
        // Use this approach carefully as it can affect accessibility
        const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (touchEnabled && isIOS) {
            // Add a small delay to click events to prevent zoom on double tap
            document.addEventListener('click', function(e) {
                if (e.target instanceof HTMLButtonElement || 
                    e.target instanceof HTMLAnchorElement || 
                    e.target.closest('button') || 
                    e.target.closest('a')) {
                    e.preventDefault();
                    
                    setTimeout(() => {
                        if (e.target instanceof HTMLAnchorElement && e.target.href) {
                            window.location.href = e.target.href;
                        } else if (e.target.click) {
                            e.target.click();
                        }
                    }, 100);
                }
            });
        }
    }
    
    addStyles(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
}

// Initialize mobile optimization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
});