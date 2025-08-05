# Smart Document Assistant - DigitalOcean Migration Log
Date: August 2, 2025

## Migration Status: IN PROGRESS

### What We've Completed

1. **SSH Connection Established**
   - Connected to VPS at 146.190.39.214
   - Working directory: /opt/smart-document-assistant

2. **Repository Cloned**
   ```bash
   cd /opt
   git clone https://github.com/rjhunter3789/smart-document-assistant.git
   ```
   - Successfully cloned 597 objects
   - Repository size: 5.99 MiB

3. **Python Environment Setup**
   - Python version confirmed: 3.12.3
   - Had to install python3.12-venv package first:
     ```bash
     apt install python3.12-venv -y
     ```
   - Virtual environment created:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

4. **Dependencies Installed**
   ```bash
   pip install -r requirements.txt
   ```
   - All packages installed successfully including:
     - Flask and Flask-Login
     - Google API Python Client
     - OpenAI
     - PyMuPDF
     - Streamlit
     - All supporting dependencies

### What's Still Needed

1. **Environment Variables** (PAUSED HERE)
   - Need to create .env file with:
     - OPENAI_API_KEY (from Railway)
     - SECRET_KEY (from Railway or generate new)
     - PORT=3003
     - Google Drive OAuth credentials
     - Any other Railway environment variables

2. **Test Application**
   ```bash
   python app_flask.py
   ```

3. **PM2 Process Management**
   ```bash
   pm2 start app_flask.py --name smart-docs --interpreter /opt/smart-document-assistant/venv/bin/python
   pm2 save
   ```

4. **Nginx Configuration**
   - Create server block for docs.autoauditpro.io
   - Configure reverse proxy to port 3003
   - Enable the site

5. **DNS Configuration**
   - Add A record for docs.autoauditpro.io
   - Point to 146.190.39.214

6. **SSL Certificate**
   ```bash
   certbot --nginx -d docs.autoauditpro.io
   ```

7. **Update iOS Shortcuts**
   - Change URL from https://web-production-4dcb7c.up.railway.app
   - To new URL: https://docs.autoauditpro.io

8. **Test Everything**
   - Web login
   - Document search
   - Voice commands
   - AI summaries

9. **Shut Down Railway**
   - Only after confirming everything works

## Important Notes

- Both apps (auto-audit-pro and smart-document-assistant) will run on same VPS
- auto-audit-pro uses port 3002
- smart-document-assistant will use port 3003
- Virtual environment is at: /opt/smart-document-assistant/venv
- Always activate venv before running: `source venv/bin/activate`

## Next Session TODO
1. Get Railway environment variables
2. Create .env file
3. Continue from step 2 in "What's Still Needed"

## Commands for Next Session
```bash
# SSH to server
ssh root@146.190.39.214

# Navigate to app
cd /opt/smart-document-assistant

# Activate virtual environment
source venv/bin/activate

# Create .env file
nano .env
```