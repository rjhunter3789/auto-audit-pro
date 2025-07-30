const { spawn } = require('child_process');
const path = require('path');

console.log('Starting AutoAuditPro server...');

// Try different ports
const ports = [3000, 3001, 3002, 8080, 8081];
let currentPortIndex = 0;

function startServer() {
    if (currentPortIndex >= ports.length) {
        console.error('Failed to start server on any port. Please check for conflicts.');
        process.exit(1);
    }

    const port = ports[currentPortIndex];
    console.log(`\nAttempting to start on port ${port}...`);

    const env = { ...process.env, PORT: port };
    const server = spawn('node', ['server.js'], { 
        env,
        stdio: 'inherit',
        cwd: __dirname
    });

    server.on('error', (err) => {
        console.error(`Failed to start server: ${err.message}`);
        currentPortIndex++;
        startServer();
    });

    server.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Server exited with code ${code}`);
            currentPortIndex++;
            setTimeout(startServer, 1000);
        }
    });

    // Give it time to start
    setTimeout(() => {
        console.log(`\nIf the server started successfully, you can access it at:`);
        console.log(`  http://localhost:${port}/login`);
        console.log(`  http://127.0.0.1:${port}/login`);
        console.log(`\nFor WSL2 users, you might also try:`);
        console.log(`  http://$(hostname -I | awk '{print $1}'):${port}/login`);
    }, 3000);
}

startServer();