# Smart Document Assistant - DigitalOcean Migration Plan

## Current State Analysis

### Application Details
- **Name**: Smart Document Assistant
- **Version**: 4.2.0 (July 28, 2025)
- **Stack**: Flask (Python) with Google Drive API and OpenAI GPT-4o-mini
- **Current Host**: Railway (https://web-production-4dcb7c.up.railway.app)
- **Main File**: app_flask.py
- **Port**: Configurable via PORT env variable

### Key Features
- Voice-activated document search via iOS Shortcuts
- Google Drive integration for document storage
- OpenAI GPT-4o-mini for intelligent summaries
- Multi-user authentication system
- Personal AI profiles

### Dependencies
- Python 3.x
- Flask and Flask-Login
- Google API Python Client
- OpenAI API
- PyMuPDF and python-docx

## Migration Strategy

### Phase 1: Prepare VPS Environment
1. SSH into VPS: `ssh root@146.190.39.214`
2. Create application directory: `/opt/smart-document-assistant`
3. Install Python dependencies
4. Clone repository from GitHub

### Phase 2: Environment Configuration
1. Create `.env` file with:
   - OPENAI_API_KEY
   - SECRET_KEY
   - Google OAuth credentials
   - Any other environment variables from Railway

### Phase 3: Application Setup
1. Install Python requirements
2. Configure app to run on a different port (e.g., 3003)
3. Set up PM2 for process management
4. Test application locally

### Phase 4: Nginx Configuration
1. Create new Nginx server block
2. Configure reverse proxy to port 3003
3. Set up subdomain or path routing

### Phase 5: Domain/Access Configuration
Options:
1. Subdomain: `docs.autoauditpro.io`
2. Path-based: `autoauditpro.io/docs`
3. Separate domain if available

### Phase 6: Update iOS Shortcuts
1. Update all user shortcuts with new URL
2. Test voice commands with new endpoint
3. Verify authentication works

### Phase 7: Data Migration
1. Ensure Google Drive credentials work
2. Test document search functionality
3. Verify all user profiles are accessible

### Phase 8: Cutover
1. Test all functionality on VPS
2. Update any hardcoded URLs in the app
3. Monitor for errors
4. Shut down Railway deployment

## Key Considerations

### Railway-Specific Code to Update
1. Remove Railway proxy workaround (lines 38-43 in app_flask.py)
2. Update any Railway-specific environment handling
3. Change hardcoded URLs if any exist

### Security Considerations
1. Ensure SECRET_KEY is properly set
2. Configure firewall rules for new port
3. Set up SSL for new domain/subdomain

### Resource Sharing
- VPS already runs auto-audit-pro on port 3002
- Smart Document Assistant will use port 3003
- Both apps can share Nginx and SSL certificate

## Migration Commands

```bash
# On VPS
cd /opt
git clone [repository-url] smart-document-assistant
cd smart-document-assistant

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env

# Test application
python app_flask.py

# Setup PM2
pm2 start app_flask.py --name smart-docs --interpreter python3
pm2 save
```

## Nginx Configuration Template

```nginx
server {
    listen 80;
    server_name docs.autoauditpro.io;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Post-Migration Checklist
- [ ] Application accessible via new URL
- [ ] All users can log in
- [ ] Voice commands work via iOS Shortcuts
- [ ] Document search returns results
- [ ] AI summaries generate properly
- [ ] Google Drive integration functional
- [ ] SSL certificate active
- [ ] Railway deployment stopped
- [ ] DNS updated (if using subdomain)
- [ ] All users notified of URL change