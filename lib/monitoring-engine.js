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

class MonitoringEngine {
    constructor(dbPool) {
        this.dbPool = dbPool;
        this.seleniumWrapper = require('./selenium-wrapper');
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
     * Check basic connectivity and response time
     */
    async checkConnectivity(url) {
        try {
            const startTime = performance.now();
            const response = await axios.get(url, {
                timeout: 30000,
                validateStatus: null,
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const responseTime = Math.round(performance.now() - startTime);

            return {
                is_reachable: true,
                response_time_ms: responseTime,
                http_status_code: response.status
            };
        } catch (error) {
            return {
                is_reachable: false,
                response_time_ms: null,
                http_status_code: null,
                error_details: error.message
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
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
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

            return {
                forms_working: formsWorking,
                phone_numbers_valid: phoneNumbersValid,
                inventory_count: inventoryCount,
                issues_found: issues
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
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
            const rulesQuery = 'SELECT * FROM alert_rules WHERE enabled = true';
            const rulesResult = await this.dbPool.query(rulesQuery);
            const triggeredAlerts = [];

            for (const rule of rulesResult.rows) {
                if (this.evaluateRule(rule, results)) {
                    triggeredAlerts.push({
                        rule_id: rule.id,
                        alert_level: rule.alert_level,
                        alert_type: rule.check_type,
                        alert_message: this.formatAlertMessage(rule.alert_message_template, results)
                    });
                }
            }

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
     */
    formatAlertMessage(template, results) {
        return template.replace(/{(\w+)}/g, (match, key) => {
            const value = results[key];
            if (value === null || value === undefined) {
                return 'Unknown';
            }
            return value;
        });
    }
}

module.exports = MonitoringEngine;