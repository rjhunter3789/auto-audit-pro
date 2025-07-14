/*
 * Lead Performance Intelligence - Auto Audit Pro Suite
 * Version 2.2
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Author: JL Robinson
 * Contact: nakapaahu@gmail.com
 * Last Modified: July 13, 2025
 */

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
    console.log('Lead Performance app initializing...');
    
    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        console.error('XLSX library not loaded! Excel files will not work.');
        alert('Error: Excel file support not loaded. Please refresh the page.');
    } else {
        console.log('XLSX library loaded successfully');
    }
    
    initializeCharts();
    checkAndLoadStoredData();
    setupDragAndDrop();
    setupSecurityFeatures();
    
    // Load saved settings
    setTimeout(() => {
        loadSavedSettings();
    }, 100);
    
    // Check if we should select a specific dealer
    setTimeout(() => {
        const selectDealer = sessionStorage.getItem('selectDealer');
        if (selectDealer && uploadedDealerData) {
            const dealerSelect = document.getElementById('dealerSelect');
            if (dealerSelect) {
                dealerSelect.value = selectDealer;
                updateDealerAnalysis();
                // Switch to analysis tab
                showSection('analysis');
                sessionStorage.removeItem('selectDealer');
            }
        }
    }, 1000);
    
    // Test: Try to update response time display after a short delay
    setTimeout(() => {
        const testElem = document.getElementById('response15min');
        if (testElem) {
            console.log('Test: Found response15min element, current value:', testElem.textContent);
            // Don't actually change it, just log that we found it
        } else {
            console.error('Test: response15min element not found after DOM ready!');
        }
        
        // DIRECT TEST: Can we parse response times at all?
        console.log('=== DIRECT RESPONSE TIME PARSING TEST ===');
        const testTimes = ['0h 30m', '0h30m', '30m', '2h', '1h 45m', '45 minutes'];
        testTimes.forEach(time => {
            let result = 'FAILED';
            let match = time.match(/(\d+)h\s*(\d+)m/);
            if (match) {
                result = (parseInt(match[1]) * 60 + parseInt(match[2])) + ' minutes';
            } else {
                match = time.match(/(\d+)m/);
                if (match) {
                    result = parseInt(match[1]) + ' minutes';
                } else {
                    match = time.match(/(\d+)h/);
                    if (match) {
                        result = (parseInt(match[1]) * 60) + ' minutes';
                    }
                }
            }
            console.log(`  "${time}" -> ${result}`);
        });
    }, 1000);
});

// Setup drag and drop
function setupDragAndDrop() {
    const uploadCard = document.querySelector('.upload-card');
    if (!uploadCard) {
        console.error('Upload card not found!');
        return;
    }
    
    // Test if file input exists
    const fileInput = document.getElementById('fileInput');
    if (!fileInput) {
        console.error('File input element not found!');
    } else {
        console.log('File input found and ready');
    }
    
    uploadCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadCard.style.backgroundColor = '#F9FAFB';
        uploadCard.style.borderColor = '#6B46C1';
    });
    
    uploadCard.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadCard.style.backgroundColor = '';
        uploadCard.style.borderColor = '';
    });
    
    uploadCard.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadCard.style.backgroundColor = '';
        uploadCard.style.borderColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            console.log('File dropped:', file.name);
            // Manually trigger the file select handler
            const event = { target: { files: [file] } };
            handleFileSelect(event);
        }
    });
}

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
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.click();
    } else {
        console.error('File input element not found!');
        alert('Error: File upload element not found. Please refresh the page.');
    }
}

