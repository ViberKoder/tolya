# Jetton Minter 2.0 - User Instructions

## 🎯 Quick Start Guide

### Step 1: Connect Your Wallet

1. Click the **"Connect Wallet"** button in the top-right corner
2. Choose your TON wallet from the list:
   - Tonkeeper (Recommended)
   - TON Hub
   - MyTonWallet
   - OpenMask
   - Or any other TON Connect compatible wallet
3. Approve the connection in your wallet app
4. Your address will appear once connected

### Step 2: Fill in Token Details

#### Required Fields

**Token Name** (Required)
- Full name of your token
- Example: "My Awesome Token"
- Min: 3 characters, Max: 50 characters

**Token Symbol** (Required)
- Short ticker for your token
- Example: "MAT"
- Min: 2 characters, Max: 10 characters
- Only letters and numbers allowed
- Usually written in UPPERCASE

#### Optional Fields

**Description**
- Brief description of your token
- Max: 500 characters
- Helps users understand your token's purpose

**Image URL**
- URL to your token's logo
- Must be a valid http:// or https:// URL
- Recommended size: 500x500px
- Supported formats: PNG, JPG, WebP, SVG

**Total Supply**
- Initial number of tokens to create
- Can be 0 if you want to mint later
- If mintable is enabled, you can create more later
- If mintable is disabled, this is your final supply

**Decimals**
- How divisible your token is
- Standard options: 0, 3, 6, 9, 12, 18
- Most tokens use 9 (like TON) or 18 (like Ethereum tokens)
- Example with 9 decimals: 1 token = 1,000,000,000 smallest units

**Mintable**
- ✅ **Enabled**: You can create more tokens later
- ❌ **Disabled**: Supply is fixed forever
- Can never be changed after deployment
- Default: Enabled

### Step 3: Deploy Your Jetton

1. Review all your token details carefully
2. Make sure you have at least **0.6 TON** in your wallet for gas fees
3. Click **"Deploy Jetton"**
4. Review the transaction in your wallet
5. Approve the transaction

### Step 4: Wait for Deployment

The deployment process has 3 steps:

1. **📝 Preparing contract** (~2 seconds)
   - Creating contract data
   - Encoding metadata

2. **🚀 Deploying to blockchain** (~5-10 seconds)
   - Sending transaction
   - Waiting for confirmation

3. **💎 Minting initial supply** (~5-10 seconds, if supply > 0)
   - Creating your initial tokens
   - Sending to your wallet

Total time: Usually 15-30 seconds

### Step 5: Success!

Once deployed, you'll see:

- ✅ Success message
- 📋 Your contract address
- 🔗 Link to view on TON Explorer

You can:
- Copy your contract address to share
- View your jetton on TON Explorer
- Create another jetton
- Use your tokens in your wallet

---

## 📋 Common Scenarios

### Creating a Fixed Supply Token

```
Name: My Fixed Token
Symbol: MFT
Decimals: 9
Total Supply: 1000000
Mintable: ❌ Disabled

Result: 1,000,000 MFT tokens created, no more can ever be made
```

### Creating a Mintable Token

```
Name: My Mintable Token
Symbol: MMT
Decimals: 9
Total Supply: 0
Mintable: ✅ Enabled

Result: 0 tokens initially, you can mint as needed later
```

### Creating a Stablecoin-style Token

```
Name: My USD Coin
Symbol: MUSD
Decimals: 6
Total Supply: 1000000
Mintable: ✅ Enabled

Result: 1,000,000 MUSD with 6 decimals (like USDT/USDC)
```

---

## ⚠️ Important Notes

### Before Deployment

- ✅ **Test on Testnet First**: Always test your token on testnet before mainnet
- ✅ **Double-check Everything**: You cannot change symbol or decimals after deployment
- ✅ **Have Enough TON**: Keep at least 1 TON in your wallet to be safe
- ✅ **Save Your Address**: Write down or bookmark your contract address

### After Deployment

- 📝 **Contract Address**: Save this! You'll need it to manage your token
- 💼 **Admin Address**: This is your wallet address, keep it secure
- 🔒 **Private Keys**: Never share your wallet's private keys
- 🔄 **Wallet Apps**: Your tokens will appear in compatible wallets automatically

### Security

- ⚠️ **Admin Control**: As admin, you have full control of minting and metadata
- ⚠️ **Mintable Risk**: If mintable, you can create unlimited tokens
- ⚠️ **Transfer Admin**: You can transfer admin to another address (be careful!)
- ⚠️ **Smart Contract**: Code cannot be changed after deployment

---

## 🛠 After Deployment: Managing Your Jetton

### Minting More Tokens (if mintable)

1. You'll need to send a transaction to your contract
2. Use TON wallets or custom scripts
3. Operation code: `op::mint()` = 21
4. Only admin can mint

### Transferring Admin Rights

1. Send `change_admin` transaction
2. Specify new admin address
3. New admin gets all control
4. **Cannot be undone!**

### Updating Metadata

1. Send `change_content` transaction
2. Update name, description, or image
3. Symbol and decimals cannot change
4. Only admin can update

### Viewing Your Jetton

**TON Explorer**
- Visit: https://tonscan.org
- Paste your contract address
- View all transactions and data

**In Wallets**
- Tonkeeper: Usually appears automatically
- TON Hub: May need to import manually
- Other wallets: Use "Import Token" feature

---

## 🚨 Troubleshooting

### "Please connect your wallet first"
**Solution**: Click "Connect Wallet" button and approve connection

### "Please fill in all required fields"
**Solution**: Token name and symbol are required, check they're filled

### "Insufficient balance"
**Solution**: You need at least 0.6 TON in your wallet

### "Transaction failed"
**Solution**: 
- Check your internet connection
- Make sure you approved in wallet
- Try again with more TON for gas

### "Contract deployment timeout"
**Solution**:
- TON network might be congested
- Wait a few minutes and try again
- Check TON blockchain status

### Token doesn't appear in wallet
**Solution**:
- Wait a few minutes for sync
- Refresh your wallet
- Manually import using contract address
- Check transaction on TON Explorer

---

## 📞 Need Help?

### Documentation
- TON Docs: https://docs.ton.org
- Jetton Standard: https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md

### Community
- Telegram: [@tondev](https://t.me/tondev)
- Discord: [TON Dev](https://discord.gg/ton)
- Reddit: [r/toncoin](https://reddit.com/r/toncoin)

### Report Issues
- GitHub: Create an issue
- Telegram: Ask in dev chat
- Email: support@your-domain.com

---

## ✅ Checklist Before Deploying

- [ ] I have tested on testnet first
- [ ] I have verified my token name and symbol
- [ ] I have chosen the correct decimals
- [ ] I understand the mintable setting
- [ ] I have at least 0.6 TON for gas
- [ ] I have saved/bookmarked this page
- [ ] I am ready to save the contract address
- [ ] I understand I cannot change certain parameters later

**Ready to deploy? Good luck! 🚀**
