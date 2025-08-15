/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

// CSP Fix Script - Include this at the very top of your HTML pages
(function() {
    'use strict';
    
    // Function to remove CSP meta tags
    function removeCSPMeta() {
        const metas = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
        metas.forEach(meta => {
            console.warn('[CSP Fix] Removing restrictive CSP:', meta.content);
            meta.parentNode.removeChild(meta);
        });
    }
    
    // Remove immediately
    removeCSPMeta();
    
    // Set up observer to catch any dynamically added CSP meta tags
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && // Element node
                            node.tagName === 'META' && 
                            node.getAttribute('http-equiv') === 'Content-Security-Policy') {
                            console.warn('[CSP Fix] Blocked CSP injection attempt:', node.content);
                            node.parentNode.removeChild(node);
                        }
                    });
                }
            });
        });
        
        // Start observing the entire document
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
    
    // Also try to intercept meta tag creation
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'meta') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name === 'http-equiv' && value === 'Content-Security-Policy') {
                    console.warn('[CSP Fix] Blocked CSP meta creation');
                    return; // Don't set the attribute
                }
                return originalSetAttribute.call(element, name, value);
            };
        }
        
        return element;
    };
    
    // Check again after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeCSPMeta);
    } else {
        removeCSPMeta();
    }
})();