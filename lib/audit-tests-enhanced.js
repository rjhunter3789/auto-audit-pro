/*
 * Auto Audit Pro - Enhanced Audit System with Confidence Scoring
 * Version 2.7.0
 * © 2025 JL Robinson. All Rights Reserved.
 */

const axios = require('axios');
const { By } = require('selenium-webdriver');

// Enhanced test categories with detailed descriptions
const TEST_CATEGORIES = {
    'Basic Connectivity': { 
        weight: 0.10, 
        icon: 'fa-plug',
        description: 'Verifies website is accessible and secure',
        tests: ['DNS Resolution', 'SSL Certificate', 'Server Response', 'Robots.txt', 'Sitemap']
    },
    'Performance Testing': { 
        weight: 0.20, 
        icon: 'fa-tachometer-alt',
        description: 'Analyzes page load speed and resource optimization',
        tests: ['Page Size', 'Image Optimization', 'Script Loading', 'CSS Efficiency']
    },
    'SEO Analysis': { 
        weight: 0.15, 
        icon: 'fa-search',
        description: 'Evaluates search engine optimization elements',
        tests: ['Title Tag', 'Meta Description', 'Heading Structure', 'Schema Markup', 'URL Structure']
    },
    'User Experience': { 
        weight: 0.15, 
        icon: 'fa-users',
        description: 'Assesses ease of use and accessibility',
        tests: ['Mobile Readiness', 'Navigation', 'Contact Visibility', 'Form Accessibility']
    },
    'Content Analysis': { 
        weight: 0.15, 
        icon: 'fa-file-alt',
        description: 'Checks dealership-specific content quality',
        tests: ['Inventory Access', 'Business Information', 'Service Offerings', 'Fresh Content']
    },
    'Technical Validation': { 
        weight: 0.10, 
        icon: 'fa-code',
        description: 'Reviews technical implementation standards',
        tests: ['HTML Validity', 'Accessibility', 'Error Handling', 'Code Quality']
    },
    'Brand Compliance': { 
        weight: 0.08, 
        icon: 'fa-award',
        description: 'Ensures brand standards are met',
        tests: ['Logo Presence', 'Legal Compliance', 'Brand Consistency']
    },
    'Lead Generation': { 
        weight: 0.07, 
        icon: 'fa-bullseye',
        description: 'Evaluates conversion optimization elements',
        tests: ['Contact Methods', 'CTAs', 'Forms', 'Trust Signals']
    }
};

// Confidence levels for results
const CONFIDENCE = {
    HIGH: { level: 'high', score: 1.0, color: 'green', description: 'Verified with high confidence' },
    MODERATE: { level: 'moderate', score: 0.8, color: 'yellow', description: 'Likely accurate but needs verification' },
    LOW: { level: 'low', score: 0.6, color: 'orange', description: 'Uncertain - manual review recommended' },
    MANUAL: { level: 'manual-review', score: 0.5, color: 'gray', description: 'Requires manual verification' }
};

// Enhanced issue structure
class AuditIssue {
    constructor(data) {
        this.title = data.title;
        this.description = data.description;
        this.category = data.category;
        this.priority = data.priority || 'medium';
        this.confidence = data.confidence || CONFIDENCE.HIGH;
        this.evidence = data.evidence || [];
        this.impact = data.impact || 'Affects user experience';
        this.solution = data.solution || 'Review and update';
        this.effort = data.effort || 'medium';
        this.businessValue = data.businessValue || 'medium';
        this.technicalDetails = data.technicalDetails || null;
    }

    toJSON() {
        return {
            title: this.title,
            description: this.description,
            category: this.category,
            priority: this.priority,
            confidence: this.confidence.level,
            confidenceScore: this.confidence.score,
            evidence: this.evidence,
            impact: this.impact,
            solution: this.solution,
            effort: this.effort,
            businessValue: this.businessValue,
            technicalDetails: this.technicalDetails
        };
    }
}

