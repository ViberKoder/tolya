# 🧪 Тестирование Jetton 2.0

Руководство по тестированию Jetton 2.0 контракта в testnet TON.

## 📋 Предварительные требования

1. **Testnet кошелек** с балансом тестовых TON
2. **Компилятор FunC** установлен
3. **Python 3.8+** для скриптов деплоя
4. **pytoniq-core** или **pytoniq** библиотека

```bash
pip install pytoniq-core
```

## 🔨 Шаг 1: Компиляция

```bash
./compile.sh
```

Должны появиться файлы:
- `build/jetton-minter.fif`
- `build/jetton-wallet.fif`

## 📦 Шаг 2: Подготовка данных

### 2.1 Создайте JSON с метаданными

Создайте файл `my-jetton-metadata.json`:

```json
{
  "name": "Test Jetton",
  "description": "My test token on TON",
  "symbol": "TEST",
  "decimals": "9",
  "image": "https://example.com/logo.png"
}
```

Загрузите этот файл на IPFS или любой HTTP сервер.

### 2.2 Конвертируйте .fif в BoC

```bash
# Используя fift
fift -s <(echo '"build/jetton-wallet.fif" include <b 8 1 i, 3 roll ref, rot ref, swap ref, b> <s csr.') > wallet_code.boc

fift -s <(echo '"build/jetton-minter.fif" include <b 8 1 i, 3 roll ref, rot ref, swap ref, b> <s csr.') > minter_code.boc
```

Или используйте Python скрипт для чтения .fif и конвертации.

## 🚀 Шаг 3: Деплой в Testnet

### 3.1 Подготовьте StateInit

```python
from pytoniq_core import Cell, Address, begin_cell

# Загрузите коды контрактов
with open('wallet_code.boc', 'rb') as f:
    jetton_wallet_code = Cell.one_from_boc(f.read())

with open('minter_code.boc', 'rb') as f:
    jetton_minter_code = Cell.one_from_boc(f.read())

# Ваш адрес (admin)
admin = Address("kQAA...") # Testnet адрес

# Метаданные
metadata_url = "https://your-server.com/metadata.json"
content = begin_cell().store_uint(0x01, 8).store_snake_string(metadata_url).end_cell()

# Данные минтера
minter_data = (begin_cell()
    .store_coins(0)  # initial supply
    .store_address(admin)
    .store_ref(content)
    .store_ref(jetton_wallet_code)
    .end_cell())

# StateInit
state_init = (begin_cell()
    .store_uint(0, 2)
    .store_maybe_ref(jetton_minter_code)
    .store_maybe_ref(minter_data)
    .store_uint(0, 1)
    .end_cell())

# Адрес контракта
minter_addr = Address((-1, state_init.hash()))
print(f"Minter address: {minter_addr.to_str()}")
```

### 3.2 Отправьте деплой транзакцию

```python
from pytoniq import LiteBalancer, WalletV4R2

# Подключитесь к testnet
client = LiteBalancer.from_testnet_config(trust_level=2)
await client.start_up()

# Загрузите ваш кошелек
wallet = await WalletV4R2.from_mnemonic(client, mnemonic)

# Отправьте деплой
await wallet.transfer(
    destination=minter_addr,
    amount=int(0.05 * 10**9),  # 0.05 TON
    state_init=state_init,
    body=begin_cell().end_cell()  # пустое тело
)

print("✅ Контракт задеплоен!")
```

## 💰 Шаг 4: Минт токенов

Дождитесь подтверждения деплоя, затем заминтите токены:

```python
# Создайте internal_transfer message
internal_transfer = (begin_cell()
    .store_uint(0x178d4519, 32)  # op::internal_transfer
    .store_uint(0, 64)  # query_id
    .store_coins(1_000_000 * 10**9)  # 1M токенов
    .store_address(None)  # from (addr_none)
    .store_address(admin)  # response_address
    .store_coins(0)  # forward_ton_amount
    .store_uint(0, 1)  # empty payload
    .end_cell())

# Создайте mint message
mint_body = (begin_cell()
    .store_uint(21, 32)  # op::mint
    .store_uint(0, 64)  # query_id
    .store_address(admin)  # to_address
    .store_coins(50_000_000)  # 0.05 TON для деплоя wallet
    .store_ref(internal_transfer)
    .end_cell())

# Отправьте mint транзакцию
await wallet.transfer(
    destination=minter_addr,
    amount=int(0.1 * 10**9),  # 0.1 TON
    body=mint_body
)

print("✅ Токены заминчены!")
```

## 🧪 Шаг 5: Тестирование операций

### 5.1 Получите адрес своего Jetton Wallet

