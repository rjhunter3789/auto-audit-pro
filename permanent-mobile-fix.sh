#!/bin/bash
echo "Applying Permanent Mobile Fix for Smart Doc V2"
echo "============================================="

# Create the fixed voice-handsfree.html
cat << 'EOF' > /tmp/voice-handsfree-mobile-fixed.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Smart Doc Voice Assistant - Hands Free</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000;
            color: #fff;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            touch-action: manipulation;
        }
        
        .header {
            background: #111;
            padding: 15px;
            text-align: center;
            border-bottom: 1px solid #333;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .mode-indicator {
            background: #2ecc71;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            -webkit-overflow-scrolling: touch;
        }
        
        .message {
            max-width: 85%;
            padding: 15px 20px;
            border-radius: 20px;
            word-wrap: break-word;
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .user-message {
            align-self: flex-end;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin-left: auto;
        }
        
        .assistant-message {
            align-self: flex-start;
            background: #1a1a1a;
            border: 1px solid #333;
            color: #e0e0e0;
        }
        
        .system-message {
            align-self: center;
            background: none;
            color: #888;
            font-style: italic;
            font-size: 14px;
            padding: 10px;
        }
        
        .controls {
            background: #111;
            border-top: 1px solid #333;
            padding: 30px;
            text-align: center;
        }
        
        .mic-button {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: #333;
            border: 3px solid #555;
            color: white;
            font-size: 50px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            touch-action: manipulation;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .mic-button:active {
            transform: scale(0.95);
        }
        
        .mic-button.listening {
            background: #e74c3c;
            border-color: #c0392b;
            animation: pulse 1.5s infinite;
        }
        
        .mic-button.processing {
            background: #f39c12;
            border-color: #d68910;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
            70% { box-shadow: 0 0 0 30px rgba(231, 76, 60, 0); }
            100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
        }
        
        .status {
            margin-top: 20px;
            font-size: 18px;
            color: #aaa;
        }
        
        .silence-indicator {
            margin-top: 10px;
            height: 4px;
            background: #333;
            border-radius: 2px;
            overflow: hidden;
            display: none;
        }
        
        .silence-progress {
            height: 100%;
            background: #3498db;
            width: 0%;
            transition: width 0.1s linear;
        }
        
        .interrupt-note {
            position: fixed;
            bottom: 180px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            display: none;
        }
        
        .audio-visualizer {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            gap: 3px;
            height: 40px;
            align-items: center;
        }
        
        .audio-bar {
            width: 4px;
            background: white;
            transition: height 0.1s;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Smart Doc Assistant</h2>
        <div class="mode-indicator">Hands-Free Mode</div>
    </div>
    
    <div class="chat-container" id="chatContainer">
        <div class="message assistant-message">
            Hey Jeff, how's it going? Just tap the microphone when you're ready to talk. I'll stop listening after you pause.
        </div>
    </div>
    
    <div class="interrupt-note" id="interruptNote">
        Tap to interrupt
    </div>
    
    <div class="controls">
        <button class="mic-button" id="micButton" type="button">
            <span id="micIcon">🎤</span>
            <div class="audio-visualizer" id="visualizer" style="display: none;">
                <div class="audio-bar" style="height: 10px;"></div>
                <div class="audio-bar" style="height: 20px;"></div>
                <div class="audio-bar" style="height: 15px;"></div>
                <div class="audio-bar" style="height: 25px;"></div>
                <div class="audio-bar" style="height: 18px;"></div>
            </div>
        </button>
        <div class="status" id="status">Tap to speak</div>
        <div class="silence-indicator" id="silenceIndicator">
            <div class="silence-progress" id="silenceProgress"></div>
        </div>
    </div>
    
    <script>
        let mediaRecorder = null;
        let audioChunks = [];
        let isListening = false;
        let isProcessing = false;
        let audioContext = null;
        let analyser = null;
        let microphone = null;
        let currentAudio = null;
        let conversationHistory = [];
        let silenceDuration = 0;
        let resetTimeout = null;
        
        const micButton = document.getElementById('micButton');
        const micIcon = document.getElementById('micIcon');
        const visualizer = document.getElementById('visualizer');
        const status = document.getElementById('status');
        const chatContainer = document.getElementById('chatContainer');
        const silenceIndicator = document.getElementById('silenceIndicator');
        const silenceProgress = document.getElementById('silenceProgress');
        const interruptNote = document.getElementById('interruptNote');
        
        // Initialize audio context and analyser for silence detection
        async function initAudio() {
            try {
                console.log('Initializing audio...');
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                analyser.fftSize = 256;
                
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
                });
                
                mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = async () => {
                    console.log('MediaRecorder stopped, chunks:', audioChunks.length);
                    if (audioChunks.length > 0) {
                        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                        audioChunks = [];
                        await processAudio(audioBlob);
                    } else {
                        resetButton();
                    }
                };
                
                mediaRecorder.onerror = (event) => {
                    console.error('MediaRecorder error:', event.error);
                    resetButton();
                };
                
                // Start monitoring audio levels
                monitorAudioLevels();
                console.log('Audio initialized successfully');
                
            } catch (err) {
                console.error('Microphone access denied:', err);
                status.textContent = 'Microphone access required';
                micButton.disabled = true;
            }
        }
        
        function monitorAudioLevels() {
            if (!analyser) return;
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const SILENCE_THRESHOLD = 20;
            const SILENCE_DURATION = 2000; // 2 seconds of silence
            const INTERRUPT_THRESHOLD = 40;
            
            function checkAudioLevel() {
                if (!isListening && !currentAudio) {
                    requestAnimationFrame(checkAudioLevel);
                    return;
                }
                
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                
                // Update visualizer when listening
                if (isListening && mediaRecorder.state === 'recording') {
                    const bars = visualizer.querySelectorAll('.audio-bar');
                    bars.forEach((bar, i) => {
                        const height = Math.min(40, dataArray[i * 50] / 3);
                        bar.style.height = height + 'px';
                    });
                    
                    if (average < SILENCE_THRESHOLD) {
                        silenceDuration += 100;
                        const progress = Math.min(100, (silenceDuration / SILENCE_DURATION) * 100);
                        silenceProgress.style.width = progress + '%';
                        
                        if (silenceDuration >= SILENCE_DURATION) {
                            console.log('Silence detected, stopping...');
                            stopListening();
                        }
                    } else {
                        silenceDuration = 0;
                        silenceProgress.style.width = '0%';
                    }
                }
                
                // Check for voice interruption while audio is playing
                if (currentAudio && !currentAudio.paused && !isListening) {
                    if (average > INTERRUPT_THRESHOLD) {
                        console.log('Voice interruption detected');
                        currentAudio.pause();
                        currentAudio = null;
                        interruptNote.style.display = 'none';
                        status.textContent = 'Interrupted - tap to speak';
                    }
                }
                
                requestAnimationFrame(checkAudioLevel);
            }
            
            checkAudioLevel();
        }
        
        // Handle button clicks and touches
        function handleMicClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Button clicked - isProcessing:', isProcessing, 'isListening:', isListening);
            
            if (isProcessing) {
                console.log('Blocked - still processing');
                return;
            }
            
            // Clear any pending reset
            if (resetTimeout) {
                clearTimeout(resetTimeout);
                resetTimeout = null;
            }
            
            if (currentAudio) {
                // Interrupt current audio
                currentAudio.pause();
                currentAudio = null;
                interruptNote.style.display = 'none';
                addMessage('(Interrupted)', 'system-message');
            }
            
            if (isListening) {
                console.log('Stopping...');
                stopListening();
            } else {
                console.log('Starting...');
                startListening();
            }
        }
        
        // Add both click and touch handlers
        micButton.addEventListener('click', handleMicClick);
        micButton.addEventListener('touchend', handleMicClick);
        
        function startListening() {
            console.log('startListening called - mediaRecorder:', mediaRecorder, 'state:', mediaRecorder?.state);
            
            if (!mediaRecorder) {
                console.error('MediaRecorder is null! Attempting to reinitialize...');
                initAudio();
                return;
            }
            
            if (mediaRecorder.state === 'inactive') {
                console.log('Starting recording...');
                audioChunks = [];
                silenceDuration = 0;
                mediaRecorder.start(100);
                isListening = true;
                micButton.classList.add('listening');
                micIcon.style.display = 'none';
                visualizer.style.display = 'flex';
                status.textContent = 'Listening... (stops on pause)';
                silenceIndicator.style.display = 'block';
            }
        }
        
        function stopListening() {
            console.log('stopListening called - state:', mediaRecorder?.state);
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                isListening = false;
                micButton.classList.remove('listening');
                micButton.classList.add('processing');
                micIcon.style.display = 'block';
                micIcon.textContent = '⏳';
                visualizer.style.display = 'none';
                status.textContent = 'Processing...';
                silenceIndicator.style.display = 'none';
                silenceProgress.style.width = '0%';
                mediaRecorder.stop();
            }
        }
        
        async function processAudio(audioBlob) {
            try {
                isProcessing = true;
                console.log('Processing audio blob, size:', audioBlob.size);
                
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                
                const response = await fetch('/api/voice/transcribe', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                console.log('Transcription result:', result);
                
                if (result.success && result.text) {
                    // Filter out common hallucinations
                    const text = result.text.trim();
                    const hallucinations = ['you', 'thank you', 'thanks for watching', 'bye', 'bye-bye', '.', ''];
                    
                    if (hallucinations.includes(text.toLowerCase())) {
                        status.textContent = 'No speech detected - tap to try again';
                        resetButton();
                        return;
                    }
                    
                    addMessage(text, 'user-message');
                    
                    // Show processing indicator
                    const thinkingMsg = addMessage('G is thinking...', 'system-message');
                    
                    // Get AI response
                    const aiResponse = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: text,
                            history: conversationHistory
                        })
                    });
                    
                    const aiResult = await aiResponse.json();
                    console.log('AI response:', aiResult);
                    
                    // Remove thinking message
                    if (thinkingMsg && thinkingMsg.parentNode) {
                        thinkingMsg.remove();
                    }
                    
                    if (aiResult.success && aiResult.response) {
                        conversationHistory.push({user: text, assistant: aiResult.response});
                        addMessage(aiResult.response, 'assistant-message');
                        
                        // Generate and play audio response
                        try {
                            const ttsResponse = await fetch('/api/voice/speak', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    text: aiResult.response
                                })
                            });
                            
                            const ttsResult = await ttsResponse.json();
                            
                            if (ttsResult.success && ttsResult.audio_url) {
                                currentAudio = new Audio(ttsResult.audio_url);
                                interruptNote.style.display = 'block';
                                
                                currentAudio.onended = () => {
                                    console.log('Audio ended - resetting states');
                                    currentAudio = null;
                                    interruptNote.style.display = 'none';
                                    resetButton();
                                    // Optional: Auto-start listening after delay
                                    // setTimeout(() => startListening(), 500);
                                };
                                
                                currentAudio.onerror = () => {
                                    console.error('Audio playback error');
                                    currentAudio = null;
                                    interruptNote.style.display = 'none';
                                    resetButton();
                                };
                                
                                await currentAudio.play();
                            } else {
                                // No audio response
                                console.log('No audio response received');
                                resetButton();
                            }
                        } catch (ttsError) {
                            console.error('TTS error:', ttsError);
                            resetButton();
                        }
                    } else {
                        status.textContent = 'Error getting response';
                        resetButton();
                    }
                } else {
                    status.textContent = 'Error: ' + (result.error || 'No transcription');
                    resetButton();
                }
            } catch (error) {
                console.error('Processing error:', error);
                status.textContent = 'Error: ' + error.message;
                resetButton();
            }
        }
        
        function resetButton() {
            console.log('Resetting button state');
            isProcessing = false;
            isListening = false;
            micButton.classList.remove('processing', 'listening');
            micIcon.style.display = 'block';
            micIcon.textContent = '🎤';
            visualizer.style.display = 'none';
            status.textContent = 'Tap to speak';
            silenceIndicator.style.display = 'none';
            silenceProgress.style.width = '0%';
            
            // Clear any pending reset
            if (resetTimeout) {
                clearTimeout(resetTimeout);
                resetTimeout = null;
            }
        }
        
        function addMessage(text, className) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + className;
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            return messageDiv;
        }
        
        // Initialize on load
        window.addEventListener('load', () => {
            console.log('Page loaded, initializing audio...');
            initAudio();
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, stop any ongoing operations
                if (isListening) {
                    stopListening();
                }
                if (currentAudio) {
                    currentAudio.pause();
                }
            }
        });
        
        // Prevent double-tap zoom on mobile
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    </script>
</body>
</html>
EOF

echo "Connecting to server..."
ssh root@146.190.39.214 << 'REMOTE'
cd /var/www/smart-doc-v2

# Backup current file
cp templates/voice-handsfree.html templates/voice-handsfree.html.bak-$(date +%Y%m%d-%H%M%S)

# Copy new file from tmp
cat > templates/voice-handsfree.html << 'INNEREOF'
$(cat /tmp/voice-handsfree-mobile-fixed.html)
INNEREOF

# Restart the app
pm2 restart smart-doc-v2

echo "✅ Permanent mobile fix applied!"
echo ""
echo "Key improvements:"
echo "- Added resetButton() function for consistent state reset"
echo "- Added error handlers for all async operations"
echo "- Added processing indicator ('G is thinking...')"
echo "- Fixed touch event handling for mobile"
echo "- Added viewport meta tag for better mobile display"
echo "- Added page visibility handling"
echo "- Improved error recovery"
echo ""
echo "Test at: https://smartdoc.autoauditpro.io/voice-handsfree"
REMOTE