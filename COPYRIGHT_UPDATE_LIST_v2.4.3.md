# Copyright Update List - Version 2.4.3

## Files Requiring Copyright Header Updates

### Currently at Version 2.2 (Need update to 2.4.3):
1. **`/views/reports-dealer-style.html`**
   - Current: Version 2.2
   - Update to: Version 2.4.3
   
2. **`/views/index-new.html`**
   - Current: Version 2.0.1  
   - Update to: Version 2.4.3

3. **`/lib/audit-tests.js`**
   - Current: Version 2.0
   - Update to: Version 2.4.3

4. **`/public/js/lead-performance.js`**
   - Current: Version 2.1
   - Update to: Version 2.4.3

### Files Already at Version 2.4.3 (Verify copyright year):
1. **`/server.js`** - ✓ Already updated
2. **`/package.json`** - ✓ Version correct

### Other Files to Check:
1. **`/views/definitions.html`** - Contains version reference
2. **`/server-simple.js`** - May have old version

## Standard Copyright Header Format

```javascript
/**
 * Auto Audit Pro - Professional Dealership Website Analysis Platform
 * Version 2.4.3
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Author: JL Robinson
 * Contact: nakapaahu@gmail.com
 * Last Modified: July 18, 2025
 * 
 * This software is protected by copyright law.
 * Unauthorized reproduction or distribution is prohibited.
 */
```

## HTML Files Copyright Format

```html
<!--
  Auto Audit Pro - Professional Dealership Website Analysis Platform
  Version 2.4.3
  © 2025 JL Robinson. All Rights Reserved.
  
  Author: JL Robinson
  Contact: nakapaahu@gmail.com
  Last Modified: July 18, 2025
  
  This software is protected by copyright law.
  Unauthorized reproduction or distribution is prohibited.
-->
```

## Quick Update Commands

To find all files with old versions:
```bash
grep -r "Version 2\.[0-2]" --include="*.js" --include="*.html" .
```

To check specific file headers:
```bash
head -15 views/reports-dealer-style.html
head -15 views/index-new.html
head -15 lib/audit-tests.js
head -15 public/js/lead-performance.js
```

## Summary
- **4 files** need version updates from 2.0-2.2 to 2.4.3
- **Date** should be updated to: July 18, 2025
- **Copyright year** remains: © 2025

Would you like me to update these files for you?