# 🚀 Jetton Minter 2.0

<div align="center">

![Jetton Minter](https://img.shields.io/badge/TON-Jetton%202.0-0098EA?style=for-the-badge&logo=ton&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript&logoColor=white)

**Create and deploy your own Jetton 2.0 tokens on TON blockchain in minutes**

[Demo](#) • [Documentation](#documentation) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Smart Contracts](#smart-contracts)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About

**Jetton Minter 2.0** is a modern web application that allows anyone to create and deploy Jetton 2.0 tokens on the TON blockchain without writing a single line of code. Built with the latest Jetton 2.0 standard and featuring a beautiful ton.org-inspired design.

### Why Jetton 2.0?

- ✅ **Latest Standard**: Full Jetton 2.0 compatibility
- ✅ **Enhanced Features**: Improved burn notifications, better gas efficiency
- ✅ **Battle-Tested**: Based on official TON smart contracts
- ✅ **Future-Proof**: Ready for upcoming TON ecosystem updates

## ✨ Features

### 🎨 Modern UI/UX
- **TON.org Style Design**: Beautiful, clean interface inspired by ton.org
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode Ready**: Comfortable viewing in any lighting condition

### 🔐 Secure & Reliable
- **TON Connect Integration**: Seamless wallet connection
- **Audited Contracts**: Based on official TON Jetton contracts
- **Non-Custodial**: You control your tokens completely

### ⚙️ Customizable
- **Token Metadata**: Set name, symbol, description, and image
- **Decimals**: Choose from 0 to 18 decimal places
- **Supply Control**: Set initial supply and mintability
- **Admin Controls**: Change admin, update metadata, mint more tokens

### 💎 Jetton 2.0 Features
- **Efficient Transfers**: Optimized gas usage for transfers
- **Burn Mechanism**: Built-in token burning functionality
- **Wallet Discovery**: Easy wallet address calculation
- **Metadata Standard**: Full on-chain metadata support

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **TON Wallet** with some TON for gas fees
- **FunC Compiler** (for contract compilation)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/jetton-minter-2.0.git
cd jetton-minter-2.0
```

2. **Install dependencies**

```bash
npm install
```

3. **Compile smart contracts**

```bash
chmod +x scripts/compile.sh
./scripts/compile.sh
```

4. **Run development server**

```bash
npm run dev
```

5. **Open in browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Creating Your First Jetton

1. **Connect Wallet**
   - Click "Connect Wallet" in the header
   - Choose your TON wallet (Tonkeeper, TON Hub, etc.)
   - Approve the connection

2. **Fill in Token Details**
   - **Token Name**: Full name of your token (e.g., "My Awesome Token")
   - **Symbol**: Short ticker (e.g., "MAT")
   - **Description**: Brief description of your token
   - **Image URL**: Logo image URL (optional)
   - **Decimals**: Number of decimal places (usually 9)
   - **Total Supply**: Initial token supply
   - **Mintable**: Whether you can mint more tokens later

3. **Deploy**
   - Click "Deploy Jetton"
   - Confirm the transaction in your wallet
   - Wait for deployment confirmation
   - Your jetton is now live! 🎉

### After Deployment

Once deployed, you can:

- **View on Explorer**: See your token on TON explorer
- **Share Address**: Share your jetton minter address with others
- **Mint More Tokens**: If mintable, create more tokens
- **Transfer Admin**: Transfer control to another address
- **Update Metadata**: Change token information

## 🔧 Smart Contracts

### Contract Architecture

```
Jetton Minter (Master Contract)
├── Manages total supply
├── Controls minting
├── Stores metadata
└── Creates wallet contracts

Jetton Wallet (User Contract)
├── Holds user's token balance
├── Handles transfers
├── Processes burns
└── Unique per user per jetton
```

### Contract Files

- **`contracts/jetton-minter-v2.fc`**: Main minter contract (Jetton 2.0)
- **`contracts/jetton-wallet-v2.fc`**: User wallet contract (Jetton 2.0)
- **`contracts/imports/stdlib.fc`**: Standard library functions
- **`contracts/imports/op-codes.fc`**: Operation codes
- **`contracts/imports/jetton-params.fc`**: Parameters and error codes

### Key Operations

#### Minting Tokens

```typescript
// Send mint message to minter contract
op::mint() = 21
Parameters: amount, to_address, forward_ton_amount
```

#### Transferring Tokens

```typescript
// Send transfer message to wallet contract
op::transfer() = 0xf8a7ea5
Parameters: amount, destination, response_address, forward_amount
```

#### Burning Tokens

```typescript
// Send burn message to wallet contract
op::burn() = 0x595f07bc
Parameters: amount, response_address
```

## 📚 Documentation

### Project Structure

```
jetton-minter-2.0/
├── contracts/              # Smart contracts (FunC)
│   ├── jetton-minter-v2.fc
│   ├── jetton-wallet-v2.fc
│   └── imports/           # Contract dependencies
├── src/
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── types/            # TypeScript types
├── public/               # Static assets
├── scripts/              # Build scripts
└── build/                # Compiled contracts
```

### Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS (ton.org theme)
- **Blockchain**: TON Connect, @ton/core, @ton/ton
- **Smart Contracts**: FunC (Jetton 2.0 standard)

### Configuration

#### TON Connect Manifest

Update `public/tonconnect-manifest.json`:

```json
{
  "url": "https://your-domain.com",
  "name": "Your Jetton Minter",
  "iconUrl": "https://your-domain.com/icon.png"
}
```

#### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_TON_NETWORK=mainnet
NEXT_PUBLIC_MANIFEST_URL=https://your-domain.com/tonconnect-manifest.json
```

## 🛠 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Contracts
npm run compile:minter   # Compile minter contract
npm run compile:wallet   # Compile wallet contract
./scripts/compile.sh     # Compile all contracts
```

### Testing

```bash
# Run tests (when implemented)
npm test
```

### Building for Production

```bash
npm run build
npm run start
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/jetton-minter-2.0)

### Manual Deployment

1. Build the application
2. Deploy to any Node.js hosting
3. Update TON Connect manifest URL
4. Configure domain and SSL

## 💰 Gas Fees

Typical costs on TON mainnet:

| Operation | Approximate Cost |
|-----------|-----------------|
| Deploy Minter | ~0.5 TON |
| Mint Tokens | ~0.1 TON |
| Transfer | ~0.05 TON |
| Burn | ~0.05 TON |

*Note: Excess TON is returned to sender*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TON Blockchain](https://ton.org) - The Open Network
- [TON Jetton Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) - Jetton specification
- [Official Minter](https://github.com/ton-blockchain/minter) - Original inspiration
- [Jetton 2.0 Contracts](https://github.com/ton-blockchain/jetton-contract/tree/jetton-2.0) - Reference implementation

## 📞 Support

- **Documentation**: [TON Docs](https://docs.ton.org)
- **Telegram**: [@tondev](https://t.me/tondev)
- **Discord**: [TON Dev](https://discord.gg/ton)
- **GitHub Issues**: [Report a bug](https://github.com/your-username/jetton-minter-2.0/issues)

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">

Made with ❤️ for the TON ecosystem

[Website](#) • [Twitter](#) • [Telegram](#)

</div>
