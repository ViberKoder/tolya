import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NetworkProvider } from '@ton/blueprint';

// ============ НАСТРОЙКИ МИНТА ============
// Вставьте сюда адрес задеплоенного контракта
const JETTON_MINTER_ADDRESS = 'EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Количество токенов для минта (в обычных единицах, не nano)
const MINT_AMOUNT = 1_000_000; // 1 миллион токенов

// Адрес получателя (оставьте пустым чтобы минтить себе)
const RECIPIENT_ADDRESS = ''; 
// ==========================================

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const senderAddress = sender.address!;

    // Определяем получателя
    const recipientAddress = RECIPIENT_ADDRESS 
        ? Address.parse(RECIPIENT_ADDRESS) 
        : senderAddress;

    // Конвертируем в nano (9 decimals)
    const jettonAmount = BigInt(MINT_AMOUNT) * 1_000_000_000n;

    console.log('');
    console.log('='.repeat(50));
    console.log('💰 Минт Jetton токенов');
    console.log('='.repeat(50));
    console.log('');
    console.log(`📍 Minter: ${JETTON_MINTER_ADDRESS}`);
    console.log(`👤 Получатель: ${recipientAddress}`);
    console.log(`💎 Количество: ${MINT_AMOUNT.toLocaleString()} токенов`);
    console.log('');

    if (JETTON_MINTER_ADDRESS.startsWith('EQxx')) {
        console.log('❌ ОШИБКА: Установите правильный JETTON_MINTER_ADDRESS в scripts/mintJettons.ts');
        console.log('');
        return;
    }

    const minter = provider.open(
        JettonMinter.createFromAddress(Address.parse(JETTON_MINTER_ADDRESS))
    );

    // Проверяем что мы админ
    const data = await minter.getJettonData();
    if (!data.adminAddress.equals(senderAddress)) {
        console.log('❌ ОШИБКА: Вы не являетесь админом этого контракта!');
        console.log(`   Админ: ${data.adminAddress}`);
        console.log(`   Вы: ${senderAddress}`);
        return;
    }

    console.log('📤 Отправка транзакции...');
    console.log('');

    await minter.sendMint(sender, {
        toAddress: recipientAddress,
        jettonAmount: jettonAmount,
        forwardTonAmount: toNano('0.01'),
        totalTonAmount: toNano('0.05'),
    });

    console.log('✅ Транзакция отправлена!');
    console.log('');
    console.log('⏳ Подождите ~15 секунд и проверьте баланс:');
    
    const walletAddress = await minter.getWalletAddress(recipientAddress);
    console.log(`   Jetton Wallet: ${walletAddress}`);
    console.log('');
    console.log('🔗 Ссылки:');
    console.log(`   Testnet: https://testnet.tonviewer.com/${walletAddress}`);
    console.log(`   Mainnet: https://tonviewer.com/${walletAddress}`);
    console.log('');
}
