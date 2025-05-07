// Screenshot Upload Functionality
class ScreenshotUploader {
    constructor() {
        this.uploadArea = document.getElementById('upload-area');
        this.screenshotInput = document.getElementById('screenshot');
        this.previewArea = document.getElementById('screenshot-preview');
        
        if (!this.uploadArea || !this.screenshotInput || !this.previewArea) {
            console.warn('Screenshot uploader elements not found. Skipping initialization.');
            return;
        }
        
        this.init();
    }
    
    init() {
        // Click on upload area to trigger file input
        this.uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            this.screenshotInput.click();
        });
        
        // File selected through input
        this.screenshotInput.addEventListener('change', () => {
            if (this.screenshotInput.files && this.screenshotInput.files.length > 0) {
                this.handleFiles(this.screenshotInput.files);
            }
        });
        
        // Drag and drop functionality
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.handleFiles(e.dataTransfer.files);
            }
        });
    }
    
    handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.match('image.*')) {
            this.showError('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewArea.innerHTML = `
                <div class="screenshot-preview-container">
                    <img src="${e.target.result}" alt="Trade Screenshot">
                    <div class="remove-screenshot"><i class="fas fa-times"></i></div>
                </div>
            `;
            this.previewArea.style.display = 'block';
            
            // Add remove functionality
            const removeBtn = this.previewArea.querySelector('.remove-screenshot');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.previewArea.innerHTML = '';
                    this.previewArea.style.display = 'none';
                    this.screenshotInput.value = '';
                });
            }
        };
        reader.readAsDataURL(file);
    }
    
    getScreenshot() {
        if (this.previewArea.style.display === 'block' && this.previewArea.querySelector('img')) {
            return this.previewArea.querySelector('img').src;
        }
        return null;
    }
    
    reset() {
        if (this.previewArea) {
            this.previewArea.innerHTML = '';
            this.previewArea.style.display = 'none';
        }
        
        if (this.screenshotInput) {
            this.screenshotInput.value = '';
        }
    }
    
    showError(message) {
        // Check if notification function exists
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Initialize screenshot uploader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.screenshotUploader = new ScreenshotUploader();
});