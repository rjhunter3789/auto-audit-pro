# Recovery Instructions - Auto Audit Pro

## Current Status (Updated: July 14, 2025 - Monitoring Fully Integrated into Auto Audit Pro)

### ✅ Website Monitoring Now Part of Auto Audit Pro
- **Date**: July 14, 2025 (Late Evening - Final Update)
- **Status**: Fully Integrated and Operational
- **Integration**: Monitoring is now seamlessly part of Auto Audit Pro platform

#### Integration Details:
1. **Homepage Integration**
   - Added prominent "NEW: 24/7 Website Monitoring" section
   - Red call-to-action box with traffic light explanation
   - Direct link to monitoring dashboard

2. **Report Integration**
   - All audit reports now include monitoring promotion
   - "Want 24/7 Monitoring for This Website?" CTA added
   - Seamless flow from audit → monitoring setup

3. **Navigation Integration**
   - Monitoring dashboard branded as "Auto Audit Pro - Website Monitoring"
   - "Back to Audits" navigation added
   - Unified user experience across platform

4. **Access Points**:
   - From homepage: Red monitoring section → "Open Monitoring Dashboard"
   - From audit reports: Monitoring CTA → "Setup Website Monitoring"
   - Direct URL: `http://localhost:3002/monitoring`

### ✅ Complete Monitoring System Features
- **Date**: July 14, 2025 (Late Evening)
- **Status**: Fully Implemented and Operational
- **Type**: Real-time website health monitoring ("Check Engine Light" for dealerships)

#### What Was Added:
1. **Complete Monitoring System**
   - 24/7 automated website checking
   - Traffic light alerts (RED/YELLOW/GREEN)
   - No database required - uses JSON storage
   - Dashboard at `/monitoring`

2. **Critical Issues Monitored**:
   - Website down/unreachable
   - SSL certificate problems
   - Contact forms not working
   - Zero inventory showing
   - Server errors
   - Extreme load times

3. **Files Created**:
   - `/lib/monitoring-engine.js` - Core monitoring logic
   - `/lib/monitoring-scheduler.js` - Automated scheduling
   - `/lib/notification-service.js` - Alert system
   - `/lib/json-storage.js` - Database-free storage
   - `/views/monitoring-dashboard.html` - UI dashboard
   - `/MONITORING-SETUP-GUIDE.md` - User guide

4. **Setup Required**:
   - Create data directory: `mkdir -p data/monitoring`
   - Optional: Configure SMTP in `.env` for email alerts
   - Access dashboard at `http://localhost:3002/monitoring`

### ✅ Application Status Check
- **Date**: July 14, 2025 (Evening)
- **Environment**: Local Development (WSL2)
- **Status**: Fully Operational with Selenium Support
- **Verification Results**:
  - Server running successfully on port 3002
  - Selenium WebDriver loaded and functional
  - Chromium browser available at `/snap/bin/chromium`
  - API health check: OK (v2.0.0)
  - All 8 testing categories operational
  - Website monitoring system active

## Previous Status (Updated: July 14, 2025 - Deployment Fixes)

### Critical Deployment Fixes - Railway Platform
- **Date**: July 14, 2025 (Late Evening)
- **Issue**: Deployment failing at healthcheck stage due to Chrome/Selenium dependencies
- **Resolution**: Made Selenium optional, app now deploys successfully

#### Deployment Architecture Changes
1. **Created Selenium Wrapper** (`/lib/selenium-wrapper.js`)
   - Gracefully handles when Selenium/Chrome not available
   - Falls back to Cheerio-only mode
   - Maintains API compatibility

2. **Modified Server Architecture**
   - Main server (`server.js`) now checks for Selenium availability
   - Created lightweight backup (`server-simple.js`) as fallback
   - All Selenium operations wrapped in availability checks

3. **Simplified Dependencies**
   - Removed Chrome/ChromeDriver from `nixpacks.toml`
   - Deployment now completes in under 2 minutes
   - Healthchecks pass immediately

#### Current Deployment Status
- **Platform**: Railway
- **Status**: ✅ Successfully Deployed
- **Mode**: Lightweight (Cheerio-only, no browser rendering)
- **Limitations**: 
  - No JavaScript execution on audited sites
  - No dynamic content analysis
  - Basic HTML parsing only
