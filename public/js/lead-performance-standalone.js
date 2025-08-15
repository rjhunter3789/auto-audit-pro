/*
 * Standalone Dealer Lead Performance Analysis
 * Auto Audit Pro Suite
 * 
 * Designed specifically for single dealer reports with PA Code format
 */

// Global variables
let dealerData = null;
let charts = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Standalone Lead Analysis initializing...');
    setupFileUpload();
    initializeCharts();
});

// Setup file upload handlers
function setupFileUpload() {
    const uploadCard = document.getElementById('uploadCard');
    const fileInput = document.getElementById('fileInput');
    
    // Click to upload
    uploadCard.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    uploadCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadCard.classList.add('dragover');
    });
    
    uploadCard.addEventListener('dragleave', () => {
        uploadCard.classList.remove('dragover');
    });
    
    uploadCard.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadCard.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    });
}

// Process uploaded file
function processFile(file) {
    console.log('Processing file:', file.name);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let data;
            
            if (file.name.endsWith('.csv')) {
                data = parseCSV(e.target.result);
            } else {
                // Excel file
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            }
            
            analyzeDealerData(data, file.name);
            
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file. Please check the format and try again.');
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

// Parse CSV data
function parseCSV(text) {
    const lines = text.split('\n');
    return lines.map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    });
}

// Analyze dealer data
function analyzeDealerData(data, filename) {
    console.log('Analyzing data, rows:', data.length);
    
    // Reset dealer data
    dealerData = {
        paCode: '',
        name: '',
        brand: '',
        totalLeads: 0,
        sales: 0,
        responded: 0,
        noResponse: 0,
        leadTypes: {
            Form: { count: 0, sales: 0 },
            Phone: { count: 0, sales: 0 },
            Chat: { count: 0, sales: 0 }
        },
        leadSources: {},
        responseTimeBreakdown: {
            '0-15min': 0,
            '16-30min': 0,
            '31-60min': 0,
            '1-24hr': 0,
            '24hr+': 0,
            'No Response': 0
        }
    };
    
    // Check for PA Code in A1
    if (data[0] && data[0][0]) {
        const cellA1 = String(data[0][0]).trim();
        const paCodeMatch = cellA1.match(/^([FL])(\d{5})$/);
        
        if (paCodeMatch) {
            dealerData.paCode = cellA1;
            dealerData.brand = paCodeMatch[1] === 'F' ? 'Ford' : 'Lincoln';
            dealerData.name = `${dealerData.brand} Dealer ${paCodeMatch[2]}`;
            console.log('Found dealer:', dealerData.name);
        } else {
            // Try to extract from filename
            const filenameMatch = filename.match(/([FL]?\d{5})/);
            if (filenameMatch) {
                dealerData.paCode = filenameMatch[1];
                dealerData.name = `Dealer ${filenameMatch[1]}`;
            }
        }
    }
    
    // Use same column mapping as network dealers
    const columnMap = {
        leadSource: 1,      // Column B
        leadType: 2,        // Column C
        outcome: 3,         // Column D
        actionableDate: 5,  // Column F
        responseDate: 6,    // Column G
        elapsedTime: 7,     // Column H
        saleDate: 9         // Column J
    };
    
    // If headers exist in row 2, try to find columns dynamically
    if (data[1] && data[1].length > 5) {
        const headers = data[1];
        headers.forEach((header, index) => {
            if (!header) return;
            const h = String(header).toLowerCase().trim();
            if (h.includes('lead source')) columnMap.leadSource = index;
            else if (h.includes('lead type')) columnMap.leadType = index;
            else if (h.includes('outcome')) columnMap.outcome = index;
            else if (h.includes('actionable')) columnMap.actionableDate = index;
            else if (h.includes('response date') || h === 'response date') columnMap.responseDate = index;
            else if (h.includes('sale date')) columnMap.saleDate = index;
        });
    }
    
    // Process data starting from row 3
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;
        
        const leadType = row[columnMap.leadType] || row[2]; // Default column C
        const leadSource = row[columnMap.leadSource] || row[1]; // Default column B
        const outcome = row[columnMap.outcome] || row[3]; // Default column D
        
        // Skip empty or total rows
        if (!leadType || !leadSource || 
            String(leadSource).toLowerCase().includes('total') ||
            String(leadSource).toLowerCase().includes('grand')) {
            continue;
        }
        
        // Count lead
        dealerData.totalLeads++;
        
        // Count by type
        if (dealerData.leadTypes[leadType]) {
            dealerData.leadTypes[leadType].count++;
        }
        
        // Count by source
        if (!dealerData.leadSources[leadSource]) {
            dealerData.leadSources[leadSource] = { count: 0, sales: 0 };
        }
        dealerData.leadSources[leadSource].count++;
        
        // Check if sold - look for specific outcomes
        if (outcome && (
            String(outcome).toLowerCase().includes('sold') ||
            String(outcome).toLowerCase().includes('retail') ||
            String(outcome).toLowerCase().includes('delivery')
        )) {
            dealerData.sales++;
            if (dealerData.leadTypes[leadType]) {
                dealerData.leadTypes[leadType].sales++;
            }
            dealerData.leadSources[leadSource].sales++;
        }
        
        // Calculate response time
        if (columnMap.actionableDate >= 0 && columnMap.responseDate >= 0) {
            const actionable = row[columnMap.actionableDate];
            const response = row[columnMap.responseDate];
            
            // Check for various "no response" indicators
            if (!response || 
                response === '' || 
                String(response).toLowerCase() === 'no response' ||
                String(response).toLowerCase() === 'no' ||
                String(response).toLowerCase() === 'none' ||
                String(response).toLowerCase() === 'n/a') {
                dealerData.noResponse++;
                dealerData.responseTimeBreakdown['No Response']++;
            } else {
                dealerData.responded++;
                // Calculate response time category
                const responseMinutes = calculateResponseTime(actionable, response);
                categorizeResponseTime(responseMinutes);
            }
        } else {
            // If we can't find response columns, log it
            console.log('Warning: Could not find response date columns');
        }
    }
    
    console.log('Analysis complete:', dealerData);
    displayResults();
}

