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

class MonitoringEngine {
    constructor(dbPool) {
        this.dbPool = dbPool;
        this.seleniumWrapper = require('./selenium-wrapper');
        this.scrapingDog = new ScrapingDogWrapper();
        this.monitoringStats = {
            seleniumRequests: 0,
            scrapingDogRequests: 0,
            seleniumSuccess: 0,
            scrapingDogSuccess: 0
        };
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

            // 2. SSL Certificate check
            const sslCheck = await this.checkSSLCertificate(profile.website_url);
            Object.assign(results, sslCheck);

            // 3. Content checks (forms, phone numbers, inventory)
            const contentCheck = await this.checkContent(profile.website_url);
            Object.assign(results, contentCheck);

            // 4. Performance metrics
            const performanceCheck = await this.checkPerformance(profile.website_url);
            Object.assign(results, performanceCheck);

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
            const result = await this.scrapingDog.getContent(url, {
                javascript: true,
                wait: 5000
            });

            if (result.success) {
                this.monitoringStats.scrapingDogSuccess++;
                return {
                    is_reachable: true,
                    response_time_ms: Math.round(result.responseTime),
                    http_status_code: result.statusCode,
                    method: 'scrapingdog'
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

            return new Promise((resolve) => {
                const options = {
                    host: urlObj.hostname,
                    port: 443,
                    method: 'GET',
                    rejectUnauthorized: false
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

                req.on('error', () => {
                    resolve({
                        ssl_valid: false,
                        ssl_expiry_days: null
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
            } else {
                throw error;
            }
        }
        
        try {
            const $ = cheerio.load(response.data);
            const issues = [];

            // Check for forms
            const forms = $('form').length;
            const contactForms = $('form').filter((i, el) => {
                const formHtml = $(el).html().toLowerCase();
                return formHtml.includes('contact') || formHtml.includes('email') || formHtml.includes('phone');
            }).length;

            const formsWorking = forms > 0 && contactForms > 0;
            if (!formsWorking) {
                issues.push({
                    type: 'no_contact_forms',
                    severity: 'YELLOW',
                    message: 'No contact forms found on homepage'
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
                    severity: loadTime > 10 ? 'RED' : 'YELLOW',
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
        // Check for RED conditions
        if (!results.is_reachable || 
            !results.ssl_valid || 
            results.inventory_count === 0 ||
            results.load_time_seconds > 10) {
            return 'RED';
        }

        // Check for YELLOW conditions
        if (results.ssl_expiry_days < 30 ||
            !results.forms_working ||
            !results.phone_numbers_valid ||
            results.inventory_count < 50 ||
            results.load_time_seconds > 5 ||
            results.mobile_score < 70) {
            return 'YELLOW';
        }

        return 'GREEN';
    }

    /**
     * Save monitoring results to database
     */
    async saveResults(results) {
        try {
            const query = `
                INSERT INTO monitoring_results 
                (profile_id, overall_status, is_reachable, response_time_ms, 
                 http_status_code, ssl_valid, ssl_expiry_days, forms_working,
                 phone_numbers_valid, inventory_count, page_size_kb, 
                 load_time_seconds, mobile_score, desktop_score, 
                 issues_found, metrics, error_details)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *`;

            const values = [
                results.profile_id,
                results.overall_status,
                results.is_reachable,
                results.response_time_ms,
                results.http_status_code,
                results.ssl_valid,
                results.ssl_expiry_days,
                results.forms_working,
                results.phone_numbers_valid,
                results.inventory_count,
                results.page_size_kb,
                results.load_time_seconds,
                results.mobile_score,
                results.desktop_score,
                JSON.stringify(results.issues_found || []),
                JSON.stringify(results.metrics || {}),
                results.error_details
            ];

            const result = await this.dbPool.query(query, values);
            return result.rows[0];
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