- **Full Features**: Available when running locally with Chrome

#### How to Deploy Successfully
```bash
# Ensure latest code
git pull origin main

# Railway will auto-deploy on push
git push origin main

# Or manual deploy
railway up
```

#### Running Locally with Full Features
```bash
# Install dependencies
npm install

# Run with full Selenium support
npm run start:full

# Or run lightweight version
npm run start:simple
```

## Current Status (Updated: July 14, 2025 - Evening)

### Latest Updates - Lead Performance UI Fixes & Settings
- **Date**: July 14, 2025 (Evening Update)

#### Fixed UI Issues in Lead Performance
- **Issue 1**: Dealer Performance Tiers container too tall
- **Fix**: Created `.tier-container` class to override fixed height
- **Implementation**:
  - Added `height: auto !important` to allow content-based sizing
  - Reduced padding from 2rem to 1.5rem
  - Applied class to the specific container
- **Files Modified**:
  - `/views/lead-performance.html` - CSS and HTML updates

#### Fixed Response Time Text Overflow
- **Issue**: "Total Responded" extending outside container
- **Fix**: Shortened text and added wrapping rules
- **Implementation**:
  - Changed "Total Responded" to "Responded"
  - Added CSS for word wrapping on h4 elements
  - Moved full description to subtext
- **Files Modified**:
  - `/views/lead-performance.html` - CSS and HTML updates

#### Implemented Complete Settings Tab
- **Feature**: Fully functional Settings & Configuration interface
- **Sections Created**:
  - Performance Benchmarks (3 settings)
  - Performance Tier Thresholds (3 settings)
  - ROI Calculation Parameters (2 settings)
  - Data & Display Preferences (3 settings)
- **Functionality Added**:
  - Save all settings to localStorage
  - Reset to industry defaults
  - Auto-load saved settings on page load
  - Success notifications
- **Files Modified**:
  - `/views/lead-performance.html` - Complete settings UI
  - `/public/js/lead-performance.js` - Settings management functions

#### Fixed Password Manager Interference
- **Issue**: LastPass logo persistently appearing in "Acceptable No-Response Rate" field
- **Fix**: Implemented comprehensive multi-layer password manager defeat strategy
- **Final Solution**:
  - Changed field ID from `targetNoResponse` to `metric_threshold_3` (generic naming)
  - Changed field name from `config_no_response_rate` to `display_metric_c` (unrelated to passwords)
  - Changed input type from "number" to "text" with `pattern="[0-9]*"` and `inputmode="numeric"`
  - Added readonly attribute with `onfocus="this.removeAttribute('readonly')"` trick
  - Implemented aggressive JavaScript that actively removes LastPass elements every 100ms
  - Added MutationObserver to catch dynamically injected elements
  - Applied comprehensive CSS overrides with `!important` on all background properties
  - Created wrapper div with hidden honeypot field
  - Added `autocomplete="nope"` (non-standard value)
- **Technical Details**:
  - JavaScript clones and replaces input to break LastPass event listeners
  - Monitors DOM for 10 seconds after page load
  - Removes any elements with IDs/classes containing "lastpass" or "__lpform"
  - Forces inline styles to override any injected CSS
- **Files Modified**:
  - `/views/lead-performance.html` - Restructured input field, added JavaScript monitor, CSS overrides
  - `/public/js/lead-performance.js` - Updated to use new field ID `metric_threshold_3`

#### Created Settings & Configuration Guide
- **Feature**: Comprehensive documentation for all settings
- **Content Includes**:
  - Detailed explanation for each setting
  - Default values with industry context
  - Impact indicators (High/Medium/Low)
  - Formulas and calculations
  - Best practices section
  - Professional styling matching Definitions page
- **Files Created**:
  - `/views/settings-guide.html` - Full guide page
- **Files Modified**:
  - `/server.js` - Added /settings-guide route
  - `/views/lead-performance.html` - Added guide link

## Current Status (Updated: July 14, 2025)

### Latest Updates - Enhanced Combined Insights
- **Date**: July 14, 2025

#### Eliminated Generic Insights
- **Issue**: "Top Website Issues Impacting Conversions" showing generic category scores instead of specific issues
- **Fix**: Completely rewrote impact analysis to show actual issues found during audit
- **Implementation**:
  - Prioritizes specific issues over category scores
  - Adds conversion-specific impact messaging for each issue type
  - Shows quantified impacts (e.g., "losing 30% of potential leads", "40% bounce rate")
  - Filters for issues that directly impact conversions
- **Files Modified**:
  - `/public/js/combined-insights.js` - Rewrote generateImpactAnalysis function

#### Made Opportunities Actionable
- **Issue**: Generic opportunities like "Website Optimization" and "Response Time Improvement"
- **Fix**: Dynamic opportunity generation based on actual issues found
- **Implementation**:
  - Groups issues by type to create targeted opportunities
  - Shows specific metrics and expected outcomes
  - Adds timeline estimates and specific action items
  - Includes dealer-specific lead response opportunities
- **Files Modified**:
  - `/public/js/combined-insights.js` - Rewrote generateOpportunities function
  - Enhanced opportunity cards with timeline and specifics display

#### Fixed Performance Comparison Chart
- **Issue**: Chart was blank due to JavaScript error
- **Root Cause**: `networkAvgConversion.toFixed is not a function` - value wasn't parsed as float
- **Fix**: Added parseFloat() to ensure numeric values
- **Files Modified**:
  - `/public/js/combined-insights.js` - Fixed generateCorrelationFeedback function
  - `/views/combined-insights.html` - Updated cache version to v=9

#### Enhanced Correlation Analysis
- **Change**: Added comprehensive feedback section to correlation analysis
- **Implementation**:
  - Performance categories: Strong Performer, Room for Improvement, Performance Gap
  - Detailed metrics comparison with expected vs actual conversion rates
  - Specific recommendations based on performance gaps
  - Industry context and ROI implications
- **Files Modified**:
  - `/public/js/combined-insights.js` - Added generateCorrelationFeedback function

#### Updated Definitions & Glossary
- **Change**: Added new Analytics & Insights section
- **Implementation**:
  - 10 new terms explaining correlation analysis concepts
  - Covers expected conversion rates, performance gaps, ROI projections
  - Updated sidebar navigation to include new section
- **Files Modified**:
  - `/views/definitions.html` - Added Analytics & Insights section and navigation link

## Current Status (Updated: July 13, 2025 - Final Update)

### Final Updates - Combined Insights Integration
- **Date**: July 13, 2025 (Late Evening Update)

#### Fixed Combined Insights Navigation
- **Issue**: "View Combined Insights" buttons were navigating to non-existent `/combined-insights` route
- **Fix**: Updated navigation to use correct `/insights` route
- **Files Modified**:
  - `/views/reports-dealer-style.html` - Changed navigation URL
  - Verified all other instances already used correct route

#### Fixed Combined Insights CTAs
- **Issue**: "View Combined Insights" and "Run Comprehensive Audit" buttons were not working (no action on click)
- **Root Cause**: Template rendering issues with embedded EJS data in JavaScript functions
- **Fix**: Restructured JavaScript to store audit data in global object before using in functions
- **Files Modified**:
  - `/views/reports-dealer-style.html` - Refactored JavaScript section
  - `/views/index-new.html` - Added logic to handle comprehensive audit rerun
  - `/public/js/combined-insights.js` - Added sessionStorage support

#### Fixed "Top Website Issues Impacting Conversions" Display
- **Issue**: Section was blank despite ROI calculations showing values
- **Root Cause**: Combined insights expected `categories` data but audit was only sending `issues`
- **Fix**: Updated data structure to include both categories and issues with fallback logic
- **Files Modified**:
  - `/views/reports-dealer-style.html` - Added categories to audit data
  - `/public/js/combined-insights.js` - Added fallback to use issues if categories unavailable

### Extended Confidence Indicators to All Detection Areas
- **Date**: July 13, 2025 (Final Session Update)

#### Added Confidence Indicators Throughout
- **Change**: Extended confidence indicators to all major detection areas
- **New Detection Improvements**:
  - **Schema Markup**: Detects JSON-LD, Microdata, RDFa, and social tags
  - **SSL Certificate**: Recognizes HTTPS redirects and subdomain exceptions
  - **Chat Widget**: Identifies multiple chat platforms (Tawk, Intercom, Drift, etc.)
  - **Meta Tags**: Checks for dynamic rendering and social tag fallbacks
  - **Social Media**: NEW - Detects platform links, icons, and embedded scripts
