/**
 * JSON-based Storage System
 * Simple file-based storage for monitoring data
 */

const fs = require('fs').promises;
const path = require('path');

class JSONStorage {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data', 'monitoring');
        this.profilesFile = path.join(this.dataDir, 'profiles.json');
        this.resultsFile = path.join(this.dataDir, 'results.json');
        this.alertsFile = path.join(this.dataDir, 'alerts.json');
        this.rulesFile = path.join(this.dataDir, 'rules.json');
        
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize files if they don't exist
            await this.initializeFile(this.profilesFile, []);
            await this.initializeFile(this.resultsFile, []);
            await this.initializeFile(this.alertsFile, []);
            await this.initializeFile(this.rulesFile, this.getDefaultRules());
            
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }

    async initializeFile(filePath, defaultData) {
        try {
            await fs.access(filePath);
        } catch {
            // File doesn't exist, create it
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    // ===== PROFILES =====
    async getProfiles() {
        const data = await fs.readFile(this.profilesFile, 'utf8');
        return JSON.parse(data);
    }

    async getProfile(id) {
        const profiles = await this.getProfiles();
        // Handle both string and number IDs
        return profiles.find(p => p.id == id);
    }

    async createProfile(profile) {
        const profiles = await this.getProfiles();
        const newProfile = {
            id: Date.now(),
            ...profile,
            monitoring_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        profiles.push(newProfile);
        await fs.writeFile(this.profilesFile, JSON.stringify(profiles, null, 2));
        return newProfile;
    }

    async updateProfile(id, updates) {
        const profiles = await this.getProfiles();
        const index = profiles.findIndex(p => p.id === id);
        if (index !== -1) {
            profiles[index] = {
                ...profiles[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            await fs.writeFile(this.profilesFile, JSON.stringify(profiles, null, 2));
            return profiles[index];
        }
        return null;
    }

    // ===== RESULTS =====
    async getResults(profileId, limit = 100) {
        const allResults = await fs.readFile(this.resultsFile, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        
        return allResults
            .filter(r => r.profile_id === profileId)
            .sort((a, b) => new Date(b.check_timestamp) - new Date(a.check_timestamp))
            .slice(0, limit);
    }

    async saveResult(result) {
        const results = await fs.readFile(this.resultsFile, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        
        const newResult = {
            id: Date.now(),
            ...result,
            check_timestamp: new Date().toISOString()
        };
        
        results.push(newResult);
        
        // Keep only last 1000 results to prevent file from growing too large
        if (results.length > 1000) {
            results.splice(0, results.length - 1000);
        }
        
        await fs.writeFile(this.resultsFile, JSON.stringify(results, null, 2));
        return newResult;
    }

    async getLatestResult(profileId) {
        const results = await this.getResults(profileId, 1);
        return results[0] || null;
    }

    // ===== ALERTS =====
    async getAlerts(profileId, resolved = false) {
        const allAlerts = await fs.readFile(this.alertsFile, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        
        return allAlerts
            .filter(a => a.profile_id === profileId && a.resolved === resolved)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    async saveAlert(alert) {
        const alerts = await fs.readFile(this.alertsFile, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        
        const newAlert = {
            id: Date.now(),
            ...alert,
            notification_sent: false,
            acknowledged: false,
            resolved: false,
            created_at: new Date().toISOString()
        };
        
        alerts.push(newAlert);
        await fs.writeFile(this.alertsFile, JSON.stringify(alerts, null, 2));
        return newAlert;
    }

    async updateAlert(id, updates) {
        const alerts = await fs.readFile(this.alertsFile, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        
        const index = alerts.findIndex(a => a.id === id);
        if (index !== -1) {
            alerts[index] = {
                ...alerts[index],
                ...updates
            };
            await fs.writeFile(this.alertsFile, JSON.stringify(alerts, null, 2));
            return alerts[index];
        }
        return null;
    }

    async getRecentAlert(profileId, alertType) {
        const alerts = await this.getAlerts(profileId, false);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        return alerts.find(a => 
            a.alert_type === alertType && 
            new Date(a.created_at) > oneHourAgo
        );
    }

    // ===== RULES =====
    async getRules() {
        const data = await fs.readFile(this.rulesFile, 'utf8');
        return JSON.parse(data);
    }

    getDefaultRules() {
        return [
            // RED Alerts - Critical Issues
            {
                id: 1,
                rule_name: 'Website Down',
                rule_category: 'uptime',
                check_type: 'is_reachable',
                condition: 'equals',
                threshold_value: false,
                alert_level: 'RED',
                alert_message_template: 'CRITICAL: Website is unreachable - customers cannot access your site!',
                enabled: true
            },
            {
                id: 2,
                rule_name: 'SSL Certificate Invalid',
                rule_category: 'security',
                check_type: 'ssl_valid',
                condition: 'equals',
                threshold_value: false,
                alert_level: 'RED',
                alert_message_template: 'CRITICAL: SSL certificate is invalid - browsers showing security warnings!',
                enabled: true
            },
            {
                id: 3,
                rule_name: 'Forms Not Working',
                rule_category: 'content',
                check_type: 'forms_working',
                condition: 'equals',
                threshold_value: false,
                alert_level: 'RED',
                alert_message_template: 'CRITICAL: Contact forms not working - losing potential leads!',
                enabled: true
            },
            {
                id: 4,
                rule_name: 'No Inventory',
                rule_category: 'content',
                check_type: 'inventory_count',
                condition: 'equals',
                threshold_value: 0,
                alert_level: 'RED',
                alert_message_template: 'CRITICAL: No inventory showing on website!',
                enabled: true
            },
            {
                id: 5,
                rule_name: 'Server Error',
                rule_category: 'uptime',
                check_type: 'http_status_code',
                condition: 'greater_than',
                threshold_value: 499,
                alert_level: 'RED',
                alert_message_template: 'CRITICAL: Website returning server errors!',
                enabled: true
            },
            {
                id: 6,
                rule_name: 'Extremely Slow',
                rule_category: 'performance',
                check_type: 'load_time_seconds',
                condition: 'greater_than',
                threshold_value: 10,
                alert_level: 'RED',
                alert_message_template: 'CRITICAL: Website taking over 10 seconds to load!',
                enabled: true
            },
            
            // YELLOW Alerts - Warning Issues
            {
                id: 7,
                rule_name: 'SSL Expiring Soon',
                rule_category: 'security',
                check_type: 'ssl_expiry_days',
                condition: 'less_than',
                threshold_value: 30,
                alert_level: 'YELLOW',
                alert_message_template: 'WARNING: SSL certificate expires in {ssl_expiry_days} days',
                enabled: true
            },
            {
                id: 8,
                rule_name: 'Slow Response',
                rule_category: 'performance',
                check_type: 'response_time_ms',
                condition: 'greater_than',
                threshold_value: 3000,
                alert_level: 'YELLOW',
                alert_message_template: 'WARNING: Website response time over 3 seconds',
                enabled: true
            },
            {
                id: 9,
                rule_name: 'Low Inventory',
                rule_category: 'content',
                check_type: 'inventory_count',
                condition: 'less_than',
                threshold_value: 50,
                alert_level: 'YELLOW',
                alert_message_template: 'WARNING: Low inventory count ({inventory_count} vehicles)',
                enabled: true
            },
            {
                id: 10,
                rule_name: 'Poor Mobile Score',
                rule_category: 'performance',
                check_type: 'mobile_score',
                condition: 'less_than',
                threshold_value: 70,
                alert_level: 'YELLOW',
                alert_message_template: 'WARNING: Mobile performance score is {mobile_score}/100',
                enabled: true
            },
            {
                id: 11,
                rule_name: 'Large Page Size',
                rule_category: 'performance',
                check_type: 'page_size_kb',
                condition: 'greater_than',
                threshold_value: 5000,
                alert_level: 'YELLOW',
                alert_message_template: 'WARNING: Homepage is {page_size_kb}KB - may load slowly',
                enabled: true
            }
        ];
    }

    // ===== STATUS =====
    async getMonitoringStatus() {
        const profiles = await this.getProfiles();
        const status = [];
        
        for (const profile of profiles) {
            const latestResult = await this.getLatestResult(profile.id);
            status.push({
                ...profile,
                overall_status: latestResult?.overall_status || 'UNKNOWN',
                check_timestamp: latestResult?.check_timestamp,
                response_time_ms: latestResult?.response_time_ms,
                issues_found: latestResult?.issues_found || []
            });
        }
        
        return status;
    }
}

// Create singleton instance
const storage = new JSONStorage();

// Mock pool object to match PostgreSQL interface
const pool = {
    query: async (query, values) => {
        // Route queries to appropriate storage methods
        if (query.includes('monitoring_profiles')) {
            if (query.includes('INSERT')) {
                const profile = {
                    dealer_id: values[0],
                    dealer_name: values[1],
                    website_url: values[2],
                    contact_email: values[3],
                    alert_email: values[4],
                    alert_phone: values[5],
                    alert_preferences: values[6],
                    check_frequency: values[7]
                };
                const result = await storage.createProfile(profile);
                return { rows: [result] };
            } else if (query.includes('UPDATE')) {
                const id = values[0];
                const updates = { monitoring_enabled: values[1] };
                const result = await storage.updateProfile(id, updates);
                return { rows: [result] };
            } else if (query.includes('DELETE')) {
                const id = values[0];
                // Remove from profiles
                const profiles = await storage.getProfiles();
                const filtered = profiles.filter(p => p.id != id);
                await fs.writeFile(storage.profilesFile, JSON.stringify(filtered, null, 2));
                return { rows: [] };
            } else if (query.includes('SELECT')) {
                if (query.includes('WHERE id =')) {
                    const id = values[0];
                    const profile = await storage.getProfile(id);
                    return { rows: profile ? [profile] : [] };
                } else {
                    const profiles = await storage.getProfiles();
                    return { rows: profiles };
                }
            }
        } else if (query.includes('monitoring_results')) {
            if (query.includes('INSERT')) {
                const result = {
                    profile_id: values[0],
                    overall_status: values[1],
                    is_reachable: values[2],
                    response_time_ms: values[3],
                    http_status_code: values[4],
                    ssl_valid: values[5],
                    ssl_expiry_days: values[6],
                    forms_working: values[7],
                    phone_numbers_valid: values[8],
                    inventory_count: values[9],
                    page_size_kb: values[10],
                    load_time_seconds: values[11],
                    mobile_score: values[12],
                    desktop_score: values[13],
                    issues_found: JSON.parse(values[14]),
                    metrics: JSON.parse(values[15]),
                    error_details: values[16]
                };
                const saved = await storage.saveResult(result);
                return { rows: [saved] };
            } else if (query.includes('SELECT')) {
                const profileId = values[0];
                const limit = values[1] || 100;
                const results = await storage.getResults(profileId, limit);
                return { rows: results };
            }
        } else if (query.includes('alert_history')) {
            if (query.includes('INSERT')) {
                const alert = {
                    profile_id: values[0],
                    result_id: values[1],
                    rule_id: values[2],
                    alert_level: values[3],
                    alert_type: values[4],
                    alert_message: values[5]
                };
                const saved = await storage.saveAlert(alert);
                return { rows: [saved] };
            } else if (query.includes('UPDATE')) {
                const id = values[0];
                const updates = {};
                if (query.includes('acknowledged = true')) {
                    updates.acknowledged = true;
                    updates.acknowledged_by = values[1];
                    updates.acknowledged_at = new Date().toISOString();
                } else if (query.includes('resolved = true')) {
                    updates.resolved = true;
                    updates.resolved_at = new Date().toISOString();
                }
                const updated = await storage.updateAlert(id, updates);
                return { rows: [updated] };
            } else if (query.includes('SELECT')) {
                const profileId = values[0];
                const resolved = values[1] || false;
                const alerts = await storage.getAlerts(profileId, resolved);
                return { rows: alerts };
            }
        } else if (query.includes('alert_rules')) {
            const rules = await storage.getRules();
            return { rows: rules };
        } else if (query.includes('LEFT JOIN LATERAL')) {
            // Special case for status query
            const status = await storage.getMonitoringStatus();
            return { rows: status };
        }
        
        return { rows: [] };
    }
};

module.exports = { storage, pool };