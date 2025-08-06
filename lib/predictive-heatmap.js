/**
 * Predictive Heatmap Generator for Auto Audit Pro
 * Generates heatmaps showing predicted user interaction patterns on dealer websites
 */

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class PredictiveHeatmapGenerator {
    constructor() {
        this.hotZones = {
            // Element priorities (higher = hotter)
            'button': 10,
            'a': 8,
            'input[type="submit"]': 10,
            'input[type="button"]': 10,
            '.btn': 10,
            '.button': 10,
            'nav': 7,
            'header': 6,
            'form': 8,
            'input': 6,
            'select': 6,
            'img': 4,
            '.cta': 10,
            '[onclick]': 9,
            '[href^="tel:"]': 10,
            '[href^="mailto:"]': 9
        };

        this.positionWeights = {
            aboveFold: 1.5,      // Elements above fold get 50% boost
            centerScreen: 1.3,   // Center elements get 30% boost
            topArea: 1.2,        // Top 20% of page gets 20% boost
            rightSide: 0.8       // Right side gets 20% reduction (less viewed)
        };
    }

    /**
     * Generate a predictive heatmap for a website
     * @param {string} url - The website URL to analyze
     * @param {string} brand - The dealership brand
     * @returns {object} Heatmap data and image path
     */
    async generateHeatmap(url, brand) {
        let browser;
        try {
            console.log(`[HEATMAP] Generating predictive heatmap for ${url}`);
            
            // Launch browser
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Navigate to page
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Wait for content to load
            await page.waitForTimeout(3000);

            // Take screenshot
            const timestamp = Date.now();
            const screenshotPath = path.join(__dirname, '..', 'public', 'heatmaps', `screenshot_${timestamp}.png`);
            await this.ensureDirectory(path.dirname(screenshotPath));
            await page.screenshot({ path: screenshotPath, fullPage: false });

            // Analyze page elements
            const elements = await this.analyzePageElements(page);
            
            // Generate heatmap overlay
            const heatmapPath = await this.createHeatmapOverlay(screenshotPath, elements, timestamp);
            
            // Calculate insights
            const insights = this.generateInsights(elements, brand);

            await browser.close();

            return {
                success: true,
                screenshotPath: `/heatmaps/screenshot_${timestamp}.png`,
                heatmapPath: `/heatmaps/heatmap_${timestamp}.png`,
                elementCount: elements.length,
                insights: insights,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('[HEATMAP] Error generating heatmap:', error);
            if (browser) await browser.close();
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze page elements and calculate heat values
     */
    async analyzePageElements(page) {
        return await page.evaluate((hotZones) => {
            const elements = [];
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Function to calculate heat value
            function calculateHeatValue(element, selector, baseValue) {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.left >= 0 && 
                                rect.bottom <= viewportHeight && rect.right <= viewportWidth;
                
                if (!isVisible && rect.top > viewportHeight) return null; // Skip elements below viewport
                
                let heatValue = baseValue;

                // Position multipliers
                if (rect.top < viewportHeight) heatValue *= 1.5; // Above fold
                if (rect.top < viewportHeight * 0.2) heatValue *= 1.2; // Top area
                if (rect.left > viewportWidth * 0.5 && rect.left < viewportWidth * 0.8) heatValue *= 1.3; // Center-ish
                if (rect.left > viewportWidth * 0.8) heatValue *= 0.8; // Far right

                // Size bonus (bigger = more likely to be clicked)
                const size = rect.width * rect.height;
                if (size > 10000) heatValue *= 1.1;
                if (size > 50000) heatValue *= 1.2;

                // Text content bonus
                const text = element.textContent.toLowerCase();
                if (text.includes('buy') || text.includes('shop') || text.includes('get')) heatValue *= 1.3;
                if (text.includes('call') || text.includes('contact')) heatValue *= 1.4;
                if (text.includes('schedule') || text.includes('appointment')) heatValue *= 1.3;
                if (text.includes('inventory') || text.includes('vehicles')) heatValue *= 1.2;

                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height,
                    heatValue: Math.min(heatValue, 15), // Cap at 15
                    type: element.tagName.toLowerCase(),
                    text: element.textContent.trim().substring(0, 50),
                    label: element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent.trim().substring(0, 50)
                };
            }

            // Analyze all hot zone selectors
            for (const [selector, baseValue] of Object.entries(hotZones)) {
                const nodeList = document.querySelectorAll(selector);
                nodeList.forEach(element => {
                    const data = calculateHeatValue(element, selector, baseValue);
                    if (data) elements.push(data);
                });
            }

            return elements;
        }, this.hotZones);
    }

    /**
     * Create heatmap overlay image
     */
    async createHeatmapOverlay(screenshotPath, elements, timestamp) {
        try {
            // Load the screenshot
            const screenshot = await sharp(screenshotPath);
            const metadata = await screenshot.metadata();

            // Create a transparent overlay
            const overlay = await this.createHeatmapLayer(metadata.width, metadata.height, elements);

            // Composite the heatmap over the screenshot
            const heatmapPath = path.join(__dirname, '..', 'public', 'heatmaps', `heatmap_${timestamp}.png`);
            
            await sharp(screenshotPath)
                .composite([{
                    input: overlay,
                    blend: 'over'
                }])
                .toFile(heatmapPath);

            return heatmapPath;
        } catch (error) {
            console.error('[HEATMAP] Error creating overlay:', error);
            throw error;
        }
    }

    /**
     * Create the heatmap layer with hot spots
     */
    async createHeatmapLayer(width, height, elements) {
        // Create SVG heatmap
        const hotspots = elements.map(el => {
            const radius = Math.max(30, Math.min(100, el.width / 2, el.height / 2));
            const opacity = Math.min(0.6, el.heatValue / 20);
            const color = this.getHeatColor(el.heatValue);
            
            return `<circle cx="${el.x}" cy="${el.y}" r="${radius}" 
                     fill="${color}" opacity="${opacity}" 
                     filter="url(#blur)" />`;
        }).join('\n');

        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="blur">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
                    </filter>
                </defs>
                ${hotspots}
            </svg>
        `;

        return Buffer.from(svg);
    }

    /**
     * Get color based on heat value
     */
    getHeatColor(value) {
        if (value > 12) return '#FF0000';      // Red (hottest)
        if (value > 9) return '#FF4500';       // Orange-red
        if (value > 7) return '#FFA500';       // Orange
        if (value > 5) return '#FFFF00';       // Yellow
        if (value > 3) return '#ADFF2F';       // Yellow-green
        return '#00FF00';                       // Green (coolest)
    }

    /**
     * Generate insights based on the heatmap analysis
     */
    generateInsights(elements, brand) {
        // Group elements by type
        const elementGroups = {};
        elements.forEach(el => {
            const type = el.type;
            if (!elementGroups[type]) {
                elementGroups[type] = 0;
            }
            elementGroups[type]++;
        });

        const insights = {
            totalInteractiveElements: elements.length,
            elementSummary: this.createElementSummary(elementGroups),
            hotspots: [],
            recommendations: []
        };

        // Find the hottest areas with meaningful text
        const hottestElements = elements
            .filter(el => el.label && el.label.length > 3) // Filter out empty or very short labels
            .sort((a, b) => b.heatValue - a.heatValue)
            .slice(0, 5);

        hottestElements.forEach(el => {
            insights.hotspots.push({
                type: this.getElementTypeDescription(el.type),
                predictedActivity: 'High',
                text: el.label
            });
        });

        // Generate recommendations
        const hasPhoneLinks = elements.some(el => el.text.includes('call') || el.type === 'a[href^="tel:"]');
        const hasCTA = elements.some(el => el.heatValue > 10);
        const hasInventoryLink = elements.some(el => el.text.toLowerCase().includes('inventory'));

        if (!hasPhoneLinks) {
            insights.recommendations.push({
                priority: 'High',
                message: 'Add prominent click-to-call buttons in the header and above the fold'
            });
        }

        if (!hasCTA) {
            insights.recommendations.push({
                priority: 'High',
                message: 'No strong call-to-action elements detected. Add prominent CTAs above the fold'
            });
        }

        if (!hasInventoryLink) {
            insights.recommendations.push({
                priority: 'Medium',
                message: 'Make inventory/vehicle search more prominent for better user engagement'
            });
        }

        const topAreaElements = elements.filter(el => el.y < 200).length;
        if (topAreaElements < 3) {
            insights.recommendations.push({
                priority: 'Medium',
                message: 'Header area has limited interactive elements. Consider adding more navigation options'
            });
        }

        return insights;
    }

    /**
     * Create a summary of element types
     */
    createElementSummary(elementGroups) {
        const summary = [];
        const typeDescriptions = {
            'a': 'Links',
            'button': 'Buttons',
            'input': 'Input Fields',
            'select': 'Dropdowns',
            'img': 'Images',
            'form': 'Forms',
            'nav': 'Navigation Elements'
        };

        // Sort by count and create summary
        Object.entries(elementGroups)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5) // Top 5 element types
            .forEach(([type, count]) => {
                const description = typeDescriptions[type] || type.toUpperCase();
                summary.push(`${count} ${description}`);
            });

        return summary.join(', ');
    }

    /**
     * Get user-friendly element type description
     */
    getElementTypeDescription(type) {
        const descriptions = {
            'a': 'Link',
            'button': 'Button',
            'input': 'Input Field',
            'select': 'Dropdown',
            'img': 'Image',
            'form': 'Form',
            'nav': 'Navigation'
        };
        return descriptions[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Ensure directory exists
     */
    async ensureDirectory(dir) {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
}

module.exports = PredictiveHeatmapGenerator;