- **Confidence Levels Applied**:
  - High: Direct detection (links, proper implementation)
  - Moderate: Indirect indicators (scripts, classes, social tags)
  - Manual Review: Dynamic content suspected
- **Files Modified**:
  - `/lib/audit-tests.js` - Comprehensive updates to all detection functions
- **Impact**: Complete transparency about detection limitations across all areas

### Enhanced Recommendation Specificity
- **Date**: July 13, 2025 (Late Evening Update - Complete)

#### Replaced Generic Recommendations
- **Change**: Eliminated all generic "Review and implement best practices" recommendations
- **Implementation**:
  - Created category-specific fallback recommendations for unmatched issues
  - Added detailed templates for common issues (filters, CTAs, contact options)
  - Each recommendation now includes specific numbered implementation steps
  - All recommendations have realistic timeframes and effort estimates
  - Expected results are quantified with industry-standard metrics
- **New Templates Added**:
  - Search Filter System implementation
  - Filter enhancement opportunities  
  - Title tag optimization
  - Inventory navigation improvements
  - Contact options expansion
  - Click-to-call functionality
  - Strategic CTA placement
- **Files Modified**:
  - `/lib/enhanced-recommendations.js` - Complete overhaul of recommendation system
- **Impact**: Every recommendation is now actionable with clear steps and expected outcomes

### Professional Disclaimers Throughout
- **Date**: July 13, 2025 (Late Evening Update - Final)

#### Added Context-Specific Disclaimers
- **Change**: Added professional disclaimers throughout the application
- **Implementation**:
  - Performance Testing: Notes about network conditions and CDN variations
  - SEO Analysis: Acknowledges dynamic meta tags and schema markup limitations
  - Lead Generation: Mentions third-party tools and dynamic forms
  - Manual Review Items: Explains why manual verification is needed
  - Recommendations: Notes about implementation timeframes and variations
  - Industry Benchmarks: Added "Average dealer scores 72/100" context
  - ROI Projections: Clear disclaimer about estimates vs guarantees
  - Lead Performance: Notes about CRM timestamp accuracy
- **Files Modified**:
  - `/views/reports-dealer-style.html` - Added multiple contextual disclaimers
  - `/views/lead-performance.html` - Added data analysis disclaimer
  - `/views/combined-insights.html` - Added ROI projection disclaimer
- **Impact**: Increased transparency and trust by setting proper expectations

### Credibility Improvements - Confidence Indicators
- **Date**: July 13, 2025 (Late Evening Update - Continued)

#### Added Confidence Indicators Throughout
- **Change**: Added confidence levels to automated detection systems
- **Implementation**:
  - Contact Information Detection: Now shows confidence levels (high/moderate/manual-review)
  - Form Detection: Recognizes dynamic form loading indicators
  - Added 🔍 icon for manual review items
  - Changed "Contact information verification required" from LOW to INFO priority
- **Files Modified**:
  - `/lib/audit-tests.js` - Added confidence levels to contact and form detection
  - `/lib/enhanced-recommendations.js` - Added Form System Review template
- **Impact**: Improved credibility by acknowledging limitations of automated scanning

### Latest Updates - Definitions & Recommendations System
- **Date**: July 13, 2025 (Evening Update)

#### Expanded Definitions & Glossary
- **Change**: Made all sections as comprehensive as SEO section (per user request)
- **Implementation**:
  - Lead Generation: Expanded from 3 to 19 terms
  - Priority Levels: Expanded from 3 to 17 terms
  - All sections now have similar depth and detail
- **Files Modified**:
  - `/views/definitions.html` - Added comprehensive terms to all sections

#### Fixed Detailed Action Items Display
- **Change**: Fixed blank recommendations and improved display logic
- **Implementation**:
  - Shows "No Recommendations At This Time" when no recommendations exist
  - Properly displays 1-5 recommendations based on actual count (no empty placeholders)
  - Fixed data structure mismatch between recommendations engine and template
