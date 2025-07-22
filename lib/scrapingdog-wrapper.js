/**
 * ScrapingDog API Wrapper
 * Handles intelligent routing to ScrapingDog for anti-bot bypass
 */

// Ensure environment variables are loaded
require('dotenv').config();

const axios = require('axios');
const { performance } = require('perf_hooks');

class ScrapingDogWrapper {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.SCRAPINGDOG_API_KEY;
        this.baseUrl = 'https://api.scrapingdog.com/scrape';
        this.usageStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalCost: 0,
            savedBySelenium: 0
        };
        
        // Debug logging
        console.log('[ScrapingDog] Initializing with API key:', this.apiKey ? 'SET (' + this.apiKey.substring(0,6) + '...)' : 'NOT SET');
        console.log('[ScrapingDog] Environment SCRAPINGDOG_API_KEY:', process.env.SCRAPINGDOG_API_KEY ? 'EXISTS' : 'NOT FOUND');
    }
    
    /**
     * Check if API key is configured
     */
    hasApiKey() {
        return !!this.apiKey;
    }

    /**
     * Check if a site likely has anti-bot protection based on error patterns
     */
    isAntiBotError(error) {
        if (!error) return false;
        
        const errorString = error.toString().toLowerCase();
        const antiBotPatterns = [
            'blocked',
            'captcha',
            'cloudflare',
            'challenge',
            'access denied',
            'forbidden',
            'rate limit',
            'bot detected',
            'security check',
            'please verify',
            'unusual traffic',
            'automated'
        ];
        
        return antiBotPatterns.some(pattern => errorString.includes(pattern));
    }

    /**
     * Analyze site to determine if it needs premium scraping
     */
    async analyzeSiteProtection(url) {
        try {
            // Quick test with basic request
            const startTime = performance.now();
            const response = await axios.get(url, {
                timeout: 5000,
                validateStatus: null,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const responseTime = performance.now() - startTime;

            // Check for common anti-bot indicators
            const indicators = {
                cloudflare: response.headers['cf-ray'] !== undefined,
                captcha: response.data.toLowerCase().includes('captcha'),
                jsChallenge: response.data.includes('challenge-form'),
                blocked: response.status === 403 || response.status === 429,
                suspicious: responseTime > 10000 // Very slow response might indicate challenge
            };

            const protectionLevel = Object.values(indicators).filter(Boolean).length;

            return {
                needsPremium: protectionLevel > 0,
                protectionLevel: protectionLevel === 0 ? 'none' : protectionLevel === 1 ? 'basic' : 'advanced',
                indicators,
                recommendation: protectionLevel > 1 ? 'scrapingdog' : 'selenium'
            };
        } catch (error) {
            // If basic request fails, likely needs premium
            return {
                needsPremium: true,
                protectionLevel: 'advanced',
                indicators: { error: error.message },
                recommendation: 'scrapingdog'
            };
        }
    }

    /**
     * Scrape URL using ScrapingDog API
     */
    async scrape(url, options = {}) {
        if (!this.apiKey) {
            throw new Error('ScrapingDog API key not configured');
        }

        const startTime = performance.now();
        
        try {
            // Build API parameters
            const params = {
                api_key: this.apiKey,
                url: url,
                dynamic: options.javascript !== false, // Enable JS rendering by default
                premium: options.premium || false, // Use premium proxies for tough sites
                country: options.country || 'us',
                wait: options.wait || 5000, // Wait for page to load
                ...options.additionalParams
            };

            // Add screenshot if requested
            if (options.screenshot) {
                params.screenshot = true;
            }

            console.log(`[ScrapingDog] Fetching ${url} with params:`, {
                ...params,
                api_key: '***' // Hide API key in logs
            });

            const response = await axios.get(this.baseUrl, {
                params,
                timeout: options.timeout || 60000,
                validateStatus: null
            });

            const responseTime = performance.now() - startTime;

            // Update usage statistics
            this.usageStats.totalRequests++;
            
            if (response.status === 200) {
                this.usageStats.successfulRequests++;
                // Estimate cost (adjust based on your plan)
                const costPerRequest = options.premium ? 0.002 : 0.001;
                this.usageStats.totalCost += costPerRequest;

                console.log(`[ScrapingDog] Success: ${url} in ${responseTime.toFixed(0)}ms`);

                return {
                    success: true,
                    data: response.data,
                    statusCode: 200,
                    responseTime,
                    headers: response.headers,
                    method: 'scrapingdog',
                    cost: costPerRequest
                };
            } else {
                this.usageStats.failedRequests++;
                console.error(`[ScrapingDog] Failed: ${url} - Status ${response.status}`);
                
                return {
                    success: false,
                    error: `ScrapingDog returned status ${response.status}`,
                    statusCode: response.status,
                    responseTime,
                    method: 'scrapingdog'
                };
            }
        } catch (error) {
            this.usageStats.failedRequests++;
            console.error(`[ScrapingDog] Error: ${url}`, error.message);
            
            return {
                success: false,
                error: error.message,
                responseTime: performance.now() - startTime,
                method: 'scrapingdog'
            };
        }
    }

    /**
     * Get comprehensive content using ScrapingDog with retries
     */
    async getContent(url, options = {}) {
        // First attempt with standard settings
        let result = await this.scrape(url, {
            javascript: true,
            wait: 5000,
            ...options
        });

        // If failed, retry with premium proxies
        if (!result.success && options.retry !== false) {
            console.log(`[ScrapingDog] Retrying with premium proxies for ${url}`);
            result = await this.scrape(url, {
                javascript: true,
                premium: true,
                wait: 10000,
                ...options
            });
        }

        return result;
    }

    /**
     * Take screenshot of a page
     */
    async takeScreenshot(url, options = {}) {
        return await this.scrape(url, {
            screenshot: true,
            javascript: true,
            wait: options.wait || 5000,
            ...options
        });
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            ...this.usageStats,
            successRate: this.usageStats.totalRequests > 0 
                ? (this.usageStats.successfulRequests / this.usageStats.totalRequests * 100).toFixed(2) + '%'
                : '0%',
            averageCost: this.usageStats.totalRequests > 0
                ? '$' + (this.usageStats.totalCost / this.usageStats.totalRequests).toFixed(4)
                : '$0'
        };
    }

    /**
     * Reset usage statistics
     */
    resetStats() {
        this.usageStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalCost: 0,
            savedBySelenium: 0
        };
    }

    /**
     * Check remaining credits (would need actual API endpoint)
     */
    async checkCredits() {
        try {
            // ScrapingDog doesn't have a public credits endpoint, 
            // so this is a placeholder for future implementation
            return {
                credits: 'Check dashboard',
                plan: 'Unknown'
            };
        } catch (error) {
            console.error('[ScrapingDog] Error checking credits:', error);
            return null;
        }
    }
}

module.exports = ScrapingDogWrapper;