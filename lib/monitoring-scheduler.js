/**
 * Monitoring Scheduler
 * Handles automated scheduling of website checks
 */

const cron = require('node-cron');
const MonitoringEngine = require('./monitoring-engine');
const NotificationService = require('./notification-service');

class MonitoringScheduler {
    constructor(dbPool) {
        this.dbPool = dbPool;
        this.engine = new MonitoringEngine(dbPool);
        this.notificationService = new NotificationService(dbPool);
        this.activeJobs = new Map();
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
            const query = 'SELECT * FROM monitoring_profiles';
            const result = await this.dbPool.query(query);
            
            console.log(`[Scheduler] Found ${result.rows.length} active monitoring profiles`);

            for (const profile of result.rows) {
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
                // Check if this alert was already sent recently
                const recentAlert = await this.checkRecentAlert(profile.id, alert);
                if (recentAlert) {
                    // Already logged in checkRecentAlert method with details
                    continue;
                }

                // Save alert to history
                const savedAlert = await this.saveAlert(profile.id, results.id, alert);
                
                // Parse alert preferences if needed
                const alertPrefs = typeof profile.alert_preferences === 'string' 
                    ? JSON.parse(profile.alert_preferences) 
                    : profile.alert_preferences;
                
                // Send notifications based on alert level and preferences
                if (alert.alert_level === 'RED' || alertPrefs.email) {
                    await this.notificationService.sendAlert(profile, savedAlert);
                }

            } catch (error) {
                console.error('[Scheduler] Error processing alert:', error);
            }
        }
    }

    /**
     * Check if similar alert was sent recently
     * RED alerts: 1 hour suppression
     * YELLOW alerts: 6 hour suppression
     */
    async checkRecentAlert(profileId, alert) {
        try {
            // Determine suppression period based on alert level
            const suppressionHours = alert.alert_level === 'YELLOW' ? 6 : 1;
            
            const query = `
                SELECT * FROM alert_history 
                WHERE profile_id = $1 
                AND alert_type = $2 
                AND alert_level = $3
                AND resolved = false 
                AND created_at > NOW() - INTERVAL '${suppressionHours} hours'
                LIMIT 1`;
            
            const result = await this.dbPool.query(query, [profileId, alert.alert_type, alert.alert_level]);
            
            if (result.rows.length > 0) {
                console.log(`[Scheduler] Suppressing ${alert.alert_level} alert for ${alert.alert_type} - already sent within ${suppressionHours} hours`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[Scheduler] Error checking recent alerts:', error);
            return false;
        }
    }

    /**
     * Save alert to history
     */
    async saveAlert(profileId, resultId, alert) {
        try {
            const query = `
                INSERT INTO alert_history 
                (profile_id, result_id, rule_id, alert_level, alert_type, alert_message)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`;
            
            const values = [
                profileId,
                resultId,
                alert.rule_id,
                alert.alert_level,
                alert.alert_type,
                alert.alert_message
            ];

            const result = await this.dbPool.query(query, values);
            return result.rows[0];
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
            const query = 'UPDATE monitoring_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
            await this.dbPool.query(query, [profileId]);
        } catch (error) {
            console.error('[Scheduler] Error updating last check:', error);
        }
    }

    /**
     * Check for profiles that haven't been checked recently
     */
    async checkOverdueProfiles() {
        try {
            const query = `
                SELECT p.* FROM monitoring_profiles p
                LEFT JOIN (
                    SELECT profile_id, MAX(check_timestamp) as last_check
                    FROM monitoring_results
                    GROUP BY profile_id
                ) r ON p.id = r.profile_id
                WHERE (r.last_check IS NULL OR 
                     r.last_check < NOW() - INTERVAL '1 minute' * p.check_frequency)`;
            
            const result = await this.dbPool.query(query);
            
            console.log(`[Scheduler] Found ${result.rows.length} overdue profiles`);
            
            for (const profile of result.rows) {
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