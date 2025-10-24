/**
 * Console Errors Fix for Production
 * This script fixes double slash issues and other console errors
 */

(function() {
    'use strict';
    
    console.log('🔧 Applying console errors fix...');
    
    // Fix 1: Double Slash Issue
    function fixDoubleSlash() {
        // Override fetch to fix double slashes
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string') {
                const originalUrl = url;
                // Fix ONLY double slashes that are NOT part of protocol (http:// or https://)
                // Replace multiple slashes but preserve the protocol slashes
                url = url.replace(/([^:]\/)\/+/g, '$1');
                if (originalUrl !== url) {
                    console.log(`🔧 Fixed double slash: ${originalUrl} -> ${url}`);
                }
            }
            return originalFetch.call(this, url, options);
        };
        
        // Override XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (typeof url === 'string') {
                const originalUrl = url;
                // Fix ONLY double slashes that are NOT part of protocol
                url = url.replace(/([^:]\/)\/+/g, '$1');
                if (originalUrl !== url) {
                    console.log(`🔧 Fixed XHR double slash: ${originalUrl} -> ${url}`);
                }
            }
            return originalXHROpen.call(this, method, url, ...args);
        };
        
        console.log('✅ Double slash fix applied');
    }
    
    // Fix 2: Error Handling Enhancement
    function enhanceErrorHandling() {
        // Override console.error to provide better error messages
        const originalConsoleError = console.error;
        console.error = function(...args) {
            // Check for common error patterns
            const message = args.join(' ');
            if (message.includes('404') && message.includes('api//')) {
                console.warn('🔧 Detected double slash in API call - this should be fixed by the fetch override');
            }
            if (message.includes('400') && message.includes('auth/login')) {
                console.warn('🔧 Authentication error detected - check credentials and backend status');
            }
            return originalConsoleError.apply(this, args);
        };
        
        console.log('✅ Error handling enhanced');
    }
    
    // Fix 3: API Client Enhancement
    function enhanceApiClient() {
        // Add global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            console.warn('🔧 Unhandled promise rejection:', event.reason);
            
            // Check if it's an API error
            if (event.reason && typeof event.reason === 'object') {
                if (event.reason.message && event.reason.message.includes('404')) {
                    console.warn('🔧 404 error detected - check if URL has double slashes');
                }
                if (event.reason.message && event.reason.message.includes('400')) {
                    console.warn('🔧 400 error detected - check authentication or request format');
                }
            }
        });
        
        console.log('✅ API client enhanced');
    }
    
    // Apply all fixes
    fixDoubleSlash();
    enhanceErrorHandling();
    enhanceApiClient();
    
    console.log('🎯 Console errors fix applied successfully!');
    
    // Monitor for any remaining issues
    window.addEventListener('error', function(event) {
        console.warn('🔧 JavaScript error detected:', event.message);
    });
    
})();
