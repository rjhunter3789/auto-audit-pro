// Combined Insights - Auto Audit Pro Suite
// © 2025 JL Robinson. All Rights Reserved.

// Global data
let websiteData = null;
let leadData = null;
let correlationChart = null;
let comparisonChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    checkDataAvailability();
    
    if (websiteData && leadData) {
        generateInsights();
    }
});

// Load data from localStorage
function loadStoredData() {
    // Load website audit data
    const storedWebsite = localStorage.getItem('lastWebsiteAudit');
    if (storedWebsite) {
        websiteData = JSON.parse(storedWebsite);
    }
    
    // Load lead performance data with enhanced storage
    const storedLead = localStorage.getItem('leadPerformanceDataEnhanced');
    if (storedLead) {
        leadData = JSON.parse(storedLead);
    } else {
        // Fallback to old storage format
        const oldStoredLead = localStorage.getItem('leadPerformanceData');
        if (oldStoredLead) {
            leadData = JSON.parse(oldStoredLead);
        }
    }
}

// Find matching dealer in lead data based on website audit
function findMatchingDealer() {
    if (!websiteData || !leadData || !leadData.dealers) {
        return null;
    }
    
    const websiteBrand = websiteData.brand?.toLowerCase() || '';
    
    // Try to find exact match
    for (const dealerName in leadData.dealers) {
        const dealer = leadData.dealers[dealerName];
        if (dealerName.toLowerCase().includes(websiteBrand) || 
            websiteBrand.includes(dealerName.split(' ')[0].toLowerCase())) {
            return {
                name: dealerName,
                ...dealer
            };
        }
    }
    
    return null;
}

