#!/bin/bash
echo "Disabling Auto-Stop Feature in Voice-Handsfree"
echo "============================================="

# Create the fix commands
cat << 'EOF' > /tmp/disable-auto-stop-commands.txt
# Connect to server
ssh root@146.190.39.214

# Navigate to directory
cd /var/www/smart-doc-v2

# Edit the file and comment out the silence detection
nano templates/voice-handsfree.html

# Instructions:
# 1. Press Ctrl+_ (underscore) to go to line
# 2. Type: 333
# 3. Press Enter
# 4. Comment out lines 333-344 by adding // at the beginning of each line:
#
#    // if (average < SILENCE_THRESHOLD) {
#    //     silenceDuration += 16;
#    //     const progress = Math.min(100, (silenceDuration / SILENCE_DURATION) * 100);
#    //     silenceProgress.style.width = progress + '%';
#    //     
#    //     if (silenceDuration >= SILENCE_DURATION) {
#    //         stopListening();
#    //     }
#    // } else {
#    //     silenceDuration = 0;
#    //     silenceProgress.style.width = '0%';
#    // }
#
# 5. Press Ctrl+X to exit
# 6. Press Y to save
# 7. Press Enter to confirm
#
# 8. Restart the application:
pm2 restart smart-doc-v2

# 9. Test at: https://smartdoc.autoauditpro.io/voice-handsfree
EOF

echo "Commands saved to /tmp/disable-auto-stop-commands.txt"
echo ""
echo "To apply this fix:"
echo "1. Copy and run each command from the file above"
echo "2. Follow the nano editing instructions carefully"
echo "3. This will disable automatic silence detection"
echo "4. Recording will be tap-to-start, tap-to-stop"
echo ""
echo "Current Status:"
echo "- Audio analyser shows 0 levels (bug)"
echo "- This causes immediate silence detection"
echo "- Disabling auto-stop is a workaround"
echo ""
echo "What this does:"
echo "- Comments out the silence detection code"
echo "- Keeps the audio level monitoring active"
echo "- Allows manual control of recording"