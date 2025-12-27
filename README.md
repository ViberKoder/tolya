## Jetton (TEP-74) на TON — рабочие FunC контракты

В этом репозитории лежит **Jetton Minter** и **Jetton Wallet**, совместимые со стандартом Jettons (TEP-74).

### Структура проекта

```
.
├── jetton-minter.fc      # Jetton Minter (TEP-74)
├── jetton-wallet.fc      # Контракт кошелька для токенов
└── imports/
    ├── stdlib.fc        # Стандартные функции
    ├── op-codes.fc      # Коды операций
    └── jetton-params.fc # Параметры и ошибки
```

### Что важно про деплой

Jetton Minter **обязан** иметь в своём persistent data поле `wallet_code` — это **код контракта Jetton Wallet**.  
Без этого минтер не сможет корректно:
- вычислять адреса кошельков
- деплоить кошельки
- валидировать `burn_notification`

Поэтому старый подход “деплой через `init-code.fc`” здесь **больше не используется** (см. комментарий в `init-code.fc`).

### Сборка

Для сборки контрактов используйте `func` компилятор:

```bash
# пример (пути и флаги могут отличаться в вашем тулчейне)
func -o jetton-minter.fif -SPA jetton-minter.fc
func -o jetton-wallet.fif -SPA jetton-wallet.fc
```

### Деплой (в общих чертах)

1. **Скомпилируйте** `jetton-wallet.fc` и получите `wallet_code` (code cell).
2. **Скомпилируйте** `jetton-minter.fc` и деплойте его с корректным `data`:
   - `(total_supply, admin_address, jetton_content, wallet_code, mintable)`
3. Метаданные (`jetton_content`) — это стандартный TEP-64 content cell (может быть off-chain URL или on-chain dict).
4. После деплоя админ может менять `jetton_content` через `change_content`.

### Поддерживаемые операции

#### Jetton Minter

- `mint` (admin-only, требует `mintable=1`)
- `change_admin` (admin-only)
- `change_content` (admin-only)
- `set_mintable` (admin-only)
- `provide_wallet_address` (TEP-89)
- `burn_notification` (приходит от Jetton Wallet)

#### Jetton Wallet

- `transfer`
- `internal_transfer` (приходит от других Jetton Wallet)
- `burn`

### Get-методы

#### Jetton Minter

- `get_jetton_data()` → `(total_supply, mintable, admin_address, jetton_content, wallet_code)`
- `get_wallet_address(owner)` → `jetton_wallet_address`
- `get_total_supply()`
- `get_mintable()`
- `get_jetton_content()`
- `get_admin_address()`

#### Jetton Wallet

- `get_wallet_data()` → `(balance, owner_address, jetton_master_address, wallet_code)`
- `get_balance()`
- `get_owner_address()`
- `get_jetton_master_address()`

### Примечания

- Все количества jetton’ов передаются в nano-единицах (в зависимости от ваших `decimals` в `jetton_content`).
- Если хочешь — могу добавить готовый скрипт деплоя (TypeScript/Blueprint или Fift), который соберёт `wallet_code` и правильно сформирует initial data.