function handleFileSelect(event) {
    console.log('File select triggered');
    const file = event.target.files[0];
    
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // If there's existing data, confirm replacement
    if (Object.keys(uploadedDealerData).length > 0) {
        const uploadInfo = localStorage.getItem('dataUploadInfo');
        let confirmMessage = 'This will replace your existing dealer data. Continue?';
        
        if (uploadInfo) {
            const info = JSON.parse(uploadInfo);
            const uploadDate = new Date(info.uploadDate);
            confirmMessage = `This will replace your existing data (${info.dealerCount} dealers uploaded ${uploadDate.toLocaleDateString()}). Continue?`;
        }
        
        if (!confirm(confirmMessage)) {
            event.target.value = ''; // Reset file input
            return;
        }
    }
    
    // Check file type
    const validTypes = ['.csv', '.xlsx', '.xlsm', '.xls'];
    const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
        alert('Please upload a valid Excel (.xlsx, .xlsm, .xls) or CSV file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
            console.log('FileReader onload triggered');
            try {
                let data;
                if (file.name.endsWith('.csv')) {
                    console.log('Processing CSV file');
                    data = parseCSV(e.target.result);
                } else {
                    console.log('Processing Excel file');
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    console.log('Workbook sheets:', workbook.SheetNames);
                    
                    // Check if this is a multi-worksheet file (network report)
                    if (workbook.SheetNames.length > 1) {
                        console.log('Multi-worksheet file detected - processing as network report');
                        processMultiWorksheetFile(workbook, file.name);
                        return; // Exit here, different processing path
                    } else {
                        // Single worksheet - process normally
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        console.log('Data extracted, rows:', data.length);
                    }
                }
                
                // Pass filename to help identify dealer
                processUploadedData(data, file.name);
                showUploadSuccess();
                
                // Save complete data to enhanced storage
                saveDataToStorage(uploadedDealerData);
                
                // Store data for correlation with website audit (legacy)
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
                console.error('Error stack:', error.stack);
                alert('Error processing file: ' + error.message);
            }
        };
        
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
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
    // Clear existing data when processing new file
    uploadedDealerData = {};
    
    // Debug: Log the first few rows to understand structure
    console.log('First 15 rows of data:', data.slice(0, 15));
    console.log('Filename:', filename);
    console.log('Total rows in file:', data.length);
    
    // Log what's in key positions
    if (data.length > 11) {
        console.log('Row 11 (data start):', data[11]);
        console.log('Row 12:', data[12]);
        
        // Show column headers if they exist
        if (data.length > 10 && data[10]) {
            console.log('Possible headers at row 11:', data[10]);
        }
    }
    
    // Find dealer name - Ford reports have dealer name in cell B2
    let dealerName = '';
    
    // Primary location: Cell B2 (Row 2, Column B = index [1][1])
    if (data.length > 1 && data[1] && data[1][1]) {
        const cellB2 = String(data[1][1]).trim();
        console.log('Cell B2 content:', cellB2);
        
        // Check if this looks like a dealer name (not a header)
        if (cellB2 && 
            !cellB2.toLowerCase().includes('dealer') && 
            !cellB2.toLowerCase().includes('report') &&
            !cellB2.toLowerCase().includes('lead') &&
            cellB2.length > 3) {
            dealerName = cellB2;
            console.log('Found dealer name in B2:', dealerName);
        }
    }
    
    // If not found in B2, check a few other common locations
    if (!dealerName) {
        const possibleLocations = [
            [0, 1], // Row 1, Column B
            [2, 1], // Row 3, Column B
            [1, 0], // Row 2, Column A
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
    // IMPORTANT: Lead data starts at row 12 (index 11)
    // Row 12 has "Lead Source" in column B
    const dealers = {};
    let isNetworkReport = false;
    let currentDealer = dealerName;
    let currentDealerData = {
        leads: 0,
        sales: 0,
        responded: 0,
        noResponse: 0,
        responseTime15min: 0,
        responseTime30min: 0,
        responseTime60min: 0,
        responseTime60plus: 0,
        responseTime24hr: 0,
        responseTime24plus: 0,
        leadSources: {}
    };
    
    // First, check if this looks like a network report
    // Network reports typically have dealer names in column A with no data in columns B-I
    let possibleNetworkReport = false;
    for (let i = 11; i < Math.min(data.length, 20); i++) {
        const row = data[i];
        if (row && row[0] && typeof row[0] === 'string' && row[0].trim().length > 3) {
            // Check if this row has a dealer name pattern (text in col A, empty cols B-I)
            const hasEmptyDataCols = !row[2] || row[2] === '';
            const looksLikeDealerName = !row[0].toLowerCase().includes('total') && 
                                       !row[0].toLowerCase().includes('lead') &&
                                       !row[0].toLowerCase().includes('source');
            if (hasEmptyDataCols && looksLikeDealerName) {
                possibleNetworkReport = true;
                console.log('Detected possible network report format');
                break;
            }
        }
    }
    
    // Start scanning from row 12 (index 11) where lead data begins
    console.log(`Processing ${data.length - 11} potential lead rows starting from row 12`);
    let processedRows = 0;
    let skippedRows = 0;
    
    for (let i = 11; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0] || !row[1]) {
            skippedRows++;
            continue; // Skip empty rows
        }
        
        const colA = row[0]; // Column A - might be dealer name in network reports
        const colB = row[1]; // Column B - Lead Source or dealer name
        
        // Check if this row is a dealer name (network report format)
        // In network reports: dealer name in col A, empty data cols
        if (possibleNetworkReport && colA && typeof colA === 'string' && colA.trim().length > 3 &&
            !colA.toLowerCase().includes('total') &&
            !colA.toLowerCase().includes('lead') &&
            (!row[2] || row[2] === '')) {
            
            // Save previous dealer if exists
            if (currentDealer && currentDealerData.leads > 0) {
                // Calculate conversion rates for each lead source
                Object.keys(currentDealerData.leadSources).forEach(source => {
                    const sourceData = currentDealerData.leadSources[source];
                    sourceData.conversionRate = sourceData.leads > 0 ? 
                        (sourceData.sales / sourceData.leads * 100).toFixed(2) : '0';
                });
                
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
                responded: 0,
                noResponse: 0,
                responseTime15min: 0,
                responseTime30min: 0,
                responseTime60min: 0,
                responseTime60plus: 0,
                responseTime24hr: 0,
                responseTime24plus: 0,
                leadSources: {}
            };
            isNetworkReport = true;
            console.log('Found dealer in network report:', currentDealer);
            continue;
        }
        
        // Process lead source data
        const leadSource = colB;
        if (!leadSource || leadSource === 'Grand Total' || leadSource.toLowerCase().includes('total')) {
            continue;
        }
        
        // Skip header rows that might appear in data
        if (leadSource.toLowerCase().includes('lead source') || 
            leadSource.toLowerCase().includes('dealer') ||
            colA.toLowerCase().includes('request date')) {
            continue;
        }
        
        // Excel column mapping for Ford lead reports:
        // Column A: Lead Request Date (when customer submitted)
        // Column B: Lead Source
        // Column C: Lead Type (Chat/Form) - ONLY counting Form leads
        // Column F: Date/Time Actionable (when business hours start)
        // Column G: Response Time (pre-calculated)
        // Column H: Response Date (when dealer actually responded)
        // Column J: Sale Date (if converted to sale)
        // IMPORTANT: Response time measured from Column F, not Column A
        
        const leadType = row[2]; // Column C - Lead Type
        if (!leadType || leadType !== 'Form') {
            skippedRows++;
            continue; // Skip non-Form leads
        }
        
        if (!currentDealerData.leadSources[leadSource]) {
            currentDealerData.leadSources[leadSource] = {
                leads: 0,
                appointments: 0,
                shows: 0,
                sales: 0,
                conversionRate: 0
            };
        }
        
        // Count this Form lead
        currentDealerData.leadSources[leadSource].leads += 1;
        currentDealerData.leads += 1;
        
        // Get relevant columns
        const actionableDateTime = row[5]; // Column F - Date/Time Actionable
        const responseDate = row[6]; // Column G - Response Date (actual response time)
        const elapsedTime = row[7]; // Column H - Total Elapsed Time (e.g., "0h 5m", "51h 56m")
        
        // Debug first few rows
        if (processedRows < 3) {
            console.log(`Row ${i+1}:`);
            console.log(`  Actionable (Col F): "${actionableDateTime}"`);
            console.log(`  Response Date (Col G): "${responseDate}"`);
            console.log(`  Elapsed Time (Col H): "${elapsedTime}"`);
        }
        
        // Check if there was a response (Column G not "N/A" or empty)
        const trimmedResponseDate = responseDate ? responseDate.toString().trim() : '';
        if (trimmedResponseDate === 'N/A' || trimmedResponseDate === 'n/a' || trimmedResponseDate === 'N/a' || 
            trimmedResponseDate === '' || !trimmedResponseDate) {
            // No response
            currentDealerData.noResponse += 1;
            if (processedRows < 3) {
                console.log('  -> Counted as NO RESPONSE');
            }
        } else {
            // There was a response - use Column H for elapsed time
            currentDealerData.responded += 1;
            currentDealerData.leadSources[leadSource].appointments += 1;
            if (processedRows < 3) {
                console.log('  -> Counted as RESPONDED');
            }
            
            // Parse elapsed time from Column H
            if (elapsedTime && elapsedTime !== 'N/A' && elapsedTime !== '') {
                // Try different regex patterns for time format
                let totalMinutes = null;
                
                // Pattern 1: "0h 30m" format
                let match = elapsedTime.match(/(\d+)h (\d+)m/);
                if (match) {
                    totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                } else {
                    // Pattern 2: "0h30m" (no space)
                    match = elapsedTime.match(/(\d+)h(\d+)m/);
                    if (match) {
                        totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                    } else {
                        // Pattern 3: Just minutes "30m"
                        match = elapsedTime.match(/(\d+)m/);
                        if (match) {
                            totalMinutes = parseInt(match[1]);
                        } else {
                            // Pattern 4: Just hours "2h"
                            match = elapsedTime.match(/(\d+)h/);
                            if (match) {
                                totalMinutes = parseInt(match[1]) * 60;
                            }
                        }
                    }
                }
                
                if (totalMinutes !== null) {
                    // Debug log
                    if (processedRows < 5) {
                        console.log(`  Elapsed time parsed: "${elapsedTime}" = ${totalMinutes} minutes`);
                    }
                    
                    // Categorize based on minutes
                    if (totalMinutes <= 15) {
                        currentDealerData.responseTime15min += 1;
                    } else if (totalMinutes <= 30) {
                        currentDealerData.responseTime30min += 1;
                    } else if (totalMinutes <= 60) {
                        currentDealerData.responseTime60min += 1;
                    } else if (totalMinutes <= 240) { // 4 hours
                        currentDealerData.responseTime60plus += 1;
                    } else if (totalMinutes <= 1440) { // 24 hours
                        currentDealerData.responseTime24hr += 1;
                    } else {
                        currentDealerData.responseTime24plus += 1;
                    }
                } else {
                    // Could not parse time format
                    if (processedRows < 5) {
                        console.warn(`Could not parse response time format: "${responseTimeText}"`);
                    }
                }
            }
        }
        
        // Check for sale (Column J)
        const saleDate = row[9]; // Column J
        if (saleDate && saleDate !== '' && saleDate !== 'N/A') {
            currentDealerData.leadSources[leadSource].sales += 1;
            currentDealerData.sales += 1;
        }
        
        
        processedRows++;
    }
    
    // Save last dealer
    if (currentDealer && currentDealerData.leads > 0) {
        // Calculate conversion rates for each lead source
        Object.keys(currentDealerData.leadSources).forEach(source => {
            const sourceData = currentDealerData.leadSources[source];
            sourceData.conversionRate = sourceData.leads > 0 ? 
                (sourceData.sales / sourceData.leads * 100).toFixed(2) : '0';
        });
        
        dealers[currentDealer] = {
            name: currentDealer,
            ...currentDealerData,
            conversionRate: currentDealerData.leads > 0 ? 
                (currentDealerData.sales / currentDealerData.leads * 100).toFixed(2) : 0
        };
        
        // Debug: Log response time data for this dealer
        console.log(`Dealer ${currentDealer} response times:`, {
            responded: currentDealerData.responded,
            noResponse: currentDealerData.noResponse,
            time15min: currentDealerData.responseTime15min,
            time30min: currentDealerData.responseTime30min,
            time60min: currentDealerData.responseTime60min
        });
    }
    
    console.log('Processed dealer data:', dealers);
    console.log('Is network report:', isNetworkReport);
    console.log('Number of dealers found:', Object.keys(dealers).length);
    console.log(`Processed ${processedRows} Form leads, skipped ${skippedRows} non-Form/invalid rows`);
    
    // If no dealers found, try to help debug
    if (Object.keys(dealers).length === 0) {
        console.error('No dealers found! Showing data structure for debugging:');
        console.log('Sample rows 10-20:', data.slice(10, 21));
        
        // Check what's in column A for potential dealer names
        console.log('Column A values (rows 11-20):');
        for (let i = 11; i < Math.min(data.length, 21); i++) {
            if (data[i] && data[i][0]) {
                console.log(`Row ${i+1}: "${data[i][0]}" (Col C: ${data[i][2] || 'empty'})`);
            }
        }
        
        alert('No dealer data found in the file. Please check the browser console for debugging information.');
    }
    
    uploadedDealerData = dealers;
    
    // Debug: Check first dealer's data
    const firstDealer = Object.values(dealers)[0];
    if (firstDealer) {
        console.log('Sample dealer data:', {
            name: firstDealer.name,
            leads: firstDealer.leads,
            responded: firstDealer.responded,
            noResponse: firstDealer.noResponse,
            responseTime15min: firstDealer.responseTime15min,
            responseTime30min: firstDealer.responseTime30min,
            responseTime60min: firstDealer.responseTime60min,
            responseTime60plus: firstDealer.responseTime60plus,
            responseTime24hr: firstDealer.responseTime24hr,
            responseTime24plus: firstDealer.responseTime24plus
        });
    }
    
    // Populate dealer dropdowns
    populateDealerDropdowns();
    
    
    // Calculate totals for dashboard
    let totalNetworkLeads = 0;
    let totalNetworkSales = 0;
    Object.values(dealers).forEach(dealer => {
        totalNetworkLeads += dealer.leads;
        totalNetworkSales += dealer.sales;
    });
    
    const avgConversionRate = totalNetworkLeads > 0 ? 
        (totalNetworkSales / totalNetworkLeads * 100).toFixed(2) : 0;
    
    // Calculate response metrics
    let totalResponded = 0;
    let total15MinResponses = 0;
    let responseDistribution = {
        time15min: 0,
        time30min: 0,
        time60min: 0,
        time60plus: 0,
        time24hr: 0,
        time24plus: 0,
        noResponse: 0,
        responded: 0,
        total: totalNetworkLeads
    };
    
    Object.values(dealers).forEach(dealer => {
        totalResponded += dealer.responded || 0;
        total15MinResponses += dealer.responseTime15min || 0;
        responseDistribution.time15min += dealer.responseTime15min || 0;
        responseDistribution.time30min += dealer.responseTime30min || 0;
        responseDistribution.time60min += dealer.responseTime60min || 0;
        responseDistribution.time60plus += dealer.responseTime60plus || 0;
        responseDistribution.time24hr += dealer.responseTime24hr || 0;
        responseDistribution.time24plus += dealer.responseTime24plus || 0;
        responseDistribution.noResponse += dealer.noResponse || 0;
        responseDistribution.responded += dealer.responded || 0;
    });
    
    // Debug log response distribution
    console.log('Response Distribution:', responseDistribution);
    console.log('Total Responded:', totalResponded);
    console.log('Total 15-min responses:', total15MinResponses);
    
    const responseRate = totalNetworkLeads > 0 ? 
        (totalResponded / totalNetworkLeads * 100).toFixed(1) : 0;
    const noResponseRate = totalNetworkLeads > 0 ? 
        ((totalNetworkLeads - totalResponded) / totalNetworkLeads * 100).toFixed(1) : 0;
    const quickResponseRate = totalNetworkLeads > 0 ? 
        (total15MinResponses / totalNetworkLeads * 100).toFixed(1) : 0;
    
    // Update dashboard
    updateDashboard({
        totalLeads: totalNetworkLeads,
        conversionRate: avgConversionRate,
        responseRate: responseRate,
        noResponseRate: noResponseRate,
        quickResponseRate: quickResponseRate,
        dealerCount: Object.keys(dealers).length,
        dealerName: isNetworkReport ? 'Network Report' : dealerName,
        responseDistribution: responseDistribution
    });
    
    // Update dealer dropdown
    updateDealerDropdown();
    
    // Update charts
    updateCharts();
    
}


