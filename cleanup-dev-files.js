#!/usr/bin/env node

/*
 * Development Files Cleanup Script
 * Auto Audit Pro - File Organization Utility
 * 
 * This script organizes development, debug, and temporary files
 * into appropriate directories for better project structure.
 */

const fs = require('fs');
const path = require('path');

// Create directories for organization
const DEV_DIR = '_dev';
const DEBUG_DIR = path.join(DEV_DIR, 'debug-scripts');
const BACKUP_DIR = path.join(DEV_DIR, 'backups');
const TEMP_DIR = path.join(DEV_DIR, 'temp-files');
const VOICE_DEBUG_DIR = path.join(DEV_DIR, 'voice-debug');

// Files to move (categorized)
const filesToMove = {
    debugScripts: [
        'test-server.js',
        'server-test.js',
        'test-mobile-mic.html',
        'fix-audio-analyser.js',
        'fix-monitoring-data.js',
        'start-server.js',
        'check-user-permissions.js',
        'force-clear-monitoring.js',
        'manage-pending-monitoring.js',
        'remove-monitoring-site.js',
        'kill-and-restart.ps1'
    ],
    
    shellScripts: [
        'fix-voice-module.sh',
        'fix-voice-transcription.sh',
        'direct-voice-fix.sh',
        'fix-webm-audio.sh',
        'fix-voice-interruption.sh',
        'fix-web-search.sh',
        'permanent-mobile-fix.sh',
        'disable-auto-stop.sh'
    ],
    
    textCommands: [
        'server.js - MVP Backend for Dealer.txt',
        'voice-fix-commands.txt',
        'fix-v2-voice-now.txt',
        'webm-fix-commands.txt',
        'check-web-search.txt',
        'quick-fix-web-search.txt',
        'add-processing-indicator.txt',
        'fix-mobile-processing.txt',
        'fix-mobile-quick.txt',
        'quick-mobile-fix-commands.txt',
        'quick-disable-auto-stop.txt',
        'fix-audio-analyser-nano.txt'
    ],
    
    voiceDebugFiles: [
        'logo-preview.html',
        'voice-handsfree-fixed.html',
        'voice-handsfree-simple-fix.html',
        'voice-handsfree-fixed-v2.html',
        'voice-handsfree-complete-fix.html',
        'voice-handsfree-template.html'
    ],
    
    publicDebugFiles: [
        'public/fix-csp.js',
        'public/fix-admin-access.html',
        'public/csp-test.html',
        'public/csp-bypass.html',
        'public/test123.txt',
        'public/monitoring-static.html'
    ],
    
    cssDebugFiles: [
        'public/css/test.txt'
    ],
    
    viewsDebugFiles: [
        'views/test-ejs.ejs',
        'views/admin-fix.html',
        'views/monitoring-fix.html',
        'views/monitoring-test.html',
        'views/test-nav.html',
        'views/test-permissions.html'
    ],
    
    libBackupFiles: [
        'lib/audit-tests-quick-fix.js',
        'lib/audit-tests-backup.js',
        'lib/audit-tests-enhanced.js'
    ]
};

// Utility scripts to keep but document
const utilityScripts = [
    'create-copyright-zip.sh',
    'start.sh',
    'create-web-search.py',
    'manage-users.js'
];

async function createDirectories() {
    const dirs = [DEV_DIR, DEBUG_DIR, BACKUP_DIR, TEMP_DIR, VOICE_DEBUG_DIR];
    
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
    }
}

async function moveFile(source, category, destination) {
    try {
        if (fs.existsSync(source)) {
            fs.renameSync(source, destination);
            console.log(`  ✓ Moved: ${source} → ${destination}`);
            return true;
        } else {
            console.log(`  ⚠️  Not found: ${source}`);
            return false;
        }
    } catch (error) {
        console.error(`  ❌ Error moving ${source}: ${error.message}`);
        return false;
    }
}

