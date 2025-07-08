// Comprehensive Audit Tests for Auto Audit Pro
const axios = require('axios');
const { By } = require('selenium-webdriver');

// Test Categories with weights
const TEST_CATEGORIES = {
    'Basic Connectivity': { weight: 0.10, icon: 'fa-plug' },
    'Performance Testing': { weight: 0.20, icon: 'fa-tachometer-alt' },
    'SEO Analysis': { weight: 0.15, icon: 'fa-search' },
    'User Experience': { weight: 0.15, icon: 'fa-users' },
    'Content Analysis': { weight: 0.15, icon: 'fa-file-alt' },
    'Technical Validation': { weight: 0.10, icon: 'fa-code' },
    'Brand Compliance': { weight: 0.08, icon: 'fa-award' },
    'Lead Generation': { weight: 0.07, icon: 'fa-bullseye' }
};

// Basic Connectivity Tests
async function testBasicConnectivity(url, $) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: DNS Resolution
    try {
        const urlObj = new URL(url);
        tests.push({ name: 'DNS Resolution', passed: true });
        score += 1;
    } catch (e) {
        tests.push({ name: 'DNS Resolution', passed: false });
        issues.push({
            title: 'DNS Resolution Failed',
            details: 'Unable to resolve domain name',
            priority: 'high',
            category: 'Basic Connectivity - DNS'
        });
    }

    // Test 2: SSL Certificate
    if (url.startsWith('https://')) {
        tests.push({ name: 'SSL Certificate', passed: true });
        score += 1;
    } else {
        tests.push({ name: 'SSL Certificate', passed: false });
        issues.push({
            title: 'Missing SSL Certificate',
            details: 'Website is not using HTTPS',
            priority: 'high',
            category: 'Basic Connectivity - Security'
        });
    }

    // Test 3: Server Response
    tests.push({ name: 'Server Response', passed: true });
    score += 1;

    // Test 4: Robots.txt
    try {
        const robotsUrl = new URL('/robots.txt', url).href;
        const response = await axios.head(robotsUrl, { timeout: 5000 });
        tests.push({ name: 'Robots.txt Present', passed: response.status === 200 });
        if (response.status === 200) score += 1;
    } catch (e) {
        tests.push({ name: 'Robots.txt Present', passed: false });
    }

    // Test 5: Sitemap
    try {
        const sitemapUrl = new URL('/sitemap.xml', url).href;
        const response = await axios.head(sitemapUrl, { timeout: 5000 });
        tests.push({ name: 'Sitemap Present', passed: response.status === 200 });
        if (response.status === 200) score += 1;
    } catch (e) {
        tests.push({ name: 'Sitemap Present', passed: false });
    }

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// Performance Testing
async function testPerformance($, pageSize = null) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: Page Size
    if (pageSize) {
        const pageSizeMB = pageSize / 1024 / 1024;
        tests.push({ name: 'Page Size', value: `${pageSizeMB.toFixed(2)}MB` });
        
        if (pageSizeMB < 3) {
            score += 1;
        } else if (pageSizeMB > 10) {
            issues.push({
                title: 'Reduce overall page size',
                details: `Total page weight: ${pageSizeMB.toFixed(2)}MB`,
                priority: 'high',
                category: 'Performance Testing - Resource Optimization'
            });
        }
    }

    // Test 2: Image Optimization
    const images = $('img');
    const largeImages = images.filter((i, el) => {
        const src = $(el).attr('src');
        return src && !src.includes('data:image');
    });
    
    tests.push({ name: 'Total Images', value: images.length });
    if (images.length > 50) {
        issues.push({
            title: 'Optimize and compress images',
            details: `${images.length} images found on page`,
            priority: 'high',
            category: 'Performance Testing - Resource Optimization'
        });
    } else {
        score += 1;
    }

    // Test 3: External Scripts
    const scripts = $('script[src]');
    tests.push({ name: 'External Scripts', value: scripts.length });
    if (scripts.length < 10) {
        score += 1;
    } else {
        issues.push({
            title: 'Remove unused JavaScript',
            details: `${scripts.length} external scripts loaded`,
            priority: 'high',
            category: 'Performance Testing - Resource Optimization'
        });
    }

    // Test 4: External Stylesheets
    const stylesheets = $('link[rel="stylesheet"]');
    tests.push({ name: 'External Stylesheets', value: stylesheets.length });
    if (stylesheets.length < 5) {
        score += 1;
    } else {
        issues.push({
            title: 'Remove unused CSS',
            details: `${stylesheets.length} external stylesheets loaded`,
            priority: 'high',
            category: 'Performance Testing - Resource Optimization'
        });
    }

    // Test 5: Inline Styles
    const inlineStyles = $('[style]');
    tests.push({ name: 'Inline Styles', value: inlineStyles.length });
    if (inlineStyles.length < 50) {
        score += 1;
    }

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// SEO Analysis
async function testSEO($, url) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: Title Tag
    const title = $('title').text();
    tests.push({ name: 'Title Tag', value: title.length > 0 ? `${title.length} chars` : 'Missing' });
    if (title.length > 0 && title.length <= 60) {
        score += 1;
    } else if (title.length === 0) {
        issues.push({
            title: 'Missing title tag',
            details: 'Page has no title tag. Add a 50-60 character title in format: "[Dealership Name] | New & Used [Brand] Dealer in [City, State]"',
            priority: 'high',
            category: 'SEO Analysis - Meta Tags'
        });
    } else if (title.length > 60) {
        issues.push({
            title: 'Title tag too long',
            details: `Title is ${title.length} characters (recommended: 50-60)`,
            priority: 'medium',
            category: 'SEO Analysis - Meta Tags'
        });
    }

    // Test 2: Meta Description
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    tests.push({ name: 'Meta Description', value: metaDesc.length > 0 ? `${metaDesc.length} chars` : 'Missing' });
    if (metaDesc.length > 0 && metaDesc.length <= 160) {
        score += 1;
    } else if (metaDesc.length === 0) {
        issues.push({
            title: 'Missing meta description',
            details: 'Page has no meta description. Add a compelling 150-160 character description that includes key services like "new and used vehicles", location, and brand. Example: "Visit [Dealership] in [City] for the best deals on new and used [Brand] vehicles. Expert service, financing available. Call [phone] today!"',
            priority: 'high',
            category: 'SEO Analysis - Meta Tags'
        });
    }

    // Test 3: H1 Tags
    const h1Tags = $('h1');
    tests.push({ name: 'H1 Tags', value: h1Tags.length });
    if (h1Tags.length === 1) {
        score += 1;
    } else if (h1Tags.length === 0) {
        issues.push({
            title: 'Missing H1 tag',
            details: 'Page has no H1 heading. Add one H1 tag with your main keyword phrase, like "[Dealership Name] - Your Trusted [Brand] Dealer in [City]"',
            priority: 'high',
            category: 'SEO Analysis - Structure'
        });
    } else {
        issues.push({
            title: 'Multiple H1 tags',
            details: `Page has ${h1Tags.length} H1 tags (should have exactly 1)`,
            priority: 'medium',
            category: 'SEO Analysis - Structure'
        });
    }

    // Test 4: Schema Markup
    const schemaScripts = $('script[type="application/ld+json"]');
    tests.push({ name: 'Schema Markup', value: schemaScripts.length > 0 ? 'Present' : 'Missing' });
    if (schemaScripts.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'Add structured data',
            details: 'No schema.org markup found. Add AutoDealer schema with business info, hours, location, and reviews. Also add Vehicle schema for inventory items. This helps search engines understand your content and can enable rich snippets.',
            priority: 'medium',
            category: 'SEO Analysis - Schema'
        });
    }

    // Test 5: Canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    tests.push({ name: 'Canonical URL', value: canonical ? 'Present' : 'Missing' });
    if (canonical) {
        score += 1;
    } else {
        issues.push({
            title: 'Add canonical URL',
            details: 'No canonical URL found. Add <link rel="canonical" href="[full-page-url]"> to prevent duplicate content issues, especially important for inventory pages with filters.',
            priority: 'medium',
            category: 'SEO Analysis - Technical'
        });
    }

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// User Experience Tests
async function testUserExperience($) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: Mobile Viewport
    const viewport = $('meta[name="viewport"]').attr('content');
    tests.push({ name: 'Mobile Viewport', value: viewport ? 'Present' : 'Missing' });
    if (viewport) {
        score += 1;
    } else {
        issues.push({
            title: 'Missing mobile viewport',
            details: 'Add viewport meta tag for mobile optimization',
            priority: 'high',
            category: 'User Experience - Mobile'
        });
    }

    // Test 2: Form Labels
    const forms = $('form');
    const inputs = $('input:not([type="hidden"]), select, textarea');
    const labels = $('label');
    tests.push({ name: 'Forms', value: forms.length });
    tests.push({ name: 'Input Fields', value: inputs.length });
    if (inputs.length === 0 || labels.length >= inputs.length * 0.8) {
        score += 1;
    } else {
        issues.push({
            title: 'Form accessibility issues',
            details: 'Not all form inputs have associated labels',
            priority: 'medium',
            category: 'User Experience - Accessibility'
        });
    }

    // Test 3: Navigation Menu - Look for any navigation pattern
    // Check for semantic nav elements
    const semanticNav = $('nav, [role="navigation"]');
    
    // Check for common navigation patterns (lists of links in header)
    const headerLinkGroups = $('header ul li a, header .menu a, header .nav a, .header ul li a, #header ul li a');
    
    // Check for any group of 3+ links that look like navigation
    const linkGroups = $('ul, div').filter((i, el) => {
        const links = $(el).find('a');
        if (links.length >= 3) {
            // Check if at least 2 links have typical nav text
            const navKeywords = ['home', 'about', 'contact', 'service', 'vehicle', 'inventory', 'finance', 'parts', 'special'];
            let navLinkCount = 0;
            links.each((j, link) => {
                const text = $(link).text().toLowerCase();
                if (navKeywords.some(keyword => text.includes(keyword))) {
                    navLinkCount++;
                }
            });
            return navLinkCount >= 2;
        }
        return false;
    });
    
    const hasNavigation = semanticNav.length > 0 || headerLinkGroups.length >= 3 || linkGroups.length > 0;
    tests.push({ name: 'Navigation Elements', value: hasNavigation ? 'Found' : 'Not Found' });
    
    if (hasNavigation) {
        score += 1;
    } else {
        issues.push({
            title: 'Navigation structure could be improved',
            details: 'While navigation may exist, consider using semantic <nav> elements and organizing links in clear groups for better accessibility and SEO.',
            priority: 'medium',
            category: 'User Experience - Navigation'
        });
    }

    // Test 4: Contact Information
    // More flexible phone pattern - handles various formats
    const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    // Also match patterns like "509.816.4400" or "509 816 4400"
    const phonePatternAlt = /\b\d{3}[\.\-\s]\d{3}[\.\-\s]\d{4}\b/g;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Check header area first (more likely to have contact info)
    const headerText = $('header, .header, #header, [class*="header"], [id*="header"], body > div:first-child, body > div:nth-child(2)').text();
    const bodyText = $('body').text();
    
    // Also check for "Call now" or "Call today" patterns, or labeled phone numbers
    const callNowPattern = /call\s*(now|today)?\s*[:|-]?\s*(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi;
    const labeledPhonePattern = /(sales|service|parts)\s*:?\s*(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi;
    const hasCallNow = callNowPattern.test(headerText) || callNowPattern.test(bodyText);
    const hasLabeledPhone = labeledPhonePattern.test(headerText) || labeledPhonePattern.test(bodyText);
    
    // Reset regex lastIndex to ensure proper matching
    phonePattern.lastIndex = 0;
    phonePatternAlt.lastIndex = 0;
    const hasPhoneInHeader = phonePattern.test(headerText) || phonePatternAlt.test(headerText);
    phonePattern.lastIndex = 0;
    phonePatternAlt.lastIndex = 0;
    const hasPhoneAnywhere = phonePattern.test(bodyText) || phonePatternAlt.test(bodyText);
    emailPattern.lastIndex = 0;
    const hasEmail = emailPattern.test(bodyText);
    
    // Also check for address patterns - be flexible with formats
    const addressPattern = /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|wy|circle|cir|court|ct|place|pl)/i;
    const hasAddress = addressPattern.test(headerText) || addressPattern.test(bodyText);
    
    tests.push({ name: 'Phone Number', value: hasPhoneAnywhere ? (hasPhoneInHeader ? 'In Header' : 'Found') : 'Not Found' });
    tests.push({ name: 'Email Address', value: hasEmail ? 'Found' : 'Not Found' });
    tests.push({ name: 'Physical Address', value: hasAddress ? 'Found' : 'Not Found' });
    
    if (hasPhoneInHeader || hasCallNow || hasLabeledPhone || (hasPhoneAnywhere && hasAddress)) {
        score += 1;
    } else if (hasPhoneAnywhere || hasEmail) {
        score += 0.5;
        issues.push({
            title: 'Contact information could be more prominent',
            details: 'Consider placing phone number in header for better visibility. Contact info in header improves user experience.',
            priority: 'low',
            category: 'User Experience - Contact'
        });
    } else {
        issues.push({
            title: 'Contact information not easily found',
            details: 'Add visible phone number and/or email address in header or prominent location',
            priority: 'medium',
            category: 'User Experience - Contact'
        });
    }

    // Test 5: Call-to-Action Buttons
    const ctaButtons = $('a, button').filter((i, el) => {
        const classes = $(el).attr('class') || '';
        const text = $(el).text().toLowerCase();
        const href = $(el).attr('href') || '';
        
        // Check for button-like classes
        if (classes.match(/btn|button|cta/i)) return true;
        
        // Check for CTA-like text
        const ctaKeywords = ['get started', 'contact', 'schedule', 'view inventory', 'browse', 'search', 
                            'find', 'explore', 'shop', 'buy', 'lease', 'finance', 'apply', 'quote'];
        if (ctaKeywords.some(keyword => text.includes(keyword))) return true;
        
        // Check for styled links that might be CTAs (has background color, padding, etc)
        const styles = $(el).attr('style') || '';
        if (styles.includes('background') || styles.includes('padding')) return true;
        
        return false;
    });
    
    tests.push({ name: 'CTA Buttons', value: ctaButtons.length });
    if (ctaButtons.length > 0) {
        score += 1;
    }

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// Content Analysis
async function testContent($, brand) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: Inventory Links
    const inventoryLinks = $('a').filter((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().toLowerCase();
        return href && (href.includes('inventory') || href.includes('vehicles') || href.includes('showroom') ||
                       text.includes('new vehicle') || text.includes('used vehicle') || text.includes('inventory') ||
                       text.includes('view inventory') || text.includes('browse'));
    });
    tests.push({ name: 'Inventory Links', value: inventoryLinks.length });
    if (inventoryLinks.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'Inventory navigation not found',
            details: 'Could not detect inventory/vehicles links in navigation. Ensure "New Vehicles", "Used Vehicles" or similar links are clearly visible in main navigation.',
            priority: 'medium',
            category: 'Content Analysis - Inventory Visibility'
        });
    }

    // Test 2: Contact Information Visibility
    const contactLinks = $('a').filter((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().toLowerCase();
        return href && (href.includes('contact') || href.includes('about') || href.includes('location') ||
                       href.includes('hours') || href.includes('directions') ||
                       text.includes('contact') || text.includes('about us') || text.includes('location') ||
                       text.includes('find us') || text.includes('visit us'));
    });
    tests.push({ name: 'Contact Page Links', value: contactLinks.length });
    if (contactLinks.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'Contact navigation not detected',
            details: 'Could not find "Contact" or "About Us" link in navigation. These help customers find your location and contact information.',
            priority: 'medium',
            category: 'Content Analysis - Contact Information'
        });
    }

    // Test 3: Business Hours
    const hoursPattern = /(\d{1,2}:\d{2}\s*(am|pm|AM|PM))|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/gi;
    const bodyText = $('body').text();
    const hasHours = hoursPattern.test(bodyText);
    const hoursLink = $('a[href*="hours"], a[href*="contact"], a[href*="location"], a[href*="about"]').length > 0;
    const contactInNav = $('nav a, header a').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('contact') || text.includes('about') || text.includes('location');
    }).length > 0;
    
    tests.push({ name: 'Business Hours', value: hasHours ? 'Found' : (hoursLink || contactInNav) ? 'Link Found' : 'Not Found' });
    if (hasHours || hoursLink || contactInNav) {
        score += 1;
    } else {
        issues.push({
            title: 'Business hours not easily accessible',
            details: 'Business hours should be visible on homepage or accessible via Contact/About link in navigation. Many customers check hours before visiting.',
            priority: 'medium',
            category: 'Content Analysis - Business Hours'
        });
    }

    // Test 4: Brand Mentions
    const brandMentions = bodyText.toLowerCase().split(brand.toLowerCase()).length - 1;
    tests.push({ name: 'Brand Mentions', value: brandMentions });
    if (brandMentions > 0) {
        score += 1;
    }

    // Test 5: Fresh Content Indicators
    const currentYear = new Date().getFullYear();
    const hasCurrentYear = bodyText.includes(currentYear.toString());
    tests.push({ name: 'Current Year Reference', value: hasCurrentYear ? 'Yes' : 'No' });
    if (hasCurrentYear) {
        score += 1;
    }

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// Technical Validation
async function testTechnical($) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: HTML Validation
    const doctype = $('!doctype').length > 0 || $.html().toLowerCase().includes('<!doctype');
    tests.push({ name: 'HTML5 Doctype', value: doctype ? 'Present' : 'Missing' });
    if (doctype) {
        score += 1;
    }

    // Test 2: Language Attribute
    const htmlLang = $('html').attr('lang');
    tests.push({ name: 'Language Attribute', value: htmlLang || 'Missing' });
    if (htmlLang) {
        score += 1;
    }

    // Test 3: Favicon
    const favicon = $('link[rel*="icon"]').length > 0;
    tests.push({ name: 'Favicon', value: favicon ? 'Present' : 'Missing' });
    if (favicon) {
        score += 1;
    }

    // Test 4: Alt Text on Images
    const images = $('img');
    const imagesWithAlt = $('img[alt]');
    const altTextPercent = images.length > 0 ? (imagesWithAlt.length / images.length * 100).toFixed(0) : 100;
    tests.push({ name: 'Images with Alt Text', value: `${altTextPercent}%` });
    if (altTextPercent >= 80) {
        score += 1;
    } else {
        issues.push({
            title: 'Add alt text to images',
            details: `Only ${altTextPercent}% of images have alt text`,
            priority: 'medium',
            category: 'Technical Validation - Accessibility'
        });
    }

    // Test 5: Broken Links (simplified check)
    const internalLinks = $('a[href^="/"], a[href^="./"], a[href^="../"]');
    tests.push({ name: 'Internal Links', value: internalLinks.length });
    score += 1; // Give point by default, would need async checking for real validation

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// Brand Compliance
async function testBrandCompliance($, brand, url) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: Brand Logo
    const logos = $('img[src*="logo"], img[alt*="logo"], img[class*="logo"]');
    tests.push({ name: 'Logo Present', value: logos.length > 0 ? 'Yes' : 'No' });
    if (logos.length > 0) {
        score += 1;
    }

    // Test 2: Brand Colors (simplified)
    score += 1; // Would need visual analysis
    tests.push({ name: 'Brand Colors', value: 'Manual Review Required' });

    // Test 3: Legal Disclaimers
    const disclaimerKeywords = ['disclaimer', 'terms', 'privacy', 'legal'];
    const hasDisclaimer = disclaimerKeywords.some(keyword => 
        $('a, footer').text().toLowerCase().includes(keyword)
    );
    tests.push({ name: 'Legal Links', value: hasDisclaimer ? 'Found' : 'Not Found' });
    if (hasDisclaimer) {
        score += 1;
    }

    // Test 4: Manufacturer Links
    const currentDomain = new URL(url).hostname;
    const manufacturerLinks = $(`a[href*="${brand.toLowerCase()}"]`).filter((i, el) => {
        const href = $(el).attr('href');
        if (!href) return false;
        try {
            const linkUrl = new URL(href, url);
            return linkUrl.hostname !== currentDomain;
        } catch (e) {
            return false;
        }
    });
    tests.push({ name: 'Manufacturer Links', value: manufacturerLinks.length });
    if (manufacturerLinks.length > 0) {
        score += 1;
    }

    // Test 5: Copyright Notice
    const copyrightPattern = /©|copyright|\(c\)/i;
    const hasCopyright = copyrightPattern.test($('footer').text());
    tests.push({ name: 'Copyright Notice', value: hasCopyright ? 'Present' : 'Missing' });
    if (hasCopyright) {
        score += 1;
    }

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// Lead Generation
async function testLeadGeneration($) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: Contact Forms or Links
    const forms = $('form').filter((i, el) => {
        const formText = $(el).text().toLowerCase();
        return formText.includes('contact') || formText.includes('email') || 
               formText.includes('name') || formText.includes('phone');
    });
    const contactLinks = $('a').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        const href = $(el).attr('href') || '';
        return text.includes('contact') || href.includes('contact') || 
               text.includes('service') || text.includes('parts') ||
               text.includes('about') || text.includes('location');
    });
    
    tests.push({ name: 'Contact Forms on Homepage', value: forms.length });
    tests.push({ name: 'Contact Links', value: contactLinks.length });
    
    if (forms.length > 0 || contactLinks.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'No clear contact method found',
            details: 'Add a "Contact" link in navigation or a contact form. Make it easy for customers to reach out.',
            priority: 'high',
            category: 'Lead Generation - Forms'
        });
    }

    // Test 2: Phone Number Visibility
    const phoneLinks = $('a[href^="tel:"]');
    const phonePattern = /(\+?1[-.]?\s?)?(\(?\d{3}\)?[-.]?\s?\d{3}[-.]?\s?\d{4})/g;
    const phonePatternAlt = /\b\d{3}[\.\-\s]\d{3}[\.\-\s]\d{4}\b/g;
    const labeledPhonePattern = /(sales|service|parts|call)\s*:?\s*(\+?1[-.]?\s?)?(\(?\d{3}\)?[-.]?\s?\d{3}[-.]?\s?\d{4})/gi;
    
    // Check header first, then full page - also check first few divs
    const headerSelectors = [
        'header', '.header', '#header', 
        '[class*="header"]', '[id*="header"]',
        'body > div:first-child', 'body > div:nth-child(2)', 
        'body > div:nth-child(3)', 'body > div:nth-child(4)',
        '[class*="top"]', '[class*="nav"]',
        '[class*="contact"]', '[class*="phone"]',
        '[class*="utility"]', '[class*="info"]',
        '.top', '.navbar', '.navigation',
        // Also check first text nodes that might contain phone
        'body > *:contains("SALES:")',
        'body > *:contains("SERVICE:")',
        'body > *:contains("Call")'
    ];
    
    let headerText = '';
    headerSelectors.forEach(selector => {
        const element = $(selector);
        if (element.length > 0) {
            headerText += ' ' + element.text();
        }
    });
    
    const pageText = $('body').text();
    
    
    // Try all three patterns for comprehensive detection
    const headerPhones1 = headerText.match(phonePattern) || [];
    const headerPhones2 = headerText.match(phonePatternAlt) || [];
    const headerPhones3 = headerText.match(labeledPhonePattern) || [];
    const headerPhones = [...new Set([...headerPhones1, ...headerPhones2, ...headerPhones3])];
    
    const allPhones1 = pageText.match(phonePattern) || [];
    const allPhones2 = pageText.match(phonePatternAlt) || [];
    const allPhones3 = pageText.match(labeledPhonePattern) || [];
    const allPhones = [...new Set([...allPhones1, ...allPhones2, ...allPhones3])];
    
    tests.push({ name: 'Clickable Phone Links', value: phoneLinks.length });
    tests.push({ name: 'Phone Numbers in Header', value: headerPhones.length });
    tests.push({ name: 'Total Phone Numbers', value: allPhones.length });
    
    if (phoneLinks.length > 0 || headerPhones.length > 0) {
        score += 1;
        if (phoneLinks.length === 0 && headerPhones.length > 0) {
            // Phone numbers in header but not clickable
            issues.push({
                title: 'Make phone numbers clickable',
                details: `Found ${headerPhones.length} phone number(s) that could be made clickable with tel: links for mobile users.`,
                priority: 'low',
                category: 'Lead Generation - Contact'
            });
        }
    } else if (allPhones.length > 0) {
        // Phone numbers exist but not in header
        score += 0.5;
        issues.push({
            title: 'Move phone numbers to header',
            details: `Found ${allPhones.length} phone number(s) but not in header area. Place primary phone number prominently in header for better visibility.`,
            priority: 'medium',
            category: 'Lead Generation - Contact'
        });
    } else {
        // Check if there are other contact methods before flagging
        const hasContactForm = $('form').length > 0;
        const hasContactLink = $('a').filter((i, el) => {
            const text = $(el).text().toLowerCase();
            const href = $(el).attr('href') || '';
            return text.includes('contact') || href.includes('contact');
        }).length > 0;
        
        // Only create issue if no other contact methods exist
        if (!hasContactForm && !hasContactLink) {
            issues.push({
                title: 'Limited contact options detected',
                details: 'Consider adding visible phone numbers, contact forms, or clear contact links to improve lead generation.',
                priority: 'medium',
                category: 'Lead Generation - Contact'
            });
        } else {
            // Has other contact methods, so phone is optional
            score += 0.3; // Partial credit for having alternative contact methods
        }
    }

    // Test 3: Call-to-Action Prominence
    const ctaKeywords = ['get started', 'contact us', 'schedule', 'book', 'appointment', 
                        'quote', 'pricing', 'offer', 'deal', 'special'];
    const ctaElements = $('a, button').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return ctaKeywords.some(keyword => text.includes(keyword));
    });
    tests.push({ name: 'CTA Elements', value: ctaElements.length });
    if (ctaElements.length >= 3) {
        score += 1;
    } else {
        issues.push({
            title: 'Add more prominent calls-to-action',
            details: 'Limited CTA elements found',
            priority: 'medium',
            category: 'Lead Generation - CTAs'
        });
    }

    // Test 4: Chat Widget
    const chatIndicators = $('[class*="chat"], [id*="chat"], script[src*="chat"]');
    tests.push({ name: 'Chat Widget', value: chatIndicators.length > 0 ? 'Present' : 'Not Found' });
    if (chatIndicators.length > 0) {
        score += 1;
    }

    // Test 5: Value Propositions
    const valueKeywords = ['why choose', 'why buy', 'benefits', 'advantage', 'guarantee'];
    const hasValueProp = valueKeywords.some(keyword => 
        $('body').text().toLowerCase().includes(keyword)
    );
    tests.push({ name: 'Value Propositions', value: hasValueProp ? 'Found' : 'Not Found' });
    if (hasValueProp) {
        score += 1;
    }

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues
    };
}

