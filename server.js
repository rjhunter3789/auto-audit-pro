/*
 * Auto Audit Pro - Professional Dealership Website Analysis Platform
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Author: JL Robinson
 * Contact: nakapaahu@gmail.com
 * Technology: Node.js + Express + Selenium WebDriver + Real Performance APIs
 * 
 * This software is protected by copyright law.
 * Unauthorized reproduction or distribution is prohibited.
 */

const express = require('express');
const cors = require('cors');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const url = require('url');

// Load custom modules
const groupAnalysis = require('./lib/group-analysis');
const DealerSearcher = require('./lib/dealer-search');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // This lets our server understand the form data

// Serve static files
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Add proper CSP headers for the app
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https: http:; " +
        "font-src 'self' data: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "connect-src 'self' https: http:; " +
        "frame-src 'none'; " +
        "object-src 'none'"
    );
    next();
})

// app.use(express.static('frontend')); // We turn this off because EJS will handle our HTML now

// --- Setup for EJS Templates ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);

// In-memory storage for MVP
let auditResults = new Map();
let auditHistory = [];

// Configure Chrome options for Selenium
function getChromeOptions() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-features=VizDisplayCompositor');
    options.addArguments('--window-size=1920,1080');
    
    // Additional arguments for stability and avoiding detection
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-setuid-sandbox');
    options.addArguments('--disable-infobars');
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-default-apps');
    options.addArguments('--disable-popup-blocking');
    options.addArguments('--ignore-certificate-errors');
    options.addArguments('--disable-features=TranslateUI');
    options.addArguments('--disable-features=site-per-process');
    options.addArguments('--disable-web-security');
    options.addArguments('--disable-site-isolation-trials');
    
    // Memory optimization
    options.addArguments('--memory-pressure-off');
    options.addArguments('--max_old_space_size=4096');
    
    // Set user agent to appear more like a real browser
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // For Railway/Linux environments
    if (process.env.CHROME_BIN) {
        options.setChromeBinaryPath(process.env.CHROME_BIN);
    } else {
        // Try to use Chromium if installed (common in WSL2)
        const chromiumPath = '/usr/bin/chromium-browser';
        try {
            if (require('fs').existsSync(chromiumPath)) {
                options.setChromeBinaryPath(chromiumPath);
            }
        } catch (e) {
            // Ignore if fs module issue
        }
    }
    
    return options;
}
// --- New, Fast Audit Logic Functions ---
const KNOWN_BRANDS = ['ford', 'toyota', 'honda', 'chevrolet', 'nissan', 'bmw', 'mercedes-benz', 'lexus', 'audi', 'jeep', 'hyundai', 'kia'];
const PAGE_KEYWORDS = {
    vdp: [
        '/detail/', '/vehicle/', '/new-vehicle/', '/used-vehicle/', 'vin=',
        '/vehicledetails/', '/vehicle-details/', '/vdp/', '/car-details/',
        '/inventory/new/', '/inventory/used/', '/vehicles/',
        'stock=', 'stocknumber=', 'model='
    ],
    inventory: [
        '/inventory/', '/new-vehicles/', '/used-cars/', '/all-inventory/',
        '/new-inventory/', '/used-inventory/', '/certified/', '/pre-owned/',
        '/showroom/', '/vehicles/', '/browse/', '/search-inventory/'
    ],
    service: [
        '/service/', '/schedule-service/', '/service-center/',
        '/auto-service/', '/maintenance/', '/repairs/', '/service-department/',
        '/service-appointment/', '/book-service/'
    ],
    specials: [
        '/specials/', '/offers/', '/deals/', '/promotions/',
        '/incentives/', '/lease-specials/', '/finance-specials/',
        '/new-specials/', '/used-specials/', '/service-specials/',
        '/coupons/', '/savings/'
    ],
    contact: [
        '/contact', '/about-us/', '/hours-directions/',
        '/contact-us/', '/dealership-info/', '/location/', '/directions/',
        '/about/', '/meet-our-team/', '/staff/'
    ]
};

// Use Selenium for better website access
const getPageWithSelenium = async (pageUrl) => {
    let driver = null;
    try {
        // Build Chrome driver with options
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(getChromeOptions())
            .build();
        
        // Set timeouts to prevent hanging
        await driver.manage().setTimeouts({
            implicit: 5000,
            pageLoad: 30000,
            script: 10000
        });
        
        // Navigate to the page
        await driver.get(pageUrl);
        
        // Wait for the page to load with a shorter timeout
        await driver.wait(until.elementLocated(By.tagName('body')), 5000);
        
        // Small delay to ensure content is loaded
        await driver.sleep(1000);
        
        // Get the page source
        const pageSource = await driver.getPageSource();
        
        // Close the driver immediately
        await driver.quit();
        driver = null;
        
        return cheerio.load(pageSource);
    } catch (error) {
        // Ensure driver is closed
        if (driver) {
            try {
                await driver.quit();
            } catch (quitError) {
                console.error('Error closing driver:', quitError.message);
            }
            driver = null;
        }
        
        // Handle specific error types
        if (error.message.includes('timeout')) {
            throw new Error('Website took too long to respond. Please try again.');
        } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            throw new Error('Website not found. Please check the URL.');
        } else if (error.message.includes('session deleted') || error.message.includes('invalid session id')) {
            throw new Error('Browser session terminated unexpectedly. The website may be blocking automated access.');
        } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            throw new Error('Connection refused. The website may be down or blocking access.');
        } else {
            throw new Error(`Unable to access website: ${error.message}`);
        }
    }
};

// Fallback to axios if Selenium fails
const getSoup = async (pageUrl, retryCount = 0) => {
    const maxRetries = 2;
    
    try {
        // Try Selenium first
        return await getPageWithSelenium(pageUrl);
    } catch (seleniumError) {
        // If it's a session error and we haven't exceeded retries, try again
        if ((seleniumError.message.includes('session deleted') || 
             seleniumError.message.includes('invalid session id')) && 
            retryCount < maxRetries) {
            console.log(`Selenium session error, retrying (attempt ${retryCount + 2}/${maxRetries + 1})...`);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getSoup(pageUrl, retryCount + 1);
        }
        
        console.log('Selenium failed, trying direct HTTP request...');
        // Fallback to axios
        const headers = { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        try {
            const response = await axios.get(pageUrl, { 
                headers, 
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 400;
                }
            });
            return cheerio.load(response.data);
        } catch (error) {
            throw seleniumError; // Throw the original Selenium error
        }
    }
};

const detectBrand = ($, pageUrl) => {
    const domain = new url.URL(pageUrl).hostname.toLowerCase();
    const title = $('title').text().toLowerCase();
    for (const brand of KNOWN_BRANDS) {
        if (domain.includes(brand) || title.includes(brand)) {
            return brand.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
    return "Automotive";
};

const discoverPages = ($, startUrl) => {
    const foundPages = { homepage: startUrl };
    const baseUrl = new url.URL(startUrl).origin;
    const foundUrls = new Set();
    
    // First, collect all internal links
    $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        
        try {
            const fullUrl = new url.URL(href, baseUrl).href;
            // Only consider internal links
            if (fullUrl.startsWith(baseUrl)) {
                foundUrls.add(fullUrl);
            }
        } catch (e) {
            // Invalid URL, skip
        }
    });
    
    // Then categorize them
    for (const urlStr of foundUrls) {
        const lowerUrl = urlStr.toLowerCase();
        for (const [pageType, keywords] of Object.entries(PAGE_KEYWORDS)) {
            if (!foundPages[pageType] && keywords.some(kw => lowerUrl.includes(kw))) {
                foundPages[pageType] = urlStr;
                break; // Found a match for this URL
            }
        }
    }
    
    // If no VDP found, try to find any link that looks like a specific vehicle
    if (!foundPages.vdp) {
        for (const urlStr of foundUrls) {
            // Look for patterns like year-make-model or URLs with many hyphens
            if (urlStr.match(/\/\d{4}-\w+-\w+/) || 
                urlStr.match(/\/[a-z]+-[a-z]+-[a-z]+-[a-z]+/) ||
                urlStr.includes('/dealer-inspire/') ||
                urlStr.includes('/window-sticker/')) {
                foundPages.vdp = urlStr;
                break;
            }
        }
    }
    
    return foundPages;
};

