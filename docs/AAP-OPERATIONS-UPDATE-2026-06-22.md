# AAP Operations Update

Date: June 22, 2026
Application: Auto Audit Pro
Production Path: /opt/auto-audit-pro
PM2 Process: auto-audit
Domain: https://autoauditpro.io/
Status: Production fixes completed and verified

## Summary

Two production issues were identified and resolved:

1. Public Access Denied issue on autoauditpro.io
2. Missing Express routes for new intelligence pages

Both fixes were tested on production, committed, and pushed to GitHub.

## Issue 1: Access Denied on Public URL

AAP was returning a plain Access Denied response when accessed from a public browser.

The application itself was online in PM2 and responding locally on port 3002.

Local test:

curl -i http://localhost:3002/

Public test after resolution:

curl -I https://autoauditpro.io/

Confirmed result:

HTTP/2 200

## Root Cause

The AAP security middleware was blocking suspicious traffic and storing blocked IPs in memory.

Because Express was not configured to trust the Nginx reverse proxy, req.ip resolved to the local proxy address:

::ffff:127.0.0.1

When bots hit suspicious paths such as /.env, /.git, or /wp-admin, AAP blocked 127.0.0.1. Since public browser traffic routes through Nginx, legitimate users were denied.

## Access Denied Fix

Added the following line immediately after Express app initialization in server.js:

app.set('trust proxy', 1);

This allows Express to use the real external client IP from Nginx proxy headers.

Commit:

6bdd04b Fix reverse proxy IP handling for security middleware

Scope:

server.js | 3 +++
1 file changed, 3 insertions(+)

## Issue 2: Missing Intelligence Page Routes

The following files existed in /views:

views/lead-intelligence.html
views/ai-visibility-intelligence.html
views/incentive-intelligence.html

However, server.js did not include Express routes for these pages.

As a result, mobile/browser access returned:

Cannot GET /lead-intelligence

## Intelligence Route Fix

Added protected routes for:

/lead-performance
/lead-intelligence
/dealer-intelligence
/ai-visibility-intelligence
/incentive-intelligence

The routes use requireLeadOrAdmin and render the corresponding intelligence pages.

Test results from curl returned HTTP/2 302 to /login, which confirms the routes exist and are protected by authentication.

Phone browser testing confirmed /lead-intelligence now loads successfully.

Commit:

1a2a58e Add intelligence page routes

Scope:

4 files changed, 348 insertions(+)

Created:

views/ai-visibility-intelligence.html
views/incentive-intelligence.html
views/lead-intelligence.html

Modified:

server.js

## Current Production State

AAP is online in PM2.

Public URL returns:

HTTP/2 200

Git branch is up to date with origin/main after both fixes.

## Current Known Open Items

The following files remain modified or untracked and should not be committed until reviewed:

Modified:
- lib/enhanced-recommendations.js
- lib/pdf-generator.js
- middleware/auth.js
- package-lock.json
- package.json
- public/css/pdf-professional.css
- views/reports-dealer-style.html
- views/suite-home.html

Untracked:
- docs/
- lib/pdf-generator.js.bak
- public/reports/
- server.js.backup.20260303
- server.js.bad-proxy-commit-backup
- server.js.save
- systemctl

Important:

Do not run git add .

Review remaining files individually before committing.

## Operational Notes

Check AAP:

pm2 status
pm2 show auto-audit
pm2 logs auto-audit --lines 100
curl -I https://autoauditpro.io/

Restart AAP:

pm2 restart auto-audit
pm2 save

Check Nginx:

sudo nginx -t
sudo nginx -T | grep -A30 -B10 "proxy_pass"

Check Node ports:

sudo ss -tulpn | grep node

## Next Recommended Work

1. Review remaining modified AAP files.
2. Decide whether suite-home.html represents the desired current mobile/desktop suite UI.
3. Review PDF generator and recommendation engine changes.
4. Clean up temporary backup files only after confirming they are no longer needed.
5. Create a separate documentation commit for broader AAP architecture once the remaining working tree is reviewed.
