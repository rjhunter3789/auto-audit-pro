# Auto Audit Pro Version Information

**Current Version**: 2.8.3  
**Release Date**: November 2, 2025  
**Node.js Required**: 18.x or higher  
**Chrome/Chromium**: 142.0.7444.59  
**ChromeDriver**: 142.0.7444.59  

## Version Summary

Auto Audit Pro v2.8.3 is a comprehensive website analysis platform designed specifically for automotive dealerships. This version includes significant improvements to the Deep SEO audit functionality, providing more accurate issue detection and actionable recommendations.

### Key Capabilities
- 8-category comprehensive website analysis
- Deep SEO multi-page crawling (up to 50 pages)
- Selenium WebDriver fallback for JavaScript/bot-protected sites
- Real-time website monitoring with email alerts
- Professional PDF report generation
- Lead generation effectiveness testing
- Brand compliance verification

### Recent Improvements (v2.8.3)
- Fixed issue counting showing "0" when problems exist
- Added detailed fix recommendations for every SEO issue
- Enhanced UI with inline issue explanations
- Improved report clarity with red-bordered issue highlights

### System Requirements
- Ubuntu 20.04+ or similar Linux distribution
- 2GB+ RAM (4GB recommended)
- Node.js 18.x (18.19.1 tested)
- Chrome/Chromium browser installed
- PM2 for process management

### API Integrations
- Google PageSpeed Insights API
- SMTP for email notifications
- Twilio for SMS alerts (optional)

### Security Features
- Rate limiting (100 requests/15 min per IP)
- Session management with secure cookies
- XSS protection via Helmet.js
- Input validation on all endpoints
- Audit trail logging

For installation instructions, see README.md
For troubleshooting, see RECOVERY_GUIDE.md
For changelog, see CHANGELOG.md