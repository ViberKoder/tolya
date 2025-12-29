#!/bin/bash

# Jetton Minter 2.0 - Setup Script

set -e

echo "🚀 Jetton Minter 2.0 - Setup Script"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old (found v$NODE_VERSION)"
    echo "Please upgrade to Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check for FunC compiler
if command -v func &> /dev/null; then
    echo "✅ FunC compiler detected"
    echo ""
    
    # Compile contracts
    echo "🔨 Compiling smart contracts..."
    chmod +x scripts/compile.sh
    ./scripts/compile.sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Contracts compiled successfully"
    else
        echo "⚠️  Contract compilation failed"
        echo "You can still run the frontend, but contracts won't work until compiled"
    fi
else
    echo "⚠️  FunC compiler not found"
    echo "Install from: https://docs.ton.org/develop/func/installation"
    echo "You can still run the frontend, but contracts won't work until compiled"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env.local and configure"
echo "  2. Run 'npm run dev' to start development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see README.md and INSTRUCTIONS.md"
