/*
 * Auto Audit Pro - Dealer Group Analysis Module
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Specialized analysis for dealer group websites
 */

const { By, until } = require('selenium-webdriver');
const cheerio = require('cheerio');
const axios = require('axios');
const LocationCrawler = require('./location-crawler');

// Comprehensive list of automotive brands with variations
const AUTOMOTIVE_BRANDS = {
    // American brands
    'ford': ['ford'],
    'chevrolet': ['chevrolet', 'chevy'],
    'gmc': ['gmc'],
    'buick': ['buick'],
    'cadillac': ['cadillac', 'caddy'],
    'lincoln': ['lincoln'],
    'chrysler': ['chrysler'],
    'dodge': ['dodge'],
    'jeep': ['jeep'],
    'ram': ['ram'],
    // Japanese brands
    'toyota': ['toyota'],
    'honda': ['honda'],
    'nissan': ['nissan'],
    'mazda': ['mazda'],
    'subaru': ['subaru'],
    'mitsubishi': ['mitsubishi'],
    'lexus': ['lexus'],
    'acura': ['acura'],
    'infiniti': ['infiniti'],
    // Korean brands
    'hyundai': ['hyundai'],
    'kia': ['kia'],
    'genesis': ['genesis'],
    // German brands
    'volkswagen': ['volkswagen', 'vw'],
    'audi': ['audi'],
    'bmw': ['bmw'],
    'mercedes-benz': ['mercedes-benz', 'mercedes', 'benz', 'mb'],
    'porsche': ['porsche'],
    // Other European brands
    'volvo': ['volvo'],
    'jaguar': ['jaguar', 'jag'],
    'land rover': ['land rover', 'landrover', 'rover'],
    'mini': ['mini'],
    'fiat': ['fiat'],
    'alfa romeo': ['alfa romeo', 'alfa'],
    // Other brands
    'tesla': ['tesla'],
    'rivian': ['rivian'],
    'lucid': ['lucid'],
    'polestar': ['polestar'],
    // Specialty/Off-road brands
    'ineos': ['ineos', 'ineos grenadier', 'grenadier'],
    // Motorcycle brands
    'ducati': ['ducati'],
    'harley-davidson': ['harley-davidson', 'harley'],
    'yamaha': ['yamaha'],
    'kawasaki': ['kawasaki'],
    'suzuki': ['suzuki'],
    'bmw-motorrad': ['bmw motorrad', 'bmw motorcycle'],
    'triumph': ['triumph'],
    'indian': ['indian', 'indian motorcycle'],
    'ktm': ['ktm'],
    'aprilia': ['aprilia'],
    'moto-guzzi': ['moto guzzi'],
    'vespa': ['vespa'],
    // Generic dealer types
    'used-cars': ['used car', 'used cars', 'pre-owned', 'preowned', 'cpo', 'certified pre-owned'],
    // Commercial and specialty centers
    'commercial': ['commercial', 'commercial vehicle', 'fleet', 'work truck', 'commercial truck'],
    'service': ['service center', 'quick lube', 'express service', 'collision center', 'body shop', 'parts center'],
    'specialty': ['rv', 'recreational vehicle', 'marine', 'boat', 'powersports', 'atv', 'utv', 'side-by-side']
};

// Flatten brand variations for easy searching
const ALL_BRAND_VARIATIONS = Object.values(AUTOMOTIVE_BRANDS).flat();

// Patterns to identify dealer group sites
const GROUP_PATTERNS = {
    navigation: [
        'our locations', 'our dealerships', 'our stores', 'locations',
        'find a dealer', 'dealer locator', 'our brands', 'dealership locations',
        'visit us', 'find us', 'our showrooms', 'all locations',
        'our family', 'dealership family', 'choose location', 'select dealership',
        'browse locations', 'dealership directory', 'where to buy'
    ],
    urls: [
        '/locations', '/dealerships', '/our-stores', '/dealers',
        '/find-a-dealer', '/where-to-buy', '/our-locations',
        '/stores', '/showrooms', '/find-us', '/visit-us',
        '/dealership-locations', '/our-family', '/group-locations'
    ],
    content: [
        'family of dealerships', 'automotive group', 'dealer group',
        'multiple locations', 'serving .* with .* locations',
        'proud to serve', 'locations throughout', 'dealerships across',
        'automotive family', 'group of dealerships', 'dealership network'
    ]
};