// Enhanced test result structure
class TestResult {
    constructor(name, passed, data = {}) {
        this.name = name;
        this.passed = passed;
        this.confidence = data.confidence || CONFIDENCE.HIGH;
        this.value = data.value || (passed ? 'Passed' : 'Failed');
        this.details = data.details || null;
        this.evidence = data.evidence || [];
        this.dataSource = data.dataSource || 'HTML Analysis';
    }

    toJSON() {
        return {
            name: this.name,
            passed: this.passed,
            confidence: this.confidence.level,
            value: this.value,
            details: this.details,
            evidence: this.evidence,
            dataSource: this.dataSource
        };
    }
}

// Enhanced connectivity tests with better error handling
async function testBasicConnectivity(url, $) {
    const tests = [];
    const issues = [];
    let score = 0;

    // Test 1: DNS Resolution
    try {
        const urlObj = new URL(url);
        tests.push(new TestResult('DNS Resolution', true, {
            value: urlObj.hostname,
            dataSource: 'URL Parsing'
        }));
        score += 1;
    } catch (e) {
        tests.push(new TestResult('DNS Resolution', false, {
            value: 'Failed to parse URL',
            confidence: CONFIDENCE.HIGH
        }));
        issues.push(new AuditIssue({
            title: 'Invalid URL Format',
            description: `The URL "${url}" could not be parsed. Ensure it includes http:// or https://`,
            category: 'Basic Connectivity',
            priority: 'critical',
            confidence: CONFIDENCE.HIGH,
            solution: 'Verify URL format is correct (e.g., https://www.example.com)',
            impact: 'Website cannot be accessed'
        }));
    }

    // Test 2: SSL Certificate with detailed checking
    const isHttps = url.startsWith('https://');
    const urlObj = new URL(url);
    const isSubdomain = urlObj.hostname.split('.').length > 2;
    
    if (isHttps) {
        tests.push(new TestResult('SSL Certificate', true, {
            value: 'HTTPS Enabled',
            details: 'Site uses secure HTTPS protocol',
            dataSource: 'URL Protocol'
        }));
        score += 1;
    } else {
        // Check if page redirects to HTTPS
        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
        const hasHttpsRedirect = metaRefresh && metaRefresh.includes('https://');
        
        if (hasHttpsRedirect) {
            tests.push(new TestResult('SSL Certificate', true, {
                value: 'Redirects to HTTPS',
                confidence: CONFIDENCE.MODERATE,
                details: 'HTTP redirects to HTTPS version',
                evidence: [`Meta refresh: ${metaRefresh}`]
            }));
            score += 0.9;
        } else {
            tests.push(new TestResult('SSL Certificate', false, {
                value: 'Not using HTTPS',
                confidence: isSubdomain ? CONFIDENCE.MODERATE : CONFIDENCE.HIGH
            }));
            
            issues.push(new AuditIssue({
                title: isSubdomain ? 'Subdomain not using HTTPS' : 'Missing SSL Certificate',
                description: isSubdomain 
                    ? `The subdomain ${urlObj.hostname} is not using HTTPS. While some subdomains may not require SSL, the main website should always use HTTPS.`
                    : `Your website is not using HTTPS (SSL/TLS encryption). This is critical for security and SEO.`,
                category: 'Security',
                priority: isSubdomain ? 'medium' : 'critical',
                confidence: isSubdomain ? CONFIDENCE.MODERATE : CONFIDENCE.HIGH,
                evidence: [`Current protocol: ${urlObj.protocol}`],
                impact: 'Google marks HTTP sites as "Not Secure", hurting trust and SEO rankings',
                solution: 'Install an SSL certificate (many hosts offer free Let\'s Encrypt certificates)',
                effort: 'low',
                businessValue: 'high'
            }));
        }
    }

    // Test 3: Robots.txt with actual content check
    try {
        const robotsUrl = new URL('/robots.txt', url).href;
        const response = await axios.get(robotsUrl, { 
            timeout: 5000,
            validateStatus: status => status < 500 
        });
        
        if (response.status === 200) {
            const content = response.data;
            const hasContent = content && content.length > 10;
            const hasUserAgent = content.includes('User-agent');
            
            tests.push(new TestResult('Robots.txt', true, {
                value: hasUserAgent ? 'Properly configured' : 'Present but may be empty',
                confidence: CONFIDENCE.HIGH,
                details: `File size: ${content.length} bytes`,
                evidence: hasUserAgent ? ['Contains User-agent directives'] : ['File exists but check content']
            }));
            score += hasUserAgent ? 1 : 0.7;
            
            if (!hasUserAgent) {
                issues.push(new AuditIssue({
                    title: 'Robots.txt needs configuration',
                    description: 'Your robots.txt file exists but appears to be empty or misconfigured',
                    category: 'SEO Technical',
                    priority: 'low',
                    solution: 'Add User-agent and crawl directives to robots.txt',
                    technicalDetails: 'Example:\nUser-agent: *\nAllow: /\nSitemap: https://yoursite.com/sitemap.xml'
                }));
            }
        } else {
            tests.push(new TestResult('Robots.txt', false, {
                value: `HTTP ${response.status}`,
                confidence: CONFIDENCE.HIGH
            }));
        }
    } catch (e) {
        tests.push(new TestResult('Robots.txt', false, {
            value: 'Not accessible',
            confidence: CONFIDENCE.MODERATE,
            details: 'Could not fetch robots.txt file'
        }));
    }

    // Test 4: Sitemap check
    const sitemapUrls = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap'];
    let sitemapFound = false;
    
    for (const path of sitemapUrls) {
        try {
            const sitemapUrl = new URL(path, url).href;
            const response = await axios.head(sitemapUrl, { 
                timeout: 3000,
                validateStatus: status => status === 200 
            });
            
            if (response.status === 200) {
                sitemapFound = true;
                tests.push(new TestResult('XML Sitemap', true, {
                    value: 'Found',
                    details: `Located at ${path}`,
                    dataSource: 'HTTP Check'
                }));
                score += 1;
                break;
            }
        } catch (e) {
            // Continue checking other paths
        }
    }
    
    if (!sitemapFound) {
        // Check if sitemap is referenced in robots.txt
        tests.push(new TestResult('XML Sitemap', false, {
            value: 'Not found at standard locations',
            confidence: CONFIDENCE.MODERATE,
            details: 'Checked /sitemap.xml, /sitemap_index.xml'
        }));
        
        issues.push(new AuditIssue({
            title: 'XML Sitemap not found',
            description: 'Could not find an XML sitemap at standard locations. Sitemaps help search engines discover all your pages.',
            category: 'SEO Technical',
            priority: 'medium',
            confidence: CONFIDENCE.MODERATE,
            impact: 'Search engines may miss important pages',
            solution: 'Create an XML sitemap and submit it to Google Search Console',
            effort: 'low',
            technicalDetails: 'Sitemap should be at /sitemap.xml and referenced in robots.txt'
        }));
    }

    // Test 5: Page Load Success
    tests.push(new TestResult('Page Loaded Successfully', true, {
        value: 'Yes',
        details: `Loaded ${$.html().length} bytes of HTML`,
        dataSource: 'Direct Access'
    }));
    score += 1;

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues,
        summary: `Website connectivity score: ${Math.round(score/5*100)}%`
    };
}

