/*
 * Auto Audit Pro - Dealer Group Analysis Module
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Specialized analysis for dealer group websites
 */

const { By, until } = require('selenium-webdriver');
const cheerio = require('cheerio');
const axios = require('axios');

// Patterns to identify dealer group sites
const GROUP_PATTERNS = {
    navigation: [
        'our locations', 'our dealerships', 'our stores', 'locations',
        'find a dealer', 'dealer locator', 'our brands', 'dealership locations'
    ],
    urls: [
        '/locations', '/dealerships', '/our-stores', '/dealers',
        '/find-a-dealer', '/where-to-buy', '/our-locations'
    ],
    content: [
        'family of dealerships', 'automotive group', 'dealer group',
        'multiple locations', 'serving .* with .* locations'
    ]
};

// Group-specific tests
async function runGroupTests($, url, driver = null) {
    const tests = [];
    const issues = [];
    let score = 0;
    const maxScore = 10;

    // Test 1: Location Directory
    const locationDirectory = await testLocationDirectory($, url);
    tests.push(locationDirectory.test);
    if (locationDirectory.score > 0) {
        score += locationDirectory.score;
    } else if (locationDirectory.issue) {
        issues.push(locationDirectory.issue);
    }

    // Test 2: Brand Representation
    const brandTest = testBrandRepresentation($);
    tests.push(brandTest.test);
    score += brandTest.score;
    if (brandTest.issue) issues.push(brandTest.issue);

    // Test 3: Group Information
    const groupInfo = testGroupInformation($);
    tests.push(groupInfo.test);
    score += groupInfo.score;
    if (groupInfo.issue) issues.push(groupInfo.issue);

    // Test 4: Contact Consistency
    const contactTest = testContactConsistency($);
    tests.push(contactTest.test);
    score += contactTest.score;
    if (contactTest.issue) issues.push(contactTest.issue);

    // Test 5: Navigation Structure
    const navTest = testNavigationStructure($);
    tests.push(navTest.test);
    score += navTest.score;
    if (navTest.issue) issues.push(navTest.issue);

    return {
        score: Math.round((score / maxScore) * 100),
        tests,
        issues,
        maxScore
    };
}

async function testLocationDirectory($, url) {
    // Find location/dealership links
    const locationLinks = [];
    const selectors = [
        'a[href*="location"]',
        'a[href*="dealer"]',
        '.location-card a',
        '.dealer-card a',
        '[class*="location"] a',
        '[class*="dealer"] a'
    ];

    selectors.forEach(selector => {
        $(selector).each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            if (href && text && !locationLinks.find(l => l.href === href)) {
                locationLinks.push({ href, text });
            }
        });
    });

    // Also check for common patterns in text
    $('a').each((i, elem) => {
        const text = $(elem).text().toLowerCase();
        const href = $(elem).attr('href');
        if (href && (text.includes('ford') || text.includes('chevrolet') || 
            text.includes('toyota') || text.includes('honda') ||
            text.includes('nissan') || text.includes('chrysler'))) {
            if (!locationLinks.find(l => l.href === href)) {
                locationLinks.push({ href, text: $(elem).text().trim() });
            }
        }
    });

    if (locationLinks.length >= 3) {
        return {
            test: { name: 'Location Directory', value: `${locationLinks.length} locations found` },
            score: 2,
            locations: locationLinks
        };
    } else if (locationLinks.length > 0) {
        return {
            test: { name: 'Location Directory', value: `Only ${locationLinks.length} locations found` },
            score: 1,
            issue: {
                title: 'Limited location visibility',
                details: 'Consider creating a dedicated locations page with all dealerships clearly listed',
                priority: 'medium',
                category: 'Group Structure'
            },
            locations: locationLinks
        };
    } else {
        return {
            test: { name: 'Location Directory', value: 'No clear location directory found' },
            score: 0,
            issue: {
                title: 'No location directory found',
                details: 'Add a clear "Our Locations" or "Our Dealerships" page listing all locations',
                priority: 'high',
                category: 'Group Structure'
            },
            locations: []
        };
    }
}

