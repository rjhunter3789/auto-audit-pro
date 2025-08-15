/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Fix alert acknowledge and resolve endpoints to use JSON storage
 */

const fs = require('fs');
const path = require('path');

// Read the current server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if the acknowledge endpoint exists
const acknowledgePattern = /\/api\/monitoring\/alerts\/.*\/acknowledge/;
const resolvePattern = /\/api\/monitoring\/alerts\/.*\/resolve/;

let needsEndpoints = false;

if (!acknowledgePattern.test(serverContent)) {
    console.log('⚠️  Acknowledge endpoint not found - needs to be added');
    needsEndpoints = true;
}

if (!resolvePattern.test(serverContent)) {
    console.log('⚠️  Resolve endpoint not found - needs to be added');
    needsEndpoints = true;
}

if (needsEndpoints) {
    // Find a good place to add the endpoints (after other monitoring endpoints)
    const insertAfter = '/api/monitoring/alerts/:profileId';
    const insertPosition = serverContent.lastIndexOf(insertAfter);
    
    if (insertPosition !== -1) {
        // Find the end of this endpoint
        let braceCount = 0;
        let inEndpoint = false;
        let endPosition = insertPosition;
        
        for (let i = insertPosition; i < serverContent.length; i++) {
            if (serverContent[i] === '{') {
                braceCount++;
                inEndpoint = true;
            } else if (serverContent[i] === '}') {
                braceCount--;
                if (inEndpoint && braceCount === 0) {
                    endPosition = i + 1;
                    break;
                }
            }
        }
        
        // Find the next line after the closing
        while (endPosition < serverContent.length && serverContent[endPosition] !== '\n') {
            endPosition++;
        }
        
        const newEndpoints = `

// Acknowledge an alert
app.put('/api/monitoring/alerts/:alertId/acknowledge', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { acknowledged_by } = req.body;
        
        // Use JSON storage
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        // Get the alert
        const alerts = await jsonStorage.getAlerts();
        const alertIndex = alerts.findIndex(a => a.id == alertId);
        
        if (alertIndex === -1) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        // Update the alert
        alerts[alertIndex].acknowledged = true;
        alerts[alertIndex].acknowledged_at = new Date().toISOString();
        alerts[alertIndex].acknowledged_by = acknowledged_by || 'User';
        
        // Save back to file
        const fs = require('fs').promises;
        const alertsPath = require('path').join(__dirname, 'data', 'monitoring', 'alerts.json');
        await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
        
        res.json({ success: true, alert: alerts[alertIndex] });
        
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
});

// Resolve an alert
app.put('/api/monitoring/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        
        // Use JSON storage
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        // Get the alert
        const alerts = await jsonStorage.getAlerts();
        const alertIndex = alerts.findIndex(a => a.id == alertId);
        
        if (alertIndex === -1) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        // Update the alert
        alerts[alertIndex].resolved = true;
        alerts[alertIndex].resolved_at = new Date().toISOString();
        
        // Save back to file
        const fs = require('fs').promises;
        const alertsPath = require('path').join(__dirname, 'data', 'monitoring', 'alerts.json');
        await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
        
        res.json({ success: true, alert: alerts[alertIndex] });
        
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});`;
        
        serverContent = serverContent.slice(0, endPosition) + newEndpoints + serverContent.slice(endPosition);
        
        // Write the updated content back
        fs.writeFileSync(serverPath, serverContent);
        
        console.log('✅ Added acknowledge and resolve endpoints');
    } else {
        console.log('❌ Could not find where to insert the endpoints');
    }
} else {
    console.log('✅ Alert endpoints already exist');
}

// Also fix the getAlerts method in json-storage if needed
const jsonStoragePath = path.join(__dirname, 'lib', 'json-storage.js');
let jsonStorageContent = fs.readFileSync(jsonStoragePath, 'utf8');

// Check if getAlerts method exists
if (!jsonStorageContent.includes('async getAlerts(')) {
    console.log('⚠️  getAlerts method missing in json-storage.js - adding it');
    
    // Find where to add the method (after getResults)
    const insertAfter = 'async getLatestResult(profileId) {';
    const methodEnd = jsonStorageContent.indexOf(insertAfter);
    
    if (methodEnd !== -1) {
        // Find the end of this method
        let braceCount = 0;
        let endPos = methodEnd;
        for (let i = methodEnd; i < jsonStorageContent.length; i++) {
            if (jsonStorageContent[i] === '{') braceCount++;
            if (jsonStorageContent[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endPos = i + 1;
                    break;
                }
            }
        }
        
        const getAlertsMethod = `

    async getAlerts() {
        const alerts = await fs.readFile(this.alertsFile, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        return alerts;
    }`;
        
        jsonStorageContent = jsonStorageContent.slice(0, endPos) + getAlertsMethod + jsonStorageContent.slice(endPos);
        fs.writeFileSync(jsonStoragePath, jsonStorageContent);
        console.log('✅ Added getAlerts method to json-storage.js');
    }
}

console.log('\n📝 Alert functionality should now work!');
console.log('Restart the server and try clicking Acknowledge/Resolve buttons.');