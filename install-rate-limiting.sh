#!/bin/bash

# Install rate limiting dependencies for Auto Audit Pro
echo "📦 Installing rate limiting packages..."

# express-rate-limit: Basic rate limiting middleware for Express
# rate-limit-redis: Redis store for distributed rate limiting (optional, for scaling)
# express-slow-down: Gradually slow down responses instead of blocking
npm install express-rate-limit express-slow-down

echo "✅ Rate limiting packages installed successfully!"
echo ""
echo "Installed packages:"
echo "- express-rate-limit: Basic rate limiting middleware"
echo "- express-slow-down: Progressive response slowing"
echo ""
echo "Next step: Implement rate limiting middleware"