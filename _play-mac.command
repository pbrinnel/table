#!/bin/bash
# Double-click in Finder to run the game locally. Close the window to stop it.
# The leading _ keeps this file off the published site.

PORT=8913
URL="http://localhost:$PORT/"

cd "$(dirname "$0")" || exit 1

# Finder starts this without your shell's setup, so look where Node usually is.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

if ! command -v npx >/dev/null 2>&1; then
    echo "This needs Node.js. Install the LTS version from https://nodejs.org, then try again."
    read -n 1 -s -r -p "Press any key to close."
    exit 1
fi

# A second double-click shouldn't fail on the busy port; just open the page.
if curl -s -o /dev/null "$URL"; then
    echo "Already running at $URL"
    open "$URL"
    exit 0
fi

echo "Game:     $URL"
echo "Sliders:  ${URL}_labs/tune.html"
echo "Close this window, or press Ctrl+C, to stop."
echo
npx --yes http-server . -p "$PORT" -c-1 -o /