// Calculate response time in minutes
function calculateResponseTime(actionable, response) {
    // This is simplified - you may need to adjust based on your date format
    try {
        const start = new Date(actionable);
        const end = new Date(response);
        return Math.floor((end - start) / 1000 / 60); // Minutes
    } catch (e) {
        return 999999; // Large number for errors
    }
}

// Categorize response time
function categorizeResponseTime(minutes) {
    if (minutes <= 15) {
        dealerData.responseTimeBreakdown['0-15min']++;
    } else if (minutes <= 30) {
        dealerData.responseTimeBreakdown['16-30min']++;
    } else if (minutes <= 60) {
        dealerData.responseTimeBreakdown['31-60min']++;
    } else if (minutes <= 1440) { // 24 hours
        dealerData.responseTimeBreakdown['1-24hr']++;
    } else {
        dealerData.responseTimeBreakdown['24hr+']++;
    }
}

// Display results
function displayResults() {
    // Hide upload, show analysis
    document.getElementById('uploadCard').style.display = 'none';
    document.getElementById('analysisSection').classList.add('active');
    
    // Update dealer info
    document.getElementById('dealerName').textContent = dealerData.name || 'Unknown Dealer';
    document.getElementById('analysisPeriod').textContent = new Date().toLocaleDateString();
    
    // Update metrics
    document.getElementById('totalLeads').textContent = dealerData.totalLeads.toLocaleString();
    document.getElementById('conversionRate').textContent = 
        dealerData.totalLeads > 0 ? 
        ((dealerData.sales / dealerData.totalLeads) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('responseRate').textContent = 
        dealerData.totalLeads > 0 ? 
        ((dealerData.responded / dealerData.totalLeads) * 100).toFixed(1) + '%' : '0%';
    
    // Calculate average response time (simplified)
    const avgResponseTime = dealerData.responded > 0 ? '< 30 min' : 'N/A';
    document.getElementById('avgResponseTime').textContent = avgResponseTime;
    
    // Update charts
    updateCharts();
}

// Initialize empty charts
function initializeCharts() {
    // Lead Source Chart
    const sourceCtx = document.getElementById('leadSourceChart');
    if (sourceCtx) {
        charts.leadSource = new Chart(sourceCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Leads',
                    data: [],
                    backgroundColor: '#6B46C1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Lead Sources'
                    }
                }
            }
        });
    }
    
    // Response Time Chart
    const responseCtx = document.getElementById('responseTimeChart');
    if (responseCtx) {
        charts.responseTime = new Chart(responseCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#10B981',
                        '#3B82F6', 
                        '#F59E0B',
                        '#EF4444',
                        '#8B5CF6',
                        '#6B7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Response Time Distribution'
                    }
                }
            }
        });
    }
    
    // Lead Type Chart
    const typeCtx = document.getElementById('leadTypeChart');
    if (typeCtx) {
        charts.leadType = new Chart(typeCtx, {
            type: 'bar',
            data: {
                labels: ['Form', 'Phone', 'Chat'],
                datasets: [{
                    label: 'Leads',
                    data: [],
                    backgroundColor: '#6B46C1'
                }, {
                    label: 'Sales',
                    data: [],
                    backgroundColor: '#10B981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Lead Type Performance'
                    }
                }
            }
        });
    }
}

