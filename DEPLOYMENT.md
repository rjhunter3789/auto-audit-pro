# Deployment Guide for Auto Audit Pro

This guide covers deploying the Auto Audit Pro Node.js application to various platforms.

## Prerequisites
- GitHub repository with your code
- Node.js application ready
- Chrome/Chromium available on deployment platform

## Option 1: Deploy to Render (Recommended - Free Tier)

1. **Sign up at** https://render.com

2. **Create New Web Service**
   - Connect your GitHub account
   - Select your `auto-audit-pro` repository
   - Configure:
     - Name: `auto-audit-pro`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Add Environment Variables**
   - Click "Environment"
   - Add:
     ```
     PORT=3002
     PAGESPEED_API_KEY=your_api_key_here
     ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

## Option 2: Deploy to Heroku

1. **Install Heroku CLI**
   - Download from https://devcenter.heroku.com/articles/heroku-cli

2. **Create Heroku App**
   ```bash
   heroku create auto-audit-pro
   ```

3. **Add Buildpacks**
   ```bash
   heroku buildpacks:add heroku/nodejs
   heroku buildpacks:add https://github.com/heroku/heroku-buildpack-google-chrome
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set PAGESPEED_API_KEY=your_api_key_here
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

## Option 3: Deploy to Railway

1. **Sign up at** https://railway.app

2. **New Project from GitHub**
   - Connect GitHub account
   - Select your repository
   - Railway auto-detects Node.js

3. **Add Variables**
   - Go to Variables tab
   - Add your environment variables

4. **Deploy**
   - Railway automatically deploys on push

## Important Notes for All Platforms

### Chrome/Selenium Requirements
Since this app uses Selenium WebDriver, the deployment platform needs Chrome installed. Most platforms handle this automatically with buildpacks.

### Environment Variables Required
- `PORT` (some platforms set this automatically)
- `PAGESPEED_API_KEY` (optional but recommended)

### Estimated Costs
- **Render**: Free tier includes 750 hours/month
- **Heroku**: Free tier discontinued, starts at $7/month
- **Railway**: $5 free credit, then usage-based

### Troubleshooting

**Chrome Driver Issues**
If you get Chrome driver errors, add to your package.json:
```json
"scripts": {
  "postinstall": "npm install chromedriver"
}
```

**Memory Issues**
Add to Chrome options in server.js:
```javascript
chromeOptions.addArguments('--disable-dev-shm-usage');
chromeOptions.addArguments('--no-sandbox');
```

**Port Issues**
Make sure your server uses:
```javascript
const PORT = process.env.PORT || 3002;
```

## Local Testing Before Deployment

Test locally with production settings:
```bash
NODE_ENV=production npm start
```

## Monitoring

After deployment:
1. Check application logs
2. Test all endpoints
3. Monitor memory usage
4. Set up uptime monitoring (UptimeRobot, etc.)