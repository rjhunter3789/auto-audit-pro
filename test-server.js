const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Test if we can read the users file
const usersPath = path.join(__dirname, 'data', 'users.json');
try {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    console.log('Users file loaded successfully');
    console.log('Admin user:', users.find(u => u.username === 'admin'));
} catch (error) {
    console.error('Error reading users file:', error);
}

// Create a simple test server
const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    if (req.url === '/test') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Server is working! AutoAuditPro test server\n');
    } else if (req.url === '/login') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
            <body>
                <h1>AutoAuditPro Login Test</h1>
                <p>Main server not running. This is a test server.</p>
                <p>Admin credentials have been reset to:</p>
                <ul>
                    <li>Username: admin</li>
                    <li>Password: AutoAudit2025!</li>
                </ul>
                <p>To start the main server, run: npm start</p>
            </body>
            </html>
        `);
    } else {
        res.writeHead(404);
        res.end('Not Found\n');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Access URLs:`);
    console.log(`  http://localhost:${PORT}/test`);
    console.log(`  http://127.0.0.1:${PORT}/test`);
    console.log(`  http://0.0.0.0:${PORT}/test`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Try a different port.`);
    }
});