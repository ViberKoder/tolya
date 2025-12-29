# Jetton 2.0 Minter

Полнофункциональный минтер жетонов версии Jetton 2.0 для сети TON с веб-интерфейсом в стиле ton.org.

## ✅ Что включено

### Контракты Jetton 2.0
- ✅ **jetton-minter.fc** - Контракт минтера (официальная версия Jetton 2.0)
- ✅ **jetton-wallet.fc** - Контракт кошелька (официальная версия Jetton 2.0)
- ✅ Все необходимые импорты и утилиты

### Веб-интерфейс
- ✅ Современный дизайн в стиле ton.org
- ✅ Интеграция с TON Connect
- ✅ Форма для создания токенов
- ✅ Поддержка mainnet и testnet
- ✅ Адаптивный дизайн

## Структура проекта

```
.
├── jetton-minter.fc      # Контракт минтера Jetton 2.0
├── jetton-wallet.fc      # Контракт кошелька Jetton 2.0
├── init-code.fc          # Код инициализации для деплоя
├── imports/              # Импорты и утилиты
│   ├── stdlib.fc        # Стандартная библиотека
│   ├── op-codes.fc      # Коды операций Jetton 2.0
│   ├── workchain.fc     # Утилиты для работы с workchain
│   ├── jetton-utils.fc  # Утилиты для работы с жетонами
│   └── gas.fc           # Расчеты газа
└── web/                  # Веб-интерфейс
    ├── src/
    │   ├── components/  # React компоненты
    │   └── App.tsx      # Главный компонент
    └── package.json     # Зависимости
```

## Быстрый старт

### 1. Сборка контрактов

```bash
# Компиляция wallet
func -o jetton-wallet.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/workchain.fc imports/jetton-utils.fc imports/gas.fc jetton-wallet.fc

# Компиляция minter
func -o jetton-minter.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/workchain.fc imports/jetton-utils.fc imports/gas.fc jetton-minter.fc
```

### 2. Запуск веб-интерфейса

```bash
cd web
npm install
npm start
```

Веб-интерфейс будет доступен по адресу http://localhost:3000

## Использование

1. **Подключите кошелек** через TON Connect
2. **Заполните форму** с параметрами токена:
   - Название токена
   - Символ токена
   - Описание
   - URL изображения
   - Количество знаков после запятой (обычно 9)
   - Начальный выпуск
3. **Нажмите "Создать токен"**
4. **Подтвердите транзакцию** в кошельке

## Особенности Jetton 2.0

- ✅ Соответствие официальной спецификации Jetton 2.0
- ✅ Поддержка всех операций: mint, transfer, burn
- ✅ Автоматическое создание кошельков получателей
- ✅ Оптимизированные расчеты газа
- ✅ Поддержка смены администратора
- ✅ Обновление метаданных

## Технологии

### Контракты
- FunC (TON Smart Contract Language)
- Официальные контракты Jetton 2.0

### Веб-интерфейс
- React 18
- TypeScript
- TON Connect UI
- @ton/core

## Документация

Подробные инструкции по сборке и деплою смотрите в [BUILD.md](./BUILD.md)

## Лицензия

MIT

## Ссылки

- [Официальные контракты Jetton 2.0](https://github.com/ton-blockchain/jetton-contract/tree/jetton-2.0)
- [TON Documentation](https://docs.ton.org)
- [TON.org](https://ton.org)
