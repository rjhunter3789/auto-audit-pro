#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function managePendingRequests() {
    try {
        console.log('\n⏳ Auto Audit Pro - Pending Monitoring Requests Manager\n');
        
        // Check for pending requests in multiple possible locations
        const possiblePaths = [
            path.join(__dirname, 'data', 'monitoring', 'pending-requests.json'),
            path.join(__dirname, 'data', 'monitoring-requests.json'),
            path.join(__dirname, 'data', 'pending-monitoring.json')
        ];
        
        let pendingPath = null;
        let pendingRequests = [];
        
        // Find the file that exists
        for (const testPath of possiblePaths) {
            try {
                await fs.access(testPath);
                pendingPath = testPath;
                const data = await fs.readFile(testPath, 'utf8');
                pendingRequests = JSON.parse(data);
                console.log(`📁 Found pending requests at: ${path.basename(testPath)}\n`);
                break;
            } catch (error) {
                // Continue to next path
            }
        }
        
        if (!pendingPath || pendingRequests.length === 0) {
            console.log('📭 No pending monitoring requests found.\n');
            
            // Let's search for any JSON files that might contain pending data
            console.log('🔍 Searching for monitoring data files...\n');
            
            const dataDir = path.join(__dirname, 'data');
            const monitoringDir = path.join(dataDir, 'monitoring');
            
            // List all JSON files
            try {
                const dataFiles = await fs.readdir(dataDir);
                const monFiles = await fs.readdir(monitoringDir).catch(() => []);
                
                console.log('📋 Found data files:');
                dataFiles.filter(f => f.endsWith('.json')).forEach(f => console.log(`  - data/${f}`));
                monFiles.filter(f => f.endsWith('.json')).forEach(f => console.log(`  - data/monitoring/${f}`));
            } catch (error) {
                console.log('Error listing files:', error.message);
            }
            
            return;
        }
        
        // Display pending requests
        console.log('📋 Pending Monitoring Requests:\n');
        console.log('#'.padEnd(5) + 'Dealership'.padEnd(30) + 'URL'.padEnd(40) + 'Requested By');
        console.log('-'.repeat(90));
        
        pendingRequests.forEach((request, index) => {
            console.log(
                `${index + 1}`.padEnd(5) +
                (request.dealerName || request.dealershipName || 'Unknown').padEnd(30) +
                (request.url || request.websiteUrl || 'No URL').padEnd(40) +
                (request.requestedBy || request.username || 'Unknown')
            );
        });
        
        console.log('\n📌 Options:');
        console.log('1. Approve a request');
        console.log('2. Remove a request');
        console.log('3. Approve all requests');
        console.log('4. Remove all requests');
        console.log('5. Exit');
        
        const choice = await question('\nSelect an option (1-5): ');
        
        if (choice === '2' || choice === '4') {
            // Remove request(s)
            if (choice === '2') {
                const num = await question('Enter the number of the request to remove: ');
                const index = parseInt(num) - 1;
                
                if (isNaN(index) || index < 0 || index >= pendingRequests.length) {
                    console.log('❌ Invalid selection.');
                    return;
                }
                
                const removed = pendingRequests.splice(index, 1)[0];
                console.log(`✅ Removed request for: ${removed.dealerName || removed.dealershipName}`);
            } else {
                pendingRequests = [];
                console.log('✅ Removed all pending requests');
            }
            
            // Save updated requests
            await fs.writeFile(pendingPath, JSON.stringify(pendingRequests, null, 2));
            
        } else if (choice === '1' || choice === '3') {
            console.log('ℹ️  To approve requests, please use the admin dashboard in the web interface.');
            console.log('   This tool is for viewing and removing pending requests only.');
            
        } else if (choice !== '5') {
            console.log('❌ Invalid option.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

managePendingRequests();