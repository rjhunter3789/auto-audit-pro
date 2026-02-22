#!/bin/bash
# Auto Audit Pro - Quick Recovery Script
# Fast recovery for common issues

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}Auto Audit Pro - Quick Recovery${NC}"
echo "================================"
echo ""
echo "Select issue to fix:"
echo "1) Server won't start (port in use)"
echo "2) Can't login (reset admin password)"
echo "3) ScrapingDog API not working"
echo "4) Monitoring not running"
echo "5) Clear all sessions"
echo "6) Restart everything"
echo "7) Check system health"
echo "8) Exit"
echo ""
read -p "Enter choice (1-8): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Fixing: Server port issue${NC}"
        # Kill process on port 3000
        PORT_PID=$(lsof -ti:3000)
        if [ ! -z "$PORT_PID" ]; then
            kill -9 $PORT_PID
            echo -e "${GREEN}✓${NC} Killed process on port 3000"
        else
            echo -e "${BLUE}ℹ${NC} Port 3000 is free"
        fi
        # Try alternative port
        echo "You can also try: PORT=3001 npm start"
        ;;
        
    2)
        echo -e "\n${YELLOW}Resetting admin password${NC}"
        # Generate new password
        NEW_PASS=$(openssl rand -base64 12)
        # Update .env file
        sed -i.bak "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$NEW_PASS/" .env
        echo -e "${GREEN}✓${NC} Password reset"
        echo -e "${BLUE}New password:${NC} $NEW_PASS"
        echo -e "${YELLOW}⚠${NC}  Please restart the server"
        ;;
        
    3)
        echo -e "\n${YELLOW}Testing ScrapingDog API${NC}"
        # Check if API key exists
        if grep -q "SCRAPINGDOG_API_KEY=" .env; then
            echo -e "${GREEN}✓${NC} API key configured"
            # Test the API
            node test-scrapingdog-direct.js
        else
            echo -e "${RED}✗${NC} API key not found in .env"
            echo "Add: SCRAPINGDOG_API_KEY=your_key_here"
        fi
        ;;
        
    4)
        echo -e "\n${YELLOW}Checking monitoring system${NC}"
        # Check if monitoring data exists
        if [ -d "data/monitoring" ]; then
            PROFILE_COUNT=$(find data/monitoring -name "*.json" | wc -l)
            echo -e "${BLUE}ℹ${NC} Found $PROFILE_COUNT monitoring profiles"
        else
            echo -e "${YELLOW}⚠${NC} No monitoring data found"
            mkdir -p data/monitoring
            echo -e "${GREEN}✓${NC} Created monitoring directory"
        fi
        ;;
        
    5)
        echo -e "\n${YELLOW}Clearing all sessions${NC}"
        rm -rf sessions/
        echo -e "${GREEN}✓${NC} Sessions cleared"
        echo -e "${BLUE}ℹ${NC} All users will need to login again"
        ;;
        
    6)
        echo -e "\n${YELLOW}Restarting everything${NC}"
        # Kill node processes
        pkill -f node
        echo -e "${GREEN}✓${NC} Stopped all Node processes"
        # Clear sessions
        rm -rf sessions/
        echo -e "${GREEN}✓${NC} Cleared sessions"
        # Start server
        echo -e "${BLUE}ℹ${NC} Starting server..."
        npm start
        ;;
        
    7)
        echo -e "\n${YELLOW}System Health Check${NC}"
        echo ""
        
        # Check Node.js
        if command -v node &> /dev/null; then
            echo -e "${GREEN}✓${NC} Node.js: $(node -v)"
        else
            echo -e "${RED}✗${NC} Node.js not found"
        fi
        
        # Check npm
        if command -v npm &> /dev/null; then
            echo -e "${GREEN}✓${NC} npm: $(npm -v)"
        else
            echo -e "${RED}✗${NC} npm not found"
        fi
        
        # Check .env file
        if [ -f ".env" ]; then
            echo -e "${GREEN}✓${NC} .env file exists"
            # Check for required keys
            for key in "ADMIN_USERNAME" "ADMIN_PASSWORD" "SESSION_SECRET" "SCRAPINGDOG_API_KEY"; do
                if grep -q "$key=" .env; then
                    echo -e "  ${GREEN}✓${NC} $key configured"
                else
                    echo -e "  ${RED}✗${NC} $key missing"
                fi
            done
        else
            echo -e "${RED}✗${NC} .env file missing"
        fi
        
        # Check data directory
        if [ -d "data" ]; then
            echo -e "${GREEN}✓${NC} Data directory exists"
        else
            echo -e "${RED}✗${NC} Data directory missing"
        fi
        
        # Check port availability
        if lsof -ti:3000 &> /dev/null; then
            echo -e "${YELLOW}⚠${NC} Port 3000 in use"
        else
            echo -e "${GREEN}✓${NC} Port 3000 available"
        fi
        
        # Check disk space
        DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
        if [ $DISK_USAGE -lt 90 ]; then
            echo -e "${GREEN}✓${NC} Disk space: ${DISK_USAGE}% used"
        else
            echo -e "${RED}✗${NC} Low disk space: ${DISK_USAGE}% used"
        fi
        ;;
        
    8)
        echo -e "${BLUE}Goodbye!${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"