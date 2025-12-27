import { Address, toNano } from '@ton/core';
import { JettonMinter, buildJettonOnchainContent } from '../wrappers/JettonMinter';
import { compile, NetworkProvider } from '@ton/blueprint';

// ============ НАСТРОЙКИ ТОКЕНА ============
const JETTON_METADATA = {
    name: 'tolya',
    description: 'TOLYA Token - A Jetton 2.0 on TON',
    image: 'https://cache.tonapi.io/imgproxy/QOtsjsEA_bkTPXbfkNlSy4EFhmpad0q0Xb_4dN7ZzyU/rs:fill:500:500:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vZG5zL3ByZXZpZXcvdG9seWEudG9uLnBuZw.webp',
    symbol: 'TOL',
    decimals: '9',
};
// ==========================================

export async function run(provider: NetworkProvider) {
    // Компилируем контракты
    const minterCode = await compile('JettonMinter');
    const walletCode = await compile('JettonWallet');

    // Получаем адрес деплоящего (он будет админом)
    const deployer = provider.sender();
    const adminAddress = deployer.address!;

    console.log('');
    console.log('='.repeat(50));
    console.log('🚀 Деплой Jetton 2.0');
    console.log('='.repeat(50));
    console.log('');
    console.log('📝 Метаданные токена:');
    console.log(`   Название: ${JETTON_METADATA.name}`);
    console.log(`   Символ: ${JETTON_METADATA.symbol}`);
    console.log(`   Decimals: ${JETTON_METADATA.decimals}`);
    console.log('');
    console.log(`👤 Админ: ${adminAddress}`);
    console.log('');

    // Создаем content cell с метаданными
    const content = buildJettonOnchainContent(JETTON_METADATA);

    // Создаем контракт
    const jettonMinter = provider.open(
        JettonMinter.createFromConfig(
            {
                adminAddress: adminAddress,
                content: content,
                jettonWalletCode: walletCode,
            },
            minterCode
        )
    );

    console.log(`📍 Адрес контракта: ${jettonMinter.address}`);
    console.log('');

    // Деплоим
    await jettonMinter.sendDeploy(deployer, toNano('0.1'));

    // Ждем деплоя
    await provider.waitForDeploy(jettonMinter.address);

    console.log('');
    console.log('✅ Контракт успешно задеплоен!');
    console.log('');
    console.log('='.repeat(50));
    console.log('📋 Информация о контракте:');
    console.log('='.repeat(50));
    console.log(`   Адрес: ${jettonMinter.address}`);
    console.log(`   Админ: ${adminAddress}`);
    console.log('');
    console.log('🔗 Ссылки:');
    console.log(`   Testnet: https://testnet.tonviewer.com/${jettonMinter.address}`);
    console.log(`   Mainnet: https://tonviewer.com/${jettonMinter.address}`);
    console.log('');
    console.log('📌 Следующий шаг - минт токенов:');
    console.log('   npx blueprint run mintJettons --testnet');
    console.log('');
}
