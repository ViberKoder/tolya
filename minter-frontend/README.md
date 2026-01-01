# Cook - Jetton 2.0 Minter for TON

<p align="center">
  <img src="https://em-content.zobj.net/source/telegram/386/poultry-leg_1f357.webp" width="80" height="80" alt="Cook Logo">
</p>

<p align="center">
  <strong>Cook your Jetton 2.0 on TON</strong>
</p>

Cook is a modern web application for creating and managing Jetton 2.0 tokens on The Open Network (TON). Built with the official Jetton 2.0 contracts from [ton-blockchain/jetton-contract](https://github.com/ton-blockchain/jetton-contract/tree/jetton-2.0).

## Features

- 🍗 **Jetton 2.0 Standard** - Uses the official Jetton 2.0 contracts from TON Core
- ⚡ **3x Faster** - Jetton 2.0 transactions are up to 3 times faster than Jetton 1.0
- 🔗 **Full Compatibility** - Works with DeDust, STON.fi, and all TON wallets/explorers
- 🎨 **Modern UI** - Clean, light theme with TON and Telegram design style
- 📱 **TON Connect** - Easy wallet connection with TON Connect 2.0
- 🛠️ **Admin Panel** - Manage minting, admin rights, and token settings

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A TON wallet (Tonkeeper, Tonhub, etc.)

### Installation

```bash
cd minter-frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## How It Works

### Token Creation

1. **Connect Wallet** - Connect your TON wallet using TON Connect
2. **Fill Token Details** - Enter name, symbol, description, image URL, and supply
3. **Deploy** - Confirm the transaction (1 TON total: 0.2 TON deploy fee + 0.8 TON service fee)
4. **Done!** - Your Jetton 2.0 token is now live on TON

### Metadata Hosting

Jetton 2.0 requires off-chain metadata (a JSON file hosted at a public URL). Cook automatically handles this by:

1. **Auto-upload** - Automatically uploads your metadata to a free JSON hosting service
2. **Manual URL** - Or provide your own URL (IPFS, GitHub, or any web server)

The metadata JSON format:
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "description": "My awesome token",
  "image": "https://example.com/logo.png",
  "decimals": "9"
}
```

### Admin Panel

After deployment, you can manage your token:

- **Mint** - Create additional tokens (if you're the admin)
- **Transfer Admin** - Transfer admin rights to another address
- **Revoke Admin** - Make the token fully decentralized (irreversible!)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: @ton/core, @tonconnect/ui-react
- **Smart Contracts**: Official Jetton 2.0 from TON Core

## Contract Details

This app uses the official Jetton 2.0 contracts from:
https://github.com/ton-blockchain/jetton-contract/tree/jetton-2.0

Key features of Jetton 2.0:
- TEP-74 (Jetton Standard) compatible
- TEP-64 (Token Data Standard) metadata
- Admin transfer with confirmation (change_admin + claim_admin)
- Drop admin functionality for decentralization
- Optimized gas usage

## License

MIT

## Links

- [TON Documentation](https://docs.ton.org)
- [Jetton Standard (TEP-74)](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [Token Data Standard (TEP-64)](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)
- [TON Explorer](https://tonviewer.com)
