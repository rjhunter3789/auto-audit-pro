/*
 * Auto Audit Pro - Smart Location Finder Module
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Finds and analyzes dealer location pages
 */

const cheerio = require('cheerio');

// Common patterns for location/store finder pages
const LOCATION_PAGE_PATTERNS = [
    // Text patterns to look for in links
    'our locations',
    'store locations',
    'find a dealer',
    'dealer locator',
    'locate a dealership',
    'find a store',
    'find a location',
    'all locations',
    'view all locations',
    'dealership locations',
    'our dealerships',
    'our stores',
    'location finder',
    'store finder',
    'dealer finder',
    'where to buy',
    'find us',
    'visit us',
    'locations map',
    'store directory',
    'dealership directory'
];

// URL patterns that typically lead to location pages
const LOCATION_URL_PATTERNS = [
    '/locations',
    '/stores',
    '/dealers',
    '/dealerships',
    '/our-locations',
    '/our-stores',
    '/our-dealers',
    '/store-locator',
    '/dealer-locator',
    '/location-finder',
    '/find-a-dealer',
    '/find-a-store',
    '/where-to-buy',
    '/dealership-locations',
    '/store-directory',
    '/dealer-directory'
];

class LocationFinder {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Find the main locations page from homepage HTML
     */
    findLocationPage($) {
        console.log('[LocationFinder] Searching for location page...');
        
        let locationPageUrl = null;
        let confidence = 0;
        
        // Check all links on the page
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().toLowerCase().trim();
            
            if (!href) return;
            
            // Check text patterns
            for (const pattern of LOCATION_PAGE_PATTERNS) {
                if (text === pattern || text.includes(pattern)) {
                    console.log(`[LocationFinder] Found potential location link: "${text}" -> ${href}`);
                    locationPageUrl = this.makeAbsoluteUrl(href);
                    confidence = text === pattern ? 100 : 80;
                    return false; // Break from jQuery each
                }
            }
            
            // Check URL patterns
            const hrefLower = href.toLowerCase();
            for (const pattern of LOCATION_URL_PATTERNS) {
                if (hrefLower === pattern || hrefLower.endsWith(pattern)) {
                    console.log(`[LocationFinder] Found location URL pattern: ${href}`);
                    if (!locationPageUrl || confidence < 70) {
                        locationPageUrl = this.makeAbsoluteUrl(href);
                        confidence = 70;
                    }
                }
            }
        });
        
        return {
            url: locationPageUrl,
            confidence: confidence
        };
    }

    /**
     * Extract location count from a locations page
     */
    extractLocationCount($) {
        console.log('[LocationFinder] Extracting location count from page...');
        
        let count = 0;
        
        // Method 1: Look for explicit count statements
        const countPatterns = [
            /(\d+)\+?\s*(locations?|stores?|dealerships?)\s*(nationwide|across|in)/i,
            /over\s*(\d+)\s*(locations?|stores?|dealerships?)/i,
            /(\d+)\s*automotive\s*(locations?|stores?|dealerships?)/i,
            /operates?\s*(\d+)\s*(locations?|stores?|dealerships?)/i,
            /(\d+)\s*franchise\s*(locations?|stores?|dealerships?)/i
        ];
        
        const bodyText = $('body').text();
        for (const pattern of countPatterns) {
            const match = bodyText.match(pattern);
            if (match) {
                count = parseInt(match[1]);
                console.log(`[LocationFinder] Found count via text pattern: ${count}`);
                break;
            }
        }
        
        // Method 2: Count location cards/items
        if (count === 0) {
            const locationSelectors = [
                '.location-card',
                '.dealer-card',
                '.store-card',
                '.location-item',
                '.dealer-item',
                '.store-item',
                '[class*="location-result"]',
                '[class*="dealer-result"]',
                '[class*="store-result"]',
                '.location-listing',
                '.dealer-listing',
                '.store-listing'
            ];
            
            for (const selector of locationSelectors) {
                const items = $(selector);
                if (items.length > count) {
                    count = items.length;
                    console.log(`[LocationFinder] Found ${count} items via selector: ${selector}`);
                }
            }
        }
        
        // Method 3: Count links that look like individual locations
        if (count === 0) {
            const locationLinks = [];
            $('a[href]').each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim();
                
                // Look for patterns like "Honda of Seattle" or "AutoNation Ford White Bear Lake"
                if (text.match(/^[A-Z][\w\s&'-]*(Honda|Ford|Toyota|Chevrolet|Nissan|BMW|Mercedes|Mazda|Hyundai|Kia|Volkswagen|Audi|Lexus|Acura|Infiniti|Volvo|Subaru|Jeep|Ram|Dodge|Chrysler|GMC|Buick|Cadillac|Lincoln|Mitsubishi)\s*(of|in|-)\s*[A-Z]/i)) {
                    locationLinks.push(text);
                }
            });
            
            if (locationLinks.length > 0) {
                count = locationLinks.length;
                console.log(`[LocationFinder] Found ${count} dealer name patterns`);
            }
        }
        
        return count;
    }

    /**
     * Extract state coverage from locations page
     */
    extractStateCoverage($) {
        const states = new Set();
        
        // Look for state names in various contexts
        const stateNames = [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
            'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
            'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
            'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
            'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
            'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
            'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
            'Wisconsin', 'Wyoming'
        ];
        
        const bodyText = $('body').text();
        
        // Look for states in text
        stateNames.forEach(state => {
            if (bodyText.includes(state)) {
                states.add(state);
            }
        });
        
        // Also check for state links
        $('a').each((i, elem) => {
            const text = $(elem).text().trim();
            const href = $(elem).attr('href') || '';
            
            stateNames.forEach(state => {
                if (text === state || href.toLowerCase().includes(state.toLowerCase().replace(' ', '-'))) {
                    states.add(state);
                }
            });
        });
        
        return Array.from(states);
    }

    makeAbsoluteUrl(href) {
        if (!href) return null;
        
        try {
            if (href.startsWith('http')) {
                return href;
            } else if (href.startsWith('//')) {
                return 'https:' + href;
            } else if (href.startsWith('/')) {
                return new URL(href, this.baseUrl).href;
            } else {
                return new URL(href, this.baseUrl).href;
            }
        } catch (e) {
            console.log(`[LocationFinder] Invalid URL: ${href}`);
            return null;
        }
    }
}

module.exports = LocationFinder;