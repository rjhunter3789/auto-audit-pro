/**
 * ROI Configuration
 * Admin-only settings for ROI calculations
 * These values can only be modified by administrators
 */

// Default ROI calculation parameters
const DEFAULT_ROI_CONFIG = {
    avgLeadsPerMonth: 100,
    avgConversionRate: 0.02,
    avgDealValue: 30000,
    avgGrossProfit: 3000,
    leadValueMultiplier: 1.0,
    
    // Expected improvements from fixes
    improvements: {
        missingPhoneNumber: { leadIncrease: 15 },
        missingContactForm: { leadIncrease: 20 },
        slowPageLoad: { conversionIncrease: 10 },
        poorMobileExperience: { leadIncrease: 25 },
        missingMetaDescription: { trafficIncrease: 15 },
        expiredOffers: { conversionIncrease: 5 },
        missingInventory: { leadIncrease: 30 },
        sslIssues: { conversionIncrease: 15 }
    }
};

const fs = require('fs');
const path = require('path');

// Path to ROI config file
const CONFIG_FILE = path.join(__dirname, '..', 'data', 'roi-config.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load config from file or use defaults
let currentConfig;
try {
    if (fs.existsSync(CONFIG_FILE)) {
        currentConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } else {
        currentConfig = { ...DEFAULT_ROI_CONFIG };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
    }
} catch (error) {
    console.error('Error loading ROI config:', error);
    currentConfig = { ...DEFAULT_ROI_CONFIG };
}

/**
 * Get current ROI configuration
 * @returns {Object} Current ROI configuration
 */
function getROIConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading ROI config:', error);
    }
    return { ...currentConfig };
}

/**
 * Update ROI configuration (Admin only)
 * @param {Object} newConfig - New configuration values
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Object} Updated configuration or error
 */
function updateROIConfig(newConfig, isAdmin) {
    if (!isAdmin) {
        throw new Error('Only administrators can modify ROI configuration');
    }
    
    // Validate config values
    if (newConfig.avgLeadsPerMonth && newConfig.avgLeadsPerMonth < 0) {
        throw new Error('Average leads per month must be positive');
    }
    
    if (newConfig.avgConversionRate && (newConfig.avgConversionRate < 0 || newConfig.avgConversionRate > 1)) {
        throw new Error('Conversion rate must be between 0 and 1');
    }
    
    if (newConfig.avgDealValue && newConfig.avgDealValue < 0) {
        throw new Error('Average deal value must be positive');
    }
    
    // Merge with existing config
    currentConfig = {
        ...currentConfig,
        ...newConfig,
        improvements: {
            ...currentConfig.improvements,
            ...(newConfig.improvements || {})
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin'
    };
    
    // Save to file
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
        console.log('ROI config saved successfully');
    } catch (error) {
        console.error('Error saving ROI config:', error);
        throw new Error('Failed to save configuration');
    }
    
    return getROIConfig();
}

/**
 * Reset to default configuration (Admin only)
 * @param {boolean} isAdmin - Whether user is admin
 */
function resetROIConfig(isAdmin) {
    if (!isAdmin) {
        throw new Error('Only administrators can reset ROI configuration');
    }
    
    currentConfig = { 
        ...DEFAULT_ROI_CONFIG,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin'
    };
    
    // Save to file
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
        console.log('ROI config reset to defaults');
    } catch (error) {
        console.error('Error saving ROI config:', error);
        throw new Error('Failed to reset configuration');
    }
    
    return getROIConfig();
}

/**
 * Calculate ROI based on current configuration
 * @param {Array} issues - Array of issues found
 * @returns {Object} ROI calculation results
 */
function calculateROI(issues) {
    const config = getROIConfig();
    const improvements = {
        leadIncrease: 0,
        conversionIncrease: 0,
        trafficIncrease: 0,
        estimatedMonthlyValue: 0,
        estimatedAnnualValue: 0
    };
    
    // Map common issues to improvements
    issues.forEach(issue => {
        const issueKey = issue.title.toLowerCase();
        
        if (issueKey.includes('phone') && config.improvements.missingPhoneNumber) {
            improvements.leadIncrease += config.improvements.missingPhoneNumber.leadIncrease;
        }
        if (issueKey.includes('form') && config.improvements.missingContactForm) {
            improvements.leadIncrease += config.improvements.missingContactForm.leadIncrease;
        }
        if (issueKey.includes('slow') && config.improvements.slowPageLoad) {
            improvements.conversionIncrease += config.improvements.slowPageLoad.conversionIncrease;
        }
        if (issueKey.includes('mobile') && config.improvements.poorMobileExperience) {
            improvements.leadIncrease += config.improvements.poorMobileExperience.leadIncrease;
        }
        if (issueKey.includes('meta') && config.improvements.missingMetaDescription) {
            improvements.trafficIncrease += config.improvements.missingMetaDescription.trafficIncrease;
        }
        if (issueKey.includes('expired') && config.improvements.expiredOffers) {
            improvements.conversionIncrease += config.improvements.expiredOffers.conversionIncrease;
        }
        if (issueKey.includes('inventory') && config.improvements.missingInventory) {
            improvements.leadIncrease += config.improvements.missingInventory.leadIncrease;
        }
        if (issueKey.includes('ssl') && config.improvements.sslIssues) {
            improvements.conversionIncrease += config.improvements.sslIssues.conversionIncrease;
        }
    });
    
    // Calculate value based on improvements
    const additionalLeads = config.avgLeadsPerMonth * (improvements.leadIncrease / 100);
    const improvedConversionRate = config.avgConversionRate * (1 + improvements.conversionIncrease / 100);
    const totalLeads = config.avgLeadsPerMonth + additionalLeads;
    
    const currentSales = config.avgLeadsPerMonth * config.avgConversionRate;
    const improvedSales = totalLeads * improvedConversionRate;
    const additionalSales = improvedSales - currentSales;
    
    improvements.estimatedMonthlyValue = Math.round(additionalSales * config.avgGrossProfit);
    improvements.estimatedAnnualValue = improvements.estimatedMonthlyValue * 12;
    
    return {
        ...improvements,
        config: {
            avgLeadsPerMonth: config.avgLeadsPerMonth,
            avgConversionRate: config.avgConversionRate,
            avgGrossProfit: config.avgGrossProfit
        }
    };
}

module.exports = {
    getROIConfig,
    updateROIConfig,
    resetROIConfig,
    calculateROI,
    DEFAULT_ROI_CONFIG
};