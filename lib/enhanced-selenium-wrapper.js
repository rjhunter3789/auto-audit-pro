/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Enhanced Selenium Wrapper with Advanced Anti-Detection Features
 * Implements stealth techniques to bypass modern bot detection systems
 */

let seleniumAvailable = false;
let Builder, By, chrome, until;

try {
    // Try to load Selenium dependencies
    Builder = require('selenium-webdriver').Builder;
    By = require('selenium-webdriver').By;
    until = require('selenium-webdriver').until;
    chrome = require('selenium-webdriver/chrome');
    seleniumAvailable = true;
    console.log('Enhanced Selenium WebDriver loaded successfully');
} catch (error) {
    console.log('Selenium WebDriver not available, using fallback mode');
}

// Advanced Chrome options with stealth features
function getStealthChromeOptions() {
    if (!seleniumAvailable || !chrome) {
        return null;
    }
    
    const options = new chrome.Options();
    
    // Essential stealth arguments
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--exclude-switches=enable-automation');
    options.addArguments('--disable-features=site-per-process');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-setuid-sandbox');
    options.addArguments('--disable-web-security');
    options.addArguments('--disable-features=IsolateOrigins,site-per-process');
    
    // Viewport and rendering
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--start-maximized');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-software-rasterizer');
    
    // Performance and stability
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-plugins');
    options.addArguments('--disable-images');
    options.addArguments('--disable-javascript'); // Will be enabled per-page as needed
    
    // Fingerprinting resistance
    options.addArguments('--disable-features=UserAgentClientHint');
    options.addArguments('--disable-features=AudioServiceOutOfProcess');
    
    // Rotating user agents
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    options.addArguments(`--user-agent=${randomUA}`);
    
    // Chrome preferences
    options.setUserPreferences({
        'profile.default_content_setting_values.notifications': 2,
        'profile.default_content_settings.popups': 0,
        'profile.managed_default_content_settings.images': 2,
        'credentials_enable_service': false,
        'profile.password_manager_enabled': false
    });
    
    // Experimental options for stealth
    options.setExperimentalOption('excludeSwitches', ['enable-automation']);
    options.setExperimentalOption('useAutomationExtension', false);
    
    // Set Chrome binary path if specified
    if (process.env.CHROME_BIN) {
        options.setChromeBinaryPath(process.env.CHROME_BIN);
    }
    
    // Headless mode configuration
    if (process.env.SELENIUM_HEADLESS !== 'false') {
        options.addArguments('--headless=new'); // New headless mode
    }
    
    return options;
}

// Create an enhanced driver instance with stealth features
async function createStealthDriver() {
    if (!seleniumAvailable) {
        return null;
    }
    
    try {
        const chromeOptions = getStealthChromeOptions();
        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();
        
        // Execute stealth scripts
        await driver.executeScript(`
            // Overwrite the navigator.webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            
            // Mock permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
            
            // Mock plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            // Mock languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
            
            // Chrome runtime
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
            
            // Console.log override
            const originalLog = console.log;
            console.log = function(...args) {
                if (args[0] && args[0].includes && args[0].includes('HeadlessChrome')) {
                    return;
                }
                return originalLog.apply(console, args);
            };
        `);
        
        return driver;
    } catch (error) {
        console.error('Failed to create stealth Selenium driver:', error.message);
        return null;
    }
}

// Enhanced page loading with anti-detection measures
async function loadPageWithStealth(driver, url, options = {}) {
    if (!driver) return null;
    
    const maxRetries = options.maxRetries || 3;
    const waitTime = options.waitTime || 3000; // Reduced from 5000
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Minimal delay to avoid detection (was 1-3 seconds)
            await driver.sleep(100);
            
            // Navigate to the page
            await driver.get(url);
            
            // Wait for page to load with random human-like delays
            await driver.wait(until.elementLocated(By.tagName('body')), waitTime);
            // Reduced wait after page load (was 2-5 seconds)
            await driver.sleep(500);
            
            // Simulate human behavior
            await simulateHumanBehavior(driver);
            
            // Check if we're blocked
            const pageSource = await driver.getPageSource();
            const isBlocked = checkIfBlocked(pageSource);
            
            if (!isBlocked) {
                return pageSource;
            }
            
            console.log(`Attempt ${attempt} blocked, retrying...`);
            
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw error;
            }
        }
    }
    
    return null;
}

// Simulate human-like behavior
async function simulateHumanBehavior(driver) {
    try {
        // Random mouse movements
        const actions = driver.actions({ async: true });
        
        // Move mouse to random positions
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(Math.random() * 800) + 100;
            const y = Math.floor(Math.random() * 600) + 100;
            await actions.move({ x, y }).perform();
            await driver.sleep(50); // Reduced from 200-700ms
        }
        
        // Random scroll
        await driver.executeScript(`
            window.scrollTo({
                top: Math.random() * 500,
                behavior: 'smooth'
            });
        `);
        
    } catch (error) {
        // Silent fail - these are just enhancements
    }
}

// Check if page indicates blocking
function checkIfBlocked(pageSource) {
    if (!pageSource) return true;
    
    const blockedPatterns = [
        /access.{0,10}denied/i,
        /blocked/i,
        /captcha/i,
        /cloudflare/i,
        /challenge-form/i,
        /security.{0,10}check/i,
        /bot.{0,10}detected/i,
        /unusual.{0,10}traffic/i,
        /please.{0,10}verify/i,
        /forbidden/i,
        /rate.{0,10}limit/i
    ];
    
    return blockedPatterns.some(pattern => pattern.test(pageSource));
}

// Alternative method using CDP (Chrome DevTools Protocol)
async function createCDPDriver() {
    if (!seleniumAvailable) return null;
    
    try {
        const options = new chrome.Options();
        options.addArguments('--remote-debugging-port=9222');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-setuid-sandbox');
        
        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        // Enable CDP
        await driver.executeCdpCommand('Page.enable', {});
        await driver.executeCdpCommand('Network.enable', {});
        
        // Set custom headers
        await driver.executeCdpCommand('Network.setExtraHTTPHeaders', {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        
        return driver;
    } catch (error) {
        console.error('CDP driver creation failed:', error);
        return null;
    }
}

module.exports = {
    seleniumAvailable,
    createDriver: createStealthDriver,
    createStealthDriver,
    createCDPDriver,
    loadPageWithStealth,
    getStealthChromeOptions,
    checkIfBlocked,
    By,
    until
};