function updateDashboard(metrics) {
    console.log('updateDashboard called with metrics:', metrics);
    
    // Calculate monthly average (6 months of data: Q1 + Q2)
    // Extrapolate to annual (multiply by 2) then divide by 12 for monthly average
    const monthlyAverage = Math.round((metrics.totalLeads * 2) / 12);
    
    // Update metric cards
    document.getElementById('totalLeads').textContent = monthlyAverage.toLocaleString();
    document.getElementById('conversionRate').textContent = metrics.conversionRate + '%';
    
    // Update the period text to show what data we're using
    const periodElem = document.getElementById('leadPeriod');
    if (periodElem) {
        periodElem.textContent = `Based on ${metrics.totalLeads.toLocaleString()} leads (Q1-Q2)`;
    }
    
    // Update response metrics
    if (document.getElementById('noResponseRate')) {
        document.getElementById('noResponseRate').textContent = metrics.noResponseRate + '%';
    }
    if (document.getElementById('quickResponseRate')) {
        document.getElementById('quickResponseRate').textContent = metrics.quickResponseRate + '%';
    }
    
    // Update response time distribution if we have the data
    if (metrics.responseDistribution) {
        console.log('Updating response distribution display:', metrics.responseDistribution);
        const dist = metrics.responseDistribution;
        const total = dist.total || 1; // Avoid division by zero
        
        // Helper function to safely update element
        const updateElement = (id, value) => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.textContent = value;
                console.log(`Updated ${id}: ${value}`);
            } else {
                console.error(`Element #${id} not found! Cannot update with value: ${value}`);
            }
        };
        
        // Update each response time element
        updateElement('response15min', `${dist.time15min} (${((dist.time15min / total) * 100).toFixed(1)}%)`);
        updateElement('response30min', `${dist.time30min} (${((dist.time30min / total) * 100).toFixed(1)}%)`);
        updateElement('response60min', `${dist.time60min} (${((dist.time60min / total) * 100).toFixed(1)}%)`);
        updateElement('response60plus', `${dist.time60plus} (${((dist.time60plus / total) * 100).toFixed(1)}%)`);
        updateElement('response24hr', `${dist.time24hr} (${((dist.time24hr / total) * 100).toFixed(1)}%)`);
        updateElement('response24plus', `${dist.time24plus} (${((dist.time24plus / total) * 100).toFixed(1)}%)`);
        updateElement('responseNone', `${dist.noResponse} (${((dist.noResponse / total) * 100).toFixed(1)}%)`);
        updateElement('responseTotal', `${dist.responded} (${((dist.responded / total) * 100).toFixed(1)}%)`);
        
        // FORCE CHECK: Let's see what's actually in the distribution
        console.log('RESPONSE DISTRIBUTION CHECK:');
        console.log('- noResponse:', dist.noResponse);
        console.log('- responded:', dist.responded);
        console.log('- time15min:', dist.time15min);
        console.log('- time30min:', dist.time30min);
        console.log('- time60min:', dist.time60min);
        console.log('- total:', dist.total);
        
        // If all time buckets are 0 but responded > 0, we have a parsing problem
        if (dist.responded > 0 && dist.time15min === 0 && dist.time30min === 0 && 
            dist.time60min === 0 && dist.time60plus === 0) {
            console.error('WARNING: Leads marked as responded but NO time categories! Response time parsing is failing.');
        }
    } else {
        console.warn('No responseDistribution data in metrics!', metrics);
    }
    
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
    
    // Store selected dealer for combined insights
    localStorage.setItem('lastSelectedDealer', dealerName);
    
    // Auto-populate ROI calculator with selected dealer
    const roiDealerSelect = document.getElementById('roiDealerSelect');
    if (roiDealerSelect) {
        roiDealerSelect.value = dealerName;
        populateROIFromDealer();
    }
    
    // Calculate network averages from current data
    let networkTotals = {
        leads: 0,
        sales: 0,
        responded: 0,
        responseTime15min: 0
    };
    
    let dealerCount = 0;
    Object.values(uploadedDealerData).forEach(d => {
        networkTotals.leads += d.leads;
        networkTotals.sales += d.sales;
        networkTotals.responded += d.responded || 0;
        networkTotals.responseTime15min += d.responseTime15min || 0;
        dealerCount++;
    });
    
    const networkAvgConversion = networkTotals.leads > 0 ? 
        (networkTotals.sales / networkTotals.leads * 100).toFixed(2) : 0;
    const networkResponseRate = networkTotals.leads > 0 ? 
        (networkTotals.responded / networkTotals.leads * 100).toFixed(1) : 0;
    const network15MinRate = networkTotals.leads > 0 ? 
        (networkTotals.responseTime15min / networkTotals.leads * 100).toFixed(1) : 0;
    
    // Calculate dealer's rank
    const sortedDealers = Object.values(uploadedDealerData)
        .sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate));
    const dealerRank = sortedDealers.findIndex(d => d.name === dealerName) + 1;
    
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
    
    // Calculate response metrics
    const dealerResponseRate = dealer.leads > 0 ? 
        ((dealer.responded || 0) / dealer.leads * 100).toFixed(1) : 0;
    const dealer15MinRate = dealer.leads > 0 ? 
        ((dealer.responseTime15min || 0) / dealer.leads * 100).toFixed(1) : 0;
    
    // Debug log dealer response data
    console.log(`Dealer ${dealerName} response data:`, {
        leads: dealer.leads,
        responded: dealer.responded,
        noResponse: dealer.noResponse,
        time15min: dealer.responseTime15min,
        time30min: dealer.responseTime30min,
        time60min: dealer.responseTime60min,
        time60plus: dealer.responseTime60plus,
        time24hr: dealer.responseTime24hr,
        time24plus: dealer.responseTime24plus
    });
    
    const analysisHTML = `
        <div class="chart-container">
            <h3>${dealerName} Performance Analysis</h3>
            <p class="text-muted">PA Code: ${dealer.paCode || 'N/A'} | Network Rank: ${dealerRank} of ${dealerCount}</p>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Form Leads</h3>
                    <p class="metric-value">${dealer.leads}</p>
                    <p class="metric-change">Q1-Q2 2025 Actual</p>
                    <p class="text-muted small">Network Total: ${networkTotals.leads.toLocaleString()}</p>
                </div>
                <div class="metric-card">
                    <h3>Total Sales</h3>
                    <p class="metric-value">${dealer.sales}</p>
                    <p class="metric-change">Q1-Q2 2025 Actual</p>
                    <p class="text-muted small">Network Total: ${networkTotals.sales.toLocaleString()}</p>
                </div>
                <div class="metric-card">
                    <h3>Conversion Rate</h3>
                    <p class="metric-value">${dealer.conversionRate}%</p>
                    <p class="metric-change ${parseFloat(dealer.conversionRate) >= parseFloat(networkAvgConversion) ? 'positive' : 'negative'}">
                        Network Avg: ${networkAvgConversion}%
                        (${parseFloat(dealer.conversionRate) >= parseFloat(networkAvgConversion) ? '+' : ''}${(parseFloat(dealer.conversionRate) - parseFloat(networkAvgConversion)).toFixed(2)}%)
                    </p>
                </div>
                <div class="metric-card">
                    <h3>Performance Tier</h3>
                    <p class="metric-value">${
                        parseFloat(dealer.conversionRate) >= 20 ? 'Elite' :
                        parseFloat(dealer.conversionRate) >= 16 ? 'Strong' :
                        parseFloat(dealer.conversionRate) >= 12 ? 'Average' : 'Challenge'
                    }</p>
                    <p class="metric-change">Rank: ${dealerRank} of ${dealerCount}</p>
                </div>
            </div>
            
            <h4 class="mt-4">Response Metrics vs Network</h4>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Response Rate</h3>
                    <p class="metric-value">${dealerResponseRate}%</p>
                    <p class="metric-change ${parseFloat(dealerResponseRate) >= parseFloat(networkResponseRate) ? 'positive' : 'negative'}">
                        Network: ${networkResponseRate}%
                    </p>
                </div>
                <div class="metric-card">
                    <h3>15-Min Response</h3>
                    <p class="metric-value">${dealer15MinRate}%</p>
                    <p class="metric-change ${parseFloat(dealer15MinRate) >= parseFloat(network15MinRate) ? 'positive' : 'negative'}">
                        Network: ${network15MinRate}%
                    </p>
                </div>
                <div class="metric-card">
                    <h3>No Response</h3>
                    <p class="metric-value">${dealer.noResponse || 0}</p>
                    <p class="metric-change">
                        ${dealer.leads > 0 ? (((dealer.noResponse || 0) / dealer.leads) * 100).toFixed(1) : 0}% of leads
                    </p>
                </div>
            </div>
            
            <h4 class="mt-4">Response Time Distribution</h4>
            <div class="row">
                <div class="col-md-3 col-6 mb-3">
                    <div class="metric-card text-center">
                        <h5 class="text-success">0-15 Min</h5>
                        <p class="metric-value">${dealer.responseTime15min || 0}</p>
                        <p class="text-muted small">${dealer.responded > 0 ? (((dealer.responseTime15min || 0) / dealer.responded) * 100).toFixed(1) : 0}%</p>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="metric-card text-center">
                        <h5 class="text-info">16-30 Min</h5>
                        <p class="metric-value">${dealer.responseTime30min || 0}</p>
                        <p class="text-muted small">${dealer.responded > 0 ? (((dealer.responseTime30min || 0) / dealer.responded) * 100).toFixed(1) : 0}%</p>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="metric-card text-center">
                        <h5 class="text-warning">31-60 Min</h5>
                        <p class="metric-value">${dealer.responseTime60min || 0}</p>
                        <p class="text-muted small">${dealer.responded > 0 ? (((dealer.responseTime60min || 0) / dealer.responded) * 100).toFixed(1) : 0}%</p>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="metric-card text-center">
                        <h5 class="text-danger">60+ Min</h5>
                        <p class="metric-value">${dealer.responseTime60plus || 0}</p>
                        <p class="text-muted small">${dealer.responded > 0 ? (((dealer.responseTime60plus || 0) / dealer.responded) * 100).toFixed(1) : 0}%</p>
                    </div>
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
        // Check if this is the same dealer (improved matching)
        const brandMatch = audit.brand && (
            dealerName.toLowerCase().includes(audit.brand.toLowerCase()) ||
            audit.brand.toLowerCase().includes(dealerName.split(' ')[0].toLowerCase())
        );
        
        if (brandMatch) {
            return `
                <div class="mt-4 p-4 bg-light rounded-3 text-center">
                    <h4 class="mb-3">Complete Analysis Available!</h4>
                    <p class="lead">Great news! We have website audit data for ${audit.brand}.</p>
                    <p>Website Health Score: <strong class="text-primary">${audit.score}/100</strong></p>
                    <p class="mb-4">Combine your lead performance data with website insights to see how site issues impact conversions.</p>
                    <div class="d-flex gap-3 justify-content-center">
                        <a href="/insights" class="btn btn-lg btn-success">
                            <i class="fas fa-link"></i> View Combined Insights
                        </a>
                        <a href="/website-audit" class="btn btn-lg btn-outline-secondary">
                            <i class="fas fa-globe"></i> Update Website Audit
                        </a>
                    </div>
                </div>
            `;
        }
    }
    
    // No matching website audit found
    return `
        <div class="mt-4 p-4 bg-light rounded-3 text-center">
            <h4 class="mb-3">Complete Your Analysis</h4>
            <p class="lead">Want to see how ${dealerName}'s website impacts their lead conversion?</p>
            <p class="mb-4">Run a website audit to unlock powerful insights about how site performance affects lead quality.</p>
            <div class="d-flex gap-3 justify-content-center">
                <a href="/website-audit" class="btn btn-lg btn-primary">
                    <i class="fas fa-globe"></i> Analyze Website
                </a>
                <button class="btn btn-lg btn-outline-secondary" onclick="checkForCombinedInsights()">
                    <i class="fas fa-link"></i> Check Combined Insights
                </button>
            </div>
        </div>
    `;
}

// Check for combined insights availability
function checkForCombinedInsights() {
    const websiteData = localStorage.getItem('lastWebsiteAudit');
    const leadData = localStorage.getItem('leadPerformanceData');
    
    if (websiteData && leadData) {
        // Both data sources available
        window.location.href = '/insights';
    } else if (!websiteData) {
        if (confirm('No website audit data found. Would you like to run a website audit first?')) {
            window.location.href = '/website-audit';
        }
    } else {
        alert('Please select a dealer to analyze their lead performance first.');
    }
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
    const dealerCount = Object.keys(uploadedDealerData).length;
    const reportType = dealerCount > 1 ? 'Network Report' : 'Single Dealer Report';
    
    let detailsHTML = '';
    if (dealerCount === 1) {
        const dealer = Object.values(uploadedDealerData)[0];
        detailsHTML = `<p class="mb-2">${dealer.name}: ${dealer.leads} leads</p>`;
    } else {
        detailsHTML = `<p class="mb-2">Network Report: ${dealerCount} dealers</p>`;
    }
    
    uploadCard.innerHTML = `
        <i class="fas fa-check-circle" style="color: #10B981;"></i>
        <h3>File Uploaded Successfully!</h3>
        <p class="mb-1"><strong>${reportType}</strong></p>
        ${detailsHTML}
        <button class="btn btn-primary mt-3" onclick="location.reload()">Upload Another File</button>
        <p class="text-muted small mt-2">For network reports with multiple dealers, upload a file with dealer names in column A</p>
    `;
}

// Enhanced LocalStorage functions with security
function saveDataToStorage(dealerData) {
    try {
        const dataPackage = {
            data: dealerData,
            uploadDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            dataChecksum: generateChecksum(dealerData),
            version: '1.0'
        };
        
        // Compress the data to save space
        const dataString = JSON.stringify(dataPackage);
        
        // Check storage size
        const sizeInMB = (new Blob([dataString]).size / 1024 / 1024).toFixed(2);
        console.log(`Storing ${sizeInMB}MB of dealer data`);
        
        localStorage.setItem('dealerDataComplete', dataString);
        localStorage.setItem('dataUploadInfo', JSON.stringify({
            uploadDate: dataPackage.uploadDate,
            expiryDate: dataPackage.expiryDate,
            dealerCount: Object.keys(dealerData).length,
            sizeInMB: sizeInMB
        }));
        
        showStorageNotification('Data saved successfully', 'success');
    } catch (e) {
        console.error('Failed to save data:', e);
        if (e.name === 'QuotaExceededError') {
            showStorageNotification('Storage full. Please clear old data.', 'error');
        }
    }
}

function checkAndLoadStoredData() {
    try {
        const storedDataString = localStorage.getItem('dealerDataComplete');
        const uploadInfo = localStorage.getItem('dataUploadInfo');
        
        if (!storedDataString || !uploadInfo) {
            console.log('No stored dealer data found');
            return;
        }
        
        const dataPackage = JSON.parse(storedDataString);
        const info = JSON.parse(uploadInfo);
        
        // Check if data has expired
        const expiryDate = new Date(dataPackage.expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (now > expiryDate) {
            console.log('Stored data has expired');
            clearStoredData();
            showStorageNotification('Previous data expired and was removed', 'warning');
            return;
        }
        
        // Verify data integrity
        if (dataPackage.dataChecksum !== generateChecksum(dataPackage.data)) {
            console.error('Data integrity check failed');
            clearStoredData();
            showStorageNotification('Stored data corrupted and was removed', 'error');
            return;
        }
        
        // Load the data
        uploadedDealerData = dataPackage.data;
        
        // Update UI to show data is loaded
        showDataLoadedUI(info, daysUntilExpiry);
        
        // Populate dropdowns and update dashboard
        populateDealerDropdowns();
        
        // Calculate and show metrics
        if (Object.keys(uploadedDealerData).length > 0) {
            recalculateMetricsFromStoredData();
        }
        
        console.log(`Loaded stored data: ${info.dealerCount} dealers, ${info.sizeInMB}MB`);
        
    } catch (e) {
        console.error('Error loading stored data:', e);
        clearStoredData();
    }
}

function clearStoredData() {
    if (confirm('Are you sure you want to clear all stored data?')) {
        localStorage.removeItem('dealerDataComplete');
        localStorage.removeItem('dataUploadInfo');
        localStorage.removeItem('leadPerformanceData');
        uploadedDealerData = {};
        showStorageNotification('All stored data cleared', 'info');
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function generateChecksum(data) {
    // Simple checksum for data integrity
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
}

function showStorageNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type];
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showDataLoadedUI(info, daysUntilExpiry) {
    const uploadCard = document.querySelector('.upload-card');
    if (!uploadCard) return;
    
    const uploadDate = new Date(info.uploadDate);
    const daysAgo = Math.floor((new Date() - uploadDate) / (1000 * 60 * 60 * 24));
    
    let statusClass = 'text-success';
    let statusIcon = 'fa-check-circle';
    
    if (daysUntilExpiry <= 5) {
        statusClass = 'text-danger';
        statusIcon = 'fa-exclamation-circle';
    } else if (daysUntilExpiry <= 10) {
        statusClass = 'text-warning';
        statusIcon = 'fa-exclamation-triangle';
    }
    
    uploadCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <i class="fas ${statusIcon} ${statusClass}" style="font-size: 2rem;"></i>
                <h3 class="mt-2">Data Loaded from Storage</h3>
                <p class="mb-1"><strong>${info.dealerCount} dealers</strong> (${info.sizeInMB}MB)</p>
                <p class="mb-1">Uploaded: ${uploadDate.toLocaleDateString()} (${daysAgo} days ago)</p>
                <p class="${statusClass}">Expires in ${daysUntilExpiry} days</p>
            </div>
            <div class="d-flex flex-column gap-2">
                <button class="btn btn-primary" onclick="uploadFile()" title="Replace current data with new file">
                    <i class="fas fa-sync-alt"></i> Replace Data
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="clearStoredData()" title="Remove all stored data">
                    <i class="fas fa-trash"></i> Clear All Data
                </button>
            </div>
        </div>
        <div class="mt-3 p-3 bg-light rounded">
            <small class="text-muted">
                <i class="fas fa-shield-alt"></i> Data stored locally on this device only
            </small>
        </div>
        <input type="file" id="fileInput" accept=".csv,.xlsx,.xlsm,.xls" onchange="handleFileSelect(event)" style="display: none;">
    `;
    
    // Re-setup drag and drop on the new upload card
    setupDragAndDrop();
}