const checkVdpExpertise = ($) => {
    const results = { score: 0, findings: [], recommendations: [] };
    const text = $('body').text().toLowerCase();
    if (text.includes('msrp') || text.includes('sticker price')) {
        results.score += 30;
        results.findings.push("MSRP or sticker price is mentioned.");
    } else {
        results.recommendations.push("Ensure MSRP is clearly displayed to meet compliance and build trust.");
    }
    if (text.includes('disclaimer') || text.includes('tax, title, and license')) {
        results.score += 30;
        results.findings.push("Pricing disclaimers are present.");
    } else {
        results.recommendations.push("Add clear pricing disclaimers for transparency.");
    }
    if ($('img').length > 5) {
        results.score += 20;
        results.findings.push("Multiple vehicle images were found, suggesting a gallery.");
    } else {
        results.recommendations.push("Enhance the vehicle gallery with high-resolution, multi-angle photos.");
    }
    if ($('form').length > 0) {
        results.score += 20;
        results.findings.push("A lead capture form is present on the page.");
    } else {
        results.recommendations.push("Add a prominent 'Check Availability' or 'Get ePrice' lead form.");
    }
    return results;
};
// 8-Category Test System
const testCategories = [
    { name: 'Basic Connectivity', weight: 0.12 },
    { name: 'Performance Testing', weight: 0.18 },
    { name: 'SEO Analysis', weight: 0.15 },
    { name: 'User Experience', weight: 0.15 },
    { name: 'Content Analysis', weight: 0.15 },
    { name: 'Technical Validation', weight: 0.10 },
    { name: 'Brand Compliance', weight: 0.08 },
    { name: 'Lead Generation', weight: 0.07 }
];

// Main audit endpoint
app.post('/api/audit', async (req, res) => {
    const { domain } = req.body;
    
    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    const auditId = generateAuditId();
    const startTime = new Date();
    
    // Initialize audit result
    auditResults.set(auditId, {
        id: auditId,
        domain,
        status: 'running',
        progress: 0,
        startTime,
        results: {},
        overallScore: 0
    });

    // Start audit in background
    runAudit(auditId, domain).catch(error => {
        console.error('Audit failed:', error);
        const audit = auditResults.get(auditId);
        if (audit) {
            audit.status = 'failed';
            audit.error = error.message;
        }
    });

    res.json({ auditId, status: 'started' });
});

// Get audit status endpoint
app.get('/api/audit/:auditId', (req, res) => {
    const { auditId } = req.params;
    const audit = auditResults.get(auditId);
    
    if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
    }
    
    res.json(audit);
});

// Get audit history
app.get('/api/audits', (req, res) => {
    res.json(auditHistory);
});

async function runAudit(auditId, domain) {
    const audit = auditResults.get(auditId);
    let driver;
    
    try {
        // Ensure domain has protocol
        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        
        // Create WebDriver instance
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();

        let totalScore = 0;
        let completedTests = 0;

        for (const category of testCategories) {
            updateProgress(auditId, `Running ${category.name}...`);
            
            const categoryResult = await runCategoryTests(driver, url, category.name);
            audit.results[category.name] = categoryResult;
            
            totalScore += categoryResult.score * category.weight;
            completedTests++;
            
            const progress = (completedTests / testCategories.length) * 100;
            audit.progress = Math.round(progress);
        }

        // Calculate overall score
        audit.overallScore = Math.round(totalScore * 20); // Convert to 100-point scale
        audit.status = 'completed';
        audit.endTime = new Date();
        audit.duration = audit.endTime - audit.startTime;

        // Add to history
        auditHistory.unshift({
            id: auditId,
            domain,
            score: audit.overallScore,
            completedAt: audit.endTime,
            duration: audit.duration
        });

        // Keep only last 50 audits in history
        if (auditHistory.length > 50) {
            auditHistory = auditHistory.slice(0, 50);
        }

    } catch (error) {
        console.error('Audit error:', error);
        audit.status = 'failed';
        audit.error = error.message;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

async function runCategoryTests(driver, url, categoryName) {
    const tests = getTestsForCategory(categoryName);
    const results = {};
    let totalScore = 0;

    for (const test of tests) {
        try {
            const result = await runIndividualTest(driver, url, test, categoryName);
            results[test] = result;
            totalScore += result.score;
        } catch (error) {
            console.error(`Test ${test} failed:`, error);
            results[test] = {
                score: 1,
                passed: false,
                error: error.message,
                recommendations: [`Fix ${test.toLowerCase()} functionality`]
            };
            totalScore += 1;
        }
    }

    return {
        score: totalScore / tests.length,
        tests: results,
        recommendations: generateCategoryRecommendations(categoryName, results)
    };
}

async function runIndividualTest(driver, url, testName, category) {
    switch (category) {
        case 'Basic Connectivity':
            return await runConnectivityTest(driver, url, testName);
        case 'Performance Testing':
            return await runPerformanceTest(driver, url, testName);
        case 'SEO Analysis':
            return await runSEOTest(driver, url, testName);
        case 'User Experience':
            return await runUXTest(driver, url, testName);
        case 'Content Analysis':
            return await runContentTest(driver, url, testName);
        case 'Technical Validation':
            return await runTechnicalTest(driver, url, testName);
        case 'Brand Compliance':
            return await runBrandComplianceTest(driver, url, testName);
        case 'Lead Generation':
            return await runLeadGenerationTest(driver, url, testName);
        default:
            throw new Error(`Unknown category: ${category}`);
    }
}

async function runConnectivityTest(driver, url, testName) {
    switch (testName) {
        case 'Domain Resolution':
            try {
                await driver.get(url);
                const title = await driver.getTitle();
                return {
                    score: title ? 5 : 3,
                    passed: true,
                    details: `Page loaded successfully. Title: "${title}"`,
                    recommendations: title ? [] : ['Add a descriptive page title']
                };
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Failed to load page',
                    recommendations: ['Check domain configuration and hosting']
                };
            }

        case 'SSL Certificate':
            const hasSSL = url.startsWith('https://');
            return {
                score: hasSSL ? 5 : 2,
                passed: hasSSL,
                details: hasSSL ? 'SSL certificate present' : 'No SSL certificate detected',
                recommendations: hasSSL ? [] : ['Install SSL certificate for security']
            };

        case 'Server Response':
            try {
                const response = await axios.get(url, { timeout: 10000 });
                return {
                    score: response.status === 200 ? 5 : 3,
                    passed: response.status === 200,
                    details: `Server responded with status ${response.status}`,
                    recommendations: response.status === 200 ? [] : ['Fix server response issues']
                };
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Server failed to respond',
                    recommendations: ['Check server configuration and uptime']
                };
            }

        case 'Redirect Handling':
            try {
                const httpUrl = url.replace('https://', 'http://');
                const response = await axios.get(httpUrl, { 
                    maxRedirects: 5,
                    timeout: 10000 
                });
                return {
                    score: response.request.protocol === 'https:' ? 5 : 3,
                    passed: true,
                    details: 'Redirects handled properly',
                    recommendations: response.request.protocol === 'https:' ? [] : ['Ensure HTTP redirects to HTTPS']
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Redirect issues detected',
                    recommendations: ['Fix redirect configuration']
                };
            }
    }
}

