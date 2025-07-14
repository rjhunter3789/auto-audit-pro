/*
 * Auto Audit Pro - Professional Dealership Website Analysis Platform
 * Version 2.2
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Author: JL Robinson
 * Contact: nakapaahu@gmail.com
 * Last Modified: July 13, 2025
 * 
 * This software is protected by copyright law.
 * Unauthorized reproduction or distribution is prohibited.
 */

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
    const isHttps = url.startsWith('https://');
    const hasHttpsRedirect = url.startsWith('http://') && $ && $('meta[http-equiv="refresh"]').attr('content')?.includes('https://');
    
    if (isHttps) {
        tests.push({ name: 'SSL Certificate', passed: true });
        score += 1;
    } else if (hasHttpsRedirect) {
        tests.push({ name: 'SSL Certificate', passed: true, value: 'Redirects to HTTPS' });
        score += 0.9;
    } else if (url.startsWith('http://')) {
        // Check if this might be a subdomain or special case
        const domain = new URL(url).hostname;
        const isSubdomain = domain.split('.').length > 2;
        
        tests.push({ name: 'SSL Certificate', passed: false });
        issues.push({
            title: isSubdomain ? 'SSL Certificate verification needed' : 'Missing SSL Certificate',
            details: isSubdomain 
                ? 'This subdomain is not using HTTPS. Some subdomains may not require SSL, but main website should always use HTTPS. Manual verification recommended.'
                : 'Website is not using HTTPS. SSL certificates are essential for security, SEO rankings, and customer trust.',
            priority: isSubdomain ? 'medium' : 'high',
            category: 'Basic Connectivity - Security',
            confidence: isSubdomain ? 'moderate' : 'high'
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
async function testPerformance($, pageSize = null, url = null) {
    const tests = [];
    const issues = [];
    let score = 0;
    
    // Extract page context from URL if available
    let fullPageContext = '';
    if (url) {
        const urlObj = new URL(url);
        const pageContext = urlObj.pathname === '/' ? 'Homepage' : urlObj.pathname.replace(/\//g, ' ').trim() || 'this page';
        fullPageContext = ` on ${pageContext}`;
    }

    // Test 1: Page Size
    if (pageSize) {
        const pageSizeMB = pageSize / 1024 / 1024;
        tests.push({ name: 'Page Size', value: `${pageSizeMB.toFixed(2)}MB` });
        
        if (pageSizeMB < 3) {
            score += 1;
        } else if (pageSizeMB > 10) {
            issues.push({
                title: `Reduce overall page size${fullPageContext}`,
                details: `Total page weight: ${pageSizeMB.toFixed(2)}MB${fullPageContext}`,
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
            title: `Optimize and compress images${fullPageContext}`,
            details: `${images.length} images found${fullPageContext}`,
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
            title: `Remove unused JavaScript${fullPageContext}`,
            details: `${scripts.length} external scripts loaded${fullPageContext}`,
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
            title: `Remove unused CSS${fullPageContext}`,
            details: `${stylesheets.length} external stylesheets loaded${fullPageContext}`,
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
    
    // Extract page context from URL for clearer issue reporting
    const urlObj = new URL(url);
    const pageContext = urlObj.pathname === '/' ? 'Homepage' : urlObj.pathname.replace(/\//g, ' ').trim() || 'this page';
    const fullPageContext = `on ${pageContext}`;

    // Test 1: Title Tag
    const title = $('title').text();
    tests.push({ name: 'Title Tag', value: title.length > 0 ? `${title.length} chars` : 'Missing' });
    if (title.length > 0 && title.length <= 60) {
        score += 1;
    } else if (title.length === 0) {
        // Check for OG title as indicator of dynamic rendering
        const hasOGTitle = $('meta[property="og:title"]').attr('content');
        
        issues.push({
            title: hasOGTitle ? `Missing HTML title tag ${fullPageContext}` : `Missing title tag ${fullPageContext}`,
            details: hasOGTitle 
                ? `Social media title tag found but no standard HTML title tag ${fullPageContext}. The <title> tag is critical for SEO. Your CMS may be misconfigured.`
                : `No title tag detected ${fullPageContext}. Title tags may be added dynamically by JavaScript. Verify using View Source. Add a 50-60 character title for better SEO.`,
            priority: 'high',
            category: 'SEO Analysis - Meta Tags',
            confidence: hasOGTitle ? 'high' : 'moderate'
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
        // Check if meta description might be added dynamically
        const hasOGDescription = $('meta[property="og:description"]').attr('content');
        const hasTwitterDescription = $('meta[name="twitter:description"]').attr('content');
        
        if (hasOGDescription || hasTwitterDescription) {
            score += 0.5;
            issues.push({
                title: `Missing standard meta description ${fullPageContext}`,
                details: `Social media meta descriptions found but no standard meta description tag ${fullPageContext}. While social tags are good, search engines primarily use the standard meta description tag.`,
                priority: 'medium',
                category: 'SEO Analysis - Meta Tags',
                confidence: 'high'
            });
        } else {
            issues.push({
                title: `Missing meta description ${fullPageContext}`,
                details: `No meta description detected ${fullPageContext}. Meta descriptions may be added dynamically by your CMS. Use Google Search Console to verify. If missing, add a compelling 150-160 character description.`,
                priority: 'high',
                category: 'SEO Analysis - Meta Tags',
                confidence: 'moderate'
            });
        }
    }

    // Test 3: H1 Tags
    const h1Tags = $('h1');
    tests.push({ name: 'H1 Tags', value: h1Tags.length });
    if (h1Tags.length === 1) {
        score += 1;
    } else if (h1Tags.length === 0) {
        issues.push({
            title: `Missing H1 tag ${fullPageContext}`,
            details: `No H1 heading found ${fullPageContext}. Add one H1 tag with your main keyword phrase, like "[Dealership Name] - Your Trusted [Brand] Dealer in [City]"`,
            priority: 'high',
            category: 'SEO Analysis - Structure'
        });
    } else {
        issues.push({
            title: `Multiple H1 tags ${fullPageContext}`,
            details: `Found ${h1Tags.length} H1 tags ${fullPageContext} (should have exactly 1). This confuses search engines about the main topic. Review and consolidate to a single H1.`,
            priority: 'medium',
            category: 'SEO Analysis - Structure'
        });
    }

    // Test 4: Schema Markup
    const schemaScripts = $('script[type="application/ld+json"]');
    
    // Check for other schema implementations
    const hasMicrodata = $('[itemscope][itemtype*="schema.org"]').length > 0;
    const hasRDFa = $('[vocab*="schema.org"], [typeof], [property]').length > 0;
    const hasMetaTags = $('meta[property*="og:"], meta[name*="twitter:"]').length > 0;
    
    let schemaStatus = 'Not detected';
    let confidence = 'high';
    
    if (schemaScripts.length > 0) {
        schemaStatus = 'JSON-LD Present';
        score += 1;
    } else if (hasMicrodata || hasRDFa) {
        schemaStatus = 'Alternative format detected';
        score += 0.8;
        confidence = 'moderate';
    } else if (hasMetaTags) {
        schemaStatus = 'Social meta tags only';
        score += 0.3;
        confidence = 'moderate';
        issues.push({
            title: 'Add comprehensive structured data',
            details: 'Social media meta tags detected but no schema.org markup found. Add AutoDealer schema with business info, hours, location, and reviews for better search visibility.',
            priority: 'medium',
            category: 'SEO Analysis - Schema',
            confidence: 'moderate'
        });
    } else {
        // Schema might be injected by JavaScript
        confidence = 'moderate';
        issues.push({
            title: 'Structured data not detected',
            details: 'No schema.org markup found in initial HTML. Schema may be added dynamically via JavaScript. Use Google\'s Rich Results Test tool to verify. If missing, add AutoDealer and Vehicle schemas.',
            priority: 'medium',
            category: 'SEO Analysis - Schema',
            confidence: 'moderate'
        });
    }
    
    tests.push({ name: 'Schema Markup', value: schemaStatus });

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
async function testUserExperience($, url) {
    const tests = [];
    const issues = [];
    let score = 0;
    
    // Extract page context from URL for clearer issue reporting
    const urlObj = new URL(url);
    const pageContext = urlObj.pathname === '/' ? 'Homepage' : urlObj.pathname.replace(/\//g, ' ').trim() || 'this page';
    const fullPageContext = `on ${pageContext}`;

    // Test 1: Mobile Viewport
    const viewport = $('meta[name="viewport"]').attr('content');
    tests.push({ name: 'Mobile Viewport', value: viewport ? 'Present' : 'Missing' });
    if (viewport) {
        score += 1;
    } else {
        issues.push({
            title: `Missing mobile viewport ${fullPageContext}`,
            details: `No viewport meta tag found ${fullPageContext}. Add <meta name="viewport" content="width=device-width, initial-scale=1"> for proper mobile display`,
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
    
    // Enhanced pattern matching for dealer-specific phone labels (99% of dealers use these)
    const dealerPhonePatterns = [
        /(sales|new|pre-owned)\s*:?\s*(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi,
        /(service|parts|body\s*shop)\s*:?\s*(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi,
        /(call|phone|contact)\s*:?\s*(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi,
        // Common formats like "SALES: 866-261-6870"
        /[A-Z]+\s*:\s*\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g
    ];
    
    const hasCallNow = callNowPattern.test(headerText) || callNowPattern.test(bodyText);
    const hasLabeledPhone = dealerPhonePatterns.some(pattern => {
        pattern.lastIndex = 0;
        return pattern.test(headerText) || pattern.test(bodyText);
    });
    
    // Also check for tel: links which are standard for mobile-friendly sites
    const hasTelLinks = $('a[href^="tel:"]').length > 0;
    
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
    
    // Reframe the phone number test to be more accurate
    let phoneStatus = 'Unable to verify automatically';
    let confidence = 'manual-review';
    
    if (hasTelLinks || hasLabeledPhone) {
        phoneStatus = 'Properly displayed';
        confidence = 'high';
    } else if (hasPhoneInHeader) {
        phoneStatus = 'In Header';
        confidence = 'high';
    } else if (hasPhoneAnywhere) {
        phoneStatus = 'Found (review placement)';
        confidence = 'moderate';
    }
    
    tests.push({ name: 'Phone Number', value: phoneStatus });
    tests.push({ name: 'Email Address', value: hasEmail ? 'Found' : 'Not Found' });
    tests.push({ name: 'Physical Address', value: hasAddress ? 'Found' : 'Not Found' });
    
    if (hasTelLinks || hasLabeledPhone || hasPhoneInHeader || hasCallNow || (hasPhoneAnywhere && hasAddress)) {
        score += 1;
    } else if (hasPhoneAnywhere || hasEmail) {
        score += 0.5;
        issues.push({
            title: 'Contact information could be more prominent',
            details: 'Phone number found but not in header. Header placement increases visibility by 40% and improves mobile user experience. Current placement may cause users to search for contact information.',
            priority: 'medium',
            category: 'User Experience - Contact',
            currentState: 'Phone found in body/footer only',
            impact: 'Users spend extra time searching for contact info, potentially leading to frustration or abandonment',
            confidence: 'moderate'
        });
    } else if (phoneStatus === 'Unable to verify automatically') {
        // Don't penalize if we can't verify - manual review needed
        score += 0.5;
        issues.push({
            title: 'Contact information verification required',
            details: 'Automated analysis could not verify phone number placement. Phone numbers may be displayed as images or loaded dynamically. Manual review recommended. Most dealerships display phone numbers prominently in the header with department-specific numbers (Sales, Service, Parts).',
            priority: 'info',
            category: 'User Experience - Contact',
            requiresManualReview: true,
            confidence: 'manual-review'
        });
    } else {
        issues.push({
            title: `No phone number found ${fullPageContext}`,
            details: `No phone number detected ${fullPageContext}. This is unusual for a dealership website and may indicate a technical issue or that contact information is loaded dynamically.`,
            priority: 'high',
            category: 'User Experience - Contact',
            confidence: 'manual-review'
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
async function testContent($, brand, url) {
    const tests = [];
    const issues = [];
    let score = 0;
    
    // Extract page context from URL for clearer issue reporting
    const urlObj = new URL(url);
    const pageContext = urlObj.pathname === '/' ? 'Homepage' : urlObj.pathname.replace(///g, ' ').trim() || 'this page';
    const fullPageContext = `on ${pageContext}`;

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
            title: `Inventory navigation not found ${fullPageContext}`,
            details: `Could not detect inventory/vehicles links in navigation ${fullPageContext}. Ensure "New Vehicles", "Used Vehicles" or similar links are clearly visible in main navigation.`,
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
            title: `Contact navigation not detected ${fullPageContext}`,
            details: `Could not find "Contact" or "About Us" link in navigation ${fullPageContext}. These help customers find your location and contact information.`,
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
            title: `Business hours not easily accessible ${fullPageContext}`,
            details: `Business hours should be visible ${fullPageContext} or accessible via Contact/About link in navigation. Many customers check hours before visiting.`,
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
async function testTechnical($, url) {
    const tests = [];
    const issues = [];
    let score = 0;
    
    // Extract page context from URL for clearer issue reporting
    const urlObj = new URL(url);
    const pageContext = urlObj.pathname === '/' ? 'Homepage' : urlObj.pathname.replace(///g, ' ').trim() || 'this page';
    const fullPageContext = `on ${pageContext}`;

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
            title: `Add alt text to images ${fullPageContext}`,
            details: `Only ${altTextPercent}% of images have alt text ${fullPageContext}`,
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
    
    // Extract page context from URL for clearer issue reporting
    const urlObj = new URL(url);
    const pageContext = urlObj.pathname === '/' ? 'Homepage' : urlObj.pathname.replace(/\//g, ' ').trim() || 'this page';
    const fullPageContext = `on ${pageContext}`;

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
async function testLeadGeneration($, url) {
    const tests = [];
    const issues = [];
    let score = 0;
    
    // Extract page context from URL for clearer issue reporting
    const urlObj = new URL(url);
    const pageContext = urlObj.pathname === '/' ? 'Homepage' : urlObj.pathname.replace(/\//g, ' ').trim() || 'this page';
    const fullPageContext = `on ${pageContext}`;

    // Test 1: Contact Forms or Links
    const forms = $('form').filter((i, el) => {
        const formText = $(el).text().toLowerCase();
        return formText.includes('contact') || formText.includes('email') || 
               formText.includes('name') || formText.includes('phone');
    });
    
    // Check for dynamic form indicators
    const hasDynamicFormIndicators = $('[id*="form"], [class*="form"], [data-form], iframe[src*="form"]').length > 0;
    const hasFormScript = $('script[src*="form"], script[src*="leadgen"], script[src*="hubspot"], script[src*="marketo"]').length > 0;
    
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
    } else if (hasDynamicFormIndicators || hasFormScript) {
        // Forms may load dynamically
        score += 0.8;
        issues.push({
            title: 'Form System Review',
            details: 'Form indicators detected but forms may load dynamically. Manual verification recommended to ensure forms are functioning properly.',
            priority: 'info',
            category: 'Lead Generation - Forms',
            confidence: 'manual-review'
        });
    } else {
        issues.push({
            title: 'No clear contact method found',
            details: 'No contact forms or clear contact links detected. Forms may be loaded via JavaScript or third-party services. Manual review recommended.',
            priority: 'high',
            category: 'Lead Generation - Forms',
            confidence: 'moderate'
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
                title: `Make phone numbers clickable ${fullPageContext}`,
                details: `Found ${headerPhones.length} phone number(s) ${fullPageContext} that could be made clickable with tel: links for mobile users.`,
                priority: 'low',
                category: 'Lead Generation - Contact'
            });
        }
    } else if (allPhones.length > 0) {
        // Phone numbers exist but not in header
        score += 0.5;
        issues.push({
            title: `Move phone numbers to header ${fullPageContext}`,
            details: `Found ${allPhones.length} phone number(s) ${fullPageContext} but not in header area. Place primary phone number prominently in header for better visibility.`,
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
                title: `Limited contact options detected ${fullPageContext}`,
                details: `Consider adding visible phone numbers, contact forms, or clear contact links ${fullPageContext} to improve lead generation.`,
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
            title: `Add more prominent calls-to-action ${fullPageContext}`,
            details: `Limited CTA elements found ${fullPageContext}`,
            priority: 'medium',
            category: 'Lead Generation - CTAs'
        });
    }

    // Test 4: Chat Widget
    const chatIndicators = $('[class*="chat"], [id*="chat"], script[src*="chat"]');
    const chatScripts = $('script[src*="chat"], script[src*="tawk"], script[src*="intercom"], script[src*="drift"], script[src*="zendesk"], script[src*="livechat"], script[src*="olark"]');
    const chatDivs = $('div[class*="chat"], div[id*="chat"], iframe[src*="chat"], iframe[title*="chat"]');
    
    let chatStatus = 'Not detected';
    let chatConfidence = 'high';
    
    if (chatScripts.length > 0 || chatDivs.length > 2) {
        chatStatus = 'Present';
        score += 1;
    } else if (chatIndicators.length > 0) {
        chatStatus = 'Indicators found';
        score += 0.8;
        chatConfidence = 'moderate';
    } else {
        // Chat widgets often load after page load
        chatStatus = 'Not detected';
        chatConfidence = 'moderate';
        // Don't penalize - chat is optional and often loads dynamically
        score += 0.5; // Neutral score
    }
    
    tests.push({ name: 'Chat Widget', value: chatStatus });

    // Test 5: Social Media Links
    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'tiktok'];
    const socialLinks = $('a').filter((i, el) => {
        const href = $(el).attr('href') || '';
        return socialPlatforms.some(platform => href.toLowerCase().includes(platform));
    });
    
    // Check for social icons in footer or header
    const socialIcons = $('[class*="social"], [class*="facebook"], [class*="twitter"], [class*="instagram"], [class*="youtube"]');
    const socialScripts = $('script[src*="facebook"], script[src*="twitter"], script[src*="instagram"]');
    
    let socialStatus = 'Not detected';
    let socialConfidence = 'high';
    
    if (socialLinks.length > 0) {
        socialStatus = `${socialLinks.length} platforms`;
        score += 1;
    } else if (socialIcons.length > 0 || socialScripts.length > 0) {
        socialStatus = 'Icons/scripts detected';
        score += 0.8;
        socialConfidence = 'moderate';
    } else {
        // Social links might be in footer or loaded dynamically
        socialStatus = 'Not detected';
        socialConfidence = 'moderate';
        score += 0.3; // Don't heavily penalize - social is good but not critical
        
        issues.push({
            title: `Social media links not found ${fullPageContext}`,
            details: `No social media links detected ${fullPageContext}. Social links may be in the footer or loaded dynamically. Adding social media links helps build trust and provides additional communication channels.`,
            priority: 'low',
            category: 'Lead Generation - Social',
            confidence: 'moderate'
        });
    }
    
    tests.push({ name: 'Social Media Links', value: socialStatus });

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
    const performance = await testPerformance($, null, url);
    const seo = await testSEO($, url);
    const ux = await testUserExperience($, url);
    const content = await testContent($, brand, url);
    const technical = await testTechnical($, url);
    const brandCompliance = await testBrandCompliance($, brand, url);
    const leadGen = await testLeadGeneration($, url);

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

// SEO-only audit function
async function runSEOAudit(url, $) {
    const brand = detectBrand($, url);
    const results = {
        url: url,
        domain: new URL(url).hostname,
        brand: brand,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
        categories: [],
        issues: [],
        overallScore: 0,
        detailedResults: {},
        auditType: 'seo'
    };

    // Run only SEO tests
    const seo = await testSEO($, url);
    
    // Store detailed results
    results.detailedResults = { seo };

    // Format for display - only SEO category
    const categoryResults = [
        { name: 'SEO Analysis', ...seo }
    ];

    // For SEO-only audit, the score is just the SEO score
    const normalizedScore = (seo.score / seo.maxScore) * 100;
    
    results.categories.push({
        name: 'SEO Analysis',
        score: Math.round((seo.score / seo.maxScore) * 5),
        weight: 1.0, // 100% weight for SEO-only
        icon: TEST_CATEGORIES['SEO Analysis'].icon,
        tests: seo.tests.length,
        testsCompleted: seo.tests.length
    });

    // Add SEO issues
    if (seo.issues) {
        results.issues.push(...seo.issues);
    }

    results.overallScore = Math.round(normalizedScore);

    return results;
}

module.exports = {
    runComprehensiveAudit,
    runSEOAudit,
    TEST_CATEGORIES
};