/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Test if server can read users.json
 */

const fs = require('fs');
const path = require('path');

console.log('Testing file read from server perspective...\n');

const usersPath = path.join(__dirname, 'data', 'users.json');
console.log('Looking for file at:', usersPath);
console.log('File exists:', fs.existsSync(usersPath));

if (fs.existsSync(usersPath)) {
    try {
        const usersData = fs.readFileSync(usersPath, 'utf8');
        console.log('\nFile contents:');
        console.log(usersData);
        
        const users = JSON.parse(usersData);
        console.log('\nParsed users:', users.length);
        
        // Test exact login logic
        const username = 'dealer';
        const password = 'dealer123';
        
        const user = users.find(u => 
            (u.username === username || u.email === username) && 
            u.password === password
        );
        
        console.log('\nLogin test for dealer/dealer123:', user ? 'WOULD SUCCEED' : 'WOULD FAIL');
        
    } catch (error) {
        console.error('Error reading/parsing file:', error);
    }
} else {
    console.log('\n❌ File does not exist!');
}

// Also check current working directory
console.log('\nCurrent working directory:', process.cwd());