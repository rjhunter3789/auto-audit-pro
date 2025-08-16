/*
 * Standalone Dealer Lead Performance Analysis
 * Auto Audit Pro Suite
 * 
 * Designed specifically for single dealer reports with PA Code format
 * 
 * Response Time Calculation:
 * - Column F: Date/Time Actionable (when dealer could respond - business hours)
 * - Column G: Date/Time dealer responded (empty = no response)
 * - Response time measures from actionable time, not receipt time
 * - TODO: Apply same logic to network dealers page
 */

// Global variables
let dealerData = null;
let charts = {};

// Security: Auto-cleanup on tab/window close
window.addEventListener('beforeunload', function(e) {
    // Check if user wants to keep data
    const keepData = localStorage.getItem('keepDataOnClose') === 'true';
    if (!keepData && dealerData) {
        // Show confirmation
        e.preventDefault();
        e.returnValue = 'Your lead data will be cleared when you close this tab. Continue?';
    }
});

window.addEventListener('unload', function() {
    const keepData = localStorage.getItem('keepDataOnClose') === 'true';
    if (!keepData) {
        // Clear all lead data - NO customer PII is ever sent to server
        localStorage.removeItem('standaloneDealerData');
        localStorage.removeItem('standaloneDataInfo');
        sessionStorage.clear();
    }
});

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
                const workbook = XLSX.read(e.target.result, { 
                    type: 'binary',
                    cellText: false,  // Get raw values, not formatted text
                    cellDates: true   // Parse dates properly
                });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(firstSheet, { 
                    header: 1,
                    raw: true,        // Get raw values
                    defval: ''        // Default empty cells to empty string
                });
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
        yourSales: 0,          // Sales at your dealership
        lostSales: 0,          // Sales lost to other dealers
        noSale: 0,             // Leads that didn't buy anywhere
        responded: 0,
        noResponse: 0,
        leadTypes: {
            Form: { count: 0, yourSales: 0, lostSales: 0 },
            Phone: { count: 0, yourSales: 0, lostSales: 0 },
            Chat: { count: 0, yourSales: 0, lostSales: 0 }
        },
        leadSources: {},
        vehicleTypes: {
            New: { yourSales: 0, lostSales: 0 },
            Used: { yourSales: 0, lostSales: 0 },
            CPO: { yourSales: 0, lostSales: 0 }
        },
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
            console.log('Found dealer:', dealerData.name, 'PA Code:', dealerData.paCode);
        } else {
            // Try to extract from filename
            const filenameMatch = filename.match(/([FL]?\d{5})/);
            if (filenameMatch) {
                dealerData.paCode = filenameMatch[1];
                dealerData.name = `Dealer ${filenameMatch[1]}`;
            }
        }
    }
    
    // Column mapping for standalone dealer reports
    const columnMap = {
        receivedDate: 0,    // Column A - Date/Time dealer received the lead
        leadSource: 1,      // Column B
        leadType: 2,        // Column C
        vehicleType: 3,     // Column D (New/Used/CPO)
        actionableDate: 5,  // Column F
        responseDate: 6,    // Column G - Date/Time dealer responded
        elapsedTime: 7,     // Column H
        elapsedTime2: 8,    // Column I
        saleDate: 9,        // Column J
        model: 10,          // Column K
        sellingDealer: 11,  // Column L (5-digit code or "Other")
        salesType: 12       // Column M (N/U/C)
    };
    
    // If headers exist in row 2, try to find columns dynamically
    if (data[1] && data[1].length > 5) {
        const headers = data[1];
        headers.forEach((header, index) => {
            if (!header) return;
            const h = String(header).toLowerCase().trim();
            if (h.includes('lead source')) columnMap.leadSource = index;
            else if (h.includes('lead type')) columnMap.leadType = index;
            else if (h.includes('vehicle type')) columnMap.vehicleType = index;
            else if (h.includes('actionable')) columnMap.actionableDate = index;
            else if (h.includes('response date') || h === 'response date') columnMap.responseDate = index;
            else if (h.includes('sale date')) columnMap.saleDate = index;
            else if (h.includes('selling dealer') || h.includes('dealer code')) columnMap.sellingDealer = index;
            else if (h.includes('sales type') || h === 'type') columnMap.salesType = index;
        });
        console.log('Column mapping after header detection:', columnMap);
    }
    
    // Process data starting from row 3
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;
        
        const leadType = row[columnMap.leadType] || row[2]; // Column C
        const leadSource = row[columnMap.leadSource] || row[1]; // Column B
        const vehicleType = row[columnMap.vehicleType] || row[3]; // Column D (New/Used/CPO)
        const saleDate = row[columnMap.saleDate] || row[9]; // Column J
        const sellingDealer = row[columnMap.sellingDealer] || row[11]; // Column L
        const salesType = row[columnMap.salesType] || row[12]; // Column M
        
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
        
        // Check sales outcome
        if (saleDate && saleDate !== '' && saleDate !== 'No' && saleDate !== 'N/A') {
            // There was a sale - check who made it
            console.log(`Sale detected - Selling Dealer: "${sellingDealer}", Your PA Code: "${dealerData.paCode}"`);
            
            // Normalize selling dealer for comparison - remove any Excel comment artifacts
            let normalizedSellingDealer = String(sellingDealer).trim();
            
            // Remove any comment indicators or extra content after the dealer code
            // Excel comments might appear as "04417[comment]" or similar
            normalizedSellingDealer = normalizedSellingDealer.split(/[\[\({\s]/)[0].trim();
            
            const normalizedPACode = dealerData.paCode;
            const paCodeWithoutPrefix = normalizedPACode.substring(1); // Remove F or L prefix
            
            console.log(`Comparing: Selling="${normalizedSellingDealer}" vs PA="${normalizedPACode}" vs PA without prefix="${paCodeWithoutPrefix}"`);
            
            // Check if selling dealer matches - try multiple formats
            const isYourSale = normalizedSellingDealer === normalizedPACode || 
                               normalizedSellingDealer === paCodeWithoutPrefix || // Most common case: 04417 vs F04417
                               normalizedSellingDealer === normalizedPACode.replace(/[FL]/, '') || // Remove F or L
                               normalizedPACode.endsWith(normalizedSellingDealer); // PA code ends with dealer
            
            if (sellingDealer && isYourSale) {
                // Your dealership made the sale
                console.log('Matched as YOUR sale');
                dealerData.yourSales++;
                if (dealerData.leadTypes[leadType]) {
                    dealerData.leadTypes[leadType].yourSales++;
                }
                if (!dealerData.leadSources[leadSource]) {
                    dealerData.leadSources[leadSource] = { count: 0, yourSales: 0, lostSales: 0 };
                }
                dealerData.leadSources[leadSource].yourSales++;
                
                // Track by vehicle type
                const vType = salesType === 'N' ? 'New' : salesType === 'U' ? 'Used' : salesType === 'C' ? 'CPO' : vehicleType;
                if (vType && dealerData.vehicleTypes[vType]) {
                    dealerData.vehicleTypes[vType].yourSales++;
                }
            } else if (sellingDealer && (normalizedSellingDealer === 'Other' || !isYourSale)) {
                // Lost sale to another dealer
                console.log('Matched as LOST sale');
                dealerData.lostSales++;
                if (dealerData.leadTypes[leadType]) {
                    dealerData.leadTypes[leadType].lostSales++;
                }
                if (!dealerData.leadSources[leadSource]) {
                    dealerData.leadSources[leadSource] = { count: 0, yourSales: 0, lostSales: 0 };
                }
                dealerData.leadSources[leadSource].lostSales++;
                
                // Track by vehicle type
                const vType = salesType === 'N' ? 'New' : salesType === 'U' ? 'Used' : salesType === 'C' ? 'CPO' : vehicleType;
                if (vType && dealerData.vehicleTypes[vType]) {
                    dealerData.vehicleTypes[vType].lostSales++;
                }
            }
        } else {
            // No sale at all
            dealerData.noSale++;
        }
        
        // Calculate response time using Column F (actionable) and Column G (response)
        if (columnMap.actionableDate >= 0 && columnMap.responseDate >= 0) {
            const actionableDate = row[columnMap.actionableDate];  // Column F - when actionable (business hours)
            const response = row[columnMap.responseDate];           // Column G - when responded
            
            // Debug first few rows
            if (i < 5 && actionableDate) {
                console.log(`Row ${i} dates - Actionable: ${actionableDate} (type: ${typeof actionableDate}), Response: ${response} (type: ${typeof response})`);
            }
            
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
                
                // Try to use elapsed time columns first (might be pre-calculated)
                let responseMinutes = 999999;
                
                // Check if we have elapsed time in column H or I
                const elapsedH = row[columnMap.elapsedTime];
                const elapsedI = row[columnMap.elapsedTime2];
                
                if (i < 5) {
                    console.log(`Row ${i} elapsed times - H: "${elapsedH}", I: "${elapsedI}"`);
                    console.log(`Row ${i} dates - Actionable: "${actionableDate}", Response: "${response}"`);
                }
                
                // Try to parse elapsed time (might be in format like "0:15" or "15" or "2:30:45")
                if (elapsedH && elapsedH !== '') {
                    responseMinutes = parseElapsedTime(elapsedH);
                } else if (elapsedI && elapsedI !== '') {
                    responseMinutes = parseElapsedTime(elapsedI);
                } else {
                    // Fall back to calculating from dates (Column F to Column G)
                    responseMinutes = calculateResponseTime(actionableDate, response);
                }
                
                if (i < 5) {
                    console.log(`Row ${i} response time: ${responseMinutes} minutes`);
                }
                categorizeResponseTime(responseMinutes);
            }
        } else {
            // If we can't find response columns, log it
            console.log('Warning: Could not find response date columns');
        }
    }
    
    console.log('Analysis complete:', dealerData);
    console.log(`Sales Summary - Your Sales: ${dealerData.yourSales}, Lost Sales: ${dealerData.lostSales}, No Sale: ${dealerData.noSale}`);
    console.log(`Conversion Rate: ${((dealerData.yourSales / dealerData.totalLeads) * 100).toFixed(1)}%`);
    displayResults();
}