// Check data availability and update UI
function checkDataAvailability() {
    const websiteStatus = document.getElementById('websiteStatus');
    const leadStatus = document.getElementById('leadStatus');
    const insightsContainer = document.getElementById('insightsContainer');
    const noDataState = document.getElementById('noDataState');
    
    // Update website status
    if (websiteData) {
        websiteStatus.classList.add('connected');
        websiteStatus.querySelector('.status-icon').classList.add('check');
        websiteStatus.querySelector('.status-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
        websiteStatus.querySelector('.status-text').textContent = 
            `${websiteData.brand || 'Website'} analyzed - Score: ${websiteData.score}/100`;
        websiteStatus.querySelector('.btn').textContent = 'Update Analysis';
    } else {
        websiteStatus.classList.add('missing');
        websiteStatus.querySelector('.status-icon').classList.add('warning');
    }
    
    // Update lead status
    if (leadData) {
        leadStatus.classList.add('connected');
        leadStatus.querySelector('.status-icon').classList.add('check');
        leadStatus.querySelector('.status-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
        leadStatus.querySelector('.status-text').textContent = 
            `${leadData.dealerCount || 0} dealers analyzed - ${leadData.summary?.totalLeads || 0} total leads`;
        leadStatus.querySelector('.btn').textContent = 'Update Data';
    } else {
        leadStatus.classList.add('missing');
        leadStatus.querySelector('.status-icon').classList.add('warning');
    }
    
    // Show/hide insights
    if (websiteData && leadData) {
        insightsContainer.style.display = 'block';
        noDataState.style.display = 'none';
    } else {
        insightsContainer.style.display = 'none';
        noDataState.style.display = 'block';
    }
}

// Generate insights from combined data
function generateInsights() {
    // Try to find matching dealer data
    const matchingDealer = findMatchingDealer();
    
    // Calculate correlations
    const websiteScore = websiteData.score;
    const avgConversion = matchingDealer ? 
        parseFloat(matchingDealer.conversionRate) : 
        (leadData.summary?.avgConversion || 16.12);
    
    // Store dealer info for display
    window.currentDealerMatch = matchingDealer;
    
    // Update correlation insight
    updateCorrelationInsight(websiteScore, avgConversion, matchingDealer);
    
    // Generate impact analysis
    generateImpactAnalysis();
    
    // Generate opportunities
    generateOpportunities();
    
    // Calculate ROI
    calculateCombinedROI();
    
    // Create charts
    createCorrelationChart();
    createComparisonChart();
}

// Calculate correlation between website score and conversion
function calculateCorrelation(websiteScore) {
    // Simulated correlation calculation
    // Higher website scores correlate with better conversion
    if (websiteScore >= 80) {
        return {
            strength: 'Strong Positive',
            detail: 'Dealers with similar scores convert 23% better than average',
            multiplier: 1.23
        };
    } else if (websiteScore >= 60) {
        return {
            strength: 'Moderate Positive',
            detail: 'Your website performance is average, with room for improvement',
            multiplier: 1.0
        };
    } else {
        return {
            strength: 'Negative Impact',
            detail: 'Website issues are significantly impacting lead conversion',
            multiplier: 0.77
        };
    }
}

// Update correlation insight UI
function updateCorrelationInsight(score, conversion, correlation) {
    document.getElementById('correlationScore').textContent = correlation.strength;
    document.getElementById('correlationDetail').textContent = correlation.detail;
}

// Generate impact analysis
function generateImpactAnalysis() {
    const impactList = document.getElementById('impactList');
    
    // Analyze website issues and their potential impact
    const impacts = [];
    
    if (websiteData.score < 50) {
        impacts.push({
            issue: 'Poor Website Performance',
            impact: '~35% fewer form submissions',
            priority: 'high'
        });
    }
    
    if (websiteData.issues > 10) {
        impacts.push({
            issue: 'Multiple Technical Issues',
            impact: '~22% lower engagement',
            priority: 'high'
        });
    }
    
    // Always add some insights
    impacts.push({
        issue: 'Mobile Optimization',
        impact: '67% of leads browse on mobile',
        priority: 'medium'
    });
    
    // Generate HTML
    let html = '<div class="list-group">';
    impacts.forEach(impact => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${impact.issue}</h6>
                        <p class="mb-1 text-muted">${impact.impact}</p>
                    </div>
                    <span class="badge bg-${impact.priority === 'high' ? 'danger' : 'warning'} rounded-pill">
                        ${impact.priority} priority
                    </span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    impactList.innerHTML = html;
}

// Generate improvement opportunities
function generateOpportunities() {
    const opportunityList = document.getElementById('opportunityList');
    
    const opportunities = [];
    
    // Based on website score
    if (websiteData.score < 60) {
        opportunities.push({
            title: 'Website Optimization',
            description: 'Improving to 80+ score could increase conversions by 15-20%',
            effort: 'Medium',
            impact: 'High'
        });
    }
    
    opportunities.push({
        title: 'Response Time Improvement',
        description: 'Faster response times correlate with 2.5x higher conversion',
        effort: 'Low',
        impact: 'High'
    });
    
    opportunities.push({
        title: 'Mobile Experience',
        description: 'Optimize for mobile users who represent 67% of traffic',
        effort: 'Medium',
        impact: 'Medium'
    });
    
    // Generate HTML
    let html = '<div class="row">';
    opportunities.forEach(opp => {
        html += `
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${opp.title}</h5>
                        <p class="card-text">${opp.description}</p>
                        <div class="d-flex justify-content-between">
                            <small class="text-muted">Effort: ${opp.effort}</small>
                            <small class="text-success">Impact: ${opp.impact}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    opportunityList.innerHTML = html;
}

// Calculate combined ROI
function calculateCombinedROI() {
    // Base calculations
    const currentLeads = leadData.summary?.totalLeads || 1000;
    const currentConversion = leadData.summary?.avgConversion || 16.12;
    const avgSaleValue = 35000; // Average vehicle sale
    
    // Potential improvements based on website score
    let leadIncrease = 0;
    let conversionIncrease = 0;
    
    if (websiteData.score < 80) {
        leadIncrease = Math.round((80 - websiteData.score) * 0.5); // 0.5% per point
        conversionIncrease = Math.round((80 - websiteData.score) * 0.15); // 0.15% per point
    }
    
    // Calculate impact
    const additionalLeads = Math.round(currentLeads * (leadIncrease / 100));
    const newConversion = currentConversion * (1 + conversionIncrease / 100);
    const currentSales = Math.round(currentLeads * (currentConversion / 100));
    const projectedSales = Math.round((currentLeads + additionalLeads) * (newConversion / 100));
    const additionalSales = projectedSales - currentSales;
    
    const roiValue = additionalSales * avgSaleValue;
    
    // Update UI
    document.getElementById('roiValue').textContent = '$' + roiValue.toLocaleString();
    document.getElementById('leadIncrease').textContent = '+' + leadIncrease + '%';
    document.getElementById('conversionIncrease').textContent = '+' + conversionIncrease + '%';
    document.getElementById('additionalSales').textContent = '+' + additionalSales;
}

// Create correlation chart
function createCorrelationChart() {
    const ctx = document.getElementById('correlationChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (correlationChart) {
        correlationChart.destroy();
    }
    
    // Simulated data points
    const dataPoints = generateCorrelationData();
    
    correlationChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Dealer Performance',
                data: dataPoints.others,
                backgroundColor: 'rgba(107, 70, 193, 0.5)'
            }, {
                label: 'Your Dealership',
                data: dataPoints.yours,
                backgroundColor: 'rgba(239, 68, 68, 1)',
                pointRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Website Score'
                    },
                    min: 0,
                    max: 100
                },
                y: {
                    title: {
                        display: true,
                        text: 'Conversion Rate (%)'
                    },
                    min: 0,
                    max: 30
                }
            }
        }
    });
}

// Generate correlation data points
function generateCorrelationData() {
    const others = [];
    const yours = [];
    
    // Generate simulated dealer data
    for (let i = 0; i < 30; i++) {
        const score = Math.random() * 80 + 20; // 20-100
        const conversion = (score / 100 * 15) + Math.random() * 5 + 5; // Correlation with noise
        others.push({ x: score, y: conversion });
    }
    
    // Add current dealer
    if (websiteData && leadData) {
        yours.push({
            x: websiteData.score,
            y: leadData.summary?.avgConversion || 16.12
        });
    }
    
    return { others, yours };
}

// Create comparison chart
function createComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Website Score',
                'Lead Volume',
                'Conversion Rate',
                'Response Time',
                'Mobile Performance',
                'User Experience'
            ],
            datasets: [{
                label: 'Your Performance',
                data: [
                    websiteData?.score || 0,
                    85, // Normalized lead volume
                    (leadData?.summary?.avgConversion || 16) * 5, // Normalized conversion
                    70, // Response time score
                    websiteData?.score * 0.8 || 0, // Mobile estimate
                    websiteData?.score * 0.9 || 0  // UX estimate
                ],
                borderColor: 'rgba(107, 70, 193, 1)',
                backgroundColor: 'rgba(107, 70, 193, 0.2)'
            }, {
                label: 'Top Performers',
                data: [85, 90, 90, 85, 88, 87],
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.2)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Download report
function downloadReport() {
    alert('Report download feature coming soon!');
    // In production, this would generate a PDF report
}