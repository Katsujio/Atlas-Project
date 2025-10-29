
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../frontend"
npm create vite@latest . -- --template react
npm i
echo "Vite app created in ./frontend. Run: npm run dev"
