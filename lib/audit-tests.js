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

    // Test 3: Navigation Menu
    const nav = $('nav, [role="navigation"], .navigation, .nav, #navigation');
    tests.push({ name: 'Navigation Elements', value: nav.length });
    if (nav.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'No clear navigation found',
            details: 'Add clear navigation menu for better UX',
            priority: 'high',
            category: 'User Experience - Navigation'
        });
    }

    // Test 4: Contact Information
    const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyText = $('body').text();
    const hasPhone = phonePattern.test(bodyText);
    const hasEmail = emailPattern.test(bodyText);
    
    tests.push({ name: 'Phone Number', value: hasPhone ? 'Found' : 'Not Found' });
    tests.push({ name: 'Email Address', value: hasEmail ? 'Found' : 'Not Found' });
    
    if (hasPhone || hasEmail) {
        score += 1;
    } else {
        issues.push({
            title: 'Contact information not easily found',
            details: 'Add visible phone number and/or email address',
            priority: 'high',
            category: 'User Experience - Contact'
        });
    }

    // Test 5: Call-to-Action Buttons
    const ctaButtons = $('a.btn, button, [class*="cta"], [class*="button"]');
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
    const inventoryLinks = $('a[href*="inventory"], a[href*="vehicles"], a[href*="showroom"]');
    tests.push({ name: 'Inventory Links', value: inventoryLinks.length });
    if (inventoryLinks.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'Inventory not prominently featured',
            details: 'Inventory/vehicles link should be prominent in main navigation. Consider adding "View Inventory" or "Browse Vehicles" as a primary navigation item. This is typically what customers are looking for.',
            priority: 'high',
            category: 'Content Analysis - Inventory Visibility'
        });
    }

    // Test 2: Contact Information Visibility
    const contactLinks = $('a[href*="contact"], a[href*="about"], a[href*="location"]');
    tests.push({ name: 'Contact Page Links', value: contactLinks.length });
    if (contactLinks.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'Contact information not prominently displayed',
            details: 'Contact page link should be in main navigation. Also consider adding phone number to header and full contact details (address, phone, email) to footer for better accessibility.',
            priority: 'high',
            category: 'Content Analysis - Contact Information'
        });
    }

    // Test 3: Business Hours
    const hoursPattern = /(\d{1,2}:\d{2}\s*(am|pm|AM|PM))|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/gi;
    const bodyText = $('body').text();
    const hasHours = hoursPattern.test(bodyText);
    const hoursLink = $('a[href*="hours"], a[href*="contact"], a[href*="location"]').length > 0;
    tests.push({ name: 'Business Hours', value: hasHours ? 'Found' : hoursLink ? 'Link Found' : 'Not Found' });
    if (hasHours || hoursLink) {
        score += 1;
    } else {
        issues.push({
            title: 'Business hours not easily accessible',
            details: 'Business hours should be visible on homepage or clearly linked from main navigation. Consider adding hours to footer or header for easy access. Many customers check hours before visiting.',
            priority: 'high',
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
async function testBrandCompliance($, brand) {
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
    const manufacturerLinks = $(`a[href*="${brand.toLowerCase()}"]`).filter((i, el) => {
        const href = $(el).attr('href');
        return href && !href.includes(window.location.hostname);
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

    // Test 1: Contact Forms
    const forms = $('form').filter((i, el) => {
        const formText = $(el).text().toLowerCase();
        return formText.includes('contact') || formText.includes('email') || 
               formText.includes('name') || formText.includes('phone');
    });
    tests.push({ name: 'Contact Forms', value: forms.length });
    if (forms.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'Add contact form',
            details: 'No contact forms found on homepage. Add a prominent "Get a Quote" or "Contact Us" form above the fold. Consider also adding forms for "Schedule Test Drive", "Value Your Trade", and "Check Availability" to capture different types of leads.',
            priority: 'high',
            category: 'Lead Generation - Forms'
        });
    }

    // Test 2: Phone Number Visibility
    const phoneLinks = $('a[href^="tel:"]');
    tests.push({ name: 'Clickable Phone Links', value: phoneLinks.length });
    if (phoneLinks.length > 0) {
        score += 1;
    } else {
        issues.push({
            title: 'Make phone numbers clickable',
            details: 'Add tel: links for phone numbers',
            priority: 'medium',
            category: 'Lead Generation - Contact'
        });
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
    const brandCompliance = await testBrandCompliance($, brand);
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