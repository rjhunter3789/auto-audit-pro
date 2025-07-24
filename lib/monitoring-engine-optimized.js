/**
 * Optimized Monitoring Engine for handling multiple websites concurrently
 * Adds batching, connection pooling, and better error handling
 */

const MonitoringEngine = require('./monitoring-engine');
const pLimit = require('p-limit');

class OptimizedMonitoringEngine extends MonitoringEngine {
    constructor() {
        super();
        
        // Limit concurrent checks to prevent overwhelming the system
        this.concurrencyLimit = pLimit(5); // Process 5 websites at a time
        
        // Track active monitoring tasks
        this.activeChecks = new Map();
        
        // Performance metrics
        this.metrics = {
            checksInProgress: 0,
            totalChecksCompleted: 0,
            averageCheckTime: 0,
            lastBatchTime: null
        };
    }
    
    /**
     * Check multiple websites with concurrency control
     */
    async checkWebsitesBatch(profiles) {
        console.log(`[OptimizedMonitor] Starting batch check for ${profiles.length} websites`);
        const startTime = Date.now();
        
        // Process websites in controlled batches
        const results = await Promise.all(
            profiles.map(profile => 
                this.concurrencyLimit(() => this.checkWebsiteWithMetrics(profile))
            )
        );
        
        const batchTime = Date.now() - startTime;
        this.metrics.lastBatchTime = batchTime;
        console.log(`[OptimizedMonitor] Batch completed in ${batchTime}ms`);
        
        return results;
    }
    
    /**
     * Check website with performance tracking
     */
    async checkWebsiteWithMetrics(profile) {
        const checkId = `${profile.url}-${Date.now()}`;
        this.activeChecks.set(checkId, profile.url);
        this.metrics.checksInProgress++;
        
        const startTime = Date.now();
        
        try {
            const result = await this.checkWebsite(profile.url);
            
            // Update metrics
            const checkTime = Date.now() - startTime;
            this.updateAverageCheckTime(checkTime);
            
            return {
                profile,
                result,
                checkTime
            };
            
        } catch (error) {
            console.error(`[OptimizedMonitor] Error checking ${profile.url}:`, error.message);
            return {
                profile,
                result: {
                    url: profile.url,
                    timestamp: new Date().toISOString(),
                    overallStatus: 'error',
                    errorMessage: error.message
                },
                checkTime: Date.now() - startTime
            };
            
        } finally {
            this.activeChecks.delete(checkId);
            this.metrics.checksInProgress--;
            this.metrics.totalChecksCompleted++;
        }
    }
    
    /**
     * Update average check time metric
     */
    updateAverageCheckTime(newTime) {
        const total = this.metrics.totalChecksCompleted;
        const currentAvg = this.metrics.averageCheckTime;
        this.metrics.averageCheckTime = ((currentAvg * (total - 1)) + newTime) / total;
    }
    
    /**
     * Get current system metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeChecks: Array.from(this.activeChecks.values()),
            estimatedTimeFor37Sites: Math.ceil((this.metrics.averageCheckTime * 37) / 5000) + ' seconds'
        };
    }
    
    /**
     * Optimized profile scheduling
     */
    async scheduleOptimizedChecks() {
        const profiles = await this.loadProfiles();
        const now = Date.now();
        
        // Group profiles by check frequency for efficient batching
        const profilesByFrequency = new Map();
        
        for (const profile of profiles) {
            if (!profile.enabled) continue;
            
            const freq = profile.checkFrequency;
            if (!profilesByFrequency.has(freq)) {
                profilesByFrequency.set(freq, []);
            }
            profilesByFrequency.get(freq).push(profile);
        }
        
        // Process each frequency group
        for (const [frequency, groupProfiles] of profilesByFrequency) {
            console.log(`[OptimizedMonitor] Processing ${groupProfiles.length} sites with ${frequency}-minute frequency`);
            
            // Check which profiles are due
            const dueProfiles = groupProfiles.filter(profile => {
                const lastCheck = new Date(profile.lastCheck || 0).getTime();
                const nextCheck = lastCheck + (frequency * 60 * 1000);
                return now >= nextCheck;
            });
            
            if (dueProfiles.length > 0) {
                console.log(`[OptimizedMonitor] ${dueProfiles.length} sites due for checking`);
                await this.checkWebsitesBatch(dueProfiles);
            }
        }
    }
    
    /**
     * Health check for monitoring system
     */
    async healthCheck() {
        const metrics = this.getMetrics();
        const profiles = await this.loadProfiles();
        
        return {
            status: metrics.checksInProgress < 10 ? 'healthy' : 'busy',
            totalProfiles: profiles.length,
            enabledProfiles: profiles.filter(p => p.enabled).length,
            ...metrics,
            recommendations: this.getRecommendations(profiles.length)
        };
    }
    
    /**
     * Get recommendations based on number of profiles
     */
    getRecommendations(profileCount) {
        const recommendations = [];
        
        if (profileCount > 30) {
            recommendations.push('Consider increasing check intervals for some sites');
            recommendations.push('Enable ScrapingDog API for faster checks');
        }
        
        if (profileCount > 50) {
            recommendations.push('Implement database storage instead of JSON files');
            recommendations.push('Consider horizontal scaling with multiple workers');
        }
        
        if (this.metrics.averageCheckTime > 10000) {
            recommendations.push('Some sites are slow to respond - consider timeout adjustments');
        }
        
        return recommendations;
    }
}

module.exports = OptimizedMonitoringEngine;