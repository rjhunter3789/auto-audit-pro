# Dealer Access Management Guide

## Current Setup
Right now you have a single admin login. To manage multiple dealers, you need:

## 1. User Management System

### Option A: Simple Database Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    email VARCHAR(255),
    dealership_name VARCHAR(255),
    role ENUM('admin', 'dealer', 'staff'),
    created_date TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    subscription_end DATE
);
```

### Option B: Quick Implementation with JSON
```javascript
// data/users.json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "dealership": "Auto Audit Pro"
    },
    {
      "id": 2,
      "username": "priceford",
      "role": "dealer",
      "dealership": "Price Ford",
      "subscriptionEnd": "2025-12-31"
    }
  ]
}
```

## 2. Access Control Features

### For Dealers:
- Login with unique credentials
- Access only their dealership data
- View their audit history
- Configure their ROI settings
- Monitor their websites

### For Admin (You):
- Create/disable dealer accounts
- Set subscription expiration dates
- View all dealer activity
- Monitor usage across all dealers

## 3. Co-worker Access

### Role Types:
1. **Admin** - Full system access (you)
2. **Manager** - Can create dealer accounts, view reports
3. **Support** - Can view dealer data, help with issues
4. **Dealer** - Customer access only

### Implementation:
```javascript
// Add to login system
if (user.role === 'admin' || user.role === 'manager') {
    // Show admin dashboard
} else if (user.role === 'support') {
    // Show support dashboard
} else {
    // Show dealer dashboard
}
```

## 4. Subscription Management

Track who has paid and when access expires:
```javascript
// Check subscription on login
if (user.subscriptionEnd < new Date()) {
    return res.redirect('/subscription-expired');
}
```

## 5. Activity Logging

Track what each dealer does:
```javascript
// Log all important actions
logActivity({
    userId: req.session.userId,
    dealership: req.session.dealership,
    action: 'audit_started',
    timestamp: new Date()
});
```