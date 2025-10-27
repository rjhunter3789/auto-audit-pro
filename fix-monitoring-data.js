#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixMonitoringData() {
    console.log('\n🔧 Auto Audit Pro - Monitoring Data Fix\n');
    
    try {
        // Clear all monitoring data files to start fresh
        const monitoringDir = path.join(__dirname, 'data', 'monitoring');
        
        // Initialize clean data files
        const filesToReset = {
            'profiles.json': [],
            'results.json': [],
            'alerts.json': []
        };
        
        console.log('📝 Resetting monitoring data files...\n');
        
        for (const [filename, defaultContent] of Object.entries(filesToReset)) {
            const filePath = path.join(monitoringDir, filename);
            try {
                // Create backup
                const content = await fs.readFile(filePath, 'utf8');
                if (content && content !== '[]' && content !== '{}') {
                    const backupPath = filePath + '.backup-' + Date.now();
                    await fs.writeFile(backupPath, content);
                    console.log(`✅ Backed up ${filename}`);
                }
                
                // Reset file
                await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
                console.log(`✅ Reset ${filename}`);
            } catch (error) {
                console.log(`⚠️  Could not process ${filename}: ${error.message}`);
            }
        }
        
        // Also check for any pending request files in main data directory
        const dataDir = path.join(__dirname, 'data');
        const possiblePendingFiles = [
            'monitoring-requests.json',
            'pending-monitoring.json',
            'pending-requests.json'
        ];
        
        console.log('\n📝 Checking for pending request files...\n');
        
        for (const filename of possiblePendingFiles) {
            const filePath = path.join(dataDir, filename);
            try {
                await fs.access(filePath);
                const content = await fs.readFile(filePath, 'utf8');
                const backupPath = filePath + '.backup-' + Date.now();
                await fs.writeFile(backupPath, content);
                await fs.writeFile(filePath, '[]');
                console.log(`✅ Cleared ${filename}`);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        console.log('\n✅ Monitoring data has been reset!');
        console.log('📌 All pending requests and monitoring profiles have been cleared.');
        console.log('📌 You can now start fresh by adding websites through the dashboard.\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixMonitoringData();