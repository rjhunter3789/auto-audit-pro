/**
 * User Management System
 * Handles user authentication and management for multiple dealers
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to users file
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = {
        users: [
            {
                id: "admin",
                email: process.env.ADMIN_USERNAME || "admin",
                username: process.env.ADMIN_USERNAME || "admin",
                password: process.env.ADMIN_PASSWORD || "AutoAudit2025!",
                dealership: "Auto Audit Pro",
                role: "admin",
                subscriptionTier: "enterprise",
                subscriptionEnd: "2099-12-31",
                isActive: true,
                createdDate: new Date().toISOString(),
                lastLogin: null
            }
        ]
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
}

/**
 * Load all users from file
 */
function getUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data).users || [];
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

/**
 * Save users to file
 */
function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

/**
 * Authenticate user
 */
function authenticateUser(username, password) {
    const users = getUsers();
    
    // Check both username and email
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password &&
        u.isActive
    );
    
    if (!user) {
        // Fallback to environment variables for backward compatibility
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'AutoAudit2025!';
        
        if (username === adminUsername && password === adminPassword) {
            return {
                id: 'admin',
                username: adminUsername,
                email: 'nakapaahu@gmail.com',
                dealership: 'Auto Audit Pro',
                role: 'admin',
                subscriptionTier: 'enterprise',
                subscriptionEnd: '2099-12-31',
                isActive: true
            };
        }
        
        return null;
    }
    
    // Check subscription
    if (new Date(user.subscriptionEnd) < new Date()) {
        return { ...user, subscriptionExpired: true };
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    const allUsers = getUsers();
    const userIndex = allUsers.findIndex(u => u.id === user.id);
    if (userIndex >= 0) {
        allUsers[userIndex] = user;
        saveUsers(allUsers);
    }
    
    return user;
}

/**
 * Create new user
 */
function createUser(userData) {
    const users = getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === userData.email || u.username === userData.username)) {
        throw new Error('User already exists');
    }
    
    // Generate ID
    const newUser = {
        id: userData.username.toLowerCase().replace(/\s+/g, '-'),
        ...userData,
        createdDate: new Date().toISOString(),
        lastLogin: null,
        isActive: true
    };
    
    users.push(newUser);
    if (saveUsers(users)) {
        return newUser;
    }
    
    throw new Error('Failed to create user');
}

/**
 * Update user
 */
function updateUser(userId, updates) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex < 0) {
        throw new Error('User not found');
    }
    
    users[userIndex] = { ...users[userIndex], ...updates };
    
    if (saveUsers(users)) {
        return users[userIndex];
    }
    
    throw new Error('Failed to update user');
}

/**
 * Get user by ID
 */
function getUserById(userId) {
    const users = getUsers();
    return users.find(u => u.id === userId);
}

/**
 * Get users by dealership
 */
function getUsersByDealership(dealership) {
    const users = getUsers();
    return users.filter(u => u.dealership === dealership);
}

module.exports = {
    getUsers,
    authenticateUser,
    createUser,
    updateUser,
    getUserById,
    getUsersByDealership
};