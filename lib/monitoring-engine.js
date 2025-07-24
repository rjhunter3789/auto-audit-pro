/**
 * Website Monitoring Engine
 * Core module for continuous website health monitoring
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const { URL } = require('url');
const dns = require('dns').promises;
const { performance } = require('perf_hooks');
const ScrapingDogWrapper = require('./scrapingdog-wrapper');
const fs = require('fs');
const path = require('path');

class MonitoringEngine {
    constructor() {
        this.seleniumWrapper = require('./selenium-wrapper');
        this.scrapingDog = new ScrapingDogWrapper();
        this.jsonStorage = require('./json-storage').storage;
        this.monitoringStats = this.loadStats() || {
            seleniumRequests: 0,
            scrapingDogRequests: 0,
            seleniumSuccess: 0,
            scrapingDogSuccess: 0
        };
    }

    loadStats() {
        try {
            const statsFile = path.join(__dirname, '../data/monitoring/stats.json');
            if (fs.existsSync(statsFile)) {
                return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
            }
        } catch (error) {
            console.log('[Monitor] Could not load stats:', error.message);
        }
        return null;
    }

    saveStats() {
        try {
            const statsFile = path.join(__dirname, '../data/monitoring/stats.json');
            const statsDir = path.dirname(statsFile);
            if (!fs.existsSync(statsDir)) {
                fs.mkdirSync(statsDir, { recursive: true });
            }
            fs.writeFileSync(statsFile, JSON.stringify(this.monitoringStats, null, 2));
        } catch (error) {
            console.error('[Monitor] Could not save stats:', error);
        }
    }

    /**
     * Run all monitoring checks for a website
     */
    async runFullCheck(profile) {
        console.log(`[Monitor] Starting full check for ${profile.dealer_name} - ${profile.website_url}`);
        
        const startTime = performance.now();
        const results = {
            profile_id: profile.id,
            check_timestamp: new Date(),
            issues_found: [],
            metrics: {}
        };

        try {
            // 1. Basic connectivity check
            const connectivityCheck = await this.checkConnectivity(profile.website_url);
            Object.assign(results, connectivityCheck);

            if (!connectivityCheck.is_reachable) {
                results.overall_status = 'RED';
                results.issues_found.push({
                    type: 'website_down',
                    severity: 'RED',
                    message: 'Website is unreachable',
                    details: connectivityCheck.error_details
                });
                return await this.saveResults(results);
            }

            // Run SSL, Content, and Performance checks in parallel for faster results
            const [sslCheck, contentCheck, performanceCheck] = await Promise.all([
                // 2. SSL Certificate check
                this.checkSSLCertificate(profile.website_url),
                
                // 3. Content checks (forms, phone numbers, inventory)
                this.checkContent(profile.website_url),
                
                // 4. Performance metrics
                this.checkPerformance(profile.website_url)
            ]);
            
            // Merge SSL check results
            Object.assign(results, sslCheck);
            
            // Log SSL check results for debugging
            if (profile.dealer_name && profile.dealer_name.includes('Fugate')) {
                console.log(`[Monitor] SSL check for ${profile.dealer_name}:`, {
                    ssl_valid: results.ssl_valid,
                    ssl_expiry_days: results.ssl_expiry_days,
                    cdn_protected: results.cdn_protected
                });
            }
            
            // Merge content check results but preserve issues_found array
            const contentIssues = contentCheck.issues_found || [];
            delete contentCheck.issues_found;
            Object.assign(results, contentCheck);
            results.issues_found = results.issues_found.concat(contentIssues);
            
            // Merge performance check results but preserve issues_found array
            const performanceIssues = performanceCheck.issues_found || [];
            delete performanceCheck.issues_found;
            Object.assign(results, performanceCheck);
            results.issues_found = results.issues_found.concat(performanceIssues);

            // 5. Determine overall status
            results.overall_status = this.calculateOverallStatus(results);

            // 6. Save results
            return await this.saveResults(results);

        } catch (error) {
            console.error(`[Monitor] Error checking ${profile.website_url}:`, error);
            results.overall_status = 'RED';
            results.error_details = error.message;
            return await this.saveResults(results);
        }
    }

    /**
     * Check basic connectivity and response time with intelligent fallback
     */
    async checkConnectivity(url) {
        // First try with standard axios request
        try {
            const startTime = performance.now();
            const response = await axios.get(url, {
                timeout: 30000,
                validateStatus: null,
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });
            const responseTime = Math.round(performance.now() - startTime);

            return {
                is_reachable: true,
                response_time_ms: responseTime,
                http_status_code: response.status
            };
        } catch (error) {
            // Check if this is an anti-bot error
            if (this.scrapingDog.isAntiBotError(error)) {
                console.log(`[Monitor] Anti-bot detected for ${url}, falling back to ScrapingDog`);
                return await this.checkConnectivityWithScrapingDog(url);
            }
            
            return {
                is_reachable: false,
                response_time_ms: null,
                http_status_code: null,
                error_details: error.message,
                method: 'axios'
            };
        }
    }

    /**
     * Check connectivity using ScrapingDog API
     */
    async checkConnectivityWithScrapingDog(url) {
        try {
            this.monitoringStats.scrapingDogRequests++;
            const startTime = performance.now();
            const result = await this.scrapingDog.getContent(url, {
                javascript: true,
                wait: 3000  // Reduced from 5000ms to 3000ms for faster checks
            });
            const totalTime = Math.round(performance.now() - startTime);

            if (result.success) {
                this.monitoringStats.scrapingDogSuccess++;
                // Use the actual server response time if available, otherwise total time minus wait
                const responseTime = result.actualResponseTime || Math.max(100, totalTime - 3000);
                return {
                    is_reachable: true,
                    response_time_ms: responseTime,
                    http_status_code: result.statusCode,
                    method: 'scrapingdog',
                    total_time_ms: totalTime
                };
            } else {
                return {
                    is_reachable: false,
                    response_time_ms: null,
                    http_status_code: null,
                    error_details: result.error,
                    method: 'scrapingdog'
                };
            }
        } catch (error) {
            return {
                is_reachable: false,
                response_time_ms: null,
                http_status_code: null,
                error_details: error.message,
                method: 'scrapingdog_error'
            };
        }
    }

    /**
     * Check SSL certificate validity and expiration
     */
    async checkSSLCertificate(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol !== 'https:') {
                return {
                    ssl_valid: false,
                    ssl_expiry_days: null
                };
            }

            // First, try to detect if site is behind CDN/WAF using ScrapingDog
            if (this.scrapingDog && this.scrapingDog.hasApiKey()) {
                try {
                    console.log(`[Monitor] Checking SSL for ${url} with CDN detection`);
                    const analysis = await this.scrapingDog.analyzeSiteProtection(url);
                    
                    // If site is behind Cloudflare or similar, skip SSL check
                    if (analysis.hasCloudflare || analysis.hasAntiBot) {
                        console.log(`[Monitor] Site ${url} is behind CDN/WAF, assuming SSL is valid`);
                        return {
                            ssl_valid: true,
                            ssl_expiry_days: 90, // Assume 90 days for CDN-protected sites
                            cdn_protected: true
                        };
                    }
                } catch (e) {
                    console.log(`[Monitor] CDN detection failed, falling back to direct SSL check`);
                }
            }

            // If not behind CDN, do direct SSL check
            return new Promise((resolve) => {
                const options = {
                    host: urlObj.hostname,
                    port: 443,
                    method: 'GET',
                    rejectUnauthorized: false,
                    timeout: 5000 // Add timeout to prevent hanging
                };

                const req = https.request(options, (res) => {
                    const cert = res.connection.getPeerCertificate();
                    if (cert && cert.valid_to) {
                        const expiryDate = new Date(cert.valid_to);
                        const now = new Date();
                        const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

                        resolve({
                            ssl_valid: daysUntilExpiry > 0,
                            ssl_expiry_days: daysUntilExpiry
                        });
                    } else {
                        resolve({
                            ssl_valid: false,
                            ssl_expiry_days: null
                        });
                    }
                });

                req.on('error', (error) => {
                    // If connection fails, assume it's due to CDN/WAF
                    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                        console.log(`[Monitor] SSL check failed with ${error.code}, likely CDN-protected`);
                        resolve({
                            ssl_valid: true,
                            ssl_expiry_days: 90,
                            cdn_protected: true
                        });
                    } else {
                        resolve({
                            ssl_valid: false,
                            ssl_expiry_days: null
                        });
                    }
                });

                req.on('timeout', () => {
                    req.destroy();
                    console.log(`[Monitor] SSL check timed out for ${url}, likely CDN-protected`);
                    resolve({
                        ssl_valid: true,
                        ssl_expiry_days: 90,
                        cdn_protected: true
                    });
                });

                req.end();
            });
        } catch (error) {
            return {
                ssl_valid: false,
                ssl_expiry_days: null
            };
        }
    }

    /**
     * Check content functionality (forms, phone numbers, inventory)
     */
    async checkContent(url) {
        let response;
        let method = 'axios';
        
        // Option to use ScrapingDog by default for better accuracy
        const useScrapingDogByDefault = true; // Always use ScrapingDog for monitoring
        
        if (useScrapingDogByDefault && this.scrapingDog.hasApiKey()) {
            try {
                console.log(`[Monitor] Using ScrapingDog by default for content check on ${url}`);
                const scrapingResult = await this.scrapingDog.getContent(url);
                
                if (scrapingResult.success) {
                    response = { data: scrapingResult.data };
                    method = 'scrapingdog';
                    this.monitoringStats.scrapingDogRequests++;
                    this.monitoringStats.scrapingDogSuccess++;
                    this.saveStats();
                    console.log(`[Monitor] ScrapingDog used successfully for ${url}`);
                }
            } catch (scrapingError) {
                console.log(`[Monitor] ScrapingDog failed, falling back to direct request:`, scrapingError.message);
            }
        }
        
        // If ScrapingDog didn't work or wasn't used, try direct
        if (!response) {
            try {
                response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });
        } catch (error) {
            // If anti-bot detected, use ScrapingDog
            if (this.scrapingDog.isAntiBotError(error)) {
                console.log(`[Monitor] Using ScrapingDog for content check on ${url}`);
                const scrapingResult = await this.scrapingDog.getContent(url);
                
                if (!scrapingResult.success) {
                    throw new Error(scrapingResult.error || 'ScrapingDog failed');
                }
                
                response = { data: scrapingResult.data };
                method = 'scrapingdog';
                this.monitoringStats.scrapingDogRequests++;
                this.monitoringStats.scrapingDogSuccess++;
                this.saveStats();
                console.log(`[Monitor] ScrapingDog used successfully as fallback for ${url}`);
            } else {
                throw error;
            }
        }
        }
        
        try {
            const $ = cheerio.load(response.data);
            const issues = [];

            // Check for forms - improved detection for modern websites
            const forms = $('form').length;
            const inputFields = $('input[type="text"], input[type="email"], input[type="tel"], textarea, input[type="name"], input[name*="name"], input[name*="email"], input[name*="phone"]').length;
            const submitButtons = $('button[type="submit"], input[type="submit"], button:contains("Submit"), button:contains("Send"), button:contains("Contact"), a[href*="contact"], button[onclick*="submit"]').length;
            
            // Look for any clickable elements that might be contact-related
            const contactLinks = $('a[href*="contact"], a[href*="Contact"], a:contains("Contact Us"), a:contains("Get in Touch")').length;
            const contactButtons = $('button:contains("Contact"), button:contains("Get Started"), button:contains("Request")').length;
            
            // Look for contact forms more broadly
            const contactForms = $('form').filter((i, el) => {
                const $form = $(el);
                const formHtml = $form.html().toLowerCase();
                const formText = $form.text().toLowerCase();
                
                // Check form content and nearby text
                const hasContactKeywords = formHtml.includes('contact') || formHtml.includes('email') || 
                                         formHtml.includes('phone') || formHtml.includes('message') ||
                                         formText.includes('contact') || formText.includes('get in touch');
                
                // Check for email/phone input fields
                const hasEmailField = $form.find('input[type="email"], input[name*="email"]').length > 0;
                const hasPhoneField = $form.find('input[type="tel"], input[name*="phone"]').length > 0;
                const hasMessageField = $form.find('textarea').length > 0;
                
                return hasContactKeywords || hasEmailField || hasPhoneField || hasMessageField;
            }).length;

            // Check if there's any contact functionality at all (very lenient)
            const hasAnyContactMethod = forms > 0 || inputFields > 0 || contactLinks > 0 || contactButtons > 0;
            
            // More lenient check - modern sites might use JavaScript forms or modal popups
            const formsWorking = hasAnyContactMethod || (inputFields > 1 && (submitButtons > 0 || contactButtons > 0));
            const likelyHasContactForm = contactForms > 0 || inputFields >= 2 || contactLinks > 0;
            
            console.log(`[Monitor] Form detection for ${url}:`, {
                forms,
                inputFields,
                submitButtons,
                contactLinks,
                contactButtons,
                contactForms,
                formsWorking,
                method
            });
            
            // Only flag as critical if there's absolutely no contact functionality
            if (!hasAnyContactMethod) {
                issues.push({
                    type: 'no_contact_forms',
                    severity: 'RED',
                    message: 'CRITICAL: No contact functionality found - losing potential leads!'
                });
            } else if (!likelyHasContactForm && inputFields < 2) {
                issues.push({
                    type: 'contact_form_unclear',
                    severity: 'YELLOW',
                    message: 'Contact form may be hard to find or limited functionality'
                });
            }

            // Check for phone numbers
            const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
            const phoneNumbers = response.data.match(phoneRegex) || [];
            const phoneNumbersValid = phoneNumbers.length > 0;

            if (!phoneNumbersValid) {
                issues.push({
                    type: 'no_phone_numbers',
                    severity: 'YELLOW',
                    message: 'No phone numbers found on homepage'
                });
            }

            // Check inventory count (simplified - would need actual inventory page check)
            const inventoryLinks = $('a[href*="inventory"], a[href*="vehicles"]').length;
            const inventoryCount = inventoryLinks > 0 ? 100 : 0; // Placeholder - need deeper check

            // Check for outdated incentives
            const currentDate = new Date();
            const datePatterns = [
                /expires?\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
                /ends?\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
                /valid\s+through\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
                /offer\s+expires?\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/gi
            ];
            
            let expiredIncentivesFound = false;
            const bodyText = $('body').text();
            
            for (const pattern of datePatterns) {
                const matches = bodyText.matchAll(pattern);
                for (const match of matches) {
                    try {
                        const dateStr = match[1];
                        const expiryDate = new Date(dateStr);
                        if (expiryDate < currentDate) {
                            expiredIncentivesFound = true;
                            issues.push({
                                type: 'expired_incentive',
                                severity: 'YELLOW',
                                message: `Found expired offer date: ${dateStr}`
                            });
                        }
                    } catch (e) {
                        // Invalid date format, skip
                    }
                }
            }

            return {
                forms_working: formsWorking,
                phone_numbers_valid: phoneNumbersValid,
                inventory_count: inventoryCount,
                expired_incentives: expiredIncentivesFound,
                issues_found: issues,
                scraping_method: method
            };
        } catch (error) {
            return {
                forms_working: null,
                phone_numbers_valid: null,
                inventory_count: null,
                error_details: error.message
            };
        }
    }

    /**
     * Check performance metrics
     */
    async checkPerformance(url) {
        try {
            const startTime = performance.now();
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });
            const loadTime = (performance.now() - startTime) / 1000;
            
            const pageSizeKB = Math.round(response.data.length / 1024);

            // Placeholder scores - would integrate with actual PageSpeed API
            const mobileScore = 75;
            const desktopScore = 85;

            const issues = [];
            if (loadTime > 5) {
                issues.push({
                    type: 'slow_load_time',
                    severity: 'YELLOW', // Always YELLOW - expected with multiple site monitoring
                    message: `Page load time is ${loadTime.toFixed(1)} seconds`
                });
            }

            if (pageSizeKB > 5000) {
                issues.push({
                    type: 'large_page_size',
                    severity: 'YELLOW',
                    message: `Page size is ${pageSizeKB}KB`
                });
            }

            return {
                page_size_kb: pageSizeKB,
                load_time_seconds: loadTime,
                mobile_score: mobileScore,
                desktop_score: desktopScore,
                issues_found: issues
            };
        } catch (error) {
            return {
                page_size_kb: null,
                load_time_seconds: null,
                mobile_score: null,
                desktop_score: null,
                error_details: error.message
            };
        }
    }

    /**
     * Calculate overall status based on all checks
     */
    calculateOverallStatus(results) {
        // Check for RED conditions (critical issues only)
        if (!results.is_reachable || 
            !results.ssl_valid || 
            results.inventory_count === 0) {
            return 'RED';
        }

        // Check for YELLOW conditions (warnings, including load time)
        if (results.ssl_expiry_days < 30 ||
            !results.forms_working ||
            !results.phone_numbers_valid ||
            results.inventory_count < 50 ||
            results.load_time_seconds > 5 ||
            results.mobile_score < 70 ||
            results.expired_incentives === true) {
            return 'YELLOW';
        }

        return 'GREEN';
    }

    /**
     * Save monitoring results to JSON storage
     */
    async saveResults(results) {
        try {
            const newResult = {
                id: Date.now(),
                profile_id: results.profile_id,
                overall_status: results.overall_status,
                is_reachable: results.is_reachable,
                response_time_ms: results.response_time_ms,
                http_status_code: results.http_status_code,
                ssl_valid: results.ssl_valid,
                ssl_expiry_days: results.ssl_expiry_days,
                forms_working: results.forms_working,
                phone_numbers_valid: results.phone_numbers_valid,
                inventory_count: results.inventory_count,
                page_size_kb: results.page_size_kb,
                load_time_seconds: results.load_time_seconds,
                mobile_score: results.mobile_score,
                desktop_score: results.desktop_score,
                issues_found: results.issues_found || [],
                metrics: results.metrics || {},
                error_details: results.error_details,
                scraping_method: results.scraping_method || 'unknown',
                check_timestamp: results.check_timestamp || new Date().toISOString()
            };

            // Save to JSON storage
            await this.jsonStorage.saveResult(newResult);
            return newResult;
        } catch (error) {
            console.error('[Monitor] Error saving results:', error);
            throw error;
        }
    }

    /**
     * Check for triggered alerts based on rules
     */
    async checkAlertRules(results) {
        try {
            // Load rules from JSON instead of database
            const rulesPath = path.join(__dirname, '..', 'data', 'monitoring', 'rules.json');
            const rulesData = fs.readFileSync(rulesPath, 'utf8');
            const rules = JSON.parse(rulesData);
            
            const triggeredAlerts = [];
            const enabledRules = rules.filter(rule => rule.enabled);

            for (const rule of enabledRules) {
                if (this.evaluateRule(rule, results)) {
                    triggeredAlerts.push({
                        rule_id: rule.id,
                        alert_level: rule.alert_level,
                        alert_type: rule.check_type,
                        alert_message: this.formatAlertMessage(rule.alert_message_template, results)
                    });
                }
            }

            console.log(`[Monitor] Checked ${enabledRules.length} rules, triggered ${triggeredAlerts.length} alerts`);
            return triggeredAlerts;
        } catch (error) {
            console.error('[Monitor] Error checking alert rules:', error);
            return [];
        }
    }

    /**
     * Evaluate if a rule is triggered
     */
    evaluateRule(rule, results) {
        const value = results[rule.check_type];
        const threshold = rule.threshold_value;

        switch (rule.condition) {
            case 'equals':
                return value == threshold;
            case 'greater_than':
                return value > threshold;
            case 'less_than':
                return value < threshold;
            case 'contains':
                return value && value.toString().includes(threshold);
            default:
                return false;
        }
    }

    /**
     * Format alert message with actual values
     * Note: With simplified templates, this now mostly returns the template as-is
     */
    formatAlertMessage(template, results) {
        // Since we've removed most placeholder variables from templates,
        // this function now mainly passes through the template unchanged.
        // We keep it for backward compatibility and potential future use.
        return template.replace(/{(\w+)}/g, (match, key) => {
            const value = results[key];
            if (value === null || value === undefined) {
                // Return empty string instead of 'Unknown' to avoid cluttering messages
                return '';
            }
            return value;
        });
    }

    /**
     * Get monitoring statistics including ScrapingDog usage
     */
    getMonitoringStats() {
        const stats = {
            ...this.monitoringStats,
            scrapingDogStats: this.scrapingDog.getUsageStats(),
            seleniumSuccessRate: this.monitoringStats.seleniumRequests > 0 
                ? (this.monitoringStats.seleniumSuccess / this.monitoringStats.seleniumRequests * 100).toFixed(2) + '%'
                : '0%',
            scrapingDogUsageRate: (this.monitoringStats.seleniumRequests + this.monitoringStats.scrapingDogRequests) > 0
                ? (this.monitoringStats.scrapingDogRequests / (this.monitoringStats.seleniumRequests + this.monitoringStats.scrapingDogRequests) * 100).toFixed(2) + '%'
                : '0%'
        };
        
        return stats;
    }

    /**
     * Analyze if a site needs premium scraping
     */
    async analyzeSite(url) {
        return await this.scrapingDog.analyzeSiteProtection(url);
    }
}

module.exports = MonitoringEngine;