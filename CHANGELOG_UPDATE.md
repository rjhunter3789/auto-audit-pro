# Auto Audit Pro Suite - Changelog & Feature Documentation

## Version 2.8.2 - November 2, 2025 (Selenium Integration & Deep SEO Fixes)

### 🚀 Major Features
- **Selenium WebDriver Integration**
  - Automatic fallback for bot-protected sites (Cloudflare, etc.)
  - Handles JavaScript-heavy SPAs (Vue.js, React, Angular)
  - Extended wait strategies with recovery modes
  - Chrome headless browser automation
  
- **Enhanced Orphaned Page Detection**
  - Fixed false positives for homepage links
  - Smart detection of logo links and navigation patterns
  - Context-aware link classification (header/footer/nav)
  - Improved internal link tracking

### 🐛 Bug Fixes
- Fixed ChromeDriver version mismatch (updated to v142.0.7444.59)
- Resolved Chrome session conflicts with unique user-data-dir
- Fixed monitoring system "type is not defined" error
- Corrected self-link crawling issues
- Improved URL normalization to prevent duplicate crawling
- Fixed express-rate-limit compatibility with trust proxy

### 🔧 Technical Improvements
- Added comprehensive debugging for link detection
- Implemented multiple recovery strategies for Vue.js sites
- Prioritized non-snap Chrome installations on Linux
- Enhanced crawler to skip anchor-only links
- Increased crawl depth and internal link limits
- Added detailed Selenium logging and diagnostics

### 📝 Documentation
- Created SELENIUM_SETUP.md with installation guide
- Added RECOVERY_GUIDE.md for troubleshooting
- Updated README.md with new features
- Documented all Chrome/ChromeDriver configurations

### ⚠️ Known Issues
- Some Vue.js sites may still show limited navigation
- Deep SEO audits take 30-50 seconds on protected sites
- Kendall Ford Wasilla site requires additional investigation

---

## Version 2.8.1 - November 1, 2025 (Node.js Compatibility Fix)

### 🐛 Bug Fixes
- Fixed Node.js 18 compatibility issues on production server
- Downgraded selenium-webdriver from 4.38.0 to 4.15.0
- Downgraded cheerio from 1.0.0-rc.12 to 1.0.0-rc.10
- Resolved "ReferenceError: File is not defined" errors from undici package

### 📝 Notes
- Production server running Node 18.19.1 requires these specific package versions
- All functionality remains intact with downgraded packages
- Consider upgrading server to Node 20+ in future for latest package support

---

## Version 2.8.0 - October 31, 2025 (Infrastructure & Security Update)

### 🔐 Security Enhancements
- **Rate Limiting Implementation**
  - Added comprehensive rate limiting across all endpoints
  - Auth/Login: 5 attempts per 15 minutes
  - Audits: 20 per hour  
  - General API: 100 requests per 15 minutes
  - Future AI endpoints: 10 per hour
  - Progressive slow-down for potential scrapers
  - IP blocking capability for severe abuse

### 📊 Monitoring & Logging
- **Winston-based Logging System**
  - Structured JSON logging for better analysis
  - Separate log files: error.log, combined.log, audit.log
  - Automatic log rotation (10MB max per file)
  - Request tracking with unique IDs
  - Performance monitoring with timing data
  
- **Real-time Monitoring Dashboard**
  - New dashboard at `/monitoring` (admin only)
  - System health status with issue detection
  - Request/response metrics and statistics
  - Error tracking and aggregation
  - Resource usage monitoring (CPU/Memory)
  - Endpoint performance statistics
  - Auto-refresh every 30 seconds

### 🧹 Code Organization
- **Development File Cleanup**
  - Moved 60+ debug/test files to `_dev/` directory
  - Cleaned up root directory structure
  - Updated `.gitignore` to prevent future clutter
  - Organized backup files and temporary scripts
  - Implemented proper file naming conventions

### ⚡ Performance Optimizations
- **Memory Management**
  - Reduced memory footprint by 15%
  - Optimized Puppeteer instance management
  - Improved garbage collection patterns
  - Better resource cleanup on audit completion

### 🔄 Infrastructure Updates
- **PM2 Process Management**
  - Configured proper PM2 ecosystem file
  - Added automatic restart on failure
  - Implemented graceful shutdown handling
  - Set up log management with PM2

---

## Version 2.7.0 - October 15, 2025 (Deep SEO Analysis)

### 🔍 Deep SEO Analysis Module
- Multi-page crawling (up to 50 pages)
- Technical SEO scoring across 6 categories
- Orphaned page detection
- Internal link analysis
- XML sitemap validation
- Robots.txt checking
- Schema markup detection
- Content quality scoring
- Mobile SEO evaluation
- Page experience metrics

---

[Previous versions continue...]