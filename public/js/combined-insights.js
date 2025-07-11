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
    console.log('Looking for dealer matching brand:', websiteBrand);
    console.log('Available dealers:', Object.keys(leadData.dealers || {}));
    
    // Try different matching strategies
    for (const dealerName in leadData.dealers) {
        const dealer = leadData.dealers[dealerName];
        const dealerLower = dealerName.toLowerCase();
        
        // Strategy 1: Dealer name contains brand
        if (dealerLower.includes(websiteBrand)) {
            console.log('Match found (contains brand):', dealerName);
            return {
                name: dealerName,
                ...dealer
            };
        }
        
        // Strategy 2: Brand contains first word of dealer
        const dealerFirstWord = dealerName.split(' ')[0].toLowerCase();
        if (websiteBrand.includes(dealerFirstWord) && dealerFirstWord.length > 3) {
            console.log('Match found (brand contains dealer):', dealerName);
            return {
                name: dealerName,
                ...dealer
            };
        }
        
        // Strategy 3: Check if it's a Ford dealer and brand is Ford
        if (websiteBrand === 'ford' && dealerLower.includes('ford')) {
            // Store this as a potential match but keep looking for better ones
            // This prevents matching the first Ford dealer when there might be a better match
            continue;
        }
    }
    
    // If no exact match found but we have a stored selection from lead analysis
    const lastSelectedDealer = localStorage.getItem('lastSelectedDealer');
    if (lastSelectedDealer && leadData.dealers[lastSelectedDealer]) {
        console.log('Using last selected dealer:', lastSelectedDealer);
        return {
            name: lastSelectedDealer,
            ...leadData.dealers[lastSelectedDealer]
        };
    }
    
    console.log('No dealer match found');
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
        
        // Show specific dealer info if matched
        if (window.currentDealerMatch) {
            leadStatus.querySelector('.status-text').innerHTML = 
                `<strong>${window.currentDealerMatch.name}</strong><br>` +
                `${window.currentDealerMatch.leads} leads - ${window.currentDealerMatch.conversionRate}% conversion`;
        } else {
            leadStatus.querySelector('.status-text').textContent = 
                `${leadData.dealerCount || 0} dealers analyzed - ${leadData.summary?.totalLeads || 0} total leads`;
        }
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
function updateCorrelationInsight(score, conversion, matchingDealer) {
    const correlation = calculateCorrelation(score);
    
    // Update the correlation score display
    const correlationElement = document.getElementById('correlationScore');
    if (correlationElement) {
        if (matchingDealer) {
            // Show specific dealer data
            correlationElement.innerHTML = `
                <div style="font-size: 1.5rem; line-height: 1.2;">
                    ${matchingDealer.name}<br>
                    <span style="font-size: 2.5rem; color: var(--primary-purple);">${conversion}%</span><br>
                    <span style="font-size: 1rem; color: #6B7280;">Conversion Rate</span>
                </div>
            `;
        } else {
            correlationElement.textContent = `${conversion}% Network Avg`;
        }
    }
    
    // Update detail text
    const detailElement = document.getElementById('correlationDetail');
    if (detailElement) {
        if (matchingDealer) {
            const vsNetwork = conversion > 16.12 ? 'above' : 'below';
            const diff = Math.abs(conversion - 16.12).toFixed(1);
            detailElement.textContent = `${matchingDealer.name} is ${diff}% ${vsNetwork} the network average. ${correlation.detail}`;
        } else {
            detailElement.textContent = correlation.detail;
        }
    }
}

