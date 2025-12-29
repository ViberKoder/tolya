# Инструкции по сборке и деплою

## Сборка контрактов

### Требования

- Установленный `func` компилятор (https://github.com/ton-blockchain/func)
- Установленный `fift` (часть TON SDK)

### Компиляция Jetton Wallet

```bash
func -o jetton-wallet.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/workchain.fc imports/jetton-utils.fc imports/gas.fc jetton-wallet.fc
```

### Компиляция Jetton Minter

```bash
func -o jetton-minter.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/workchain.fc imports/jetton-utils.fc imports/gas.fc jetton-minter.fc
```

### Компиляция Init Code

После компиляции wallet, нужно использовать его код в init-code:

```bash
# Сначала компилируем wallet
func -o jetton-wallet.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/workchain.fc imports/jetton-utils.fc imports/gas.fc jetton-wallet.fc

# Затем компилируем minter с init code
# В init-code.fc нужно будет загрузить код wallet из jetton-wallet.fif
```

## Деплой через веб-интерфейс

1. Запустите веб-интерфейс:
```bash
cd web
npm install
npm start
```

2. Подключите кошелек через TON Connect
3. Заполните форму с параметрами токена
4. Нажмите "Создать токен"
5. Подтвердите транзакцию в кошельке

## Структура данных контракта

### Jetton Minter Storage:
- `total_supply: Coins` - общий выпуск токенов
- `admin_address: MsgAddress` - адрес администратора
- `next_admin_address: MsgAddress` - следующий админ (для смены админа)
- `jetton_wallet_code: ^Cell` - код контракта кошелька
- `metadata_uri: ^Cell` - URI метаданных токена

### Jetton Wallet Storage:
- `balance: Coins` - баланс токенов
- `owner_address: MsgAddressInt` - адрес владельца
- `jetton_master_address: MsgAddressInt` - адрес минтера

## Метаданные токена

Метаданные должны быть доступны по URI, указанному в контракте.
Формат метаданных соответствует стандарту TEP-74:

```json
{
  "name": "Token Name",
  "description": "Token Description",
  "image": "https://example.com/image.png",
  "symbol": "SYMBOL",
  "decimals": 9
}
```

## Операции

### Mint (минт токенов)
- Только администратор может минтить
- Отправка сообщения с op::mint на контракт минтера

### Transfer (перевод токенов)
- Владелец может переводить свои токены
- Автоматически создает кошелек получателя, если его нет

### Burn (сжигание токенов)
- Владелец может сжигать свои токены
- Уменьшает общий supply
