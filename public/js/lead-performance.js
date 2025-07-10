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
    loadStoredData();
    setupDragAndDrop();
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
        
        // Get key dates
        const leadRequestDate = row[0]; // Column A - Lead Request Date
        const dateTimeActionable = row[5]; // Column F - Date/Time Actionable (when business opens)
        const responseDate = row[7]; // Column H - Response Date
        
        // Check if there was a response
        if (responseDate && responseDate !== 'N/A' && responseDate !== '') {
            // Track that this lead got a response
            currentDealerData.responded += 1;
            currentDealerData.leadSources[leadSource].appointments += 1;
            
            // Calculate response time from Date/Time Actionable (not Lead Request Date)
            // This accounts for business hours - response time starts when dealership opens
            try {
                const actionableTime = new Date(dateTimeActionable);
                const responseTime = new Date(responseDate);
                const diffMinutes = Math.floor((responseTime - actionableTime) / (1000 * 60));
                
                // Categorize response times
                if (diffMinutes >= 0) {
                    if (diffMinutes <= 15) {
                        currentDealerData.responseTime15min += 1;
                    } else if (diffMinutes <= 30) {
                        currentDealerData.responseTime30min += 1;
                    } else if (diffMinutes <= 60) {
                        currentDealerData.responseTime60min += 1;
                    } else if (diffMinutes <= 1440) { // 24 hours
                        if (diffMinutes <= 240) { // 4 hours
                            currentDealerData.responseTime60plus += 1;
                        } else {
                            currentDealerData.responseTime24hr += 1;
                        }
                    } else {
                        currentDealerData.responseTime24plus += 1;
                    }
                }
                
                // Log for debugging
                if (i < 15) { // Log first few for debugging
                    console.log(`Lead ${i}: Actionable: ${dateTimeActionable}, Response: ${responseDate}, Diff: ${diffMinutes} min`);
                }
            } catch (e) {
                // Date parsing error - fall back to Column G if needed
                const responseTimeText = row[6]; // Column G as fallback
                if (responseTimeText && responseTimeText !== 'N/A' && responseTimeText !== '0h 0m') {
                    const match = responseTimeText.match(/(\d+)h (\d+)m/);
                    if (match) {
                        const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                        if (totalMinutes <= 15) {
                            currentDealerData.responseTime15min += 1;
                        }
                    }
                }
            }
        } else {
            // No response
            currentDealerData.noResponse += 1;
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
    // Update metric cards
    document.getElementById('totalLeads').textContent = metrics.totalLeads.toLocaleString();
    document.getElementById('conversionRate').textContent = metrics.conversionRate + '%';
    
    // Update response metrics
    if (document.getElementById('noResponseRate')) {
        document.getElementById('noResponseRate').textContent = metrics.noResponseRate + '%';
    }
    if (document.getElementById('quickResponseRate')) {
        document.getElementById('quickResponseRate').textContent = metrics.quickResponseRate + '%';
    }
    
    // Update response time distribution if we have the data
    if (metrics.responseDistribution) {
        const dist = metrics.responseDistribution;
        const total = dist.total || 1; // Avoid division by zero
        
        document.getElementById('response15min').textContent = 
            `${dist.time15min} (${((dist.time15min / total) * 100).toFixed(1)}%)`;
        document.getElementById('response30min').textContent = 
            `${dist.time30min} (${((dist.time30min / total) * 100).toFixed(1)}%)`;
        document.getElementById('response60min').textContent = 
            `${dist.time60min} (${((dist.time60min / total) * 100).toFixed(1)}%)`;
        document.getElementById('response60plus').textContent = 
            `${dist.time60plus} (${((dist.time60plus / total) * 100).toFixed(1)}%)`;
        document.getElementById('response24hr').textContent = 
            `${dist.time24hr} (${((dist.time24hr / total) * 100).toFixed(1)}%)`;
        document.getElementById('response24plus').textContent = 
            `${dist.time24plus} (${((dist.time24plus / total) * 100).toFixed(1)}%)`;
        document.getElementById('responseNone').textContent = 
            `${dist.noResponse} (${((dist.noResponse / total) * 100).toFixed(1)}%)`;
        document.getElementById('responseTotal').textContent = 
            `${dist.responded} (${((dist.responded / total) * 100).toFixed(1)}%)`;
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
                    <p class="metric-value">${dealer.noResponse}</p>
                    <p class="metric-change">
                        ${((dealer.noResponse / dealer.leads) * 100).toFixed(1)}% of leads
                    </p>
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
            
            // Check response
            const responseDate = row[7]; // Column H
            
            // Debug first few rows
            if (i < 15 && dealerData.leads < 5) {
                console.log(`Row ${i} - Response Date: "${responseDate}", Actionable: "${row[5]}"`);
            }
            
            if (responseDate && responseDate !== 'N/A' && responseDate !== '') {
                dealerData.responded += 1;
                
                // Check response time calculation
                const dateTimeActionable = row[5]; // Column F
                try {
                    const actionableTime = new Date(dateTimeActionable);
                    const responseTime = new Date(responseDate);
                    
                    // Check if dates are valid
                    if (isNaN(actionableTime.getTime()) || isNaN(responseTime.getTime())) {
                        console.log(`Invalid date format - Actionable: ${dateTimeActionable}, Response: ${responseDate}`);
                        // Try parsing the "0h 30m" format from Column G instead
                        const responseTimeText = row[6]; // Column G
                        if (responseTimeText && responseTimeText !== 'N/A' && responseTimeText !== '0h 0m') {
                            const match = responseTimeText.match(/(\d+)h (\d+)m/);
                            if (match) {
                                const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
                                
                                // Categorize based on text format
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
                    } else {
                        const diffMinutes = Math.floor((responseTime - actionableTime) / (1000 * 60));
                        
                        // Categorize response times
                        if (diffMinutes >= 0) {
                            if (diffMinutes <= 15) {
                                dealerData.responseTime15min += 1;
                            } else if (diffMinutes <= 30) {
                                dealerData.responseTime30min += 1;
                            } else if (diffMinutes <= 60) {
                                dealerData.responseTime60min += 1;
                            } else if (diffMinutes <= 1440) { // 24 hours
                                if (diffMinutes <= 240) { // 4 hours
                                    dealerData.responseTime60plus += 1;
                                } else {
                                    dealerData.responseTime24hr += 1;
                                }
                            } else {
                                dealerData.responseTime24plus += 1;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Date parsing error:', e);
                }
            } else {
                dealerData.noResponse += 1;
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
        console.log('Sample dealer response data:', {
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
        });
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
    
    // Store data
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
window.populateDealerDropdowns = populateDealerDropdowns;
window.generateNetworkReport = generateNetworkReport;
window.generateDealerReport = generateDealerReport;
window.generateResponseReport = generateResponseReport;