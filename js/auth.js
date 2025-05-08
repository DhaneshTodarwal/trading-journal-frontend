// filepath: /home/dhanesh-todarwal/TRADING-JOURNAL-CODE/FILE 1 EDITING/js/auth.js

// --- Configuration ---
const API_BASE_URL = 'https://trading-journal-backend-ln3p.onrender.com/api'; // Updated to deployed backend

// --- DOM Element References (from login.html) ---
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const loginErrorMsg = document.getElementById('login-error');
const signupErrorMsg = document.getElementById('signup-error');
const forgotPasswordLink = document.getElementById('forgot-password-link');

// --- Function to display error messages with animation ---
function displayError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
        
        // Add animation effect if showing an error
        if (message) {
            // Reset animation by removing and re-adding class
            element.classList.remove('shake-animation');
            void element.offsetWidth; // Trigger reflow to restart animation
            element.classList.add('shake-animation');
        }
    }
}

// --- UI Toggle Functions (with smooth animations) ---
function showLoginView() {
    // Add transition class to elements
    signupView.classList.add('hidden');
    
    // Delay showing login view slightly for better animation effect
    setTimeout(() => {
        loginView.style.display = 'block';
        loginView.classList.remove('hidden');
        signupView.style.display = 'none';
    }, 300);
    
    // Clear errors and form
    displayError(signupErrorMsg, '');
    if (loginForm) loginForm.reset();
    
    // Focus on email field
    setTimeout(() => {
        const emailField = document.getElementById('login-email');
        if (emailField) emailField.focus();
    }, 500);
}

function showSignupView() {
    // Add transition class to elements  
    loginView.classList.add('hidden');
    
    // Delay showing signup view slightly for better animation effect
    setTimeout(() => {
        signupView.style.display = 'block';
        signupView.classList.remove('hidden');
        loginView.style.display = 'none';
    }, 300);
    
    // Clear errors and form
    displayError(loginErrorMsg, '');
    if (signupForm) signupForm.reset();
    
    // Focus on email field
    setTimeout(() => {
        const emailField = document.getElementById('signup-email');
        if (emailField) emailField.focus();
    }, 500);
}

// --- Authentication API Calls ---
async function handleSignup(event) {
    event.preventDefault();
    displayError(signupErrorMsg, '');
    
    // Add loading state to button
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitButton.disabled = true;
    
    const emailElement = document.getElementById('signup-email');
    const passwordElement = document.getElementById('signup-password');

    if (!emailElement || !passwordElement) return; // Elements not found

    const email = emailElement.value;
    const password = passwordElement.value;

    if (!email || !password) {
        displayError(signupErrorMsg, 'Email and password are required.');
        resetButton(submitButton, originalText);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (!response.ok) { 
            throw new Error(data.msg || `HTTP error! status: ${response.status}`); 
        }

        // Signup SUCCESS: Store token and redirect to main app
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        
        // Show success before redirect
        submitButton.innerHTML = '<i class="fas fa-check"></i> Success!';
        submitButton.style.background = 'var(--success-gradient)';
        
        // Redirect after brief delay to show success state
        setTimeout(() => {
            window.location.href = 'index.html'; // Redirect to the main journal page
        }, 1000);

    } catch (error) {
        console.error('Signup failed:', error);
        displayError(signupErrorMsg, `Signup failed: ${error.message}`);
        resetButton(submitButton, originalText);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    displayError(loginErrorMsg, '');
    
    // Add loading state to button
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitButton.disabled = true;
    
    const emailElement = document.getElementById('login-email');
    const passwordElement = document.getElementById('login-password');

    if (!emailElement || !passwordElement) return; // Elements not found

    const email = emailElement.value;
    const password = passwordElement.value;

    if (!email || !password) {
        displayError(loginErrorMsg, 'Email and password are required.');
        resetButton(submitButton, originalText);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (!response.ok) { 
            throw new Error(data.msg || `HTTP error! status: ${response.status}`); 
        }

        // Login SUCCESS: Store token and redirect to main app
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        
        // Show success before redirect
        submitButton.innerHTML = '<i class="fas fa-check"></i> Success!';
        submitButton.style.background = 'var(--primary-gradient)';
        
        // Redirect after brief delay to show success state
        setTimeout(() => {
            window.location.href = 'index.html'; // Redirect to the main journal page
        }, 1000);

    } catch (error) {
        console.error('Login failed:', error);
        displayError(loginErrorMsg, `Login failed: ${error.message}`);
        resetButton(submitButton, originalText);
    }
}

// Helper function to reset button state
function resetButton(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

// --- Placeholder for Forgot Password ---
function handleForgotPassword(event) {
    event.preventDefault();
    // Show a toast/notification instead of alert
    showToast('Password reset feature coming soon!', 'info');
    
    // *Backend Implementation Required*
    // This function would ideally:
    // 1. Prompt the user for their email (maybe in a modal or new view)
    // 2. Send the email to a new backend endpoint (e.g., /api/auth/forgot-password)
    // 3. The backend would generate a reset token and send a reset email
}

// Simple toast notification function
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'info' ? 'fa-info-circle' : type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 5000);
    
    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    });
}

// --- Add Animation to Input Fields ---
function setupInputAnimations() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // When user clicks into an input
        input.addEventListener('focus', () => {
            // Add focus class to parent form-group for styling
            input.parentElement.classList.add('input-focused');
        });
        
        // When user leaves an input
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('input-focused');
        });
    });
}

// --- Event Listeners (for login.html) ---
document.addEventListener('DOMContentLoaded', () => {
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (showSignupBtn) showSignupBtn.addEventListener('click', showSignupView);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginView);
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', handleForgotPassword);

    // Setup input animations
    setupInputAnimations();
    
    // Show login view by default when page loads
    // We need a small delay to allow animations to work properly
    setTimeout(() => {
        showLoginView();
    }, 100);
    
    // Add CSS for toast notifications
    addToastStyles();
});

// Add toast notification styles
function addToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            color: #333;
            padding: 12px 15px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 250px;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 9999;
        }
        
        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .toast-content i {
            font-size: 20px;
        }
        
        .toast-info i {
            color: #3498db;
        }
        
        .toast-success i {
            color: #2ecc71;
        }
        
        .toast-error i {
            color: #e74c3c;
        }
        
        .toast-close {
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
            transition: color 0.3s;
        }
        
        .toast-close:hover {
            color: #333;
        }
        
        .shake-animation {
            animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }
    `;
    document.head.appendChild(style);
}