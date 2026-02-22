/**
 * File Lock Manager
 * Provides centralized file locking to prevent race conditions
 * © 2025 JL Robinson. All Rights Reserved.
 */

const fs = require('fs').promises;
const lockfile = require('proper-lockfile');
const path = require('path');

class FileLockManager {
    constructor() {
        this.lockOptions = {
            stale: 5000, // Consider lock stale after 5 seconds
            update: 1000, // Update lock every 1 second
            retries: {
                retries: 10,
                minTimeout: 100,
                maxTimeout: 1000,
                randomize: true
            }
        };
    }

    /**
     * Read a JSON file with exclusive lock
     */
    async readJSONWithLock(filePath) {
        let release = null;
        try {
            // Acquire lock
            release = await lockfile.lock(filePath, this.lockOptions);
            
            // Read file
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            console.error(`[FileLock] Error reading ${filePath}:`, error);
            throw error;
        } finally {
            // Always release lock
            if (release) {
                await release();
            }
        }
    }

    /**
     * Write a JSON file with exclusive lock
     */
    async writeJSONWithLock(filePath, data) {
        let release = null;
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            // Acquire lock
            release = await lockfile.lock(filePath, this.lockOptions);
            
            // Write to temp file first (atomic write)
            const tempPath = filePath + '.tmp';
            await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
            
            // Rename temp file to actual file
            await fs.rename(tempPath, filePath);
            
            console.log(`[FileLock] Successfully wrote ${filePath}`);
        } catch (error) {
            console.error(`[FileLock] Error writing ${filePath}:`, error);
            throw error;
        } finally {
            // Always release lock
            if (release) {
                await release();
            }
        }
    }

    /**
     * Update a JSON file with exclusive lock
     * Provides a callback to modify the data
     */
    async updateJSONWithLock(filePath, updateCallback) {
        let release = null;
        try {
            // Acquire lock
            release = await lockfile.lock(filePath, this.lockOptions);
            
            // Read current data
            let data = {};
            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                data = JSON.parse(fileContent);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
            
            // Update data
            const updatedData = await updateCallback(data);
            
            // Write back
            const tempPath = filePath + '.tmp';
            await fs.writeFile(tempPath, JSON.stringify(updatedData, null, 2));
            await fs.rename(tempPath, filePath);
            
            console.log(`[FileLock] Successfully updated ${filePath}`);
            return updatedData;
        } catch (error) {
            console.error(`[FileLock] Error updating ${filePath}:`, error);
            throw error;
        } finally {
            // Always release lock
            if (release) {
                await release();
            }
        }
    }

    /**
     * Check if a file is currently locked
     */
    async isLocked(filePath) {
        try {
            return await lockfile.check(filePath);
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
module.exports = new FileLockManager();