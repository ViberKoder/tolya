#!/bin/bash

# Script to compile Jetton 2.0 contracts

set -e

echo "🔨 Compiling Jetton 2.0 contracts..."

# Create build directory
mkdir -p build

# Compile Jetton Minter
echo "📝 Compiling jetton-minter-v2.fc..."
func -o build/jetton-minter.fif -SPA \
  contracts/imports/stdlib.fc \
  contracts/imports/op-codes.fc \
  contracts/imports/jetton-params.fc \
  contracts/jetton-minter-v2.fc

# Compile Jetton Wallet
echo "📝 Compiling jetton-wallet-v2.fc..."
func -o build/jetton-wallet.fif -SPA \
  contracts/imports/stdlib.fc \
  contracts/imports/op-codes.fc \
  contracts/imports/jetton-params.fc \
  contracts/jetton-wallet-v2.fc

echo "✅ Compilation complete!"
echo "📦 Output files:"
echo "   - build/jetton-minter.fif"
echo "   - build/jetton-wallet.fif"
