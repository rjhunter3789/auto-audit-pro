#!/bin/bash
# Run this to create the fix script directly on the server

cat << 'SCRIPT' > fix-voice-module.sh
#!/bin/bash
# Fix Smart-Doc Voice Module Script

echo "Smart-Doc Voice Module Fix Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "app_flask.py" ]; then
    echo "Error: app_flask.py not found. Make sure you're in /var/www/smart-document-assistant"
    exit 1
fi

# Check current status
echo "Checking PM2 status..."
pm2 status smart-doc

# Create fixed voice_module.py
echo "Creating fixed voice_module.py..."
cat > voice_module.py << 'EOF'
"""
Smart Document Assistant - Voice Conversation Module
Full voice interaction with documents using OpenAI Whisper & TTS
"""

import os
from openai import OpenAI
from flask import request, jsonify, send_file
import io
import tempfile

def add_voice_features(app):
    """Add voice conversation endpoints to Smart-Doc"""
    
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    @app.route('/api/voice/transcribe', methods=['POST'])
    def transcribe_audio():
        """Convert speech to text using Whisper"""
        try:
            # Get audio file from request
            if 'audio' not in request.files:
                return jsonify({'error': 'No audio file provided'}), 400
            
            audio_file = request.files['audio']
            
            # Transcribe using Whisper
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            
            return jsonify({
                'success': True,
                'text': transcript
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/voice/speak', methods=['POST'])
    def text_to_speech():
        """Convert text to speech"""
        try:
            data = request.json
            text = data.get('text', '')
            voice = data.get('voice', 'alloy')  # alloy, echo, fable, onyx, nova, shimmer
            
            if not text:
                return jsonify({'error': 'No text provided'}), 400
            
            # Generate speech
            response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )
            
            # Return audio file
            audio_data = io.BytesIO(response.content)
            audio_data.seek(0)
            
            return send_file(
                audio_data,
                mimetype='audio/mpeg',
                as_attachment=True,
                download_name='response.mp3'
            )
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/voice/conversation', methods=['POST'])
    def voice_conversation():
        """Complete voice conversation: speech -> text -> AI -> speech"""
        try:
            # Get audio file
            if 'audio' not in request.files:
                return jsonify({'error': 'No audio file provided'}), 400
            
            audio_file = request.files['audio']
            document_text = request.form.get('document_text', '')
            voice = request.form.get('voice', 'alloy')
            
            # Step 1: Transcribe audio to text
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            
            question = transcript.text
            
            # Step 2: Get AI response
            if document_text:
                # Use document Q&A
                prompt = f"Document: {document_text}\n\nQ: {question}\nA:"
            else:
                # General conversation
                prompt = question
            
            ai_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant. Keep responses concise and conversational."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200
            )
            
            answer = ai_response.choices[0].message.content
            
            # Step 3: Convert response to speech
            speech_response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=answer
            )
            
            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                tmp_file.write(speech_response.content)
                tmp_path = tmp_file.name
            
            # Return both text and audio
            return jsonify({
                'success': True,
                'question': question,
                'answer': answer,
                'audio_url': f'/api/voice/audio/{os.path.basename(tmp_path)}'
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/voice/audio/<filename>')
    def serve_audio(filename):
        """Serve generated audio files"""
        try:
            path = os.path.join(tempfile.gettempdir(), filename)
            return send_file(path, mimetype='audio/mpeg')
        except Exception as e:
            return jsonify({'error': 'Audio file not found'}), 404
    
    # Add voice chat interface
    @app.route('/voice-chat')
    def voice_chat_interface():
        """Web interface for voice conversations"""
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Smart-Doc Voice Chat</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                h1 {
                    text-align: center;
                    color: #333;
                }
                .chat-area {
                    min-height: 400px;
                    max-height: 600px;
                    overflow-y: auto;
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    background: #fafafa;
                }
                .message {
                    margin: 15px 0;
                    padding: 15px;
                    border-radius: 10px;
                }
                .user-message {
                    background: #007bff;
                    color: white;
                    margin-left: 20%;
                    text-align: right;
                }
                .ai-message {
                    background: #e9ecef;
                    margin-right: 20%;
                }
                .controls {
                    text-align: center;
                    margin: 20px 0;
                }
                .record-btn {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: #dc3545;
                    color: white;
                    border: none;
                    font-size: 30px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .record-btn:hover {
                    transform: scale(1.1);
                }
                .record-btn.recording {
                    background: #28a745;
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
                    70% { box-shadow: 0 0 0 20px rgba(40, 167, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
                }
                .status {
                    margin: 10px 0;
                    color: #666;
                }
                .voice-select {
                    margin: 10px;
                    padding: 10px;
                    border-radius: 5px;
                    border: 1px solid #ddd;
                }
                .document-input {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    min-height: 100px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎙️ Smart-Doc Voice Chat</h1>
                
                <div class="chat-area" id="chatArea">
                    <div class="ai-message message">
                        <strong>AI:</strong> Hello! I can help you with your documents. Paste any document text below, then click and hold the microphone to ask questions!
                    </div>
                </div>
                
                <div class="controls">
                    <textarea id="documentText" class="document-input" placeholder="Paste your document here (optional)..."></textarea>
                    
                    <div>
                        <label>Voice: </label>
                        <select id="voiceSelect" class="voice-select">
                            <option value="alloy">Alloy (Neutral)</option>
                            <option value="echo">Echo (Male)</option>
                            <option value="fable">Fable (British)</option>
                            <option value="onyx">Onyx (Deep Male)</option>
                            <option value="nova">Nova (Female)</option>
                            <option value="shimmer">Shimmer (Soft Female)</option>
                        </select>
                    </div>
                    
                    <button id="recordBtn" class="record-btn">🎤</button>
                    <div class="status" id="status">Click and hold to speak</div>
                </div>
            </div>
            
            <script>
                let mediaRecorder;
                let audioChunks = [];
                const recordBtn = document.getElementById('recordBtn');
                const status = document.getElementById('status');
                const chatArea = document.getElementById('chatArea');
                const documentText = document.getElementById('documentText');
                const voiceSelect = document.getElementById('voiceSelect');
                
                // Request microphone permission
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        mediaRecorder = new MediaRecorder(stream);
                        
                        mediaRecorder.ondataavailable = event => {
                            audioChunks.push(event.data);
                        };
                        
                        mediaRecorder.onstop = async () => {
                            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                            audioChunks = [];
                            await processAudio(audioBlob);
                        };
                    })
                    .catch(err => {
                        status.textContent = 'Microphone access denied';
                        recordBtn.disabled = true;
                    });
                
                // Mouse events for desktop
                recordBtn.onmousedown = startRecording;
                recordBtn.onmouseup = stopRecording;
                recordBtn.onmouseleave = stopRecording;
                
                // Touch events for mobile
                recordBtn.ontouchstart = (e) => {
                    e.preventDefault();
                    startRecording();
                };
                recordBtn.ontouchend = (e) => {
                    e.preventDefault();
                    stopRecording();
                };
                
                function startRecording() {
                    if (mediaRecorder && mediaRecorder.state === 'inactive') {
                        audioChunks = [];
                        mediaRecorder.start();
                        recordBtn.classList.add('recording');
                        status.textContent = 'Recording... Release to send';
                    }
                }
                
                function stopRecording() {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        recordBtn.classList.remove('recording');
                        status.textContent = 'Processing...';
                    }
                }
                
                async function processAudio(audioBlob) {
                    try {
                        const formData = new FormData();
                        formData.append('audio', audioBlob, 'recording.webm');
                        formData.append('document_text', documentText.value);
                        formData.append('voice', voiceSelect.value);
                        
                        const response = await fetch('/api/voice/conversation', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            // Add messages to chat
                            addMessage('You', result.question, 'user-message');
                            addMessage('AI', result.answer, 'ai-message');
                            
                            // Play audio response
                            const audio = new Audio(result.audio_url);
                            audio.play();
                            
                            status.textContent = 'Click and hold to speak';
                        } else {
                            status.textContent = 'Error: ' + result.error;
                        }
                    } catch (error) {
                        status.textContent = 'Error: ' + error.message;
                    }
                }
                
                function addMessage(sender, text, className) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + className;
                    messageDiv.innerHTML = '<strong>' + sender + ':</strong> ' + text;
                    chatArea.appendChild(messageDiv);
                    chatArea.scrollTop = chatArea.scrollHeight;
                }
            </script>
        </body>
        </html>
        '''
    
    return app
EOF

echo "✓ Fixed voice_module.py created"

# Update app_flask.py to add voice features
echo "Updating app_flask.py to integrate voice features..."

# First, check if voice features are already imported
if grep -q "add_voice_features" app_flask.py; then
    echo "! Voice features already imported in app_flask.py"
else
    # Find the line number where we should add the import (after document_qa import)
    LINE_NUM=$(grep -n "from document_qa import" app_flask.py | cut -d: -f1)
    
    if [ -n "$LINE_NUM" ]; then
        # Add voice module import after document_qa import
        sed -i "${LINE_NUM}a from voice_module import add_voice_features" app_flask.py
        echo "✓ Added voice module import"
    else
        echo "! Could not find document_qa import. Adding at end of imports section..."
        # Find last import line
        LAST_IMPORT=$(grep -n "^from \|^import " app_flask.py | tail -1 | cut -d: -f1)
        sed -i "${LAST_IMPORT}a from voice_module import add_voice_features" app_flask.py
    fi
fi

# Now add voice routes integration
if grep -q "add_voice_features(app)" app_flask.py; then
    echo "! Voice features already integrated"
else
    # Find where Q&A routes are added
    QA_LINE=$(grep -n "add_qa_routes(app)" app_flask.py | cut -d: -f1)
    
    if [ -n "$QA_LINE" ]; then
        # Add voice features after Q&A routes
        sed -i "${QA_LINE}a app = add_voice_features(app)" app_flask.py
        echo "✓ Added voice features integration"
    else
        echo "! Could not find Q&A routes. Please add manually: app = add_voice_features(app)"
    fi
fi

# Restart Smart-Doc
echo ""
echo "Restarting Smart-Doc..."
pm2 restart smart-doc

# Wait a moment
sleep 3

# Check status
echo ""
echo "Checking Smart-Doc status..."
pm2 status smart-doc

# Show logs
echo ""
echo "Recent logs:"
pm2 logs smart-doc --lines 20

echo ""
echo "✅ Voice module fix complete!"
echo ""
echo "New endpoints available:"
echo "- GET  /voice-chat                - Voice chat interface"
echo "- POST /api/voice/transcribe      - Speech to text"
echo "- POST /api/voice/speak           - Text to speech"  
echo "- POST /api/voice/conversation    - Full voice conversation"
echo "- GET  /api/voice/audio/<file>    - Audio file serving"
echo ""
echo "Test the voice chat at: http://146.190.39.214:3003/voice-chat"
SCRIPT

echo "✅ Created fix-voice-module.sh"
echo ""
echo "Now run:"
echo "bash fix-voice-module.sh"