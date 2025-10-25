// Fix for Smart Doc V2 Audio Analyser Issue
// Problem: Audio analyser shows 0 levels even though recording works
// Solution: Use separate streams for recording and analysis

async function initAudio() {
    try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') return;
        
        console.log('Requesting microphone...');
        status.textContent = 'Getting microphone...';
        
        // Get the audio stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        console.log('Got media stream');
        status.textContent = 'Microphone ready';
        
        // Clone the stream - one for recording, one for analysis
        const recordingStream = stream.clone();
        const analysisStream = stream.clone();
        
        // Create audio context and analyser with the analysis stream
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created, state:', audioContext.state);
            
            // Resume context if suspended (iOS requirement)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
                console.log('Audio context resumed');
            }
        }
        
        // Setup audio analysis with dedicated stream
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        // Create source from analysis stream
        microphone = audioContext.createMediaStreamSource(analysisStream);
        microphone.connect(analyser);
        console.log('Audio analysis setup complete');
        
        // Test the analyser
        const testData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(testData);
        const sum = testData.reduce((a, b) => a + b, 0);
        console.log('Initial audio test - sum:', sum, 'max:', Math.max(...testData));
        
        // Create MediaRecorder with recording stream (no format for compatibility)
        mediaRecorder = new MediaRecorder(recordingStream);
        console.log('MediaRecorder created with separate stream');
        
        mediaRecorder.ondataavailable = event => {
            console.log('Data available:', event.data.size);
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log('MediaRecorder stopped, chunks:', audioChunks.length);
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                console.log('Created blob, size:', audioBlob.size, 'type:', audioBlob.type);
                audioChunks = [];
                await processAudio(audioBlob);
            } else {
                console.log('No audio chunks recorded');
                resetButton();
            }
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            resetButton();
        };
        
        // Start monitoring audio levels
        monitorAudioLevels();
        console.log('Audio initialization complete');
        
    } catch (err) {
        console.error('Microphone access error:', err);
        status.textContent = 'Microphone access required';
        micButton.disabled = true;
    }
}

// Alternative fix if cloning doesn't work - use Web Audio API recorder
async function initAudioWithWorklet() {
    try {
        console.log('Initializing audio with AudioWorklet approach...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        // Create source and connect to analyser
        microphone = audioContext.createMediaStreamSource(stream);
        
        // Create a gain node to split the signal
        const splitter = audioContext.createGain();
        splitter.gain.value = 1;
        
        // Connect microphone -> splitter -> analyser
        microphone.connect(splitter);
        splitter.connect(analyser);
        
        // Also connect to destination for monitoring (optional)
        // splitter.connect(audioContext.destination);
        
        // Create MediaRecorder from the original stream
        mediaRecorder = new MediaRecorder(stream);
        
        // Rest of setup...
    } catch (err) {
        console.error('Audio initialization failed:', err);
    }
}

// Debug function to continuously log audio levels
function debugAudioLevels() {
    if (!analyser) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const max = Math.max(...dataArray);
        console.log('Audio levels - Average:', average.toFixed(2), 'Max:', max);
    }, 1000);
}