- **Files Modified**:
  - `/views/reports-dealer-style.html` - Updated recommendation display logic
  - `/lib/enhanced-recommendations.js` - Added category mappings for common issues

#### Improved Vehicle Image Detection
- **Change**: Fixed false positives for "Insufficient vehicle images"
- **Implementation**:
  - Now detects image galleries and dynamic loading
  - Looks for large images rather than specific keywords
  - Acknowledges modern CDN patterns and lazy loading
  - Changed from HIGH to LOW/MEDIUM priority for image issues
- **Files Modified**:
  - `/lib/page-specific-tests.js` - Updated image detection logic
  - `/lib/enhanced-recommendations.js` - Added recommendations for image-related issues

#### Enhanced Inventory Filter Detection
- **Change**: Fixed false positives for "Limited search filters"
- **Implementation**:
  - Expanded filter keyword detection (year, make, model, price, etc.)
  - Detects filter UI containers and faceted search systems
  - Recognizes dynamic/AJAX filter loading
  - Changed from HIGH to MEDIUM priority when genuinely limited
- **Files Modified**:
  - `/lib/page-specific-tests.js` - Improved filter detection algorithm
  - `/lib/enhanced-recommendations.js` - Added filter-related recommendations

#### Fixed Mobile Optimization Detection
- **Change**: Removed false "Not mobile optimized" HIGH priority issues
- **Implementation**:
  - No longer flags sites as "not optimized" just for having viewport tag
  - Checks for actual mobile-unfriendly elements (Flash, fixed-width)
  - Recognizes modern responsive design patterns
  - More nuanced priority levels (MEDIUM/LOW instead of HIGH)
- **Files Modified**:
  - `/lib/page-specific-tests.js` - Smarter mobile detection
  - `/lib/enhanced-recommendations.js` - Added mobile-specific recommendations

## Current Status (Updated: July 13, 2025)

### New Features Added
- **Date**: July 13, 2025

#### SEO Audit Option
- **Change**: Replaced "Quick Audit" with dedicated "SEO Audit" option
- **Implementation**: 
  - SEO-focused analysis that runs only SEO tests
  - 30-second targeted analysis vs 60-90 seconds for comprehensive
  - Skips VDP, Service, and Inventory page analysis
- **Files Modified**:
  - `/views/index-new.html` - Changed "Quick Audit" to "SEO Audit" with description
  - `/lib/audit-tests.js` - Already had `runSEOAudit` function implemented
  - `/server.js` - Added logic to skip page-specific tests for SEO audits (line 1998-2000)
  - `/CHANGELOG.md` - Documented version 2.2 with SEO audit feature
- **Backend**: Uses existing `runSEOAudit` function that was already in audit-tests.js

#### Report Design Update
- **Change**: Updated website audit reports to mirror Individual Dealer Report style
- **Implementation**:
  - Created new template with clean, professional design
  - Dealership name centered at top as primary identifier
  - Unified performance badge showing "Score/100 • Tier Performer"
  - Color-coded badges: Elite (green), Strong (blue), Average (orange), Challenge (red)
  - Improved issue organization and recommendations
  - Added print buttons to all reports
  - Removed auto-print behavior for better UX
- **Files Modified**:
  - `/views/reports-dealer-style.html` - NEW: Individual dealer report template
  - `/server.js` - Updated to use new template (line 2130)
  - `/public/js/lead-performance.js` - Removed auto-print, added print buttons
  - `/CHANGELOG.md` - Documented report design update

### Major Change: Dealer Group Analysis Temporarily Disabled
- **Date**: July 13, 2025
- **Reason**: Location counting was unreliable and only worked for pre-programmed major groups
- **Implementation**: Shows "Coming Soon" message when dealer group option is selected
- **Files Modified**: 
  - `/views/index-new.html` - Added coming soon alert and prevents group submission
  - `/CHANGELOG.md` - Documented the temporary removal
- **Note**: All dealer group backend code remains in place but is unused

## Summary of Current Working State

### ✅ Fully Functional Features (as of July 14, 2025 - Evening):
1. **Website Analysis**
   - SEO Audit (30-second focused analysis)
   - Comprehensive Audit (full 60-90 second analysis)
   - All detection algorithms updated for modern websites
   - Enhanced recommendations with detailed action items

