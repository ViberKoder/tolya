import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, Address } from '@ton/core';
import { JettonMinter, buildJettonOnchainContent } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JettonMinter', () => {
    let minterCode: Cell;
    let walletCode: Cell;

    beforeAll(async () => {
        // Compile contracts
        minterCode = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;

    const JETTON_METADATA = {
        name: 'Test Jetton',
        description: 'Test Jetton Description',
        image: 'https://example.com/image.png',
        symbol: 'TEST',
        decimals: '9',
    };

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        const content = buildJettonOnchainContent(JETTON_METADATA);

        jettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    adminAddress: deployer.address,
                    content: content,
                    jettonWalletCode: walletCode,
                },
                minterCode
            )
        );

        // Deploy minter
        const deployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.1'));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy correctly', async () => {
        const data = await jettonMinter.getJettonData();
        expect(data.totalSupply).toBe(0n);
        expect(data.mintable).toBe(true);
        expect(data.adminAddress.equals(deployer.address)).toBe(true);
    });

    it('should mint tokens to user', async () => {
        const mintAmount = toNano('1000'); // 1000 tokens

        await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: user.address,
            jettonAmount: mintAmount,
            forwardTonAmount: toNano('0.01'),
            totalTonAmount: toNano('0.05'),
        });

        const data = await jettonMinter.getJettonData();
        expect(data.totalSupply).toBe(mintAmount);

        // Check user's wallet balance
        const userWalletAddress = await jettonMinter.getWalletAddress(user.address);
        const userWallet = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddress));
        
        const walletData = await userWallet.getWalletData();
        expect(walletData.balance).toBe(mintAmount);
        expect(walletData.ownerAddress.equals(user.address)).toBe(true);
    });

    it('should not allow non-admin to mint', async () => {
        const mintAmount = toNano('1000');

        const result = await jettonMinter.sendMint(user.getSender(), {
            toAddress: user.address,
            jettonAmount: mintAmount,
            forwardTonAmount: toNano('0.01'),
            totalTonAmount: toNano('0.05'),
        });

        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: jettonMinter.address,
            success: false,
        });
    });

    it('should transfer tokens between users', async () => {
        const mintAmount = toNano('1000');
        const transferAmount = toNano('100');
        const user2 = await blockchain.treasury('user2');

        // Mint to user
        await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: user.address,
            jettonAmount: mintAmount,
            forwardTonAmount: toNano('0.01'),
            totalTonAmount: toNano('0.05'),
        });

        // Get user's wallet
        const userWalletAddress = await jettonMinter.getWalletAddress(user.address);
        const userWallet = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddress));

        // Transfer to user2
        await userWallet.sendTransfer(user.getSender(), {
            toAddress: user2.address,
            jettonAmount: transferAmount,
            responseAddress: user.address,
            forwardTonAmount: toNano('0.01'),
        });

        // Check balances
        const user1Balance = (await userWallet.getWalletData()).balance;
        expect(user1Balance).toBe(mintAmount - transferAmount);

        const user2WalletAddress = await jettonMinter.getWalletAddress(user2.address);
        const user2Wallet = blockchain.openContract(JettonWallet.createFromAddress(user2WalletAddress));
        const user2Balance = (await user2Wallet.getWalletData()).balance;
        expect(user2Balance).toBe(transferAmount);
    });

    it('should burn tokens', async () => {
        const mintAmount = toNano('1000');
        const burnAmount = toNano('500');

        // Mint to user
        await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: user.address,
            jettonAmount: mintAmount,
            forwardTonAmount: toNano('0.01'),
            totalTonAmount: toNano('0.05'),
        });

        // Get user's wallet
        const userWalletAddress = await jettonMinter.getWalletAddress(user.address);
        const userWallet = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddress));

        // Burn tokens
        await userWallet.sendBurn(user.getSender(), {
            jettonAmount: burnAmount,
            responseAddress: user.address,
        });

        // Check balances after burn
        const walletData = await userWallet.getWalletData();
        expect(walletData.balance).toBe(mintAmount - burnAmount);

        const minterData = await jettonMinter.getJettonData();
        expect(minterData.totalSupply).toBe(mintAmount - burnAmount);
    });

    it('should change admin', async () => {
        await jettonMinter.sendChangeAdmin(deployer.getSender(), user.address);

        const data = await jettonMinter.getJettonData();
        expect(data.adminAddress.equals(user.address)).toBe(true);
    });
});