// Enhanced SEO Analysis with detailed evidence
async function testSEO($, url) {
    const tests = [];
    const issues = [];
    let score = 0;
    
    const urlObj = new URL(url);
    const isHomepage = urlObj.pathname === '/' || urlObj.pathname === '';
    const pageName = isHomepage ? 'homepage' : urlObj.pathname.replace(/[/_-]/g, ' ').trim();

    // Test 1: Title Tag Analysis
    const title = $('title').text().trim();
    const titleLength = title.length;
    
    if (titleLength > 0) {
        const titleQuality = analyzeTitleQuality(title, isHomepage);
        
        tests.push(new TestResult('Title Tag', titleQuality.score > 0.7, {
            value: `${titleLength} characters`,
            details: title,
            confidence: CONFIDENCE.HIGH,
            evidence: titleQuality.evidence,
            dataSource: '<title> element'
        }));
        
        score += titleQuality.score;
        
        if (titleQuality.issues.length > 0) {
            titleQuality.issues.forEach(issue => issues.push(issue));
        }
    } else {
        // Check for dynamic title indicators
        const hasOGTitle = $('meta[property="og:title"]').attr('content');
        const hasScriptTitle = $('script').text().includes('document.title');
        
        if (hasOGTitle) {
            tests.push(new TestResult('Title Tag', false, {
                value: 'Missing (but OG title found)',
                confidence: CONFIDENCE.HIGH,
                evidence: [`OG Title: "${hasOGTitle}"`]
            }));
            
            issues.push(new AuditIssue({
                title: `Missing HTML title tag on ${pageName}`,
                description: `The page has an Open Graph title but no standard <title> tag. Search engines primarily use the HTML title tag.`,
                category: 'SEO - Title',
                priority: 'high',
                confidence: CONFIDENCE.HIGH,
                evidence: [`Found OG title: "${hasOGTitle}"`, 'Missing: <title> tag'],
                impact: 'Major SEO impact - title tags are crucial for rankings',
                solution: 'Add a <title> tag with 50-60 characters describing the page',
                businessValue: 'high',
                technicalDetails: `Add: <title>${hasOGTitle}</title>`
            }));
        } else if (hasScriptTitle) {
            tests.push(new TestResult('Title Tag', false, {
                value: 'Set via JavaScript',
                confidence: CONFIDENCE.MODERATE,
                details: 'Title appears to be set dynamically'
            }));
            
            issues.push(new AuditIssue({
                title: `JavaScript-dependent title on ${pageName}`,
                description: 'Title is set via JavaScript. Search engines may not see this title during initial crawl.',
                category: 'SEO - Title',
                priority: 'medium',
                confidence: CONFIDENCE.MODERATE,
                impact: 'Search engines may miss or delay indexing the title',
                solution: 'Set title server-side or use SSR/pre-rendering'
            }));
        } else {
            tests.push(new TestResult('Title Tag', false, {
                value: 'Missing',
                confidence: CONFIDENCE.HIGH
            }));
            
            issues.push(new AuditIssue({
                title: `No title tag on ${pageName}`,
                description: 'This page has no title tag, severely impacting SEO and browser tab display.',
                category: 'SEO - Title',
                priority: 'critical',
                confidence: CONFIDENCE.HIGH,
                impact: 'Search engines won\'t know what this page is about',
                solution: isHomepage 
                    ? 'Add: <title>[Dealership Name] | New & Used [Brand] Dealer in [City, State]</title>'
                    : `Add: <title>${pageName} | [Dealership Name]</title>`,
                businessValue: 'critical'
            }));
        }
    }

    // Test 2: Meta Description Analysis
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaDescLength = metaDesc.trim().length;
    
    if (metaDescLength > 0) {
        const descQuality = analyzeDescriptionQuality(metaDesc, isHomepage);
        
        tests.push(new TestResult('Meta Description', descQuality.score > 0.7, {
            value: `${metaDescLength} characters`,
            details: metaDesc,
            confidence: CONFIDENCE.HIGH,
            evidence: descQuality.evidence,
            dataSource: '<meta name="description">'
        }));
        
        score += descQuality.score;
        
        if (descQuality.issues.length > 0) {
            descQuality.issues.forEach(issue => issues.push(issue));
        }
    } else {
        // Check alternative description sources
        const ogDesc = $('meta[property="og:description"]').attr('content');
        const twitterDesc = $('meta[name="twitter:description"]').attr('content');
        
        if (ogDesc || twitterDesc) {
            tests.push(new TestResult('Meta Description', false, {
                value: 'Missing (social descriptions found)',
                confidence: CONFIDENCE.HIGH,
                evidence: [
                    ogDesc ? `OG Description: "${ogDesc.substring(0, 100)}..."` : null,
                    twitterDesc ? `Twitter Description: "${twitterDesc.substring(0, 100)}..."` : null
                ].filter(Boolean)
            }));
            
            issues.push(new AuditIssue({
                title: `Standard meta description missing on ${pageName}`,
                description: 'Social media descriptions found but no standard meta description. Google uses the standard tag.',
                category: 'SEO - Meta Tags',
                priority: 'high',
                confidence: CONFIDENCE.HIGH,
                evidence: ['Has social descriptions', 'Missing standard meta description'],
                solution: `Add: <meta name="description" content="${ogDesc || twitterDesc}">`,
                impact: 'Google may create its own snippet, which might not be ideal'
            }));
            
            score += 0.3; // Partial credit
        } else {
            tests.push(new TestResult('Meta Description', false, {
                value: 'Missing',
                confidence: CONFIDENCE.HIGH
            }));
            
            issues.push(new AuditIssue({
                title: `No meta description on ${pageName}`,
                description: 'Missing meta description means Google will create its own snippet from page content.',
                category: 'SEO - Meta Tags',
                priority: 'high',
                confidence: CONFIDENCE.HIGH,
                impact: 'Lost opportunity to control how your page appears in search results',
                solution: 'Add a compelling 150-160 character description that includes keywords and a call-to-action'
            }));
        }
    }

    // Test 3: Heading Structure Analysis
    const h1Tags = $('h1');
    const h2Tags = $('h2');
    const allHeadings = $('h1, h2, h3, h4, h5, h6');
    
    const headingAnalysis = analyzeHeadingStructure($, isHomepage);
    
    tests.push(new TestResult('Heading Structure', headingAnalysis.score > 0.7, {
        value: `${h1Tags.length} H1, ${h2Tags.length} H2, ${allHeadings.length} total`,
        confidence: CONFIDENCE.HIGH,
        evidence: headingAnalysis.evidence,
        details: headingAnalysis.details
    }));
    
    score += headingAnalysis.score;
    headingAnalysis.issues.forEach(issue => issues.push(issue));

    // Test 4: Schema Markup Detection
    const schemaAnalysis = analyzeSchemaMarkup($, url);
    
    tests.push(new TestResult('Schema Markup', schemaAnalysis.found, {
        value: schemaAnalysis.types.length > 0 ? schemaAnalysis.types.join(', ') : 'Not detected',
        confidence: schemaAnalysis.confidence,
        evidence: schemaAnalysis.evidence,
        details: schemaAnalysis.details
    }));
    
    score += schemaAnalysis.score;
    schemaAnalysis.issues.forEach(issue => issues.push(issue));

    // Test 5: URL Structure
    const urlAnalysis = analyzeURLStructure(url, $);
    
    tests.push(new TestResult('URL Structure', urlAnalysis.score > 0.7, {
        value: urlAnalysis.quality,
        confidence: CONFIDENCE.HIGH,
        evidence: urlAnalysis.evidence
    }));
    
    score += urlAnalysis.score;
    urlAnalysis.issues.forEach(issue => issues.push(issue));

    return {
        score: score,
        maxScore: 5,
        tests: tests,
        issues: issues,
        summary: `SEO score: ${Math.round(score/5*100)}%`
    };
}

