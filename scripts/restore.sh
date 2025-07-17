#!/bin/bash
# Auto Audit Pro - Restore Script
# Restores from a backup created by backup.sh

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Auto Audit Pro - Restore Script${NC}"
echo "================================="

# Check if backup path provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup path provided${NC}"
    echo "Usage: $0 /path/to/backup"
    echo ""
    echo "Available backups:"
    ls -la /mnt/c/Users/nakap/Desktop/autoaudit-backups/ 2>/dev/null | grep -E "^d.*20[0-9]{6}"
    exit 1
fi

BACKUP_PATH=$1

# Verify backup exists
if [ ! -d "$BACKUP_PATH" ]; then
    echo -e "${RED}Error: Backup directory not found: $BACKUP_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}Restoring from: $BACKUP_PATH${NC}"
echo ""

# Confirmation prompt
read -p "This will overwrite current files. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Function to restore file
restore_file() {
    local source=$1
    local dest=$2
    if [ -f "$source" ]; then
        cp "$source" "$dest"
        echo -e "${GREEN}✓${NC} Restored: $(basename "$dest")"
    else
        echo -e "${YELLOW}⚠${NC} Skipped (not in backup): $(basename "$dest")"
    fi
}

# Function to restore directory
restore_directory() {
    local source=$1
    local dest=$2
    if [ -d "$source" ]; then
        rm -rf "$dest"
        cp -r "$source" "$dest"
        echo -e "${GREEN}✓${NC} Restored directory: $(basename "$dest")"
    else
        echo -e "${YELLOW}⚠${NC} Directory not in backup: $(basename "$dest")"
    fi
}

# Stop the server if running
echo -e "\n${YELLOW}Stopping server if running...${NC}"
pkill -f "node.*server.js" 2>/dev/null || echo "Server not running"

# Create backup of current state
echo -e "\n${YELLOW}Creating backup of current state...${NC}"
CURRENT_BACKUP="/mnt/c/Users/nakap/Desktop/autoaudit-backups/pre-restore-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$CURRENT_BACKUP"
cp "$PROJECT_DIR/.env" "$CURRENT_BACKUP/.env.current" 2>/dev/null
echo -e "${GREEN}✓${NC} Current state backed up to: $CURRENT_BACKUP"

# 1. Restore configuration files
echo -e "\n${YELLOW}Restoring configuration files...${NC}"
restore_file "$BACKUP_PATH/.env.backup" "$PROJECT_DIR/.env"
restore_file "$BACKUP_PATH/package.json" "$PROJECT_DIR/package.json"
restore_file "$BACKUP_PATH/package-lock.json" "$PROJECT_DIR/package-lock.json"

# 2. Restore library files
echo -e "\n${YELLOW}Restoring library files...${NC}"
restore_file "$BACKUP_PATH/lib/roi-config.js" "$PROJECT_DIR/lib/roi-config.js"
restore_file "$BACKUP_PATH/lib/scrapingdog-wrapper.js" "$PROJECT_DIR/lib/scrapingdog-wrapper.js"
restore_file "$BACKUP_PATH/lib/monitoring-engine.js" "$PROJECT_DIR/lib/monitoring-engine.js"

# 3. Restore views
echo -e "\n${YELLOW}Restoring view files...${NC}"
restore_file "$BACKUP_PATH/views/admin-settings.html" "$PROJECT_DIR/views/admin-settings.html"
restore_file "$BACKUP_PATH/views/monitoring-dashboard.html" "$PROJECT_DIR/views/monitoring-dashboard.html"

# 4. Restore data directory
echo -e "\n${YELLOW}Restoring data storage...${NC}"
restore_directory "$BACKUP_PATH/data" "$PROJECT_DIR/data"

# 5. Restore server file
echo -e "\n${YELLOW}Restoring server configuration...${NC}"
restore_file "$BACKUP_PATH/server.js" "$PROJECT_DIR/server.js"

# 6. Restore test scripts
echo -e "\n${YELLOW}Restoring test scripts...${NC}"
restore_file "$BACKUP_PATH/test-scrapingdog.js" "$PROJECT_DIR/test-scrapingdog.js"
restore_file "$BACKUP_PATH/test-scrapingdog-direct.js" "$PROJECT_DIR/test-scrapingdog-direct.js"
restore_file "$BACKUP_PATH/test-scrapingdog-integration.js" "$PROJECT_DIR/test-scrapingdog-integration.js"

# 7. Reinstall dependencies
echo -e "\n${YELLOW}Reinstalling dependencies...${NC}"
cd "$PROJECT_DIR"
npm install

# Summary
echo -e "\n${GREEN}Restore completed successfully!${NC}"
echo "================================="
echo ""
echo "Next steps:"
echo "1. Review the .env file and update any passwords if needed"
echo "2. Start the server: npm start"
echo "3. Test the application"
echo ""
echo "If you need to revert this restore:"
echo "  ./scripts/restore.sh $CURRENT_BACKUP"