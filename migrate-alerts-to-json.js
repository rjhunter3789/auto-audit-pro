/**
 * Migrate alerts from PostgreSQL to JSON storage
 * This will copy all alerts from the database to the JSON file
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration from environment
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateAlerts() {
    try {
        console.log('Starting alert migration from PostgreSQL to JSON...');
        
        // 1. Fetch all alerts from database
        const query = `
            SELECT 
                id,
                profile_id,
                result_id,
                rule_id,
                alert_level,
                alert_type,
                alert_message,
                notification_sent,
                acknowledged,
                acknowledged_by,
                acknowledged_at,
                resolved,
                resolved_at,
                created_at
            FROM monitoring_alerts
            ORDER BY created_at ASC
        `;
        
        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} alerts in database`);
        
        // 2. Prepare alerts for JSON storage
        const alerts = result.rows.map(row => ({
            id: parseInt(row.id),
            profile_id: parseInt(row.profile_id),
            result_id: parseInt(row.result_id),
            rule_id: parseInt(row.rule_id),
            alert_level: row.alert_level,
            alert_type: row.alert_type,
            alert_message: row.alert_message,
            notification_sent: row.notification_sent || false,
            acknowledged: row.acknowledged || false,
            acknowledged_by: row.acknowledged_by || null,
            acknowledged_at: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
            resolved: row.resolved || false,
            resolved_at: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
            created_at: new Date(row.created_at).toISOString(),
            last_seen: null // Will be populated during deduplication
        }));
        
        // 3. Deduplicate alerts
        console.log('Deduplicating alerts...');
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
        
        // Process duplicates
        const deduplicatedAlerts = [];
        const resolvedAlerts = alerts.filter(a => a.resolved);
        
        Object.entries(alertGroups).forEach(([key, groupAlerts]) => {
            if (groupAlerts.length > 1) {
                console.log(`Found ${groupAlerts.length} duplicate alerts for ${key}`);
                
                // Keep the first one and update its last_seen
                const keepAlert = groupAlerts[0];
                const latestAlert = groupAlerts[groupAlerts.length - 1];
                
                keepAlert.last_seen = latestAlert.created_at;
                keepAlert.updated_at = new Date().toISOString();
                
                deduplicatedAlerts.push(keepAlert);
            } else {
                // No duplicates
                deduplicatedAlerts.push(groupAlerts[0]);
            }
        });
        
        // Combine with resolved alerts
        const finalAlerts = [...deduplicatedAlerts, ...resolvedAlerts];
        
        console.log(`After deduplication: ${finalAlerts.length} alerts (from ${alerts.length})`);
        
        // 4. Write to JSON file
        const alertsFile = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
        
        // Backup existing file
        try {
            const existing = await fs.readFile(alertsFile, 'utf8');
            const backupFile = alertsFile + '.backup-' + Date.now();
            await fs.writeFile(backupFile, existing);
            console.log(`Backed up existing alerts to: ${backupFile}`);
        } catch (error) {
            console.log('No existing alerts file to backup');
        }
        
        // Write migrated alerts
        await fs.writeFile(alertsFile, JSON.stringify(finalAlerts, null, 2));
        console.log(`Successfully migrated ${finalAlerts.length} alerts to JSON storage!`);
        
        // 5. Show summary
        console.log('\nMigration Summary:');
        console.log(`- Total alerts in database: ${result.rows.length}`);
        console.log(`- Resolved alerts: ${resolvedAlerts.length}`);
        console.log(`- Active alerts before dedup: ${alerts.length - resolvedAlerts.length}`);
        console.log(`- Active alerts after dedup: ${deduplicatedAlerts.length}`);
        console.log(`- Total alerts in JSON: ${finalAlerts.length}`);
        
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await pool.end();
    }
}

// Run migration
if (require.main === module) {
    migrateAlerts();
}