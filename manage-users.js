#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function manageUsers() {
    try {
        console.log('\n👥 Auto Audit Pro - User Management Tool\n');
        
        // Load users
        const usersPath = path.join(__dirname, 'data', 'users.json');
        let users = {};
        
        try {
            const usersData = await fs.readFile(usersPath, 'utf8');
            users = JSON.parse(usersData);
        } catch (error) {
            console.log('❌ Error loading users file.');
            return;
        }
        
        // Display current users
        console.log('📋 Current Users:\n');
        console.log('#'.padEnd(5) + 'Username'.padEnd(20) + 'Role'.padEnd(15) + 'Is Admin');
        console.log('-'.repeat(55));
        
        const userList = Object.entries(users);
        userList.forEach(([username, userData], index) => {
            const role = userData.role || 'user';
            const isAdmin = userData.isAdmin || role === 'admin';
            console.log(
                `${index + 1}`.padEnd(5) +
                username.padEnd(20) + 
                role.padEnd(15) + 
                (isAdmin ? '✅ Yes' : '❌ No')
            );
        });
        
        console.log('\n📌 Options:');
        console.log('1. Remove a user');
        console.log('2. Add a new user');
        console.log('3. Exit');
        
        const choice = await question('\nSelect an option (1-3): ');
        
        if (choice === '1') {
            // Remove user
            const userNum = await question('Enter the number of the user to remove: ');
            const index = parseInt(userNum) - 1;
            
            if (isNaN(index) || index < 0 || index >= userList.length) {
                console.log('❌ Invalid selection.');
                rl.close();
                return;
            }
            
            const [username, userData] = userList[index];
            
            // Check if trying to remove last admin
            const adminCount = userList.filter(([_, data]) => 
                data.isAdmin || data.role === 'admin'
            ).length;
            
            if ((userData.isAdmin || userData.role === 'admin') && adminCount === 1) {
                console.log('❌ Cannot remove the last admin user!');
                rl.close();
                return;
            }
            
            console.log(`\n⚠️  About to remove user: ${username} (${userData.role || 'user'})`);
            const confirm = await question('Are you sure? (yes/no): ');
            
            if (confirm.toLowerCase() === 'yes') {
                // Create backup
                const backupPath = usersPath + '.backup-' + Date.now();
                await fs.writeFile(backupPath, JSON.stringify(users, null, 2));
                console.log(`📦 Backup created: ${path.basename(backupPath)}`);
                
                // Remove user
                delete users[username];
                
                // Save updated users
                await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
                
                console.log(`✅ Successfully removed user: ${username}`);
            } else {
                console.log('❌ Removal cancelled.');
            }
            
        } else if (choice === '2') {
            // Add new user
            const username = await question('Enter new username: ');
            const password = await question('Enter password: ');
            const isAdmin = await question('Make this user an admin? (y/n): ');
            
            if (users[username]) {
                console.log('❌ Username already exists!');
                rl.close();
                return;
            }
            
            users[username] = {
                password: password,
                role: isAdmin.toLowerCase() === 'y' ? 'admin' : 'user',
                isAdmin: isAdmin.toLowerCase() === 'y'
            };
            
            await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
            console.log(`✅ Successfully added user: ${username}`);
            
        } else if (choice === '3') {
            console.log('👋 Exiting...');
        } else {
            console.log('❌ Invalid option.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

manageUsers();