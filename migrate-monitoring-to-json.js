const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:JLRAutoAudit2025!@localhost:5432/auto_audit_pro',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
    console.log('Starting migration of monitoring data to JSON...');
    
    const dataDir = path.join(__dirname, 'data', 'monitoring');
    
    try {
        // 1. Migrate profiles
        console.log('\n1. Migrating profiles...');
        const profilesResult = await dbPool.query('SELECT * FROM monitoring_profiles');
        const profiles = profilesResult.rows;
        console.log(`Found ${profiles.length} profiles in database`);
        
        const profilesFile = path.join(dataDir, 'profiles.json');
        await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2));
        console.log(`Saved ${profiles.length} profiles to profiles.json`);
        
        // 2. Migrate results
        console.log('\n2. Migrating results...');
        const resultsResult = await dbPool.query('SELECT * FROM monitoring_results ORDER BY check_timestamp DESC LIMIT 1000');
        const results = resultsResult.rows.map(r => ({
            ...r,
            issues_found: typeof r.issues_found === 'string' ? JSON.parse(r.issues_found) : r.issues_found,
            metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics
        }));
        console.log(`Found ${results.length} results in database`);
        
        const resultsFile = path.join(dataDir, 'results.json');
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        console.log(`Saved ${results.length} results to results.json`);
        
        // 3. Migrate alerts
        console.log('\n3. Migrating alerts...');
        const alertsResult = await dbPool.query('SELECT * FROM alert_history ORDER BY created_at DESC');
        const alerts = alertsResult.rows;
        console.log(`Found ${alerts.length} alerts in database`);
        
        const alertsFile = path.join(dataDir, 'alerts.json');
        await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));
        console.log(`Saved ${alerts.length} alerts to alerts.json`);
        
        console.log('\nMigration complete!');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await dbPool.end();
    }
}

// Run migration
migrate();