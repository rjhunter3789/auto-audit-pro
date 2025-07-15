#!/bin/bash

# Auto Audit Pro v2.4.3 Copyright Submission ZIP Creator
# This script creates a clean ZIP file for copyright registration

echo "Creating Auto Audit Pro v2.4.3 Copyright Submission ZIP..."

# Define output filename
OUTPUT_FILE="AutoAuditPro_v2.4.3_Copyright.zip"

# Remove old ZIP if exists
if [ -f "$OUTPUT_FILE" ]; then
    echo "Removing existing $OUTPUT_FILE..."
    rm "$OUTPUT_FILE"
fi

# Create the ZIP file with all necessary files
echo "Adding files to ZIP..."

zip -r "$OUTPUT_FILE" \
    server.js \
    server-simple.js \
    package.json \
    package-lock.json \
    lib/*.js \
    middleware/*.js \
    public/js/*.js \
    views/*.html \
    database/*.sql \
    *.md \
    railway.json \
    nixpacks.toml \
    Dockerfile \
    .env.example \
    LICENSE \
    start.sh \
    -x "*.log" \
    -x "node_modules/*" \
    -x ".git/*" \
    -x "data/*" \
    -x "public/uploads/*" \
    -x "logs/*" \
    -x ".env" \
    -x "test-*.js" \
    -x "generate-secret.js" \
    -x "create-copyright-zip.sh"

echo ""
echo "ZIP file created successfully!"
echo ""
echo "File Details:"
ls -lh "$OUTPUT_FILE"
echo ""
echo "Contents Summary:"
unzip -l "$OUTPUT_FILE" | tail -n 5
echo ""
echo "IMPORTANT: Please verify the ZIP contents before submission:"
echo "  1. Run: unzip -l $OUTPUT_FILE | less"
echo "  2. Ensure NO sensitive data (.env, passwords, API keys) are included"
echo "  3. Verify all source code files are present"
echo ""
echo "The ZIP file is ready for eCO submission: $OUTPUT_FILE"