// Helper function to analyze title quality
function analyzeTitleQuality(title, isHomepage) {
    const evidence = [];
    const issues = [];
    let score = 1.0;
    
    // Length check
    if (title.length > 60) {
        score -= 0.2;
        evidence.push(`Too long: ${title.length} characters (max 60)`);
        
        issues.push(new AuditIssue({
            title: 'Title tag too long',
            description: `Title is ${title.length} characters. Google typically displays only the first 50-60 characters.`,
            category: 'SEO - Title',
            priority: 'medium',
            confidence: CONFIDENCE.HIGH,
            evidence: [`Current: "${title}"`],
            solution: `Shorten to: "${title.substring(0, 57)}..."`,
            impact: 'Title may be cut off in search results'
        }));
    } else if (title.length < 30) {
        score -= 0.3;
        evidence.push(`Too short: ${title.length} characters (min 30)`);
        
        issues.push(new AuditIssue({
            title: 'Title tag too short',
            description: `Title is only ${title.length} characters. You're missing an opportunity to include keywords.`,
            category: 'SEO - Title',
            priority: 'medium',
            confidence: CONFIDENCE.HIGH,
            solution: 'Expand title to include location, services, or brand keywords'
        }));
    } else {
        evidence.push(`Good length: ${title.length} characters`);
    }
    
    // Keyword analysis for dealerships
    const dealershipKeywords = ['dealer', 'dealership', 'sales', 'service', 'new', 'used', 'certified'];
    const hasKeywords = dealershipKeywords.some(kw => title.toLowerCase().includes(kw));
    
    if (hasKeywords) {
        evidence.push('Contains dealership keywords');
    } else if (isHomepage) {
        score -= 0.2;
        issues.push(new AuditIssue({
            title: 'Missing dealership keywords in title',
            description: 'Homepage title should include words like "dealer", "dealership", or "sales"',
            category: 'SEO - Title',
            priority: 'medium',
            confidence: CONFIDENCE.MODERATE,
            solution: 'Add dealership-specific keywords to clarify your business type'
        }));
    }
    
    // Check for location
    const locationPattern = /[A-Z][a-z]+(?:,?\s+[A-Z]{2})?/;
    const hasLocation = locationPattern.test(title);
    
    if (hasLocation) {
        evidence.push('Includes location');
    } else if (isHomepage) {
        score -= 0.1;
        evidence.push('No location detected');
    }
    
    return {
        score: Math.max(0, score),
        evidence: evidence,
        issues: issues
    };
}

