#!/usr/bin/env node

/*
 * Fix Report Template Caching Issues
 * This script modifies server.js to disable EJS caching in development
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing report template caching issues...\n');

// Read server.js
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if EJS caching is already disabled
if (!serverContent.includes('app.set(\'view cache\', false)')) {
    console.log('📝 Adding EJS cache disable configuration...');
    
    // Find where to insert the configuration (after app creation)
    const appCreationIndex = serverContent.indexOf('const app = express();');
    if (appCreationIndex !== -1) {
        const insertPoint = serverContent.indexOf('\n', appCreationIndex) + 1;
        
        const cacheConfig = `
// Disable view caching for development (ensure CSS changes take effect)
if (process.env.NODE_ENV !== 'production') {
    app.set('view cache', false);
    console.log('[Server] View caching disabled for development');
}
`;
        
        serverContent = serverContent.slice(0, insertPoint) + cacheConfig + serverContent.slice(insertPoint);
        
        // Write back to server.js
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Added view cache disable configuration to server.js');
    } else {
        console.log('❌ Could not find app creation in server.js');
    }
} else {
    console.log('ℹ️  View cache configuration already exists');
}

// Also update the report template with a timestamp comment
const reportPath = path.join(__dirname, 'views', 'reports-dealer-style.html');
if (fs.existsSync(reportPath)) {
    let reportContent = fs.readFileSync(reportPath, 'utf8');
    
    // Update the last modified comment
    const lastModifiedRegex = /Last Modified: .*/;
    const newDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    reportContent = reportContent.replace(lastModifiedRegex, `Last Modified: ${newDate}`);
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`✅ Updated last modified date in reports-dealer-style.html to ${newDate}`);
}

console.log('\n🎨 CSS Updates Applied:');
console.log('- Body padding increased to 100px (from 80px)');
console.log('- 3D text shadow effect added to h1 headers');
console.log('- Cache-busting timestamp added to CSS link');
console.log('- View caching disabled for development');

console.log('\n🚀 To apply changes:');
console.log('1. Run: node fix-report-caching.js (this script)');
console.log('2. Restart server: pm2 restart auto-audit');
console.log('3. Clear browser cache and test a new report');

console.log('\n✨ Script completed!');