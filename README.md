# Jetton 2.0 на TON

> 🎯 **Новичок?** Начните с [START_HERE.md](START_HERE.md)  
> 🚀 **Быстрый старт?** Читайте [QUICKSTART.md](QUICKSTART.md)

Полностью рабочая реализация стандарта Jetton 2.0 (TEP-74) для блокчейна TON.

## 📋 Что это?

Jetton 2.0 - это обновленный стандарт для создания взаимозаменяемых токенов (fungible tokens) в сети TON. Этот контракт включает:

- ✅ **Jetton Minter** - главный контракт для управления токеном
- ✅ **Jetton Wallet** - контракт кошелька для хранения токенов пользователей
- ✅ Полная поддержка стандарта TEP-74
- ✅ Оптимизированный расход газа
- ✅ Безопасная обработка ошибок

## 📁 Структура проекта

```
/workspace/
├── jetton-minter.fc         # Контракт минтера
├── jetton-wallet.fc         # Контракт кошелька
├── imports/
│   ├── stdlib.fc           # Стандартная библиотека FunC
│   ├── op-codes.fc         # Коды операций
│   └── jetton-params.fc    # Параметры и коды ошибок
└── README.md
```

## 🔧 Установка компилятора

Для компиляции контрактов нужен компилятор FunC:

```bash
# Установка через TON
git clone https://github.com/ton-blockchain/ton.git
cd ton
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --target func fift
sudo cp crypto/func /usr/local/bin/
sudo cp crypto/fift /usr/local/bin/
```

## 📦 Компиляция контрактов

### Компиляция Jetton Wallet

```bash
func -o jetton-wallet.fif -SPA \
  imports/stdlib.fc \
  imports/op-codes.fc \
  imports/jetton-params.fc \
  jetton-wallet.fc
```

### Компиляция Jetton Minter

```bash
func -o jetton-minter.fif -SPA \
  imports/stdlib.fc \
  imports/op-codes.fc \
  imports/jetton-params.fc \
  jetton-minter.fc
```

## 🚀 Деплой контракта

### Шаг 1: Подготовка wallet code

Сначала скомпилируйте jetton-wallet.fc и получите его BoC (Bag of Cells).

### Шаг 2: Подготовка метаданных

Метаданные токена хранятся в формате согласно TEP-64 (Token Data Standard).

Пример создания метаданных в Python:

```python
from pytoniq_core import Cell, Builder, begin_cell

# Создаем off-chain метаданные
def create_offchain_metadata(uri):
    # 0x01 = off-chain content layout
    return (begin_cell()
            .store_uint(0x01, 8)
            .store_snake_string(uri)
            .end_cell())

# Пример URL с метаданными JSON
metadata_uri = "https://example.com/jetton.json"
content = create_offchain_metadata(metadata_uri)
```

Формат JSON для метаданных:
```json
{
  "name": "My Token",
  "description": "My awesome token",
  "symbol": "MTK",
  "decimals": 9,
  "image": "https://example.com/image.png"
}
```

### Шаг 3: Деплой Minter

Инициализируйте данные минтера:

```python
from pytoniq_core import Address, begin_cell

def create_minter_data(admin_address, jetton_wallet_code, content):
    return (begin_cell()
            .store_coins(0)  # total_supply = 0
            .store_address(admin_address)
            .store_ref(content)
            .store_ref(jetton_wallet_code)
            .end_cell())

# Создаем StateInit
state_init = (begin_cell()
              .store_uint(0, 2)  # split_depth:(Maybe (## 5)) special:(Maybe TickTock)
              .store_maybe_ref(jetton_minter_code)
              .store_maybe_ref(minter_data)
              .store_uint(0, 1)  # library:(HashmapE 256 SimpleLib)
              .end_cell())

# Вычисляем адрес контракта
minter_address = Address((0, state_init.hash))
```

Отправьте транзакцию с StateInit и начальным балансом (минимум 0.05 TON).

## 💰 Операции с токеном

### Mint (Чеканка токенов)

Отправьте сообщение от админа:

```
op: 21 (0x15)
query_id: uint64
to_address: MsgAddress
amount: Coins (TON для деплоя кошелька)
master_msg: ^Cell
  op: 0x178d4519 (internal_transfer)
  query_id: uint64
  jetton_amount: Coins (количество токенов)
  from_address: MsgAddress (addr_none)
  response_address: MsgAddress
  forward_ton_amount: Coins
  forward_payload: Either Cell ^Cell
```

### Transfer (Перевод токенов)

Отправьте сообщение на свой Jetton Wallet:

```
op: 0xf8a7ea5
query_id: uint64
amount: Coins (количество токенов)
destination: MsgAddress
response_destination: MsgAddress
custom_payload: Maybe ^Cell
forward_ton_amount: Coins (TON для пересылки получателю)
forward_payload: Either Cell ^Cell
```

### Burn (Сжигание токенов)

Отправьте сообщение на свой Jetton Wallet:

```
op: 0x595f07bc
query_id: uint64
amount: Coins (количество токенов)
response_destination: MsgAddress
custom_payload: Maybe ^Cell
```

## 🔍 Get-методы

### Jetton Minter

#### `get_jetton_data()`
Возвращает: `(int total_supply, int mintable, slice admin_address, cell content, cell jetton_wallet_code)`

```python
result = await client.run_get_method(minter_address, "get_jetton_data", [])
total_supply = result[0]
mintable = result[1]  # -1 = true
admin_address = result[2]
content = result[3]
wallet_code = result[4]
```

#### `get_wallet_address(slice owner_address)`
Возвращает адрес Jetton Wallet для указанного владельца.

```python
result = await client.run_get_method(
    minter_address, 
    "get_wallet_address", 
    [owner_address]
)
wallet_address = result[0]
```

### Jetton Wallet

#### `get_wallet_data()`
Возвращает: `(int balance, slice owner, slice jetton, cell jetton_wallet_code)`

```python
result = await client.run_get_method(wallet_address, "get_wallet_data", [])
balance = result[0]
owner_address = result[1]
jetton_master = result[2]
wallet_code = result[3]
```

## 🔒 Безопасность

- ✅ Проверка авторизации для всех административных операций
- ✅ Проверка баланса перед переводом/сжиганием
- ✅ Защита от bounce атак
- ✅ Правильная обработка forward_ton_amount
- ✅ Проверка отправителя в internal_transfer

## 📝 Коды ошибок

| Код | Описание |
|-----|----------|
| 73  | Недостаточно прав (только админ) |
| 74  | Некорректный отправитель burn_notification |
| 705 | Недостаточно прав (только владелец кошелька) |
| 706 | Недостаточный баланс |
| 707 | Некорректный отправитель internal_transfer |
| 709 | Недостаточно TON для forward |

## 🎯 Основные отличия от Jetton 1.0

1. **Оптимизация газа** - улучшенная структура данных и логика
2. **Улучшенная безопасность** - дополнительные проверки
3. **Стандартизированные коды операций** - согласно TEP-74
4. **Лучшая обработка ошибок** - предотвращение потери токенов

## 📚 Полезные ссылки

- [TEP-74: Jetton Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [TEP-64: Token Data Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)
- [TON Documentation](https://docs.ton.org/)
- [FunC Documentation](https://docs.ton.org/develop/func/overview)

## ⚠️ Важно

Перед деплоем в mainnet:
1. Тщательно протестируйте на testnet
2. Проведите аудит безопасности
3. Убедитесь в корректности метаданных
4. Проверьте все get-методы
5. Протестируйте все операции (mint, transfer, burn)

## 📄 Лицензия

MIT
