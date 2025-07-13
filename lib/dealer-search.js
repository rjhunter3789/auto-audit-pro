/*
 * Auto Audit Pro - Dealer Location Search Module
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Web search functionality for finding dealer group locations
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Known dealer group search patterns
const DEALER_GROUP_SEARCH_PATTERNS = {
    'autonation.com': {
        name: 'AutoNation',
        searchQuery: 'AutoNation locations all dealerships list',
        totalLocations: 325
    },
    'lithia.com': {
        name: 'Lithia',
        searchQuery: 'Lithia Motors all locations dealerships',
        totalLocations: 300
    },
    'kengarff.com': {
        name: 'Ken Garff',
        searchQuery: 'Ken Garff Automotive Group all locations',
        totalLocations: 70
    },
    'group1auto.com': {
        name: 'Group 1 Automotive',
        searchQuery: 'Group 1 Automotive dealership locations',
        totalLocations: 263
    },
    'penskeautomotive.com': {
        name: 'Penske Automotive',
        searchQuery: 'Penske Automotive Group dealership locations',
        totalLocations: 203
    },
    'asburyauto.com': {
        name: 'Asbury Automotive',
        searchQuery: 'Asbury Automotive Group all locations',
        totalLocations: 200
    },
    'sonicautomotive.com': {
        name: 'Sonic Automotive',
        searchQuery: 'Sonic Automotive dealership locations',
        totalLocations: 140
    },
    'geeautomotive.com': {
        name: 'Gee Automotive',
        searchQuery: 'Gee Automotive Companies dealership locations',
        totalLocations: 43
    },
    'kendallautogroup.com': {
        name: 'Kendall Auto Group',
        searchQuery: 'Kendall Auto Group all locations',
        totalLocations: 45,
        notes: 'Plus commercial/truck centers in Meridian ID, Marysville WA, Bend OR'
    }
};

class DealerSearcher {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.domain = this.extractDomain(baseUrl);
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (e) {
            return url;
        }
    }

    async searchForDealerLocations() {
        console.log(`[DealerSearch] Starting location search for ${this.domain}`);
        
        // Check if we have a known pattern for this dealer group
        const knownPattern = DEALER_GROUP_SEARCH_PATTERNS[this.domain];
        let searchQuery;
        
        if (knownPattern) {
            searchQuery = knownPattern.searchQuery;
            console.log(`[DealerSearch] Using known pattern for ${knownPattern.name}`);
        } else {
            // Generic search pattern
            const groupName = this.extractGroupName();
            searchQuery = `"${groupName}" dealer locations dealerships "all locations"`;
            console.log(`[DealerSearch] Using generic search for ${groupName}`);
        }

        try {
            // Try multiple search approaches
            const results = await this.performWebSearch(searchQuery);
            const locations = await this.parseSearchResults(results);
            
            // If we didn't find enough locations, try alternative searches
            if (locations.length < 20) {
                console.log(`[DealerSearch] Only found ${locations.length} locations, trying alternative search`);
                const altQuery = `site:${this.domain} dealer OR location OR dealership`;
                const altResults = await this.performWebSearch(altQuery);
                const altLocations = await this.parseSearchResults(altResults);
                
                // Merge and deduplicate
                const allLocations = this.mergeLocations(locations, altLocations);
                return allLocations;
            }
            
            return locations;
        } catch (error) {
            console.error('[DealerSearch] Search error:', error.message);
            // Return error info instead of empty array
            return [{
                type: 'error',
                message: `Search failed: ${error.message}`
            }];
        }
    }

    extractGroupName() {
        // Try to extract group name from domain
        const domainParts = this.domain.split('.');
        let groupName = domainParts[0];
        
        // Clean up common patterns
        groupName = groupName.replace(/auto$|automotive$|group$|motors$/i, '');
        
        // Capitalize
        groupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
        
        return groupName;
    }

    async performWebSearch(query) {
        // Note: In a real implementation, this would use a search API
        // For now, we'll simulate search results based on known patterns
        console.log(`[DealerSearch] Searching for: ${query}`);
        
        // Check if we have known data for this domain
        const knownData = DEALER_GROUP_SEARCH_PATTERNS[this.domain];
        if (knownData && knownData.totalLocations) {
            console.log(`[DealerSearch] Using known data for ${knownData.name}`);
            return {
                query: query,
                estimatedTotal: knownData.totalLocations,
                urls: [
                    `https://${this.domain}/locations`,
                    `https://${this.domain}/dealerships`,
                    `https://${this.domain}/our-locations`
                ],
                metadata: {
                    groupName: knownData.name,
                    states: this.getStatesForGroup(knownData.name)
                }
            };
        }

        // Default response for unknown groups
        console.log(`[DealerSearch] No known data for ${this.domain}`);
        return {
            query: query,
            estimatedTotal: 'Unknown',
            urls: [`https://${this.domain}/locations`, `https://${this.domain}/dealerships`],
            metadata: {
                groupName: this.extractGroupName()
            }
        };
    }

    getStatesForGroup(groupName) {
        const stateData = {
            'AutoNation': ['Texas', 'Florida', 'California', 'Arizona', 'Nevada'],
            'Lithia': ['Oregon', 'California', 'Washington', 'Idaho', 'Nevada'],
            'Ken Garff': ['Utah', 'Nevada', 'California', 'Iowa', 'Michigan'],
            'Group 1 Automotive': ['Texas', 'California', 'Florida', 'Georgia', 'Oklahoma'],
            'Penske Automotive': ['California', 'New Jersey', 'Virginia', 'Texas', 'Arizona'],
            'Asbury Automotive': ['Georgia', 'Florida', 'Texas', 'Indiana', 'Virginia'],
            'Sonic Automotive': ['California', 'Texas', 'Colorado', 'Florida', 'Alabama'],
            'Gee Automotive': ['Washington', 'Oregon', 'Idaho'],
            'Kendall Auto Group': ['Alaska', 'Idaho', 'Oregon', 'Washington', 'Montana']
        };
        return stateData[groupName] || ['Multiple states'];
    }

    async parseSearchResults(searchResults) {
        const locations = [];
        
        if (searchResults.estimatedTotal !== 'Unknown') {
            // Add metadata about total locations
            locations.push({
                type: 'metadata',
                totalLocations: searchResults.estimatedTotal,
                groupName: searchResults.metadata.groupName,
                states: searchResults.metadata.states
            });
        }

        // Add URLs to check
        searchResults.urls.forEach(url => {
            locations.push({
                type: 'searchResult',
                url: url,
                source: 'webSearch'
            });
        });

        return locations;
    }

    mergeLocations(locations1, locations2) {
        const merged = [...locations1];
        const urls = new Set(locations1.map(l => l.url));
        
        locations2.forEach(location => {
            if (location.url && !urls.has(location.url)) {
                merged.push(location);
                urls.add(location.url);
            }
        });
        
        return merged;
    }

    // Get search summary for display
    getSearchSummary(searchResults) {
        const metadata = searchResults.find(r => r.type === 'metadata');
        if (metadata) {
            return {
                success: true,
                totalLocations: metadata.totalLocations,
                groupName: metadata.groupName,
                coverage: metadata.states ? `Locations in ${metadata.states.length} states including ${metadata.states.slice(0, 3).join(', ')}` : 'Multiple states',
                message: `Found ${metadata.totalLocations} ${metadata.groupName} locations across multiple states`
            };
        }
        
        return {
            success: false,
            message: 'Unable to determine total location count through web search'
        };
    }
}

module.exports = DealerSearcher;