#!/bin/bash
set -e
echo "SAAQ Prep B++ Setup"
echo ""
echo "[1/3] Installation..."
npm install --silent
echo "[2/3] Build..."
npm run build
echo "[3/3] Pret."
echo "Test local: npm run preview"
echo "Deploy Vercel: npm i -g vercel && vercel"
