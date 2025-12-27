#!/usr/bin/env python3
"""
Пример деплоя Jetton 2.0 контракта в TON blockchain
Требуется: pip install pytoniq-core
"""

from pytoniq_core import Cell, Builder, begin_cell, Address
import json

def create_offchain_metadata(uri: str) -> Cell:
    """
    Создает off-chain метаданные (TEP-64)
    uri - URL к JSON файлу с метаданными
    """
    return (begin_cell()
            .store_uint(0x01, 8)  # off-chain content layout
            .store_snake_string(uri)
            .end_cell())

def create_onchain_metadata(name: str, symbol: str, decimals: int, description: str = "", image: str = "") -> Cell:
    """
    Создает on-chain метаданные (TEP-64)
    Хранит данные прямо в блокчейне
    """
    # Создаем словарь с метаданными
    metadata_dict = {}
    
    # Ключи согласно TEP-64
    # name
    metadata_dict[0] = begin_cell().store_snake_string(name).end_cell()
    # description
    if description:
        metadata_dict[1] = begin_cell().store_snake_string(description).end_cell()
    # image
    if image:
        metadata_dict[2] = begin_cell().store_snake_string(image).end_cell()
    # symbol
    metadata_dict[3] = begin_cell().store_snake_string(symbol).end_cell()
    # decimals (хранится как строка)
    metadata_dict[4] = begin_cell().store_snake_string(str(decimals)).end_cell()
    
    # Создаем словарь (hashmap)
    dict_cell = Cell.empty()
    for key, value in metadata_dict.items():
        dict_cell = dict_cell.set_hash(key, value)
    
    # 0x00 = on-chain content layout
    return begin_cell().store_uint(0x00, 8).store_dict(dict_cell).end_cell()

def create_minter_data(
    admin_address: Address,
    jetton_wallet_code: Cell,
    content: Cell,
    total_supply: int = 0
) -> Cell:
    """
    Создает начальные данные для Jetton Minter контракта
    """
    return (begin_cell()
            .store_coins(total_supply)  # Начальный supply (обычно 0)
            .store_address(admin_address)
            .store_ref(content)
            .store_ref(jetton_wallet_code)
            .end_cell())

def create_state_init(code: Cell, data: Cell) -> Cell:
    """
    Создает StateInit для деплоя контракта
    """
    return (begin_cell()
            .store_uint(0, 2)  # split_depth:(Maybe (## 5)) special:(Maybe TickTock)
            .store_maybe_ref(code)
            .store_maybe_ref(data)
            .store_uint(0, 1)  # library:(HashmapE 256 SimpleLib)
            .end_cell())

def calculate_address(state_init: Cell, workchain: int = 0) -> Address:
    """
    Вычисляет адрес контракта по его StateInit
    """
    return Address((workchain, state_init.hash()))

def create_mint_message(
    to_address: Address,
    jetton_amount: int,
    forward_ton_amount: int = 50000000,  # 0.05 TON
    query_id: int = 0
) -> Cell:
    """
    Создает сообщение для минта токенов
    jetton_amount - количество токенов в базовых единицах (с учетом decimals)
    """
    # Internal transfer message
    internal_transfer = (begin_cell()
                        .store_uint(0x178d4519, 32)  # op::internal_transfer
                        .store_uint(query_id, 64)
                        .store_coins(jetton_amount)
                        .store_address(None)  # from_address (addr_none для минта)
                        .store_address(to_address)  # response_address
                        .store_coins(0)  # forward_ton_amount
                        .store_uint(0, 1)  # forward_payload (empty)
                        .end_cell())
    
    # Mint message
    return (begin_cell()
            .store_uint(21, 32)  # op::mint
            .store_uint(query_id, 64)
            .store_address(to_address)
            .store_coins(forward_ton_amount)  # TON для деплоя wallet
            .store_ref(internal_transfer)
            .end_cell())

# Пример использования
if __name__ == "__main__":
    print("🚀 Jetton 2.0 Deployment Helper")
    print("=" * 50)
    
    # 1. Загрузите скомпилированный код контрактов
    # jetton_minter_code = Cell.one_from_boc("base64_code_here")
    # jetton_wallet_code = Cell.one_from_boc("base64_code_here")
    
    # 2. Укажите адрес администратора
    admin_address = Address("EQ...")  # Ваш адрес
    
    # 3. Создайте метаданные
    # Вариант А: Off-chain (рекомендуется для больших метаданных)
    metadata_url = "https://example.com/jetton-metadata.json"
    content = create_offchain_metadata(metadata_url)
    
    # Вариант Б: On-chain (для маленьких метаданных)
    # content = create_onchain_metadata(
    #     name="My Jetton",
    #     symbol="MJT",
    #     decimals=9,
    #     description="My awesome token",
    #     image="https://example.com/image.png"
    # )
    
    print("✅ Метаданные созданы")
    
    # 4. Создайте данные минтера
    # minter_data = create_minter_data(
    #     admin_address=admin_address,
    #     jetton_wallet_code=jetton_wallet_code,
    #     content=content
    # )
    
    # 5. Создайте StateInit
    # state_init = create_state_init(jetton_minter_code, minter_data)
    
    # 6. Вычислите адрес контракта
    # minter_address = calculate_address(state_init)
    # print(f"📍 Адрес Jetton Minter: {minter_address.to_str()}")
    
    # 7. Создайте сообщение для минта (после деплоя)
    # mint_amount = 1_000_000 * 10**9  # 1 миллион токенов с 9 decimals
    # mint_msg = create_mint_message(
    #     to_address=admin_address,
    #     jetton_amount=mint_amount
    # )
    
    print("=" * 50)
    print("📝 Следующие шаги:")
    print("1. Скомпилируйте контракты: ./compile.sh")
    print("2. Конвертируйте .fif в BoC")
    print("3. Раскомментируйте код выше и укажите свои данные")
    print("4. Отправьте транзакцию с StateInit")
    print("5. После деплоя отправьте mint сообщение")
