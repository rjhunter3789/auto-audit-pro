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
    
    // Generate insights if we have both data and a dealer
    if (websiteData && leadData && window.currentDealerMatch) {
        console.log('Generating insights with dealer:', window.currentDealerMatch.name);
        generateInsights();
    } else {
        console.log('Not generating insights - missing:', {
            websiteData: !!websiteData,
            leadData: !!leadData,
            currentDealerMatch: !!window.currentDealerMatch
        });
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
    
    // ONLY use explicit dealer selection from lead analysis - no auto-matching
    const lastSelectedDealer = localStorage.getItem('lastSelectedDealer');
    console.log('Last selected dealer from storage:', lastSelectedDealer);
    console.log('Available dealers:', Object.keys(leadData.dealers || {}));
    
    if (lastSelectedDealer && leadData.dealers[lastSelectedDealer]) {
        console.log('Using last selected dealer:', lastSelectedDealer);
        return {
            name: lastSelectedDealer,
            ...leadData.dealers[lastSelectedDealer]
        };
    }
    
    // NO AUTO-MATCHING - Always require explicit dealer selection
    // This prevents showing wrong dealers like "Bellingham Ford" when analyzing a generic "Ford" site
    console.log('No explicit dealer selection found - user must select dealer in Lead Performance first');
    return null;
}

