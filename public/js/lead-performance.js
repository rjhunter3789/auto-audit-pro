// Lead Performance Intelligence - Auto Audit Pro Suite
// © 2025 JL Robinson. All Rights Reserved.

// Global variables
let currentDealerData = null;
let uploadedDealerData = {};
let currentSelectedDealer = null;
let networkBenchmarks = {
    totalLeads: 27047,
    conversionRate: 16.12,
    responseRate: 54.9,
    noResponseRate: 45.1,
    fifteenMinResponse: 31.7,
    avgResponseTime: 5.5,
    medianResponseTime: 12
};

// Charts
let volumeChart = null;
let responseChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadStoredData();
});

// Tab navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked tab
    if (event && event.target) {
        event.target.closest('.tab-btn').classList.add('active');
    }
}

// File upload functionality
function uploadFile() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data;
                if (file.name.endsWith('.csv')) {
                    data = parseCSV(e.target.result);
                } else {
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                }
                
                // Pass filename to help identify dealer
                processUploadedData(data, file.name);
                showUploadSuccess();
                
                // Store data for correlation with website audit
                localStorage.setItem('leadPerformanceData', JSON.stringify({
                    uploadDate: new Date().toISOString(),
                    dealerCount: Object.keys(uploadedDealerData).length,
                    summary: {
                        totalLeads: currentDealerData?.networkMetrics?.totalLeads || 0,
                        avgConversion: currentDealerData?.networkMetrics?.conversionRate || 0
                    }
                }));
                
            } catch (error) {
                console.error('Error processing file:', error);
                alert('Error processing file. Please ensure it\'s a valid Excel or CSV file.');
            }
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Simple CSV parsing - handles basic cases
            const cells = line.split(',').map(cell => cell.trim());
            result.push(cells);
        }
    }
    
    return result;
}

