#!/bin/bash
cd "$(dirname "$0")"
echo "Deploying WFR Field to Vercel..."
npx vercel --prod --yes
echo ""
echo "Done! Press any key to close."
read -n 1