function recalculateMetricsFromStoredData() {
    // Recalculate network totals
    let totalNetworkLeads = 0;
    let totalNetworkSales = 0;
    let totalResponded = 0;
    let total15MinResponses = 0;
    
    let responseDistribution = {
        time15min: 0,
        time30min: 0,
        time60min: 0,
        time60plus: 0,
        time24hr: 0,
        time24plus: 0,
        noResponse: 0,
        responded: 0,
        total: 0
    };
    
    Object.values(uploadedDealerData).forEach(dealer => {
        totalNetworkLeads += dealer.leads || 0;
        totalNetworkSales += dealer.sales || 0;
        totalResponded += dealer.responded || 0;
        total15MinResponses += dealer.responseTime15min || 0;
        
        responseDistribution.time15min += dealer.responseTime15min || 0;
        responseDistribution.time30min += dealer.responseTime30min || 0;
        responseDistribution.time60min += dealer.responseTime60min || 0;
        responseDistribution.time60plus += dealer.responseTime60plus || 0;
        responseDistribution.time24hr += dealer.responseTime24hr || 0;
        responseDistribution.time24plus += dealer.responseTime24plus || 0;
        responseDistribution.noResponse += dealer.noResponse || 0;
        responseDistribution.responded += dealer.responded || 0;
    });
    
    responseDistribution.total = totalNetworkLeads;
    
    const avgConversionRate = totalNetworkLeads > 0 ? 
        (totalNetworkSales / totalNetworkLeads * 100).toFixed(2) : 0;
    
    const responseRate = totalNetworkLeads > 0 ? 
        (totalResponded / totalNetworkLeads * 100).toFixed(1) : 0;
    const noResponseRate = totalNetworkLeads > 0 ? 
        ((totalNetworkLeads - totalResponded) / totalNetworkLeads * 100).toFixed(1) : 0;
    const quickResponseRate = totalNetworkLeads > 0 ? 
        (total15MinResponses / totalNetworkLeads * 100).toFixed(1) : 0;
    
    // Update dashboard
    updateDashboard({
        totalLeads: totalNetworkLeads,
        conversionRate: avgConversionRate,
        responseRate: responseRate,
        noResponseRate: noResponseRate,
        quickResponseRate: quickResponseRate,
        dealerCount: Object.keys(uploadedDealerData).length,
        dealerName: 'Network Report (Stored)',
        responseDistribution: responseDistribution
    });
    
    // Update charts
    updateCharts();
}

function setupSecurityFeatures() {
    // Auto-clear on inactivity - DISABLED for now to prevent screen flashing
    // Uncomment to re-enable 30-minute timeout
    /*
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (confirm('Your session has been inactive for 30 minutes. Clear stored data for security?')) {
                clearStoredData();
            }
        }, INACTIVITY_TIMEOUT);
    }
    
    // Track user activity
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('scroll', resetInactivityTimer);
    
    resetInactivityTimer();
    */
}

// Legacy function for backward compatibility
function loadStoredData() {
    checkAndLoadStoredData();
}

