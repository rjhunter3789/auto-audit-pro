# Auto Audit Pro - Complete Documentation
**Version**: 2.6.7  
**Last Updated**: August 6, 2025  
**Author**: JL Robinson  
**Production URL**: https://autoauditpro.io  

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Features](#features)
4. [Installation & Setup](#installation--setup)
5. [API Documentation](#api-documentation)
6. [User Guide](#user-guide)
7. [Security & Authentication](#security--authentication)
8. [Monitoring System](#monitoring-system)
9. [Troubleshooting](#troubleshooting)
10. [Deployment Guide](#deployment-guide)

## Overview

Auto Audit Pro is a comprehensive web application that performs in-depth analysis of automotive dealership websites. It evaluates 8 critical categories to provide actionable insights for improving digital presence, lead generation, and compliance.

### Current Status
- **Production**: Deployed on DigitalOcean VPS (146.190.39.214)
- **Version**: 2.6.7 with professional PDF reporting
- **Architecture**: Node.js + Express backend, Bootstrap 5 frontend
- **Process Manager**: PM2
- **Web Server**: Nginx with SSL

## System Architecture

### Technology Stack
- **Backend**: Node.js v18+ with Express.js
- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript
- **Database**: JSON file-based storage (data/ directory)
- **Testing Engine**: Selenium WebDriver + Cheerio
- **PDF Generation**: Browser print API with custom CSS
- **Monitoring**: Custom monitoring engine with cron scheduling
- **Authentication**: Express sessions with multi-user support

### Directory Structure
```
dealership-audit-mvp/
├── server.js                 # Main application server
├── package.json             # Dependencies and scripts
├── .env                     # Environment configuration
├── data/                    # JSON data storage
│   ├── users.json          # User accounts
│   ├── monitoring/         # Monitoring system data
│   │   ├── profiles.json   # Monitoring profiles
│   │   ├── results.json    # Check results
│   │   ├── alerts.json     # Alert history
│   │   └── rules.json      # Alert rules
│   └── roi-config.json     # ROI configuration
├── lib/                     # Core libraries
│   ├── audit-tests.js      # 8-category testing logic
│   ├── selenium-wrapper.js # Browser automation
│   ├── monitoring-engine.js # Website monitoring
│   ├── notification-service.js # Email/SMS alerts
│   └── group-analysis.js   # Dealer group detection
├── middleware/              # Express middleware
│   ├── auth.js            # Authentication
│   └── security-monitor.js # Security monitoring
├── views/                   # HTML templates
│   ├── index.html         # Main audit interface
│   ├── reports-dealer-style.html # Audit reports
│   ├── monitoring-dashboard.html # Monitoring UI
│   └── admin-settings.html # Admin panel
└── public/                  # Static assets
    ├── css/                # Stylesheets
    │   └── pdf-professional.css # PDF styling
    └── js/                 # Client-side JavaScript
```

## Features

### Core Features

#### 1. Website Auditing System
- **Quick Audit** (30 seconds): Homepage-only analysis
- **Comprehensive Audit** (60-90 seconds): Multi-page deep analysis
- **Custom Audit**: Select specific pages to analyze
- **Dealer Group Detection**: Automatic multi-location analysis

#### 2. 8-Category Testing Framework
1. **Basic Connectivity**: SSL, DNS, server response
2. **Performance Testing**: PageSpeed, Core Web Vitals
3. **SEO Analysis**: Meta tags, schema, sitemaps
4. **User Experience**: Navigation, forms, mobile UX
5. **Content Analysis**: Inventory, contact info, hours
6. **Technical Validation**: Code quality, broken links
7. **Brand Compliance**: OEM guidelines, disclaimers
8. **Lead Generation**: Forms, CTAs, chat, tracking

#### 3. Page-Specific Analysis
- **Vehicle Detail Pages (VDP)**: Image galleries, pricing, specs, CTAs
- **Service Pages**: Scheduling, pricing, specials, amenities
- **Inventory Pages**: Search filters, sorting, mobile optimization
- **Specials Pages**: Expiration dates, disclaimers, CTAs

#### 4. Professional Reporting
- **PDF Export**: Print-optimized with page breaks and headers
- **Implementation Roadmap**: Prioritized action items with timelines
- **ROI Projections**: Lead increase and conversion estimates
- **Interactive Tooltips**: Hover definitions for technical terms
- **Comprehensive Glossary**: Full definitions reference

#### 5. Website Monitoring System
- **Automated Checks**: Scheduled monitoring at custom intervals
- **Multi-Level Alerts**: GREEN (OK), YELLOW (Warning), RED (Critical)
- **Email/SMS Notifications**: Instant alerts for issues
- **Performance Tracking**: Historical data and trends
- **Custom Alert Rules**: Define conditions for notifications

### Recent Enhancements (v2.6.7)

#### Professional PDF Styling (August 5, 2025)
- Custom print stylesheet with professional typography
- Automatic page numbering (Page X of Y)
- Copyright footer on each page
- Smart page break controls
- Cover page for reports
- Hidden UI elements in print view

#### 403 Error Handling (August 1-2, 2025)
- 403 errors now show as YELLOW (informational) alerts
- Professional bot identification in User-Agent
- Bot information page at /bot-info.html
- Whitelist instructions for site operators

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- Chrome/Chromium browser
- Git

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/dealership-audit-mvp.git
cd dealership-audit-mvp

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables
```env
# Google PageSpeed API (required)
GOOGLE_PAGESPEED_API_KEY=your_api_key_here

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=AutoAudit2025!
SESSION_SECRET=your_secret_key_here

# Email configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# ScrapingDog API (currently disabled)
SCRAPINGDOG_API_KEY=your_key_here
```

### Start Development Server
```bash
# Run with npm
npm start

# Or with PM2
pm2 start server.js --name auto-audit-dev
```

Access at http://localhost:3002

## API Documentation

### Web Interface Endpoints

#### Main Pages
- `GET /` - Main audit interface
- `POST /audit` - Submit website for analysis
- `GET /monitoring` - Monitoring dashboard (auth required)
- `GET /admin/settings` - Admin settings (admin only)
- `GET /definitions` - Glossary and definitions

#### Authentication
- `GET /login` - Login page
- `POST /login` - Process login
- `GET /logout` - Logout user
- `GET /api/user/current` - Get current user info

### REST API Endpoints

#### Audit API
```javascript
// Start new audit
POST /api/audit
Body: {
  "domain": "example.com",
  "auditType": "comprehensive", // quick, comprehensive, custom
  "selectedPages": ["inventory", "service"] // for custom only
}

// Get audit status
GET /api/audit/:id

// Get audit history
GET /api/audits
```

#### Monitoring API
```javascript
// Get all profiles
GET /api/monitoring/profiles

// Create monitoring profile
POST /api/monitoring/profiles
Body: {
  "name": "Dealer Name",
  "website_url": "https://example.com",
  "check_frequency": 60, // minutes
  "notify_email": "email@example.com"
}

// Manual check
POST /api/monitoring/check/:profileId

// Get check results
GET /api/monitoring/results/:profileId
```

## User Guide

### Running an Audit

1. **Navigate to https://autoauditpro.io**
2. **Enter dealership domain** (e.g., smithford.com)
3. **Select audit type**:
   - Quick: Homepage only (30 seconds)
   - Comprehensive: Full analysis (60-90 seconds)
   - Custom: Choose specific pages
4. **Click "Start Analysis"**
5. **View real-time progress** as each category is tested
6. **Review detailed report** with scores and recommendations

### Understanding Scores

#### Overall Score (0-100)
- **80-100**: Excellent - Minor improvements only
- **60-79**: Good - Some important fixes needed
- **0-59**: Needs Improvement - Critical issues present

#### Category Scores (1-5)
- **5/5**: Excellent performance
- **4/5**: Good with minor issues
- **3/5**: Average, needs attention
- **2/5**: Poor, significant problems
- **1/5**: Critical failures

### Using the Monitoring System

1. **Access Monitoring Dashboard** at /monitoring (login required)
2. **Add New Profile**:
   - Click "Add New Monitoring Profile"
   - Enter dealership name and URL
   - Set check frequency (default: 60 minutes)
   - Add notification email/phone
3. **View Results**:
   - GREEN: All systems operational
   - YELLOW: Minor issues or warnings
   - RED: Critical problems detected
4. **Configure Alerts**:
   - Edit alert rules in admin settings
   - Set custom thresholds
   - Choose notification methods

## Security & Authentication

### User Roles
1. **Admin**:
   - Full system access
   - Manage monitoring profiles
   - Configure alert rules
   - View all reports
   
2. **Dealer**:
   - Run audits
   - View own reports
   - Limited monitoring access

### Authentication System
- Session-based authentication
- 7-day session timeout with rolling refresh
- Secure password storage
- CSRF protection

### Default Credentials
```
Admin User:
Username: admin
Password: AutoAudit2025!

Dealer User:
Username: dealer
Password: dealer123
```

**Important**: Change default passwords immediately after deployment!

## Monitoring System

### Features
- **Automated Checks**: Run at configured intervals
- **Smart Scheduling**: Prevents overlapping checks
- **Alert Rules**: 13 pre-configured rules
- **Notification Service**: Email and SMS support
- **Historical Tracking**: Stores all check results

### Alert Levels
- **GREEN**: Everything operational
- **YELLOW**: Warnings (e.g., 403 bot protection)
- **RED**: Critical issues requiring attention

### Default Alert Rules
1. Website unreachable
2. SSL certificate issues
3. HTTP errors (500, 502, 503)
4. No inventory found
5. Missing contact information
6. Performance degradation
7. Bot protection (403) - YELLOW alert
8. And more...

## Troubleshooting

### Common Issues

#### 1. Chrome/Selenium Errors
```bash
# Install Chrome dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-chromedriver

# For other systems, ensure Chrome is in PATH
```

#### 2. Port Already in Use
```bash
# Find process using port 3002
lsof -i :3002

# Kill process
kill -9 <PID>
```

#### 3. Session/Authentication Issues
```bash
# Clear session data
rm -rf data/sessions/

# Restart server
pm2 restart auto-audit
```

#### 4. 403 Errors on Monitoring
- This is normal for sites with bot protection
- Alerts show as YELLOW (informational)
- Sites can whitelist our bot using /bot-info.html

### Debug Mode
```bash
# Run with debug output
DEBUG=* node server.js
```

## Deployment Guide

### DigitalOcean VPS Deployment

#### 1. Create Droplet
- Ubuntu 22.04 LTS
- Basic plan ($6/month)
- 1GB RAM minimum

#### 2. Initial Setup
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install dependencies
apt install -y git nginx chromium-browser chromium-chromedriver

# Install PM2
npm install -g pm2
```

#### 3. Deploy Application
```bash
# Clone repository
cd /opt
git clone https://github.com/yourusername/auto-audit-pro.git
cd auto-audit-pro

# Install dependencies
npm install

# Create .env file
nano .env

# Start with PM2
pm2 start server.js --name auto-audit
pm2 save
pm2 startup
```

#### 4. Configure Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

#### 5. SSL Setup
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com
```

### Maintenance

#### Backup Data
```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/auto-audit-$DATE.tar.gz /opt/auto-audit-pro/data/
```

#### Update Application
```bash
cd /opt/auto-audit-pro
git pull
npm install
pm2 restart auto-audit
```

#### Monitor Logs
```bash
# PM2 logs
pm2 logs auto-audit

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## License & Copyright

© 2025 JL Robinson. All Rights Reserved.

This software is proprietary and protected by copyright law.
Unauthorized reproduction or distribution is prohibited.

---

For support: nakapaahu@gmail.com