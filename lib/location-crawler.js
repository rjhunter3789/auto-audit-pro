/*
 * Auto Audit Pro - Location Crawler Module
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Advanced web crawling for comprehensive dealer location discovery
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

// Known dealer group patterns
const DEALER_GROUP_PATTERNS = {
    'autonation.com': {
        locatorUrl: '/locations',
        apiEndpoint: '/api/dealer/locator',
        sitemapPattern: '/sitemap-stores.xml'
    },
    'lithia.com': {
        locatorUrl: '/locations',
        apiEndpoint: null,
        sitemapPattern: '/sitemap.xml'
    },
    'kengarff.com': {
        locatorUrl: '/dealerships',
        apiEndpoint: null,
        sitemapPattern: '/sitemap.xml'
    },
    'group1auto.com': {
        locatorUrl: '/locations',
        apiEndpoint: null,
        sitemapPattern: '/sitemap.xml'
    },
    'penskeautomotive.com': {
        locatorUrl: '/locations',
        apiEndpoint: null,
        sitemapPattern: '/sitemap.xml'
    },
    'asburyauto.com': {
        locatorUrl: '/locations',
        apiEndpoint: null,
        sitemapPattern: '/sitemap.xml'
    }
};

class LocationCrawler {
    constructor(baseUrl, driver = null) {
        this.baseUrl = baseUrl;
        this.driver = driver;
        this.visitedUrls = new Set();
        this.foundLocations = new Map();
        this.maxDepth = 3;
        this.maxPages = 100; // Limit to prevent infinite crawling
    }

    async crawlForLocations() {
        console.log(`[LocationCrawler] Starting comprehensive location discovery for ${this.baseUrl}`);
        
        const results = {
            locations: [],
            method: 'none',
            totalFound: 0
        };

        try {
            // Method 1: Try sitemap first (most reliable)
            const sitemapLocations = await this.crawlSitemap();
            if (sitemapLocations.length > 50) {
                console.log(`[LocationCrawler] Found ${sitemapLocations.length} locations via sitemap`);
                results.locations = sitemapLocations;
                results.method = 'sitemap';
                results.totalFound = sitemapLocations.length;
                return results;
            }

            // Method 2: Try known location pages
            const knownPageLocations = await this.crawlKnownLocationPages();
            if (knownPageLocations.length > results.locations.length) {
                results.locations = knownPageLocations;
                results.method = 'known_pages';
                results.totalFound = knownPageLocations.length;
            }

            // Method 3: Try API endpoints
            const apiLocations = await this.crawlApiEndpoints();
            if (apiLocations.length > results.locations.length) {
                results.locations = apiLocations;
                results.method = 'api';
                results.totalFound = apiLocations.length;
            }

            // Method 4: Deep crawl if we still don't have enough
            if (results.locations.length < 50) {
                const deepCrawlLocations = await this.deepCrawl();
                if (deepCrawlLocations.length > results.locations.length) {
                    results.locations = deepCrawlLocations;
                    results.method = 'deep_crawl';
                    results.totalFound = deepCrawlLocations.length;
                }
            }

            // Method 5: Use Selenium for JavaScript-rendered content
            if (this.driver && results.locations.length < 50) {
                const seleniumLocations = await this.crawlWithSelenium();
                if (seleniumLocations.length > results.locations.length) {
                    results.locations = seleniumLocations;
                    results.method = 'selenium';
                    results.totalFound = seleniumLocations.length;
                }
            }

        } catch (error) {
            console.error('[LocationCrawler] Error during crawl:', error.message);
        }

        console.log(`[LocationCrawler] Final result: ${results.totalFound} locations found via ${results.method}`);
        return results;
    }

    async crawlSitemap() {
        const locations = [];
        const sitemapUrls = [
            '/sitemap.xml',
            '/sitemap-index.xml',
            '/sitemap-stores.xml',
            '/sitemap-locations.xml',
            '/sitemap-dealers.xml',
            '/sitemap_index.xml'
        ];

        for (const sitemapPath of sitemapUrls) {
            try {
                const sitemapUrl = new URL(sitemapPath, this.baseUrl).href;
                const response = await axios.get(sitemapUrl, { timeout: 10000 });
                
                if (response.status === 200) {
                    const $ = cheerio.load(response.data, { xmlMode: true });
                    
                    // Check for sitemap index
                    const sitemapRefs = $('sitemap loc').map((i, el) => $(el).text()).get();
                    if (sitemapRefs.length > 0) {
                        // This is a sitemap index, crawl each referenced sitemap
                        for (const ref of sitemapRefs) {
                            if (ref.includes('store') || ref.includes('location') || ref.includes('dealer')) {
                                const subResponse = await axios.get(ref, { timeout: 10000 });
                                const sub$ = cheerio.load(subResponse.data, { xmlMode: true });
                                const urls = sub$('url loc').map((i, el) => $(el).text()).get();
                                locations.push(...this.filterLocationUrls(urls));
                            }
                        }
                    } else {
                        // Regular sitemap
                        const urls = $('url loc').map((i, el) => $(el).text()).get();
                        locations.push(...this.filterLocationUrls(urls));
                    }
                }
            } catch (error) {
                // Sitemap not found or error, continue to next
            }
        }

        return this.deduplicateLocations(locations);
    }

    async crawlKnownLocationPages() {
        const locations = [];
        const locationPaths = [
            '/locations',
            '/dealerships',
            '/dealers',
            '/stores',
            '/our-locations',
            '/find-a-dealer',
            '/find-a-store',
            '/dealer-locator',
            '/store-locator',
            '/all-locations',
            '/location-directory'
        ];

        for (const path of locationPaths) {
            try {
                const url = new URL(path, this.baseUrl).href;
                const response = await axios.get(url, { 
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.status === 200) {
                    const $ = cheerio.load(response.data);
                    
                    // Look for location links
                    const links = [];
                    $('a').each((i, elem) => {
                        const href = $(elem).attr('href');
                        const text = $(elem).text().trim();
                        if (href && this.isLocationUrl(href, text)) {
                            links.push(this.normalizeUrl(href));
                        }
                    });
                    
                    locations.push(...links);
                    
                    // Check for pagination
                    const paginationLinks = this.findPaginationLinks($);
                    for (const pageUrl of paginationLinks.slice(0, 10)) { // Limit pages
                        const pageLocations = await this.crawlPage(pageUrl);
                        locations.push(...pageLocations);
                    }
                }
            } catch (error) {
                // Page not found or error, continue
            }
        }

        return this.deduplicateLocations(locations);
    }

    async crawlApiEndpoints() {
        const locations = [];
        const apiPaths = [
            '/api/dealers',
            '/api/locations',
            '/api/stores',
            '/api/dealer/locator',
            '/api/v1/dealers',
            '/api/v1/locations',
            '/api/v2/dealers',
            '/ajax/dealers',
            '/ajax/locations'
        ];

        for (const path of apiPaths) {
            try {
                const url = new URL(path, this.baseUrl).href;
                const response = await axios.get(url, { 
                    timeout: 10000,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                
                if (response.status === 200 && response.data) {
                    const data = response.data;
                    
                    // Try to extract location URLs from JSON response
                    const urls = this.extractUrlsFromJson(data);
                    locations.push(...urls);
                }
            } catch (error) {
                // API not found or error, continue
            }
        }

        return this.deduplicateLocations(locations);
    }

    async deepCrawl() {
        const locations = [];
        const queue = [this.baseUrl];
        let pagesVisited = 0;

        while (queue.length > 0 && pagesVisited < this.maxPages) {
            const currentUrl = queue.shift();
            
            if (this.visitedUrls.has(currentUrl)) continue;
            this.visitedUrls.add(currentUrl);
            
            try {
                const response = await axios.get(currentUrl, { 
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.status === 200) {
                    const $ = cheerio.load(response.data);
                    
                    // Extract all links
                    $('a').each((i, elem) => {
                        const href = $(elem).attr('href');
                        const text = $(elem).text().trim();
                        
                        if (href) {
                            const normalizedUrl = this.normalizeUrl(href);
                            
                            // If it looks like a location, add it
                            if (this.isLocationUrl(href, text)) {
                                locations.push(normalizedUrl);
                            }
                            
                            // If it might lead to locations, add to queue
                            if (this.shouldCrawlUrl(normalizedUrl) && !this.visitedUrls.has(normalizedUrl)) {
                                queue.push(normalizedUrl);
                            }
                        }
                    });
                    
                    pagesVisited++;
                }
            } catch (error) {
                // Error crawling page, continue
            }
        }

        return this.deduplicateLocations(locations);
    }

    async crawlWithSelenium() {
        if (!this.driver) return [];
        
        const locations = [];
        
        try {
            // Navigate to locations page
            const locationPaths = ['/locations', '/dealerships', '/stores', '/our-locations'];
            
            for (const path of locationPaths) {
                try {
                    const url = new URL(path, this.baseUrl).href;
                    await this.driver.get(url);
                    await this.driver.sleep(2000); // Wait for JavaScript to load
                    
                    // Execute JavaScript to find all location links
                    const links = await this.driver.executeScript(() => {
                        const results = [];
                        const anchors = document.querySelectorAll('a');
                        
                        anchors.forEach(a => {
                            const href = a.href;
                            const text = a.textContent.trim();
                            
                            // Look for dealer/location patterns
                            if (href && (
                                href.includes('/dealer') ||
                                href.includes('/location') ||
                                href.includes('/store') ||
                                text.match(/^[A-Z][\w\s&'-]*(Ford|Chevrolet|Toyota|Honda|Nissan|Chrysler|Jeep|GMC|Hyundai|Kia|Mazda|Subaru|Volkswagen|Audi|BMW|Mercedes)/i)
                            )) {
                                results.push({
                                    url: href,
                                    text: text
                                });
                            }
                        });
                        
                        return results;
                    });
                    
                    for (const link of links) {
                        if (this.isLocationUrl(link.url, link.text)) {
                            locations.push(link.url);
                        }
                    }
                    
                    // Check for load more buttons
                    const hasLoadMore = await this.driver.executeScript(() => {
                        const buttons = Array.from(document.querySelectorAll('button, a'));
                        return buttons.some(btn => 
                            btn.textContent.toLowerCase().includes('load more') ||
                            btn.textContent.toLowerCase().includes('show more') ||
                            btn.textContent.toLowerCase().includes('view all')
                        );
                    });
                    
                    if (hasLoadMore) {
                        // Click load more buttons
                        await this.driver.executeScript(() => {
                            const buttons = Array.from(document.querySelectorAll('button, a'));
                            const loadMoreBtn = buttons.find(btn => 
                                btn.textContent.toLowerCase().includes('load more') ||
                                btn.textContent.toLowerCase().includes('show more') ||
                                btn.textContent.toLowerCase().includes('view all')
                            );
                            if (loadMoreBtn) loadMoreBtn.click();
                        });
                        
                        await this.driver.sleep(2000);
                        
                        // Get locations again after loading more
                        const moreLinks = await this.driver.executeScript(() => {
                            return Array.from(document.querySelectorAll('a'))
                                .filter(a => a.href && (
                                    a.href.includes('/dealer') ||
                                    a.href.includes('/location') ||
                                    a.href.includes('/store')
                                ))
                                .map(a => ({ url: a.href, text: a.textContent.trim() }));
                        });
                        
                        for (const link of moreLinks) {
                            if (this.isLocationUrl(link.url, link.text)) {
                                locations.push(link.url);
                            }
                        }
                    }
                    
                } catch (error) {
                    // Error with this path, try next
                }
            }
        } catch (error) {
            console.error('[LocationCrawler] Selenium error:', error.message);
        }

        return this.deduplicateLocations(locations);
    }

    isLocationUrl(url, text = '') {
        const urlLower = url.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Skip non-location URLs
        if (urlLower.includes('careers') || urlLower.includes('about') || 
            urlLower.includes('contact') || urlLower.includes('privacy') ||
            urlLower.includes('terms') || urlLower.includes('blog')) {
            return false;
        }
        
        // Check URL patterns
        if (urlLower.includes('/dealer') || urlLower.includes('/location') ||
            urlLower.includes('/store') || urlLower.includes('/showroom')) {
            return true;
        }
        
        // Check text patterns
        const brandPattern = /(Ford|Chevrolet|Toyota|Honda|Nissan|Chrysler|Jeep|GMC|Hyundai|Kia|Mazda|Subaru|Volkswagen|Audi|BMW|Mercedes)/i;
        if (brandPattern.test(text) && text.length > 5 && text.length < 100) {
            return true;
        }
        
        return false;
    }

    shouldCrawlUrl(url) {
        const urlLower = url.toLowerCase();
        
        // Only crawl URLs that might contain location information
        return (
            urlLower.includes('location') ||
            urlLower.includes('dealer') ||
            urlLower.includes('store') ||
            urlLower.includes('our-') ||
            urlLower.includes('find-')
        ) && !urlLower.includes('inventory') && !urlLower.includes('vehicle');
    }

    normalizeUrl(url) {
        try {
            if (url.startsWith('//')) {
                url = 'https:' + url;
            } else if (url.startsWith('/')) {
                return new URL(url, this.baseUrl).href;
            } else if (!url.startsWith('http')) {
                return new URL(url, this.baseUrl).href;
            }
            return url;
        } catch (error) {
            return url;
        }
    }

    filterLocationUrls(urls) {
        return urls.filter(url => {
            const urlLower = url.toLowerCase();
            return (
                urlLower.includes('/dealer') ||
                urlLower.includes('/location') ||
                urlLower.includes('/store') ||
                urlLower.includes('/showroom')
            ) && !urlLower.includes('/inventory') && !urlLower.includes('/vehicle');
        });
    }

    findPaginationLinks($) {
        const paginationLinks = [];
        
        // Common pagination selectors
        const selectors = [
            '.pagination a',
            '.pager a',
            'a[rel="next"]',
            'a.next',
            '.page-numbers a',
            '[class*="pagination"] a'
        ];
        
        selectors.forEach(selector => {
            $(selector).each((i, elem) => {
                const href = $(elem).attr('href');
                if (href && !href.includes('#')) {
                    paginationLinks.push(this.normalizeUrl(href));
                }
            });
        });
        
        return [...new Set(paginationLinks)];
    }

    async crawlPage(url) {
        const locations = [];
        
        try {
            const response = await axios.get(url, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                
                $('a').each((i, elem) => {
                    const href = $(elem).attr('href');
                    const text = $(elem).text().trim();
                    if (href && this.isLocationUrl(href, text)) {
                        locations.push(this.normalizeUrl(href));
                    }
                });
            }
        } catch (error) {
            // Error crawling page
        }
        
        return locations;
    }

    extractUrlsFromJson(data) {
        const urls = [];
        
        const extractFromObject = (obj) => {
            if (Array.isArray(obj)) {
                obj.forEach(item => extractFromObject(item));
            } else if (typeof obj === 'object' && obj !== null) {
                Object.values(obj).forEach(value => {
                    if (typeof value === 'string' && value.includes('http')) {
                        if (this.isLocationUrl(value)) {
                            urls.push(value);
                        }
                    } else if (typeof value === 'object') {
                        extractFromObject(value);
                    }
                });
            }
        };
        
        extractFromObject(data);
        return urls;
    }

    deduplicateLocations(locations) {
        const unique = new Map();
        
        locations.forEach(url => {
            // Normalize URL for comparison
            const normalized = url.toLowerCase().replace(/\/$/, '');
            if (!unique.has(normalized)) {
                unique.set(normalized, url);
            }
        });
        
        return Array.from(unique.values());
    }
}

module.exports = LocationCrawler;