// Update charts with data
function updateCharts() {
    // Update lead source chart
    if (charts.leadSource && dealerData.leadSources) {
        const sources = Object.entries(dealerData.leadSources)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10); // Top 10
        
        charts.leadSource.data.labels = sources.map(s => s[0]);
        charts.leadSource.data.datasets[0].data = sources.map(s => s[1].count);
        charts.leadSource.update();
    }
    
    // Update response time chart
    if (charts.responseTime) {
        charts.responseTime.data.labels = Object.keys(dealerData.responseTimeBreakdown);
        charts.responseTime.data.datasets[0].data = Object.values(dealerData.responseTimeBreakdown);
        charts.responseTime.update();
    }
    
    // Update lead type chart
    if (charts.leadType) {
        charts.leadType.data.datasets[0].data = [
            dealerData.leadTypes.Form.count,
            dealerData.leadTypes.Phone.count,
            dealerData.leadTypes.Chat.count
        ];
        charts.leadType.data.datasets[1].data = [
            dealerData.leadTypes.Form.sales,
            dealerData.leadTypes.Phone.sales,
            dealerData.leadTypes.Chat.sales
        ];
        charts.leadType.update();
    }
}

// Export report
function exportReport() {
    // Simple CSV export
    let csv = 'Metric,Value\n';
    csv += `Dealer,${dealerData.name}\n`;
    csv += `Total Leads,${dealerData.totalLeads}\n`;
    csv += `Total Sales,${dealerData.sales}\n`;
    csv += `Conversion Rate,${((dealerData.sales / dealerData.totalLeads) * 100).toFixed(1)}%\n`;
    csv += `Response Rate,${((dealerData.responded / dealerData.totalLeads) * 100).toFixed(1)}%\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dealerData.paCode}_lead_analysis.csv`;
    a.click();
}

// Reset analysis
function resetAnalysis() {
    dealerData = null;
    document.getElementById('uploadCard').style.display = 'block';
    document.getElementById('analysisSection').classList.remove('active');
    document.getElementById('fileInput').value = '';
}

// Make functions available globally
window.exportReport = exportReport;
window.resetAnalysis = resetAnalysis;