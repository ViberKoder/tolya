# Jetton 2.0 Contracts (TEP-74 & TEP-89)

Standard, compliant Jetton implementation for TON.

## Contracts

- `jetton-minter.fc`: The master contract.
- `jetton-wallet.fc`: The wallet contract.
- `imports/`: Shared standard libraries and op-codes.

## Features

- **TEP-74**: Standard Jetton behavior (transfer, burn, etc.).
- **TEP-89**: Wallet discovery (`provide_wallet_address`).
- **Standard OpCodes**: Uses official operation codes.

## Compilation

Requires `func` compiler.

```bash
# Compile Minter
func -o jetton-minter.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-minter.fc

# Compile Wallet
func -o jetton-wallet.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-wallet.fc
```

## Deployment Data

When deploying `jetton-minter`, you need to construct the initial data cell with:
1. `admin_address` (MsgAddress)
2. `total_supply` (Coins) - usually 0 initially.
3. `jetton_content` (Cell/Ref) - TEP-64 token metadata.
4. `jetton_wallet_code` (Ref) - The compiled `jetton-wallet.fc` code.

## Usage

### Minting
Send `op::mint` (21) to Minter:
- Body:
  - `op` (32)
  - `query_id` (64)
  - `to_address` (MsgAddress)
  - `ton_amount` (Coins) - amount of TON to forward for wallet deployment/gas
  - `master_msg` (Ref) - a message cell containing the internal transfer body:
    - `op::internal_transfer` (0x178d4519)
    - `query_id` (64)
    - `jetton_amount` (Coins)
    - `owner_address` (MsgAddress) - same as `to_address` usually
    - `response_address` (MsgAddress)
    - `forward_ton_amount` (Coins)
    - `forward_payload` (Either Cell ^Cell)

### Transfer
Send `op::transfer` (0xf8a7ea5) to your Jetton Wallet.

### Burn
Send `op::burn` (0x595f07bc) to your Jetton Wallet.
