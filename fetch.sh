#!/bin/sh
set -e

# 5.0.1 is the most recent version that works with the
# old version of Python in the Bullseye-based Docker image
# (TODO: test with newer SDKs and/or without Docker)
EMSDK_INSTALLER_VERSION=${EMSDK_INSTALLER_VERSION:="5.0.1"}
EMSDK_VERSION=${EMSDK_VERSION:="3.1.55"}

VLCJS_SOURCE=${VLCJS_SOURCE:="https://github.com/queenkjuul/vlc.js"}
VLCJS_BRANCH=${VLCJS_BRANCH:="main"}

VLC_SOURCE=${VLC_SOURCE:="https://github.com/queenkjuul/vlc"}
VLC_BRANCH=${VLC_BRANCH:="wasm-emscripten-dvd-discodeck"}

START=$PWD

if [ ! -d vlc.js ]; then
  echo "vlc-js: upstream VLC.js source not present, fetching."
  git clone "$VLCJS_SOURCE"
fi

VLCJS="$PWD/vlc.js"
cd "$VLCJS"

git checkout "$VLCJS_BRANCH"

if [ ! -d emsdk ]; then
  git clone http://github.com/emscripten-core/emsdk.git emsdk
fi
cd emsdk
git checkout "$EMSDK_INSTALLER_VERSION"
./emsdk update-tags
./emsdk install "$EMSDK_VERSION"
./emsdk activate "$EMSDK_VERSION"

cd "$VLCJS"

if [ ! -d vlc ]; then
  echo "vlc-js: upstream VLC source is not present, fetching."
  git clone "$VLC_SOURCE"
  cd vlc
  git checkout "$VLC_BRANCH"
fi

cd "$START"