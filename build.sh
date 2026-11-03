#!/bin/bash
# Rebuild lib/ from src/: asset factories (plain esbuild bundles) + the
# React review app. three stays vendored under vendor/ (importmap).
set -e
cd "$(dirname "$0")"
ESB=$(command -v esbuild || echo "npx --yes esbuild")
for f in createSwallowtailBoard createSkis createSnowboardBinding createSkiBinding createBootLast createRiderFigure riderSpec gameGear; do
  $ESB "src/$f.ts" --bundle --format=esm --outfile="lib/$f.js" --external:three
done
$ESB src/app/main.tsx --bundle --format=esm --outfile=lib/app.js --jsx=automatic --define:process.env.NODE_ENV='"production"' --minify --external:three --external:three/addons/*
echo "lib/ rebuilt (factories + React app)"
