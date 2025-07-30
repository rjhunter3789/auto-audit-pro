const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('AutoAuditPro - Quick Password Change\n');

rl.question('Enter new password for admin: ', (newPassword) => {
    // Basic validation
    if (newPassword.length < 8) {
        console.error('\nError: Password must be at least 8 characters');
        process.exit(1);
    }

    // Update users.json
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    const adminUser = users.find(u => u.username === 'admin');
    if (adminUser) {
        adminUser.password = newPassword;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        
        console.log('\n✓ Password changed successfully!');
        console.log('Username: admin');
        console.log('Password: ' + newPassword);
        console.log('\nYou can now login at http://localhost:3000/login');
    } else {
        console.error('Admin user not found!');
    }
    
    rl.close();
});