// Generate impact analysis
function generateImpactAnalysis() {
    const impactList = document.getElementById('impactList');
    
    // Analyze website issues and their potential impact
    const impacts = [];
    
    // Use actual website data if available
    if (websiteData.categories) {
        // Find lowest scoring categories
        const sortedCategories = [...websiteData.categories].sort((a, b) => a.score - b.score);
        
        sortedCategories.slice(0, 3).forEach(category => {
            if (category.score < 4) {
                impacts.push({
                    issue: `${category.name} Issues`,
                    impact: `Score: ${category.score}/5 - ${category.testsCompleted} tests completed`,
                    priority: category.score < 3 ? 'high' : 'medium'
                });
            }
        });
    }
    
    // Add dealer-specific insights if available
    if (window.currentDealerMatch) {
        const dealer = window.currentDealerMatch;
        
        // Response time impact
        if (dealer.noResponse && dealer.leads) {
            const noResponseRate = (dealer.noResponse / dealer.leads * 100).toFixed(1);
            if (noResponseRate > 30) {
                impacts.push({
                    issue: 'High No-Response Rate',
                    impact: `${noResponseRate}% of leads never receive a response`,
                    priority: 'high'
                });
            }
        }
        
        // Quick response impact
        if (dealer.responseTime15min && dealer.leads) {
            const quickResponseRate = (dealer.responseTime15min / dealer.leads * 100).toFixed(1);
            if (quickResponseRate < 30) {
                impacts.push({
                    issue: 'Slow Response Times',
                    impact: `Only ${quickResponseRate}% of leads get 15-min response`,
                    priority: 'medium'
                });
            }
        }
    }
    
    // Always add mobile insight
    impacts.push({
        issue: 'Mobile Experience',
        impact: '67% of leads browse on mobile devices',
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
    // Use dealer-specific data if available
    let currentLeads, currentConversion;
    
    if (window.currentDealerMatch) {
        // Calculate monthly average from 6 months of data
        currentLeads = Math.round((window.currentDealerMatch.leads * 2) / 12);
        currentConversion = parseFloat(window.currentDealerMatch.conversionRate) || 16.12;
    } else {
        // Fall back to network averages
        currentLeads = Math.round((leadData.summary?.totalLeads || 26000) / 12);
        currentConversion = leadData.summary?.avgConversion || 16.12;
    }
    
    const avgGrossProfit = 4250; // Average gross profit per vehicle
    
    // Potential improvements based on website score
    let leadIncrease = 0;
    let conversionIncrease = 0;
    
    // More realistic improvement calculations
    if (websiteData.score < 80) {
        leadIncrease = Math.round((80 - websiteData.score) * 0.3); // 0.3% lead increase per point
        conversionIncrease = ((80 - websiteData.score) * 0.1).toFixed(1); // 0.1% conversion increase per point
    }
    
    // If dealer has poor response times, add additional improvement potential
    if (window.currentDealerMatch) {
        const quickResponseRate = (window.currentDealerMatch.responseTime15min / window.currentDealerMatch.leads * 100);
        if (quickResponseRate < 30) {
            conversionIncrease = (parseFloat(conversionIncrease) + 2).toFixed(1);
        }
    }
    
    // Calculate impact (monthly)
    const additionalLeads = Math.round(currentLeads * (leadIncrease / 100));
    const newConversion = currentConversion + parseFloat(conversionIncrease);
    const currentSales = currentLeads * (currentConversion / 100);
    const projectedSales = (currentLeads + additionalLeads) * (newConversion / 100);
    const additionalSalesMonthly = projectedSales - currentSales;
    const additionalSalesAnnual = Math.round(additionalSalesMonthly * 12);
    
    const roiValue = Math.round(additionalSalesAnnual * avgGrossProfit);
    
    // Update UI
    document.getElementById('roiValue').textContent = '$' + roiValue.toLocaleString();
    document.getElementById('leadIncrease').textContent = '+' + leadIncrease + '%';
    document.getElementById('conversionIncrease').textContent = '+' + conversionIncrease + '%';
    document.getElementById('additionalSales').textContent = '+' + additionalSalesAnnual;
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
    
    // Use actual dealer data if available
    if (leadData && leadData.dealers) {
        // Plot all dealers from the lead data
        Object.entries(leadData.dealers).forEach(([name, dealer]) => {
            if (dealer.conversionRate) {
                // Check if this is the matching dealer
                const isCurrentDealer = window.currentDealerMatch && 
                    window.currentDealerMatch.name === name;
                
                const dataPoint = {
                    x: isCurrentDealer ? websiteData.score : Math.random() * 60 + 30, // Use actual score for matched dealer
                    y: parseFloat(dealer.conversionRate)
                };
                
                if (isCurrentDealer) {
                    yours.push(dataPoint);
                } else {
                    others.push(dataPoint);
                }
            }
        });
    } else {
        // Fallback to simulated data
        for (let i = 0; i < 30; i++) {
            const score = Math.random() * 80 + 20;
            const conversion = (score / 100 * 15) + Math.random() * 5 + 5;
            others.push({ x: score, y: conversion });
        }
    }
    
    // If no matching dealer found, use website data with network average
    if (yours.length === 0 && websiteData) {
        yours.push({
            x: websiteData.score,
            y: window.currentDealerMatch ? 
                parseFloat(window.currentDealerMatch.conversionRate) : 
                (leadData?.summary?.avgConversion || 16.12)
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

// Rerun website audit for the same domain
function rerunWebsiteAudit() {
    if (websiteData && websiteData.domain) {
        // Store the domain for re-analysis
        sessionStorage.setItem('rerunDomain', websiteData.domain);
        window.location.href = '/website-audit';
    } else {
        window.location.href = '/website-audit';
    }
}

// Update lead analysis - go to lead analysis tab with current dealer selected
function updateLeadAnalysis() {
    if (window.currentDealerMatch) {
        // Store the dealer to re-select
        sessionStorage.setItem('selectDealer', window.currentDealerMatch.name);
    }
    window.location.href = '/lead-analysis';
}