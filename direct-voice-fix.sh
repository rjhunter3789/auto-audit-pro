#!/bin/bash
# Direct fix for Smart-Doc V2 voice transcription

ssh root@146.190.39.214 << 'EOF'
cd /var/www/smart-doc-v2

# Create a backup first
cp app.py app.py.backup

# Fix the transcribe_voice endpoint
cat > fix_voice.py << 'PYTHON'
import re

# Read the current app.py
with open('app.py', 'r') as f:
    content = f.read()

# Find the transcribe_voice function and fix it
# Look for the specific line that's causing the error
old_code = """            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )"""

new_code = """            # Read the audio file content
            audio_data = audio_file.read()
            audio_file.seek(0)
            
            # Create transcription with proper file format
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=("audio.webm", audio_data, "audio/webm")
            )"""

# Replace the code
content = content.replace(old_code, new_code)

# Write back
with open('app.py', 'w') as f:
    f.write(content)

print("Voice transcription fix applied!")
PYTHON

# Run the fix
python3 fix_voice.py

# Verify the fix was applied
echo "Checking if fix was applied..."
grep -A5 "Read the audio file content" app.py

# Restart the application
echo "Restarting Smart-Doc V2..."
pm2 restart smart-doc-v2

# Wait for it to start
sleep 3

# Check status
echo "Application status:"
pm2 status smart-doc-v2

# Show recent logs
echo -e "\nRecent logs:"
pm2 logs smart-doc-v2 --lines 15 --nostream

echo -e "\n✅ Voice transcription fix complete!"
echo "Test at: https://smartdoc.autoauditpro.io/voice"
EOF