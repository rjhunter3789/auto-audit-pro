# Auto Audit Pro - Enterprise Dealership Website Analysis Platform

A comprehensive website analysis tool specifically designed for automotive dealerships, providing instant insights into website performance, SEO, content quality, lead generation effectiveness, and technical compliance.

## 🚀 Features

### Core Analysis
- **8-Category Testing System**: Comprehensive analysis across Performance, SEO, Content, Accessibility, Security, Mobile, Lead Generation, and Brand Compliance
- **Real Google PageSpeed API Integration**: Accurate Core Web Vitals and performance metrics
- **Professional PDF Reports**: Detailed, branded reports with actionable recommendations

### Deep SEO Analysis (NEW)
- **Multi-Page Crawling**: Analyzes up to 50 pages of your website
- **Orphaned Page Detection**: Finds pages with no internal links
- **Site Architecture Analysis**: Reviews URL structure and internal linking
- **JavaScript Site Support**: Selenium WebDriver fallback for SPAs and bot-protected sites
- **Smart Link Detection**: Identifies global navigation and contextual links

### Advanced Features
- **Website Monitoring**: Schedule regular checks with email notifications
- **Lead Generation Testing**: Form detection, click-to-call validation, chat verification
- **Brand Compliance**: OEM logo detection, disclaimer validation
- **Security Analysis**: SSL validation, mixed content detection
- **Content Quality**: Readability scores, keyword density analysis

## 📋 Requirements

- Node.js 18.x or higher
- Chrome/Chromium browser (for Selenium support)
- ChromeDriver (matching Chrome version)
- 2GB+ RAM recommended
- Ubuntu 20.04+ or similar Linux distribution

## 🔧 Installation

### 1. Clone Repository
```bash
git clone https://github.com/rjhunter3789/auto-audit-pro.git
cd auto-audit-pro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings:
# - PORT=3002
# - GOOGLE_PAGESPEED_API_KEY=your_key_here
# - CHROME_BIN=/usr/bin/chromium-browser
```

### 4. Install Chrome/ChromeDriver
```bash
# Install Chromium
sudo apt-get update
sudo apt-get install chromium-browser

# Install matching ChromeDriver
# See SELENIUM_SETUP.md for detailed instructions
```

### 5. Start Application
```bash
# Development
npm run dev

# Production with PM2
pm2 start server.js --name auto-audit
pm2 save
pm2 startup
```

## 🚦 Usage

### Web Interface
Navigate to `http://localhost:3002` (or your configured port)

### API Endpoints
- `POST /api/audit` - Start new audit
- `GET /api/audit/:id` - Get audit status
- `GET /api/audits` - List recent audits
- `GET /api/deep-seo-audit` - Run comprehensive SEO analysis
- `GET /monitoring` - View monitoring dashboard

### Running a Deep SEO Audit
```javascript
// Example API call
POST /api/deep-seo-audit
{
  "url": "https://example-dealership.com",
  "options": {
    "maxPages": 50,
    "includeScreenshots": true
  }
}
```

## 🛠 Technology Stack

- **Backend**: Node.js 18.x, Express.js 4.x
- **Analysis Engines**: 
  - Puppeteer (screenshots, rendering)
  - Selenium WebDriver 4.15.0 (JavaScript sites)
  - Axios (HTTP requests)
  - Cheerio (HTML parsing)
- **PDF Generation**: PDFKit with custom styling
- **Logging**: Winston with rotation
- **Process Management**: PM2
- **Rate Limiting**: express-rate-limit

## 🔍 Troubleshooting

### Common Issues

1. **"Unable to access website" errors**
   - Site may be bot-protected
   - Check Chrome/ChromeDriver installation
   - See `RECOVERY_GUIDE.md`

2. **High memory usage**
   - Normal for Puppeteer/Selenium
   - Increase server RAM or adjust `maxUrlsToCrawl`

3. **Slow Deep SEO audits**
   - JavaScript sites take 30-50 seconds
   - This is normal for Selenium rendering

### Debug Commands
```bash
# Check logs
pm2 logs auto-audit --lines 100

# Monitor performance
pm2 monit

# Check Chrome
chromium-browser --version
chromedriver --version
```

## 📚 Documentation

- `CHANGELOG.md` - Version history and updates
- `RECOVERY_GUIDE.md` - Troubleshooting and recovery procedures
- `SELENIUM_SETUP.md` - Detailed Selenium/Chrome configuration
- `DEPLOYMENT_STATUS.md` - Production deployment notes

## 🔐 Security

- Rate limiting: 100 requests per 15 minutes per IP
- Input validation on all endpoints
- XSS protection via Helmet.js
- CSRF protection enabled
- No sensitive data stored

## 📄 License

© 2025 JL Robinson. All Rights Reserved.

This is proprietary software. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

## 🤝 Support

For issues and questions:
- GitHub Issues: https://github.com/rjhunter3789/auto-audit-pro/issues
- Email: nakapaahu@gmail.com

---

**Current Version**: 2.8.3 (November 2, 2025)

## Recent Updates

### v2.8.3 (Nov 2, 2025)
- Fixed Deep SEO issue counting and reporting
- Added inline fix recommendations for all SEO issues
- Enhanced issue descriptions with actionable advice
- Improved UI with red-bordered issue highlights

### v2.8.2 (Nov 2, 2025)  
- Selenium WebDriver integration for bot-protected sites
- Fixed orphaned page detection
- Chrome/ChromeDriver compatibility fixes
- Extended wait strategies for Vue.js/React sites