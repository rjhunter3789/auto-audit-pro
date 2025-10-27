#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function checkUserPermissions() {
    try {
        console.log('\n🔍 Auto Audit Pro - User Permission Checker\n');
        
        // Check if users file exists
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(usersData);
        
        console.log('📋 Registered Users:\n');
        console.log('Username'.padEnd(20) + 'Role'.padEnd(15) + 'Is Admin');
        console.log('-'.repeat(50));
        
        for (const [username, userData] of Object.entries(users)) {
            const role = userData.role || 'user';
            const isAdmin = userData.isAdmin || role === 'admin';
            console.log(
                username.padEnd(20) + 
                role.padEnd(15) + 
                (isAdmin ? '✅ Yes' : '❌ No')
            );
        }
        
        console.log('\n💡 Note: Only admin users can remove websites from monitoring.');
        console.log('   If you need admin access, contact your system administrator.\n');
        
        // Ask if user wants to check a specific username
        const checkSpecific = await question('Check a specific username? (y/n): ');
        
        if (checkSpecific.toLowerCase() === 'y') {
            const username = await question('Enter username: ');
            
            if (users[username]) {
                console.log('\n📊 User Details:');
                console.log(JSON.stringify(users[username], null, 2));
                
                if (!users[username].isAdmin && users[username].role !== 'admin') {
                    const makeAdmin = await question('\nMake this user an admin? (y/n): ');
                    if (makeAdmin.toLowerCase() === 'y') {
                        users[username].isAdmin = true;
                        users[username].role = 'admin';
                        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
                        console.log('✅ User promoted to admin successfully!');
                    }
                }
            } else {
                console.log('❌ User not found');
            }
        }
        
    } catch (error) {
        console.error('Error checking permissions:', error.message);
        console.log('\n💡 Tip: Make sure the server has been run at least once to create user data.');
    } finally {
        rl.close();
    }
}

checkUserPermissions();