// Process multi-worksheet Excel file (network report)
function processMultiWorksheetFile(workbook, filename) {
    console.log(`Processing ${workbook.SheetNames.length} worksheets as network report`);
    
    const networkData = {};
    let totalNetworkLeads = 0;
    let totalNetworkSales = 0;
    
    // Process each worksheet
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`Processing worksheet ${index + 1}: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Get dealer name from cell B2
        let dealerName = '';
        if (data.length > 1 && data[1] && data[1][1]) {
            dealerName = data[1][1].trim();
            console.log(`PA Code ${sheetName} = ${dealerName}`);
        } else {
            dealerName = `Dealer ${sheetName}`; // Fallback
        }
        
        // Process this dealer's data
        let dealerData = {
            name: dealerName,
            paCode: sheetName,
            leads: 0,
            sales: 0,
            responded: 0,
            noResponse: 0,
            responseTime15min: 0,
            responseTime30min: 0,
            responseTime60min: 0,
            responseTime60plus: 0,
            responseTime24hr: 0,
            responseTime24plus: 0,
            leadSources: {}
        };
        
        // Process leads (same logic as single dealer)
        for (let i = 11; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[0] || !row[1]) continue;
            
            const leadType = row[2]; // Column C
            if (!leadType || leadType !== 'Form') continue;
            
            const leadSource = row[1]; // Column B
            if (!leadSource || leadSource.toLowerCase().includes('total')) continue;
            
            // Initialize lead source if needed
            if (!dealerData.leadSources[leadSource]) {
                dealerData.leadSources[leadSource] = {
                    leads: 0,
                    sales: 0,
                    appointments: 0,
                    shows: 0,
                    conversionRate: 0
                };
            }
            
            // Count the lead
            dealerData.leadSources[leadSource].leads += 1;
            dealerData.leads += 1;
            
            // Get relevant columns
            const actionableDateTime = row[5]; // Column F - Date/Time Actionable
            const responseDate = row[6]; // Column G - Response Date (actual response time)
            const elapsedTime = row[7]; // Column H - Total Elapsed Time (e.g., "0h 5m", "51h 56m")
            
            // Debug first row of first dealer
            if (index === 0 && i === 11) {
                console.log(`First data row:`);
                console.log(`  Actionable (Col F): "${actionableDateTime}"`);
                console.log(`  Response Date (Col G): "${responseDate}"`);
                console.log(`  Elapsed Time (Col H): "${elapsedTime}"`);
                console.log('Full row data:', row);
            }
            
            // Check if there was a response (Column G not "N/A" or empty)
            const trimmedResponseDate = responseDate ? responseDate.toString().trim() : '';
            if (trimmedResponseDate === 'N/A' || trimmedResponseDate === 'n/a' || trimmedResponseDate === 'N/a' || 
                trimmedResponseDate === '' || !trimmedResponseDate) {
                // No response
                dealerData.noResponse += 1;
                if (index === 0 && i === 11) {
                    console.log('  -> Counted as NO RESPONSE');
                }
            } else {
                // There was a response - use Column H for elapsed time
                dealerData.responded += 1;
                if (index === 0 && i === 11) {
                    console.log('  -> Counted as RESPONDED');
                }
                
                // Parse elapsed time from Column H
                if (elapsedTime && elapsedTime !== 'N/A' && elapsedTime !== '') {
                    // Try different regex patterns for time format
                    let totalMinutes = null;
                    
                    // Pattern 1: "0h 30m" format
                    let match = elapsedTime.match(/(\d+)h (\d+)m/);
                    if (match) {
                        totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                    } else {
                        // Pattern 2: "0h30m" (no space)
                        match = elapsedTime.match(/(\d+)h(\d+)m/);
                        if (match) {
                            totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                        } else {
                            // Pattern 3: Just minutes "30m"
                            match = elapsedTime.match(/(\d+)m/);
                            if (match) {
                                totalMinutes = parseInt(match[1]);
                            } else {
                                // Pattern 4: Just hours "2h"
                                match = elapsedTime.match(/(\d+)h/);
                                if (match) {
                                    totalMinutes = parseInt(match[1]) * 60;
                                }
                            }
                        }
                    }
                    
                    if (totalMinutes !== null && index === 0 && i === 11) {
                        console.log(`  Elapsed time parsed: "${elapsedTime}" = ${totalMinutes} minutes`);
                    }
                    
                    if (totalMinutes !== null) {
                        // Categorize based on minutes
                        if (totalMinutes <= 15) {
                            dealerData.responseTime15min += 1;
                        } else if (totalMinutes <= 30) {
                            dealerData.responseTime30min += 1;
                        } else if (totalMinutes <= 60) {
                            dealerData.responseTime60min += 1;
                        } else if (totalMinutes <= 240) { // 4 hours
                            dealerData.responseTime60plus += 1;
                        } else if (totalMinutes <= 1440) { // 24 hours
                            dealerData.responseTime24hr += 1;
                        } else {
                            dealerData.responseTime24plus += 1;
                        }
                    }
                }
            }
            
            // Check for sale
            const saleDate = row[9]; // Column J
            if (saleDate && saleDate !== '' && saleDate !== 'N/A') {
                dealerData.leadSources[leadSource].sales += 1;
                dealerData.sales += 1;
            }
        }
        
        // Calculate conversion rates
        Object.keys(dealerData.leadSources).forEach(source => {
            const sourceData = dealerData.leadSources[source];
            sourceData.conversionRate = sourceData.leads > 0 ? 
                (sourceData.sales / sourceData.leads * 100).toFixed(2) : '0';
        });
        
        dealerData.conversionRate = dealerData.leads > 0 ? 
            (dealerData.sales / dealerData.leads * 100).toFixed(2) : '0';
        
        // Debug log for first dealer
        if (index === 0) {
            console.log(`First dealer (${dealerName}) stats:`, {
                leads: dealerData.leads,
                responded: dealerData.responded,
                noResponse: dealerData.noResponse,
                responseRate: ((dealerData.responded / dealerData.leads) * 100).toFixed(1) + '%'
            });
        }
        
        // Add to network data
        if (dealerData.leads > 0) {
            networkData[dealerName] = dealerData;
            totalNetworkLeads += dealerData.leads;
            totalNetworkSales += dealerData.sales;
        }
    });
    
    console.log(`Processed ${Object.keys(networkData).length} dealers with data`);
    
    // Debug: Log response data for first dealer
    const firstDealer = Object.values(networkData)[0];
    if (firstDealer) {
        console.log('Sample dealer response data:', JSON.stringify({
            name: firstDealer.name,
            leads: firstDealer.leads,
            responded: firstDealer.responded,
            noResponse: firstDealer.noResponse,
            time15min: firstDealer.responseTime15min,
            time30min: firstDealer.responseTime30min,
            time60min: firstDealer.responseTime60min,
            time60plus: firstDealer.responseTime60plus,
            time24hr: firstDealer.responseTime24hr,
            time24plus: firstDealer.responseTime24plus
        }, null, 2));
    }
    
    // Update global data
    uploadedDealerData = networkData;
    
    // Populate dealer dropdowns
    populateDealerDropdowns();
    
    // Calculate network metrics
    const avgConversionRate = totalNetworkLeads > 0 ? 
        (totalNetworkSales / totalNetworkLeads * 100).toFixed(2) : 0;
    
    let totalResponded = 0;
    let total15MinResponses = 0;
    let responseDistribution = {
        time15min: 0,
        time30min: 0,
        time60min: 0,
        time60plus: 0,
        time24hr: 0,
        time24plus: 0,
        noResponse: 0,
        responded: 0,
        total: totalNetworkLeads
    };
    
    Object.values(networkData).forEach(dealer => {
        totalResponded += dealer.responded || 0;
        total15MinResponses += dealer.responseTime15min || 0;
        responseDistribution.time15min += dealer.responseTime15min || 0;
        responseDistribution.time30min += dealer.responseTime30min || 0;
        responseDistribution.time60min += dealer.responseTime60min || 0;
        responseDistribution.time60plus += dealer.responseTime60plus || 0;
        responseDistribution.time24hr += dealer.responseTime24hr || 0;
        responseDistribution.time24plus += dealer.responseTime24plus || 0;
        responseDistribution.noResponse += dealer.noResponse || 0;
        responseDistribution.responded += dealer.responded || 0;
    });
    
    const responseRate = totalNetworkLeads > 0 ? 
        (totalResponded / totalNetworkLeads * 100).toFixed(1) : 0;
    const noResponseRate = totalNetworkLeads > 0 ? 
        ((totalNetworkLeads - totalResponded) / totalNetworkLeads * 100).toFixed(1) : 0;
    const quickResponseRate = totalNetworkLeads > 0 ? 
        (total15MinResponses / totalNetworkLeads * 100).toFixed(1) : 0;
    
    console.log('Final response distribution:', responseDistribution);
    console.log('Total no responses:', responseDistribution.noResponse);
    console.log('Total responded:', totalResponded);
    console.log('Total network leads:', totalNetworkLeads);
    
    // Update dashboard
    updateDashboard({
        totalLeads: totalNetworkLeads,
        conversionRate: avgConversionRate,
        responseRate: responseRate,
        noResponseRate: noResponseRate,
        quickResponseRate: quickResponseRate,
        dealerCount: Object.keys(networkData).length,
        dealerName: 'Network Report',
        responseDistribution: responseDistribution
    });
    
    // Update dealer dropdown
    updateDealerDropdown();
    
    // Update charts
    updateCharts();
    
    // Show success
    showUploadSuccess();
    
    // Save complete data to enhanced storage
    saveDataToStorage(networkData);
    
    // Store enhanced data for combined insights
    localStorage.setItem('leadPerformanceDataEnhanced', JSON.stringify({
        uploadDate: new Date().toISOString(),
        dealerCount: Object.keys(networkData).length,
        summary: {
            totalLeads: totalNetworkLeads,
            avgConversion: avgConversionRate,
            responseRate: responseRate,
            quickResponseRate: quickResponseRate
        },
        dealers: networkData // Include full dealer data
    }));
    
    // Store summary data (legacy compatibility)
    localStorage.setItem('leadPerformanceData', JSON.stringify({
        uploadDate: new Date().toISOString(),
        dealerCount: Object.keys(networkData).length,
        summary: {
            totalLeads: totalNetworkLeads,
            avgConversion: avgConversionRate
        }
    }));
}

// ROI Calculator functions
function updateCurrentSales() {
    const leads = parseFloat(document.getElementById('roiMonthlyLeads').value) || 0;
    const currentRate = parseFloat(document.getElementById('roiCurrentConversion').value) || 0;
    const currentSales = leads * (currentRate / 100);
    document.getElementById('currentMonthlySales').textContent = currentSales.toFixed(1);
    
    // Update custom target field to match current conversion rate
    const customTargetField = document.getElementById('roiCustomTarget');
    if (customTargetField && currentRate > 0) {
        customTargetField.placeholder = `e.g. ${currentRate}`;
        // If field is empty, set the value to current rate
        if (!customTargetField.value) {
            customTargetField.value = currentRate;
        }
    }
}

// Add event listeners for real-time updates
document.addEventListener('DOMContentLoaded', function() {
    const roiLeadsInput = document.getElementById('roiMonthlyLeads');
    const roiConversionInput = document.getElementById('roiCurrentConversion');
    
    if (roiLeadsInput) {
        roiLeadsInput.addEventListener('input', updateCurrentSales);
    }
    if (roiConversionInput) {
        roiConversionInput.addEventListener('input', updateCurrentSales);
    }
});

// Main ROI calculation function
function calculateROI() {
    updateCurrentSales();
}

function calculateROIImprovement(percentIncrease) {
    const currentRate = parseFloat(document.getElementById('roiCurrentConversion').value) || 0;
    const newRate = currentRate + percentIncrease;
    calculateROIToTarget(newRate);
}

function calculateROIToTarget(targetRate) {
    const leads = parseFloat(document.getElementById('roiMonthlyLeads').value) || 0;
    const currentRate = parseFloat(document.getElementById('roiCurrentConversion').value) || 0;
    const revenuePerSale = parseFloat(document.getElementById('roiRevenuePerSale').value) || 4250;
    
    if (!leads || !currentRate) {
        alert('Please enter your current monthly leads and conversion rate first.');
        return;
    }
    
    // Validate target rate
    if (targetRate < currentRate) {
        alert('Target rate must be higher than current rate.');
        return;
    }
    
    // Calculate current and target sales
    const currentMonthlySales = leads * (currentRate / 100);
    const targetMonthlySales = leads * (targetRate / 100);
    const additionalMonthlySales = targetMonthlySales - currentMonthlySales;
    const additionalAnnualSales = additionalMonthlySales * 12;
    const additionalAnnualRevenue = additionalAnnualSales * revenuePerSale;
    
    // Calculate percentage increase
    const percentageIncrease = currentMonthlySales > 0 ? 
        ((additionalMonthlySales / currentMonthlySales) * 100).toFixed(1) : 0;
    
    // Update results with better formatting
    document.getElementById('roiNewRate').textContent = targetRate.toFixed(2) + '%';
    document.getElementById('roiImprovement').textContent = '+' + (targetRate - currentRate).toFixed(2) + ' points';
    document.getElementById('roiMonthlyIncrease').textContent = '+' + additionalMonthlySales.toFixed(1) + ' sales';
    document.getElementById('roiAnnualIncrease').textContent = '+' + additionalAnnualSales.toFixed(0) + ' sales';
    document.getElementById('roiAnnualRevenue').textContent = '$' + additionalAnnualRevenue.toLocaleString();
    
    // Update results panel class based on improvement level
    const resultsPanel = document.getElementById('roiResultsPanel');
    const alertDiv = resultsPanel.querySelector('.alert');
    
    // Remove existing classes
    alertDiv.classList.remove('alert-success', 'alert-warning', 'alert-info');
    
    // Add appropriate class based on improvement
    if (targetRate - currentRate >= 5) {
        alertDiv.classList.add('alert-success');
    } else if (targetRate - currentRate >= 2) {
        alertDiv.classList.add('alert-info');
    } else {
        alertDiv.classList.add('alert-warning');
    }
    
    // Show results panel with animation
    resultsPanel.style.display = 'block';
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function calculateROICustom() {
    const targetRate = parseFloat(document.getElementById('roiCustomTarget').value) || 0;
    if (targetRate) {
        calculateROIToTarget(targetRate);
    } else {
        alert('Please enter a target conversion rate.');
    }
}

// Auto-populate ROI calculator when a dealer is selected
function populateROIFromDealer() {
    const dealerName = document.getElementById('roiDealerSelect').value;
    if (!dealerName || !uploadedDealerData[dealerName]) {
        // Clear fields if no dealer selected
        document.getElementById('roiMonthlyLeads').value = '';
        document.getElementById('roiCurrentConversion').value = '';
        document.getElementById('currentMonthlySales').textContent = '-';
        document.getElementById('roiResultsPanel').style.display = 'none';
        return;
    }
    
    const dealer = uploadedDealerData[dealerName];
    
    // Calculate monthly average from 6 months of data
    // Extrapolate to annual (multiply by 2) then divide by 12 for monthly
    const monthlyAverage = Math.round((dealer.leads * 2) / 12);
    
    document.getElementById('roiMonthlyLeads').value = monthlyAverage;
    document.getElementById('roiCurrentConversion').value = dealer.conversionRate || 0;
    
    // Update custom target field with current conversion rate
    const customTargetField = document.getElementById('roiCustomTarget');
    if (customTargetField) {
        customTargetField.value = dealer.conversionRate || 0;
    }
    
    // Update current sales display
    updateCurrentSales();
    
    // Clear previous results
    document.getElementById('roiResultsPanel').style.display = 'none';
}

// Populate dealer select dropdown
function populateDealerSelect() {
    const select = document.getElementById('dealerSelect');
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '<option value="">Choose a dealer...</option>';
    
    // Add dealer options
    Object.keys(uploadedDealerData).sort().forEach(dealerName => {
        const option = document.createElement('option');
        option.value = dealerName;
        option.textContent = dealerName;
        select.appendChild(option);
    });
}

// Populate dealer dropdowns including ROI calculator
function populateDealerDropdowns() {
    // Populate main dealer select
    populateDealerSelect();
    
    // Also populate ROI dealer select if it exists
    const roiSelect = document.getElementById('roiDealerSelect');
    if (roiSelect) {
        // Clear existing options except the first one
        while (roiSelect.options.length > 1) {
            roiSelect.remove(1);
        }
        
        // Add dealer options
        Object.keys(uploadedDealerData).sort().forEach(dealerName => {
            const option = document.createElement('option');
            option.value = dealerName;
            option.textContent = dealerName;
            roiSelect.appendChild(option);
        });
    }
}

// Report generation functions
function generateNetworkReport() {
    if (!uploadedDealerData || Object.keys(uploadedDealerData).length === 0) {
        alert('Please upload dealer data first.');
        return;
    }
    
    // Calculate network totals
    let totalLeads = 0;
    let totalSales = 0;
    let totalResponded = 0;
    let dealersByTier = { elite: [], strong: [], average: [], challenge: [] };
    
    Object.values(uploadedDealerData).forEach(dealer => {
        totalLeads += dealer.leads || 0;
        totalSales += dealer.sales || 0;
        totalResponded += dealer.responded || 0;
        
        // Categorize dealers
        const rate = dealer.conversionRate || 0;
        if (rate >= 20) dealersByTier.elite.push(dealer);
        else if (rate >= 16) dealersByTier.strong.push(dealer);
        else if (rate >= 12) dealersByTier.average.push(dealer);
        else dealersByTier.challenge.push(dealer);
    });
    
    const avgConversionRate = totalLeads > 0 ? (totalSales / totalLeads * 100).toFixed(2) : 0;
    const responseRate = totalLeads > 0 ? (totalResponded / totalLeads * 100).toFixed(1) : 0;
    
    // Create report HTML
    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Network Summary Report - Auto Audit Pro</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 40px; }
                h1 { color: #6B46C1; border-bottom: 3px solid #6B46C1; padding-bottom: 10px; }
                h2 { color: #9333EA; margin-top: 30px; }
                h3 { color: #6B46C1; }
                .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
                .metric-value { font-size: 2.5em; font-weight: bold; color: #6B46C1; }
                .metric-label { color: #666; font-size: 0.9em; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .tier-elite { color: #10B981; }
                .tier-strong { color: #3B82F6; }
                .tier-average { color: #F59E0B; }
                .tier-challenge { color: #EF4444; }
                .footer { margin-top: 50px; text-align: center; color: #666; font-size: 0.9em; }
                .print-button { 
                    background: #6B46C1; 
                    color: white; 
                    padding: 12px 30px; 
                    border-radius: 8px; 
                    border: none; 
                    font-weight: 600; 
                    cursor: pointer; 
                    font-size: 16px;
                    transition: all 0.3s;
                }
                .print-button:hover {
                    background: #553C9A;
                    transform: translateY(-2px);
                }
                @media print {
                    body { padding: 20px; }
                    .no-print, .print-button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>Network Summary Report</h1>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Data Period:</strong> Q1-Q2 2025</p>
            <p><strong>Total Dealers:</strong> ${Object.keys(uploadedDealerData).length}</p>
            
            <h2>Network Overview</h2>
            <div class="metric-grid">
                <div class="metric">
                    <div class="metric-value">${totalLeads.toLocaleString()}</div>
                    <div class="metric-label">Total Form Leads (6 months)</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${avgConversionRate}%</div>
                    <div class="metric-label">Network Conversion Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${responseRate}%</div>
                    <div class="metric-label">Response Rate</div>
                </div>
            </div>
            
            <h2>Performance Tiers</h2>
            <table>
                <tr>
                    <th>Tier</th>
                    <th>Criteria</th>
                    <th>Dealer Count</th>
                    <th>% of Network</th>
                </tr>
                <tr class="tier-elite">
                    <td><strong>Elite</strong></td>
                    <td>20%+ Conversion</td>
                    <td>${dealersByTier.elite.length}</td>
                    <td>${(dealersByTier.elite.length / Object.keys(uploadedDealerData).length * 100).toFixed(1)}%</td>
                </tr>
                <tr class="tier-strong">
                    <td><strong>Strong</strong></td>
                    <td>16-20% Conversion</td>
                    <td>${dealersByTier.strong.length}</td>
                    <td>${(dealersByTier.strong.length / Object.keys(uploadedDealerData).length * 100).toFixed(1)}%</td>
                </tr>
                <tr class="tier-average">
                    <td><strong>Average</strong></td>
                    <td>12-16% Conversion</td>
                    <td>${dealersByTier.average.length}</td>
                    <td>${(dealersByTier.average.length / Object.keys(uploadedDealerData).length * 100).toFixed(1)}%</td>
                </tr>
                <tr class="tier-challenge">
                    <td><strong>Challenge</strong></td>
                    <td><12% Conversion</td>
                    <td>${dealersByTier.challenge.length}</td>
                    <td>${(dealersByTier.challenge.length / Object.keys(uploadedDealerData).length * 100).toFixed(1)}%</td>
                </tr>
            </table>
            
            <h2>Top 10 Dealers by Lead Volume</h2>
            <table>
                <tr>
                    <th>Rank</th>
                    <th>Dealer</th>
                    <th>Total Leads</th>
                    <th>Conversion Rate</th>
                    <th>Response Rate</th>
                </tr>
                ${Object.values(uploadedDealerData)
                    .sort((a, b) => b.leads - a.leads)
                    .slice(0, 10)
                    .map((dealer, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${dealer.name}</td>
                            <td>${dealer.leads.toLocaleString()}</td>
                            <td>${dealer.conversionRate || 0}%</td>
                            <td>${dealer.responded && dealer.leads ? (dealer.responded / dealer.leads * 100).toFixed(1) : 0}%</td>
                        </tr>
                    `).join('')}
            </table>
            
            <div style="text-align: center; margin: 40px 0;">
                <button onclick="window.print()" class="print-button">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
            
            <div class="footer">
                <p>© 2025 JL Robinson. All Rights Reserved.</p>
                <p>Auto Audit Pro™ - Complete Dealership Performance Suite</p>
            </div>
        </body>
        </html>
    `;
    
    // Open report in new window
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    
    // User can click print button when ready
    // Removed auto-print for better UX
}

function generateDealerReport() {
    if (!uploadedDealerData || Object.keys(uploadedDealerData).length === 0) {
        alert('Please upload dealer data first.');
        return;
    }
    
    // Get currently selected dealer from Lead Analysis tab
    const dealerSelectElement = document.getElementById('dealerSelect');
    const selectedDealerName = dealerSelectElement ? dealerSelectElement.value : '';
    
    if (!selectedDealerName) {
        alert('Please select a dealer from the Lead Analysis tab first.');
        // Switch to Lead Analysis tab
        showSection('analysis');
        return;
    }
    
    const selectedDealer = uploadedDealerData[selectedDealerName];
    
    if (!selectedDealer) {
        alert('Selected dealer data not found. Please select a different dealer.');
        return;
    }
    
    // Calculate monthly average
    const monthlyAverage = Math.round((selectedDealer.leads * 2) / 12);
    const responseRate = selectedDealer.leads > 0 ? 
        (selectedDealer.responded / selectedDealer.leads * 100).toFixed(1) : 0;
    
    // Determine performance tier
    let tier = 'Challenge';
    let tierColor = '#EF4444';
    if (selectedDealer.conversionRate >= 20) {
        tier = 'Elite';
        tierColor = '#10B981';
    } else if (selectedDealer.conversionRate >= 16) {
        tier = 'Strong';
        tierColor = '#3B82F6';
    } else if (selectedDealer.conversionRate >= 12) {
        tier = 'Average';
        tierColor = '#F59E0B';
    }
    
    // Create report HTML
    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${selectedDealer.name} - Performance Report</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
                h1 { color: #6B46C1; border-bottom: 3px solid #6B46C1; padding-bottom: 10px; }
                h2 { color: #9333EA; margin-top: 30px; }
                .tier-badge { 
                    display: inline-block; 
                    background: ${tierColor}; 
                    color: white; 
                    padding: 5px 15px; 
                    border-radius: 20px; 
                    font-weight: bold;
                    margin-left: 10px;
                }
                .metric-row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin: 15px 0; 
                    padding: 15px; 
                    background: #f8f9fa; 
                    border-radius: 8px;
                }
                .metric-label { font-weight: bold; color: #666; }
                .metric-value { font-size: 1.2em; color: #6B46C1; }
                .response-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 15px; 
                    margin: 20px 0; 
                }
                .response-item { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    text-align: center;
                }
                .response-time { font-size: 1.5em; font-weight: bold; }
                .recommendation { 
                    background: #FEF3C7; 
                    border-left: 4px solid #F59E0B; 
                    padding: 15px; 
                    margin: 20px 0;
                }
                .footer { margin-top: 50px; text-align: center; color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>${selectedDealer.name} <span class="tier-badge">${tier} Performer</span></h1>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Data Period:</strong> Q1-Q2 2025</p>
            
            <h2>Performance Overview</h2>
            <div class="metric-row">
                <span class="metric-label">Total Form Leads (6 months):</span>
                <span class="metric-value">${selectedDealer.leads.toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Monthly Lead Average:</span>
                <span class="metric-value">${monthlyAverage}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Conversion Rate:</span>
                <span class="metric-value">${selectedDealer.conversionRate || 0}%</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Response Rate:</span>
                <span class="metric-value">${responseRate}%</span>
            </div>
            
            <h2>Response Time Breakdown</h2>
            <div class="response-grid">
                <div class="response-item" style="background: #D1FAE5;">
                    <div class="response-time">${selectedDealer.responseTime15min || 0}</div>
                    <div>0-15 Minutes</div>
                    <div style="color: #666; font-size: 0.9em;">${selectedDealer.leads > 0 ? ((selectedDealer.responseTime15min || 0) / selectedDealer.leads * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="response-item">
                    <div class="response-time">${selectedDealer.responseTime30min || 0}</div>
                    <div>16-30 Minutes</div>
                    <div style="color: #666; font-size: 0.9em;">${selectedDealer.leads > 0 ? ((selectedDealer.responseTime30min || 0) / selectedDealer.leads * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="response-item">
                    <div class="response-time">${selectedDealer.responseTime60min || 0}</div>
                    <div>31-60 Minutes</div>
                    <div style="color: #666; font-size: 0.9em;">${selectedDealer.leads > 0 ? ((selectedDealer.responseTime60min || 0) / selectedDealer.leads * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="response-item">
                    <div class="response-time">${selectedDealer.responseTime60plus || 0}</div>
                    <div>60+ Minutes</div>
                    <div style="color: #666; font-size: 0.9em;">${selectedDealer.leads > 0 ? ((selectedDealer.responseTime60plus || 0) / selectedDealer.leads * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="response-item">
                    <div class="response-time">${selectedDealer.responseTime24hr || 0}</div>
                    <div>1-24 Hours</div>
                    <div style="color: #666; font-size: 0.9em;">${selectedDealer.leads > 0 ? ((selectedDealer.responseTime24hr || 0) / selectedDealer.leads * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="response-item">
                    <div class="response-time">${selectedDealer.responseTime24plus || 0}</div>
                    <div>24+ Hours</div>
                    <div style="color: #666; font-size: 0.9em;">${selectedDealer.leads > 0 ? ((selectedDealer.responseTime24plus || 0) / selectedDealer.leads * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="response-item" style="background: #FEE2E2;">
                    <div class="response-time">${selectedDealer.noResponse || 0}</div>
                    <div>No Response</div>
                    <div style="color: #666; font-size: 0.9em;">${selectedDealer.leads > 0 ? ((selectedDealer.noResponse || 0) / selectedDealer.leads * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="response-item" style="background: #D1FAE5;">
                    <div class="response-time">${selectedDealer.responded || 0}</div>
                    <div>Total Responded</div>
                    <div style="color: #666; font-size: 0.9em;">${responseRate}%</div>
                </div>
            </div>
            
            <h2>Recommendations</h2>
            ${tier === 'Elite' ? `
                <div class="recommendation" style="background: #D1FAE5; border-color: #10B981;">
                    <strong>Excellent Performance!</strong> You're in the Elite tier. Focus on maintaining these high standards and sharing best practices with other dealers.
                </div>
            ` : `
                <div class="recommendation">
                    <strong>Improvement Opportunities:</strong>
                    <ul style="margin: 10px 0;">
                        ${selectedDealer.conversionRate < 16 ? '<li>Focus on improving conversion rate to reach Strong/Elite status</li>' : ''}
                        ${(selectedDealer.responseTime15min || 0) / selectedDealer.leads * 100 < 30 ? '<li>Increase 15-minute response rate - target 40%+ for optimal lead conversion</li>' : ''}
                        ${(selectedDealer.noResponse || 0) / selectedDealer.leads * 100 > 30 ? '<li>Reduce no-response rate - every lead deserves follow-up</li>' : ''}
                        <li>Consider implementing automated lead response systems</li>
                    </ul>
                </div>
            `}
            
            <div style="text-align: center; margin: 40px 0;">
                <button onclick="window.print()" class="print-button">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
            
            <div class="footer">
                <p>© 2025 JL Robinson. All Rights Reserved.</p>
                <p>Auto Audit Pro™ - Complete Dealership Performance Suite</p>
            </div>
        </body>
        </html>
    `;
    
    // Open report in new window
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    
    // User can click print button when ready
    // Removed auto-print for better UX
}