function processUploadedData(data, filename = '') {
    // Debug: Log the first few rows to understand structure
    console.log('First 15 rows of data:', data.slice(0, 15));
    console.log('Filename:', filename);
    console.log('Total rows in file:', data.length);
    
    // Log what's in key positions
    if (data.length > 11) {
        console.log('Row 11 (data start):', data[11]);
    }
    
    // Find dealer name - check multiple possible locations
    let dealerName = '';
    
    // Strategy 1: Look for dealer name in specific cells
    // Check various common locations for dealer names in Ford reports
    const possibleLocations = [
        [1, 1], // Row 2, Column B
        [0, 1], // Row 1, Column B
        [2, 1], // Row 3, Column B
        [1, 0], // Row 2, Column A
        [0, 0], // Row 1, Column A
        [3, 1], // Row 4, Column B
        [4, 1], // Row 5, Column B
        [5, 1], // Row 6, Column B
        [6, 1], // Row 7, Column B
        [7, 1], // Row 8, Column B
        [8, 1], // Row 9, Column B
        [9, 1], // Row 10, Column B
        [10, 1], // Row 11, Column B
    ];
    
    for (const [row, col] of possibleLocations) {
        if (data.length > row && data[row] && data[row][col]) {
            const cellValue = String(data[row][col]).trim();
            // Check if this looks like a dealer name (not a header or report title)
            if (cellValue && 
                !cellValue.toLowerCase().includes('lead') && 
                !cellValue.toLowerCase().includes('report') &&
                !cellValue.toLowerCase().includes('performance') &&
                !cellValue.toLowerCase().includes('summary') &&
                cellValue.length > 3) {
                dealerName = cellValue;
                break;
            }
        }
    }
    
    // Strategy 2: Try to extract from filename if no dealer name found
    if (!dealerName && filename) {
        // Remove file extension and common report keywords
        let cleanFilename = filename.replace(/\.(xlsx?|csv)$/i, '');
        
        // Remove date patterns like 2025-07-02_08680
        cleanFilename = cleanFilename.replace(/\d{4}-\d{2}-\d{2}_\d+/g, '');
        
        // Remove common keywords
        cleanFilename = cleanFilename.replace(/lead|performance|report|summary|data|export/gi, '');
        cleanFilename = cleanFilename.replace(/[_-]+/g, ' ').trim();
        
        if (cleanFilename && cleanFilename.length > 3) {
            dealerName = cleanFilename;
            console.log('Extracted dealer name from filename:', dealerName);
        }
    }
    
    // Strategy 3: If we see what looks like lead source data, use a prompt
    if (!dealerName) {
        // Check if the data looks like lead sources (not dealer names)
        const firstDataRow = data[11]; // Where data typically starts
        if (firstDataRow && firstDataRow[1] && 
            (firstDataRow[1].includes('Ford') || firstDataRow[1].includes('LVDS') || 
             firstDataRow[1].includes('Credit') || firstDataRow[1].includes('Website'))) {
            // This looks like lead source data, prompt user for dealer name
            dealerName = prompt('Please enter the dealer name for this report:') || 'Unknown Dealer';
        }
    }
    
    // Final fallback
    if (!dealerName) {
        dealerName = 'Dealership ' + new Date().toLocaleDateString();
    }
    
    // Check if this is a multi-dealer file (network report)
    // Look for dealer names in column A starting around row 11
    const dealers = {};
    let isNetworkReport = false;
    let currentDealer = dealerName;
    let currentDealerData = {
        leads: 0,
        sales: 0,
        leadSources: {}
    };
    
    // Start scanning from row 11
    for (let i = 11; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 10) continue;
        
        const colA = row[0]; // Column A - might be dealer name in network reports
        const colB = row[1]; // Column B - Lead Source or dealer name
        
        // Check if this row is a dealer name (network report format)
        if (colA && typeof colA === 'string' && colA.trim().length > 3 &&
            !colA.toLowerCase().includes('total') &&
            !colA.toLowerCase().includes('lead') &&
            (i === 11 || (row[2] === undefined || row[2] === ''))) {
            
            // Save previous dealer if exists
            if (currentDealer && currentDealerData.leads > 0) {
                dealers[currentDealer] = {
                    name: currentDealer,
                    ...currentDealerData,
                    conversionRate: currentDealerData.leads > 0 ? 
                        (currentDealerData.sales / currentDealerData.leads * 100).toFixed(2) : 0
                };
            }
            
            // Start new dealer
            currentDealer = colA.trim();
            currentDealerData = {
                leads: 0,
                sales: 0,
                leadSources: {}
            };
            isNetworkReport = true;
            continue;
        }
        
        // Process lead source data
        const leadSource = colB;
        if (!leadSource || leadSource === 'Grand Total' || leadSource.toLowerCase().includes('total')) continue;
        
        const leads = parseInt(row[2]) || 0; // Column C - Leads
        const appointments = parseInt(row[6]) || 0; // Column G - Appointments
        const shows = parseInt(row[7]) || 0; // Column H - Shows  
        const sales = parseInt(row[8]) || 0; // Column I - Sales
        
        if (leads > 0) {
            currentDealerData.leadSources[leadSource] = {
                leads: leads,
                appointments: appointments,
                shows: shows,
                sales: sales,
                conversionRate: leads > 0 ? (sales / leads * 100).toFixed(2) : 0
            };
            
            currentDealerData.leads += leads;
            currentDealerData.sales += sales;
        }
    }
    
    // Save last dealer
    if (currentDealer && currentDealerData.leads > 0) {
        dealers[currentDealer] = {
            name: currentDealer,
            ...currentDealerData,
            conversionRate: currentDealerData.leads > 0 ? 
                (currentDealerData.sales / currentDealerData.leads * 100).toFixed(2) : 0
        };
    }
    
    console.log('Processed dealer data:', dealers);
    console.log('Is network report:', isNetworkReport);
    console.log('Number of dealers found:', Object.keys(dealers).length);
    
    // If no dealers found, try to help debug
    if (Object.keys(dealers).length === 0) {
        console.error('No dealers found! Showing data structure for debugging:');
        console.log('Sample rows 10-15:', data.slice(10, 16));
        alert('No dealer data found in the file. Please check the browser console for debugging information.');
    }
    
    uploadedDealerData = dealers;
    
    // Calculate totals for dashboard
    let totalNetworkLeads = 0;
    let totalNetworkSales = 0;
    Object.values(dealers).forEach(dealer => {
        totalNetworkLeads += dealer.leads;
        totalNetworkSales += dealer.sales;
    });
    
    const avgConversionRate = totalNetworkLeads > 0 ? 
        (totalNetworkSales / totalNetworkLeads * 100).toFixed(2) : 0;
    
    // Update dashboard
    updateDashboard({
        totalLeads: totalNetworkLeads,
        conversionRate: avgConversionRate,
        dealerCount: Object.keys(dealers).length,
        dealerName: isNetworkReport ? 'Network Report' : dealerName
    });
    
    // Update dealer dropdown
    updateDealerDropdown();
    
    // Update charts
    updateCharts();
}

