#!/bin/bash
# Rebuild lib/ from src/ (needs esbuild on PATH or via npx).
set -e
cd "$(dirname "$0")"
ESB=$(command -v esbuild || echo "npx --yes esbuild")
for f in createSwallowtailBoard createSkis createSnowboardBinding createSkiBinding createBootLast createRiderFigure riderSpec; do
  $ESB "src/$f.ts" --bundle --format=esm --outfile="lib/$f.js" --external:three
done
echo "lib/ rebuilt"
