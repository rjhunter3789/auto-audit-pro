# Quick Start: Basic User System

## Step 1: Create User Storage File

```javascript
// data/users.json
{
  "users": [
    {
      "id": "admin",
      "email": "nakapaahu@gmail.com",
      "password": "AutoAudit2025!",
      "dealership": "Auto Audit Pro",
      "role": "admin",
      "subscriptionTier": "enterprise",
      "subscriptionEnd": "2099-12-31",
      "isActive": true
    },
    {
      "id": "demo-dealer",
      "email": "demo@priceford.com", 
      "password": "DemoPass123!",
      "dealership": "Price Ford",
      "role": "dealer",
      "subscriptionTier": "professional",
      "subscriptionEnd": "2025-12-31",
      "isActive": true
    }
  ]
}
```

## Step 2: Update Login System

```javascript
// In server.js, update login route:
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Load users
    const users = JSON.parse(fs.readFileSync('./data/users.json')).users;
    
    // Find user
    const user = users.find(u => 
        (u.email === username || u.id === username) && 
        u.password === password &&
        u.isActive
    );
    
    if (user) {
        // Check subscription
        if (new Date(user.subscriptionEnd) < new Date()) {
            return res.redirect('/subscription-expired');
        }
        
        // Set session
        req.session.authenticated = true;
        req.session.username = user.id;
        req.session.dealership = user.dealership;
        req.session.role = user.role;
        req.session.isAdmin = user.role === 'admin';
        req.session.subscriptionTier = user.subscriptionTier;
        
        res.redirect('/');
    } else {
        res.redirect('/login?error=1');
    }
});
```

## Step 3: Filter Data by Dealership

```javascript
// Update audit list to show only user's audits
app.get('/api/audits', checkAuth, async (req, res) => {
    let audits = await getAudits();
    
    // Filter by dealership unless admin
    if (req.session.role !== 'admin') {
        audits = audits.filter(a => 
            a.dealerInfo?.name === req.session.dealership
        );
    }
    
    res.json(audits);
});
```

## Step 4: Create Simple Admin Panel

```html
<!-- views/admin-users.html -->
<!DOCTYPE html>
<html>
<head>
    <title>User Management - Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1>User Management</h1>
        
        <button class="btn btn-primary mb-3" onclick="showAddUser()">
            Add New Dealer
        </button>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Dealership</th>
                    <th>Email</th>
                    <th>Tier</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="userList"></tbody>
        </table>
    </div>
    
    <script>
        // Load and display users
        async function loadUsers() {
            const response = await fetch('/api/admin/users');
            const users = await response.json();
            
            const tbody = document.getElementById('userList');
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.dealership}</td>
                    <td>${user.email}</td>
                    <td>${user.subscriptionTier}</td>
                    <td>${user.subscriptionEnd}</td>
                    <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                        <button onclick="editUser('${user.id}')" class="btn btn-sm btn-warning">Edit</button>
                        <button onclick="toggleUser('${user.id}')" class="btn btn-sm btn-danger">
                            ${user.isActive ? 'Disable' : 'Enable'}
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        loadUsers();
    </script>
</body>
</html>
```

## Step 5: Quick Onboarding Email

```javascript
// When creating new dealer account
function sendWelcomeEmail(dealer) {
    const emailContent = `
    Welcome to Auto Audit Pro Suite!
    
    Your account has been created:
    
    Login URL: https://autoauditpro.io/login
    Username: ${dealer.email}
    Password: ${dealer.tempPassword}
    
    Please change your password after first login.
    
    Getting Started:
    1. Login to your dashboard
    2. Add your website for monitoring
    3. Run your first audit
    4. Check your ROI calculations
    
    Need help? Reply to this email.
    
    Best regards,
    The Auto Audit Pro Team
    `;
    
    // Send via your email service
}
```

## Pricing Page Content

```markdown
# Simple, Transparent Pricing

## Professional Plan - $199/month
✓ Up to 3 dealership locations
✓ Website monitoring every 59 minutes
✓ Instant alerts when issues found
✓ ROI calculations and reports
✓ Lead loss prevention
✓ Email & phone support

Most dealerships lose 5-10 leads per month due to website issues.
At $199/month, Auto Audit Pro pays for itself with just ONE recovered lead.

[Start Free Trial] [Schedule Demo]
```

## Your Week 1 TODO:
1. Create users.json file
2. Update login to use it
3. Add dealership filtering
4. Create one test dealer account
5. Test the full flow

This gives you a working multi-dealer system without complex databases!