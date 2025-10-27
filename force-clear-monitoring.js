#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function forceClearMonitoring() {
    console.log('\n🔧 Force Clear All Monitoring Data\n');
    
    try {
        // Define all possible monitoring-related files
        const filesToClear = [
            // Main data directory
            'data/monitoring-profiles.json',
            'data/monitoring-history.json',
            'data/monitoring-alerts.json',
            'data/monitoring-requests.json',
            'data/pending-monitoring.json',
            'data/pending-requests.json',
            
            // Monitoring subdirectory
            'data/monitoring/profiles.json',
            'data/monitoring/results.json',
            'data/monitoring/alerts.json',
            'data/monitoring/history.json',
            'data/monitoring/pending.json',
            'data/monitoring/requests.json',
            
            // Session and cache files
            'sessions/store.db',
            'data/cache.json',
            'data/monitoring-cache.json'
        ];
        
        console.log('📋 Clearing all monitoring-related files...\n');
        
        for (const file of filesToClear) {
            const filePath = path.join(__dirname, file);
            try {
                await fs.access(filePath);
                const stats = await fs.stat(filePath);
                
                if (stats.size > 2) { // File has content
                    // Backup first
                    const backup = filePath + '.force-backup-' + Date.now();
                    await fs.copyFile(filePath, backup);
                    console.log(`📦 Backed up: ${file}`);
                }
                
                // Clear the file
                if (file.endsWith('.json')) {
                    await fs.writeFile(filePath, '[]');
                } else if (file.endsWith('.db')) {
                    await fs.unlink(filePath);
                }
                console.log(`✅ Cleared: ${file}`);
                
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        // Also clear any monitoring data in the main directory
        console.log('\n📋 Searching for any other monitoring files...\n');
        
        const dataDir = path.join(__dirname, 'data');
        const files = await fs.readdir(dataDir);
        
        for (const file of files) {
            if (file.includes('monitor') && file.endsWith('.json')) {
                const filePath = path.join(dataDir, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    if (content.includes('Evergreen') || content.includes('evergreen')) {
                        console.log(`🔍 Found monitoring data in: ${file}`);
                        await fs.writeFile(filePath, '[]');
                        console.log(`✅ Cleared: ${file}`);
                    }
                } catch (error) {
                    // Skip
                }
            }
        }
        
        console.log('\n✅ Force clear complete!');
        console.log('\n⚠️  IMPORTANT NEXT STEPS:');
        console.log('1. Stop the Auto Audit Pro server (Ctrl+C)');
        console.log('2. Clear your browser cache and cookies for this site');
        console.log('3. Restart the server: node server.js');
        console.log('4. Log in again as admin\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

forceClearMonitoring();