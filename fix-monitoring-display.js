/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

// Quick fix for monitoring page showing "Access Denied"
// Run this in browser console when on the monitoring page

// Check what's happening
console.log('Current URL:', window.location.href);
console.log('Checking session...');

// Force reload the monitoring dashboard
fetch('/api/session-info')
  .then(res => res.json())
  .then(data => {
    console.log('Session info:', data);
    if (data.authenticated && data.isAdmin) {
      console.log('Session is valid! Forcing dashboard reload...');
      // Remove any error messages
      const errorElements = document.querySelectorAll('[class*="error"], [class*="denied"]');
      errorElements.forEach(el => el.remove());
      
      // Force reload dashboard data
      if (typeof loadDashboard === 'function') {
        loadDashboard();
      } else {
        console.log('Dashboard function not found, reloading page...');
        window.location.reload();
      }
    } else {
      console.log('Session issue:', data);
    }
  })
  .catch(err => console.error('Error checking session:', err));