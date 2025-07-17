/**
 * Fix JSONStorage usage in server.js
 * The module exports 'storage' not 'JSONStorage' class
 */

const fs = require('fs');
const path = require('path');

// Read the current server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Replace all instances of JSONStorage class instantiation with the exported storage object
const replacements = [
    {
        old: `        const JSONStorage = require('./lib/json-storage');
        const jsonStorage = new JSONStorage();`,
        new: `        const { storage: jsonStorage } = require('./lib/json-storage');`
    },
    {
        old: `        // Use JSON storage instead of database
        const JSONStorage = require('./lib/json-storage');
        const jsonStorage = new JSONStorage();`,
        new: `        // Use JSON storage instead of database
        const { storage: jsonStorage } = require('./lib/json-storage');`
    }
];

let changesCount = 0;

replacements.forEach(({ old, new: newText }) => {
    if (serverContent.includes(old)) {
        serverContent = serverContent.replace(old, newText);
        changesCount++;
        console.log(`✅ Fixed JSONStorage usage (instance ${changesCount})`);
    }
});

// Also fix any remaining patterns
const pattern = /const JSONStorage = require\(['"]\.\/lib\/json-storage['"]\);\s*const jsonStorage = new JSONStorage\(\);/g;
const replacement = "const { storage: jsonStorage } = require('./lib/json-storage');";

const additionalMatches = serverContent.match(pattern);
if (additionalMatches) {
    serverContent = serverContent.replace(pattern, replacement);
    changesCount += additionalMatches.length;
    console.log(`✅ Fixed ${additionalMatches.length} additional JSONStorage patterns`);
}

// Write the updated content back
fs.writeFileSync(serverPath, serverContent);

console.log(`\n📝 Summary: Fixed ${changesCount} instances of JSONStorage usage`);
console.log('The server should now work correctly with JSON storage.');
console.log('\nRestart the server to apply changes!');