// Helper function to analyze description quality
function analyzeDescriptionQuality(description, isHomepage) {
    const evidence = [];
    const issues = [];
    let score = 1.0;
    
    const length = description.length;
    
    // Length analysis
    if (length < 120) {
        score -= 0.2;
        evidence.push(`Too short: ${length} characters`);
        
        issues.push(new AuditIssue({
            title: 'Meta description too short',
            description: `Description is only ${length} characters. Aim for 150-160 characters to fully utilize search result space.`,
            category: 'SEO - Meta Tags',
            priority: 'medium',
            confidence: CONFIDENCE.HIGH,
            solution: 'Expand description to include more benefits and a call-to-action'
        }));
    } else if (length > 160) {
        score -= 0.1;
        evidence.push(`Too long: ${length} characters`);
        
        issues.push(new AuditIssue({
            title: 'Meta description too long',
            description: `Description is ${length} characters and will be truncated in search results.`,
            category: 'SEO - Meta Tags',
            priority: 'low',
            confidence: CONFIDENCE.HIGH,
            solution: `Shorten to 160 characters while keeping key information`
        }));
    } else {
        evidence.push(`Good length: ${length} characters`);
    }
    
    // Check for call-to-action
    const ctaKeywords = ['visit', 'call', 'browse', 'shop', 'schedule', 'contact', 'learn', 'discover'];
    const hasCTA = ctaKeywords.some(word => description.toLowerCase().includes(word));
    
    if (hasCTA) {
        evidence.push('Contains call-to-action');
    } else {
        score -= 0.2;
        issues.push(new AuditIssue({
            title: 'Meta description lacks call-to-action',
            description: 'Add action words like "Visit", "Browse", "Call" to encourage clicks',
            category: 'SEO - Meta Tags',
            priority: 'low',
            confidence: CONFIDENCE.MODERATE,
            solution: 'Start or end description with an action phrase'
        }));
    }
    
    return {
        score: Math.max(0, score),
        evidence: evidence,
        issues: issues
    };
}