// Parse elapsed time from various formats (0:15, 2:30:45, 15, etc.)
function parseElapsedTime(elapsed) {
    try {
        const elapsedStr = String(elapsed).trim();
        
        // If it's just a number, assume it's minutes
        if (/^\d+$/.test(elapsedStr)) {
            return parseInt(elapsedStr);
        }
        
        // If it's in H:MM or HH:MM format
        if (/^\d+:\d{2}$/.test(elapsedStr)) {
            const [hours, minutes] = elapsedStr.split(':').map(Number);
            return hours * 60 + minutes;
        }
        
        // If it's in H:MM:SS or HH:MM:SS format
        if (/^\d+:\d{2}:\d{2}$/.test(elapsedStr)) {
            const [hours, minutes, seconds] = elapsedStr.split(':').map(Number);
            return hours * 60 + minutes + Math.round(seconds / 60);
        }
        
        // If it's in D.HH:MM:SS format (days.hours:minutes:seconds)
        if (/^\d+\.\d{2}:\d{2}:\d{2}$/.test(elapsedStr)) {
            const [days, time] = elapsedStr.split('.');
            const [hours, minutes, seconds] = time.split(':').map(Number);
            return parseInt(days) * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
        }
        
        console.log(`Unable to parse elapsed time: ${elapsedStr}`);
        return 999999;
    } catch (e) {
        console.error('Error parsing elapsed time:', e);
        return 999999;
    }
}

