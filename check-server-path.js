/**
 * Check where server.js thinks it's running from
 */

const path = require('path');
const fs = require('fs');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const usersPath = path.join(__dirname, 'data', 'users.json');
console.log('\nLooking for users.json at:', usersPath);
console.log('File exists:', fs.existsSync(usersPath));

// Check Windows path
const windowsPath = usersPath.replace(/\//g, '\\');
console.log('\nWindows path:', windowsPath);
console.log('File exists (Windows):', fs.existsSync(windowsPath));

// List what's in the data directory
const dataDir = path.join(__dirname, 'data');
console.log('\nContents of data directory:');
try {
    const files = fs.readdirSync(dataDir);
    files.forEach(file => console.log('  -', file));
} catch (error) {
    console.log('  Error reading directory:', error.message);
}