2. **Lead Performance Analysis**
   - Upload and analyze dealer lead data
   - Performance metrics and benchmarking
   - Integration with website audit data
   - Fixed UI issues (tier container height, text overflow)
   - Complete Settings tab with 11 configurable parameters
   - Settings & Configuration Guide for user reference
   - Settings persistence across sessions

3. **Combined Insights**
   - Seamless navigation from both website and lead analysis
   - Proper data flow between components
   - Impact analysis showing specific issues with conversion impacts
   - Dynamic opportunities based on actual problems found
   - Performance comparison chart working with all metrics
   - Enhanced correlation analysis with actionable feedback
   - ROI calculations based on improvements

4. **Documentation & Guides**
   - Definitions & Glossary with all sections comprehensive (15-19 terms each)
   - NEW: Analytics & Insights section with 10 terms
   - NEW: Settings & Configuration Guide with detailed explanations
   - Professional reference for all features

### ⚠️ Temporarily Disabled:
- **Dealer Group Analysis** - Shows "Coming Soon" message

### 🔧 Technical Improvements Made:
- No more false positives for mobile optimization
- Accurate vehicle image detection (handles dynamic loading)
- Smart inventory filter detection
- Proper error handling throughout
- All navigation CTAs working correctly
- No generic insights - all recommendations specific and actionable
- JavaScript errors fixed (parseFloat for numeric values)
- Performance comparison chart fully functional

## Previous Status (July 11, 2025)

### Issues We Were Working On:
1. **Health Score Bug** - FIXED ✅
   - Was showing 348/100 due to weight calculation error
   - Fixed by changing weight from 15 to 0.15 and adding normalization

2. **"window is not defined" Error** - FIXED ✅
   - Fixed by removing browser-specific code from group-analysis.js
   - Updated classifyDealerLink function to use Node.js URL parsing

3. **Group Analysis Detection Issues** - MOSTLY FIXED ✅
   - Was: All tests returning "No clear... found"
   - Now: Detecting 172 locations, 25 brands, full group info!
   - Minor refinements needed for Contact Methods and Navigation
   - Debug logging added and working

4. **Quick Audit Only for Groups** - CONFIRMED AS INTENTIONAL ✅
   - Not a bug - designed to restrict groups to quick audit
   - Server supports comprehensive but UI restricts it

### Files Modified:
1. `/server.js` - Fixed scoring calculation, enhanced Chrome options, retry logic
2. `/lib/group-analysis.js` - Fixed window error, improved detection patterns, added debugging, integrated crawler
3. `/lib/location-crawler.js` - NEW: Comprehensive web crawler for location discovery
4. `/AUTO-AUDIT-PRO.md` - Added dealer group documentation
5. `/CHANGELOG.md` - Documented new features and fixes
6. `/SESSION-NOTES-2025-01-11.md` - Detailed progress tracking

## To Resume Where We Left Off:

### 1. Check Current Git Status
```bash
git status
```

### 2. Key Areas to Review:

#### A. Group Analysis Detection (Main Issue)
The group analysis tests are failing to detect elements. We added debugging in:
- `lib/group-analysis.js` lines 92-114 (main debug output)
- `lib/group-analysis.js` lines 147-148 (location test debug)

#### B. Recent Improvements Made:
- Comprehensive brand list with variations (lines 12-60)
- Expanded GROUP_PATTERNS (lines 63-83)
- Enhanced testLocationDirectory function (lines 141-248)
- Improved testBrandRepresentation function (lines 249-367)
- Better testContactConsistency function (lines 434-587)
- Enhanced testNavigationStructure function (lines 589-708)
- Improved testGroupInformation function (lines 371-497)

### 3. Latest Test Results:
- **Tested sites**: geeautomotive.com, kendallautogroup.com
- **Results**: SUCCESSFUL after fixes! 
  - Location count now accurate (was 172, now matches actual ~35-79)
  - 25+ brands detected correctly
  - Full group information detected
  - Group Structure: 4/5 (Excellent)
  - Contact Methods: Now detecting 80+ phone numbers
  - Navigation: Comprehensive detection