// Helper function to analyze heading structure
function analyzeHeadingStructure($, isHomepage) {
    const evidence = [];
    const issues = [];
    let score = 1.0;
    const details = [];
    
    const h1s = $('h1');
    const h2s = $('h2');
    
    // H1 analysis
    if (h1s.length === 0) {
        score -= 0.4;
        evidence.push('No H1 tag found');
        
        issues.push(new AuditIssue({
            title: 'Missing H1 heading',
            description: 'Every page needs exactly one H1 tag that describes the main topic.',
            category: 'SEO - Structure',
            priority: 'high',
            confidence: CONFIDENCE.HIGH,
            impact: 'Search engines use H1 to understand page topic',
            solution: isHomepage 
                ? 'Add <h1>[Dealership Name] - Your [Brand] Dealer in [City]</h1>'
                : 'Add an H1 that describes this page\'s main topic'
        }));
    } else if (h1s.length === 1) {
        const h1Text = h1s.first().text().trim();
        evidence.push(`H1: "${h1Text.substring(0, 50)}${h1Text.length > 50 ? '...' : ''}"`);
        details.push(`H1 content: "${h1Text}"`);
        
        // Check H1 quality
        if (h1Text.length < 10) {
            score -= 0.2;
            issues.push(new AuditIssue({
                title: 'H1 heading too short',
                description: `H1 "${h1Text}" is too brief. Use descriptive headings with keywords.`,
                category: 'SEO - Structure',
                priority: 'medium',
                confidence: CONFIDENCE.HIGH,
                solution: 'Expand H1 to include relevant keywords and location'
            }));
        }
    } else {
        score -= 0.3;
        evidence.push(`Multiple H1 tags (${h1s.length})`);
        
        const h1Texts = [];
        h1s.each((i, el) => {
            if (i < 3) h1Texts.push($(el).text().trim());
        });
        
        issues.push(new AuditIssue({
            title: 'Multiple H1 tags found',
            description: `Found ${h1s.length} H1 tags. Each page should have exactly one H1.`,
            category: 'SEO - Structure',
            priority: 'medium',
            confidence: CONFIDENCE.HIGH,
            evidence: h1Texts.map(t => `"${t.substring(0, 50)}${t.length > 50 ? '...' : ''}"`),
            solution: 'Keep the most important heading as H1, change others to H2'
        }));
    }
    
    // Check heading hierarchy
    if (h2s.length === 0 && $('h3').length > 0) {
        score -= 0.1;
        evidence.push('H3 without H2 (poor hierarchy)');
        
        issues.push(new AuditIssue({
            title: 'Heading hierarchy issue',
            description: 'Found H3 tags without H2 tags. Maintain proper heading hierarchy (H1 → H2 → H3).',
            category: 'SEO - Structure',
            priority: 'low',
            confidence: CONFIDENCE.HIGH,
            solution: 'Use H2 for major sections, H3 for subsections'
        }));
    }
    
    return {
        score: Math.max(0, score),
        evidence: evidence,
        issues: issues,
        details: details
    };
}

