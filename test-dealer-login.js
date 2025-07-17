/**
 * Test dealer login logic
 */

const fs = require('fs');
const path = require('path');

console.log('Testing dealer login...\n');

// Read users.json
try {
    const usersData = fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8');
    const users = JSON.parse(usersData);
    
    console.log('Users in database:');
    users.forEach(user => {
        console.log(`- Username: ${user.username}, Password: ${user.password}, Role: ${user.role}, isAdmin: ${user.isAdmin}`);
    });
    
    // Test dealer credentials
    const testUsername = 'dealer';
    const testPassword = 'dealer123';
    
    console.log('\nTesting login with:');
    console.log(`Username: ${testUsername}`);
    console.log(`Password: ${testPassword}`);
    
    const authenticatedUser = users.find(u => 
        (u.username === testUsername || u.email === testUsername) && 
        u.password === testPassword
    );
    
    if (authenticatedUser) {
        console.log('\n✅ Login would succeed!');
        console.log('User details:', authenticatedUser);
    } else {
        console.log('\n❌ Login would fail!');
        console.log('No matching user found');
    }
    
} catch (error) {
    console.error('Error reading users.json:', error);
}

// Also check the login route in server.js
console.log('\n📝 Make sure the server was restarted after updating the login route!');