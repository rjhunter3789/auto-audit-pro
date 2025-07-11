# Recovery Instructions - Dealer Group Analysis Issues

## Current Status (Updated: January 11, 2025)

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
1. `/server.js` - Fixed scoring calculation, enhanced Chrome options
2. `/lib/group-analysis.js` - Fixed window error, improved detection patterns, added debugging
3. `/AUTO-AUDIT-PRO.md` - Added dealer group documentation
4. `/CHANGELOG.md` - Documented new features and fixes

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

## Latest Code Changes (January 11, 2025):

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