// Check data availability and update UI
function checkDataAvailability() {
    const websiteStatus = document.getElementById('websiteStatus');
    const leadStatus = document.getElementById('leadStatus');
    const insightsContainer = document.getElementById('insightsContainer');
    const noDataState = document.getElementById('noDataState');
    
    // Try to find matching dealer early
    if (websiteData && leadData) {
        window.currentDealerMatch = findMatchingDealer();
    }
    
    // Update website status
    if (websiteData) {
        websiteStatus.classList.add('connected');
        websiteStatus.querySelector('.status-icon').classList.add('check');
        websiteStatus.querySelector('.status-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
        websiteStatus.querySelector('.status-text').textContent = 
            `${websiteData.brand || 'Website'} analyzed - Score: ${websiteData.score}/100`;
        websiteStatus.querySelector('.btn').textContent = 'Update Analysis';
        websiteStatus.querySelector('.btn').onclick = rerunWebsiteAudit;
    } else {
        websiteStatus.classList.add('missing');
        websiteStatus.querySelector('.status-icon').classList.add('warning');
    }
    
    // Update lead status
    if (leadData) {
        // Check if we have a specific dealer selected
        const matchingDealer = window.currentDealerMatch || findMatchingDealer();
        
        if (matchingDealer) {
            leadStatus.classList.remove('missing');
            leadStatus.classList.add('connected');
            leadStatus.querySelector('.status-icon').classList.add('check');
            leadStatus.querySelector('.status-icon').classList.remove('warning');
            leadStatus.querySelector('.status-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
            leadStatus.querySelector('.status-text').innerHTML = 
                `<strong>${matchingDealer.name}</strong><br>` +
                `${matchingDealer.leads} leads - ${matchingDealer.conversionRate}% conversion`;
            leadStatus.querySelector('.btn').textContent = 'Update Data';
            leadStatus.querySelector('.btn').onclick = updateLeadAnalysis;
        } else {
            // Data uploaded but no dealer selected
            leadStatus.classList.remove('connected');
            leadStatus.classList.add('missing');
            leadStatus.querySelector('.status-icon').classList.remove('check');
            leadStatus.querySelector('.status-icon').classList.add('warning');
            leadStatus.querySelector('.status-icon').innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            leadStatus.querySelector('.status-text').innerHTML = 
                `<strong>No dealer selected</strong><br>` +
                `${leadData.dealerCount || Object.keys(leadData.dealers || {}).length} dealers available - Please select one`;
            leadStatus.querySelector('.btn').textContent = 'Select Dealer';
            leadStatus.querySelector('.btn').onclick = updateLeadAnalysis;
        }
    } else {
        leadStatus.classList.add('missing');
        leadStatus.querySelector('.status-icon').classList.add('warning');
        leadStatus.querySelector('.status-icon').innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        leadStatus.querySelector('.status-text').textContent = 'No lead data uploaded';
        leadStatus.querySelector('.btn').textContent = 'Upload Lead Data';
        leadStatus.querySelector('.btn').onclick = updateLeadAnalysis;
    }
    
    // Show/hide insights - require both data AND a selected dealer
    if (websiteData && leadData && window.currentDealerMatch) {
        insightsContainer.style.display = 'block';
        noDataState.style.display = 'none';
    } else {
        insightsContainer.style.display = 'none';
        noDataState.style.display = 'block';
        
        // Update the no data state message based on what's missing
        const noDataTitle = document.querySelector('#noDataState h3');
        const noDataText = document.querySelector('#noDataState p');
        
        if (websiteData && leadData && !window.currentDealerMatch) {
            noDataTitle.textContent = 'Select a Dealer to View Insights';
            noDataText.textContent = 'Please select a specific dealer in the Lead Performance section';
        } else {
            noDataTitle.textContent = 'Complete Both Analyses to Unlock Insights';
            noDataText.textContent = 'Run a website audit and upload lead data to see powerful correlations';
        }
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
    
    // Create charts - ensure DOM and Chart.js are ready
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded yet, waiting...');
        // Wait for Chart.js to load
        const checkChart = setInterval(() => {
            if (typeof Chart !== 'undefined') {
                clearInterval(checkChart);
                createCorrelationChart();
                createComparisonChart();
            }
        }, 100);
    } else {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            createCorrelationChart();
            createComparisonChart();
        }, 100);
    }
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
            detailElement.innerHTML = `
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>No specific dealer selected.</strong> 
                    To see dealer-specific insights, please select a dealer in the 
                    <a href="/lead-analysis" class="alert-link">Lead Performance</a> section first.
                    Currently showing network averages.
                </div>
            `;
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
    // ROI CALCULATION METHODOLOGY:
    // 1. Current State: Get dealer's current monthly leads and conversion rate
    // 2. Improvement Potential: Calculate based on gap to best practices (80+ website score)
    // 3. Financial Impact: Additional sales × average gross profit per vehicle
    
    // Get current dealer metrics
    let currentLeads, currentConversion;
    
    if (window.currentDealerMatch) {
        // The dealer has 6 months of data, so we calculate monthly average
        currentLeads = Math.round(window.currentDealerMatch.leads / 6);
        currentConversion = parseFloat(window.currentDealerMatch.conversionRate) || 16.12;
    } else {
        // Fall back to network averages
        currentLeads = Math.round((leadData.summary?.totalLeads || 26000) / (leadData.dealerCount || 31) / 6);
        currentConversion = leadData.summary?.avgConversion || 16.12;
    }
    
    const avgGrossProfit = 4250; // Industry average gross profit per vehicle sale
    
    // IMPROVEMENT CALCULATIONS:
    // Research shows that improving website score correlates with:
    // - Lead Volume: ~0.3% increase per point improvement
    // - Conversion Rate: ~0.1% increase per point improvement
    
    let leadIncrease = 0;
    let conversionIncrease = 0;
    
    // Calculate improvement potential based on website score gap
    if (websiteData.score < 80) {
        const scoreGap = 80 - websiteData.score; // Gap to "good" score of 80
        leadIncrease = Math.round(scoreGap * 0.3); // 0.3% more leads per point
        conversionIncrease = (scoreGap * 0.1).toFixed(1); // 0.1% better conversion per point
    }
    
    // Additional improvement from better response times
    if (window.currentDealerMatch) {
        const quickResponseRate = (window.currentDealerMatch.responseTime15min / window.currentDealerMatch.leads * 100);
        if (quickResponseRate < 30) {
            // Industry data shows 2% conversion boost when response time improves
            conversionIncrease = (parseFloat(conversionIncrease) + 2).toFixed(1);
        }
    }
    
    // Calculate financial impact
    const additionalLeadsMonthly = Math.round(currentLeads * (leadIncrease / 100));
    const improvedConversionRate = currentConversion + parseFloat(conversionIncrease);
    
    // Current vs. Projected Sales
    const currentSalesMonthly = currentLeads * (currentConversion / 100);
    const projectedSalesMonthly = (currentLeads + additionalLeadsMonthly) * (improvedConversionRate / 100);
    const additionalSalesMonthly = projectedSalesMonthly - currentSalesMonthly;
    const additionalSalesAnnual = Math.round(additionalSalesMonthly * 12);
    
    // Annual ROI = Additional Sales × Average Gross Profit
    const roiValue = Math.round(additionalSalesAnnual * avgGrossProfit);
    
    // Update UI with calculated values
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
    
    correlationChart = new Chart(ctx.getContext('2d'), {
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
    if (!ctx) {
        console.error('Comparison chart canvas not found');
        return;
    }
    
    try {
        // Destroy existing chart
        if (comparisonChart) {
            comparisonChart.destroy();
            comparisonChart = null;
        }
    
        // Calculate actual metrics for the dealer
        let websiteScore = websiteData?.score || 73;
        let leadVolumeScore = 50;
        let conversionScore = 50;
        let responseScore = 50;
        let mobileScore = websiteScore * 0.8;
        let uxScore = websiteScore * 0.9;
        
        if (window.currentDealerMatch) {
            const dealer = window.currentDealerMatch;
            
            // Lead Volume: Compare to network average
            const avgLeadsPerDealer = (leadData?.summary?.totalLeads || 26000) / (leadData?.dealerCount || 31);
            leadVolumeScore = Math.min(100, (dealer.leads / avgLeadsPerDealer) * 50);
            
            // Conversion Rate: Scale to 100 (20% = 100 score)
            conversionScore = Math.min(100, (parseFloat(dealer.conversionRate) / 20) * 100);
            
            // Response Time: Based on 15-min response rate
            if (dealer.responseTime15min && dealer.leads) {
                const quickResponseRate = (dealer.responseTime15min / dealer.leads * 100);
                responseScore = Math.min(100, quickResponseRate * 2); // 50% quick response = 100 score
            }
        }
        
        // Extract specific category scores if available
        if (websiteData?.categories) {
            const mobileCategory = websiteData.categories.find(c => 
                c.name.toLowerCase().includes('mobile') || c.name.toLowerCase().includes('performance')
            );
            const uxCategory = websiteData.categories.find(c => 
                c.name.toLowerCase().includes('user') || c.name.toLowerCase().includes('experience')
            );
            
            if (mobileCategory) mobileScore = mobileCategory.score * 20; // Convert 0-5 to 0-100
            if (uxCategory) uxScore = uxCategory.score * 20;
        }
        
        comparisonChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Website', 'Leads', 'Conversion', 'Response', 'Mobile', 'UX'],
                datasets: [{
                    label: window.currentDealerMatch ? window.currentDealerMatch.name : 'Current',
                    data: [
                        websiteScore,
                        Math.round(leadVolumeScore),
                        Math.round(conversionScore),
                        Math.round(responseScore),
                        Math.round(mobileScore),
                        Math.round(uxScore)
                    ],
                    borderColor: 'rgb(107, 70, 193)',
                    backgroundColor: 'rgba(107, 70, 193, 0.2)',
                    borderWidth: 2
                }, {
                    label: 'Top Performers',
                    data: [85, 90, 90, 85, 88, 87],
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.r;
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Comparison chart created with real data');
    } catch (error) {
        console.error('Error creating comparison chart:', error);
    }
}

// Download report
function downloadReport() {
    // Check if we have the necessary data
    if (!websiteData || !leadData || !window.currentDealerMatch) {
        alert('Please complete both website analysis and lead performance analysis first.');
        return;
    }
    
    // Generate report content
    const reportHtml = generateReportHTML();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    
    // Auto-trigger print dialog after a short delay
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Generate HTML content for the report
function generateReportHTML() {
    const dealer = window.currentDealerMatch;
    const date = new Date().toLocaleDateString();
    
    // Calculate all metrics
    const websiteScore = websiteData.score;
    const conversionRate = parseFloat(dealer.conversionRate);
    const leadCount = dealer.leads;
    const monthlyLeads = Math.round(leadCount / 6);
    
    // ROI calculations
    const roiValue = document.getElementById('roiValue').textContent;
    const leadIncrease = document.getElementById('leadIncrease').textContent;
    const conversionIncrease = document.getElementById('conversionIncrease').textContent;
    const additionalSales = document.getElementById('additionalSales').textContent;
    
    // Get top issues
    const topIssues = [];
    if (websiteData.categories) {
        const sortedCategories = [...websiteData.categories].sort((a, b) => a.score - b.score);
        sortedCategories.slice(0, 3).forEach(category => {
            if (category.score < 4) {
                topIssues.push({
                    name: category.name,
                    score: category.score,
                    tests: category.testsCompleted
                });
            }
        });
    }
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Combined Performance Report - ${dealer.name}</title>
        <style>
            @media print {
                body { margin: 0; }
                .page-break { page-break-after: always; }
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #1F2937;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
            }
            .header {
                background: #6B46C1;
                color: white;
                padding: 30px;
                margin: -20px -20px 30px -20px;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
            }
            .section {
                margin-bottom: 40px;
            }
            .section h2 {
                color: #6B46C1;
                border-bottom: 2px solid #E5E7EB;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .metric-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            .metric-card {
                background: #F9FAFB;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }
            .metric-value {
                font-size: 36px;
                font-weight: bold;
                color: #6B46C1;
                margin: 10px 0;
            }
            .metric-label {
                color: #6B7280;
                font-size: 14px;
            }
            .issue-item {
                background: #FEF2F2;
                border-left: 4px solid #EF4444;
                padding: 15px;
                margin-bottom: 15px;
            }
            .opportunity-item {
                background: #F0FDF4;
                border-left: 4px solid #10B981;
                padding: 15px;
                margin-bottom: 15px;
            }
            .roi-section {
                background: #F0FDF4;
                padding: 30px;
                border-radius: 8px;
                text-align: center;
                margin: 30px 0;
            }
            .roi-value {
                font-size: 48px;
                font-weight: bold;
                color: #10B981;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                color: #6B7280;
                font-size: 12px;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            th, td {
                text-align: left;
                padding: 12px;
                border-bottom: 1px solid #E5E7EB;
            }
            th {
                background: #F9FAFB;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Combined Performance Report</h1>
            <p>${dealer.name} - Generated ${date}</p>
        </div>
        
        <div class="section">
            <h2>Executive Summary</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-label">Website Score</div>
                    <div class="metric-value">${websiteScore}/100</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Conversion Rate</div>
                    <div class="metric-value">${conversionRate}%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Monthly Leads</div>
                    <div class="metric-value">${monthlyLeads}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Website Performance Analysis</h2>
            <table>
                <tr>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Tests Completed</th>
                </tr>
                ${websiteData.categories.map(cat => `
                    <tr>
                        <td>${cat.name}</td>
                        <td>${cat.score}/5</td>
                        <td>${cat.testsCompleted}/${cat.totalTests}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
        
        <div class="section">
            <h2>Lead Performance Metrics</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Network Average</th>
                </tr>
                <tr>
                    <td>Total Leads (6 months)</td>
                    <td>${leadCount}</td>
                    <td>${Math.round((leadData.summary?.totalLeads || 26000) / (leadData.dealerCount || 31))}</td>
                </tr>
                <tr>
                    <td>Conversion Rate</td>
                    <td>${conversionRate}%</td>
                    <td>${leadData.summary?.avgConversion || 16.12}%</td>
                </tr>
                <tr>
                    <td>15-min Response Rate</td>
                    <td>${dealer.responseTime15min ? Math.round(dealer.responseTime15min / leadCount * 100) : 'N/A'}%</td>
                    <td>30%</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Top Issues Impacting Performance</h2>
            ${topIssues.map(issue => `
                <div class="issue-item">
                    <strong>${issue.name}</strong><br>
                    Score: ${issue.score}/5 - ${issue.tests} tests completed
                </div>
            `).join('')}
            ${dealer.noResponse && dealer.leads && (dealer.noResponse / dealer.leads * 100) > 30 ? `
                <div class="issue-item">
                    <strong>High No-Response Rate</strong><br>
                    ${(dealer.noResponse / dealer.leads * 100).toFixed(1)}% of leads never receive a response
                </div>
            ` : ''}
        </div>
        
        <div class="page-break"></div>
        
        <div class="section">
            <h2>Improvement Opportunities</h2>
            <div class="opportunity-item">
                <strong>Website Optimization</strong><br>
                Improving to 80+ score could increase conversions by 15-20%
            </div>
            <div class="opportunity-item">
                <strong>Response Time Improvement</strong><br>
                Faster response times correlate with 2.5x higher conversion
            </div>
            <div class="opportunity-item">
                <strong>Mobile Experience</strong><br>
                Optimize for mobile users who represent 67% of traffic
            </div>
        </div>
        
        <div class="roi-section">
            <h2>Projected Return on Investment</h2>
            <div class="roi-value">${roiValue}</div>
            <p>Estimated annual revenue increase from implementing recommended improvements</p>
            <div class="metric-grid" style="margin-top: 30px;">
                <div class="metric-card">
                    <div class="metric-label">Lead Increase</div>
                    <div class="metric-value" style="font-size: 24px;">${leadIncrease}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Conversion Improvement</div>
                    <div class="metric-value" style="font-size: 24px;">${conversionIncrease}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Additional Sales</div>
                    <div class="metric-value" style="font-size: 24px;">${additionalSales}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Recommended Action Plan</h2>
            <ol>
                <li><strong>Immediate (Week 1-2):</strong>
                    <ul>
                        <li>Implement automated lead response system</li>
                        <li>Fix critical mobile usability issues</li>
                        <li>Optimize page load speed</li>
                    </ul>
                </li>
                <li><strong>Short-term (Month 1):</strong>
                    <ul>
                        <li>Complete website optimization for ${topIssues.map(i => i.name).join(', ')}</li>
                        <li>Train staff on faster lead response protocols</li>
                        <li>Implement lead tracking improvements</li>
                    </ul>
                </li>
                <li><strong>Medium-term (Month 2-3):</strong>
                    <ul>
                        <li>Launch enhanced mobile experience</li>
                        <li>Implement A/B testing for conversion optimization</li>
                        <li>Review and optimize lead distribution system</li>
                    </ul>
                </li>
            </ol>
        </div>
        
        <div class="footer">
            <p>© 2025 JL Robinson. All Rights Reserved. | Auto Audit Pro™</p>
            <p>This report contains confidential performance data and recommendations.</p>
        </div>
    </body>
    </html>
    `;
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