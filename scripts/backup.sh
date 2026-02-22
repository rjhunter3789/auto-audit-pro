#!/bin/bash
# Auto Audit Pro - Backup Script
# Creates timestamped backups of critical files and configurations

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="/mnt/c/Users/nakap/Desktop/autoaudit-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$DATE"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Auto Audit Pro - Backup Script${NC}"
echo "================================"

# Create backup directory
echo -e "${YELLOW}Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"

# Function to backup files with progress
backup_file() {
    local source=$1
    local dest=$2
    if [ -f "$source" ]; then
        cp "$source" "$dest"
        echo -e "${GREEN}✓${NC} Backed up: $(basename "$source")"
    else
        echo -e "${RED}✗${NC} Not found: $(basename "$source")"
    fi
}

# Function to backup directory
backup_directory() {
    local source=$1
    local dest=$2
    if [ -d "$source" ]; then
        cp -r "$source" "$dest"
        echo -e "${GREEN}✓${NC} Backed up directory: $(basename "$source")"
    else
        echo -e "${RED}✗${NC} Directory not found: $(basename "$source")"
    fi
}

# 1. Backup critical configuration files
echo -e "\n${YELLOW}Backing up configuration files...${NC}"
backup_file "$PROJECT_DIR/.env" "$BACKUP_DIR/.env.backup"
backup_file "$PROJECT_DIR/package.json" "$BACKUP_DIR/package.json"
backup_file "$PROJECT_DIR/package-lock.json" "$BACKUP_DIR/package-lock.json"

# 2. Backup new security and ROI files
echo -e "\n${YELLOW}Backing up security and ROI configurations...${NC}"
mkdir -p "$BACKUP_DIR/lib"
backup_file "$PROJECT_DIR/lib/roi-config.js" "$BACKUP_DIR/lib/roi-config.js"
backup_file "$PROJECT_DIR/lib/scrapingdog-wrapper.js" "$BACKUP_DIR/lib/scrapingdog-wrapper.js"
backup_file "$PROJECT_DIR/lib/monitoring-engine.js" "$BACKUP_DIR/lib/monitoring-engine.js"

# 3. Backup admin views
echo -e "\n${YELLOW}Backing up admin interfaces...${NC}"
mkdir -p "$BACKUP_DIR/views"
backup_file "$PROJECT_DIR/views/admin-settings.html" "$BACKUP_DIR/views/admin-settings.html"
backup_file "$PROJECT_DIR/views/monitoring-dashboard.html" "$BACKUP_DIR/views/monitoring-dashboard.html"

# 4. Backup data directory (JSON storage)
echo -e "\n${YELLOW}Backing up data storage...${NC}"
backup_directory "$PROJECT_DIR/data" "$BACKUP_DIR/data"

# 5. Backup server configuration
echo -e "\n${YELLOW}Backing up server files...${NC}"
backup_file "$PROJECT_DIR/server.js" "$BACKUP_DIR/server.js"

# 6. Backup test scripts
echo -e "\n${YELLOW}Backing up test scripts...${NC}"
backup_file "$PROJECT_DIR/test-scrapingdog.js" "$BACKUP_DIR/test-scrapingdog.js"
backup_file "$PROJECT_DIR/test-scrapingdog-direct.js" "$BACKUP_DIR/test-scrapingdog-direct.js"
backup_file "$PROJECT_DIR/test-scrapingdog-integration.js" "$BACKUP_DIR/test-scrapingdog-integration.js"

# 7. Create backup metadata
echo -e "\n${YELLOW}Creating backup metadata...${NC}"
cat > "$BACKUP_DIR/backup-info.txt" << EOF
Auto Audit Pro Backup
=====================
Date: $(date)
Version: 2.5.0
Type: Configuration Backup

Files Included:
- Environment configuration (.env)
- Package dependencies (package.json, package-lock.json)
- ROI configuration module
- ScrapingDog integration
- Monitoring engine
- Admin interfaces
- Data storage (JSON files)
- Server configuration
- Test scripts

To restore:
1. Run: ./scripts/restore.sh $BACKUP_DIR
2. Restart the server: npm start
EOF

# 8. Create compressed archive
echo -e "\n${YELLOW}Creating compressed archive...${NC}"
cd "$BACKUP_BASE_DIR"
tar -czf "autoaudit-backup-$DATE.tar.gz" "$DATE/"
echo -e "${GREEN}✓${NC} Archive created: autoaudit-backup-$DATE.tar.gz"

# 9. Cleanup old backups (keep last 7 days)
echo -e "\n${YELLOW}Cleaning up old backups...${NC}"
find "$BACKUP_BASE_DIR" -name "autoaudit-backup-*.tar.gz" -mtime +7 -delete
find "$BACKUP_BASE_DIR" -type d -name "20*" -mtime +7 -exec rm -rf {} + 2>/dev/null

# Summary
echo -e "\n${GREEN}Backup completed successfully!${NC}"
echo "================================"
echo "Backup location: $BACKUP_DIR"
echo "Archive: $BACKUP_BASE_DIR/autoaudit-backup-$DATE.tar.gz"
echo ""
echo "To restore from this backup:"
echo "  ./scripts/restore.sh $BACKUP_DIR"