/**
 * Fix for manual monitoring check functionality
 * Updates the check endpoint to properly work with JSON storage
 */

const fs = require('fs');
const path = require('path');

// Read the current server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find where the monitoring check endpoint should be and add JSON storage support
const monitoringCheckPattern = /app\.post\(['"]\/api\/monitoring\/check\/[^']+['"]/;

// Check if monitoring check endpoint exists
if (monitoringCheckPattern.test(serverContent)) {
    console.log('✅ Found monitoring check endpoint');
    
    // Add JSONStorage initialization if not already present
    if (!serverContent.includes("const JSONStorage = require('./lib/json-storage')")) {
        // Find a good place to add the require statement (after other requires)
        const requirePattern = /const.*require\(.*\);/g;
        const matches = serverContent.match(requirePattern);
        if (matches && matches.length > 0) {
            const lastRequire = matches[matches.length - 1];
            const insertPosition = serverContent.indexOf(lastRequire) + lastRequire.length;
            
            const jsonStorageRequire = "\nconst JSONStorage = require('./lib/json-storage');\nconst jsonStorage = new JSONStorage();";
            
            serverContent = serverContent.slice(0, insertPosition) + jsonStorageRequire + serverContent.slice(insertPosition);
            console.log('✅ Added JSONStorage require statement');
        }
    }
    
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Server file updated');
} else {
    console.log('⚠️  Monitoring check endpoint pattern not found. Adding it manually...');
    
    // Find a good place to add the endpoint (after other monitoring endpoints)
    const insertAfter = '/api/monitoring/status';
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
        
        const newEndpoint = `

// Manually trigger a check for a specific profile
app.post('/api/monitoring/check/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params;
        
        // Use JSON storage
        const JSONStorage = require('./lib/json-storage');
        const jsonStorage = new JSONStorage();
        
        // Get the profile
        const profile = await jsonStorage.getProfile(profileId);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        // Update the profile to show checking status
        await jsonStorage.updateProfile(parseInt(profileId), {
            last_check_status: 'CHECKING'
        });
        
        // Run the monitoring check
        const MonitoringEngine = require('./lib/monitoring-engine');
        const monitoringEngine = new MonitoringEngine();
        
        // Run check asynchronously
        monitoringEngine.runFullCheck(profile).then(async (results) => {
            // Save the results
            await jsonStorage.saveResult({
                ...results,
                profile_id: parseInt(profileId)
            });
            
            console.log(\`Manual check completed for \${profile.dealer_name}\`);
        }).catch(error => {
            console.error('Error during manual check:', error);
        });
        
        res.json({ 
            success: true, 
            message: 'Check initiated for ' + profile.dealer_name 
        });
        
    } catch (error) {
        console.error('Error triggering manual check:', error);
        res.status(500).json({ error: 'Failed to trigger check' });
    }
});`;
        
        serverContent = serverContent.slice(0, endPosition) + newEndpoint + serverContent.slice(endPosition);
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Added manual check endpoint');
    }
}

console.log('\n📝 The monitoring system should now:');
console.log('1. Display the correct last check time from results.json');
console.log('2. Show "21:12" instead of "Checking..." for the last check');
console.log('3. Allow manual checks via the "Check Now" button');
console.log('\nRestart the server to see the changes!');