// Helper function to analyze schema markup
function analyzeSchemaMarkup($, url) {
    const evidence = [];
    const issues = [];
    let score = 0;
    const types = [];
    let confidence = CONFIDENCE.HIGH;
    
    // Check JSON-LD
    const jsonLdScripts = $('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
        jsonLdScripts.each((i, el) => {
            try {
                const content = $(el).html();
                const data = JSON.parse(content);
                if (data['@type']) {
                    types.push(data['@type']);
                    evidence.push(`JSON-LD: ${data['@type']}`);
                }
            } catch (e) {
                evidence.push('JSON-LD present but could not parse');
            }
        });
        score = 1.0;
    }
    
    // Check Microdata
    const microdata = $('[itemscope][itemtype]');
    if (microdata.length > 0) {
        microdata.each((i, el) => {
            const type = $(el).attr('itemtype');
            if (type && i < 3) {
                const typeName = type.split('/').pop();
                types.push(typeName);
                evidence.push(`Microdata: ${typeName}`);
            }
        });
        if (types.length === 0) score = 0.8;
    }
    
    // Check Open Graph
    const ogType = $('meta[property="og:type"]').attr('content');
    if (ogType) {
        evidence.push(`Open Graph: ${ogType}`);
        if (types.length === 0) score = 0.3;
    }
    
    if (types.length === 0 && evidence.length === 0) {
        confidence = CONFIDENCE.MODERATE;
        
        issues.push(new AuditIssue({
            title: 'No structured data detected',
            description: 'Structured data helps search engines understand your content and can enable rich snippets.',
            category: 'SEO - Schema',
            priority: 'medium',
            confidence: CONFIDENCE.MODERATE,
            impact: 'Missing out on rich snippets in search results',
            solution: 'Add AutoDealer schema with business info, reviews, inventory',
            technicalDetails: 'Use Google\'s Structured Data Testing Tool to verify implementation'
        }));
    } else if (!types.some(t => t.toLowerCase().includes('auto') || t.toLowerCase().includes('dealer'))) {
        score = Math.max(score, 0.5);
        
        issues.push(new AuditIssue({
            title: 'Missing automotive-specific schema',
            description: 'Found general schema but no automotive dealer-specific markup.',
            category: 'SEO - Schema',
            priority: 'medium',
            confidence: CONFIDENCE.HIGH,
            evidence: evidence,
            solution: 'Add AutoDealer schema type with inventory, service info',
            businessValue: 'medium'
        }));
    }
    
    return {
        found: types.length > 0 || evidence.length > 0,
        types: types,
        score: score,
        confidence: confidence,
        evidence: evidence,
        issues: issues,
        details: types.length > 0 ? `Found ${types.length} schema type(s)` : null
    };
}

