/**
 * Test file locking implementation
 * © 2025 JL Robinson. All Rights Reserved.
 */

const fileLockManager = require('./lib/file-lock-manager');
const path = require('path');

async function testConcurrentWrites() {
    console.log('Testing concurrent file writes with locking...\n');
    
    const testFile = path.join(__dirname, 'data', 'test-lock.json');
    let successCount = 0;
    let errorCount = 0;
    
    // Initialize test file
    await fileLockManager.writeJSONWithLock(testFile, { counter: 0, writes: [] });
    
    // Create 10 concurrent write operations
    const promises = [];
    for (let i = 0; i < 10; i++) {
        const promise = fileLockManager.updateJSONWithLock(testFile, async (data) => {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            
            data.counter++;
            data.writes.push({
                id: i,
                timestamp: new Date().toISOString(),
                counter: data.counter
            });
            
            console.log(`Write ${i} completed. Counter: ${data.counter}`);
            return data;
        }).then(() => {
            successCount++;
        }).catch((error) => {
            console.error(`Write ${i} failed:`, error.message);
            errorCount++;
        });
        
        promises.push(promise);
    }
    
    // Wait for all operations to complete
    await Promise.all(promises);
    
    // Read final result
    const finalData = await fileLockManager.readJSONWithLock(testFile);
    
    console.log('\n--- Test Results ---');
    console.log('Successful writes:', successCount);
    console.log('Failed writes:', errorCount);
    console.log('Final counter value:', finalData.counter);
    console.log('Expected counter value:', 10);
    console.log('Test passed:', finalData.counter === 10 && successCount === 10);
    
    // Cleanup
    require('fs').unlinkSync(testFile);
}

// Run test
testConcurrentWrites().catch(console.error);