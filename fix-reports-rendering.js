/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Fix for Report Template Rendering
 * Add this to server.js to properly render audit reports
 */

// Add these routes to server.js (before the 404 handler)

// Route to display audit report
app.get('/audit/:auditId/report', checkAuth, async (req, res) => {
    try {
        const { auditId } = req.params;
        const auditsData = JSON.parse(await fs.readFile(AUDITS_FILE, 'utf8'));
        const audit = auditsData.audits.find(a => a.id === auditId);
        
        if (!audit) {
            return res.status(404).send('Audit not found');
        }
        
        // Filter by dealership if not admin
        if (req.session.role !== 'admin' && audit.dealerInfo?.name !== req.session.dealership) {
            return res.status(403).send('Access denied');
        }
        
        // Render the appropriate template based on audit type
        const templateMap = {
            'seo': 'reports',
            'comprehensive': 'reports-dealer-style',
            'custom': 'reports-new'
        };
        
        const template = templateMap[audit.auditType] || 'reports';
        
        // First rename the HTML files to EJS
        // Then use: res.render(template, { results: audit });
        
        // For now, send the audit data as JSON
        res.json({
            message: 'Report rendering needs to be fixed',
            audit: audit,
            template: template + '.ejs'
        });
        
    } catch (error) {
        console.error('Error loading audit:', error);
        res.status(500).send('Error loading audit report');
    }
});

// Alternative: Quick client-side fix
// Add this JavaScript to the report HTML files to properly load and display data:
const reportFix = `
<script>
// Get audit ID from URL
const pathParts = window.location.pathname.split('/');
const auditId = pathParts[pathParts.indexOf('audit') + 1];

// Load audit data
fetch('/api/audit/' + auditId)
    .then(response => response.json())
    .then(audit => {
        // Replace all template variables
        document.body.innerHTML = document.body.innerHTML
            .replace(/<%= results.domain %>/g, audit.domain || '')
            .replace(/<%= results.brand %>/g, audit.brand || '')
            .replace(/<%= results.overallScore %>/g, audit.overallScore || 0)
            .replace(/<%= results.auditDepth %>/g, audit.auditDepth || 'comprehensive')
            .replace(/<%= results.auditType %>/g, audit.auditType || 'seo');
            
        // Update specific elements
        if (document.getElementById('reportDate')) {
            document.getElementById('reportDate').textContent = new Date(audit.timestamp).toLocaleDateString();
        }
    })
    .catch(error => {
        console.error('Error loading audit data:', error);
    });
</script>
`;