# Quick Fix for Report Display Issues

## Issues Found:
1. Template syntax error causing JavaScript to break
2. CSP blocking html2canvas library needed for PDF export
3. Missing favicon (minor)

## Quick Fixes:

### 1. Fix CSP to Allow html2canvas

In `server.js`, find the Content-Security-Policy section (around line with `res.setHeader`) and update:

```javascript
// Find this line:
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +

// Change to:
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
```

### 2. Alternative: Use jsdelivr for html2canvas

In the report HTML files, change:
```html
<!-- From -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<!-- To -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

### 3. Fix Template Syntax Error

The syntax error is likely from unclosed EJS tags. The reports are trying to use server-side template syntax in client-side code.

**Temporary Fix**: 
Access reports using the direct API to see the raw data:
- Go to: http://localhost:3002/api/audit/[YOUR-AUDIT-ID]
- This will show the JSON data

### 4. Add Favicon (Optional)

Create a simple favicon.ico file in the public folder or add to server.js:
```javascript
app.get('/favicon.ico', (req, res) => res.status(204).end());
```

## Root Cause

The reports were designed for server-side rendering with EJS but are being served as static HTML files. The template variables (`<%= %>`) are causing JavaScript syntax errors when the browser tries to parse them.

## Permanent Solution

Convert the report files to be properly rendered server-side or fix the client-side JavaScript to properly load and display audit data.