/*
 * Auto Audit Pro - Disable Heatmap Generation
 * Quick fix to prevent slow heatmap generation during audits
 */

// Override any heatmap generation functions
if (global.PredictiveHeatmapGenerator) {
    global.PredictiveHeatmapGenerator.prototype.generate = async function() {
        console.log('[Heatmap] Skipping heatmap generation for performance');
        return {
            success: false,
            message: 'Heatmap generation disabled for performance',
            placeholder: '/images/heatmap-placeholder.png'
        };
    };
}

// Patch any screenshot functions
if (global.takeScreenshot) {
    global.takeScreenshot = async function() {
        console.log('[Screenshot] Skipping screenshot for performance');
        return null;
    };
}

// Ensure Selenium/Puppeteer operations are minimal
process.env.DISABLE_VISUAL_ANALYSIS = 'true';

module.exports = {
    disableHeatmaps: true
};