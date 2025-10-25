#!/bin/bash
# Fix Smart-Doc V2 Voice Transcription Error

echo "Smart-Doc V2 Voice Transcription Fix"
echo "===================================="

cat << 'SCRIPT' > fix_transcription.py
#!/usr/bin/env python3
"""
Fix for Smart-Doc V2 voice transcription FileStorage error
"""

import sys
import re

# Read the app.py file
with open('/var/www/smart-doc-v2/app.py', 'r') as f:
    content = f.read()

# Find and fix the transcribe_voice function
old_pattern = r'''transcript = client\.audio\.transcriptions\.create\(
                  model="whisper-1",
                  file=audio_file
              \)'''

new_pattern = '''# Read file content into memory with proper format
              audio_content = audio_file.read()
              audio_file.seek(0)  # Reset file pointer
              
              # Create transcription with file content
              transcript = client.audio.transcriptions.create(
                  model="whisper-1",
                  file=("audio.webm", audio_content, "audio/webm")
              )'''

# Replace the pattern
content = re.sub(old_pattern, new_pattern, content, flags=re.MULTILINE | re.DOTALL)

# Write the fixed content back
with open('/var/www/smart-doc-v2/app.py', 'w') as f:
    f.write(content)

print("Fixed transcription endpoint!")
SCRIPT

echo "Running fix on server..."
ssh root@146.190.39.214 << 'REMOTE'
cd /var/www/smart-doc-v2
python3 fix_transcription.py

# Restart the service
pm2 restart smart-doc-v2

# Check status
pm2 status smart-doc-v2

echo "Fix applied! Test at: https://smartdoc.autoauditpro.io/voice"
REMOTE