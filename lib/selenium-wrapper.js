/*
 * Auto Audit Pro - Selenium Wrapper
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Selenium Wrapper - Gracefully handles Selenium availability
 * Falls back to Cheerio-only mode if Selenium is not available
 * 
 * This file contains proprietary code. Unauthorized use is prohibited.
 */

let seleniumAvailable = false;
let Builder, By, chrome;

try {
    // Try to load Selenium dependencies
    Builder = require('selenium-webdriver').Builder;
    By = require('selenium-webdriver').By;
    chrome = require('selenium-webdriver/chrome');
    seleniumAvailable = true;
    console.log('Selenium WebDriver loaded successfully');
} catch (error) {
    console.log('Selenium WebDriver not available, using Cheerio-only mode');
    console.log('Note: Some advanced features like JavaScript rendering will not be available');
}

// Chrome options for when Selenium is available
function getChromeOptions() {
    if (!seleniumAvailable || !chrome) {
        return null;
    }
    
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-features=VizDisplayCompositor');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set Chrome binary path if specified
    if (process.env.CHROME_BIN) {
        options.setChromeBinaryPath(process.env.CHROME_BIN);
    }
    
    return options;
}

// Create a driver instance if Selenium is available
async function createDriver() {
    if (!seleniumAvailable) {
        return null;
    }
    
    try {
        const chromeOptions = getChromeOptions();
        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();
            
        return driver;
    } catch (error) {
        console.error('Failed to create Selenium driver:', error.message);
        return null;
    }
}

module.exports = {
    seleniumAvailable,
    createDriver,
    getChromeOptions,
    By
};