// Helper function to analyze URL structure
function analyzeURLStructure(url, $) {
    const evidence = [];
    const issues = [];
    let score = 1.0;
    let quality = 'Good';
    
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Check for URL parameters
    if (urlObj.search.length > 0) {
        score -= 0.1;
        evidence.push('Contains URL parameters');
        quality = 'Has parameters';
    }
    
    // Check path structure
    if (path.includes('_') || path.includes('%20') || path.includes(' ')) {
        score -= 0.2;
        evidence.push('Contains special characters');
        quality = 'Needs improvement';
        
        issues.push(new AuditIssue({
            title: 'URL contains special characters',
            description: 'URLs should use hyphens (-) instead of underscores or spaces',
            category: 'SEO - Technical',
            priority: 'low',
            confidence: CONFIDENCE.HIGH,
            evidence: [`Current: ${path}`],
            solution: 'Use hyphens to separate words in URLs'
        }));
    }
    
    // Check canonical tag
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
        evidence.push('Has canonical tag');
    } else {
        score -= 0.2;
        
        issues.push(new AuditIssue({
            title: 'Missing canonical URL',
            description: 'Canonical tags prevent duplicate content issues',
            category: 'SEO - Technical',
            priority: 'medium',
            confidence: CONFIDENCE.HIGH,
            solution: `Add: <link rel="canonical" href="${url}">`,
            impact: 'Duplicate content can dilute SEO value'
        }));
    }
    
    return {
        score: Math.max(0, score),
        quality: quality,
        evidence: evidence,
        issues: issues
    };
}

// Export enhanced module
module.exports = {
    runComprehensiveAudit: async function(url, $, driver = null) {
        const brand = detectBrand($, url);
        const results = {
            url: url,
            domain: new URL(url).hostname,
            brand: brand,
            timestamp: new Date().toISOString(),
            categories: [],
            issues: [],
            overallScore: 0,
            confidence: {
                high: 0,
                moderate: 0,
                low: 0,
                manual: 0
            },
            detailedResults: {}
        };

        // Run tests (simplified for this example - would include all categories)
        const connectivity = await testBasicConnectivity(url, $);
        const seo = await testSEO($, url);

        // Process results
        const categoryResults = [
            { name: 'Basic Connectivity', ...connectivity },
            { name: 'SEO Analysis', ...seo }
        ];

        // Calculate scores and confidence
        categoryResults.forEach(cat => {
            const weight = TEST_CATEGORIES[cat.name].weight;
            const normalizedScore = (cat.score / cat.maxScore) * 5;
            
            results.categories.push({
                name: cat.name,
                score: Math.round(normalizedScore),
                maxScore: 5,
                percentage: Math.round((cat.score / cat.maxScore) * 100),
                tests: cat.tests.map(t => t.toJSON()),
                weight: weight,
                description: TEST_CATEGORIES[cat.name].description
            });

            // Track confidence levels
            cat.tests.forEach(test => {
                results.confidence[test.confidence.level]++;
            });

            // Collect issues
            if (cat.issues) {
                results.issues.push(...cat.issues.map(i => i.toJSON()));
            }
        });

        // Sort issues by priority and confidence
        results.issues.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            const priDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priDiff !== 0) return priDiff;
            
            // Sort by confidence within same priority
            return b.confidenceScore - a.confidenceScore;
        });

        return results;
    },
    TEST_CATEGORIES,
    CONFIDENCE
};

// Helper function to detect brand
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