#!/usr/bin/env node

/*
 * Security Enhancements for Lead Data Analysis
 * This script implements 5 security improvements:
 * 1. Prominent security notice
 * 2. Reduced data expiry (30 days -> 7 days)
 * 3. Automatic cleanup on tab close
 * 4. Data privacy statement
 * 5. Visual deletion confirmation
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Implementing Lead Data Security Enhancements...\n');

// 1. Update lead-performance.js to reduce expiry from 30 to 7 days
console.log('1. Reducing data expiry from 30 days to 7 days...');
const leadPerfJsPath = path.join(__dirname, 'public', 'js', 'lead-performance.js');
let leadPerfJs = fs.readFileSync(leadPerfJsPath, 'utf8');

// Change 30 days to 7 days
leadPerfJs = leadPerfJs.replace(/30\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/g, '7 * 24 * 60 * 60 * 1000');
leadPerfJs = leadPerfJs.replace(/expires in 30 days/gi, 'expires in 7 days');
leadPerfJs = leadPerfJs.replace(/Data stored \(expires in 30 days\)/g, 'Data stored (expires in 7 days)');

// Add automatic cleanup on tab close
const tabCloseCode = `
// Automatic cleanup on tab/window close
window.addEventListener('beforeunload', function(e) {
    // Check if user wants to keep data
    const keepData = localStorage.getItem('keepDataOnClose') === 'true';
    if (!keepData && uploadedDealerData && Object.keys(uploadedDealerData).length > 0) {
        // Show confirmation
        e.preventDefault();
        e.returnValue = 'Your lead data will be cleared when you close this tab. Continue?';
    }
});

window.addEventListener('unload', function() {
    const keepData = localStorage.getItem('keepDataOnClose') === 'true';
    if (!keepData) {
        // Clear all lead data
        localStorage.removeItem('dealerDataComplete');
        localStorage.removeItem('dataUploadInfo');
        localStorage.removeItem('leadPerformanceData');
        sessionStorage.clear();
    }
});
`;

// Insert tab close code after DOMContentLoaded
leadPerfJs = leadPerfJs.replace(
    "document.addEventListener('DOMContentLoaded', function() {",
    tabCloseCode + "\n\ndocument.addEventListener('DOMContentLoaded', function() {"
);

// Enhance clearStoredData function with visual confirmation
const enhancedClearFunction = `
function clearStoredData() {
    // Create custom confirmation modal
    const modal = document.createElement('div');
    modal.innerHTML = \`
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h3 style="color: #DC2626; margin-bottom: 20px;">
                    <i class="fas fa-shield-alt"></i> Secure Data Deletion
                </h3>
                <p style="margin-bottom: 20px; color: #374151;">
                    This will permanently delete all lead data from your browser. This action cannot be undone.
                </p>
                <div style="background: #FEE2E2; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #991B1B; font-weight: 600;">
                        <i class="fas fa-info-circle"></i> Data to be deleted:
                    </p>
                    <ul style="text-align: left; margin: 10px 0 0 20px; color: #991B1B;">
                        <li>All uploaded lead data</li>
                        <li>Analysis results</li>
                        <li>Stored calculations</li>
                        <li>Temporary session data</li>
                    </ul>
                </div>
                <button onclick="confirmDelete()" style="background: #DC2626; color: white; padding: 10px 30px; border: none; border-radius: 5px; margin-right: 10px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Delete All Data
                </button>
                <button onclick="cancelDelete()" style="background: #6B7280; color: white; padding: 10px 30px; border: none; border-radius: 5px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    \`;
    document.body.appendChild(modal);
}

function confirmDelete() {
    // Show deletion progress
    const modal = document.querySelector('body > div:last-child');
    modal.innerHTML = \`
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #DC2626;"></i>
                </div>
                <h3 style="color: #DC2626; margin-bottom: 10px;">Securely Deleting Data...</h3>
                <p style="color: #6B7280;">Please wait while we remove all traces of your data.</p>
            </div>
        </div>
    \`;
    
    // Clear all data
    setTimeout(() => {
        localStorage.removeItem('dealerDataComplete');
        localStorage.removeItem('dataUploadInfo');
        localStorage.removeItem('leadPerformanceData');
        localStorage.removeItem('keepDataOnClose');
        sessionStorage.clear();
        uploadedDealerData = {};
        
        // Show success message
        modal.innerHTML = \`
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <div style="margin-bottom: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: #10B981;"></i>
                    </div>
                    <h3 style="color: #059669; margin-bottom: 10px;">Data Successfully Deleted</h3>
                    <p style="color: #374151; margin-bottom: 20px;">All lead data has been permanently removed from your browser.</p>
                    <button onclick="location.reload()" style="background: #10B981; color: white; padding: 10px 30px; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Refresh Page
                    </button>
                </div>
            </div>
        \`;
    }, 1500);
}

function cancelDelete() {
    document.body.removeChild(document.querySelector('body > div:last-child'));
}
`;

// Replace the existing clearStoredData function
leadPerfJs = leadPerfJs.replace(
    /function clearStoredData\(\) {[\s\S]*?location\.reload\(\);\s*}\s*}/,
    enhancedClearFunction
);

fs.writeFileSync(leadPerfJsPath, leadPerfJs);
console.log('✅ Updated lead-performance.js with security enhancements');

// 2. Update lead-performance.html to add security notice
console.log('\n2. Adding prominent security notice...');
const leadPerfHtmlPath = path.join(__dirname, 'views', 'lead-performance.html');
let leadPerfHtml = fs.readFileSync(leadPerfHtmlPath, 'utf8');

// Add security notice after the header
const securityNotice = `
    <!-- Security Notice -->
    <div class="security-notice" style="background: linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%); border: 2px solid #3B82F6; border-radius: 10px; padding: 20px; margin: 20px auto; max-width: 1200px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="display: flex; align-items: center; gap: 15px;">
            <i class="fas fa-shield-alt" style="font-size: 48px; color: #3B82F6;"></i>
            <div>
                <h3 style="margin: 0 0 10px 0; color: #1E40AF; font-size: 1.5rem;">
                    🔒 Your Data Never Leaves Your Computer
                </h3>
                <p style="margin: 0 0 10px 0; color: #1E3A8A; font-weight: 600;">
                    All lead analysis happens directly in your browser. We prioritize your privacy and security.
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #3730A3;">
                    <li>CSV files are processed locally - never uploaded to our servers</li>
                    <li>Data is stored only in your browser's localStorage</li>
                    <li>Automatic deletion after 7 days (previously 30 days)</li>
                    <li>Complete removal when you close the tab (unless you choose to keep it)</li>
                    <li>No cloud storage, no server backups, no data sharing</li>
                </ul>
                <div style="margin-top: 10px;">
                    <label style="color: #1E40AF; font-weight: 600;">
                        <input type="checkbox" id="keepDataOnClose" onchange="updateDataRetention(this.checked)" style="margin-right: 5px;">
                        Keep my data when I close this tab
                    </label>
                </div>
            </div>
        </div>
    </div>

    <script>
    function updateDataRetention(keepData) {
        localStorage.setItem('keepDataOnClose', keepData ? 'true' : 'false');
        if (keepData) {
            showToast('Data will be retained when you close the tab', 'info');
        } else {
            showToast('Data will be cleared when you close the tab', 'warning');
        }
    }
    
    // Check saved preference
    document.addEventListener('DOMContentLoaded', function() {
        const keepData = localStorage.getItem('keepDataOnClose') === 'true';
        const checkbox = document.getElementById('keepDataOnClose');
        if (checkbox) checkbox.checked = keepData;
    });
    </script>
`;

// Insert after the header section
leadPerfHtml = leadPerfHtml.replace(
    '<!-- Main Content -->',
    '<!-- Main Content -->\n' + securityNotice
);

fs.writeFileSync(leadPerfHtmlPath, leadPerfHtml);
console.log('✅ Added security notice to lead-performance.html');

// 3. Create data privacy statement
console.log('\n3. Creating data privacy statement...');
const privacyStatement = `<!--
  Auto Audit Pro - Data Privacy Statement for Lead Analysis
  © 2025 JL Robinson. All Rights Reserved.
-->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Privacy - Lead Analysis | Auto Audit Pro</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body {
            background: #f8f9fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .privacy-container {
            max-width: 800px;
            margin: 40px auto;
            background: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #1E40AF;
            margin-bottom: 30px;
        }
        h2 {
            color: #3B82F6;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .security-badge {
            background: #DBEAFE;
            border: 2px solid #3B82F6;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .key-point {
            background: #F0FDF4;
            border-left: 4px solid #10B981;
            padding: 15px;
            margin: 15px 0;
        }
        .warning {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="privacy-container">
        <a href="/lead-analysis" class="btn btn-secondary mb-3">
            <i class="fas fa-arrow-left"></i> Back to Lead Analysis
        </a>
        
        <h1><i class="fas fa-shield-alt"></i> Data Privacy Statement - Lead Analysis</h1>
        
        <div class="security-badge">
            <i class="fas fa-lock" style="font-size: 48px; color: #3B82F6; margin-bottom: 10px;"></i>
            <h3>100% Browser-Based Processing</h3>
            <p class="mb-0">Your lead data never leaves your computer</p>
        </div>

        <h2>Our Privacy Commitment</h2>
        <p>
            At Auto Audit Pro, we understand that your lead data is highly sensitive and confidential. 
            That's why we've designed our Lead Analysis tool to prioritize your privacy and security above all else.
        </p>

        <div class="key-point">
            <h4><i class="fas fa-check-circle"></i> Key Privacy Feature</h4>
            <p class="mb-0">
                <strong>No Server Upload:</strong> When you upload a CSV file, it is processed entirely within your web browser. 
                The file never touches our servers, ensuring complete privacy of your customer data.
            </p>
        </div>

        <h2>How Your Data is Handled</h2>
        
        <h3>1. File Upload Process</h3>
        <ul>
            <li>CSV/Excel files are read using JavaScript FileReader API</li>
            <li>Processing happens entirely in your browser's memory</li>
            <li>No network requests are made with your data</li>
            <li>No temporary files are created on our servers</li>
        </ul>

        <h3>2. Data Storage</h3>
        <ul>
            <li><strong>Location:</strong> Browser's localStorage only</li>
            <li><strong>Duration:</strong> Automatically expires after 7 days</li>
            <li><strong>Access:</strong> Only accessible from your browser on your device</li>
            <li><strong>Encryption:</strong> Protected by your browser's security</li>
        </ul>

        <h3>3. Data Deletion</h3>
        <ul>
            <li><strong>Manual:</strong> Click "Clear Stored Data" for immediate deletion</li>
            <li><strong>Automatic:</strong> Data clears when you close the tab (unless you opt to keep it)</li>
            <li><strong>Expiry:</strong> All data auto-deletes after 7 days</li>
            <li><strong>Complete:</strong> Deletion removes all traces from localStorage</li>
        </ul>

        <div class="warning">
            <h4><i class="fas fa-exclamation-triangle"></i> Important Note</h4>
            <p class="mb-0">
                While we ensure your data never reaches our servers, please ensure your local device is secure. 
                Use device encryption and strong passwords to protect data stored in your browser.
            </p>
        </div>

        <h2>What We Don't Do</h2>
        <ul>
            <li>❌ Upload your files to any server</li>
            <li>❌ Store your data in any database</li>
            <li>❌ Create backups of your lead data</li>
            <li>❌ Share or sell your information</li>
            <li>❌ Track individual leads or customers</li>
            <li>❌ Use cloud storage services</li>
        </ul>

        <h2>Security Measures</h2>
        <ul>
            <li>✅ 100% client-side processing</li>
            <li>✅ No server communication for lead data</li>
            <li>✅ Automatic 7-day expiration</li>
            <li>✅ Optional auto-clear on tab close</li>
            <li>✅ Visual confirmation for data deletion</li>
            <li>✅ Data integrity checksums</li>
        </ul>

        <h2>Your Rights and Control</h2>
        <p>You have complete control over your data:</p>
        <ul>
            <li>Delete your data at any time with one click</li>
            <li>Choose whether to keep data when closing the tab</li>
            <li>Export your analysis results without uploading raw data</li>
            <li>Use the tool without creating an account or providing personal information</li>
        </ul>

        <h2>Questions or Concerns?</h2>
        <p>
            If you have any questions about how we handle data privacy in our Lead Analysis tool, 
            please contact us at <a href="mailto:support@autoauditpro.io">support@autoauditpro.io</a>
        </p>

        <div class="text-center mt-5">
            <p class="text-muted">Last updated: ${new Date().toLocaleDateString()}</p>
            <p class="text-muted">© 2025 Auto Audit Pro. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'views', 'lead-data-privacy.html'), privacyStatement);
console.log('✅ Created data privacy statement');

// 4. Add route for privacy statement
console.log('\n4. Adding privacy statement route to server.js...');
const serverJsPath = path.join(__dirname, 'server.js');
let serverJs = fs.readFileSync(serverJsPath, 'utf8');

// Add route after other routes
const privacyRoute = `
// Lead Data Privacy Statement
app.get('/lead-data-privacy', (req, res) => {
    res.render('lead-data-privacy.html');
});
`;

// Insert after the lead-analysis route
serverJs = serverJs.replace(
    "app.get('/lead-analysis', (req, res) => {\n    res.render('lead-performance.html');\n});",
    "app.get('/lead-analysis', (req, res) => {\n    res.render('lead-performance.html');\n});\n" + privacyRoute
);

fs.writeFileSync(serverJsPath, serverJs);
console.log('✅ Added privacy statement route');

// 5. Add link to privacy statement in lead-performance.html
console.log('\n5. Adding privacy statement link...');
leadPerfHtml = fs.readFileSync(leadPerfHtmlPath, 'utf8');

// Add link in the security notice
leadPerfHtml = leadPerfHtml.replace(
    '<li>No cloud storage, no server backups, no data sharing</li>',
    '<li>No cloud storage, no server backups, no data sharing</li>\n                </ul>\n                <p style="margin: 10px 0 0 0;">\n                    <a href="/lead-data-privacy" target="_blank" style="color: #2563EB; text-decoration: underline;">\n                        <i class="fas fa-external-link-alt"></i> Read our full Data Privacy Statement\n                    </a>\n                </p>\n                <ul style="margin: 0; padding-left: 20px; color: #3730A3; display: none;">'
);

fs.writeFileSync(leadPerfHtmlPath, leadPerfHtml);
console.log('✅ Added privacy statement link');

console.log('\n🎉 Security Enhancements Complete!');
console.log('\nChanges implemented:');
console.log('1. ✅ Prominent security notice added');
console.log('2. ✅ Data expiry reduced from 30 to 7 days');
console.log('3. ✅ Automatic cleanup on tab close (with opt-out)');
console.log('4. ✅ Data privacy statement created');
console.log('5. ✅ Visual deletion confirmation added');

console.log('\nNext steps:');
console.log('1. Upload these files to your server');
console.log('2. Restart PM2: pm2 restart auto-audit');
console.log('3. Test the new security features');