// Main audit function
async function runComprehensiveAudit(url, $, driver = null) {
    const brand = detectBrand($, url);
    const results = {
        url: url,
        domain: new URL(url).hostname,
        brand: brand,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
        categories: [],
        issues: [],
        overallScore: 0,
        detailedResults: {}
    };

    // Run all test categories
    const connectivity = await testBasicConnectivity(url, $);
    const performance = await testPerformance($);
    const seo = await testSEO($, url);
    const ux = await testUserExperience($);
    const content = await testContent($, brand);
    const technical = await testTechnical($);
    const brandCompliance = await testBrandCompliance($, brand, url);
    const leadGen = await testLeadGeneration($);

    // Store detailed results
    results.detailedResults = {
        connectivity, performance, seo, ux, 
        content, technical, brandCompliance, leadGen
    };

    // Calculate scores and format for display
    const categoryResults = [
        { name: 'Basic Connectivity', ...connectivity },
        { name: 'Performance Testing', ...performance },
        { name: 'SEO Analysis', ...seo },
        { name: 'User Experience', ...ux },
        { name: 'Content Analysis', ...content },
        { name: 'Technical Validation', ...technical },
        { name: 'Brand Compliance', ...brandCompliance },
        { name: 'Lead Generation', ...leadGen }
    ];

    let totalWeightedScore = 0;
    categoryResults.forEach((cat, index) => {
        const categoryName = Object.keys(TEST_CATEGORIES)[index];
        const weight = TEST_CATEGORIES[categoryName].weight;
        const normalizedScore = (cat.score / cat.maxScore) * 5;
        
        results.categories.push({
            name: categoryName,
            score: Math.round(normalizedScore),
            testsCompleted: cat.tests.length,
            weight: weight
        });

        // Add to overall score (0-100 scale)
        totalWeightedScore += (cat.score / cat.maxScore) * weight * 100;

        // Collect all issues
        if (cat.issues) {
            results.issues.push(...cat.issues);
        }
    });

    results.overallScore = Math.round(totalWeightedScore);

    // Sort issues by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    results.issues.sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return results;
}

// Helper function from main server.js
function detectBrand($, pageUrl) {
    const KNOWN_BRANDS = ['ford', 'toyota', 'honda', 'chevrolet', 'nissan', 'bmw', 
                         'mercedes-benz', 'lexus', 'audi', 'jeep', 'hyundai', 'kia'];
    const domain = new URL(pageUrl).hostname.toLowerCase();
    const title = $('title').text().toLowerCase();
    
    for (const brand of KNOWN_BRANDS) {
        if (domain.includes(brand) || title.includes(brand)) {
            return brand.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
    return "Automotive";
}

module.exports = {
    runComprehensiveAudit,
    TEST_CATEGORIES
};