// Group-specific tests
async function runGroupTests($, url, driver = null) {
    const tests = [];
    const issues = [];
    let score = 0;
    const maxScore = 10;
    
    // Debug: Check if we have content
    const bodyText = $('body').text() || '';
    const linkCount = $('a').length;
    const hasBody = $('body').length > 0;
    const htmlLength = $.html().length;
    
    console.log(`[Group Analysis Debug] URL: ${url}`);
    console.log(`[Group Analysis Debug] Has body tag: ${hasBody}`);
    console.log(`[Group Analysis Debug] HTML length: ${htmlLength}`);
    console.log(`[Group Analysis Debug] Body text length: ${bodyText.length}`);
    console.log(`[Group Analysis Debug] Number of links: ${linkCount}`);
    
    // List first 5 links for debugging
    if (linkCount > 0) {
        console.log('[Group Analysis Debug] First 5 links:');
        $('a').slice(0, 5).each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            console.log(`  ${i+1}. Text: "${text}", Href: "${href}"`);
        });
    } else {
        console.log('[Group Analysis Debug] No links found!');
    }

    // Test 1: Location Directory
    // Extract dealer links first to get accurate count
    const dealerLinks = await extractDealerLinks($, driver, url);
    const locationDirectory = await testLocationDirectory($, url, dealerLinks);
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

