#!/bin/bash

# Auto Audit Pro - Deploy Current Updates
# Deploys: Cleanup, Rate Limiting, and Monitoring
# © 2025 JL Robinson. All Rights Reserved.

echo "🚀 Auto Audit Pro - Deployment Script"
echo "===================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: server.js not found. Are you in the auto-audit-pro directory?${NC}"
    exit 1
fi

echo "📋 Pre-deployment checks..."
echo ""

# 1. Check Node version
NODE_VERSION=$(node -v)
echo -e "✓ Node version: ${NODE_VERSION}"

# 2. Install new dependencies
echo ""
echo "📦 Installing rate limiting dependencies..."
npm install express-rate-limit express-slow-down
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# 3. Create logs directory
echo ""
echo "📁 Setting up logs directory..."
mkdir -p logs
echo -e "${GREEN}✓ Logs directory ready${NC}"

# 4. Clean up development files (already done, but verify)
if [ -d "_dev" ]; then
    echo -e "${GREEN}✓ Development files already organized in _dev/${NC}"
else
    echo -e "${YELLOW}⚠️  No _dev directory found - cleanup may not have been run${NC}"
fi

# 5. Test server startup
echo ""
echo "🧪 Testing server startup..."
echo "Starting server for 5 seconds to verify no errors..."

# Start server in background
timeout 5s node server.js > server-test.log 2>&1 &
SERVER_PID=$!

sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✓ Server starts successfully${NC}"
    kill $SERVER_PID 2>/dev/null
else
    echo -e "${RED}❌ Server failed to start. Check server-test.log for errors${NC}"
    cat server-test.log
    exit 1
fi

# 6. Integration checklist
echo ""
echo "📝 Manual Integration Required:"
echo "================================"
echo ""
echo "1. Add to server.js (after middleware setup):"
echo "   ${YELLOW}const rateLimiter = require('./middleware/rate-limiter');${NC}"
echo "   ${YELLOW}const { requestLogger, errorLogger } = require('./middleware/logging');${NC}"
echo "   ${YELLOW}const { getMonitoring } = require('./lib/monitoring-system');${NC}"
echo ""
echo "2. Apply rate limiting:"
echo "   ${YELLOW}rateLimiter.applyToApp(app);${NC}"
echo ""
echo "3. Add logging middleware:"
echo "   ${YELLOW}app.use(requestLogger);${NC}"
echo "   ${YELLOW}app.use(errorLogger); // At the VERY END${NC}"
echo ""
echo "4. Add monitoring endpoints - see MONITORING_IMPLEMENTATION.md"
echo ""

# 7. Create backup
echo "💾 Creating backup..."
BACKUP_FILE="auto-audit-pro-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf ../$BACKUP_FILE --exclude=node_modules --exclude=_dev --exclude=logs .
echo -e "${GREEN}✓ Backup created: ../$BACKUP_FILE${NC}"

# 8. Git status
echo ""
echo "📊 Git Status:"
git status --short

echo ""
echo "🎯 Next Steps:"
echo "============="
echo "1. Integrate the code changes into server.js"
echo "   - Use ${YELLOW}node apply-rate-limiting.js${NC} for guidance"
echo "   - Check ${YELLOW}MONITORING_IMPLEMENTATION.md${NC} for details"
echo ""
echo "2. Test locally:"
echo "   - Rate limiting: ${YELLOW}node test-rate-limits.js${NC}"
echo "   - Monitoring: Visit ${YELLOW}http://localhost:3002/monitoring${NC}"
echo ""
echo "3. Commit changes:"
echo "   ${YELLOW}git add .${NC}"
echo "   ${YELLOW}git commit -m 'feat: Add rate limiting and monitoring system'${NC}"
echo ""
echo "4. Deploy to production:"
echo "   ${YELLOW}git push origin main${NC}"
echo "   - OR use your deployment method (Railway, Heroku, etc.)"
echo ""
echo "5. Verify in production:"
echo "   - Check /monitoring dashboard"
echo "   - Monitor logs directory"
echo "   - Test rate limits aren't too restrictive"
echo ""

# 9. Clean up test files
rm -f server-test.log

echo -e "${GREEN}✅ Pre-deployment preparation complete!${NC}"
echo ""
echo "⚠️  IMPORTANT: Don't forget to:"
echo "   1. Integrate the code changes"
echo "   2. Test thoroughly"
echo "   3. Update CHANGELOG.md"
echo "   4. Update recovery documentation"
echo ""

# Optional: Show what files were added
echo "📄 New files added:"
echo "   - middleware/rate-limiter.js"
echo "   - middleware/logging.js"
echo "   - lib/logger.js"
echo "   - lib/monitoring-system.js"
echo "   - views/system-monitoring.html"
echo "   - Multiple implementation guides"
echo ""

echo "Ready to deploy! 🚀"