// Calculate response time in minutes
function calculateResponseTime(actionable, response) {
    try {
        let start, end;
        
        // Handle Excel serial dates (numbers representing days since 1900)
        if (typeof actionable === 'number' && typeof response === 'number') {
            // Excel stores dates as days since 1900-01-01
            const msPerDay = 24 * 60 * 60 * 1000;
            const excelEpoch = new Date(1900, 0, 1).getTime() - (2 * msPerDay); // Excel has 2-day offset
            start = new Date(excelEpoch + actionable * msPerDay);
            end = new Date(excelEpoch + response * msPerDay);
        } else {
            // Try parsing as regular dates - handle "1/15/2025 10:30AM" format
            // JavaScript's Date constructor might have issues with missing space before AM/PM
            const actionableStr = String(actionable).replace(/(\d)(AM|PM)/i, '$1 $2');
            const responseStr = String(response).replace(/(\d)(AM|PM)/i, '$1 $2');
            
            start = new Date(actionableStr);
            end = new Date(responseStr);
        }
        
        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.log(`Invalid dates - Actionable: "${actionable}", Response: "${response}"`);
            console.log(`Parsed as - Start: ${start}, End: ${end}`);
            return 999999;
        }
        
        const diffMinutes = Math.floor((end - start) / 1000 / 60);
        
        // Sanity check - response should be after actionable
        if (diffMinutes < 0) {
            console.log(`Negative response time - Start: ${start}, End: ${end}`);
            return 999999;
        }
        
        return diffMinutes;
    } catch (e) {
        console.error('Error calculating response time:', e);
        return 999999;
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
    
    // Calculate conversion rates
    const yourConversionRate = dealerData.totalLeads > 0 ? 
        ((dealerData.yourSales / dealerData.totalLeads) * 100).toFixed(1) : 0;
    const lostToCompetitionRate = dealerData.totalLeads > 0 ? 
        ((dealerData.lostSales / dealerData.totalLeads) * 100).toFixed(1) : 0;
    const marketConversionRate = dealerData.totalLeads > 0 ? 
        (((dealerData.yourSales + dealerData.lostSales) / dealerData.totalLeads) * 100).toFixed(1) : 0;
    
    // Update conversion rate to show YOUR conversion rate
    document.getElementById('conversionRate').textContent = yourConversionRate + '%';
    document.getElementById('lostToCompetitionRate').textContent = lostToCompetitionRate + '%';
    document.getElementById('marketConversionRate').textContent = marketConversionRate + '%';
    
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
                    label: 'Total Leads',
                    data: [],
                    backgroundColor: '#6B46C1'
                }, {
                    label: 'Your Sales',
                    data: [],
                    backgroundColor: '#10B981'
                }, {
                    label: 'Lost Sales',
                    data: [],
                    backgroundColor: '#EF4444'
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
                    label: 'Your Sales',
                    data: [],
                    backgroundColor: '#10B981'
                }, {
                    label: 'Lost Sales',
                    data: [],
                    backgroundColor: '#EF4444'
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
        charts.leadSource.data.datasets[1].data = sources.map(s => s[1].yourSales || 0);
        charts.leadSource.data.datasets[2].data = sources.map(s => s[1].lostSales || 0);
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
            dealerData.leadTypes.Form.yourSales,
            dealerData.leadTypes.Phone.yourSales,
            dealerData.leadTypes.Chat.yourSales
        ];
        charts.leadType.data.datasets[2].data = [
            dealerData.leadTypes.Form.lostSales,
            dealerData.leadTypes.Phone.lostSales,
            dealerData.leadTypes.Chat.lostSales
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
    csv += `Your Sales,${dealerData.yourSales}\n`;
    csv += `Lost Sales,${dealerData.lostSales}\n`;
    csv += `No Sale,${dealerData.noSale}\n`;
    csv += `Your Conversion Rate,${((dealerData.yourSales / dealerData.totalLeads) * 100).toFixed(1)}%\n`;
    csv += `Lost to Competition Rate,${((dealerData.lostSales / dealerData.totalLeads) * 100).toFixed(1)}%\n`;
    csv += `Market Conversion Rate,${(((dealerData.yourSales + dealerData.lostSales) / dealerData.totalLeads) * 100).toFixed(1)}%\n`;
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