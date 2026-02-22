/*
 * Auto Audit Pro - Enhanced Audit Results Display
 * Version 2.7.0
 * © 2025 JL Robinson. All Rights Reserved.
 */

// Enhanced results display with confidence indicators
class AuditResultsDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.results = null;
    }

    // Main render function
    render(results) {
        this.results = results;
        this.container.innerHTML = '';
        
        // Create main structure
        const resultsHTML = `
            <div class="audit-results-enhanced">
                ${this.renderHeader()}
                ${this.renderConfidenceBar()}
                ${this.renderScoreSummary()}
                ${this.renderPriorityIssues()}
                ${this.renderCategoryDetails()}
                ${this.renderAllIssues()}
                ${this.renderExportOptions()}
            </div>
        `;
        
        this.container.innerHTML = resultsHTML;
        this.attachEventHandlers();
    }

    // Render header with score
    renderHeader() {
        // Calculate overall score if missing
        if (!this.results.overallScore && this.results.categories) {
            let totalScore = 0;
            let totalWeight = 0;
            this.results.categories.forEach(cat => {
                const percentage = cat.percentage || ((cat.score || 0) / (cat.maxScore || 5) * 100);
                const weight = cat.weight || (1 / this.results.categories.length);
                totalScore += percentage * weight;
                totalWeight += weight;
            });
            this.results.overallScore = Math.round(totalScore);
        }
        
        const scoreClass = this.getScoreClass(this.results.overallScore || 0);
        const grade = this.getLetterGrade(this.results.overallScore || 0);
        
        return `
            <div class="results-header">
                <div class="score-circle ${scoreClass}">
                    <div class="score-value">${this.results.overallScore}</div>
                    <div class="score-label">Overall Score</div>
                    <div class="score-grade">${grade}</div>
                </div>
                <div class="audit-info">
                    <h2>Website Analysis Complete</h2>
                    <p class="audit-url">${this.results.url}</p>
                    <p class="audit-time">Analyzed: ${new Date(this.results.timestamp).toLocaleString()}</p>
                    <div class="quick-stats">
                        <span class="stat-item">
                            <i class="fas fa-check-circle text-success"></i>
                            ${this.countPassedTests()} Tests Passed
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-exclamation-triangle text-warning"></i>
                            ${this.results.issues.length} Issues Found
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-chart-line"></i>
                            ${this.results.categories.length} Categories Analyzed
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render confidence indicator bar
    renderConfidenceBar() {
        // Handle missing confidence data
        if (!this.results.confidence || Object.keys(this.results.confidence).length === 0) {
            return ''; // Don't show confidence bar if no data
        }
        const total = Object.values(this.results.confidence).reduce((a, b) => a + b, 0);
        
        return `
            <div class="confidence-bar">
                <h3>Analysis Confidence</h3>
                <div class="confidence-levels">
                    <div class="confidence-level high" style="width: ${(this.results.confidence.high / total * 100)}%">
                        <span class="level-label">High: ${this.results.confidence.high}</span>
                    </div>
                    <div class="confidence-level moderate" style="width: ${(this.results.confidence.moderate / total * 100)}%">
                        <span class="level-label">Moderate: ${this.results.confidence.moderate}</span>
                    </div>
                    <div class="confidence-level low" style="width: ${(this.results.confidence.low / total * 100)}%">
                        <span class="level-label">Low: ${this.results.confidence.low}</span>
                    </div>
                    <div class="confidence-level manual" style="width: ${(this.results.confidence.manual / total * 100)}%">
                        <span class="level-label">Manual Review: ${this.results.confidence.manual}</span>
                    </div>
                </div>
                <p class="confidence-note">
                    <i class="fas fa-info-circle"></i>
                    Results marked as "Moderate" or "Manual Review" should be verified manually for accuracy.
                </p>
            </div>
        `;
    }

    // Render score summary by category
    renderScoreSummary() {
        const categoryCards = this.results.categories.map(cat => {
            const scoreClass = this.getScoreClass(cat.percentage);
            const icon = cat.icon || 'fa-check';
            
            return `
                <div class="category-card ${scoreClass}">
                    <div class="category-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="category-content">
                        <h4>${cat.name}</h4>
                        <div class="category-score">${cat.percentage}%</div>
                        <div class="category-details">
                            <small>${cat.description || ''}</small>
                            <div class="test-count">${cat.tests.length} tests</div>
                        </div>
                    </div>
                    <div class="category-weight">
                        Weight: ${(cat.weight * 100).toFixed(0)}%
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="score-summary">
                <h3>Category Performance</h3>
                <div class="category-grid">
                    ${categoryCards}
                </div>
            </div>
        `;
    }

    // Render priority issues section
    renderPriorityIssues() {
        const criticalIssues = this.results.issues.filter(i => i.priority === 'critical');
        const highIssues = this.results.issues.filter(i => i.priority === 'high');
        const priorityIssues = [...criticalIssues, ...highIssues].slice(0, 5);
        
        if (priorityIssues.length === 0) {
            return `
                <div class="priority-issues success">
                    <h3><i class="fas fa-check-circle"></i> Great Job!</h3>
                    <p>No critical or high-priority issues found. Your website is performing well!</p>
                </div>
            `;
        }
        
        const issueCards = priorityIssues.map(issue => this.renderIssueCard(issue, true)).join('');
        
        return `
            <div class="priority-issues">
                <h3>
                    <i class="fas fa-exclamation-triangle"></i>
                    Priority Action Items
                    <span class="issue-count">${priorityIssues.length}</span>
                </h3>
                <p class="section-description">
                    These issues have the highest impact on your website's performance and should be addressed first.
                </p>
                <div class="priority-issues-list">
                    ${issueCards}
                </div>
            </div>
        `;
    }

    // Render detailed issue card
    renderIssueCard(issue, showDetails = false) {
        const priorityClass = `priority-${issue.priority}`;
        const confidenceIcon = this.getConfidenceIcon(issue.confidence);
        const impactIcon = this.getImpactIcon(issue.businessValue);
        const effortIcon = this.getEffortIcon(issue.effort);
        
        return `
            <div class="issue-card ${priorityClass}" data-confidence="${issue.confidence}">
                <div class="issue-header">
                    <h4>${issue.title}</h4>
                    <div class="issue-badges">
                        <span class="badge priority-badge ${priorityClass}">
                            ${issue.priority}
                        </span>
                        <span class="badge confidence-badge" title="Confidence: ${issue.confidence}">
                            ${confidenceIcon}
                        </span>
                    </div>
                </div>
                <div class="issue-body">
                    <p class="issue-description">${issue.description}</p>
                    
                    ${issue.evidence && issue.evidence.length > 0 ? `
                        <div class="issue-evidence">
                            <strong>Evidence:</strong>
                            <ul>
                                ${issue.evidence.map(e => `<li>${e}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${showDetails ? `
                        <div class="issue-details">
                            <div class="detail-item">
                                <strong>Impact:</strong>
                                <span>${impactIcon} ${issue.impact}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Solution:</strong>
                                <span>${issue.solution}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Effort Required:</strong>
                                <span>${effortIcon} ${issue.effort}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Business Value:</strong>
                                <span>${impactIcon} ${issue.businessValue}</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${issue.technicalDetails ? `
                        <details class="technical-details">
                            <summary>Technical Details</summary>
                            <pre>${issue.technicalDetails}</pre>
                        </details>
                    ` : ''}
                    
                    <div class="issue-category">
                        <i class="fas fa-folder"></i> ${issue.category}
                    </div>
                </div>
            </div>
        `;
    }

    // Render category details with tests
    renderCategoryDetails() {
        const categoryDetails = this.results.categories.map(category => {
            const tests = category.tests || [];
            const testRows = tests.map(test => this.renderTestRow(test)).join('');
            
            return `
                <details class="category-details" ${category.percentage < 80 ? 'open' : ''}>
                    <summary class="category-summary">
                        <span class="category-name">
                            <i class="fas ${category.icon || 'fa-check'}"></i>
                            ${category.name}
                        </span>
                        <span class="category-score ${this.getScoreClass(category.percentage)}">
                            ${category.percentage}%
                        </span>
                    </summary>
                    <div class="category-test-list">
                        <table class="test-results-table">
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Result</th>
                                    <th>Confidence</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${testRows}
                            </tbody>
                        </table>
                    </div>
                </details>
            `;
        }).join('');
        
        return `
            <div class="category-details-section">
                <h3>Detailed Test Results</h3>
                ${categoryDetails}
            </div>
        `;
    }

    // Render individual test row
    renderTestRow(test) {
        const passedClass = test.passed ? 'test-passed' : 'test-failed';
        const confidenceIcon = this.getConfidenceIcon(test.confidence);
        
        return `
            <tr class="${passedClass}">
                <td class="test-name">
                    ${test.passed ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}
                    ${test.name}
                </td>
                <td class="test-value">${test.value || '-'}</td>
                <td class="test-confidence">
                    <span title="Confidence: ${test.confidence}">
                        ${confidenceIcon}
                    </span>
                </td>
                <td class="test-details">
                    ${test.details ? `<small>${test.details}</small>` : '-'}
                    ${test.dataSource ? `<div class="data-source"><i class="fas fa-database"></i> ${test.dataSource}</div>` : ''}
                </td>
            </tr>
        `;
    }

    // Render all issues grouped by category
    renderAllIssues() {
        const groupedIssues = this.groupIssuesByCategory();
        const categoryGroups = Object.entries(groupedIssues).map(([category, issues]) => {
            return `
                <div class="issue-category-group">
                    <h4>${category} (${issues.length})</h4>
                    <div class="issue-list">
                        ${issues.map(issue => this.renderIssueCard(issue, false)).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="all-issues-section">
                <h3>All Issues by Category</h3>
                <div class="issues-filter">
                    <button class="filter-btn active" data-filter="all">All Issues</button>
                    <button class="filter-btn" data-filter="critical">Critical</button>
                    <button class="filter-btn" data-filter="high">High Priority</button>
                    <button class="filter-btn" data-filter="medium">Medium Priority</button>
                    <button class="filter-btn" data-filter="low">Low Priority</button>
                </div>
                <div class="issues-grouped">
                    ${categoryGroups}
                </div>
            </div>
        `;
    }

    // Render export options
    renderExportOptions() {
        return `
            <div class="export-options">
                <h3>Export Results</h3>
                <div class="export-buttons">
                    <button class="btn btn-primary" onclick="auditResults.exportPDF()">
                        <i class="fas fa-file-pdf"></i> Export as PDF
                    </button>
                    <button class="btn btn-secondary" onclick="auditResults.exportCSV()">
                        <i class="fas fa-file-csv"></i> Export as CSV
                    </button>
                    <button class="btn btn-secondary" onclick="auditResults.exportJSON()">
                        <i class="fas fa-code"></i> Export as JSON
                    </button>
                    <button class="btn btn-info" onclick="auditResults.shareResults()">
                        <i class="fas fa-share-alt"></i> Share Results
                    </button>
                </div>
            </div>
        `;
    }

    // Helper functions
    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'fair';
        if (score >= 60) return 'poor';
        return 'critical';
    }

    getLetterGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    getConfidenceIcon(confidence) {
        const icons = {
            'high': '<i class="fas fa-check-circle text-success" title="High confidence"></i>',
            'moderate': '<i class="fas fa-question-circle text-warning" title="Moderate confidence - verify"></i>',
            'low': '<i class="fas fa-exclamation-circle text-warning" title="Low confidence - manual review needed"></i>',
            'manual-review': '<i class="fas fa-user-check text-info" title="Manual review required"></i>'
        };
        return icons[confidence] || icons['moderate'];
    }

    getImpactIcon(level) {
        const icons = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        };
        return icons[level] || '🟡';
    }

    getEffortIcon(level) {
        const icons = {
            'low': '⚡',
            'medium': '⏱️',
            'high': '🏗️'
        };
        return icons[level] || '⏱️';
    }

    countPassedTests() {
        return this.results.categories.reduce((total, cat) => {
            return total + (cat.tests || []).filter(t => t.passed).length;
        }, 0);
    }

    groupIssuesByCategory() {
        const grouped = {};
        this.results.issues.forEach(issue => {
            const category = issue.category.split(' - ')[0];
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(issue);
        });
        return grouped;
    }

    // Event handlers
    attachEventHandlers() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterIssues(filter);
                
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    filterIssues(priority) {
        const issueCards = document.querySelectorAll('.issue-card');
        issueCards.forEach(card => {
            if (priority === 'all') {
                card.style.display = 'block';
            } else {
                const cardPriority = card.classList.contains(`priority-${priority}`);
                card.style.display = cardPriority ? 'block' : 'none';
            }
        });
    }

    // Export functions
    exportPDF() {
        // Implementation would use jsPDF or similar
        alert('PDF export would be implemented here');
    }

    exportCSV() {
        const csv = this.generateCSV();
        this.downloadFile(csv, 'audit-results.csv', 'text/csv');
    }

    exportJSON() {
        const json = JSON.stringify(this.results, null, 2);
        this.downloadFile(json, 'audit-results.json', 'application/json');
    }

    generateCSV() {
        let csv = 'Category,Score,Priority,Issue,Confidence,Impact\n';
        
        this.results.issues.forEach(issue => {
            const row = [
                issue.category,
                this.getCategoryScore(issue.category),
                issue.priority,
                `"${issue.title.replace(/"/g, '""')}"`,
                issue.confidence,
                issue.businessValue || 'medium'
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }

    getCategoryScore(categoryName) {
        const cat = this.results.categories.find(c => categoryName.includes(c.name));
        return cat ? cat.percentage : 'N/A';
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    shareResults() {
        const shareUrl = `${window.location.origin}/audit/share/${this.results.id || 'temp'}`;
        if (navigator.share) {
            navigator.share({
                title: 'Website Audit Results',
                text: `Website audit score: ${this.results.overallScore}/100`,
                url: shareUrl
            });
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Share link copied to clipboard!');
            });
        }
    }
}

// Initialize on page load
let auditResults;
document.addEventListener('DOMContentLoaded', () => {
    auditResults = new AuditResultsDisplay('audit-results');
});