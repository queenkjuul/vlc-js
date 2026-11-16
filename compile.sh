#!/bin/sh
set -e

START=$PWD
VLCJS_BRANCH=${VLCJS_BRANCH:="main"}

export SOURCEMAP_HOST=${SOURCEMAP_HOST:="http://localhost:5173"}

./fetch.sh
cd vlc.js
git checkout "$VLCJS_BRANCH"

if [ "$1" = "main" ]; then
  ./create_main.sh
else
  ./compile.sh
fi

cd "$START"
cp vlc.js/vlc.js \
  vlc.js/vlc.wasm \
  vlc.js/vlc.worker.js \
  vlc.js/libvlc.d.ts \
  vlc.js/libvlc_events.ts \
  vlc.js/vlc/modules/audio_output/webaudio/audio-worklet-processor.js \
  src/vlc/
