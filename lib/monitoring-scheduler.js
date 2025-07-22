/**
 * Monitoring Scheduler
 * Handles automated scheduling of website checks
 */

const cron = require('node-cron');
const MonitoringEngine = require('./monitoring-engine');
const NotificationService = require('./notification-service');

class MonitoringScheduler {
    constructor(monitoringEngine = null) {
        this.engine = monitoringEngine || new MonitoringEngine();
        this.notificationService = new NotificationService();
        this.activeJobs = new Map();
        this.jsonStorage = require('./json-storage').storage;
    }

    /**
     * Start the monitoring scheduler
     */
    async start() {
        console.log('[Scheduler] Starting monitoring scheduler...');
        
        // Load all active monitoring profiles
        await this.loadMonitoringProfiles();
        
        // Check for profiles every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            await this.loadMonitoringProfiles();
        });

        // Run immediate check for any overdue profiles
        await this.checkOverdueProfiles();
    }

    /**
     * Load all monitoring profiles and schedule checks
     */
    async loadMonitoringProfiles() {
        try {
            // Use JSON storage instead of database
            const profiles = await this.jsonStorage.getProfiles();
            
            console.log(`[Scheduler] Found ${profiles.length} active monitoring profiles`);

            for (const profile of profiles) {
                await this.scheduleProfile(profile);
            }
        } catch (error) {
            console.error('[Scheduler] Error loading profiles:', error);
        }
    }

    /**
     * Schedule monitoring for a specific profile
     */
    async scheduleProfile(profile) {
        const jobId = `monitor_${profile.id}`;
        
        // Remove existing job if any
        if (this.activeJobs.has(jobId)) {
            const existingJob = this.activeJobs.get(jobId);
            existingJob.stop();
            this.activeJobs.delete(jobId);
        }

        // Create cron pattern based on check frequency
        const cronPattern = this.getCronPattern(profile.check_frequency);
        
        // Schedule the job
        const job = cron.schedule(cronPattern, async () => {
            await this.runMonitoringCheck(profile);
        });

        this.activeJobs.set(jobId, job);
        console.log(`[Scheduler] Scheduled monitoring for ${profile.dealer_name} every ${profile.check_frequency} minutes`);
    }

    /**
     * Convert minutes to cron pattern
     */
    getCronPattern(minutes) {
        if (minutes < 60) {
            return `*/${minutes} * * * *`;
        } else {
            const hours = Math.floor(minutes / 60);
            return `0 */${hours} * * *`;
        }
    }

    /**
     * Run monitoring check for a profile
     */
    async runMonitoringCheck(profile) {
        console.log(`[Scheduler] Running check for ${profile.dealer_name}`);
        
        try {
            // Run the monitoring check
            const results = await this.engine.runFullCheck(profile);
            
            // Check for triggered alerts
            const alerts = await this.engine.checkAlertRules(results);
            
            // Process alerts
            if (alerts.length > 0) {
                await this.processAlerts(profile, results, alerts);
            }

            // Update last check time
            await this.updateLastCheck(profile.id);

        } catch (error) {
            console.error(`[Scheduler] Error running check for ${profile.dealer_name}:`, error);
        }
    }

    /**
     * Process triggered alerts
     */
    async processAlerts(profile, results, alerts) {
        for (const alert of alerts) {
            try {
                // Check if this is a duplicate of an existing unresolved alert
                const existingAlert = await this.findExistingUnresolvedAlert(profile.id, alert);
                
                if (existingAlert) {
                    // Update the existing alert's timestamp instead of creating a new one
                    await this.updateAlertTimestamp(existingAlert.id);
                    console.log(`[Scheduler] Updated existing ${alert.alert_level} alert for ${alert.alert_type} - last seen at ${new Date().toISOString()}`);
                    continue;
                }

                // This is a new alert, save it
                const savedAlert = await this.saveAlert(profile.id, results.id, alert);
                
                // Parse alert preferences if needed
                const alertPrefs = typeof profile.alert_preferences === 'string' 
                    ? JSON.parse(profile.alert_preferences) 
                    : profile.alert_preferences;
                
                // Send notifications for new alerts
                if (alert.alert_level === 'RED' || alertPrefs.email) {
                    await this.notificationService.sendAlert(profile, savedAlert);
                }

            } catch (error) {
                console.error('[Scheduler] Error processing alert:', error);
            }
        }
    }

    /**
     * Find existing unresolved alert of the same type
     */
    async findExistingUnresolvedAlert(profileId, alert) {
        try {
            const alerts = await this.jsonStorage.getAlerts();
            
            // Find an unresolved alert of the same type
            const existingAlert = alerts.find(a => 
                a.profile_id == profileId &&
                a.alert_type === alert.alert_type &&
                a.alert_level === alert.alert_level &&
                !a.resolved
            );
            
            return existingAlert;
        } catch (error) {
            console.error('[Scheduler] Error finding existing alert:', error);
            return null;
        }
    }

    /**
     * Update alert timestamp to show it's still active
     */
    async updateAlertTimestamp(alertId) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const alertsFile = path.join(__dirname, '..', 'data', 'monitoring', 'alerts.json');
            
            // Read current alerts
            const alertsData = await fs.readFile(alertsFile, 'utf8');
            const alerts = JSON.parse(alertsData);
            
            // Find and update the alert
            const alertIndex = alerts.findIndex(a => a.id === alertId);
            if (alertIndex !== -1) {
                alerts[alertIndex].last_seen = new Date().toISOString();
                alerts[alertIndex].updated_at = new Date().toISOString();
                
                // Save back to file
                await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));
            }
        } catch (error) {
            console.error('[Scheduler] Error updating alert timestamp:', error);
        }
    }

    /**
     * Save alert to history
     */
    async saveAlert(profileId, resultId, alert) {
        try {
            const newAlert = {
                id: Date.now(),
                profile_id: profileId,
                result_id: resultId,
                rule_id: alert.rule_id,
                alert_level: alert.alert_level,
                alert_type: alert.alert_type,
                alert_message: alert.alert_message,
                notification_sent: false,
                acknowledged: false,
                resolved: false,
                created_at: new Date().toISOString()
            };

            // Save to JSON storage
            await this.jsonStorage.saveAlert(newAlert);
            console.log(`[Scheduler] Saved ${alert.alert_level} alert for profile ${profileId}: ${alert.alert_type}`);
            
            return newAlert;
        } catch (error) {
            console.error('[Scheduler] Error saving alert:', error);
            throw error;
        }
    }

    /**
     * Update last check timestamp
     */
    async updateLastCheck(profileId) {
        try {
            // Get all profiles
            const profiles = await this.jsonStorage.getProfiles();
            
            // Find and update the profile
            const profileIndex = profiles.findIndex(p => p.id == profileId);
            if (profileIndex !== -1) {
                profiles[profileIndex].updated_at = new Date().toISOString();
                profiles[profileIndex].last_check = new Date().toISOString();
                
                // Save back to file
                const fs = require('fs').promises;
                const path = require('path');
                const profilesFile = path.join(__dirname, '..', 'data', 'monitoring', 'profiles.json');
                await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2));
            }
        } catch (error) {
            console.error('[Scheduler] Error updating last check:', error);
        }
    }

    /**
     * Check for profiles that haven't been checked recently
     */
    async checkOverdueProfiles() {
        try {
            // Get all profiles and results from JSON storage
            const profiles = await this.jsonStorage.getProfiles();
            const results = await this.jsonStorage.getResults();
            
            // Find overdue profiles
            const overdueProfiles = [];
            const now = new Date();
            
            for (const profile of profiles) {
                // Find the latest result for this profile
                const profileResults = results.filter(r => r.profile_id === profile.id);
                const latestResult = profileResults.sort((a, b) => 
                    new Date(b.check_timestamp) - new Date(a.check_timestamp)
                )[0];
                
                // Check if overdue
                if (!latestResult) {
                    // Never checked
                    overdueProfiles.push(profile);
                } else {
                    const lastCheck = new Date(latestResult.check_timestamp);
                    const minutesSinceLastCheck = (now - lastCheck) / (1000 * 60);
                    
                    if (minutesSinceLastCheck >= profile.check_frequency) {
                        overdueProfiles.push(profile);
                    }
                }
            }
            
            console.log(`[Scheduler] Found ${overdueProfiles.length} overdue profiles`);
            
            for (const profile of overdueProfiles) {
                await this.runMonitoringCheck(profile);
            }
        } catch (error) {
            console.error('[Scheduler] Error checking overdue profiles:', error);
        }
    }

    /**
     * Stop all monitoring jobs
     */
    stop() {
        console.log('[Scheduler] Stopping all monitoring jobs...');
        for (const [jobId, job] of this.activeJobs) {
            job.stop();
        }
        this.activeJobs.clear();
    }
}

module.exports = MonitoringScheduler;