async function testLocationDirectory($, url, dealerLinks = null) {
    // If dealer links are provided, use them directly
    if (dealerLinks && dealerLinks.length > 0) {
        console.log(`[Location Test Debug] Using ${dealerLinks.length} dealer links from extractDealerLinks`);
        
        const uniqueCount = dealerLinks.length;
        
        // Adjusted thresholds for dealer groups
        if (uniqueCount >= 10) {
            return {
                test: { name: 'Location Directory', value: `${uniqueCount} locations found on website` },
                score: 2,
                locations: dealerLinks
            };
        } else if (uniqueCount >= 3) {
            return {
                test: { name: 'Location Directory', value: `${uniqueCount} locations found on website` },
                score: 1.5,
                locations: dealerLinks
            };
        } else if (uniqueCount > 0) {
            return {
                test: { name: 'Location Directory', value: `Only ${uniqueCount} locations visible on website` },
                score: 1,
                issue: {
                    title: 'Limited dealer location visibility',
                    details: 'Consider creating a dedicated locations page with all dealerships clearly listed',
                    priority: 'medium',
                    category: 'Group Structure'
                },
                locations: dealerLinks
            };
        }
    }
    
    // Fallback to original detection if no dealer links provided
    console.log('[Location Test Debug] No dealer links provided, using fallback detection');
    
    // Find location/dealership links
    const locationLinks = [];
    const foundUrls = new Set(); // Track unique URLs
    
    // Debug
    console.log('[Location Test Debug] Starting location directory test');
    console.log('[Location Test Debug] Total <a> tags:', $('a').length);
    
    // Expanded selectors for better detection
    const selectors = [
        // URL-based selectors
        'a[href*="location"]',
        'a[href*="Location"]',
        'a[href*="LOCATION"]',
        'a[href*="dealer"]',
        'a[href*="Dealer"]',
        'a[href*="DEALER"]',
        'a[href*="store"]',
        'a[href*="Store"]',
        'a[href*="showroom"]',
        // Class-based selectors
        '.location-card a',
        '.dealer-card a',
        '.dealership-card a',
        '.store-card a',
        '.showroom-card a',
        '[class*="location"] a',
        '[class*="dealer"] a',
        '[class*="store"] a',
        // Data attribute selectors
        '[data-dealer] a',
        '[data-location] a',
        '[data-dealership] a',
        // Common list patterns
        'ul.locations a',
        'ul.dealerships a',
        '.locations-list a',
        '.dealer-list a',
        '.location-grid a',
        '.dealership-grid a'
    ];

    // Process each selector
    selectors.forEach(selector => {
        try {
            $(selector).each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim();
                if (href && text && !foundUrls.has(href)) {
                    foundUrls.add(href);
                    locationLinks.push({ href, text });
                }
            });
        } catch (e) {
            // Skip invalid selectors
        }
    });

    // Check for location patterns in link text
    const locationPatterns = [
        'location', 'dealer', 'store', 'showroom', 'visit us',
        'find us', 'directions', 'our address'
    ];
    
    // Debug: Show what we found so far
    console.log(`[Location Test Debug] Found ${locationLinks.length} links from selectors`);
    
    // More selective check for actual dealer location links
    $('a').each((i, elem) => {
        const text = $(elem).text().toLowerCase().trim();
        const href = $(elem).attr('href') || '';
        
        if (!href || foundUrls.has(href)) return;
        
        // Skip navigation/utility links
        if (href === '#' || href === '/' || href.startsWith('javascript:') || 
            href.includes('facebook.') || href.includes('twitter.') || 
            href.includes('instagram.') || href.includes('youtube.')) {
            return;
        }
        
        // Skip generic location pages and "VIEW DETAILS" duplicates
        if (href.endsWith('/locations') || href.endsWith('/locations/') ||
            text === 'view details' || text === 'locations') {
            return;
        }
        
        // Check if this looks like an actual dealer location
        const isDealerLocation = false ||
            // Primary pattern: dealer-info pages with dealer parameter
            (href.includes('/dealer-info') && href.includes('dealer=')) ||
            // Individual dealer subdirectory (not just /locations/)
            (href.includes('/locations/') && href.split('/locations/')[1]?.length > 3) ||
            // Text pattern: "Dealership Name Brand" (e.g., "Smith Ford", "Johnson Toyota")
            (/^[A-Z][a-zA-Z\s&'-]+(Ford|Chevrolet|Chevy|Toyota|Honda|Nissan|Chrysler|Jeep|GMC|Buick|Cadillac|Lincoln|Mazda|Hyundai|Kia|Subaru|Volkswagen|VW|Audi|BMW|Mercedes|Dodge|Ram)(\s|$)/i.test($(elem).text().trim())) ||
            // Text pattern: "Brand of Location" (e.g., "Toyota of Portland")
            (ALL_BRAND_VARIATIONS.some(brand => {
                const regex = new RegExp(`\\b${brand}\\s+of\\s+[A-Z][a-zA-Z\\s]+`, 'i');
                return regex.test($(elem).text().trim());
            })) ||
            // URL contains dealer name pattern (e.g., /smith-ford, /johnson-chevrolet)
            (/\/[a-z]+-(?:ford|chevrolet|chevy|toyota|honda|nissan|chrysler|jeep|gmc|buick|cadillac|lincoln|mazda|hyundai|kia|subaru|volkswagen|vw|audi|bmw|mercedes|dodge|ram)/i.test(href));
        
        if (href && isDealerLocation) {
            foundUrls.add(href);
            locationLinks.push({ href, text: $(elem).text().trim() });
            
            // Debug: Log first few matches to understand what's being detected
            if (locationLinks.length <= 5) {
                console.log(`[Location Match] Text: "${$(elem).text().trim()}", Href: "${href}"`);
            }
        }
    });

    // Final deduplication based on dealer ID or text similarity
    const uniqueLocations = [];
    const seenNames = new Set();
    const seenDealerIds = new Set();
    
    locationLinks.forEach(link => {
        // Check if this is a dealer-info URL with dealer parameter
        const dealerMatch = link.href.match(/dealer=([^&]+)/);
        if (dealerMatch) {
            const dealerId = dealerMatch[1];
            if (!seenDealerIds.has(dealerId)) {
                seenDealerIds.add(dealerId);
                uniqueLocations.push(link);
            }
        } else {
            // For non-dealer-info URLs, use text-based deduplication
            const normalizedText = link.text.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!seenNames.has(normalizedText) && normalizedText.length > 3) {
                seenNames.add(normalizedText);
                uniqueLocations.push(link);
            }
        }
    });
    
    console.log(`[Location Test Debug] After deduplication: ${uniqueLocations.length} unique dealer locations`);
    
    // Adjusted thresholds for dealer groups
    if (uniqueLocations.length >= 10) {
        return {
            test: { name: 'Location Directory', value: `${uniqueLocations.length} dealer locations found` },
            score: 2,
            locations: uniqueLocations
        };
    } else if (uniqueLocations.length >= 3) {
        return {
            test: { name: 'Location Directory', value: `${uniqueLocations.length} dealer locations found` },
            score: 1.5,
            locations: uniqueLocations
        };
    } else if (uniqueLocations.length > 0) {
        return {
            test: { name: 'Location Directory', value: `Only ${uniqueLocations.length} dealer locations found` },
            score: 1,
            issue: {
                title: 'Limited dealer location visibility',
                details: 'Consider creating a dedicated locations page with all dealerships clearly listed',
                priority: 'medium',
                category: 'Group Structure'
            },
            locations: uniqueLocations
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
    const foundBrands = new Map(); // Track brand with their canonical names

    // Helper function to check for brand variations
    function checkForBrand(text) {
        if (!text) return null;
        const lowerText = text.toLowerCase();
        
        for (const [canonical, variations] of Object.entries(AUTOMOTIVE_BRANDS)) {
            for (const variation of variations) {
                if (lowerText.includes(variation)) {
                    return canonical;
                }
            }
        }
        return null;
    }

    // Look for brand logos/images in multiple sources
    $('img, [style*="background-image"], svg image, picture source').each((i, elem) => {
        const $elem = $(elem);
        const attributes = [
            $elem.attr('src'),
            $elem.attr('alt'),
            $elem.attr('title'),
            $elem.attr('data-brand'),
            $elem.css('background-image'),
            $elem.attr('srcset')
        ];
        
        // Also check class names for brand indicators
        const className = $elem.attr('class') || '';
        attributes.push(className);
        
        attributes.forEach(attr => {
            const brand = checkForBrand(attr);
            if (brand) {
                brands.add(brand);
                if ($elem.attr('src')) {
                    brandLogos.push({ brand, src: $elem.attr('src') });
                }
            }
        });
    });

    // Check for brand mentions in various contexts
    const brandContexts = [
        'dealer', 'dealership', 'sales', 'service', 'parts', 
        'inventory', 'new', 'used', 'certified', 'showroom',
        'specialist', 'center', 'store'
    ];
    
    // Look for brand text in headers, navigation, and content
    $('h1, h2, h3, h4, nav, .brand, [class*="brand"], [class*="logo"]').each((i, elem) => {
        const text = $(elem).text();
        const brand = checkForBrand(text);
        if (brand) {
            brands.add(brand);
        }
    });
    
    // Also check full page text for brand+context combinations
    const bodyText = $('body').text().toLowerCase();
    for (const [canonical, variations] of Object.entries(AUTOMOTIVE_BRANDS)) {
        for (const variation of variations) {
            for (const context of brandContexts) {
                if (bodyText.includes(variation + ' ' + context) || 
                    bodyText.includes(variation + context)) {
                    brands.add(canonical);
                    break;
                }
            }
        }
    }
    
    // Check for structured data
    $('script[type="application/ld+json"]').each((i, elem) => {
        try {
            const data = JSON.parse($(elem).text());
            const jsonString = JSON.stringify(data).toLowerCase();
            const brand = checkForBrand(jsonString);
            if (brand) brands.add(brand);
        } catch (e) {
            // Skip invalid JSON
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

    // Check for About Us section (case-insensitive)
    const aboutPatterns = [
        'about us', 'our story', 'history', 'who we are', 
        'our company', 'our group', 'our family', 'our mission',
        'about the group', 'company history'
    ];
    
    let hasAboutSection = false;
    aboutPatterns.forEach(pattern => {
        if ($(`a:contains("${pattern}"), h1:contains("${pattern}"), h2:contains("${pattern}")`).length > 0) {
            hasAboutSection = true;
        }
    });
    
    // Also check with case-insensitive jQuery extension or attribute selector
    $('a, h1, h2, h3').each((i, elem) => {
        const text = $(elem).text().toLowerCase();
        if (aboutPatterns.some(pattern => text.includes(pattern))) {
            hasAboutSection = true;
        }
    });
    
    if (hasAboutSection) {
        score += 0.5;
        foundElements.push('About/History section');
    }

    // Check for group leadership/team (expanded patterns)
    const leadershipPatterns = [
        'president', 'ceo', 'owner', 'founder', 'leadership',
        'management team', 'executive team', 'our team', 'meet the team',
        'board of directors', 'principals', 'partners', 'general manager'
    ];
    
    const bodyText = $('body').text().toLowerCase();
    const hasLeadership = leadershipPatterns.some(pattern => bodyText.includes(pattern));
    
    if (hasLeadership) {
        score += 0.5;
        foundElements.push('Leadership information');
    }

    // Check for group achievements/awards (expanded)
    const achievementPatterns = [
        'award', 'recognition', 'certified', 'achievement',
        'honored', 'ranked', 'top dealer', 'best dealer',
        'dealer of the year', 'excellence', 'outstanding',
        'proud recipient', 'winner'
    ];
    
    const hasAchievements = achievementPatterns.some(pattern => bodyText.includes(pattern));
    
    if (hasAchievements) {
        score += 0.5;
        foundElements.push('Awards/Recognition');
    }

    // Check for community involvement (expanded)
    const communityPatterns = [
        'community', 'charity', 'giving back', 'donations',
        'sponsor', 'support', 'volunteer', 'foundation',
        'local events', 'proud supporter', 'community partner',
        'social responsibility', 'philanthropic'
    ];
    
    const hasCommunity = communityPatterns.some(pattern => bodyText.includes(pattern));
    
    if (hasCommunity) {
        score += 0.5;
        foundElements.push('Community involvement');
    }
    
    // Check for years in business/established date
    const establishedPattern = /(?:established|founded|serving since|since|over)\s*(?:in)?\s*(\d{4})|(\d{2,3})\s*years/i;
    if (establishedPattern.test(bodyText)) {
        score += 0.5;
        foundElements.push('Years in business');
    }
    
    // Check for multiple locations mention
    const multiLocationPattern = /\d+\s*(?:locations?|dealerships?|stores?)|multiple\s*(?:locations?|dealerships?|stores?)/i;
    if (multiLocationPattern.test(bodyText)) {
        score += 0.5;
        foundElements.push('Multiple locations mentioned');
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
    const phoneNumbers = new Set();
    const emails = new Set();
    const contactMethods = [];
    
    // Improved phone pattern with extensions
    const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(\s?(ext|x|extension)\.?\s?\d+)?/gi;
    
    // Look for phones in specific contexts (more reliable)
    $('a[href^="tel:"], .phone, [class*="phone"], [class*="tel"]').each((i, elem) => {
        const text = $(elem).text();
        const href = $(elem).attr('href');
        if (href && href.startsWith('tel:')) {
            phoneNumbers.add(href.replace('tel:', ''));
        } else if (text) {
            const matches = text.match(phonePattern);
            if (matches) matches.forEach(phone => phoneNumbers.add(phone));
        }
    });
    
    // Also check general text for phones
    const bodyPhones = $('body').text().match(phonePattern) || [];
    bodyPhones.forEach(phone => phoneNumbers.add(phone));

    // Check for contact forms with better detection
    const formSelectors = [
        'form[action*="contact"]',
        'form[action*="lead"]',
        'form[action*="inquiry"]',
        'form#contact-form',
        'form.contact-form',
        'form[class*="contact"]'
    ];
    
    let formCount = 0;
    formSelectors.forEach(selector => {
        formCount += $(selector).length;
    });
    
    // Also check for forms by content
    const forms = $('form').filter((i, elem) => {
        const formHtml = $(elem).html().toLowerCase();
        const formText = $(elem).text().toLowerCase();
        return formHtml.includes('contact') || formHtml.includes('email') || 
               formHtml.includes('phone') || formHtml.includes('message') ||
               formText.includes('get in touch') || formText.includes('reach out');
    });
    formCount += forms.length;

    // Check for email addresses with better patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Look for emails in specific contexts
    $('a[href^="mailto:"], .email, [class*="email"]').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text();
        if (href && href.startsWith('mailto:')) {
            emails.add(href.replace('mailto:', ''));
        } else if (text) {
            const matches = text.match(emailPattern);
            if (matches) matches.forEach(email => emails.add(email));
        }
    });
    
    // Check body text for emails
    const bodyEmails = $('body').text().match(emailPattern) || [];
    bodyEmails.forEach(email => {
        // Filter out common false positives
        if (!email.includes('example.com') && !email.includes('domain.com')) {
            emails.add(email);
        }
    });
    
    // Check for chat widgets
    const chatIndicators = [
        '[class*="chat"]',
        '[id*="chat"]',
        '[class*="livechat"]',
        '[class*="messenger"]',
        'iframe[src*="chat"]',
        '[class*="tawk"]',
        '[class*="intercom"]',
        '[class*="drift"]'
    ];
    
    let hasChat = false;
    chatIndicators.forEach(selector => {
        if ($(selector).length > 0) hasChat = true;
    });
    
    // Check for structured data contact info
    let hasStructuredContact = false;
    $('script[type="application/ld+json"]').each((i, elem) => {
        try {
            const data = JSON.parse($(elem).text());
            if (data.telephone || data.email || data.contactPoint) {
                hasStructuredContact = true;
            }
        } catch (e) {}
    });

    let score = 0;

    if (phoneNumbers.size > 0) {
        score += 0.5;
        contactMethods.push(`${phoneNumbers.size} phone number(s)`);
    }
    if (formCount > 0) {
        score += 0.5;
        contactMethods.push(`${formCount} contact form(s)`);
    }
    if (emails.size > 0) {
        score += 0.4;
        contactMethods.push(`${emails.size} email(s)`);
    }
    if (hasChat) {
        score += 0.3;
        contactMethods.push('Live chat');
    }
    if (hasStructuredContact) {
        score += 0.3;
        contactMethods.push('Structured data');
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
    // Expanded navigation selectors
    const navSelectors = [
        'nav', 'header nav', '.navigation', '.nav-menu', '.main-nav',
        '[class*="navigation"]', '[class*="menu"]', '[role="navigation"]',
        '.navbar', '#navigation', '#menu', '.site-nav'
    ];
    
    let navItems = $();
    
    // Try multiple selectors to find navigation
    for (const selector of navSelectors) {
        const nav = $(selector);
        if (nav.length > 0) {
            navItems = nav.find('a');
            if (navItems.length > 0) break;
        }
    }
    
    // If still no nav items, look for common link patterns
    if (navItems.length === 0) {
        navItems = $('header a, .header a, [class*="header"] a').filter((i, elem) => {
            const href = $(elem).attr('href');
            return href && href !== '#' && href !== '/';
        });
    }
    
    let score = 0;
    const foundItems = [];

    // Essential navigation items for group sites (expanded)
    const essentialItems = {
        'locations': [
            'location', 'dealership', 'dealer', 'find', 'where',
            'store', 'showroom', 'our locations', 'find us', 'visit',
            'all locations', 'our dealerships', 'our stores'
        ],
        'inventory': [
            'inventory', 'vehicle', 'search', 'shop', 'browse',
            'new', 'used', 'cars', 'trucks', 'view inventory',
            'search inventory', 'shop now'
        ],
        'about': [
            'about', 'story', 'history', 'our story', 'who we are',
            'company', 'group', 'family', 'our family', 'our group'
        ],
        'contact': [
            'contact', 'reach', 'call', 'get in touch', 'connect',
            'talk', 'email', 'phone', 'contact us', 'reach out'
        ],
        'service': [
            'service', 'repair', 'maintenance', 'parts', 'schedule',
            'book', 'appointment'
        ],
        'careers': [
            'career', 'job', 'employment', 'join', 'work',
            'hiring', 'opportunities', 'team', 'join us', 'work with us'
        ]
    };

    Object.entries(essentialItems).forEach(([key, patterns]) => {
        const found = navItems.filter((i, elem) => {
            const text = $(elem).text().toLowerCase().trim();
            const href = $(elem).attr('href') || '';
            const title = $(elem).attr('title') || '';
            
            // Check text, href, and title for patterns
            const combinedText = `${text} ${href} ${title}`.toLowerCase();
            
            return patterns.some(pattern => {
                // Use word boundaries for more accurate matching
                const regex = new RegExp(`\\b${pattern}\\b`, 'i');
                return regex.test(combinedText);
            });
        });
        
        if (found.length > 0) {
            score += key === 'locations' ? 0.5 : 0.3; // Locations are more important for groups
            foundItems.push(key);
        }
    });
    
    // Check for dropdown/mega menu indicators
    const hasDropdowns = $('[class*="dropdown"], [class*="submenu"], [class*="mega-menu"]').length > 0;
    if (hasDropdowns) {
        score += 0.2;
        foundItems.push('dropdown menus');
    }

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
    
    // Disable crawler for now as it's finding too many non-dealer links
    // The HTML parsing method with stricter validation is more accurate
    const useCrawler = false;
    
    if (useCrawler) {
        console.log('[Dealer Links] Starting comprehensive location discovery with crawler');
        try {
            const crawler = new LocationCrawler(baseUrl, driver);
            const crawlResults = await crawler.crawlForLocations();
            
            if (crawlResults.totalFound > 50) {
                console.log(`[Dealer Links] Crawler found ${crawlResults.totalFound} locations via ${crawlResults.method}`);
                
                // Convert crawler results to our format
                crawlResults.locations.forEach(url => {
                    if (!processedUrls.has(url)) {
                        processedUrls.add(url);
                        
                        // Extract name from URL or use a placeholder
                        let name = url.split('/').pop() || 'Location';
                        name = name.replace(/-/g, ' ').replace(/_/g, ' ');
                        name = name.charAt(0).toUpperCase() + name.slice(1);
                        
                        dealers.push({
                            name: name,
                            url: url,
                            type: url.includes(baseUrl) ? 'internal-page' : 'external-site'
                        });
                    }
                });
                
                // If crawler found substantial results, return them
                if (dealers.length > 50) {
                    console.log(`[Dealer Links] Returning ${dealers.length} locations from crawler`);
                    return dealers;
                }
            }
        } catch (error) {
            console.log('[Dealer Links] Crawler error:', error.message);
        }
    }
    
    // Fall back to original HTML parsing method
    console.log('[Dealer Links] Falling back to HTML parsing method');
    
    // Find all potential dealer links with more specific selectors
    const selectors = [
        // URL-based selectors
        'a[href*="location"]',
        'a[href*="dealer"]',
        'a[href*="store"]',
        'a[href*="showroom"]',
        // Class-based selectors
        '.location-card a',
        '.dealer-card a',
        '.dealership-card a',
        '.store-card a',
        '.location-item a',
        '.dealer-item a',
        '.store-item a',
        '[class*="location"] a',
        '[class*="dealer"] a',
        '[class*="store"] a',
        '.locations-list a',
        '.dealers-list a',
        '.stores-list a',
        '.dealer-list a',
        '.our-locations a',
        '.our-dealerships a',
        '.our-stores a',
        // Container selectors
        '.locations-container a',
        '.dealers-container a',
        '.locations-grid a',
        '.dealers-grid a',
        // Section selectors
        'section.locations a',
        'section.dealers a',
        'section.stores a',
        'div.locations a',
        'div.dealers a',
        'div.stores a'
    ];

    // Track unique dealer URLs to avoid duplicates
    const uniqueDealerUrls = new Map(); // URL -> dealer object
    
    for (const selector of selectors) {
        $(selector).each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            
            if (href && text && !processedUrls.has(href)) {
                processedUrls.add(href);
                
                // Check if it's likely a dealer site
                if (isDealerLink(href, text, baseUrl)) {
                    const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
                    
                    // Only add if we haven't seen this URL before, or if this has a better name
                    if (!uniqueDealerUrls.has(fullUrl) || 
                        (uniqueDealerUrls.get(fullUrl).name === 'Visit Site' && text !== 'Visit Site')) {
                        
                        // Debug: log what we're finding
                        if (dealers.length < 10) {
                            console.log(`[Dealer Link Found] Text: "${text}", URL: ${href}`);
                        }
                        
                        uniqueDealerUrls.set(fullUrl, {
                            name: text,
                            url: fullUrl,
                            type: classifyDealerLink(href, text, baseUrl)
                        });
                    }
                }
            }
        });
    }
    
    // Convert map to array
    dealers.push(...uniqueDealerUrls.values());
    
    // Debug: Show what we found
    console.log(`[Dealer Links] Total unique dealers found: ${dealers.length}`);
    if (dealers.length > 0 && dealers.length <= 10) {
        dealers.forEach((dealer, idx) => {
            console.log(`  ${idx + 1}. ${dealer.name} - ${dealer.url}`);
        });
    } else if (dealers.length > 10) {
        // Show first 5 and last 5
        console.log('  First 5:');
        dealers.slice(0, 5).forEach((dealer, idx) => {
            console.log(`  ${idx + 1}. ${dealer.name} - ${dealer.url}`);
        });
        console.log('  ...');
        console.log('  Last 5:');
        dealers.slice(-5).forEach((dealer, idx) => {
            console.log(`  ${dealers.length - 4 + idx}. ${dealer.name} - ${dealer.url}`);
        });
    }

    return dealers;
}

function isDealerLink(href, text, baseUrl) {
    // Skip social media, manufacturer sites, etc.
    const skipPatterns = [
        'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
        'linkedin.com', 'pinterest.com', 'yelp.com',
        // Skip manufacturer sites
        'ford.com', 'chevrolet.com', 'toyota.com', 'honda.com',
        'nissan.com', 'chrysler.com', 'jeep.com', 'gmc.com',
        // Skip other common non-dealer links
        'maps.google.com', 'google.com/maps', 'apple.com/maps',
        'carfax.com', 'kbb.com', 'edmunds.com',
        // Skip only truly generic pages
        '/privacy', '/terms', '/sitemap', '/blog', '/news',
        // Skip department pages that aren't dealerships
        '/commercial', '/fleet', '/body-shop', '/collision',
        '/parts', '/service', '/quick-lube'
    ];
    
    const hrefLower = href.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Skip if matches any skip pattern
    if (skipPatterns.some(pattern => hrefLower.includes(pattern))) {
        return false;
    }
    
    // Skip generic text and CTA buttons
    const genericText = ['click here', 'read more', 'home', '', 'visit site', 
                        'view site', 'learn more', 'see more', 'visit', 
                        'website', 'go to site', 'visit website', 'view website',
                        'visit dealer', 'view dealer', 'dealer website'];
    if (genericText.includes(textLower)) {
        return false;
    }
    
    // Skip generic department links that aren't full dealerships
    if (textLower === 'commercial' || textLower === 'fleet' || 
        textLower === 'platform body trucks' || textLower === 'body shop' ||
        textLower === 'collision center' || textLower === 'parts' ||
        textLower === 'service' || textLower === 'quick lube') {
        return false;
    }
    
    // For external dealer sites (like Kendall)
    if (href.includes('http') && !href.includes(baseUrl)) {
        // Check if it looks like a dealer website (be more specific)
        const dealerDomainPatterns = [
            // City/location + brand patterns (most common for actual dealerships)
            /^[a-z]+ford\.com$/i,
            /^[a-z]+chevrolet\.com$/i,
            /^[a-z]+toyota\.com$/i,
            /^[a-z]+honda\.com$/i,
            /^[a-z]+nissan\.com$/i,
            /^[a-z]+chrysler\.com$/i,
            /^[a-z]+jeep\.com$/i,
            /^[a-z]+gmc\.com$/i,
            /^[a-z]+hyundai\.com$/i,
            /^[a-z]+kia\.com$/i,
            /^[a-z]+mazda\.com$/i,
            /^[a-z]+subaru\.com$/i,
            /^[a-z]+volkswagen\.com$/i,
            /^[a-z]+volvo\.com$/i,
            /^[a-z]+mercedes\.com$/i,
            /^[a-z]+bmw\.com$/i,
            /^[a-z]+audi\.com$/i,
            /^[a-z]+lexus\.com$/i,
            /^[a-z]+acura\.com$/i,
            /^[a-z]+infiniti\.com$/i,
            /^[a-z]+lincoln\.com$/i,
            /^[a-z]+buick\.com$/i,
            /^[a-z]+cadillac\.com$/i,
            /^[a-z]+mitsubishi\.com$/i,
            // Specific subdomain patterns for Kendall/Gee
            /^[a-z-]+\.kendallautogroup\.com$/i,
            /^[a-z-]+\.geeautomotive\.com$/i
        ];
        
        // Extract just the domain part
        try {
            const urlObj = new URL(href);
            const domain = urlObj.hostname.replace('www.', '');
            
            if (dealerDomainPatterns.some(pattern => pattern.test(domain))) {
                // If domain looks like locationbrand.com (e.g., kendallford.com), accept it
                // even if link text is just "Ford" or similar
                const domainHasLocation = /^[a-z]+(ford|chevrolet|toyota|honda|nissan|chrysler|jeep|gmc|hyundai|kia|mazda|subaru|volkswagen|audi|bmw|mercedes|buick|cadillac|lincoln|acura|lexus|infiniti|volvo|mitsubishi)/i.test(domain);
                
                if (domainHasLocation) {
                    return true;
                }
                
                // Otherwise, ensure the text contains a location or brand name
                const hasLocationOrBrand = /[A-Z][a-zA-Z\s&'-]*(Ford|Chevrolet|Toyota|Honda|Nissan|Chrysler|Jeep|GMC|Hyundai|Kia|Mazda|Subaru|Volkswagen|Audi|BMW|Mercedes|Buick|Cadillac|Lincoln|Acura|Lexus|Infiniti|Volvo|Mitsubishi|Ram|Dodge)/i.test(text);
                return hasLocationOrBrand;
            }
        } catch (e) {
            // Invalid URL
            return false;
        }
    }
    
    // For internal dealer pages (various patterns)
    if (href.includes('/dealer-info') || 
        href.includes('/dealership-info') ||
        href.includes('/location-detail') ||
        href.includes('/store-detail') ||
        (href.includes('/locations/') && href.split('/locations/')[1]?.length > 3) ||
        (href.includes('/dealers/') && href.split('/dealers/')[1]?.length > 3) ||
        (href.includes('/stores/') && href.split('/stores/')[1]?.length > 3)) {
        return true;
    }
    
    // Check if URL has dealer parameter format
    if (href.includes('?dealer=') || href.includes('&dealer=') ||
        href.includes('?location=') || href.includes('&location=') ||
        href.includes('?store=') || href.includes('&store=') ||
        href.includes('?id=') || href.includes('&id=')) {
        // Make sure it's not a generic page
        if (!href.includes('/search') && !href.includes('/filter')) {
            return true;
        }
    }
    
    // Check if text contains dealer name patterns (must include location + brand)
    const dealerNamePattern = /^[A-Z][a-zA-Z\s&'-]+(Ford|Chevrolet|Chevy|Toyota|Honda|Nissan|Chrysler|Jeep|GMC|Hyundai|Kia|Mazda|Subaru|Volkswagen|VW|Audi|BMW|Mercedes|Buick|Cadillac|Lincoln|Acura|Lexus|Infiniti|Volvo|Mitsubishi|Ram|Dodge|Ducati|Harley|Yamaha|Kawasaki|Suzuki|Triumph|Indian|KTM|Aprilia|Vespa|INEOS|Grenadier)(\s|$)/i;
    
    // Additional check: text should have at least 2 words (location + brand)
    const wordCount = text.trim().split(/\s+/).length;
    if (dealerNamePattern.test(text) && wordCount >= 2) {
        // Exclude if it's just a brand name or department
        const excludePatterns = /^(Commercial|Fleet|Body Shop|Collision|Parts|Service|Quick Lube|Platform Body Trucks)$/i;
        if (!excludePatterns.test(text)) {
            return true;
        }
    }
    
    // Check for "Used Car" locations only if they have a specific location name
    const usedCarPattern = /^[A-Z][a-zA-Z\s&'-]+(Used Car|Pre-Owned|Preowned|CPO|Certified)\s*(Center|Location|Store|Dealership|Outlet|Superstore)?$/i;
    if (usedCarPattern.test(text) && wordCount >= 3) {
        return true;
    }
    
    // Check for other specialty dealerships only with location names
    const specialtyPattern = /^[A-Z][a-zA-Z\s&'-]+(RV|Recreational Vehicle|Marine|Boat|Powersports|Motorcycle)\s*(Center|Sales|Dealership)?$/i;
    if (specialtyPattern.test(text) && wordCount >= 2) {
        return true;
    }
    
    // Pattern: "Brand of Location" or "Location Brand" - must be specific
    const brandOfLocationPattern = /(Ford|Chevrolet|Toyota|Honda|Nissan|Chrysler|Jeep|GMC|Hyundai|Kia|Mazda|Subaru|Volkswagen|Audi|BMW|Mercedes|Ducati|Harley|Yamaha|Kawasaki|Suzuki|INEOS)\s+of\s+[A-Z][a-zA-Z\s]+/i;
    const locationBrandPattern = /^[A-Z][a-zA-Z\s]+(Ford|Chevrolet|Toyota|Honda|Nissan|Chrysler|Jeep|GMC|Hyundai|Kia|Mazda|Subaru|Volkswagen|Audi|BMW|Mercedes|Ducati|Harley|Yamaha|Kawasaki|Suzuki)$/i;
    
    if ((brandOfLocationPattern.test(text) || locationBrandPattern.test(text)) && wordCount >= 2) {
        return true;
    }
    
    return false;
}

function classifyDealerLink(href, text, baseUrl) {
    if (href.includes('/location') || href.includes('/dealer')) {
        return 'internal-page';
    } else if (href.includes('http')) {
        // Parse the base URL to get hostname
        try {
            const baseHost = new URL(baseUrl).hostname;
            const linkHost = new URL(href).hostname;
            return linkHost !== baseHost ? 'external-site' : 'internal-page';
        } catch (e) {
            return 'unknown';
        }
    } else {
        return 'internal-page'; // Relative URLs are internal
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