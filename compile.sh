#!/bin/bash

# Скрипт для компиляции Jetton 2.0 контрактов

set -e

echo "🔨 Компиляция Jetton Wallet..."
func -o build/jetton-wallet.fif -SPA \
  imports/stdlib.fc \
  imports/op-codes.fc \
  imports/jetton-params.fc \
  jetton-wallet.fc

echo "✅ Jetton Wallet скомпилирован: build/jetton-wallet.fif"

echo ""
echo "🔨 Компиляция Jetton Minter..."
func -o build/jetton-minter.fif -SPA \
  imports/stdlib.fc \
  imports/op-codes.fc \
  imports/jetton-params.fc \
  jetton-minter.fc

echo "✅ Jetton Minter скомпилирован: build/jetton-minter.fif"

echo ""
echo "🎉 Компиляция завершена успешно!"
echo ""
echo "Следующие шаги:"
echo "1. Создайте метаданные токена (см. metadata-example.json)"
echo "2. Деплойте контракт в сеть TON"
echo "3. Заминтите начальный supply токенов"
