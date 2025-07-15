// Temporary script to show you what credentials to use
const path = require('path');
const fs = require('fs');

console.log('Checking your login credentials...\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✓ .env file found');
    
    // Read and parse .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let username, password;
    
    lines.forEach(line => {
        if (line.startsWith('ADMIN_USERNAME=')) {
            username = line.split('=')[1].trim();
        }
        if (line.startsWith('ADMIN_PASSWORD=')) {
            password = line.split('=')[1].trim();
        }
    });
    
    console.log('\nYour login credentials:');
    console.log('Username:', username || 'admin');
    console.log('Password:', password || 'AutoAudit2025!');
} else {
    console.log('✗ No .env file found');
    console.log('\nDefault credentials:');
    console.log('Username: admin');
    console.log('Password: AutoAudit2025!');
}

console.log('\nIf these don\'t work, the server is using hardcoded defaults.');