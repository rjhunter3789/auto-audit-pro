// OEM Incentives Manager
let uploadedIncentives = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupUploadArea();
    loadStoredIncentives();
});

// Setup drag and drop
function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

// Handle file upload
function handleFile(file) {
    const reader = new FileReader();
    
    if (file.name.endsWith('.csv')) {
        reader.onload = (e) => processCSV(e.target.result);
        reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = (e) => processExcel(e.target.result);
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please upload a CSV or Excel file');
    }
}

// Process CSV
function processCSV(data) {
    const lines = data.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const incentives = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const incentive = {};
            headers.forEach((header, index) => {
                incentive[header] = values[index] || '';
            });
            incentives.push(incentive);
        }
    }

    displayPreview(incentives);
}

// Process Excel
function processExcel(data) {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    displayPreview(jsonData);
}

// Display preview
function displayPreview(incentives) {
    uploadedIncentives = incentives;
    const previewSection = document.getElementById('previewSection');
    const tbody = document.querySelector('#previewTable tbody');
    
    tbody.innerHTML = '';
    
    incentives.forEach(inc => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${inc.Model || inc.model || ''}</td>
            <td><span class="incentive-type type-${(inc.Type || inc.type || 'cash').toLowerCase()}">${inc.Type || inc.type || ''}</span></td>
            <td>${inc.Amount || inc.amount || inc['Amount/Rate'] || ''}</td>
            <td>${inc.Description || inc.description || ''}</td>
            <td>${inc['End Date'] || inc['Valid Until'] || inc.end_date || ''}</td>
        `;
    });
    
    previewSection.style.display = 'block';
}

// Save incentives
function saveIncentives() {
    if (uploadedIncentives.length === 0) return;
    
    // Store locally for now
    localStorage.setItem('oemIncentives', JSON.stringify({
        data: uploadedIncentives,
        uploadDate: new Date().toISOString()
    }));
    
    // Send to server
    fetch('/api/incentives/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            incentives: uploadedIncentives
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Incentives saved successfully!');
            loadStoredIncentives();
            document.getElementById('previewSection').style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error saving incentives:', error);
        // Still show success since we saved locally
        alert('Incentives saved locally!');
        loadStoredIncentives();
        document.getElementById('previewSection').style.display = 'none';
    });
}

// Load stored incentives
function loadStoredIncentives() {
    const stored = localStorage.getItem('oemIncentives');
    if (!stored) return;
    
    const data = JSON.parse(stored);
    const incentivesList = document.getElementById('incentivesList');
    
    if (data.data.length === 0) {
        incentivesList.innerHTML = '<p class="text-muted text-center py-5">No incentives uploaded yet</p>';
        return;
    }
    
    // Group by model
    const groupedByModel = {};
    data.data.forEach(inc => {
        const model = inc.Model || inc.model;
        if (!groupedByModel[model]) {
            groupedByModel[model] = [];
        }
        groupedByModel[model].push(inc);
    });
    
    let html = `<p class="text-muted small mb-3">Last updated: ${new Date(data.uploadDate).toLocaleDateString()}</p>`;
    
    Object.entries(groupedByModel).forEach(([model, incentives]) => {
        html += `
            <div class="incentive-card">
                <h5 class="mb-3">${model}</h5>
                <div class="small">
        `;
        
        incentives.forEach(inc => {
            const type = (inc.Type || inc.type || 'cash').toLowerCase();
            html += `
                <div class="mb-2">
                    <span class="incentive-type type-${type}">${inc.Type || inc.type}</span>
                    <strong>${inc.Amount || inc.amount || inc['Amount/Rate']}</strong> - 
                    ${inc.Description || inc.description}
                    <span class="text-muted">(Valid until: ${inc['End Date'] || inc['Valid Until'] || inc.end_date})</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    incentivesList.innerHTML = html;
}

// Cancel upload
function cancelUpload() {
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    uploadedIncentives = [];
}

// Clear all incentives
function clearAllIncentives() {
    if (confirm('Are you sure you want to clear all incentives?')) {
        localStorage.removeItem('oemIncentives');
        loadStoredIncentives();
    }
}

// Export incentives
function exportIncentives() {
    const stored = localStorage.getItem('oemIncentives');
    if (!stored) {
        alert('No incentives to export');
        return;
    }
    
    const data = JSON.parse(stored);
    const ws = XLSX.utils.json_to_sheet(data.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incentives');
    XLSX.writeFile(wb, `incentives-export-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Run incentive test
function runIncentiveTest() {
    const url = document.getElementById('testUrl').value;
    if (!url) {
        alert('Please enter a dealer website URL');
        return;
    }
    
    // For now, just open the audit page with the URL
    window.location.href = `/website-audit?url=${encodeURIComponent(url)}&incentiveCheck=true`;
}