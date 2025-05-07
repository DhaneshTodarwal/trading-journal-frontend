// Screenshot Upload Debugging Script

document.addEventListener('DOMContentLoaded', function() {
    console.log('Screenshot Debug: Script loaded');
    
    // Check if the necessary elements exist
    const uploadArea = document.getElementById('upload-area');
    const screenshotInput = document.getElementById('screenshot');
    const previewArea = document.getElementById('screenshot-preview');
    
    console.log('Screenshot Debug: Element check', {
        uploadAreaExists: !!uploadArea,
        screenshotInputExists: !!screenshotInput,
        previewAreaExists: !!previewArea
    });
    
    // Add additional click handler to upload area for debugging
    if (uploadArea) {
        uploadArea.addEventListener('click', function(e) {
            console.log('Screenshot Debug: Upload area clicked', e);
        });
    }
    
    // Add change handler to file input for debugging
    if (screenshotInput) {
        screenshotInput.addEventListener('change', function(e) {
            console.log('Screenshot Debug: Input changed, files:', e.target.files);
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                console.log('Screenshot Debug: File selected', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
            }
        });
    }
    
    // Test if processScreenshot function is accessible and working
    if (typeof processScreenshot === 'function') {
        console.log('Screenshot Debug: processScreenshot function exists');
    } else {
        console.error('Screenshot Debug: processScreenshot function not found');
    }
    
    // Periodically check if the elements are visible and have correct styles
    setTimeout(function checkElementVisibility() {
        if (uploadArea) {
            const uploadAreaStyles = window.getComputedStyle(uploadArea);
            console.log('Screenshot Debug: Upload area styles', {
                display: uploadAreaStyles.display,
                visibility: uploadAreaStyles.visibility,
                position: uploadAreaStyles.position,
                zIndex: uploadAreaStyles.zIndex,
                width: uploadAreaStyles.width,
                height: uploadAreaStyles.height
            });
        }
        
        if (screenshotInput) {
            const inputStyles = window.getComputedStyle(screenshotInput);
            console.log('Screenshot Debug: Input styles', {
                display: inputStyles.display,
                visibility: inputStyles.visibility,
                position: inputStyles.position
            });
        }
    }, 2000);
    
    // Log any existing CSS that might be affecting the screenshot uploader
    const relevantSelectors = [
        '.screenshot-uploader', 
        '#upload-area', 
        '#screenshot', 
        '#screenshot-preview',
        '.upload-area',
        '.file-upload-label',
        '.file-upload input[type="file"]'
    ];
    
    console.log('Screenshot Debug: Checking for CSS styles that might affect the uploader');
    
    for (const selector of relevantSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            console.log(`Screenshot Debug: Found ${elements.length} elements matching '${selector}'`);
        } catch (e) {
            console.error(`Screenshot Debug: Error querying for '${selector}'`, e);
        }
    }
    
    // Fix attempt: Directly add click handler to upload area
    if (uploadArea) {
        console.log('Screenshot Debug: Adding direct click handler');
        uploadArea.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Screenshot Debug: Direct click handler fired');
            if (screenshotInput) {
                screenshotInput.click();
            }
        };
    }
});

// Add this function to the global scope to test screenshot handling
window.testScreenshotUpload = function() {
    console.log('Screenshot Debug: Testing manual screenshot function');
    const screenshotInput = document.getElementById('screenshot');
    
    if (!screenshotInput) {
        console.error('Screenshot Debug: Screenshot input element not found');
        return;
    }
    
    // Create a test click event
    try {
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        
        screenshotInput.dispatchEvent(clickEvent);
        console.log('Screenshot Debug: Click event dispatched to screenshot input');
    } catch (e) {
        console.error('Screenshot Debug: Error dispatching click event', e);
    }
};