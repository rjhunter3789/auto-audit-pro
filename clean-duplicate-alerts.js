/**
 * Script to clean up duplicate alerts in the monitoring system
 * This will keep only the first alert of each type per profile and mark it with last_seen
 */

const fs = require('fs').promises;
const path = require('path');

async function cleanDuplicateAlerts() {
    try {
        // Read alerts file
        const alertsFile = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
        const alertsData = await fs.readFile(alertsFile, 'utf8');
        const alerts = JSON.parse(alertsData);
        
        console.log(`Found ${alerts.length} total alerts`);
        
        // Group alerts by profile_id + alert_type + alert_level
        const alertGroups = {};
        
        alerts.forEach(alert => {
            if (!alert.resolved) {
                const key = `${alert.profile_id}_${alert.alert_type}_${alert.alert_level}`;
                if (!alertGroups[key]) {
                    alertGroups[key] = [];
                }
                alertGroups[key].push(alert);
            }
        });
        
        // Process each group
        const cleanedAlerts = [];
        const resolvedAlerts = alerts.filter(a => a.resolved);
        
        Object.entries(alertGroups).forEach(([key, groupAlerts]) => {
            if (groupAlerts.length > 1) {
                console.log(`Found ${groupAlerts.length} duplicate alerts for ${key}`);
                
                // Sort by created_at to get the oldest first
                groupAlerts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                
                // Keep the first one and update its last_seen
                const keepAlert = groupAlerts[0];
                const latestAlert = groupAlerts[groupAlerts.length - 1];
                
                keepAlert.last_seen = latestAlert.created_at;
                keepAlert.updated_at = new Date().toISOString();
                
                cleanedAlerts.push(keepAlert);
                
                console.log(`  Keeping alert from ${keepAlert.created_at}, last seen at ${keepAlert.last_seen}`);
            } else {
                // No duplicates, keep as is
                cleanedAlerts.push(groupAlerts[0]);
            }
        });
        
        // Combine cleaned alerts with resolved alerts
        const finalAlerts = [...cleanedAlerts, ...resolvedAlerts];
        
        console.log(`\nCleaned alerts: ${finalAlerts.length} (was ${alerts.length})`);
        console.log(`Removed ${alerts.length - finalAlerts.length} duplicate alerts`);
        
        // Backup original file
        const backupFile = alertsFile + '.backup-' + Date.now();
        await fs.writeFile(backupFile, alertsData);
        console.log(`\nBacked up original alerts to: ${backupFile}`);
        
        // Write cleaned alerts
        await fs.writeFile(alertsFile, JSON.stringify(finalAlerts, null, 2));
        console.log('Successfully cleaned duplicate alerts!');
        
    } catch (error) {
        console.error('Error cleaning alerts:', error);
    }
}

// Run the cleanup
cleanDuplicateAlerts();