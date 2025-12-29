# Jetton 2.0 Minter - Deployment Guide

This guide will help you deploy the Jetton Minter 2.0 application.

## Prerequisites

- Node.js 18+ and npm/yarn
- FunC compiler (for contract compilation)
- TON wallet with some TON for gas fees

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Smart Contracts

The smart contracts need to be compiled before deployment:

```bash
# Install FunC compiler if not already installed
# Follow instructions at: https://docs.ton.org/develop/func/installation

# Compile contracts
chmod +x scripts/compile.sh
./scripts/compile.sh
```

This will generate:
- `build/jetton-minter.fif` - Compiled minter contract
- `build/jetton-wallet.fif` - Compiled wallet contract

### 3. Convert Contracts to BOC Format

After compilation, you need to convert the .fif files to BOC (Bag of Cells) format and update the code in:
- `src/lib/jettonMinterCode.ts`
- `src/lib/jettonWalletCode.ts`

You can use TON tools to convert:

```bash
# Example using fift
fift -s build/jetton-minter.fif > build/jetton-minter.boc
```

Then encode the BOC to base64 and update the TypeScript files.

## Development

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Deploy to Vercel (Recommended)

The easiest way to deploy is using Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 3. Alternative: Deploy to Any Node.js Host

```bash
npm run build
npm run start
```

## Configuration

### Update TON Connect Manifest

Edit `public/tonconnect-manifest.json` with your domain:

```json
{
  "url": "https://your-domain.com",
  "name": "Your Jetton Minter",
  "iconUrl": "https://your-domain.com/icon.png"
}
```

### Environment Variables

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_TON_NETWORK=mainnet
NEXT_PUBLIC_MANIFEST_URL=https://your-domain.com/tonconnect-manifest.json
```

## Smart Contract Deployment Flow

When a user creates a jetton:

1. **Connect Wallet**: User connects via TON Connect
2. **Fill Form**: User fills in jetton details (name, symbol, etc.)
3. **Deploy Minter**: Smart contract is deployed to TON blockchain
4. **Mint Tokens**: Initial supply is minted to owner's address
5. **Done**: Jetton is ready to use!

## Gas Fees

Typical deployment costs:
- Minter deployment: ~0.5 TON
- Initial minting: ~0.1 TON per mint
- Total: ~0.6 TON (remaining TON is returned)

## Testing

### Local Testing

1. Use TON testnet
2. Get test TON from faucet: https://t.me/testgiver_ton_bot
3. Deploy on testnet first

### Contract Testing

You can test contracts using TON Sandbox or Blueprint:

```bash
# Install Blueprint
npm create ton@latest

# Run tests
npm test
```

## Troubleshooting

### Contract Code Not Found

Make sure you've:
1. Compiled the contracts (`./scripts/compile.sh`)
2. Converted to BOC format
3. Updated the code in `src/lib/jettonMinterCode.ts`

### Deployment Fails

Check:
- Wallet has enough TON
- TON Connect is properly connected
- Contract code is valid
- Network is not congested

### UI Issues

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
npm run dev
```

## Support

For issues and questions:
- TON Docs: https://docs.ton.org
- TON Dev Chat: https://t.me/tondev
- Jetton Standard: https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md

## Security Notes

⚠️ **Important**:
- Test on testnet first
- Verify contract code before mainnet deployment
- Keep admin keys secure
- Consider auditing before launching tokens
