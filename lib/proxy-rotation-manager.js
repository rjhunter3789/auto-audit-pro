/**
 * Proxy Rotation Manager
 * Manages proxy rotation for bypassing IP-based blocking
 */

const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

class ProxyRotationManager {
    constructor() {
        this.proxies = [];
        this.currentIndex = 0;
        this.failedProxies = new Set();
        this.successRates = new Map();
        
        // Load proxies from environment or config
        this.loadProxies();
    }
    
    /**
     * Load proxy configuration
     */
    loadProxies() {
        // Free proxy sources (for testing - paid proxies recommended for production)
        this.proxyProviders = {
            // Format: { host, port, auth: { username, password } }
            residential: process.env.RESIDENTIAL_PROXIES ? JSON.parse(process.env.RESIDENTIAL_PROXIES) : [],
            datacenter: process.env.DATACENTER_PROXIES ? JSON.parse(process.env.DATACENTER_PROXIES) : [],
            rotating: process.env.ROTATING_PROXY_ENDPOINT || null
        };
        
        // Default free proxies for testing (unreliable, for demo only)
        if (this.proxies.length === 0 && !this.proxyProviders.rotating) {
            this.proxies = [
                { type: 'direct', host: null }, // Direct connection as fallback
            ];
        }
    }
    
    /**
     * Get next available proxy
     */
    getNextProxy() {
        // If we have a rotating proxy endpoint, always use it
        if (this.proxyProviders.rotating) {
            return {
                type: 'rotating',
                url: this.proxyProviders.rotating
            };
        }
        
        // Otherwise rotate through proxy list
        let attempts = 0;
        while (attempts < this.proxies.length) {
            const proxy = this.proxies[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
            
            // Skip failed proxies
            if (!this.failedProxies.has(this.getProxyKey(proxy))) {
                return proxy;
            }
            
            attempts++;
        }
        
        // All proxies failed, reset and try again
        this.failedProxies.clear();
        return this.proxies[0];
    }
    
    /**
     * Create axios instance with proxy
     */
    createProxyAgent(proxy) {
        if (!proxy || proxy.type === 'direct') {
            return null;
        }
        
        if (proxy.type === 'rotating') {
            // For rotating proxy services
            return new HttpsProxyAgent(proxy.url);
        }
        
        // Standard proxy format
        const proxyUrl = proxy.auth 
            ? `http://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`
            : `http://${proxy.host}:${proxy.port}`;
            
        return new HttpsProxyAgent(proxyUrl);
    }
    
    /**
     * Make request with automatic proxy rotation
     */
    async makeRequest(url, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const proxy = this.getNextProxy();
            const agent = this.createProxyAgent(proxy);
            
            try {
                const requestOptions = {
                    ...options,
                    timeout: options.timeout || 10000,
                    validateStatus: null,
                    headers: {
                        'User-Agent': this.getRandomUserAgent(),
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Cache-Control': 'max-age=0',
                        ...options.headers
                    }
                };
                
                if (agent) {
                    requestOptions.httpsAgent = agent;
                    requestOptions.httpAgent = agent;
                }
                
                console.log(`[ProxyManager] Attempting request to ${url} using ${proxy.type} proxy`);
                const response = await axios.get(url, requestOptions);
                
                // Check if response indicates blocking
                if (this.isBlockedResponse(response)) {
                    throw new Error('Blocked response detected');
                }
                
                // Record success
                this.recordProxySuccess(proxy);
                
                return response;
                
            } catch (error) {
                lastError = error;
                console.error(`[ProxyManager] Request failed with ${proxy.type} proxy:`, error.message);
                
                // Mark proxy as failed
                this.recordProxyFailure(proxy);
                
                // Wait before retry with exponential backoff
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
        
        throw lastError || new Error('All proxy attempts failed');
    }
    
    /**
     * Check if response indicates blocking
     */
    isBlockedResponse(response) {
        if (!response || !response.data) return true;
        
        const indicators = [
            response.status === 403,
            response.status === 429,
            response.data.toLowerCase().includes('access denied'),
            response.data.toLowerCase().includes('blocked'),
            response.data.toLowerCase().includes('captcha'),
            response.data.toLowerCase().includes('cloudflare'),
            response.data.includes('challenge-form')
        ];
        
        return indicators.some(indicator => indicator);
    }
    
    /**
     * Get random user agent
     */
    getRandomUserAgent() {
        const userAgents = [
            // Chrome on Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            
            // Chrome on Mac
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            
            // Firefox
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
            
            // Edge
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        ];
        
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }
    
    /**
     * Get proxy identifier
     */
    getProxyKey(proxy) {
        if (!proxy) return 'direct';
        if (proxy.type === 'rotating') return 'rotating';
        return `${proxy.host}:${proxy.port}`;
    }
    
    /**
     * Record proxy success
     */
    recordProxySuccess(proxy) {
        const key = this.getProxyKey(proxy);
        const stats = this.successRates.get(key) || { success: 0, total: 0 };
        stats.success++;
        stats.total++;
        this.successRates.set(key, stats);
    }
    
    /**
     * Record proxy failure
     */
    recordProxyFailure(proxy) {
        const key = this.getProxyKey(proxy);
        const stats = this.successRates.get(key) || { success: 0, total: 0 };
        stats.total++;
        this.successRates.set(key, stats);
        
        // Mark as failed if success rate is too low
        if (stats.total > 5 && (stats.success / stats.total) < 0.2) {
            this.failedProxies.add(key);
        }
    }
    
    /**
     * Get proxy statistics
     */
    getProxyStats() {
        const stats = [];
        for (const [key, data] of this.successRates.entries()) {
            stats.push({
                proxy: key,
                successRate: data.total > 0 ? (data.success / data.total * 100).toFixed(2) + '%' : '0%',
                attempts: data.total,
                status: this.failedProxies.has(key) ? 'failed' : 'active'
            });
        }
        return stats;
    }
    
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Add custom proxy
     */
    addProxy(proxy) {
        this.proxies.push(proxy);
    }
    
    /**
     * Reset failed proxies
     */
    resetFailedProxies() {
        this.failedProxies.clear();
    }
}

module.exports = ProxyRotationManager;