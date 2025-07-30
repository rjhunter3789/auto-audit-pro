const fs = require('fs');
const path = require('path');

console.log('Preparing server.js for Railway deployment...\n');

// Read current server.js
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

// Check for common deployment issues
console.log('Checking for deployment issues...');

// 1. Check PORT configuration
if (!serverContent.includes('process.env.PORT')) {
    console.log('❌ Missing process.env.PORT - Railway requires this!');
} else {
    console.log('✅ PORT configuration found');
}

// 2. Check for syntax errors by trying to parse
try {
    new Function(serverContent);
    console.log('✅ No obvious syntax errors');
} catch (error) {
    console.log('❌ Syntax error detected:', error.message);
}

// 3. Create a minimal test server for debugging
const testServer = `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

// Health check endpoint - MUST be before any auth middleware
app.get('/api/health', (req, res) => {
    console.log('[HEALTH CHECK] Request received');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.6.7',
        message: 'Auto Audit Pro is running'
    });
});

// Test root endpoint
app.get('/', (req, res) => {
    res.send('Auto Audit Pro Server Running on port ' + PORT);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on port \${PORT}\`);
    console.log('Health check available at: /api/health');
});
`;

// Save test server
fs.writeFileSync(path.join(__dirname, 'server-test.js'), testServer);

console.log('\n✅ Created server-test.js for debugging');
console.log('\nTo test locally:');
console.log('1. node server-test.js');
console.log('2. curl http://localhost:3002/api/health');

// Create deployment checklist
const checklist = `# Railway Deployment Fix Checklist

## Current Issues:
1. Health check failing during deployment
2. Possible syntax errors in server.js

## Quick Fix Steps:

### Option 1: Use Test Server
1. Rename server.js to server-backup.js
2. Rename server-test.js to server.js  
3. Commit and push
4. Once deployed, gradually add features back

### Option 2: Fix Current Server
1. Check for duplicate route definitions
2. Ensure health endpoint is before auth middleware
3. Remove any syntax errors
4. Test locally with: PORT=3002 node server.js
5. Commit and push

### Option 3: Rollback to Last Working Version
1. git log --oneline (find last working commit)
2. git checkout [commit-hash] server.js
3. git commit -m "Rollback server.js to working version"
4. git push

## Railway Specific Requirements:
- Must use process.env.PORT
- Health endpoint must return 200 status
- Server must bind to 0.0.0.0
- No syntax errors allowed
`;

fs.writeFileSync(path.join(__dirname, 'DEPLOYMENT_FIX.md'), checklist);

console.log('\n✅ Created DEPLOYMENT_FIX.md with instructions');
console.log('\nRecommended immediate action:');
console.log('1. Stop making changes to server.js');
console.log('2. Test the current server locally');
console.log('3. If it works locally, the issue is Railway-specific');
console.log('4. Consider using the test server temporarily');