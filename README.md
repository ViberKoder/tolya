# Jetton 2.0 - TON Blockchain Token

Полнофункциональный Jetton 2.0 контракт для блокчейна TON, соответствующий стандарту TEP-74.

## 🎯 Что это?

Jetton - это стандарт взаимозаменяемых токенов на блокчейне TON (аналог ERC-20 в Ethereum). Этот проект содержит:

- **jetton-minter.fc** - Мастер-контракт токена (управляет эмиссией и метаданными)
- **jetton-wallet.fc** - Контракт кошелька пользователя (хранит баланс)

## ✨ Токен TOLYA

По умолчанию контракт настроен для токена TOLYA:

| Параметр | Значение |
|----------|----------|
| Название | tolya |
| Символ | TOL |
| Decimals | 9 |
| Изображение | [TON DNS Preview](https://cache.tonapi.io/imgproxy/...) |

## 📁 Структура проекта

```
.
├── jetton-minter.fc           # Мастер-контракт Jetton
├── jetton-wallet.fc           # Контракт кошелька
├── imports/
│   ├── stdlib.fc              # Стандартная библиотека FunC
│   ├── op-codes.fc            # Коды операций
│   └── jetton-params.fc       # Параметры и коды ошибок
├── wrappers/
│   ├── JettonMinter.ts        # TypeScript wrapper для мастера
│   ├── JettonMinter.compile.ts
│   ├── JettonWallet.ts        # TypeScript wrapper для кошелька
│   └── JettonWallet.compile.ts
├── scripts/
│   ├── deployJettonMinter.ts  # Скрипт деплоя
│   └── mintJettons.ts         # Скрипт минта токенов
├── tests/
│   └── JettonMinter.spec.ts   # Тесты контрактов
├── package.json
├── tsconfig.json
└── blueprint.config.ts
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Компиляция контрактов

С использованием Blueprint:

```bash
npx blueprint build
```

Или напрямую через FunC компилятор:

```bash
# Компиляция мастер-контракта
func -o jetton-minter.fif -SPA \
  imports/stdlib.fc \
  imports/op-codes.fc \
  imports/jetton-params.fc \
  jetton-minter.fc

# Компиляция контракта кошелька
func -o jetton-wallet.fif -SPA \
  imports/stdlib.fc \
  imports/op-codes.fc \
  imports/jetton-params.fc \
  jetton-wallet.fc
```

### 3. Тестирование

```bash
npm test
```

### 4. Деплой

```bash
# Деплой в testnet
npx blueprint run deployJettonMinter --testnet

# Деплой в mainnet
npx blueprint run deployJettonMinter --mainnet
```

## 📖 Операции

### Minter (Мастер-контракт)

| Операция | Op-code | Описание |
|----------|---------|----------|
| mint | 21 | Минт новых токенов (только admin) |
| burn_notification | 0x7bdd97de | Уведомление о сжигании |
| change_admin | 3 | Смена администратора |
| change_content | 4 | Изменение метаданных |
| provide_wallet_address | 0x2c76b973 | Запрос адреса кошелька |

### Wallet (Кошелек)

| Операция | Op-code | Описание |
|----------|---------|----------|
| transfer | 0xf8a7ea5 | Перевод токенов |
| internal_transfer | 0x178d4519 | Внутренний перевод (от мастера) |
| burn | 0x595f07bc | Сжигание токенов |

## 🔧 Get-методы

### Minter

```typescript
// Получить данные токена
get_jetton_data() -> (total_supply, mintable, admin_address, content, wallet_code)

// Получить адрес кошелька владельца
get_wallet_address(owner_address) -> wallet_address
```

### Wallet

```typescript
// Получить данные кошелька
get_wallet_data() -> (balance, owner_address, master_address, wallet_code)
```

## 💡 Использование через TypeScript

### Минт токенов

```typescript
import { JettonMinter } from './wrappers/JettonMinter';
import { toNano, Address } from '@ton/core';

// Подключение к существующему мастер-контракту
const minter = JettonMinter.createFromAddress(Address.parse('EQ...'));

// Минт 1,000,000 токенов
await minter.sendMint(provider, sender, {
    toAddress: recipientAddress,
    jettonAmount: toNano('1000000'), // 1M токенов * 10^9
    forwardTonAmount: toNano('0.01'),
    totalTonAmount: toNano('0.05'),
});
```

### Перевод токенов

```typescript
import { JettonWallet } from './wrappers/JettonWallet';

const wallet = JettonWallet.createFromAddress(walletAddress);

await wallet.sendTransfer(provider, sender, {
    toAddress: recipientAddress,
    jettonAmount: toNano('100'), // 100 токенов
    forwardTonAmount: toNano('0.01'),
});
```

### Сжигание токенов

```typescript
await wallet.sendBurn(provider, sender, {
    jettonAmount: toNano('50'), // 50 токенов
    responseAddress: myAddress,
});
```

## 🔐 Безопасность

- Только администратор может минтить токены
- Только владелец кошелька может переводить/сжигать свои токены
- Контракты проверяют валидность адресов отправителей
- Bounced сообщения корректно обрабатываются (токены возвращаются)

## 📝 Изменение метаданных

Для изменения метаданных токена отредактируйте файл `wrappers/JettonMinter.ts`:

```typescript
const JETTON_METADATA = {
    name: 'Your Token Name',
    description: 'Your token description',
    image: 'https://your-image-url.com/token.png',
    symbol: 'YOUR',
    decimals: '9',
};
```

Или после деплоя используйте операцию `change_content`:

```typescript
await minter.sendChangeContent(provider, sender, newContentCell);
```

## 🌐 Сети

| Сеть | Endpoint |
|------|----------|
| Mainnet | https://toncenter.com/api/v2/jsonRPC |
| Testnet | https://testnet.toncenter.com/api/v2/jsonRPC |

## 📚 Ресурсы

- [TEP-74: Jettons Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [TEP-64: Token Data Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)
- [TON Blueprint](https://github.com/ton-org/blueprint)
- [TON Documentation](https://docs.ton.org/)

## 📄 Лицензия

MIT
