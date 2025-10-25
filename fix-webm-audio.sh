#!/bin/bash
# Fix WebM audio format issue for Smart-Doc V2

echo "Smart-Doc V2 WebM Audio Fix"
echo "==========================="

# Create the audio conversion fix
cat << 'SCRIPT' > /tmp/audio_fix.py
import subprocess
import tempfile
import os

def convert_webm_to_wav(webm_data):
    """Convert WebM audio data to WAV format using ffmpeg"""
    
    # Create temporary files
    with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as webm_file:
        webm_file.write(webm_data)
        webm_path = webm_file.name
    
    wav_path = webm_path.replace('.webm', '.wav')
    
    try:
        # Use ffmpeg to convert WebM to WAV
        cmd = [
            'ffmpeg',
            '-i', webm_path,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',  # 16kHz sample rate for Whisper
            '-ac', '1',      # Mono audio
            '-y',            # Overwrite output
            wav_path
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Read the WAV file
        with open(wav_path, 'rb') as f:
            wav_data = f.read()
        
        return wav_data
        
    finally:
        # Clean up temporary files
        if os.path.exists(webm_path):
            os.unlink(webm_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)

# Test if ffmpeg is installed
def check_ffmpeg():
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except:
        return False

if __name__ == "__main__":
    if check_ffmpeg():
        print("✓ ffmpeg is installed")
    else:
        print("✗ ffmpeg is not installed")
        print("Install with: apt update && apt install -y ffmpeg")
SCRIPT

echo "Connecting to server..."
ssh root@146.190.39.214 << 'EOF'
cd /var/www/smart-doc-v2

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Installing ffmpeg..."
    apt update
    apt install -y ffmpeg
fi

# Create the updated transcription endpoint
cat > fix_transcribe.py << 'PYTHON'
# Fix for transcribe_voice endpoint
import os

# Read current app.py
with open('app.py', 'r') as f:
    content = f.read()

# Updated transcription function
new_transcribe = '''@app.route('/api/voice/transcribe', methods=['POST'])
@login_required
def transcribe_voice():
    """Transcribe voice to text"""
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'})
        
        audio_file = request.files['audio']
        
        # Use OpenAI Whisper to transcribe
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Read the audio data
        audio_file.seek(0)
        audio_data = audio_file.read()
        
        # Convert WebM to WAV using ffmpeg
        import subprocess
        import tempfile
        
        # Save WebM to temporary file
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as webm_file:
            webm_file.write(audio_data)
            webm_path = webm_file.name
        
        # Convert to WAV
        wav_path = webm_path.replace('.webm', '.wav')
        try:
            cmd = [
                'ffmpeg', '-i', webm_path,
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                '-y', wav_path
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Read WAV file and create transcription
            with open(wav_path, 'rb') as wav_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=wav_file,
                    language="en"
                )
            
            return jsonify({
                'success': True,
                'text': transcript.text
            })
            
        except subprocess.CalledProcessError as e:
            return jsonify({
                'success': False,
                'error': f'Audio conversion failed: {e.stderr.decode() if e.stderr else str(e)}'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            })
        finally:
            # Clean up temporary files
            import os
            if os.path.exists(webm_path):
                os.unlink(webm_path)
            if os.path.exists(wav_path):
                os.unlink(wav_path)
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })'''

# Find and replace the transcribe_voice function
import re

# Pattern to match the entire function
pattern = r'@app\.route\(\'/api/voice/transcribe\'.*?\n@login_required\ndef transcribe_voice\(\):.*?(?=\n@app\.route|\nif __name__|$)'

# Replace with new version
content = re.sub(pattern, new_transcribe.strip(), content, flags=re.DOTALL)

# Write back
with open('app.py', 'w') as f:
    f.write(content)

print("Transcription endpoint updated with WebM to WAV conversion!")
PYTHON

# Run the fix
python3 fix_transcribe.py

# Add subprocess import at the top of app.py if not present
if ! grep -q "import subprocess" app.py; then
    sed -i '/import tempfile/a import subprocess' app.py
    # If tempfile isn't imported either, add both
    if ! grep -q "import tempfile" app.py; then
        sed -i '/import os/a import tempfile\nimport subprocess' app.py
    fi
fi

# Restart the app
echo "Restarting Smart-Doc V2..."
pm2 restart smart-doc-v2

# Check status
sleep 3
pm2 status smart-doc-v2

echo -e "\n✅ WebM audio conversion fix applied!"
echo "Test at: https://smartdoc.autoauditpro.io/voice-handsfree"
EOF