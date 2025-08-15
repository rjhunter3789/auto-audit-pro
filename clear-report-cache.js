#!/usr/bin/env node

/*
 * Clear Report Template Cache
 * This script helps ensure CSS changes to report templates take effect
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Clearing report template cache...\n');

// Touch the report template files to update their modification time
const templateFiles = [
    'views/reports-dealer-style.html',
    'views/reports.html',
    'views/reports-new.html',
    'views/reports-group.html'
];

templateFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const now = new Date();
        fs.utimesSync(filePath, now, now);
        console.log(`✅ Updated timestamp for ${file}`);
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
});

console.log('\n📝 CSS Changes Summary:');
console.log('- Increased body top padding to 100px');
console.log('- Added 3D text shadow effect to h1 headers');
console.log('- Added cache-busting query string to CSS link');
console.log('- Added !important flag to ensure styles apply');

console.log('\n🚀 Next Steps:');
console.log('1. Restart the server: pm2 restart auto-audit');
console.log('2. Clear browser cache: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
console.log('3. Run a new audit to see the updated report style');

console.log('\n✨ Done!');