function testBrandRepresentation($) {
    const brands = new Set();
    const brandLogos = [];

    // Look for brand logos/images
    $('img').each((i, elem) => {
        const src = $(elem).attr('src') || '';
        const alt = $(elem).attr('alt') || '';
        const brandNames = ['ford', 'chevrolet', 'toyota', 'honda', 'nissan', 
                          'chrysler', 'jeep', 'ram', 'dodge', 'buick', 'gmc',
                          'cadillac', 'lincoln', 'mazda', 'hyundai', 'kia',
                          'volkswagen', 'audi', 'bmw', 'mercedes'];
        
        brandNames.forEach(brand => {
            if (src.toLowerCase().includes(brand) || alt.toLowerCase().includes(brand)) {
                brands.add(brand);
                brandLogos.push({ brand, src });
            }
        });
    });

    // Also check text content
    const bodyText = $('body').text().toLowerCase();
    ['ford', 'chevrolet', 'toyota', 'honda', 'nissan', 'chrysler'].forEach(brand => {
        if (bodyText.includes(brand + ' dealer') || bodyText.includes(brand + ' sales')) {
            brands.add(brand);
        }
    });

    if (brands.size >= 3) {
        return {
            test: { name: 'Brand Representation', value: `${brands.size} brands displayed` },
            score: 2,
            brands: Array.from(brands)
        };
    } else if (brands.size > 0) {
        return {
            test: { name: 'Brand Representation', value: `Only ${brands.size} brands visible` },
            score: 1,
            issue: {
                title: 'Limited brand visibility',
                details: 'Display all represented brands prominently to showcase group diversity',
                priority: 'medium',
                category: 'Brand Identity'
            },
            brands: Array.from(brands)
        };
    } else {
        return {
            test: { name: 'Brand Representation', value: 'No clear brand representation' },
            score: 0,
            issue: {
                title: 'No brand representation found',
                details: 'Add brand logos and clear identification of all represented manufacturers',
                priority: 'high',
                category: 'Brand Identity'
            },
            brands: []
        };
    }
}

function testGroupInformation($) {
    let score = 0;
    const foundElements = [];

    // Check for About Us section
    const aboutLinks = $('a:contains("About"), a:contains("Our Story"), a:contains("History")');
    if (aboutLinks.length > 0) {
        score += 0.5;
        foundElements.push('About/History section');
    }

    // Check for group leadership/team
    const teamContent = $('body').text().toLowerCase();
    if (teamContent.includes('president') || teamContent.includes('owner') || 
        teamContent.includes('leadership') || teamContent.includes('management team')) {
        score += 0.5;
        foundElements.push('Leadership information');
    }

    // Check for group achievements/awards
    if (teamContent.includes('award') || teamContent.includes('recognition') || 
        teamContent.includes('certified')) {
        score += 0.5;
        foundElements.push('Awards/Recognition');
    }

    // Check for community involvement
    if (teamContent.includes('community') || teamContent.includes('charity') || 
        teamContent.includes('giving back')) {
        score += 0.5;
        foundElements.push('Community involvement');
    }

    if (score >= 1.5) {
        return {
            test: { name: 'Group Information', value: foundElements.join(', ') },
            score: 2
        };
    } else if (score > 0) {
        return {
            test: { name: 'Group Information', value: 'Limited group information' },
            score: 1,
            issue: {
                title: 'Incomplete group information',
                details: 'Add comprehensive "About Us" section including history, leadership, and community involvement',
                priority: 'medium',
                category: 'Content'
            }
        };
    } else {
        return {
            test: { name: 'Group Information', value: 'No group information found' },
            score: 0,
            issue: {
                title: 'Missing group identity content',
                details: 'Create an "About Us" section highlighting group history, values, and leadership',
                priority: 'medium',
                category: 'Content'
            }
        };
    }
}

function testContactConsistency($) {
    // Check for unified contact method or clear departmental contacts
    const phoneNumbers = [];
    const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    
    $('body').text().match(phonePattern)?.forEach(phone => {
        phoneNumbers.push(phone);
    });

    // Check for contact forms
    const forms = $('form').filter((i, elem) => {
        const formHtml = $(elem).html().toLowerCase();
        return formHtml.includes('contact') || formHtml.includes('name') || 
               formHtml.includes('email') || formHtml.includes('message');
    });

    // Check for email addresses
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = $('body').text().match(emailPattern) || [];

    let score = 0;
    const contactMethods = [];

    if (phoneNumbers.length > 0) {
        score += 0.7;
        contactMethods.push(`${phoneNumbers.length} phone number(s)`);
    }
    if (forms.length > 0) {
        score += 0.7;
        contactMethods.push('Contact form');
    }
    if (emails.length > 0) {
        score += 0.6;
        contactMethods.push(`${emails.length} email(s)`);
    }

    if (score >= 1.4) {
        return {
            test: { name: 'Contact Methods', value: contactMethods.join(', ') },
            score: 2
        };
    } else if (score > 0) {
        return {
            test: { name: 'Contact Methods', value: 'Limited contact options' },
            score: 1,
            issue: {
                title: 'Insufficient contact methods',
                details: 'Provide multiple contact options including phone, email, and contact form',
                priority: 'medium',
                category: 'Contact'
            }
        };
    } else {
        return {
            test: { name: 'Contact Methods', value: 'No clear contact methods' },
            score: 0,
            issue: {
                title: 'Missing contact information',
                details: 'Add clear contact information for the group or individual locations',
                priority: 'high',
                category: 'Contact'
            }
        };
    }
}

