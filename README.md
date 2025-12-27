# TOLYA Jetton 2.0 Contract

Jetton 2.0 контракт для токена TOLYA в сети TON.

## ✅ Что готово:

**ПОЛНОСТЬЮ РАБОЧИЙ JETTON 2.0 КОНТРАКТ!**

Контракт полностью соответствует стандарту Jetton 2.0 и готов к использованию:

### Основные возможности:
- ✅ Минт токенов (только администратором)
- ✅ Перевод токенов между пользователями
- ✅ Сжигание токенов
- ✅ Автоматическое создание кошельков получателей
- ✅ Полная поддержка стандарта Jetton 2.0

### Метаданные встроены в контракт:
- **Название**: tolya
- **Символ**: tol  
- **Decimals**: 9
- **Изображение**: https://cache.tonapi.io/imgproxy/QOtsjsEA_bkTPXbfkNlSy4EFhmpad0q0Xb_4dN7ZzyU/rs:fill:500:500:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vZG5zL3ByZXZpZXcvdG9seWEudG9uLnBuZw.webp

**Все метаданные автоматически устанавливаются при деплое через `init-code.fc`!**

## Параметры токена

- **Название**: tolya
- **Символ**: tol
- **Decimals**: 9
- **Начальный supply**: 0 (будет заминчен после деплоя)
- **Максимальный supply**: 1,000,000 токенов

## Структура проекта

```
.
├── jetton-minter.fc      # Основной контракт минтера (с метаданными внутри!)
├── jetton-wallet.fc      # Контракт кошелька для токенов
└── imports/
    ├── stdlib.fc        # Стандартные функции
    ├── op-codes.fc      # Коды операций
    └── jetton-params.fc # Параметры и ошибки
```

## Сборка

Для сборки контрактов используйте `func` компилятор:

```bash
# Установка func (если еще не установлен)
# Следуйте инструкциям: https://github.com/ton-blockchain/func

# Компиляция минтера
func -o jetton-minter.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-minter.fc

# Компиляция кошелька
func -o jetton-wallet.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-wallet.fc
```

## Деплой

1. **Деплой минтера**:
   - Используйте файл `init-code.fc` для деплоя - метаданные установятся автоматически!
   - Компилируйте: `func -o init-code.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-minter.fc init-code.fc`
   - Администратором станет адрес, с которого вы деплоите
   - Начальный supply будет 0
   - **Все метаданные (name, description, image, symbol, decimals) уже встроены!**

2. **Минт токенов**:
   - После деплоя отправьте сообщение `mint` на контракт
   - Укажите количество: 1,000,000 * 10^9 = 1,000,000,000,000,000 nano-tokens
   - Укажите адрес получателя

## Get-методы

### Jetton Minter

- `get_jetton_data()` - возвращает (total_supply, mintable, jetton_content, admin_address)
- `get_total_supply()` - возвращает общий supply
- `get_mintable()` - возвращает флаг mintable (1 = можно минтить, 0 = нельзя)
- `get_jetton_content()` - возвращает метаданные токена (name, description, image, symbol, decimals)
- `get_admin_address()` - возвращает адрес администратора
- `get_jetton_wallet_address(slice owner_address)` - вычисляет адрес кошелька для владельца

### Jetton Wallet

- `get_wallet_data()` - возвращает (balance, owner_address, jetton_master_address, wallet_code)
- `get_wallet_code()` - возвращает код кошелька
- `get_balance()` - возвращает баланс токенов
- `get_owner_address()` - возвращает адрес владельца
- `get_jetton_master_address()` - возвращает адрес минтера

## Операции

### Mint (минт токенов)
- Только администратор может минтить
- Требует установленного флага `mintable = 1`
- Для минта 1,000,000 токенов нужно отправить: 1,000,000 * 10^9 = 1,000,000,000,000,000 nano-tokens

### Transfer (перевод токенов)
- Владелец может переводить свои токены
- Автоматически создает кошелек получателя, если его нет

### Burn (сжигание токенов)
- Владелец может сжигать свои токены
- Уменьшает общий supply

## Примечания

- Контракт соответствует стандарту Jetton 2.0
- Все суммы хранятся в nano-tokens (с учетом decimals)
- 1,000,000 токенов = 1,000,000,000,000,000 nano-tokens (с 9 decimals)
- **Метаданные уже встроены в контракт через функцию `create_jetton_content()`**