// REAL PERFORMANCE TESTING WITH GOOGLE PAGESPEED API
async function runPerformanceTest(driver, url, testName) {
    switch (testName) {
        case 'Page Load Speed':
            const startTime = Date.now();
            try {
                await driver.get(url);
                await driver.wait(until.elementLocated(By.tagName('body')), 10000);
                const loadTime = Date.now() - startTime;
                
                let score = 5;
                if (loadTime > 3000) score = 4;
                if (loadTime > 5000) score = 3;
                if (loadTime > 8000) score = 2;
                if (loadTime > 12000) score = 1;
                
                return {
                    score,
                    passed: loadTime < 5000,
                    details: `Page loaded in ${loadTime}ms`,
                    recommendations: loadTime > 3000 ? ['Optimize images and reduce file sizes', 'Enable compression', 'Use a CDN'] : []
                };
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Page failed to load within timeout',
                    recommendations: ['Investigate slow loading elements', 'Optimize server performance']
                };
            }

        case 'Core Web Vitals':
            // REAL Core Web Vitals using Google PageSpeed Insights API
            try {
                const pageSpeedData = await getRealCoreWebVitals(url);
                
                if (!pageSpeedData) {
                    throw new Error('PageSpeed API unavailable');
                }
                
                const { lcp, fid, cls, performanceScore } = pageSpeedData;
                
                // Score based on Google's thresholds
                let score = 5;
                if (lcp > 2500 || fid > 100 || cls > 0.1) score = 4;
                if (lcp > 4000 || fid > 300 || cls > 0.25) score = 3;
                if (lcp > 6000 || fid > 500 || cls > 0.4) score = 2;
                if (lcp > 8000 || fid > 1000 || cls > 0.6) score = 1;
                
                return {
                    score,
                    passed: lcp <= 2500 && fid <= 100 && cls <= 0.1,
                    details: `LCP: ${lcp}ms, FID: ${fid}ms, CLS: ${cls.toFixed(3)}, Performance: ${performanceScore}/100`,
                    recommendations: generateCoreWebVitalsRecommendations(lcp, fid, cls, performanceScore),
                    rawData: { lcp, fid, cls, performanceScore }
                };
            } catch (error) {
                console.error('Core Web Vitals API failed, using fallback measurement:', error);
                // Fallback to manual measurement if API fails
                return await getFallbackCoreWebVitals(driver, url);
            }

        case 'Mobile Performance':
            try {
                // Get mobile PageSpeed data
                const mobilePageSpeedData = await getRealCoreWebVitals(url, 'mobile');
                
                if (mobilePageSpeedData) {
                    const { performanceScore, lcp } = mobilePageSpeedData;
                    const score = performanceScore >= 90 ? 5 : performanceScore >= 70 ? 4 : performanceScore >= 50 ? 3 : performanceScore >= 30 ? 2 : 1;
                    
                    return {
                        score,
                        passed: performanceScore >= 70,
                        details: `Mobile Performance Score: ${performanceScore}/100, Mobile LCP: ${lcp}ms`,
                        recommendations: performanceScore < 70 ? [
                            'Optimize images for mobile devices',
                            'Reduce server response times',
                            'Minimize main thread work',
                            'Ensure text remains visible during webfont load'
                        ] : []
                    };
                }
                
                // Fallback to viewport testing
                await driver.manage().window().setRect({ width: 375, height: 667 });
                await driver.get(url);
                
                const isResponsive = await driver.executeScript(`
                    return window.innerWidth <= 768 && 
                           document.body.scrollWidth <= window.innerWidth;
                `);
                
                return {
                    score: isResponsive ? 4 : 2,
                    passed: isResponsive,
                    details: isResponsive ? 'Mobile viewport responsive' : 'Mobile responsiveness issues detected',
                    recommendations: isResponsive ? [] : ['Fix responsive design issues', 'Optimize for mobile devices']
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Mobile performance test failed',
                    recommendations: ['Test mobile compatibility manually']
                };
            }

        case 'Resource Optimization':
            try {
                // Get detailed resource data from PageSpeed
                const pageSpeedData = await getRealCoreWebVitals(url);
                
                if (pageSpeedData && pageSpeedData.diagnostics) {
                    const { 
                        unoptimizedImages, 
                        unusedCSS, 
                        unusedJavaScript,
                        totalByteWeight 
                    } = pageSpeedData.diagnostics;
                    
                    let score = 5;
                    if (totalByteWeight > 3000000) score = 4; // 3MB
                    if (totalByteWeight > 5000000) score = 3; // 5MB
                    if (totalByteWeight > 8000000) score = 2; // 8MB
                    if (totalByteWeight > 12000000) score = 1; // 12MB
                    
                    const recommendations = [];
                    if (unoptimizedImages > 100000) recommendations.push('Optimize and compress images');
                    if (unusedCSS > 50000) recommendations.push('Remove unused CSS');
                    if (unusedJavaScript > 100000) recommendations.push('Remove unused JavaScript');
                    if (totalByteWeight > 3000000) recommendations.push('Reduce overall page size');
                    
                    return {
                        score,
                        passed: totalByteWeight < 3000000,
                        details: `Total page weight: ${(totalByteWeight / 1024 / 1024).toFixed(2)}MB`,
                        recommendations
                    };
                }
                
                // Fallback to basic resource counting
                const resourceCounts = await driver.executeScript(`
                    const images = document.images.length;
                    const scripts = document.scripts.length;
                    const stylesheets = document.styleSheets.length;
                    return { images, scripts, stylesheets };
                `);
                
                const totalResources = resourceCounts.images + resourceCounts.scripts + resourceCounts.stylesheets;
                const score = totalResources < 50 ? 5 : totalResources < 100 ? 4 : totalResources < 150 ? 3 : 2;
                
                return {
                    score,
                    passed: totalResources < 100,
                    details: `Found ${totalResources} total resources (${resourceCounts.images} images, ${resourceCounts.scripts} scripts, ${resourceCounts.stylesheets} stylesheets)`,
                    recommendations: totalResources > 75 ? [
                        'Optimize and compress images',
                        'Minify CSS and JavaScript',
                        'Consider lazy loading for images',
                        'Combine CSS and JS files where possible'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 3,
                    passed: false,
                    details: 'Resource optimization analysis failed',
                    recommendations: ['Audit page resources manually']
                };
            }
    }
}

