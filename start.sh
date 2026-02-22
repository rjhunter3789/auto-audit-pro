#!/bin/bash

# Set Chrome binary path if available
if [ -f "/nix/var/nix/profiles/default/bin/chromium" ]; then
    export CHROME_BIN="/nix/var/nix/profiles/default/bin/chromium"
elif [ -f "/usr/bin/chromium" ]; then
    export CHROME_BIN="/usr/bin/chromium"
elif [ -f "/usr/bin/google-chrome" ]; then
    export CHROME_BIN="/usr/bin/google-chrome"
fi

# Start the Node.js application
exec node server.js