/**
 * User Profile System for Trading Journal
 * Handles user profile dropdown, modals, and related functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initUserProfile();
});

/**
 * Initialize the user profile system
 */
function initUserProfile() {
    // Set up event listeners
    setupProfileDropdown();
    setupProfileModal();
    setupPasswordModal();
    loadUserInfo();
    
    // Update user stats in profile modal
    updateUserStats();
}

/**
 * Set up profile dropdown functionality
 */
function setupProfileDropdown() {
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Toggle dropdown
    profileTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!profileDropdown.contains(e.target) && !profileTrigger.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });
    
    // Profile button actions
    viewProfileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openProfileModal();
        profileDropdown.classList.remove('active');
    });
    
    changePasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openPasswordModal();
        profileDropdown.classList.remove('active');
    });
    
    settingsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Navigate to settings section
        const settingsSection = document.querySelector('a[data-section="settings"]');
        if (settingsSection) {
            settingsSection.click();
        }
        profileDropdown.classList.remove('active');
    });
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleLogout();
    });
}

/**
 * Set up profile modal functionality
 */
function setupProfileModal() {
    const profileModal = document.getElementById('profile-modal');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const profileChangePassword = document.getElementById('profile-change-password');
    const profileEditSettings = document.getElementById('profile-edit-settings');
    const profileLogout = document.getElementById('profile-logout');
    
    closeProfileModal.addEventListener('click', function() {
        profileModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
    
    // Profile modal buttons
    profileChangePassword.addEventListener('click', function() {
        profileModal.style.display = 'none';
        openPasswordModal();
    });
    
    profileEditSettings.addEventListener('click', function() {
        profileModal.style.display = 'none';
        // Navigate to settings section
        const settingsSection = document.querySelector('a[data-section="settings"]');
        if (settingsSection) {
            settingsSection.click();
        }
    });
    
    profileLogout.addEventListener('click', function() {
        handleLogout();
    });
}

/**
 * Set up password change modal functionality
 */
function setupPasswordModal() {
    const passwordModal = document.getElementById('password-modal');
    const closePasswordModal = document.getElementById('close-password-modal');
    const changePasswordForm = document.getElementById('change-password-form');
    const cancelPasswordChange = document.getElementById('cancel-password-change');
    const passwordError = document.getElementById('password-error');
    
    closePasswordModal.addEventListener('click', function() {
        passwordModal.style.display = 'none';
        resetPasswordForm();
    });
    
    cancelPasswordChange.addEventListener('click', function() {
        passwordModal.style.display = 'none';
        resetPasswordForm();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === passwordModal) {
            passwordModal.style.display = 'none';
            resetPasswordForm();
        }
    });
    
    // Handle password form submission
    changePasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate passwords
        if (!currentPassword || !newPassword || !confirmPassword) {
            showPasswordError('All fields are required');
            return;
        }
        
        if (newPassword.length < 6) {
            showPasswordError('New password must be at least 6 characters');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showPasswordError('New passwords do not match');
            return;
        }
        
        // Simulate password change (replace with actual implementation)
        // For demo purposes, we'll just show success
        passwordModal.style.display = 'none';
        resetPasswordForm();
        showToast('Password Updated', 'Your password has been changed successfully', 'success');
    });
    
    function showPasswordError(message) {
        passwordError.textContent = message;
        passwordError.style.display = 'block';
    }
    
    function resetPasswordForm() {
        changePasswordForm.reset();
        passwordError.style.display = 'none';
    }
}

/**
 * Load user information from localStorage or defaults
 */
function loadUserInfo() {
    // Get user info from localStorage or use default values
    const userInfo = getUserInfo();
    
    // Set the user initials
    const userInitials = getUserInitials(userInfo.name);
    document.getElementById('user-initials').textContent = userInitials;
    document.getElementById('user-initials-large').textContent = userInitials;
    document.getElementById('modal-user-initials').textContent = userInitials;
    
    // Set user name
    document.getElementById('user-display-name').textContent = userInfo.name;
    document.getElementById('user-full-name').textContent = userInfo.name;
    document.getElementById('modal-user-email').textContent = userInfo.email;
    
    // Set member since date
    document.getElementById('member-since').textContent = formatDate(userInfo.memberSince);
}

/**
 * Get user information from localStorage
 * @returns {Object} User information object
 */
function getUserInfo() {
    const storedUser = localStorage.getItem('userInfo');
    
    if (storedUser) {
        return JSON.parse(storedUser);
    } else {
        // Default user info if none exists
        const defaultUser = {
            name: 'Trading User',
            email: 'user@example.com',
            memberSince: new Date().toISOString().slice(0, 10)
        };
        
        // Save default user to localStorage
        localStorage.setItem('userInfo', JSON.stringify(defaultUser));
        return defaultUser;
    }
}

/**
 * Get user initials from name
 * @param {string} name - User's full name
 * @returns {string} User's initials
 */
function getUserInitials(name) {
    if (!name) return 'U';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
    } else {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
}

/**
 * Format date in a readable format
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Update user trading statistics in the profile modal
 */
function updateUserStats() {
    // Get trades from localStorage
    const trades = getTrades();
    
    // Calculate statistics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => parseFloat(trade.actualProfit) > 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
    
    const totalProfit = trades.reduce((sum, trade) => sum + parseFloat(trade.actualProfit), 0).toFixed(2);
    
    // Calculate accuracy (how close actual profit was to target)
    let accuracyCount = 0;
    let accuracySum = 0;
    
    trades.forEach(trade => {
        if (trade.target && trade.actualProfit) {
            const targetProfit = parseFloat(trade.target);
            const actualProfit = parseFloat(trade.actualProfit);
            if (!isNaN(targetProfit) && !isNaN(actualProfit) && targetProfit !== 0) {
                accuracyCount++;
                const accuracy = Math.min(100, Math.max(0, (1 - Math.abs((targetProfit - actualProfit) / targetProfit)) * 100));
                accuracySum += accuracy;
            }
        }
    });
    
    const avgAccuracy = accuracyCount > 0 ? (accuracySum / accuracyCount).toFixed(1) : 0;
    
    // Update the UI
    document.getElementById('total-trades').textContent = totalTrades;
    document.getElementById('win-rate').textContent = winRate + '%';
    document.getElementById('total-profit').textContent = '₹' + totalProfit;
    document.getElementById('accuracy').textContent = avgAccuracy + '%';
}

/**
 * Get trades from localStorage
 * @returns {Array} Array of trade objects
 */
function getTrades() {
    const storedTrades = localStorage.getItem('trades');
    return storedTrades ? JSON.parse(storedTrades) : [];
}

/**
 * Open the profile modal
 */
function openProfileModal() {
    const profileModal = document.getElementById('profile-modal');
    updateUserStats(); // Update latest stats before showing
    profileModal.style.display = 'block';
}

/**
 * Open the password change modal
 */
function openPasswordModal() {
    const passwordModal = document.getElementById('password-modal');
    passwordModal.style.display = 'block';
}

/**
 * Handle user logout
 */
function handleLogout() {
    // For demonstration, just show a toast notification
    // In a real app, this would handle auth token removal, etc.
    showToast('Logged Out', 'You have been logged out successfully', 'info');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

/**
 * Show a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 */
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Create toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${getToastIcon(type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <span class="toast-close">&times;</span>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add event listener to close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, 5000);
}

/**
 * Get the appropriate icon for toast type
 * @param {string} type - Toast type
 * @returns {string} Icon class
 */
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}