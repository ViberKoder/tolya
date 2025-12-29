# Jetton 2.0 Project

Complete Jetton 2.0 implementation for TON Blockchain with a modern web minter interface.

## 📁 Project Structure

```
.
├── jetton-minter.fc          # FunC smart contract for Jetton Minter
├── jetton-wallet.fc          # FunC smart contract for Jetton Wallet
├── init-code.fc              # Initialization code for deployment
├── imports/                  # FunC imports
│   ├── stdlib.fc            # Standard library
│   ├── op-codes.fc          # Operation codes
│   └── jetton-params.fc     # Parameters and errors
└── minter-frontend/         # Web interface for creating tokens
    ├── src/
    │   ├── components/      # React components
    │   ├── contracts/       # Contract wrappers
    │   ├── hooks/           # Custom hooks
    │   ├── pages/           # Next.js pages
    │   ├── styles/          # CSS styles
    │   └── utils/           # Utility functions
    ├── public/              # Static assets
    └── package.json
```

## 🚀 Features

### Smart Contracts (FunC)
- **Jetton Minter**: Main contract for token creation and management
- **Jetton Wallet**: Individual wallet contract for token holders
- Full Jetton 2.0 (TEP-74) standard compliance
- On-chain metadata support (TEP-64)

### Web Interface
- Modern UI inspired by ton.org
- TON Connect 2.0 wallet integration
- One-click token deployment
- Admin panel for token management
- Responsive design for all devices

## 🎯 Quick Start

### Web Interface

```bash
# Navigate to frontend
cd minter-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Smart Contracts

```bash
# Compile contracts (requires func compiler)
func -o jetton-minter.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-minter.fc
func -o jetton-wallet.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-wallet.fc
```

## 💰 Token Creation

1. **Connect Wallet**: Use Tonkeeper, OpenMask, or any TON Connect wallet
2. **Fill Details**:
   - Token Name
   - Symbol
   - Description
   - Image URL
   - Total Supply
   - Decimals (default: 9)
3. **Deploy**: Click "Create Jetton" (~0.1 TON)
4. **Done!**: Your token is live on TON

## 🔧 Token Management

After deployment, use the Admin Panel to:
- Mint additional tokens (if mintable)
- Change admin address
- View token information

## 📋 Standards Implemented

- **TEP-74**: Fungible Tokens (Jettons) Standard
- **TEP-64**: Token Data Standard
- **TEP-89**: Discoverable Jettons Wallets

## 🌐 Deployment

### Frontend (Vercel)

```bash
cd minter-frontend
npm run build
npx vercel --prod
```

### Frontend (Docker)

```bash
cd minter-frontend
docker build -t jetton-minter .
docker run -p 3000:3000 jetton-minter
```

## 📚 Resources

- [TON Documentation](https://docs.ton.org)
- [Jetton Standard (TEP-74)](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [Official Jetton Contracts](https://github.com/ton-blockchain/jetton-contract)
- [TON Connect](https://github.com/ton-connect)

## 🛡️ Security

- Based on official TON Foundation implementations
- No private keys handled by frontend
- All transactions require wallet confirmation

## 📄 License

MIT License

---

Built with ❤️ on [The Open Network](https://ton.org)