function testNavigationStructure($) {
    const mainNav = $('nav, .navigation, .menu, [class*="nav"]').first();
    const navItems = mainNav.find('a');
    let score = 0;
    const foundItems = [];

    // Essential navigation items for group sites
    const essentialItems = {
        'locations': ['location', 'dealership', 'find', 'where'],
        'inventory': ['inventory', 'vehicles', 'search', 'shop'],
        'about': ['about', 'story', 'history'],
        'contact': ['contact', 'reach', 'call'],
        'careers': ['career', 'job', 'employment', 'join']
    };

    Object.entries(essentialItems).forEach(([key, patterns]) => {
        const found = navItems.filter((i, elem) => {
            const text = $(elem).text().toLowerCase();
            return patterns.some(pattern => text.includes(pattern));
        });
        
        if (found.length > 0) {
            score += 0.4;
            foundItems.push(key);
        }
    });

    if (score >= 1.6) {
        return {
            test: { name: 'Navigation Structure', value: 'Comprehensive (' + foundItems.join(', ') + ')' },
            score: 2
        };
    } else if (score > 0.8) {
        return {
            test: { name: 'Navigation Structure', value: 'Basic navigation' },
            score: 1,
            issue: {
                title: 'Navigation could be improved',
                details: 'Consider adding: ' + Object.keys(essentialItems).filter(k => !foundItems.includes(k)).join(', '),
                priority: 'low',
                category: 'Navigation'
            }
        };
    } else {
        return {
            test: { name: 'Navigation Structure', value: 'Poor navigation' },
            score: 0,
            issue: {
                title: 'Inadequate navigation structure',
                details: 'Create clear navigation including: Locations, Inventory Search, About Us, Contact, and Careers',
                priority: 'high',
                category: 'Navigation'
            }
        };
    }
}

// Extract all dealer locations/links
async function extractDealerLinks($, driver, baseUrl) {
    const dealers = [];
    const processedUrls = new Set();

    // Find all potential dealer links
    const selectors = [
        'a[href*="location"]',
        'a[href*="dealer"]',
        '.location-card a',
        '.dealer-card a',
        '[class*="location"] a',
        '[class*="dealer"] a',
        'a[href*=".com"]',
        'a[href*=".net"]'
    ];

    for (const selector of selectors) {
        $(selector).each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            
            if (href && text && !processedUrls.has(href)) {
                processedUrls.add(href);
                
                // Check if it's likely a dealer site
                if (isDealerLink(href, text, baseUrl)) {
                    dealers.push({
                        name: text,
                        url: href.startsWith('http') ? href : new URL(href, baseUrl).href,
                        type: classifyDealerLink(href, text)
                    });
                }
            }
        });
    }

    return dealers;
}

function isDealerLink(href, text, baseUrl) {
    // Skip social media, manufacturer sites, etc.
    const skipPatterns = [
        'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
        'ford.com', 'chevrolet.com', 'toyota.com', 'honda.com',
        'maps.google.com', 'google.com/maps'
    ];
    
    if (skipPatterns.some(pattern => href.includes(pattern))) {
        return false;
    }

    // Check if text contains dealer indicators
    const dealerIndicators = [
        'ford', 'chevrolet', 'toyota', 'honda', 'nissan', 'chrysler',
        'jeep', 'ram', 'dodge', 'motors', 'automotive', 'auto'
    ];
    
    const textLower = text.toLowerCase();
    return dealerIndicators.some(indicator => textLower.includes(indicator)) ||
           href.includes('dealer') || href.includes('location');
}

function classifyDealerLink(href, text) {
    if (href.includes('/location') || href.includes('/dealer')) {
        return 'internal-page';
    } else if (href.includes('http') && !href.includes(window.location.hostname)) {
        return 'external-site';
    } else {
        return 'unknown';
    }
}

// Test dealer link health
async function testDealerLinks(dealers, page) {
    const results = [];
    
    for (const dealer of dealers.slice(0, 10)) { // Test up to 10 dealers
        try {
            const response = await page.goto(dealer.url, { 
                waitUntil: 'domcontentloaded',
                timeout: 10000 
            });
            
            results.push({
                ...dealer,
                status: response.status(),
                accessible: response.status() === 200
            });
        } catch (error) {
            results.push({
                ...dealer,
                status: 'error',
                accessible: false,
                error: error.message
            });
        }
    }
    
    return results;
}

module.exports = {
    runGroupTests,
    extractDealerLinks,
    testDealerLinks,
    GROUP_PATTERNS
};