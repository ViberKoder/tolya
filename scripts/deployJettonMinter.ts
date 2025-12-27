import { toNano, Address, Cell } from '@ton/core';
import { JettonMinter, buildJettonOnchainContent } from '../wrappers/JettonMinter';
import { compile } from '@ton/blueprint';
import * as fs from 'fs';

// Token metadata for TOLYA
const JETTON_METADATA = {
    name: 'tolya',
    description: 'TOLYA Token - A Jetton 2.0 on TON',
    image: 'https://cache.tonapi.io/imgproxy/QOtsjsEA_bkTPXbfkNlSy4EFhmpad0q0Xb_4dN7ZzyU/rs:fill:500:500:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vZG5zL3ByZXZpZXcvdG9seWEudG9uLnBuZw.webp',
    symbol: 'TOL',
    decimals: '9',
};

async function main() {
    console.log('=== Jetton 2.0 Deployment Script ===\n');
    
    // Check for compiled code
    const minterCodePath = './build/jetton-minter.cell';
    const walletCodePath = './build/jetton-wallet.cell';
    
    if (!fs.existsSync(minterCodePath) || !fs.existsSync(walletCodePath)) {
        console.log('⚠️  Compiled contract code not found.');
        console.log('Please compile contracts first with: npm run compile\n');
        console.log('Or use Blueprint to compile:');
        console.log('  npx blueprint build\n');
        
        console.log('For manual compilation with func compiler:');
        console.log('  func -o jetton-minter.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-minter.fc');
        console.log('  func -o jetton-wallet.fif -SPA imports/stdlib.fc imports/op-codes.fc imports/jetton-params.fc jetton-wallet.fc\n');
        return;
    }
    
    // Load compiled code
    const minterCode = Cell.fromBoc(fs.readFileSync(minterCodePath))[0];
    const walletCode = Cell.fromBoc(fs.readFileSync(walletCodePath))[0];
    
    console.log('✅ Compiled contracts loaded');
    console.log(`   Minter code hash: ${minterCode.hash().toString('hex').slice(0, 16)}...`);
    console.log(`   Wallet code hash: ${walletCode.hash().toString('hex').slice(0, 16)}...\n`);
    
    // Build content cell
    const content = buildJettonOnchainContent(JETTON_METADATA);
    
    console.log('📝 Token Metadata:');
    console.log(`   Name: ${JETTON_METADATA.name}`);
    console.log(`   Symbol: ${JETTON_METADATA.symbol}`);
    console.log(`   Decimals: ${JETTON_METADATA.decimals}`);
    console.log(`   Description: ${JETTON_METADATA.description}`);
    console.log(`   Image: ${JETTON_METADATA.image.slice(0, 50)}...\n`);
    
    // For actual deployment, you would need to:
    // 1. Set up wallet connection (TonConnect, mnemonic, etc.)
    // 2. Create the JettonMinter with admin address
    // 3. Send deployment transaction
    
    console.log('📋 To deploy this contract:\n');
    console.log('1. Set your admin wallet address');
    console.log('2. Use TonConnect or configure mnemonic in .env');
    console.log('3. Run deployment with proper wallet\n');
    
    console.log('Example with Blueprint:');
    console.log('  npx blueprint run deployJettonMinter --network testnet\n');
    
    console.log('Or integrate with your deployment pipeline:\n');
    console.log('```typescript');
    console.log('const jettonMinter = JettonMinter.createFromConfig({');
    console.log('    adminAddress: yourWalletAddress,');
    console.log('    content: content,');
    console.log('    jettonWalletCode: walletCode,');
    console.log('}, minterCode);');
    console.log('');
    console.log('await jettonMinter.sendDeploy(provider, sender, toNano("0.1"));');
    console.log('```');
}

main().catch(console.error);
