/**
 * OEM Incentive Compliance Checker
 * Audits dealer inventory pages to verify current incentives are displayed
 */

const puppeteer = require('puppeteer');
const { enhancedSeleniumWrapper } = require('./enhanced-selenium-wrapper');

class IncentiveChecker {
    constructor(dealerUrl, incentives) {
        this.dealerUrl = dealerUrl;
        this.incentives = incentives;
        this.results = {
            overall: 'pending',
            vehiclesChecked: 0,
            vehiclesWithIncentives: 0,
            missingIncentives: [],
            foundIncentives: [],
            errors: []
        };
    }

    /**
     * Run the incentive compliance check
     */
    async runCheck() {
        try {
            // Get list of models to check from incentives
            const modelsToCheck = this.getUniqueModels();
            console.log(`Checking incentives for models: ${modelsToCheck.join(', ')}`);

            // Find inventory/VDP pages for each model
            for (const model of modelsToCheck.slice(0, 5)) { // Limit to 5 models for performance
                await this.checkModelInventory(model);
            }

            // Calculate compliance score
            this.calculateCompliance();
            
            return this.results;
        } catch (error) {
            console.error('Error in incentive check:', error);
            this.results.overall = 'error';
            this.results.errors.push(error.message);
            return this.results;
        }
    }

    /**
     * Get unique models from incentives data
     */
    getUniqueModels() {
        const models = new Set();
        this.incentives.forEach(inc => {
            const model = inc.Model || inc.model;
            if (model) {
                models.add(model.toLowerCase());
            }
        });
        return Array.from(models);
    }

    /**
     * Check inventory for a specific model
     */
    async checkModelInventory(model) {
        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            // Try common inventory URL patterns
            const inventoryUrls = [
                `${this.dealerUrl}/new-inventory?model=${model}`,
                `${this.dealerUrl}/inventory/new?model=${model}`,
                `${this.dealerUrl}/new-vehicles/${model}`,
                `${this.dealerUrl}/search/new/${model}`
            ];

            let inventoryFound = false;
            let vehicleLinks = [];

            for (const url of inventoryUrls) {
                try {
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
                    
                    // Look for vehicle listing links
                    vehicleLinks = await page.evaluate(() => {
                        // Common selectors for vehicle listings
                        const selectors = [
                            'a[href*="/inventory/"][href*="new"]',
                            'a[href*="/vehicle/"]',
                            'a[href*="/new/"][href*="/detail"]',
                            '.vehicle-card a',
                            '.inventory-listing a',
                            'a.vehicle-link'
                        ];
                        
                        const links = new Set();
                        selectors.forEach(selector => {
                            document.querySelectorAll(selector).forEach(link => {
                                if (link.href && link.href.includes('://')) {
                                    links.add(link.href);
                                }
                            });
                        });
                        
                        return Array.from(links).slice(0, 3); // Get first 3 vehicles
                    });

                    if (vehicleLinks.length > 0) {
                        inventoryFound = true;
                        break;
                    }
                } catch (e) {
                    // Try next URL pattern
                    continue;
                }
            }

            if (!inventoryFound || vehicleLinks.length === 0) {
                this.results.errors.push(`No inventory found for ${model}`);
                await browser.close();
                return;
            }

            // Check each vehicle detail page for incentives
            for (const vehicleUrl of vehicleLinks) {
                await this.checkVehiclePage(page, vehicleUrl, model);
            }

            await browser.close();
        } catch (error) {
            console.error(`Error checking ${model}:`, error);
            this.results.errors.push(`Error checking ${model}: ${error.message}`);
        }
    }

    /**
     * Check a specific vehicle page for incentives
     */
    async checkVehiclePage(page, vehicleUrl, model) {
        try {
            await page.goto(vehicleUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            this.results.vehiclesChecked++;

            // Get all text content from the page
            const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

            // Get incentives for this model
            const modelIncentives = this.incentives.filter(inc => 
                (inc.Model || inc.model || '').toLowerCase() === model
            );

            const foundIncentives = [];
            const missingIncentives = [];

            // Check each incentive
            for (const incentive of modelIncentives) {
                const amount = incentive.Amount || incentive.amount || incentive['Amount/Rate'] || '';
                const description = (incentive.Description || incentive.description || '').toLowerCase();
                
                // Look for incentive amount or description in page text
                const amountFound = amount && pageText.includes(amount.toLowerCase());
                const descFound = description && pageText.includes(description);
                
                if (amountFound || descFound) {
                    foundIncentives.push({
                        model,
                        type: incentive.Type || incentive.type,
                        amount,
                        vehicleUrl
                    });
                } else {
                    missingIncentives.push({
                        model,
                        type: incentive.Type || incentive.type,
                        amount,
                        description: incentive.Description || incentive.description,
                        vehicleUrl
                    });
                }
            }

            if (foundIncentives.length > 0) {
                this.results.vehiclesWithIncentives++;
                this.results.foundIncentives.push(...foundIncentives);
            }

            if (missingIncentives.length > 0) {
                this.results.missingIncentives.push(...missingIncentives);
            }

        } catch (error) {
            console.error(`Error checking vehicle page ${vehicleUrl}:`, error);
            this.results.errors.push(`Failed to check ${vehicleUrl}`);
        }
    }

    /**
     * Calculate overall compliance score
     */
    calculateCompliance() {
        if (this.results.vehiclesChecked === 0) {
            this.results.overall = 'no_data';
            this.results.complianceScore = 0;
            return;
        }

        const complianceRate = (this.results.vehiclesWithIncentives / this.results.vehiclesChecked) * 100;
        this.results.complianceScore = Math.round(complianceRate);

        if (complianceRate >= 90) {
            this.results.overall = 'excellent';
        } else if (complianceRate >= 70) {
            this.results.overall = 'good';
        } else if (complianceRate >= 50) {
            this.results.overall = 'needs_improvement';
        } else {
            this.results.overall = 'poor';
        }

        // Add summary
        this.results.summary = {
            totalModelsChecked: this.getUniqueModels().length,
            vehiclesAudited: this.results.vehiclesChecked,
            vehiclesCompliant: this.results.vehiclesWithIncentives,
            totalIncentivesFound: this.results.foundIncentives.length,
            totalIncentivesMissing: this.results.missingIncentives.length
        };
    }
}

module.exports = { IncentiveChecker };