function updateDashboard(metrics) {
    // Update metric cards
    document.getElementById('totalLeads').textContent = metrics.totalLeads.toLocaleString();
    document.getElementById('conversionRate').textContent = metrics.conversionRate + '%';
    
    // Calculate performance tiers
    let elite = 0, strong = 0, average = 0, challenge = 0;
    
    Object.values(uploadedDealerData).forEach(dealer => {
        const conversion = dealer.leads > 0 ? (dealer.sales / dealer.leads * 100) : 0;
        if (conversion >= 20) elite++;
        else if (conversion >= 16) strong++;
        else if (conversion >= 12) average++;
        else challenge++;
    });
    
    document.getElementById('eliteCount').textContent = elite + ' Dealers';
    document.getElementById('strongCount').textContent = strong + ' Dealers';
    document.getElementById('averageCount').textContent = average + ' Dealers';
    document.getElementById('challengeCount').textContent = challenge + ' Dealers';
}

function updateDealerDropdown() {
    const select = document.getElementById('dealerSelect');
    select.innerHTML = '<option value="">Choose a dealer...</option>';
    
    Object.keys(uploadedDealerData).sort().forEach(dealerName => {
        const option = document.createElement('option');
        option.value = dealerName;
        option.textContent = dealerName;
        select.appendChild(option);
    });
}

function updateDealerAnalysis() {
    const dealerName = document.getElementById('dealerSelect').value;
    if (!dealerName) return;
    
    const dealer = uploadedDealerData[dealerName];
    if (!dealer) return;
    
    // Build lead source table
    let leadSourceHTML = '<h4 class="mt-4">Lead Source Performance</h4><div class="table-responsive"><table class="table table-sm"><thead><tr><th>Lead Source</th><th>Leads</th><th>Sales</th><th>Conv %</th></tr></thead><tbody>';
    
    if (dealer.leadSources) {
        Object.entries(dealer.leadSources).forEach(([source, data]) => {
            leadSourceHTML += `
                <tr>
                    <td>${source}</td>
                    <td>${data.leads}</td>
                    <td>${data.sales}</td>
                    <td>${data.conversionRate}%</td>
                </tr>
            `;
        });
    }
    leadSourceHTML += '</tbody></table></div>';
    
    const analysisHTML = `
        <div class="chart-container">
            <h3>${dealerName} Performance Analysis</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Leads</h3>
                    <p class="metric-value">${dealer.leads}</p>
                </div>
                <div class="metric-card">
                    <h3>Total Sales</h3>
                    <p class="metric-value">${dealer.sales}</p>
                </div>
                <div class="metric-card">
                    <h3>Conversion Rate</h3>
                    <p class="metric-value">${dealer.conversionRate}%</p>
                    <p class="metric-change ${parseFloat(dealer.conversionRate) >= networkBenchmarks.conversionRate ? 'positive' : 'negative'}">
                        Network Avg: ${networkBenchmarks.conversionRate}%
                    </p>
                </div>
                <div class="metric-card">
                    <h3>Performance Tier</h3>
                    <p class="metric-value">${
                        parseFloat(dealer.conversionRate) >= 20 ? 'Elite' :
                        parseFloat(dealer.conversionRate) >= 16 ? 'Strong' :
                        parseFloat(dealer.conversionRate) >= 12 ? 'Average' : 'Challenge'
                    }</p>
                </div>
            </div>
            
            ${leadSourceHTML}
            
            <!-- Check for website audit data -->
            ${checkForWebsiteAudit(dealerName)}
        </div>
    `;
    
    document.getElementById('dealerAnalysisContent').innerHTML = analysisHTML;
}

