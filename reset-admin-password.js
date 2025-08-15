/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

const fs = require('fs');
const path = require('path');

// Load users
const usersPath = path.join(__dirname, 'data', 'users.json');
let users = [];

try {
    const usersData = fs.readFileSync(usersPath, 'utf8');
    users = JSON.parse(usersData);
    console.log('Current users loaded:', users.length);
} catch (error) {
    console.log('No existing users file, creating new one');
}

// Reset admin user
const adminUser = {
    id: "1",
    username: "admin",
    email: "admin@autoauditpro.com",
    password: "AutoAudit2025!",
    role: "admin",
    isAdmin: true,
    created_at: new Date().toISOString()
};

// Find and update or add admin
const adminIndex = users.findIndex(u => u.username === 'admin' || u.id === '1');
if (adminIndex >= 0) {
    users[adminIndex] = adminUser;
    console.log('Updated existing admin user');
} else {
    users.unshift(adminUser);
    console.log('Added new admin user');
}

// Save updated users
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log('\nAdmin password has been reset!');
console.log('Username: admin');
console.log('Password: AutoAudit2025!');
console.log('\nYou can now login at http://localhost:3000/login');