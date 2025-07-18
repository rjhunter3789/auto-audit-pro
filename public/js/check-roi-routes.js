// Test script to check if ROI routes are available
async function checkROIRoutes() {
    console.log('Checking ROI routes...');
    
    try {
        // Check if the route exists by making a HEAD request
        const response = await fetch('/api/roi/config', {
            method: 'HEAD',
            credentials: 'same-origin'
        });
        
        if (response.status === 404) {
            console.error('❌ ROI routes NOT loaded - server needs restart');
            console.log('The /api/roi/config endpoint returns 404');
            console.log('This means the server is still running OLD code');
            return false;
        } else if (response.status === 401) {
            console.log('✅ ROI routes ARE loaded! (401 = needs auth, route exists)');
            return true;
        } else if (response.status === 200) {
            console.log('✅ ROI routes ARE loaded! (200 = authenticated)');
            return true;
        } else {
            console.log(`⚠️ Unexpected status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('Error checking routes:', error);
        return false;
    }
}

// Auto-run when loaded
checkROIRoutes().then(exists => {
    if (!exists) {
        console.log('\n🔄 ACTION REQUIRED: Server restart needed');
        console.log('The ROI configuration routes have been added to the code but are not active.');
        console.log('The server at autoauditpro.io needs to be restarted to load the new routes.');
    }
});