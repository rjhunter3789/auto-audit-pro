# Fix for Report Template Rendering Issue

## Problem
The audit report pages (SEO, Comprehensive, Custom) are showing raw template code like `<%= results.domain %>` instead of actual data.

## Cause
The report HTML files contain EJS template syntax but are being served as static files instead of being rendered through the EJS template engine.

## Quick Fix

The reports are loaded client-side and populated with JavaScript. The issue is that the JavaScript is not executing properly to replace the template placeholders.

### Option 1: Check Browser Console
1. Open the report page
2. Press F12 to open Developer Tools
3. Check the Console tab for JavaScript errors
4. Look for errors related to 'results' being undefined

### Option 2: Verify Data Loading
The report should be loading data from the audit API. Check if:
1. The audit ID in the URL is correct
2. The API call to `/api/audit/{id}` is returning data
3. The JavaScript is properly parsing and displaying the data

### Option 3: Force Refresh
Sometimes the JavaScript doesn't load properly:
1. Hard refresh the page (Ctrl+Shift+R)
2. Clear browser cache
3. Try in an incognito/private window

## Root Cause Analysis

The reports use client-side templating where:
1. HTML loads with template placeholders
2. JavaScript fetches audit data via API
3. JavaScript replaces placeholders with actual data

If step 2 or 3 fails, you see the raw template syntax.

## Permanent Fix Needed

The reports need to be converted from client-side templating to server-side rendering using EJS, or the client-side JavaScript needs to be fixed to properly replace the template variables.