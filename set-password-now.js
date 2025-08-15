/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

const fs = require('fs');
const path = require('path');

// Set the new password here
const NEW_PASSWORD = 'Admin123!';  // Change this to whatever you want

// Update users.json
const usersPath = path.join(__dirname, 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

const adminUser = users.find(u => u.username === 'admin');
if (adminUser) {
    adminUser.password = NEW_PASSWORD;
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    
    console.log('✓ Password changed successfully!');
    console.log('Username: admin');
    console.log('Password: ' + NEW_PASSWORD);
} else {
    console.error('Admin user not found!');
}