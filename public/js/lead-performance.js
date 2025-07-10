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
                
                processUploadedData(data);
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

function processUploadedData(data) {
    // Skip header rows (similar to original app.js)
    const dataStartRow = 11; // Data starts at row 12 (0-indexed)
    
    // Extract dealer data
    const dealers = {};
    let totalNetworkLeads = 0;
    let totalConversions = 0;
    
    for (let i = dataStartRow; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 10) continue;
        
        const dealerName = row[1]; // Column B
        if (!dealerName || dealerName === 'Grand Total') continue;
        
        const leads = parseInt(row[2]) || 0; // Column C
        const appointments = parseInt(row[6]) || 0; // Column G
        const shows = parseInt(row[7]) || 0; // Column H
        const sales = parseInt(row[8]) || 0; // Column I
        
        if (!dealers[dealerName]) {
            dealers[dealerName] = {
                name: dealerName,
                leads: 0,
                appointments: 0,
                shows: 0,
                sales: 0
            };
        }
        
        dealers[dealerName].leads += leads;
        dealers[dealerName].appointments += appointments;
        dealers[dealerName].shows += shows;
        dealers[dealerName].sales += sales;
        
        totalNetworkLeads += leads;
        totalConversions += sales;
    }
    
    // Calculate metrics
    uploadedDealerData = dealers;
    const conversionRate = totalNetworkLeads > 0 ? (totalConversions / totalNetworkLeads * 100).toFixed(2) : 0;
    
    // Update dashboard
    updateDashboard({
        totalLeads: totalNetworkLeads,
        conversionRate: conversionRate,
        dealerCount: Object.keys(dealers).length
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
    
    const conversionRate = dealer.leads > 0 ? (dealer.sales / dealer.leads * 100).toFixed(2) : 0;
    const appointmentRate = dealer.leads > 0 ? (dealer.appointments / dealer.leads * 100).toFixed(2) : 0;
    const showRate = dealer.appointments > 0 ? (dealer.shows / dealer.appointments * 100).toFixed(2) : 0;
    
    const analysisHTML = `
        <div class="chart-container">
            <h3>${dealerName} Performance Analysis</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Leads</h3>
                    <p class="metric-value">${dealer.leads}</p>
                </div>
                <div class="metric-card">
                    <h3>Conversion Rate</h3>
                    <p class="metric-value">${conversionRate}%</p>
                    <p class="metric-change ${conversionRate >= networkBenchmarks.conversionRate ? 'positive' : 'negative'}">
                        Network Avg: ${networkBenchmarks.conversionRate}%
                    </p>
                </div>
                <div class="metric-card">
                    <h3>Appointment Rate</h3>
                    <p class="metric-value">${appointmentRate}%</p>
                </div>
                <div class="metric-card">
                    <h3>Show Rate</h3>
                    <p class="metric-value">${showRate}%</p>
                </div>
            </div>
            
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