# Jetton 2.0 Minter

A beautiful and modern web interface for creating Jetton 2.0 tokens on the TON Blockchain. Built with Next.js, TailwindCSS, and TON Connect.

![Jetton 2.0 Minter](https://ton.org/images/ton-logo.png)

## ✨ Features

- **Modern UI/UX**: Inspired by ton.org design with dark theme and smooth animations
- **TON Connect 2.0**: Seamless wallet connection with all major TON wallets
- **Jetton 2.0 Standard**: Deploy tokens using the latest TEP-74 standard
- **On-chain Metadata**: Full support for TEP-64 on-chain token metadata
- **Real-time Deployment**: Watch your token being deployed step-by-step
- **Mobile Responsive**: Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A TON wallet (Tonkeeper, OpenMask, etc.)

### Installation

```bash
# Navigate to the frontend directory
cd minter-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🎯 How to Use

1. **Connect Wallet**: Click "Connect Wallet" and choose your TON wallet
2. **Fill Token Details**:
   - Token Name (e.g., "My Token")
   - Symbol (e.g., "MTK")
   - Description (optional)
   - Image URL (optional)
   - Total Supply
3. **Advanced Options** (optional):
   - Decimals (default: 9)
   - Mintable flag
4. **Deploy**: Click "Create Jetton" and confirm the transaction
5. **Done!**: Your token is deployed and ready to use

## 💰 Deployment Cost

Approximately **0.1 TON** for deployment and initial minting.

## 🏗️ Project Structure

```
minter-frontend/
├── src/
│   ├── components/     # React components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── TokenForm.tsx
│   │   ├── DeploymentStatus.tsx
│   │   └── Features.tsx
│   ├── contracts/      # Contract wrappers
│   │   ├── JettonMinter.ts
│   │   └── JettonWallet.ts
│   ├── hooks/          # Custom React hooks
│   │   └── useTonConnect.ts
│   ├── pages/          # Next.js pages
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   └── index.tsx
│   ├── styles/         # Global styles
│   │   └── globals.css
│   └── utils/          # Utility functions
│       ├── deploy.ts
│       └── metadata.ts
├── public/             # Static assets
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Configuration

### TON Connect Manifest

For production, create your own `tonconnect-manifest.json`:

```json
{
  "url": "https://your-domain.com",
  "name": "Jetton 2.0 Minter",
  "iconUrl": "https://your-domain.com/icon.png"
}
```

Update the manifest URL in `src/pages/_app.tsx`.

### Network Configuration

By default, the app connects to TON mainnet. For testnet, modify the deployment utilities.

## 📋 Token Standards

This minter implements:

- **TEP-74**: Fungible Tokens (Jettons) Standard
- **TEP-64**: Token Data Standard (on-chain metadata)
- **TEP-89**: Discoverable Jettons Wallets

## 🛡️ Security

- Contracts are based on official TON Foundation implementations
- All transactions require user confirmation via wallet
- No private keys are ever handled by the frontend

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📚 Resources

- [TON Documentation](https://docs.ton.org)
- [Jetton Standard (TEP-74)](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [TON Connect](https://github.com/ton-connect)
- [Official Jetton Contracts](https://github.com/ton-blockchain/jetton-contract)

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ on [The Open Network](https://ton.org)
