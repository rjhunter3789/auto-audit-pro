#!/bin/bash

# Deploy CSS fixes to production server
echo "🚀 Deploying CSS fixes to production..."

# Server details
SERVER="root@146.190.39.214"
REMOTE_PATH="/opt/auto-audit-pro"

echo "📄 Uploading updated report template..."
scp views/reports-dealer-style.html $SERVER:$REMOTE_PATH/views/

echo "📄 Uploading cache fix scripts..."
scp fix-report-caching.js $SERVER:$REMOTE_PATH/
scp clear-report-cache.js $SERVER:$REMOTE_PATH/

echo "📄 Uploading updated server.js with cache disable..."
scp server.js $SERVER:$REMOTE_PATH/

echo "🔄 Restarting PM2 on server..."
ssh $SERVER "cd $REMOTE_PATH && pm2 restart auto-audit"

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+F5)"
echo "2. Run a new audit to test"