```python
# Вызовите get_wallet_address
result = await client.run_get_method(
    address=minter_addr.to_str(),
    method="get_wallet_address",
    stack=[admin.to_cell().begin_parse()]
)

my_wallet_addr = result[0].load_address()
print(f"My wallet: {my_wallet_addr.to_str()}")
```

### 5.2 Проверьте баланс

```python
result = await client.run_get_method(
    address=my_wallet_addr.to_str(),
    method="get_wallet_data",
    stack=[]
)

balance = result[0]  # int
owner = result[1]    # slice
jetton_master = result[2]  # slice
wallet_code = result[3]    # cell

print(f"Balance: {balance / 10**9} tokens")
```

### 5.3 Тест: Transfer (Перевод токенов)

```python
recipient = Address("kQBB...")  # Адрес получателя

transfer_body = (begin_cell()
    .store_uint(0xf8a7ea5, 32)  # op::transfer
    .store_uint(0, 64)  # query_id
    .store_coins(100 * 10**9)  # 100 токенов
    .store_address(recipient)  # destination
    .store_address(admin)  # response_destination
    .store_uint(0, 1)  # no custom_payload
    .store_coins(1_000_000)  # 0.001 TON forward
    .store_uint(0, 1)  # empty forward_payload
    .end_cell())

await wallet.transfer(
    destination=my_wallet_addr,
    amount=int(0.05 * 10**9),  # 0.05 TON
    body=transfer_body
)

print("✅ Перевод отправлен!")
```

### 5.4 Тест: Burn (Сжигание)

```python
burn_body = (begin_cell()
    .store_uint(0x595f07bc, 32)  # op::burn
    .store_uint(0, 64)  # query_id
    .store_coins(50 * 10**9)  # 50 токенов
    .store_address(admin)  # response_destination
    .store_uint(0, 1)  # no custom_payload
    .end_cell())

await wallet.transfer(
    destination=my_wallet_addr,
    amount=int(0.05 * 10**9),
    body=burn_body
)

print("✅ Токены сожжены!")
```

## ✅ Шаг 6: Верификация

### 6.1 Проверьте total_supply

```python
result = await client.run_get_method(
    address=minter_addr.to_str(),
    method="get_jetton_data",
    stack=[]
)

total_supply = result[0]
mintable = result[1]
admin_addr = result[2]
content = result[3]
wallet_code = result[4]

print(f"Total supply: {total_supply / 10**9} tokens")
print(f"Mintable: {mintable == -1}")
```

### 6.2 Проверьте метаданные

Откройте в браузере: `https://tonscan.org/jetton/{minter_address}`

Должны отображаться:
- Название токена
- Символ
- Изображение
- Описание

### 6.3 Проверьте транзакции

Проверьте все транзакции на tonscan:
- Деплой контракта
- Минт токенов
- Переводы
- Сжигания

## 🐛 Отладка

### Ошибка 73: Unauthorized
- Проверьте, что отправляете с admin адреса
- Для mint и change_admin нужны права админа

### Ошибка 705: Unauthorized (wallet)
- Операция может быть выполнена только владельцем кошелька
- Проверьте адрес отправителя

### Ошибка 706: Insufficient balance
- Недостаточно токенов для операции
- Проверьте баланс через get_wallet_data()

### Ошибка 709: Not enough TON
- Недостаточно TON для forward_ton_amount
- Увеличьте сумму отправки или уменьшите forward_ton_amount

## 📊 Мониторинг

Используйте TON Center API для мониторинга:

```python
import requests

def get_jetton_info(address):
    url = f"https://testnet.toncenter.com/api/v2/getAddressInformation"
    params = {"address": address}
    response = requests.get(url, params=params)
    return response.json()

info = get_jetton_info(minter_addr.to_str())
print(info)
```

## 📝 Чек-лист тестирования

- [ ] Контракт успешно задеплоен
- [ ] Метаданные отображаются корректно
- [ ] Минт работает (только admin)
- [ ] Transfer работает (перевод между кошельками)
- [ ] Burn работает (сжигание токенов)
- [ ] Total supply обновляется корректно
- [ ] Get-методы возвращают правильные данные
- [ ] Проверены права доступа (только owner может переводить)
- [ ] Проверена обработка ошибок
- [ ] Протестированы edge cases (нулевые значения, максимальные суммы)

## 🎯 Готово к продакшену?

Перед деплоем в mainnet:

1. ✅ Все тесты пройдены
2. ✅ Проведен security audit
3. ✅ Метаданные загружены на надежный хостинг
4. ✅ Admin key безопасно хранится
5. ✅ Продумана стратегия распределения токенов
6. ✅ Документация готова
7. ✅ Команда проинформирована о запуске

Удачи! 🚀
