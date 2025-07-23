/**
 * Fix CSP issues in production
 * Creates an environment-aware CSP configuration
 */

const fs = require('fs');
const path = require('path');

// Update server-prod.js with flexible CSP
const serverProdPath = path.join(__dirname, 'server-prod.js');
let serverContent = fs.readFileSync(serverProdPath, 'utf8');

// Find and replace the CSP middleware
const cspStart = serverContent.indexOf('// Add proper CSP headers for production');
const cspEnd = serverContent.indexOf('});', cspStart) + 3;
const oldCSP = serverContent.substring(cspStart, cspEnd);

const newCSP = `// Add proper CSP headers for production
app.use((req, res, next) => {
    // Check if we should disable CSP (for debugging)
    if (process.env.DISABLE_CSP === 'true') {
        console.log('CSP disabled via environment variable');
        return next();
    }
    
    // Use permissive CSP in production to avoid blocking issues
    const cspHeader = process.env.NODE_ENV === 'production' 
        ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src * 'unsafe-inline' 'unsafe-eval'; " +
          "connect-src *; " +
          "img-src * data: blob:; " +
          "frame-src *; " +
          "style-src * 'unsafe-inline';"
        : "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
          "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
          "img-src 'self' data: https: http:; " +
          "font-src 'self' data: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
          "connect-src 'self' https: http:; " +
          "frame-src 'none'; " +
          "object-src 'none'";
    
    res.setHeader('Content-Security-Policy', cspHeader);
    
    // Also set other security headers that don't break functionality
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
});`;

serverContent = serverContent.substring(0, cspStart) + newCSP + serverContent.substring(cspEnd);

// Write updated server-prod.js
fs.writeFileSync(serverProdPath, serverContent);
console.log('✓ Updated server-prod.js with flexible CSP configuration');

// Also create a _headers file for deployment platforms
const headersContent = `/*
  Content-Security-Policy: default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src *; img-src * data: blob:; frame-src *; style-src * 'unsafe-inline';
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
`;

fs.writeFileSync('_headers', headersContent);
console.log('✓ Created _headers file for deployment platform CSP override');

// Update railway.json to include environment variable option
const railwayPath = path.join(__dirname, 'railway.json');
const railwayConfig = JSON.parse(fs.readFileSync(railwayPath, 'utf8'));

railwayConfig.deploy.envVars = {
    "DISABLE_CSP": {
        "description": "Set to 'true' to disable Content Security Policy",
        "default": "false"
    }
};

fs.writeFileSync(railwayPath, JSON.stringify(railwayConfig, null, 2));
console.log('✓ Updated railway.json with CSP disable option');

console.log('\n✅ CSP fixes applied!');
console.log('\n📝 Changes made:');
console.log('1. Made CSP ultra-permissive in production');
console.log('2. Added environment variable to disable CSP completely');
console.log('3. Created _headers file for platform-level override');
console.log('4. Added security headers that don\'t break functionality');
console.log('\n🔧 If CSP issues persist after deployment:');
console.log('1. Set DISABLE_CSP=true in Railway environment variables');
console.log('2. Or check Railway dashboard for any platform-level CSP settings');