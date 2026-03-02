/**
 * Auto Audit Pro - PDF Report Generator
 * Uses Puppeteer to render audit reports as PDF
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure PDF output directory exists
const PDF_DIR = path.join(__dirname, '../public/reports');
if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Generate a PDF report from audit results
 * @param {Object} audit - The audit results object
 * @param {string} baseUrl - The base URL of the server (e.g., https://autoauditpro.io)
 * @returns {Promise<string>} - The URL to the generated PDF
 */
async function generateAuditPDF(audit, baseUrl = 'https://autoauditpro.io') {
    const auditId = audit.id || `audit-${Date.now()}`;
    const pdfFilename = `report-${auditId}.pdf`;
    const pdfPath = path.join(PDF_DIR, pdfFilename);

    console.log(`[PDF] Generating PDF for audit ${auditId}...`);

    let browser;
    try {
        // Launch Puppeteer with appropriate flags for server environment
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-features=VizDisplayCompositor'
            ],
            executablePath: process.env.CHROME_BIN || '/usr/bin/chromium-browser'
        });

        const page = await browser.newPage();

        // Set viewport for consistent rendering
        await page.setViewport({ width: 1200, height: 800 });

        // Generate HTML content for the PDF
        const htmlContent = generateReportHTML(audit);

        // Set the HTML content
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Generate PDF
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        console.log(`[PDF] Generated: ${pdfPath}`);

        // Return the public URL
        const pdfUrl = `${baseUrl}/reports/${pdfFilename}`;
        return pdfUrl;

    } catch (error) {
        console.error('[PDF] Generation failed:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Generate HTML content for the audit report
 */
function generateReportHTML(audit) {
    const domain = audit.domain || 'Unknown';
    const score = audit.overallScore || 0;
    const results = audit.results || {};
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Determine score color and label
    let scoreColor, scoreLabel;
    if (score >= 85) {
        scoreColor = '#10B981';
        scoreLabel = 'Excellent';
    } else if (score >= 75) {
        scoreColor = '#3B82F6';
        scoreLabel = 'Good';
    } else if (score >= 65) {
        scoreColor = '#F59E0B';
        scoreLabel = 'Needs Improvement';
    } else {
        scoreColor = '#EF4444';
        scoreLabel = 'Critical';
    }

    // Generate category sections
    let categorySections = '';
    for (const [categoryName, categoryData] of Object.entries(results)) {
        const catScore = Math.round((categoryData.score || 0) * 20);
        const catColor = catScore >= 80 ? '#10B981' : catScore >= 60 ? '#F59E0B' : '#EF4444';

        categorySections += `
        <div class="category-section">
            <h3>${categoryName}</h3>
            <div class="category-score" style="color: ${catColor};">
                Score: ${catScore}/100
            </div>
            ${categoryData.recommendations ? `
            <div class="recommendations">
                <h4>Recommendations:</h4>
                <ul>
                    ${categoryData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${domain} - Website Analysis Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #6B46C1;
            padding-bottom: 30px;
            margin-bottom: 40px;
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #6B46C1;
            margin-bottom: 10px;
        }

        .report-title {
            font-size: 24px;
            color: #333;
            margin-bottom: 5px;
        }

        .domain {
            font-size: 20px;
            color: #666;
            margin-bottom: 10px;
        }

        .date {
            color: #888;
            font-size: 14px;
        }

        .score-section {
            text-align: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 16px;
            padding: 40px;
            margin-bottom: 40px;
        }

        .score-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: ${scoreColor};
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .score-number {
            font-size: 48px;
            font-weight: bold;
        }

        .score-label {
            font-size: 14px;
            opacity: 0.9;
        }

        .score-text {
            font-size: 24px;
            color: ${scoreColor};
            font-weight: bold;
        }

        .category-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            border-left: 4px solid #6B46C1;
        }

        .category-section h3 {
            color: #6B46C1;
            margin-bottom: 10px;
            font-size: 18px;
        }

        .category-score {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
        }

        .recommendations h4 {
            color: #444;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .recommendations ul {
            margin-left: 20px;
        }

        .recommendations li {
            margin-bottom: 8px;
            color: #555;
            font-size: 14px;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #888;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Auto Audit Pro</div>
        <div class="report-title">Website Analysis Report</div>
        <div class="domain">${domain}</div>
        <div class="date">Generated: ${date}</div>
    </div>

    <div class="score-section">
        <div class="score-circle">
            <div class="score-number">${score}</div>
            <div class="score-label">out of 100</div>
        </div>
        <div class="score-text">${scoreLabel}</div>
    </div>

    <h2 style="color: #6B46C1; margin-bottom: 20px;">Category Breakdown</h2>

    ${categorySections}

    <div class="footer">
        <p>Generated by Auto Audit Pro - Professional Website Analysis</p>
        <p>&copy; ${new Date().getFullYear()} Auto Audit Pro. All rights reserved.</p>
    </div>
</body>
</html>
    `;
}

module.exports = {
    generateAuditPDF,
    generateReportHTML
};
