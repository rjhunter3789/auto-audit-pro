# Selenium WebDriver Setup Guide

## Overview
Auto Audit Pro uses Selenium WebDriver as a fallback for JavaScript-heavy and bot-protected websites. When standard HTTP requests fail (403 errors, Cloudflare, etc.), the system automatically switches to Selenium.

## Current Configuration

### Chrome/Chromium
- **Version**: 142.0.7444.59
- **Binary**: `/usr/bin/chromium-browser` (non-snap preferred)
- **Flags**: Headless, no-sandbox, disable-dev-shm-usage

### ChromeDriver
- **Version**: 142.0.7444.59 (must match Chrome)
- **Location**: `/usr/local/bin/chromedriver`

### Selenium WebDriver
- **Version**: 4.15.0 (Node 18 compatible)
- **Timeout**: 10 seconds for link detection
- **Wait Strategy**: Dynamic wait for 20+ links

## Installation

### 1. Install Chrome/Chromium
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install chromium-browser

# Or Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install google-chrome-stable
```

### 2. Install ChromeDriver
```bash
# Check Chrome version first
chromium-browser --version

# Download matching ChromeDriver (example for 142)
cd /tmp
wget https://storage.googleapis.com/chrome-for-testing-public/142.0.7444.59/linux64/chromedriver-linux64.zip
unzip chromedriver-linux64.zip
sudo mv chromedriver-linux64/chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver

# Verify
chromedriver --version
```

### 3. Configure Environment
```bash
# Add to .env file
echo "CHROME_BIN=/usr/bin/chromium-browser" >> .env

# Or for Google Chrome
echo "CHROME_BIN=/usr/bin/google-chrome" >> .env
```

## How It Works

### 1. Request Flow
```
HTTP Request (Axios)
    ↓ (403 Error)
Selenium Fallback
    ↓
Chrome Headless Browser
    ↓
Wait for Links (20+)
    ↓
Extended Wait for SPAs
    ↓
Return HTML to Crawler
```

### 2. Wait Strategies
- Initial page load: 3 seconds
- Wait for navigation: 10 seconds
- If < 5 links found: Recovery mode
  - Click body element
  - Hover navigation
  - Scroll page
  - Force Vue/React updates
  - Additional 3-5 seconds wait

### 3. Debug Output
```
[Selenium] Current link count: 0
[Selenium] Current link count: 45
[Selenium] Navigation links detected
[Selenium] Total links: 404, Non-anchor links: 385
[Selenium] Successfully loaded https://site.com - Title: Site Title - Links: 404
```

## Troubleshooting

### No Links Found
1. Check if site loads in regular Chrome
2. Verify Chrome is installed: `which chromium-browser`
3. Test manually:
```javascript
// Test script
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function test() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    await driver.get('https://example.com');
    const title = await driver.getTitle();
    console.log('Title:', title);
    await driver.quit();
}
test();
```

### Performance
- Selenium adds 15-50 seconds per page
- Only used when necessary (403 errors)
- Crawls limited to 10 pages for performance

### Known Limitations
- Some sites detect headless Chrome
- Vue.js sites may need custom wait logic
- Heavy sites may timeout

## Configuration Options

### selenium-wrapper.js
```javascript
// Chrome options
options.addArguments('--headless');
options.addArguments('--no-sandbox');
options.addArguments('--disable-dev-shm-usage');
options.addArguments('--disable-gpu');
options.addArguments('--window-size=1920,1080');
options.addArguments('--user-agent=Mozilla/5.0...');

// Unique session directory
options.addArguments(`--user-data-dir=/tmp/chrome-data-${Date.now()}`);
```

### deep-seo-audit.js
```javascript
// Wait for minimum links
await driver.wait(async () => {
    const linkCount = await driver.findElements(By.css('a[href]')).then(links => links.length);
    return linkCount > 20; // Adjustable threshold
}, 10000);
```

## Monitoring
Check Selenium performance:
```bash
pm2 logs auto-audit | grep Selenium
```

Typical output shows:
- Method used (axios vs selenium)
- Link counts during wait
- Final link count
- Recovery attempts