function generateResponseReport() {
    if (!uploadedDealerData || Object.keys(uploadedDealerData).length === 0) {
        alert('Please upload dealer data first.');
        return;
    }
    
    // Calculate response time metrics across network
    let totalLeads = 0;
    let responseMetrics = {
        time15min: 0,
        time30min: 0,
        time60min: 0,
        time60plus: 0,
        time24hr: 0,
        time24plus: 0,
        noResponse: 0,
        responded: 0
    };
    
    // Top performers by response time
    let dealerResponseRates = [];
    
    Object.values(uploadedDealerData).forEach(dealer => {
        totalLeads += dealer.leads || 0;
        responseMetrics.time15min += dealer.responseTime15min || 0;
        responseMetrics.time30min += dealer.responseTime30min || 0;
        responseMetrics.time60min += dealer.responseTime60min || 0;
        responseMetrics.time60plus += dealer.responseTime60plus || 0;
        responseMetrics.time24hr += dealer.responseTime24hr || 0;
        responseMetrics.time24plus += dealer.responseTime24plus || 0;
        responseMetrics.noResponse += dealer.noResponse || 0;
        responseMetrics.responded += dealer.responded || 0;
        
        // Calculate 15-min response rate for each dealer
        if (dealer.leads > 0) {
            dealerResponseRates.push({
                name: dealer.name,
                leads: dealer.leads,
                quickResponseRate: ((dealer.responseTime15min || 0) / dealer.leads * 100).toFixed(1),
                responseRate: ((dealer.responded || 0) / dealer.leads * 100).toFixed(1),
                noResponseRate: ((dealer.noResponse || 0) / dealer.leads * 100).toFixed(1)
            });
        }
    });
    
    // Sort by 15-min response rate
    dealerResponseRates.sort((a, b) => parseFloat(b.quickResponseRate) - parseFloat(a.quickResponseRate));
    
    // Create report HTML
    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Response Time Analysis Report - Auto Audit Pro</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 40px; }
                h1 { color: #6B46C1; border-bottom: 3px solid #6B46C1; padding-bottom: 10px; }
                h2 { color: #9333EA; margin-top: 30px; }
                .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
                .metric-card { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    text-align: center;
                    border: 2px solid transparent;
                }
                .metric-card.good { border-color: #10B981; background: #D1FAE5; }
                .metric-card.warning { border-color: #F59E0B; background: #FEF3C7; }
                .metric-card.critical { border-color: #EF4444; background: #FEE2E2; }
                .metric-value { font-size: 2em; font-weight: bold; color: #6B46C1; }
                .metric-label { color: #666; font-size: 0.9em; margin-top: 5px; }
                .chart-container { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 20px 0;
                }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; color: #666; font-size: 0.9em; }
                .insight { 
                    background: #E0E7FF; 
                    border-left: 4px solid #6B46C1; 
                    padding: 15px; 
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <h1>Response Time Analysis Report</h1>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Data Period:</strong> Q1-Q2 2025</p>
            <p><strong>Total Network Leads:</strong> ${totalLeads.toLocaleString()}</p>
            
            <h2>Network Response Time Distribution</h2>
            <div class="metric-grid">
                <div class="metric-card good">
                    <div class="metric-value">${responseMetrics.time15min.toLocaleString()}</div>
                    <div class="metric-label">0-15 Minutes</div>
                    <div class="metric-label">${(responseMetrics.time15min / totalLeads * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card good">
                    <div class="metric-value">${responseMetrics.time30min.toLocaleString()}</div>
                    <div class="metric-label">16-30 Minutes</div>
                    <div class="metric-label">${(responseMetrics.time30min / totalLeads * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card warning">
                    <div class="metric-value">${responseMetrics.time60min.toLocaleString()}</div>
                    <div class="metric-label">31-60 Minutes</div>
                    <div class="metric-label">${(responseMetrics.time60min / totalLeads * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card warning">
                    <div class="metric-value">${responseMetrics.time60plus.toLocaleString()}</div>
                    <div class="metric-label">60+ Minutes</div>
                    <div class="metric-label">${(responseMetrics.time60plus / totalLeads * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card critical">
                    <div class="metric-value">${responseMetrics.time24hr.toLocaleString()}</div>
                    <div class="metric-label">1-24 Hours</div>
                    <div class="metric-label">${(responseMetrics.time24hr / totalLeads * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card critical">
                    <div class="metric-value">${responseMetrics.time24plus.toLocaleString()}</div>
                    <div class="metric-label">24+ Hours</div>
                    <div class="metric-label">${(responseMetrics.time24plus / totalLeads * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card critical">
                    <div class="metric-value">${responseMetrics.noResponse.toLocaleString()}</div>
                    <div class="metric-label">No Response</div>
                    <div class="metric-label">${(responseMetrics.noResponse / totalLeads * 100).toFixed(1)}%</div>
                </div>
            </div>
            
            <div class="insight">
                <strong>Key Insight:</strong> ${(responseMetrics.time15min / totalLeads * 100).toFixed(1)}% of leads receive a response within 15 minutes. 
                Industry best practice targets 40%+ for optimal conversion. 
                ${responseMetrics.noResponse / totalLeads * 100 > 30 ? 'High no-response rate detected - significant opportunity for improvement.' : ''}
            </div>
            
            <h2>Top 10 Dealers by 15-Minute Response Rate</h2>
            <table>
                <tr>
                    <th>Rank</th>
                    <th>Dealer</th>
                    <th>Total Leads</th>
                    <th>15-Min Response</th>
                    <th>Total Response</th>
                    <th>No Response</th>
                </tr>
                ${dealerResponseRates.slice(0, 10).map((dealer, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${dealer.name}</td>
                        <td>${dealer.leads.toLocaleString()}</td>
                        <td style="color: #10B981; font-weight: bold;">${dealer.quickResponseRate}%</td>
                        <td>${dealer.responseRate}%</td>
                        <td style="color: ${parseFloat(dealer.noResponseRate) > 30 ? '#EF4444' : '#666'};">${dealer.noResponseRate}%</td>
                    </tr>
                `).join('')}
            </table>
            
            <h2>Bottom 10 Dealers by Response Rate</h2>
            <table>
                <tr>
                    <th>Rank</th>
                    <th>Dealer</th>
                    <th>Total Leads</th>
                    <th>15-Min Response</th>
                    <th>Total Response</th>
                    <th>No Response</th>
                </tr>
                ${dealerResponseRates
                    .sort((a, b) => parseFloat(a.responseRate) - parseFloat(b.responseRate))
                    .slice(0, 10)
                    .map((dealer, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${dealer.name}</td>
                        <td>${dealer.leads.toLocaleString()}</td>
                        <td>${dealer.quickResponseRate}%</td>
                        <td style="color: #EF4444; font-weight: bold;">${dealer.responseRate}%</td>
                        <td style="color: #EF4444; font-weight: bold;">${dealer.noResponseRate}%</td>
                    </tr>
                `).join('')}
            </table>
            
            <div style="text-align: center; margin: 40px 0;">
                <button onclick="window.print()" class="print-button">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
            
            <div class="footer">
                <p>© 2025 JL Robinson. All Rights Reserved.</p>
                <p>Auto Audit Pro™ - Complete Dealership Performance Suite</p>
            </div>
        </body>
        </html>
    `;
    
    // Open report in new window
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    
    // User can click print button when ready
    // Removed auto-print for better UX
}

// Generate ROI Report
function generateROIReport() {
    // Get current values
    const dealerName = document.getElementById('roiDealerSelect').value || 'Your Dealership';
    const monthlyLeads = parseFloat(document.getElementById('roiMonthlyLeads').value) || 0;
    const currentRate = parseFloat(document.getElementById('roiCurrentConversion').value) || 0;
    const newRate = document.getElementById('roiNewRate').textContent;
    const improvement = document.getElementById('roiImprovement').textContent;
    const monthlyIncrease = document.getElementById('roiMonthlyIncrease').textContent;
    const annualIncrease = document.getElementById('roiAnnualIncrease').textContent;
    const annualRevenue = document.getElementById('roiAnnualRevenue').textContent;
    const revenuePerSale = parseFloat(document.getElementById('roiRevenuePerSale').value) || 4250;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ROI Projection Report - ${dealerName}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                }
                h1 { 
                    color: #6B46C1; 
                    border-bottom: 3px solid #6B46C1; 
                    padding-bottom: 10px; 
                }
                h2 { 
                    color: #9333EA; 
                    margin-top: 30px; 
                }
                .metric { 
                    margin: 20px 0; 
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .metric-label { 
                    font-weight: bold; 
                    color: #666; 
                    display: block;
                    margin-bottom: 5px;
                }
                .metric-value { 
                    font-size: 1.5em; 
                    color: #6B46C1; 
                }
                .highlight {
                    background: #e8f5e9;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 30px 0;
                    border-left: 4px solid #10B981;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd; 
                }
                th { 
                    background-color: #f5f5f5; 
                    font-weight: bold; 
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 0.9em;
                    color: #666;
                }
                @media print { 
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>ROI Projection Report</h1>
            <p><strong>Dealership:</strong> ${dealerName}</p>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            
            <h2>Current Performance</h2>
            <div class="metric">
                <span class="metric-label">Monthly Lead Volume</span>
                <span class="metric-value">${monthlyLeads.toLocaleString()}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Current Conversion Rate</span>
                <span class="metric-value">${currentRate.toFixed(2)}%</span>
            </div>
            <div class="metric">
                <span class="metric-label">Average Gross (F/B)</span>
                <span class="metric-value">$${revenuePerSale.toLocaleString()}</span>
            </div>
            
            <h2>Projected Improvements</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>New Conversion Rate</td>
                    <td><strong>${newRate}</strong></td>
                </tr>
                <tr>
                    <td>Conversion Rate Improvement</td>
                    <td><strong>${improvement}</strong></td>
                </tr>
                <tr>
                    <td>Additional Monthly Sales</td>
                    <td><strong>${monthlyIncrease}</strong></td>
                </tr>
                <tr>
                    <td>Additional Annual Sales</td>
                    <td><strong>${annualIncrease}</strong></td>
                </tr>
            </table>
            
            <div class="highlight">
                <h3 style="margin-top: 0;">Projected Annual Revenue Increase</h3>
                <div style="font-size: 2em; color: #10B981; font-weight: bold;">
                    ${annualRevenue}
                </div>
            </div>
            
            
            <div class="footer">
                <p>Generated by Auto Audit Pro Suite - Lead Performance Intelligence</p>
                <p>${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    }, 250);
}


// Debug function to check stored dealer data
function checkStoredDealerData() {
    console.log('=== CHECKING STORED DEALER DATA ===');
    const firstDealer = Object.values(uploadedDealerData)[0];
    if (firstDealer) {
        console.log('First dealer in stored data:', firstDealer.name);
        console.log('Response time fields:');
        console.log('- responseTime15min:', firstDealer.responseTime15min);
        console.log('- responseTime30min:', firstDealer.responseTime30min);
        console.log('- responseTime60min:', firstDealer.responseTime60min);
        console.log('- responded:', firstDealer.responded);
        console.log('- noResponse:', firstDealer.noResponse);
        
        // Check if old data might not have these fields
        if (firstDealer.responseTime15min === undefined) {
            console.error('WARNING: Stored data is missing response time fields!');
            console.error('This data was saved before response times were implemented.');
            console.error('Please clear stored data and re-upload your file.');
        }
    }
    
    // Count how many dealers have response time data
    let dealersWithResponseData = 0;
    Object.values(uploadedDealerData).forEach(dealer => {
        if (dealer.responseTime15min !== undefined || dealer.responseTime30min !== undefined) {
            dealersWithResponseData++;
        }
    });
    console.log(`${dealersWithResponseData} out of ${Object.keys(uploadedDealerData).length} dealers have response time data`);
}

// Make functions available globally for onclick handlers
window.uploadFile = uploadFile;
window.checkStoredDealerData = checkStoredDealerData;
window.showSection = showSection;
window.handleFileSelect = handleFileSelect;
window.updateDealerAnalysis = updateDealerAnalysis;
window.calculateROIImprovement = calculateROIImprovement;
window.calculateROIToTarget = calculateROIToTarget;
window.calculateROICustom = calculateROICustom;
window.updateCurrentSales = updateCurrentSales;
window.populateROIFromDealer = populateROIFromDealer;
window.populateDealerSelect = populateDealerSelect;
window.populateDealerDropdowns = populateDealerDropdowns;
window.clearStoredData = clearStoredData;
window.generateNetworkReport = generateNetworkReport;
window.generateDealerReport = generateDealerReport;
window.generateResponseReport = generateResponseReport;
window.generateROIReport = generateROIReport;

// Debug function to test response time display
function testResponseTimeDisplay() {
    console.log('Testing response time display...');
    
    // Check if elements exist
    const elements = [
        'response15min', 'response30min', 'response60min', 
        'response60plus', 'response24hr', 'response24plus',
        'responseNone', 'responseTotal'
    ];
    
    elements.forEach(id => {
        const elem = document.getElementById(id);
        if (!elem) {
            console.error(`Element #${id} not found!`);
        } else {
            console.log(`Element #${id} found: ${elem.textContent}`);
        }
    });
    
    // Test with sample data
    const testDist = {
        time15min: 50,
        time30min: 30,
        time60min: 20,
        time60plus: 10,
        time24hr: 5,
        time24plus: 2,
        noResponse: 100,
        responded: 117,
        total: 217
    };
    
    console.log('Attempting to update with test data:', testDist);
    
    // Try updating directly
    try {
        document.getElementById('response15min').textContent = 
            `${testDist.time15min} (${((testDist.time15min / testDist.total) * 100).toFixed(1)}%)`;
        console.log('Successfully updated response15min');
    } catch (e) {
        console.error('Error updating response15min:', e);
    }
}

// Test column mapping
function debugColumnMapping() {
    console.log('=== COLUMN MAPPING DEBUG ===');
    console.log('Expected Ford Report Structure:');
    console.log('Column A (0): Lead Request Date');
    console.log('Column B (1): Lead Source');
    console.log('Column C (2): Lead Type (Form/Chat)');
    console.log('Column D (3): [Unknown]');
    console.log('Column E (4): [Unknown]');
    console.log('Column F (5): Date/Time Actionable');
    console.log('Column G (6): Response Time (e.g., "0h 30m")');
    console.log('Column H (7): Response Date');
    console.log('Column I (8): [Unknown]');
    console.log('Column J (9): Sale Date');
    console.log('');
    
    if (uploadedDealerData && Object.keys(uploadedDealerData).length > 0) {
        const firstDealer = Object.values(uploadedDealerData)[0];
        console.log('First dealer data summary:', {
            name: firstDealer.name,
            totalLeads: firstDealer.leads,
            responded: firstDealer.responded,
            noResponse: firstDealer.noResponse,
            responseBreakdown: {
                '0-15min': firstDealer.responseTime15min,
                '16-30min': firstDealer.responseTime30min,
                '31-60min': firstDealer.responseTime60min,
                '60+min': firstDealer.responseTime60plus,
                '1-24hr': firstDealer.responseTime24hr,
                '24+hr': firstDealer.responseTime24plus
            }
        });
    } else {
        console.log('No dealer data loaded yet');
    }
}

window.testResponseTimeDisplay = testResponseTimeDisplay;
window.debugColumnMapping = debugColumnMapping;

// Function to inspect raw data structure
function inspectRawData(data) {
    console.log('=== RAW DATA INSPECTION ===');
    if (!data || data.length === 0) {
        console.log('No data provided');
        return;
    }
    
    console.log(`Total rows: ${data.length}`);
    
    // Show rows 10-15 to see headers and first data rows
    console.log('\nRows 10-15 (around where data starts):');
    for (let i = 10; i < Math.min(15, data.length); i++) {
        const row = data[i];
        if (row && row.length > 0) {
            console.log(`Row ${i+1}:`, row.slice(0, 11)); // Show first 11 columns
        }
    }
    
    // If we have data starting at row 12 (index 11), show column values
    if (data.length > 11 && data[11]) {
        console.log('\nFirst data row (Row 12) column values:');
        const firstDataRow = data[11];
        const columnNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        for (let i = 0; i < Math.min(10, firstDataRow.length); i++) {
            console.log(`Column ${columnNames[i]} (${i}): "${firstDataRow[i]}"`);
        }
    }
}

window.inspectRawData = inspectRawData;

// Function to manually test response time parsing
function testResponseTimeParsing() {
    const testCases = [
        "0h 30m",
        "1h 15m",
        "0h30m",
        "1h15m",
        "30m",
        "2h",
        "0h 5m",
        "24h 0m",
        "48h 30m"
    ];
    
    console.log('=== RESPONSE TIME PARSING TEST ===');
    
    testCases.forEach(testCase => {
        let totalMinutes = null;
        
        // Pattern 1: "0h 30m" format
        let match = testCase.match(/(\d+)h (\d+)m/);
        if (match) {
            totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
        } else {
            // Pattern 2: "0h30m" (no space)
            match = testCase.match(/(\d+)h(\d+)m/);
            if (match) {
                totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
            } else {
                // Pattern 3: Just minutes "30m"
                match = testCase.match(/(\d+)m/);
                if (match) {
                    totalMinutes = parseInt(match[1]);
                } else {
                    // Pattern 4: Just hours "2h"
                    match = testCase.match(/(\d+)h/);
                    if (match) {
                        totalMinutes = parseInt(match[1]) * 60;
                    }
                }
            }
        }
        
        let category = 'unknown';
        if (totalMinutes !== null) {
            if (totalMinutes <= 15) category = '0-15min';
            else if (totalMinutes <= 30) category = '16-30min';
            else if (totalMinutes <= 60) category = '31-60min';
            else if (totalMinutes <= 240) category = '60min-4hr';
            else if (totalMinutes <= 1440) category = '4-24hr';
            else category = '24hr+';
        }
        
        console.log(`"${testCase}" => ${totalMinutes !== null ? totalMinutes + ' minutes' : 'FAILED TO PARSE'} (${category})`);
    });
}

window.testResponseTimeParsing = testResponseTimeParsing;

// Settings functions
window.saveSettings = function() {
    const settings = {
        targetConversion: document.getElementById('targetConversion').value,
        target15Min: document.getElementById('target15Min').value,
        targetNoResponse: document.getElementById('noResponseThreshold').value,
        eliteThreshold: document.getElementById('eliteThreshold').value,
        strongThreshold: document.getElementById('strongThreshold').value,
        averageThreshold: document.getElementById('averageThreshold').value,
        avgGrossProfit: document.getElementById('avgGrossProfit').value,
        avgMarketingSpend: document.getElementById('avgMarketingSpend').value,
        dataRetention: document.getElementById('dataRetention').value,
        defaultReportFormat: document.getElementById('defaultReportFormat').value,
        autoSelectDealer: document.getElementById('autoSelectDealer').checked
    };
    
    // Save to localStorage
    localStorage.setItem('leadPerformanceSettings', JSON.stringify(settings));
    
    // Show success message
    const alert = document.getElementById('settingsAlert');
    if (alert) {
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }
    
    // Update tier thresholds if dealer data is loaded
    if (uploadedDealerData && Object.keys(uploadedDealerData).length > 0) {
        updatePerformanceTiers();
    }
}

window.resetSettings = function() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
        // Reset form values
        document.getElementById('targetConversion').value = '18';
        document.getElementById('target15Min').value = '40';
        document.getElementById('noResponseThreshold').value = '10';
        document.getElementById('eliteThreshold').value = '20';
        document.getElementById('strongThreshold').value = '16';
        document.getElementById('averageThreshold').value = '12';
        document.getElementById('avgGrossProfit').value = '4250';
        document.getElementById('avgMarketingSpend').value = '25000';
        document.getElementById('dataRetention').value = '7days';
        document.getElementById('defaultReportFormat').value = 'pdf';
        document.getElementById('autoSelectDealer').checked = true;
        
        // Clear saved settings
        localStorage.removeItem('leadPerformanceSettings');
        
        // Show success message
        const alert = document.getElementById('settingsAlert');
        if (alert) {
            alert.innerHTML = '<i class="fas fa-check-circle"></i> Settings reset to defaults!';
            alert.style.display = 'block';
            setTimeout(() => {
                alert.style.display = 'none';
                alert.innerHTML = '<i class="fas fa-check-circle"></i> Settings saved successfully!';
            }, 3000);
        }
    }
}

// Load saved settings on page load
function loadSavedSettings() {
    const savedSettings = localStorage.getItem('leadPerformanceSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            
            // Apply saved values
            if (settings.targetConversion) document.getElementById('targetConversion').value = settings.targetConversion;
            if (settings.target15Min) document.getElementById('target15Min').value = settings.target15Min;
            if (settings.targetNoResponse) document.getElementById('noResponseThreshold').value = settings.targetNoResponse;
            if (settings.eliteThreshold) document.getElementById('eliteThreshold').value = settings.eliteThreshold;
            if (settings.strongThreshold) document.getElementById('strongThreshold').value = settings.strongThreshold;
            if (settings.averageThreshold) document.getElementById('averageThreshold').value = settings.averageThreshold;
            if (settings.avgGrossProfit) document.getElementById('avgGrossProfit').value = settings.avgGrossProfit;
            if (settings.avgMarketingSpend) document.getElementById('avgMarketingSpend').value = settings.avgMarketingSpend;
            if (settings.dataRetention) document.getElementById('dataRetention').value = settings.dataRetention;
            if (settings.defaultReportFormat) document.getElementById('defaultReportFormat').value = settings.defaultReportFormat;
            if (settings.autoSelectDealer !== undefined) document.getElementById('autoSelectDealer').checked = settings.autoSelectDealer;
        } catch (e) {
            console.error('Error loading saved settings:', e);
        }
    }
}