function checkForWebsiteAudit(dealerName) {
    // Check if we have website audit data for this dealer
    const websiteData = localStorage.getItem('lastWebsiteAudit');
    if (websiteData) {
        const audit = JSON.parse(websiteData);
        // Simple matching - could be improved
        if (audit.domain && dealerName.toLowerCase().includes(audit.brand?.toLowerCase())) {
            return `
                <div class="alert alert-info mt-3">
                    <h5><i class="fas fa-link"></i> Website Audit Available!</h5>
                    <p>This dealer's website scored <strong>${audit.score}/100</strong> in our website analysis.</p>
                    <a href="/website-audit" class="btn btn-sm btn-primary">View Website Audit</a>
                </div>
            `;
        }
    }
    return '';
}

function initializeCharts() {
    // Volume Chart
    const volumeCtx = document.getElementById('volumeChart');
    if (volumeCtx) {
        volumeChart = new Chart(volumeCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Lead Volume',
                    data: [],
                    backgroundColor: 'rgba(107, 70, 193, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Response Time Chart
    const responseCtx = document.getElementById('responseChart');
    if (responseCtx) {
        responseChart = new Chart(responseCtx, {
            type: 'doughnut',
            data: {
                labels: ['0-15 min', '16-30 min', '30-60 min', '1-24 hrs', '1+ days', 'No Response'],
                datasets: [{
                    data: [31.7, 7.8, 8.3, 15.2, 4.5, 45.1],
                    backgroundColor: [
                        '#10B981',
                        '#34D399',
                        '#FCD34D',
                        '#FB923C',
                        '#F87171',
                        '#EF4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

function updateCharts() {
    // Update volume chart with top 10 dealers
    const sortedDealers = Object.values(uploadedDealerData)
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 10);
    
    if (volumeChart) {
        volumeChart.data.labels = sortedDealers.map(d => d.name);
        volumeChart.data.datasets[0].data = sortedDealers.map(d => d.leads);
        volumeChart.update();
    }
}

function showUploadSuccess() {
    const uploadCard = document.querySelector('.upload-card');
    uploadCard.innerHTML = `
        <i class="fas fa-check-circle" style="color: #10B981;"></i>
        <h3>File Uploaded Successfully!</h3>
        <p>${Object.keys(uploadedDealerData).length} dealers loaded</p>
        <button class="btn btn-primary mt-3" onclick="location.reload()">Upload Another File</button>
    `;
}

function loadStoredData() {
    // Check for stored lead performance data
    const storedData = localStorage.getItem('leadPerformanceData');
    if (storedData) {
        const data = JSON.parse(storedData);
        console.log('Found stored lead performance data:', data);
    }
    
    // Check for website audit data
    const websiteData = localStorage.getItem('lastWebsiteAudit');
    if (websiteData) {
        const audit = JSON.parse(websiteData);
        console.log('Found website audit data:', audit);
    }
}