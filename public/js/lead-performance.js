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
    
    // Test: Try to update response time display after a short delay
    setTimeout(() => {
        const testElem = document.getElementById('response15min');
        if (testElem) {
            console.log('Test: Found response15min element, current value:', testElem.textContent);
            // Don't actually change it, just log that we found it
        } else {
            console.error('Test: response15min element not found after DOM ready!');
        }
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
        
        // Check response - Column H contains Response Date, Column G contains Response Time
        const responseDate = row[7]; // Column H - Response Date
        const responseTimeText = row[6]; // Column G - Response Time in "0h 30m" format
        
        // Debug first few rows
        if (processedRows < 3) {
            console.log(`Row ${i+1} - Response Date (Col H): "${responseDate}", Response Time (Col G): "${responseTimeText}"`);
            console.log(`  Type of responseDate: ${typeof responseDate}, Type of responseTimeText: ${typeof responseTimeText}`);
        }
        
        // Check if there was a response (Column H not "N/A")
        // Also check for case variations and trimmed strings
        const trimmedResponseDate = responseDate ? responseDate.toString().trim() : '';
        if (trimmedResponseDate === 'N/A' || trimmedResponseDate === 'n/a' || trimmedResponseDate === 'N/a' || 
            trimmedResponseDate === '' || !trimmedResponseDate) {
            // No response
            currentDealerData.noResponse += 1;
            if (processedRows < 3) {
                console.log('  -> Counted as NO RESPONSE');
            }
        } else {
            // There was a response
            currentDealerData.responded += 1;
            currentDealerData.leadSources[leadSource].appointments += 1;
            if (processedRows < 3) {
                console.log('  -> Counted as RESPONDED');
            }
            
            // Parse response time from Column G
            if (responseTimeText && responseTimeText !== 'N/A' && responseTimeText !== '') {
                // Try different regex patterns for time format
                let totalMinutes = null;
                
                // Pattern 1: "0h 30m" format
                let match = responseTimeText.match(/(\d+)h (\d+)m/);
                if (match) {
                    totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                } else {
                    // Pattern 2: "0h30m" (no space)
                    match = responseTimeText.match(/(\d+)h(\d+)m/);
                    if (match) {
                        totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                    } else {
                        // Pattern 3: Just minutes "30m"
                        match = responseTimeText.match(/(\d+)m/);
                        if (match) {
                            totalMinutes = parseInt(match[1]);
                        } else {
                            // Pattern 4: Just hours "2h"
                            match = responseTimeText.match(/(\d+)h/);
                            if (match) {
                                totalMinutes = parseInt(match[1]) * 60;
                            }
                        }
                    }
                }
                
                if (totalMinutes !== null) {
                    // Debug log
                    if (processedRows < 5) {
                        console.log(`Response time: "${responseTimeText}" = ${totalMinutes} minutes`);
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
    
    // Auto-populate ROI calculator if on that tab
    const dealerSelectInROI = document.getElementById('roiMonthlyLeads');
    if (dealerSelectInROI) {
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
                    <p class="metric-change">Network Total: ${networkTotals.leads.toLocaleString()}</p>
                </div>
                <div class="metric-card">
                    <h3>Total Sales</h3>
                    <p class="metric-value">${dealer.sales}</p>
                    <p class="metric-change">Network Total: ${networkTotals.sales.toLocaleString()}</p>
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
            
            // Check response - Column H contains Response Date, Column G contains Response Time
            const responseDate = row[7]; // Column H - Response Date
            const responseTimeText = row[6]; // Column G - Response Time in "0h 30m" format
            
            // Debug first row of first dealer
            if (index === 0 && i === 11) {
                console.log(`First data row - Col G (Response Time): "${responseTimeText}", Col H (Response Date): "${responseDate}"`);
                console.log('Full row data:', row);
                console.log(`  Type of responseDate: ${typeof responseDate}, Type of responseTimeText: ${typeof responseTimeText}`);
            }
            
            // Check if there was a response
            const trimmedResponseDate = responseDate ? responseDate.toString().trim() : '';
            if (trimmedResponseDate === 'N/A' || trimmedResponseDate === 'n/a' || trimmedResponseDate === 'N/a' || 
                trimmedResponseDate === '' || !trimmedResponseDate) {
                // No response
                dealerData.noResponse += 1;
                if (index === 0 && i === 11) {
                    console.log('  -> Counted as NO RESPONSE');
                }
            } else {
                // There was a response
                dealerData.responded += 1;
                if (index === 0 && i === 11) {
                    console.log('  -> Counted as RESPONDED');
                }
                
                // Now categorize the response time from Column G
                if (responseTimeText && responseTimeText !== 'N/A' && responseTimeText !== '') {
                    // Try different regex patterns for time format
                    let totalMinutes = null;
                    
                    // Pattern 1: "0h 30m" format
                    let match = responseTimeText.match(/(\d+)h (\d+)m/);
                    if (match) {
                        totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                    } else {
                        // Pattern 2: "0h30m" (no space)
                        match = responseTimeText.match(/(\d+)h(\d+)m/);
                        if (match) {
                            totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                        } else {
                            // Pattern 3: Just minutes "30m"
                            match = responseTimeText.match(/(\d+)m/);
                            if (match) {
                                totalMinutes = parseInt(match[1]);
                            } else {
                                // Pattern 4: Just hours "2h"
                                match = responseTimeText.match(/(\d+)h/);
                                if (match) {
                                    totalMinutes = parseInt(match[1]) * 60;
                                }
                            }
                        }
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
    
    // Store summary data (legacy)
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
    const revenuePerSale = parseFloat(document.getElementById('roiRevenuePerSale').value) || 45000;
    
    if (!leads || !currentRate) {
        alert('Please enter your current monthly leads and conversion rate first.');
        return;
    }
    
    // Calculate current and target sales
    const currentMonthlySales = leads * (currentRate / 100);
    const targetMonthlySales = leads * (targetRate / 100);
    const additionalMonthlySales = targetMonthlySales - currentMonthlySales;
    const additionalAnnualSales = additionalMonthlySales * 12;
    const additionalAnnualRevenue = additionalAnnualSales * revenuePerSale;
    
    // Update results
    document.getElementById('roiNewRate').textContent = targetRate.toFixed(2) + '%';
    document.getElementById('roiImprovement').textContent = '+' + (targetRate - currentRate).toFixed(2) + '%';
    document.getElementById('roiMonthlyIncrease').textContent = '+' + additionalMonthlySales.toFixed(1);
    document.getElementById('roiAnnualIncrease').textContent = '+' + additionalAnnualSales.toFixed(0);
    document.getElementById('roiAnnualRevenue').textContent = '$' + additionalAnnualRevenue.toLocaleString();
    
    // Show results panel
    document.getElementById('roiResultsPanel').style.display = 'block';
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
    if (!dealerName || !uploadedDealerData[dealerName]) return;
    
    const dealer = uploadedDealerData[dealerName];
    
    // Calculate monthly average (assuming data might be for multiple months)
    // For now, just use the total as monthly
    document.getElementById('roiMonthlyLeads').value = dealer.leads;
    document.getElementById('roiCurrentConversion').value = dealer.conversionRate;
    
    // Update current sales display
    updateCurrentSales();
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
    alert('Network report generation coming soon!');
}

function generateDealerReport() {
    alert('Individual dealer report generation coming soon!');
}

function generateResponseReport() {
    alert('Response time report generation coming soon!');
}

// Update current sales display
function updateCurrentSales() {
    const leads = parseFloat(document.getElementById('roiMonthlyLeads').value) || 0;
    const conversionRate = parseFloat(document.getElementById('roiCurrentConversion').value) || 0;
    
    if (leads && conversionRate) {
        const currentSales = leads * (conversionRate / 100);
        document.getElementById('currentMonthlySales').textContent = currentSales.toFixed(1);
    } else {
        document.getElementById('currentMonthlySales').textContent = '-';
    }
}

// Make functions available globally for onclick handlers
window.uploadFile = uploadFile;
window.showSection = showSection;
window.handleFileSelect = handleFileSelect;
window.updateDealerAnalysis = updateDealerAnalysis;
window.calculateROI = calculateROI;
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