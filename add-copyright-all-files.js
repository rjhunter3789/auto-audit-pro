/**
 * Auto Audit Pro - Copyright Addition Script
 * © 2025 JL Robinson. All Rights Reserved.
 */

const fs = require('fs').promises;
const path = require('path');

const COPYRIGHT_JS = `/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

`;

const COPYRIGHT_HTML = `<!--
  Auto Audit Pro
  © 2025 JL Robinson. All Rights Reserved.
  
  This file contains proprietary code for the Auto Audit Pro platform.
  Unauthorized use, reproduction, or distribution is prohibited.
-->
`;

// Files to add copyright to
const jsFiles = [
  // Root directory files
  'check-server-path.js',
  'clean-duplicate-alerts.js',
  'clean-phantom-profile.js',
  'create-dealer-user.js',
  'debug-login.js',
  'diagnose-403.js',
  'diagnose-monitoring-issue.js',
  'enable-multi-user.js',
  'fix-access-denied-quick.js',
  'fix-admin-access.js',
  'fix-admin-session.js',
  'fix-alert-endpoints.js',
  'fix-all-monitoring-endpoints.js',
  'fix-auth-permanently.js',
  'fix-csp-production.js',
  'fix-deploy.js',
  'fix-deployment.js',
  'fix-json-storage-usage.js',
  'fix-login.js',
  'fix-monitoring-403.js',
  'fix-monitoring-access.js',
  'fix-monitoring-check.js',
  'fix-monitoring-display.js',
  'fix-monitoring-issues.js',
  'fix-monitoring-permanently.js',
  'fix-monitoring-status-display.js',
  'fix-reports-rendering.js',
  'fix-session-persistence.js',
  'fix-user-confusion.js',
  'migrate-alerts-to-json.js',
  'permanent-session-fix.js',
  'quick-change-password.js',
  'recover-profiles.js',
  'remove-dealer-completely.js',
  'reset-admin-password.js',
  'restore-security.js',
  'server-login-update.js',
  'server-test.js',
  'set-password-now.js',
  'start-server.js',
  'test-dealer-detection.js',
  'test-dealer-login.js',
  'test-file-read.js',
  'test-json-storage-class.js',
  'test-login-server.js',
  'test-monitoring-fix.js',
  'test-monitoring-fixes.js',
  'test-monitoring-no-scrapingdog.js',
  'test-monitoring-scrapingdog.js',
  'test-scrapingdog-api.js',
  'test-scrapingdog-direct.js',
  'test-scrapingdog-integration.js',
  'test-scrapingdog.js',
  'test-server.js',
  'verify-scrapingdog.js',
  'test-file-locking.js',
  'apply-race-condition-fix.sh',
  // lib directory files
  'lib/enhanced-selenium-wrapper.js',
  'lib/monitoring-engine-optimized.js',
  'lib/monitoring-scheduler.js',
  'lib/predictive-heatmap.js',
  'lib/proxy-rotation-manager.js',
  'lib/roi-config.js',
  'lib/scrapingdog-wrapper.js',
  // middleware directory files
  'middleware/auth.js',
  'middleware/better-auth.js',
  'middleware/security-monitor.js',
  // public directory files
  'public/fix-csp.js',
  'public/js/check-roi-routes.js'
];

const htmlFiles = [
  // views directory
  'views/admin-fix.html',
  'views/admin-monitoring-settings.html',
  'views/admin-settings.html',
  'views/change-password.html',
  'views/index-exact.html',
  'views/monitoring-dashboard.html',
  'views/monitoring-fix.html',
  'views/monitoring-simple.html',
  'views/monitoring-test.html',
  'views/roi-settings.html',
  'views/security-dashboard.html',
  'views/test-permissions.html',
  // public directory
  'public/csp-bypass.html',
  'public/csp-test.html',
  'public/fix-admin-access.html',
  'public/monitoring-static.html',
  // root directory
  'admin-login-steps.html',
  'logo-preview.html',
  'test-access.html',
  'test-admin-route.html'
];

async function addCopyrightToFile(filePath, copyrightText) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if copyright already exists
    if (content.includes('© 2025 JL Robinson')) {
      console.log(`✓ ${filePath} - Already has copyright`);
      return;
    }
    
    // Add copyright at the beginning
    const newContent = copyrightText + content;
    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`✓ ${filePath} - Copyright added`);
  } catch (error) {
    console.error(`✗ ${filePath} - Error: ${error.message}`);
  }
}

async function main() {
  console.log('Adding copyright notices to all files...\n');
  
  // Process JavaScript files
  console.log('Processing JavaScript files:');
  for (const file of jsFiles) {
    await addCopyrightToFile(file, COPYRIGHT_JS);
  }
  
  console.log('\nProcessing HTML files:');
  // Process HTML files
  for (const file of htmlFiles) {
    await addCopyrightToFile(file, COPYRIGHT_HTML);
  }
  
  console.log('\nCopyright addition complete!');
  console.log('\nIMPORTANT: Remember to also add copyright notices to:');
  console.log('- Any new files you create');
  console.log('- Database schemas');
  console.log('- Configuration templates');
  console.log('- Documentation files');
}

main().catch(console.error);