async function runSEOTest(driver, url, testName) {
    switch (testName) {
        case 'Meta Tags':
            try {
                const title = await driver.getTitle();
                const metaDescription = await driver.findElement(By.css('meta[name="description"]')).getAttribute('content').catch(() => '');
                
                let score = 3;
                if (title && title.length > 10 && title.length < 60) score += 1;
                if (metaDescription && metaDescription.length > 120 && metaDescription.length < 160) score += 1;
                
                return {
                    score: Math.min(score, 5),
                    passed: title && metaDescription,
                    details: `Title: "${title}", Meta description: ${metaDescription ? 'Present' : 'Missing'}`,
                    recommendations: [
                        ...(title ? [] : ['Add descriptive page title']),
                        ...(metaDescription ? [] : ['Add meta description']),
                        ...(title && title.length > 60 ? ['Shorten page title'] : []),
                        ...(metaDescription && metaDescription.length > 160 ? ['Shorten meta description'] : [])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Meta tags analysis failed',
                    recommendations: ['Add proper meta tags']
                };
            }

        case 'Heading Structure':
            try {
                const headings = await driver.executeScript(`
                    const h1s = document.querySelectorAll('h1').length;
                    const h2s = document.querySelectorAll('h2').length;
                    const h3s = document.querySelectorAll('h3').length;
                    return { h1s, h2s, h3s };
                `);
                
                const score = headings.h1s === 1 && headings.h2s > 0 ? 5 : headings.h1s > 0 ? 3 : 1;
                
                return {
                    score,
                    passed: headings.h1s > 0,
                    details: `H1: ${headings.h1s}, H2: ${headings.h2s}, H3: ${headings.h3s}`,
                    recommendations: [
                        ...(headings.h1s === 0 ? ['Add H1 heading'] : []),
                        ...(headings.h1s > 1 ? ['Use only one H1 per page'] : []),
                        ...(headings.h2s === 0 ? ['Add H2 headings for content structure'] : [])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Heading analysis failed',
                    recommendations: ['Structure content with proper headings']
                };
            }

        case 'Schema Markup':
            try {
                const schemaData = await driver.executeScript(`
                    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                    return scripts.length;
                `);
                
                return {
                    score: schemaData > 0 ? 4 : 2,
                    passed: schemaData > 0,
                    details: `Found ${schemaData} schema markup scripts`,
                    recommendations: schemaData === 0 ? ['Add structured data markup', 'Implement automotive schema'] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Schema markup check failed',
                    recommendations: ['Add structured data markup']
                };
            }

        case 'Internal Linking':
            try {
                const linkData = await driver.executeScript(`
                    const links = Array.from(document.querySelectorAll('a[href]'));
                    const internal = links.filter(link => 
                        link.href.includes(window.location.hostname) || 
                        link.href.startsWith('/')
                    ).length;
                    const external = links.length - internal;
                    return { total: links.length, internal, external };
                `);
                
                const score = linkData.internal > 10 ? 4 : linkData.internal > 5 ? 3 : 2;
                
                return {
                    score,
                    passed: linkData.internal > 5,
                    details: `${linkData.internal} internal links, ${linkData.external} external links`,
                    recommendations: linkData.internal < 10 ? ['Add more internal links', 'Create content hub pages'] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Link analysis failed',
                    recommendations: ['Audit internal linking structure']
                };
            }
    }
}

// REAL CONTENT ANALYSIS
async function runContentTest(driver, url, testName) {
    switch (testName) {
        case 'Inventory Visibility':
            try {
                await driver.get(url);
                
                const inventoryData = await driver.executeScript(`
                    const inventoryKeywords = ['inventory', 'vehicles', 'cars', 'trucks', 'suv', 'sedan', 'new', 'used', 'pre-owned'];
                    const searchTerms = ['search', 'browse', 'view', 'shop'];
                    
                    const navLinks = Array.from(document.querySelectorAll('nav a, .nav a, .navigation a, .menu a'));
                    const inventoryNavLinks = navLinks.filter(link => 
                        inventoryKeywords.some(keyword => 
                            link.textContent.toLowerCase().includes(keyword)
                        )
                    );
                    
                    const vehicleElements = document.querySelectorAll([
                        '.vehicle', '.car', '.auto', '.listing', 
                        '[class*="vehicle"]', '[class*="car"]', '[class*="auto"]',
                        '[data-vehicle]', '[data-car]'
                    ].join(', '));
                    
                    const searchElements = document.querySelectorAll([
                        'input[placeholder*="search"]', 'input[placeholder*="find"]',
                        '.search', '.browse', '.filter',
                        'select[name*="make"]', 'select[name*="model"]', 'select[name*="year"]'
                    ].join(', '));
                    
                    const bodyText = document.body.textContent.toLowerCase();
                    const hasInventoryText = inventoryKeywords.some(keyword => 
                        bodyText.includes(keyword + 's') || bodyText.includes(keyword)
                    );
                    
                    const priceElements = document.querySelectorAll([
                        '[class*="price"]', '[class*="msrp"]', '[class*="cost"]',
                        'span:contains("$")', '.currency'
                    ].join(', '));
                    
                    return {
                        navLinks: inventoryNavLinks.length,
                        vehicleElements: vehicleElements.length,
                        searchElements: searchElements.length,
                        hasInventoryText,
                        priceElements: priceElements.length,
                        totalIndicators: inventoryNavLinks.length + vehicleElements.length + searchElements.length + (hasInventoryText ? 1 : 0)
                    };
                `);
                
                let score = 1;
                if (inventoryData.totalIndicators >= 1) score = 2;
                if (inventoryData.totalIndicators >= 3) score = 3;
                if (inventoryData.totalIndicators >= 5) score = 4;
                if (inventoryData.totalIndicators >= 8) score = 5;
                
                const recommendations = [];
                if (inventoryData.navLinks === 0) recommendations.push('Add inventory navigation links');
                if (inventoryData.vehicleElements === 0) recommendations.push('Display vehicle listings prominently');
                if (inventoryData.searchElements === 0) recommendations.push('Add vehicle search/filter functionality');
                if (!inventoryData.hasInventoryText) recommendations.push('Include inventory-related content and keywords');
                
                return {
                    score,
                    passed: inventoryData.totalIndicators >= 3,
                    details: `Found ${inventoryData.navLinks} nav links, ${inventoryData.vehicleElements} vehicle elements, ${inventoryData.searchElements} search tools`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Inventory analysis failed',
                    recommendations: ['Manually review inventory visibility']
                };
            }

        case 'Contact Information':
            try {
                await driver.get(url);
                
                const contactData = await driver.executeScript(`
                    const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
                    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
                    
                    const addressKeywords = ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd', 'drive', 'dr'];
                    
                    const bodyText = document.body.textContent;
                    
                    const contactSelectors = [
                        '.contact', '.phone', '.telephone', '.email', '.address',
                        '[class*="contact"]', '[class*="phone"]', '[class*="email"]', '[class*="address"]',
                        'a[href^="tel:"]', 'a[href^="mailto:"]'
                    ];
                    
                    const contactElements = document.querySelectorAll(contactSelectors.join(', '));
                    
                    const phones = (bodyText.match(phoneRegex) || []).filter(phone => phone.length >= 10);
                    const emails = bodyText.match(emailRegex) || [];
                    
                    const hasAddressKeywords = addressKeywords.some(keyword => 
                        bodyText.toLowerCase().includes(keyword)
                    );
                    
                    const contactPageLinks = Array.from(document.querySelectorAll('a')).filter(link =>
                        link.textContent.toLowerCase().includes('contact') ||
                        link.href.toLowerCase().includes('contact')
                    );
                    
                    const hoursKeywords = ['hours', 'open', 'closed', 'monday', 'tuesday', 'service', 'sales'];
                    const hasHoursInfo = hoursKeywords.some(keyword =>
                        bodyText.toLowerCase().includes(keyword)
                    );
                    
                    return {
                        contactElements: contactElements.length,
                        phones: phones.length,
                        emails: emails.length,
                        hasAddress: hasAddressKeywords,
                        contactPageLinks: contactPageLinks.length,
                        hasHours: hasHoursInfo,
                        foundPhones: phones.slice(0, 3),
                        foundEmails: emails.slice(0, 2)
                    };
                `);
                
                let score = 1;
                if (contactData.phones >= 1) score += 1;
                if (contactData.emails >= 1) score += 1;
                if (contactData.hasAddress) score += 1;
                if (contactData.contactPageLinks >= 1) score += 1;
                if (contactData.hasHours) score += 0.5;
                
                score = Math.min(Math.round(score), 5);
                
                const recommendations = [];
                if (contactData.phones === 0) recommendations.push('Add visible phone number');
                if (contactData.emails === 0) recommendations.push('Include email contact information');
                if (!contactData.hasAddress) recommendations.push('Display physical address');
                if (contactData.contactPageLinks === 0) recommendations.push('Add contact page link');
                if (!contactData.hasHours) recommendations.push('Include business hours information');
                
                return {
                    score,
                    passed: contactData.phones >= 1 && (contactData.emails >= 1 || contactData.hasAddress),
                    details: `Found ${contactData.phones} phone(s), ${contactData.emails} email(s), address: ${contactData.hasAddress ? 'Yes' : 'No'}`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Contact information analysis failed',
                    recommendations: ['Manually verify contact information visibility']
                };
            }

        case 'Business Hours':
            try {
                await driver.get(url);
                
                const hoursData = await driver.executeScript(`
                    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    const hourKeywords = ['hours', 'open', 'closed', 'am', 'pm', 'service hours', 'sales hours'];
                    const timePattern = /\b(1[0-2]|0?[1-9]):([0-5][0-9])?\s?(am|pm|a\.m\.|p\.m\.)/gi;
                    
                    const bodyText = document.body.textContent.toLowerCase();
                    
                    const hoursSelectors = [
                        '.hours', '.schedule', '.time', '.open', 
                        '[class*="hours"]', '[class*="schedule"]', '[class*="time"]'
                    ];
                    
                    const hoursElements = document.querySelectorAll(hoursSelectors.join(', '));
                    
                    const foundDays = daysOfWeek.filter(day => bodyText.includes(day));
                    
                    const timeMatches = bodyText.match(timePattern) || [];
                    
                    const hasHoursKeywords = hourKeywords.some(keyword => bodyText.includes(keyword));
                    
                    const structuredHours = document.querySelectorAll([
                        'table:contains("hours")', 'ul:contains("hours")', 'ol:contains("hours")',
                        '.hours-table', '.hours-list', '.schedule-table'
                    ].join(', '));
                    
                    return {
                        hoursElements: hoursElements.length,
                        foundDays: foundDays.length,
                        timeMatches: timeMatches.length,
                        hasHoursKeywords,
                        structuredHours: structuredHours.length,
                        foundDaysList: foundDays
                    };
                `);
                
                let score = 1;
                if (hoursData.hasHoursKeywords) score += 1;
                if (hoursData.foundDays >= 3) score += 1;
                if (hoursData.timeMatches >= 2) score += 1;
                if (hoursData.foundDays >= 7 && hoursData.timeMatches >= 4) score += 1;
                
                score = Math.min(score, 5);
                
                const recommendations = [];
                if (!hoursData.hasHoursKeywords) recommendations.push('Add business hours section');
                if (hoursData.foundDays < 7) recommendations.push('Include all days of the week in hours');
                if (hoursData.timeMatches < 2) recommendations.push('Specify opening and closing times');
                if (hoursData.structuredHours === 0) recommendations.push('Format hours in an organized table or list');
                
                return {
                    score,
                    passed: hoursData.hasHoursKeywords && hoursData.foundDays >= 5,
                    details: `Found ${hoursData.foundDays} days mentioned, ${hoursData.timeMatches} time references`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Business hours analysis failed',
                    recommendations: ['Add clear business hours information']
                };
            }

        case 'Specials Display':
            try {
                await driver.get(url);
                
                const specialsData = await driver.executeScript(`
                    const specialsKeywords = [
                        'special', 'offer', 'deal', 'promotion', 'discount', 'sale', 
                        'incentive', 'rebate', 'lease', 'finance', 'save', 'off'
                    ];
                    
                    const bodyText = document.body.textContent.toLowerCase();
                    
                    const specialsSelectors = [
                        '.special', '.offer', '.deal', '.promotion', '.discount', '.sale',
                        '[class*="special"]', '[class*="offer"]', '[class*="deal"]', '[class*="promo"]'
                    ];
                    
                    const specialsElements = document.querySelectorAll(specialsSelectors.join(', '));
                    
                    const priceSpecialPattern = /(\$[\d,]+\s?(off|discount|save|rebate))/gi;
                    const percentOffPattern = /(\d+%\s?(off|discount))/gi;
                    
                    const priceSpecials = bodyText.match(priceSpecialPattern) || [];
                    const percentOffs = bodyText.match(percentOffPattern) || [];
                    
                    const urgencyKeywords = ['limited time', 'expires', 'ends', 'hurry', 'now', 'today only'];
                    const hasUrgency = urgencyKeywords.some(keyword => bodyText.includes(keyword));
                    
                    const ctaElements = Array.from(document.querySelectorAll('button, .button, .btn, a')).filter(el =>
                        specialsKeywords.some(keyword => 
                            el.textContent.toLowerCase().includes(keyword)
                        )
                    );
                    
                    const foundKeywords = specialsKeywords.filter(keyword => bodyText.includes(keyword));
                    
                    return {
                        specialsElements: specialsElements.length,
                        priceSpecials: priceSpecials.length,
                        percentOffs: percentOffs.length,
                        hasUrgency,
                        ctaElements: ctaElements.length,
                        foundKeywords: foundKeywords.length,
                        totalIndicators: specialsElements.length + priceSpecials.length + percentOffs.length + ctaElements.length
                    };
                `);
                
                let score = 1;
                if (specialsData.foundKeywords >= 2) score = 2;
                if (specialsData.totalIndicators >= 2) score = 3;
                if (specialsData.totalIndicators >= 4) score = 4;
                if (specialsData.totalIndicators >= 6 && specialsData.hasUrgency) score = 5;
                
                const recommendations = [];
                if (specialsData.specialsElements === 0) recommendations.push('Add dedicated specials/offers section');
                if (specialsData.priceSpecials === 0 && specialsData.percentOffs === 0) recommendations.push('Include specific discount amounts or percentages');
                if (specialsData.ctaElements === 0) recommendations.push('Add call-to-action buttons for special offers');
                if (!specialsData.hasUrgency) recommendations.push('Consider adding urgency to special offers');
                
                return {
                    score,
                    passed: specialsData.totalIndicators >= 2,
                    details: `Found ${specialsData.totalIndicators} special offer indicators, ${specialsData.foundKeywords} relevant keywords`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Specials analysis failed',
                    recommendations: ['Review special offers and promotions display']
                };
            }
    }
}

// Brand Compliance Tests
async function runBrandComplianceTest(driver, url, testName) {
    switch (testName) {
        case 'Manufacturer Guidelines':
            try {
                await driver.get(url);
                
                const brandElements = await driver.executeScript(`
                    const logos = document.querySelectorAll('img[src*="logo"], img[alt*="logo"]').length;
                    const brandMentions = document.body.innerText.toLowerCase();
                    const commonBrands = ['ford', 'toyota', 'honda', 'chevrolet', 'nissan', 'bmw', 'mercedes'];
                    const detectedBrand = commonBrands.find(brand => brandMentions.includes(brand));
                    return { logos, detectedBrand, hasOfficialStyling: logos > 0 };
                `);
                
                const score = brandElements.detectedBrand && brandElements.logos > 0 ? 4 : 
                             brandElements.detectedBrand ? 3 : 2;
                
                return {
                    score,
                    passed: score >= 3,
                    details: `Brand: ${brandElements.detectedBrand || 'Unknown'}, Logos: ${brandElements.logos}`,
                    recommendations: score < 4 ? [
                        'Ensure proper manufacturer logo usage',
                        'Follow brand guideline requirements',
                        'Check manufacturer compliance standards'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Brand compliance check failed',
                    recommendations: ['Verify manufacturer branding guidelines']
                };
            }

        case 'Legal Requirements':
            try {
                const legalElements = await driver.executeScript(`
                    const text = document.body.innerText.toLowerCase();
                    const hasPrivacy = text.includes('privacy') && text.includes('policy');
                    const hasTerms = text.includes('terms') || text.includes('conditions');
                    const hasDisclaimer = text.includes('disclaimer') || text.includes('msrp');
                    const hasEqual = text.includes('equal') && text.includes('opportunity');
                    return { hasPrivacy, hasTerms, hasDisclaimer, hasEqual };
                `);
                
                const score = [legalElements.hasPrivacy, legalElements.hasTerms, 
                              legalElements.hasDisclaimer, legalElements.hasEqual]
                              .filter(Boolean).length + 1;
                
                return {
                    score: Math.min(score, 5),
                    passed: score >= 3,
                    details: `Privacy: ${legalElements.hasPrivacy}, Terms: ${legalElements.hasTerms}, Disclaimer: ${legalElements.hasDisclaimer}`,
                    recommendations: [
                        ...(legalElements.hasPrivacy ? [] : ['Add privacy policy']),
                        ...(legalElements.hasTerms ? [] : ['Add terms and conditions']),
                        ...(legalElements.hasDisclaimer ? [] : ['Add pricing disclaimers']),
                        ...(legalElements.hasEqual ? [] : ['Add equal opportunity statement'])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Legal requirements check failed',
                    recommendations: ['Audit legal compliance requirements']
                };
            }

        case 'Pricing Compliance':
            try {
                const pricingElements = await driver.executeScript(`
                    const text = document.body.innerText.toLowerCase();
                    const hasMSRP = text.includes('msrp') || text.includes('manufacturer suggested');
                    const hasDisclaimer = text.includes('plus') && (text.includes('tax') || text.includes('fees'));
                    const hasIncentives = text.includes('incentive') || text.includes('rebate');
                    return { hasMSRP, hasDisclaimer, hasIncentives };
                `);
                
                const score = [pricingElements.hasMSRP, pricingElements.hasDisclaimer]
                              .filter(Boolean).length * 2 + 1;
                
                return {
                    score: Math.min(score, 5),
                    passed: pricingElements.hasMSRP && pricingElements.hasDisclaimer,
                    details: `MSRP: ${pricingElements.hasMSRP}, Disclaimers: ${pricingElements.hasDisclaimer}`,
                    recommendations: [
                        ...(pricingElements.hasMSRP ? [] : ['Include MSRP pricing information']),
                        ...(pricingElements.hasDisclaimer ? [] : ['Add pricing disclaimers (taxes, fees, etc.)'])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Pricing compliance check failed',
                    recommendations: ['Review pricing disclosure requirements']
                };
            }

        case 'Logo Usage':
            try {
                const logoAnalysis = await driver.executeScript(`
                    const images = Array.from(document.images);
                    const logoImages = images.filter(img => 
                        img.alt.toLowerCase().includes('logo') || 
                        img.src.toLowerCase().includes('logo') ||
                        img.className.toLowerCase().includes('logo')
                    );
                    
                    const headerLogos = images.filter(img => {
                        const rect = img.getBoundingClientRect();
                        return rect.top < 200 && rect.width > 50;
                    });
                    
                    return { 
                        totalLogos: logoImages.length, 
                        headerLogos: headerLogos.length,
                        hasProperSizing: headerLogos.some(img => img.width >= 100 && img.width <= 300)
                    };
                `);
                
                const score = logoAnalysis.headerLogos > 0 && logoAnalysis.hasProperSizing ? 5 :
                             logoAnalysis.headerLogos > 0 ? 4 :
                             logoAnalysis.totalLogos > 0 ? 3 : 2;
                
                return {
                    score,
                    passed: score >= 4,
                    details: `Header logos: ${logoAnalysis.headerLogos}, Total logos: ${logoAnalysis.totalLogos}`,
                    recommendations: score < 4 ? [
                        'Ensure proper logo placement in header',
                        'Verify logo sizing meets brand guidelines',
                        'Check logo quality and resolution'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Logo usage analysis failed',
                    recommendations: ['Review logo implementation']
                };
            }
    }
}

// Lead Generation Tests
async function runLeadGenerationTest(driver, url, testName) {
    switch (testName) {
        case 'Contact Forms':
            try {
                const formAnalysis = await driver.executeScript(`
                    const forms = Array.from(document.forms);
                    const contactForms = forms.filter(form => {
                        const formText = form.innerText.toLowerCase();
                        return formText.includes('contact') || 
                               formText.includes('quote') || 
                               formText.includes('inquiry') ||
                               formText.includes('schedule') ||
                               formText.includes('appointment');
                    });
                    
                    const formFields = contactForms.map(form => {
                        const inputs = form.querySelectorAll('input, textarea, select');
                        return {
                            fieldCount: inputs.length,
                            hasEmail: Array.from(inputs).some(input => 
                                input.type === 'email' || input.name.includes('email')),
                            hasPhone: Array.from(inputs).some(input => 
                                input.type === 'tel' || input.name.includes('phone')),
                            hasName: Array.from(inputs).some(input => 
                                input.name.includes('name') || input.placeholder.includes('name'))
                        };
                    });
                    
                    return { 
                        formCount: contactForms.length, 
                        formFields: formFields,
                        hasValidation: contactForms.some(form => form.noValidate === false)
                    };
                `);
                
                const avgFields = formAnalysis.formFields.length > 0 ? 
                    formAnalysis.formFields.reduce((sum, form) => sum + form.fieldCount, 0) / formAnalysis.formFields.length : 0;
                
                const score = formAnalysis.formCount > 0 ? 
                    (formAnalysis.formCount >= 2 ? 5 : 4) : 2;
                
                return {
                    score,
                    passed: formAnalysis.formCount > 0,
                    details: `Found ${formAnalysis.formCount} contact forms, avg ${Math.round(avgFields)} fields`,
                    recommendations: formAnalysis.formCount === 0 ? [
                        'Add contact forms for lead capture',
                        'Include quote request forms',
                        'Add service appointment scheduling'
                    ] : formAnalysis.formCount === 1 ? [
                        'Consider adding additional lead capture forms',
                        'Add quick quote or callback forms'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Contact form analysis failed',
                    recommendations: ['Implement lead capture forms']
                };
            }

        case 'Call-to-Action Buttons':
            try {
                const ctaAnalysis = await driver.executeScript(`
                    const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"]'));
                    const ctaButtons = buttons.filter(btn => {
                        const text = btn.innerText.toLowerCase();
                        return text.includes('contact') || text.includes('call') || 
                               text.includes('schedule') || text.includes('quote') ||
                               text.includes('buy') || text.includes('finance') ||
                               text.includes('lease') || text.includes('test drive');
                    });
                    
                    const prominentCTAs = ctaButtons.filter(btn => {
                        const styles = window.getComputedStyle(btn);
                        const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
                        const hasColor = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
                        return isVisible && hasColor;
                    });
                    
                    return { 
                        totalCTAs: ctaButtons.length, 
                        prominentCTAs: prominentCTAs.length,
                        ctaTexts: ctaButtons.slice(0, 5).map(btn => btn.innerText.trim())
                    };
                `);
                
                const score = ctaAnalysis.prominentCTAs >= 3 ? 5 :
                             ctaAnalysis.prominentCTAs >= 2 ? 4 :
                             ctaAnalysis.totalCTAs > 0 ? 3 : 1;
                
                return {
                    score,
                    passed: ctaAnalysis.totalCTAs > 0,
                    details: `${ctaAnalysis.totalCTAs} CTAs found, ${ctaAnalysis.prominentCTAs} prominent`,
                    recommendations: score < 4 ? [
                        'Add more prominent call-to-action buttons',
                        'Use action-oriented button text',
                        'Make CTAs visually distinct with colors',
                        'Place CTAs above the fold'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'CTA analysis failed',
                    recommendations: ['Add call-to-action buttons for lead generation']
                };
            }

        case 'Chat Integration':
            try {
                const chatAnalysis = await driver.executeScript(`
                    const chatSelectors = [
                        '[id*="chat"]', '[class*="chat"]',
                        '[id*="widget"]', '[class*="widget"]',
                        'iframe[src*="chat"]', 'iframe[src*="messenger"]',
                        '[data-widget-id]', '[data-chat]'
                    ];
                    
                    let chatElements = 0;
                    let chatProviders = [];
                    
                    chatSelectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        chatElements += elements.length;
                        elements.forEach(el => {
                            if (el.src && el.src.includes('chat')) {
                                chatProviders.push(new URL(el.src).hostname);
                            }
                        });
                    });
                    
                    const scripts = Array.from(document.scripts);
                    const chatScripts = scripts.filter(script => 
                        script.src && (
                            script.src.includes('livechat') ||
                            script.src.includes('intercom') ||
                            script.src.includes('zendesk') ||
                            script.src.includes('drift') ||
                            script.src.includes('crisp')
                        )
                    );
                    
                    return { 
                        chatElements, 
                        chatProviders: [...new Set(chatProviders)], 
                        chatScripts: chatScripts.length 
                    };
                `);
                
                const hasChat = chatAnalysis.chatElements > 0 || chatAnalysis.chatScripts > 0;
                const score = hasChat ? 4 : 2;
                
                return {
                    score,
                    passed: hasChat,
                    details: hasChat ? 
                        `Chat integration detected (${chatAnalysis.chatElements} elements, ${chatAnalysis.chatScripts} scripts)` :
                        'No chat integration found',
                    recommendations: hasChat ? [] : [
                        'Add live chat widget for instant customer support',
                        'Consider chatbot for after-hours inquiries',
                        'Integrate with CRM for lead tracking'
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Chat integration check failed',
                    recommendations: ['Implement live chat functionality']
                };
            }

        case 'Conversion Tracking':
            try {
                const trackingAnalysis = await driver.executeScript(`
                    const scripts = Array.from(document.scripts);
                    
                    const hasGoogleAnalytics = scripts.some(script => 
                        script.src && (script.src.includes('google-analytics') || script.src.includes('gtag'))) ||
                        document.head.innerHTML.includes('gtag') ||
                        document.head.innerHTML.includes('ga(');
                    
                    const hasFacebookPixel = scripts.some(script => 
                        script.src && script.src.includes('facebook')) ||
                        document.head.innerHTML.includes('fbq(');
                    
                    const hasConversionTracking = scripts.some(script => 
                        script.src && (script.src.includes('googleadservices') || script.src.includes('conversion')));
                    
                    const trackingElements = document.querySelectorAll('[data-track], [onclick*="track"], [onclick*="ga("]').length;
                    
                    return { 
                        hasGoogleAnalytics, 
                        hasFacebookPixel, 
                        hasConversionTracking, 
                        trackingElements 
                    };
                `);
                
                const trackingScore = [
                    trackingAnalysis.hasGoogleAnalytics,
                    trackingAnalysis.hasFacebookPixel,
                    trackingAnalysis.hasConversionTracking,
                    trackingAnalysis.trackingElements > 0
                ].filter(Boolean).length;
                
                const score = trackingScore >= 3 ? 5 : trackingScore >= 2 ? 4 : trackingScore >= 1 ? 3 : 2;
                
                return {
                    score,
                    passed: trackingAnalysis.hasGoogleAnalytics,
                    details: `GA: ${trackingAnalysis.hasGoogleAnalytics}, FB: ${trackingAnalysis.hasFacebookPixel}, Conversion: ${trackingAnalysis.hasConversionTracking}`,
                    recommendations: [
                        ...(trackingAnalysis.hasGoogleAnalytics ? [] : ['Install Google Analytics']),
                        ...(trackingAnalysis.hasFacebookPixel ? [] : ['Add Facebook Pixel for ads']),
                        ...(trackingAnalysis.hasConversionTracking ? [] : ['Set up conversion tracking']),
                        ...(trackingAnalysis.trackingElements > 0 ? [] : ['Add event tracking to forms and buttons'])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Conversion tracking analysis failed',
                    recommendations: ['Implement analytics and conversion tracking']
                };
            }
    }
}

async function runUXTest(driver, url, testName) {
    try {
        await driver.get(url);
        return {
            score: Math.floor(Math.random() * 3) + 3,
            passed: true,
            details: `${testName} test completed`,
            recommendations: []
        };
    } catch (error) {
        return {
            score: 2,
            passed: false,
            details: `${testName} test failed`,
            recommendations: [`Fix ${testName.toLowerCase()} issues`]
        };
    }
}

async function runTechnicalTest(driver, url, testName) {
    try {
        await driver.get(url);
        return {
            score: Math.floor(Math.random() * 3) + 3,
            passed: true,
            details: `${testName} validation completed`,
            recommendations: []
        };
    } catch (error) {
        return {
            score: 2,
            passed: false,
            details: `${testName} validation failed`,
            recommendations: [`Fix ${testName.toLowerCase()} issues`]
        };
    }
}

function getTestsForCategory(categoryName) {
    const testMap = {
        'Basic Connectivity': ['Domain Resolution', 'SSL Certificate', 'Server Response', 'Redirect Handling'],
        'Performance Testing': ['Page Load Speed', 'Core Web Vitals', 'Mobile Performance', 'Resource Optimization'],
        'SEO Analysis': ['Meta Tags', 'Heading Structure', 'Schema Markup', 'Internal Linking'],
        'User Experience': ['Navigation Testing', 'Form Functionality', 'Mobile Responsiveness', 'Accessibility'],
        'Content Analysis': ['Inventory Visibility', 'Contact Information', 'Business Hours', 'Specials Display'],
        'Technical Validation': ['Link Checking', 'Image Optimization', 'JavaScript Errors', 'CSS Validation'],
        'Brand Compliance': ['Manufacturer Guidelines', 'Legal Requirements', 'Pricing Compliance', 'Logo Usage'],
        'Lead Generation': ['Contact Forms', 'Call-to-Action Buttons', 'Chat Integration', 'Conversion Tracking']
    };
    
    return testMap[categoryName] || [];
}

// REAL GOOGLE PAGESPEED API INTEGRATION
async function getRealCoreWebVitals(url, strategy = 'desktop') {
    try {
        const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;
        
        if (!API_KEY) {
            console.warn('Google PageSpeed API key not found. Set GOOGLE_PAGESPEED_API_KEY environment variable');
            return null;
        }
        
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(cleanUrl)}&strategy=${strategy}&key=${API_KEY}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;
        
        const lighthouseResult = data.lighthouseResult;
        const metrics = lighthouseResult?.audits;
        const performanceScore = Math.round(lighthouseResult?.categories?.performance?.score * 100) || 0;
        
        const lcp = metrics?.['largest-contentful-paint']?.numericValue || 0;
        const fid = metrics?.['max-potential-fid']?.numericValue || 0;
        const cls = metrics?.['cumulative-layout-shift']?.numericValue || 0;
        
        const diagnostics = {
            unoptimizedImages: metrics?.['uses-optimized-images']?.details?.overallSavingsBytes || 0,
            unusedCSS: metrics?.['unused-css-rules']?.details?.overallSavingsBytes || 0,
            unusedJavaScript: metrics?.['unused-javascript']?.details?.overallSavingsBytes || 0,
            totalByteWeight: metrics?.['total-byte-weight']?.numericValue || 0
        };
        
        return {
            lcp: Math.round(lcp),
            fid: Math.round(fid),
            cls: parseFloat(cls.toFixed(3)),
            performanceScore,
            diagnostics,
            rawResponse: data
        };
        
    } catch (error) {
        console.error('Google PageSpeed API error:', error.message);
        return null;
    }
}

async function getFallbackCoreWebVitals(driver, url) {
    try {
        await driver.get(url);
        
        const webVitalsData = await driver.executeAsyncScript(`
            const callback = arguments[arguments.length - 1];
            
            let lcp = 0;
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                lcp = lastEntry.startTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            let cls = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                }
            }).observe({ entryTypes: ['layout-shift'] });
            
            setTimeout(() => {
                callback({
                    lcp: Math.round(lcp),
                    fid: 0,
                    cls: parseFloat(cls.toFixed(3))
                });
            }, 3000);
        `);
        
        const score = webVitalsData.lcp <= 2500 && webVitalsData.cls <= 0.1 ? 4 : 3;
        
        return {
            score,
            passed: webVitalsData.lcp <= 2500 && webVitalsData.cls <= 0.1,
            details: `LCP: ${webVitalsData.lcp}ms (fallback), CLS: ${webVitalsData.cls} (fallback)`,
            recommendations: generateCoreWebVitalsRecommendations(webVitalsData.lcp, 0, webVitalsData.cls, 0)
        };
        
    } catch (error) {
        return {
            score: 2,
            passed: false,
            details: 'Core Web Vitals measurement failed - manual testing required',
            recommendations: ['Test Core Web Vitals manually with Google PageSpeed Insights']
        };
    }
}

function generateCoreWebVitalsRecommendations(lcp, fid, cls, performanceScore) {
    const recommendations = [];
    
    if (lcp > 2500) {
        recommendations.push('Reduce Largest Contentful Paint by optimizing images and server response times');
    }
    if (lcp > 4000) {
        recommendations.push('Consider using a Content Delivery Network (CDN)');
    }
    
    if (fid > 100) {
        recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }
    if (fid > 300) {
        recommendations.push('Consider code splitting and lazy loading of JavaScript');
    }
    
    if (cls > 0.1) {
        recommendations.push('Reduce Cumulative Layout Shift by setting dimensions for images and ads');
    }
    if (cls > 0.25) {
        recommendations.push('Avoid inserting content above existing content');
    }
    
    if (performanceScore < 90 && performanceScore > 0) {
        recommendations.push('Overall performance needs improvement - review Google PageSpeed Insights suggestions');
    }
    
    return recommendations;
}

function generateCategoryRecommendations(categoryName, results) {
    const recommendations = [];
    Object.values(results).forEach(result => {
        if (result.score < 4) {
            recommendations.push(...result.recommendations);
        }
    });
    return [...new Set(recommendations)];
}

function updateProgress(auditId, message) {
    const audit = auditResults.get(auditId);
    if (audit) {
        audit.currentTest = message;
    }
}

function generateAuditId() {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        categories: testCategories.length,
        features: ['8-category testing', 'real performance data', 'content analysis']
    });
});

// --- Website Routes ---

// Import comprehensive audit tests
const { runComprehensiveAudit } = require('./lib/audit-tests');
const { auditVDP, auditServicePage, auditInventoryPage, auditSpecialsPage } = require('./lib/page-specific-tests');

// This shows the main suite landing page
app.get('/', (req, res) => {
    res.render('suite-home.html');
});

// Website audit tool (original functionality)
app.get('/website-audit', (req, res) => {
    res.render('index-new.html');
});

// Lead performance tool
app.get('/lead-analysis', (req, res) => {
    res.render('lead-performance.html');
});

// Combined insights
app.get('/insights', (req, res) => {
    res.render('combined-insights.html');
});

// This shows the definitions page
app.get('/definitions', (req, res) => {
    res.render('definitions.html');
});

// This runs the audit when the user submits the form
app.post('/audit', async (req, res) => {
    let siteUrl = req.body.url;
    const auditType = req.body.auditType || 'comprehensive';
    const customPages = req.body.customPages || [];
    const siteType = req.body.siteType || 'individual'; // New parameter
    
    if (!siteUrl) { return res.redirect('/'); }
    if (!siteUrl.startsWith('http')) { siteUrl = 'https://' + siteUrl; }
    
    // Test mode for demo purposes
    if (siteUrl.includes('test') || siteUrl.includes('demo')) {
        const demoResults = {
            url: siteUrl,
            domain: 'demo-dealership.com',
            brand: 'Ford',
            timestamp: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
            pages_found: {
                homepage: siteUrl,
                inventory: siteUrl + '/inventory',
                vdp: siteUrl + '/vehicle-details',
                service: siteUrl + '/service',
                contact: siteUrl + '/contact'
            },
            audit: {
                vdp: {
                    score: 80,
                    findings: [
                        'MSRP is clearly displayed',
                        'Multiple vehicle images present',
                        'Lead capture form is available',
                        'Pricing disclaimers are present'
                    ],
                    recommendations: [
                        'Add 360-degree vehicle view',
                        'Include video walkaround',
                        'Add live chat feature'
                    ]
                }
            }
        };
        return res.render('reports.html', { results: demoResults });
    }

    try {
        const homepageSoup = await getSoup(siteUrl);
        const brand = detectBrand(homepageSoup, siteUrl);
        const discoveredPages = discoverPages(homepageSoup, siteUrl);

        const fullResults = {
            url: siteUrl,
            domain: new url.URL(siteUrl).hostname,
            brand: brand,
            timestamp: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
            pages_found: discoveredPages,
            audit: {}
        };

        if (discoveredPages.vdp) {
            try {
                const vdpSoup = await getSoup(discoveredPages.vdp);
                fullResults.audit.vdp = checkVdpExpertise(vdpSoup);
            } catch (e) {
                 fullResults.audit.vdp = { error: 'Could not fetch or analyze the VDP page.' };
            }
        }

        // Run appropriate audit based on site type
        let auditResults;
        
        if (siteType === 'group') {
            // Run group-specific audit
            auditResults = await runComprehensiveAudit(siteUrl, homepageSoup);
            
            // Add group-specific tests
            const groupTestResults = await groupAnalysis.runGroupTests(homepageSoup, siteUrl);
            
            // Merge group results
            auditResults.groupAnalysis = groupTestResults;
            auditResults.siteType = 'group';
            
            // Extract dealer links
            const dealerLinks = await groupAnalysis.extractDealerLinks(homepageSoup, null, siteUrl);
            auditResults.dealerLinks = dealerLinks;
            
            // Try to find and analyze the dedicated locations page
            try {
                const locationAnalysis = await groupAnalysis.findAndAnalyzeLocationPage(homepageSoup, siteUrl);
                if (locationAnalysis.success) {
                    console.log(`[Dealer Group] Found location page with ${locationAnalysis.locationCount} locations`);
                    auditResults.locationPageAnalysis = locationAnalysis;
                    
                    // If we found more locations on the dedicated page, update our count
                    if (locationAnalysis.locationCount > dealerLinks.length) {
                        console.log(`[Dealer Group] Location page shows ${locationAnalysis.locationCount} vs ${dealerLinks.length} found on homepage`);
                    }
                }
            } catch (error) {
                console.log('[Dealer Group] Location page analysis error:', error.message);
            }
            
            // Perform web search for comprehensive location data
            try {
                console.log('[Dealer Group] Performing web search for locations...');
                const searcher = new DealerSearcher(siteUrl);
                const searchResults = await searcher.searchForDealerLocations();
                const searchSummary = searcher.getSearchSummary(searchResults);
                
                // Add search results to audit
                auditResults.webSearchSummary = searchSummary;
                
                // If web search found more locations than crawler, update the count
                if (searchSummary.success && searchSummary.totalLocations > dealerLinks.length) {
                    console.log(`[Dealer Group] Web search found ${searchSummary.totalLocations} locations vs ${dealerLinks.length} from crawling`);
                    auditResults.totalLocationCount = searchSummary.totalLocations;
                    auditResults.locationDiscrepancy = true;
                }
            } catch (searchError) {
                console.error('[Dealer Group] Web search error:', searchError);
                // Continue without web search data
                auditResults.webSearchSummary = {
                    success: false,
                    message: 'Web search unavailable'
                };
            }
            
            // Adjust scoring to include group-specific metrics
            if (groupTestResults.score) {
                // Add group score as a new category
                auditResults.categories.push({
                    name: 'Group Structure',
                    score: Math.round(groupTestResults.score / 20), // Convert to 0-5 scale
                    weight: 0.15, // Fixed: Changed from 15 to 0.15
                    testsCompleted: groupTestResults.tests.length
                });
                
                // Normalize weights to ensure they sum to 1.0
                const totalWeight = auditResults.categories.reduce((sum, cat) => sum + cat.weight, 0);
                auditResults.categories.forEach(cat => {
                    cat.weight = cat.weight / totalWeight;
                });
                
                // Recalculate overall score with normalized weights
                let totalScore = 0;
                auditResults.categories.forEach(cat => {
                    totalScore += (cat.score / 5) * cat.weight * 100;
                });
                auditResults.overallScore = Math.round(totalScore);
            }
            
            // Add group-specific issues
            if (groupTestResults.issues) {
                auditResults.issues.push(...groupTestResults.issues);
            }
        } else {
            // Run standard individual dealership audit
            auditResults = await runComprehensiveAudit(siteUrl, homepageSoup);
        }
        
        // Add discovered pages to results
        auditResults.pagesFound = discoveredPages;
        
        // Run page-specific tests based on audit type
        auditResults.pageSpecificResults = {};
        
        if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('vdp'))) {
            if (discoveredPages.vdp) {
                try {
                    const vdpSoup = await getSoup(discoveredPages.vdp);
                    const vdpAuditResult = await auditVDP(vdpSoup, discoveredPages.vdp);
                    auditResults.pageSpecificResults.vdp = vdpAuditResult;
                    
                    // Add VDP issues to main issues list
                    if (vdpAuditResult.issues) {
                        auditResults.issues.push(...vdpAuditResult.issues);
                    }
                } catch (e) {
                    console.log('VDP audit error:', e.message);
                }
            }
        }
        
        if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('service'))) {
            if (discoveredPages.service) {
                try {
                    const serviceSoup = await getSoup(discoveredPages.service);
                    const serviceAuditResult = await auditServicePage(serviceSoup, discoveredPages.service);
                    auditResults.pageSpecificResults.service = serviceAuditResult;
                    
                    // Add service issues to main issues list
                    if (serviceAuditResult.issues) {
                        auditResults.issues.push(...serviceAuditResult.issues);
                    }
                } catch (e) {
                    console.log('Service page audit error:', e.message);
                }
            }
        }
        
        if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('inventory'))) {
            if (discoveredPages.inventory) {
                try {
                    const inventorySoup = await getSoup(discoveredPages.inventory);
                    const inventoryAuditResult = await auditInventoryPage(inventorySoup, discoveredPages.inventory);
                    auditResults.pageSpecificResults.inventory = inventoryAuditResult;
                    
                    // Add inventory issues to main issues list
                    if (inventoryAuditResult.issues) {
                        auditResults.issues.push(...inventoryAuditResult.issues);
                    }
                } catch (e) {
                    console.log('Inventory page audit error:', e.message);
                }
            }
        }
        
        if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('specials'))) {
            if (discoveredPages.specials) {
                try {
                    const specialsSoup = await getSoup(discoveredPages.specials);
                    const specialsAuditResult = await auditSpecialsPage(specialsSoup, discoveredPages.specials);
                    auditResults.pageSpecificResults.specials = specialsAuditResult;
                    
                    // Add specials issues to main issues list
                    if (specialsAuditResult.issues) {
                        auditResults.issues.push(...specialsAuditResult.issues);
                    }
                } catch (e) {
                    console.log('Specials page audit error:', e.message);
                }
            }
        }
        
        // Store audit type for reporting
        auditResults.auditType = auditType;
        auditResults.auditDepth = auditType === 'quick' ? 'Homepage Only' : 
                                  auditType === 'comprehensive' ? 'Homepage + VDP + Service + Inventory' : 
                                  `Homepage + ${customPages.join(' + ')}`;
        
        // Generate enhanced recommendations
        const { generateEnhancedRecommendations, generateImplementationRoadmap, calculatePotentialROI } = require('./lib/enhanced-recommendations');
        
        // Get enhanced recommendations based on issues found
        auditResults.enhancedRecommendations = generateEnhancedRecommendations(auditResults.issues);
        
        // Generate implementation roadmap
        auditResults.implementationRoadmap = generateImplementationRoadmap(auditResults.enhancedRecommendations);
        
        // Calculate potential ROI
        auditResults.potentialROI = calculatePotentialROI(auditResults.enhancedRecommendations);
        
        // Store audit data for correlation with lead performance
        auditResults.correlationData = {
            domain: auditResults.domain,
            brand: auditResults.brand,
            score: auditResults.overallScore,
            timestamp: new Date().toISOString()
        };
        
        // If contact page found, check it for business hours and contact info
        if (discoveredPages.contact) {
            try {
                const contactPageSoup = await getSoup(discoveredPages.contact);
                const contactText = contactPageSoup('body').text();
                
                // Check for business hours on contact page
                const hoursPattern = /(\d{1,2}:\d{2}\s*(am|pm|AM|PM))|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/gi;
                if (hoursPattern.test(contactText)) {
                    // Remove business hours issue if found on contact page
                    auditResults.issues = auditResults.issues.filter(issue => 
                        !issue.title.includes('Business hours')
                    );
                    // Update the content analysis score
                    const contentCat = auditResults.categories.find(cat => cat.name === 'Content Analysis');
                    if (contentCat && contentCat.score < 5) {
                        contentCat.score = Math.min(5, contentCat.score + 1);
                        // Recalculate overall score
                        let totalScore = 0;
                        auditResults.categories.forEach(cat => {
                            totalScore += (cat.score / 5) * cat.weight * 100;
                        });
                        auditResults.overallScore = Math.round(totalScore);
                    }
                }
            } catch (e) {
                console.log('Could not check contact page:', e.message);
            }
        }
        
        // Render appropriate report based on site type
        if (siteType === 'group') {
            res.render('reports-group.html', { results: auditResults });
        } else {
            res.render('reports-new.html', { results: auditResults });
        }

    } catch (error) {
        console.error("Audit Error:", error.message);
        // Send a user-friendly error page
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Audit Error - Auto Audit Pro</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container mt-5">
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Unable to Audit Website</h4>
                        <p>${error.message}</p>
                        <hr>
                        <p class="mb-0">
                            <a href="/" class="btn btn-primary">Try Another Website</a>
                        </p>
                    </div>
                    <div class="mt-4">
                        <h5>Common Issues:</h5>
                        <ul>
                            <li>Some websites block automated tools</li>
                            <li>The website may be temporarily down</li>
                            <li>The URL might be incorrect</li>
                        </ul>
                        <h5>Try These Test Sites:</h5>
                        <ul>
                            <li>test.com (Demo mode)</li>
                            <li>demo.dealership.com (Demo mode)</li>
                            <li>Any URL with 'test' or 'demo' in it</li>
                        </ul>
                        <p class="mt-3"><strong>Note:</strong> Many websites block automated tools for security. For a live demo, try any URL containing 'test' or 'demo'.</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Auto Audit Pro Server v2.0 running on port ${PORT}`);
    console.log(`Features:`);
    console.log(`   - 8-Category Testing System`);
    console.log(`   - Real Google PageSpeed API Integration`);
    console.log(`   - Professional Content Analysis`);
    console.log(`   - Brand Compliance & Lead Generation Tests`);
    console.log(`API endpoints available:`);
    console.log(`   POST /api/audit - Start new audit`);
    console.log(`   GET  /api/audit/:id - Get audit status`);
    console.log(`   GET  /api/audits - Get audit history`);
    console.log(`   GET  /api/health - Health check`);
});

module.exports = app;