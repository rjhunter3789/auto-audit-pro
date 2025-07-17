/**
 * Create a dealer user for testing role-based UI
 */

const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function createDealerUser() {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        
        // Read existing users or create new array
        let users = [];
        try {
            const data = await fs.readFile(usersPath, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            console.log('No existing users.json found, creating new one');
        }
        
        // Create dealer user
        const dealerUser = {
            id: Date.now().toString(),
            username: 'dealer',
            email: 'dealer@priceford.com',
            password: await bcrypt.hash('dealer123', 10),
            role: 'dealer',
            dealership: 'Price Ford',
            isAdmin: false,
            created_at: new Date().toISOString(),
            subscription: {
                plan: 'professional',
                status: 'active',
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
            }
        };
        
        // Check if dealer user already exists
        const existingIndex = users.findIndex(u => u.username === 'dealer');
        if (existingIndex !== -1) {
            users[existingIndex] = dealerUser;
            console.log('✅ Updated existing dealer user');
        } else {
            users.push(dealerUser);
            console.log('✅ Created new dealer user');
        }
        
        // Also ensure admin user exists
        const adminIndex = users.findIndex(u => u.username === 'admin');
        if (adminIndex === -1) {
            const adminUser = {
                id: Date.now().toString() + '1',
                username: 'admin',
                email: 'admin@autoauditpro.com',
                password: await bcrypt.hash('AutoAudit2025!', 10),
                role: 'admin',
                isAdmin: true,
                created_at: new Date().toISOString()
            };
            users.push(adminUser);
            console.log('✅ Also created admin user');
        }
        
        // Save users file
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        
        console.log('\n📝 User accounts created:');
        console.log('\nAdmin login:');
        console.log('  Username: admin');
        console.log('  Password: AutoAudit2025!');
        console.log('\nDealer login:');
        console.log('  Username: dealer');
        console.log('  Password: dealer123');
        console.log('\n⚠️  Now you need to update the login route in server.js to use the user system!');
        
    } catch (error) {
        console.error('Error creating dealer user:', error);
    }
}

createDealerUser();