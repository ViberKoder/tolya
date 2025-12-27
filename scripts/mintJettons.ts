import { toNano, Address } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';

// Configuration
const JETTON_MINTER_ADDRESS = 'EQ...'; // Replace with deployed minter address
const MINT_TO_ADDRESS = 'EQ...';        // Replace with recipient address
const MINT_AMOUNT = 1000000n;           // Amount in base units (1 million tokens with 9 decimals = 1000000 * 10^9)
const DECIMALS = 9n;

async function main() {
    console.log('=== Jetton Mint Script ===\n');
    
    const jettonAmount = MINT_AMOUNT * (10n ** DECIMALS);
    
    console.log('📋 Mint Parameters:');
    console.log(`   Minter Address: ${JETTON_MINTER_ADDRESS}`);
    console.log(`   Recipient: ${MINT_TO_ADDRESS}`);
    console.log(`   Amount: ${MINT_AMOUNT} tokens (${jettonAmount} base units)\n`);
    
    console.log('To mint tokens, integrate with your wallet:\n');
    console.log('```typescript');
    console.log('const minter = JettonMinter.createFromAddress(');
    console.log(`    Address.parse('${JETTON_MINTER_ADDRESS}')`);
    console.log(');');
    console.log('');
    console.log('await minter.sendMint(provider, sender, {');
    console.log(`    toAddress: Address.parse('${MINT_TO_ADDRESS}'),`);
    console.log(`    jettonAmount: ${jettonAmount}n,`);
    console.log('    forwardTonAmount: toNano("0.01"),');
    console.log('    totalTonAmount: toNano("0.05"),');
    console.log('});');
    console.log('```\n');
    
    console.log('Required transaction value: ~0.1 TON');
    console.log('(includes gas for wallet deployment if needed)\n');
    
    console.log('📝 Note: Only the admin can mint tokens!');
}

main().catch(console.error);
