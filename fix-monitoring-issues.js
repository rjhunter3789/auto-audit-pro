/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Fixes for Monitoring System Issues
 * 
 * Issues to fix:
 * 1. Alert timestamps not updating
 * 2. Acknowledge button not working
 * 3. PENDING CHECK persisting
 * 4. Websites disappearing
 */

// Add these fixes to server.js

// 1. FIX: Acknowledge alert endpoint (add after other monitoring routes)
app.put('/api/monitoring/alerts/:alertId/acknowledge', checkAuth, async (req, res) => {
    try {
        const { alertId } = req.params;
        const { acknowledged_by } = req.body;
        
        const query = `
            UPDATE monitoring_alerts 
            SET acknowledged = true, 
                acknowledged_at = NOW(), 
                acknowledged_by = $1
            WHERE id = $2
            RETURNING *`;
        
        const result = await pool.query(query, [acknowledged_by || req.session.username, alertId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
});

// 2. FIX: Resolve alert endpoint
app.put('/api/monitoring/alerts/:alertId/resolve', checkAuth, async (req, res) => {
    try {
        const { alertId } = req.params;
        
        const query = `
            UPDATE monitoring_alerts 
            SET resolved = true, 
                resolved_at = NOW()
            WHERE id = $2
            RETURNING *`;
        
        const result = await pool.query(query, [alertId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

// 3. FIX: Update the monitoring profiles endpoint to better handle timestamps
// (Already fixed in previous update)

// 4. FIX: For saving profiles, ensure atomic writes
// In json-storage.js, update saveProfiles method:
async saveProfiles(profiles) {
    try {
        // Write to temp file first
        const tempFile = this.profilesFile + '.tmp';
        await fs.writeFile(tempFile, JSON.stringify(profiles, null, 2));
        
        // Then rename (atomic operation)
        await fs.rename(tempFile, this.profilesFile);
        
        console.log('Profiles saved successfully:', profiles.length);
        return true;
    } catch (error) {
        console.error('Error saving profiles:', error);
        return false;
    }
}

// 5. FIX: For the timestamp issue, ensure monitoring results are properly saved
// In monitoring-engine.js, after each check:
async saveResult(profileId, result) {
    try {
        // Ensure timestamp is always set
        result.check_timestamp = new Date().toISOString();
        result.profile_id = profileId;
        
        // Save to results
        await this.storage.addResult(result);
        
        // Also update the profile's last check time
        const profiles = await this.storage.getProfiles();
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
            profile.last_check = result.check_timestamp;
            profile.last_status = result.overall_status;
            await this.storage.saveProfiles(profiles);
        }
        
        return result;
    } catch (error) {
        console.error('Error saving monitoring result:', error);
        throw error;
    }
}

// 6. Debug helper - Add this route to check data integrity
app.get('/api/monitoring/debug', requireAdmin, async (req, res) => {
    try {
        const profiles = await pool.query('SELECT * FROM monitoring_profiles');
        const results = await pool.query('SELECT * FROM monitoring_results ORDER BY check_timestamp DESC LIMIT 10');
        const alerts = await pool.query('SELECT * FROM monitoring_alerts WHERE resolved = false');
        
        res.json({
            profiles: profiles.rows,
            latestResults: results.rows,
            activeAlerts: alerts.rows,
            storage: {
                profilesFile: require('./data/monitoring/profiles.json'),
                resultsCount: require('./data/monitoring/results.json').length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});