// Fix for double slash issue in frontend
// This script will be injected to fix the double slash problem

(function() {
    'use strict';
    
    // Override fetch to fix double slashes
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // Fix double slashes in URL
        if (typeof url === 'string') {
            url = url.replace(/\/\/+/g, '/');
            // Ensure protocol is preserved
            if (url.startsWith('https:/') && !url.startsWith('https://')) {
                url = url.replace('https:/', 'https://');
            }
        }
        
        console.log('Fixed URL:', url);
        return originalFetch.call(this, url, options);
    };
    
    // Override XMLHttpRequest to fix double slashes
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        // Fix double slashes in URL
        if (typeof url === 'string') {
            url = url.replace(/\/\/+/g, '/');
            // Ensure protocol is preserved
            if (url.startsWith('https:/') && !url.startsWith('https://')) {
                url = url.replace('https:/', 'https://');
            }
        }
        
        console.log('Fixed XHR URL:', url);
        return originalXHROpen.call(this, method, url, ...args);
    };
    
    console.log('Double slash fix applied');
})();
