# 🚀 Quick Start Guide

Get your Jetton Minter 2.0 running in 5 minutes!

## ⚡ Super Quick Start (3 commands)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

That's it! 🎉

## 📋 Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- A TON wallet with some TON
- Internet connection

## 🎯 Step-by-Step

### 1️⃣ Clone & Install

```bash
# Clone repository
git clone https://github.com/your-username/jetton-minter-2.0.git
cd jetton-minter-2.0

# Install everything
npm install
```

### 2️⃣ Configure (Optional)

```bash
# Copy environment file
cp .env.example .env.local

# Edit if needed (optional)
# vim .env.local
```

### 3️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🌐

### 4️⃣ Create Your First Jetton

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Choose Tonkeeper (or your wallet)
   - Approve connection

2. **Fill Form**
   ```
   Name: My First Token
   Symbol: MFT
   Decimals: 9
   Total Supply: 1000000
   ```

3. **Deploy!**
   - Click "Deploy Jetton"
   - Approve transaction
   - Wait ~30 seconds
   - Done! 🎉

## 🔧 Compile Contracts (Optional)

Only needed if you modify the smart contracts:

```bash
# Install FunC compiler first
# See: https://docs.ton.org/develop/func/installation

# Then compile
chmod +x scripts/compile.sh
./scripts/compile.sh
```

## 🌐 Deploy to Production

### Option 1: Vercel (Easiest)

```bash
npm i -g vercel
vercel
```

### Option 2: Any Node.js Host

```bash
npm run build
npm run start
```

## 🧪 Test on Testnet First

1. Switch your wallet to **testnet**
2. Get test TON from [testnet faucet](https://t.me/testgiver_ton_bot)
3. Deploy your jetton
4. Test everything
5. Switch to mainnet when ready

## 📚 Next Steps

- Read [INSTRUCTIONS.md](./INSTRUCTIONS.md) for detailed usage
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- See [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute

## ❓ Having Issues?

### Port 3000 Already in Use

```bash
# Use different port
PORT=3001 npm run dev
```

### Wallet Not Connecting

- Clear browser cache
- Try different browser
- Check wallet is unlocked
- Verify internet connection

### Contracts Not Working

```bash
# Recompile contracts
./scripts/compile.sh
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

## 🎓 Learn More

- [Full README](./README.md)
- [TON Documentation](https://docs.ton.org)
- [Jetton Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [TON Dev Chat](https://t.me/tondev)

## 🌟 Quick Links

- **Local Dev**: http://localhost:3000
- **TON Explorer**: https://tonscan.org
- **TON Wallet**: https://tonkeeper.com
- **Testnet Faucet**: https://t.me/testgiver_ton_bot

---

**Ready? Let's create some tokens!** 🚀💎

```bash
npm run dev
```