### 4. All Major Issues RESOLVED ✅:
1. **Health Score 348/100** - FIXED (proper weight calculation)
2. **"window is not defined"** - FIXED (removed browser-specific code)
3. **Group detection failing** - FIXED (improved patterns working)
4. **Location count inflated** - FIXED (more selective counting)
5. **Chrome session errors** - FIXED (added retry logic)
6. **Quick Audit only** - CONFIRMED as intentional
7. **Specialty locations missing** - FIXED (added motorcycle, commercial, service centers)
8. **Large dealer groups undercounted** - FIXED (new LocationCrawler module)
   - AutoNation was showing 39/325 (12%)
   - Now uses web crawling for comprehensive discovery

### 4. Test Commands:
```bash
# Start the server
npm start

# Test a dealer group site
# Navigate to http://localhost:3002
# Enter a dealer group URL like kendallautogroup.com
```

### 5. Common Dealer Group Sites to Test:
- kendallautogroup.com
- autonation.com
- lithia.com
- Group1auto.com
- sonicautomotive.com

## Debugging Output to Look For:

When you run the audit, check the console for:
```
[Group Analysis Debug] URL: [site-url]
[Group Analysis Debug] Has body tag: [true/false]
[Group Analysis Debug] HTML length: [number]
[Group Analysis Debug] Body text length: [number]
[Group Analysis Debug] Number of links: [number]
[Group Analysis Debug] First 5 links:
  1. Text: "[link-text]", Href: "[link-href]"
  ...
```

This will tell us:
- If HTML is being loaded properly
- What the actual page structure looks like
- Why our selectors might not be matching

## If You Need to Revert Changes:
```bash
# See all recent commits
git log --oneline -10

# Revert to before changes if needed
git reset --hard [commit-hash]
```

## Latest Code Changes (July 11, 2025):

### Location Count Fix:
- Unified `testLocationDirectory` and `extractDealerLinks` to use same logic
- Removed overly broad selectors like `a[href*=".com"]`
- Improved `isDealerLink` function with better validation
- Added specific patterns for external dealer sites

### Chrome Session Fix:
- Added retry logic (up to 3 attempts) for session errors
- Improved timeout management
- Better error handling and cleanup
- Stabilized Chrome options

### Specialty Location Detection:
- Added motorcycle brands (Ducati, Harley-Davidson, Yamaha, etc.)
- Added INEOS Grenadier and other specialty brands
- Added Used Car/Pre-Owned location detection
- Added Commercial Service Centers, Fleet, Collision centers
- Added RV, Marine, and Powersports locations

### Web Crawler Implementation:
- Created new LocationCrawler module for comprehensive discovery
- Implements multiple discovery methods:
  - XML sitemap parsing
  - Known location page patterns
  - API endpoint discovery
  - Deep crawling with pagination
  - Selenium for JavaScript content
- Should detect 80-100% of locations for major dealer groups

### Combined Insights Improvements:
- Fixed "Download Full Report" button - now generates comprehensive PDF report
- Removed misleading "Fix Website Issues" CTA
- Fixed mobile experience reporting:
  - Only shows as issue if mobile score is actually poor
  - No longer implies 65% mobile traffic is a problem
- Replaced confusing radar chart with clear grouped bar chart:
  - Side-by-side comparison (purple vs green bars)
  - Easy to see performance gaps
  - Professional and matches app branding

### Dealer Group Web Search Implementation:
- Created DealerSearcher module for finding actual dealer counts
- Integrated web search when "Dealer Group" is selected
- Shows actual vs website-visible location counts
- Known dealer groups database:
  - AutoNation (325), Lithia (300), Group 1 (263)
  - Penske (203), Asbury (200), Sonic (140)
  - Ken Garff (70), Gee (43), Kendall (30)
- Improved data clarity in reports:
  - "X locations found on website" vs "Actually has Y locations"
  - Shows percentage of locations not discoverable
  - Warning alerts when major discrepancies exist

## Key Insights:
1. Dealer groups often use external sites (e.g., kendallford.com)
2. Need specific patterns for each group's structure
3. Quick Audit restriction is intentional for performance
4. Location counting must be precise to avoid inflated numbers
5. Chrome sessions need retry logic for stability

## Session Notes:
See SESSION-NOTES-2025-01-11.md for complete details of all fixes

## Contact for Original Code:
- Author: JL Robinson
- Email: nakapaahu@gmail.com