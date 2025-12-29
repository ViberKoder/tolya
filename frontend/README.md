# Jetton 2.0 Minter Frontend

This project allows you to deploy a Jetton 2.0 Minter contract with custom metadata on TON Blockchain.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile Contracts (Optional):
   The contracts are located in the parent directory (`/workspace`).
   If you have `func` installed or a working compiler environment, compile `jetton-minter.fc` and `jetton-wallet.fc`.
   Then update `src/contracts.ts` with the HEX code of the compiled BOCs.
   
   *Note: The current `src/contracts.ts` contains placeholder HEX codes.*

3. Run Development Server:
   ```bash
   npm run dev
   ```

## Features

- Styled like `ton.org`
- Connects to TON Wallet via TonConnect
- Deploys Jetton Minter with On-Chain metadata (TEP-64)
- Mints initial supply to the deployer
