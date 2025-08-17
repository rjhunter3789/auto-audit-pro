# Smart Document Assistant - Recovery and Status Log
Date: August 17, 2025

## Current Status: PARTIALLY OPERATIONAL

### System Overview
Smart Document Assistant is a RAG (Retrieval-Augmented Generation) application that:
- Retrieves documents from Google Drive
- Provides AI-powered summaries using OpenAI
- Supports voice-enabled queries
- Designed for iOS/Android shortcut integration

### Deployment Status

#### What's Working ✅
1. **Application Running**
   - Flask app running on port 3003
   - PM2 process `smart-doc` active (51 restarts but currently stable)
   - Version: 4.2.0-AI-Enhanced
   - OpenAI integration initialized successfully

2. **Infrastructure**
   - Nginx configured at `/etc/nginx/sites-available/docs.autoauditpro.io`
   - Proxy passing to `http://127.0.0.1:3003`
   - Domain `docs.autoauditpro.io` configured
   - Running from `/var/www/smart-document-assistant/`

3. **Authentication**
   - Login system active (redirects to `/login`)
   - Admin username: Jeff
   - Secret key configured

4. **Google Drive Integration**
   - Client ID: 868703401289-okdpjvco5ru5u66k0rridq8p49atl9f4.apps.googleusercontent.com
   - Refresh token configured
   - Parent folder ID: 1g78xBWtgmNdTosz5iCnko9TG2hxCj7Re
   - Team folder ID: 1M0mNJHCuXCqURzazJ1FJA1BtLpYhJ50j

5. **AI Configuration**
   - OpenAI API key configured
   - Model: gpt-4o-mini
   - AI features enabled

#### What's Not Working ❌
1. **iOS/Android Shortcuts**
   - Shortcuts failing to work as intended
   - This is where the project stalled
   - Need to diagnose endpoint accessibility
   - May need to update shortcut URLs from Railway to new domain

2. **Potential Issues**
   - SSL certificate status unknown
   - Voice endpoint functionality untested
   - API authentication for shortcuts unclear

### File Locations
- **Active Installation**: `/var/www/smart-document-assistant/`
- **Duplicate Installation**: `/opt/smart-document-assistant/` (not in use)
- **Start Script**: `/var/www/smart-document-assistant/start_smart_doc.sh`
- **Environment File**: `/var/www/smart-document-assistant/.env`
- **Nginx Config**: `/etc/nginx/sites-available/docs.autoauditpro.io`
- **PM2 Logs**: `/root/.pm2/logs/smart-doc-*.log`

### Environment Variables (Active)
```
PORT=3003
SECRET_KEY=NewRandomSecret2025xyz
ADMIN_USERNAME=Jeff
GOOGLE_CLIENT_ID=configured
GOOGLE_CLIENT_SECRET=configured
GOOGLE_REFRESH_TOKEN=configured
GOOGLE_DRIVE_PARENT_FOLDER_ID=configured
GOOGLE_DRIVE_DEFAULT_TEAM_FOLDER=configured
OPENAI_API_KEY=configured
OPENAI_MODEL=gpt-4o-mini
BACKEND_URL=http://localhost:8000
```

### Known Issues
1. Start script has error on line 13: "The: command not found"
2. App restarts frequently (51 times) but currently stable
3. iOS/Android shortcuts not functioning properly

### Next Steps Required
1. **Verify SSL Certificate**
   ```bash
   certbot certificates | grep docs
   ```

2. **Test API Endpoints**
   ```bash
   curl https://docs.autoauditpro.io/api/voice
   curl https://docs.autoauditpro.io/api/search
   ```

3. **Update iOS/Android Shortcuts**
   - Change URLs from Railway (https://web-production-4dcb7c.up.railway.app)
   - To new domain (https://docs.autoauditpro.io)

4. **Debug Shortcut Authentication**
   - Check if shortcuts include proper authentication headers
   - Verify API endpoints accept shortcut requests

5. **Fix Start Script Error**
   - Remove line 13 error in start_smart_doc.sh

### Migration Notes
- Original migration started August 2, 2025
- Two installations exist (use `/var/www/` not `/opt/`)
- Railway app should be shut down after shortcuts are working
- Virtual environment active at `/var/www/smart-document-assistant/venv`

### Commands for Troubleshooting
```bash
# Access the app
cd /var/www/smart-document-assistant
source venv/bin/activate

# Check status
pm2 info smart-doc
pm2 logs smart-doc --lines 100

# Restart if needed
pm2 restart smart-doc

# Test endpoints
curl http://localhost:3003/api/voice
curl http://localhost:3003/api/search
```

### Security Notes
- Sensitive API keys are configured (OpenAI, Google)
- Admin access configured for user "Jeff"
- Consider rotating keys if exposed