async function cleanupFiles() {
    console.log('\n🧹 Starting Auto Audit Pro cleanup...\n');
    
    // Create directories
    await createDirectories();
    
    let movedCount = 0;
    
    // Move debug scripts
    console.log('\n📁 Moving debug scripts...');
    for (const file of filesToMove.debugScripts) {
        const dest = path.join(DEBUG_DIR, path.basename(file));
        if (await moveFile(file, 'debug', dest)) movedCount++;
    }
    
    // Move shell scripts
    console.log('\n📁 Moving shell scripts...');
    for (const file of filesToMove.shellScripts) {
        const dest = path.join(DEBUG_DIR, path.basename(file));
        if (await moveFile(file, 'shell', dest)) movedCount++;
    }
    
    // Move text command files
    console.log('\n📁 Moving text command files...');
    for (const file of filesToMove.textCommands) {
        const dest = path.join(TEMP_DIR, path.basename(file));
        if (await moveFile(file, 'text', dest)) movedCount++;
    }
    
    // Move voice debug files
    console.log('\n📁 Moving voice debug files...');
    for (const file of filesToMove.voiceDebugFiles) {
        const dest = path.join(VOICE_DEBUG_DIR, path.basename(file));
        if (await moveFile(file, 'voice', dest)) movedCount++;
    }
    
    // Move public debug files
    console.log('\n📁 Moving public debug files...');
    for (const file of filesToMove.publicDebugFiles) {
        const dest = path.join(DEBUG_DIR, path.basename(file));
        if (await moveFile(file, 'public', dest)) movedCount++;
    }
    
    // Move CSS debug files
    console.log('\n📁 Moving CSS debug files...');
    for (const file of filesToMove.cssDebugFiles) {
        const dest = path.join(TEMP_DIR, path.basename(file));
        if (await moveFile(file, 'css', dest)) movedCount++;
    }
    
    // Move views debug files
    console.log('\n📁 Moving views debug files...');
    for (const file of filesToMove.viewsDebugFiles) {
        const dest = path.join(DEBUG_DIR, path.basename(file));
        if (await moveFile(file, 'views', dest)) movedCount++;
    }
    
    // Move lib backup files
    console.log('\n📁 Moving lib backup files...');
    for (const file of filesToMove.libBackupFiles) {
        const dest = path.join(BACKUP_DIR, path.basename(file));
        if (await moveFile(file, 'lib', dest)) movedCount++;
    }
    
    // Move views_backup directory
    console.log('\n📁 Moving views_backup directory...');
    if (fs.existsSync('views_backup')) {
        const dest = path.join(BACKUP_DIR, 'views_backup');
        if (await moveFile('views_backup', 'backup', dest)) movedCount++;
    }
    
    // Move data backup files
    console.log('\n📁 Moving data backup files...');
    const dataBackups = [
        'data/users.json.backup-1753309363863',
        'data/users.json.backup-1761527303542',
        'data/monitoring/alerts.json.backup',
        'data/monitoring/alerts.json.backup-1753020444063',
        'data/monitoring/alerts.json.backup-1761528086409',
        'data/monitoring/profiles.json.backup',
        'data/monitoring/results.json.backup',
        'data/monitoring/results.json.backup-1761528086398'
    ];
    
    for (const file of dataBackups) {
        const dest = path.join(BACKUP_DIR, 'data-backups', path.basename(file));
        if (!fs.existsSync(path.dirname(dest))) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
        }
        if (await moveFile(file, 'backup', dest)) movedCount++;
    }
    
    // Document utility scripts
    console.log('\n📝 Documenting utility scripts...');
    let utilityDocs = '# Utility Scripts Documentation\n\n';
    utilityDocs += 'These scripts are kept in the root directory as they serve specific purposes:\n\n';
    
    const scriptDocs = {
        'create-copyright-zip.sh': 'Creates a zip file for copyright registration submission',
        'start.sh': 'Production startup script for the application',
        'create-web-search.py': 'Python script for web search functionality',
        'manage-users.js': 'User management utility for admin operations'
    };
    
    for (const script of utilityScripts) {
        if (fs.existsSync(script)) {
            utilityDocs += `## ${script}\n`;
            utilityDocs += `${scriptDocs[script] || 'Utility script'}\n\n`;
        }
    }
    
    fs.writeFileSync(path.join(DEV_DIR, 'UTILITY_SCRIPTS.md'), utilityDocs);
    console.log(`  ✓ Created utility scripts documentation`);
    
    // Summary
    console.log('\n✨ Cleanup Summary:');
    console.log(`  • Files moved: ${movedCount}`);
    console.log(`  • Development directory created: ${DEV_DIR}/`);
    console.log(`  • Subdirectories created:`);
    console.log(`    - ${DEBUG_DIR}/`);
    console.log(`    - ${BACKUP_DIR}/`);
    console.log(`    - ${TEMP_DIR}/`);
    console.log(`    - ${VOICE_DEBUG_DIR}/`);
    console.log('\n💡 Next steps:');
    console.log('  1. Review files in _dev/ directory');
    console.log('  2. Delete unnecessary files permanently');
    console.log('  3. Update .gitignore to exclude _dev/');
    console.log('  4. Commit the cleaned project structure');
}

// Run the cleanup
cleanupFiles().catch(console.error);