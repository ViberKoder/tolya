import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
    Dictionary,
    DictionaryValue,
} from '@ton/core';

export type JettonMinterConfig = {
    adminAddress: Address;
    content: Cell;
    jettonWalletCode: Cell;
};

export type JettonMetadata = {
    name: string;
    description: string;
    image: string;
    symbol: string;
    decimals: string;
};

// Helper to create on-chain content cell
export function buildJettonOnchainContent(metadata: JettonMetadata): Cell {
    const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), createContentValue());
    
    // SHA256 hashes of field names (as used in TEP-64)
    const nameKey = BigInt('0x' + Buffer.from('name').toString('hex').padEnd(64, '0'));
    const descKey = BigInt('0x' + Buffer.from('description').toString('hex').padEnd(64, '0'));
    const imageKey = BigInt('0x' + Buffer.from('image').toString('hex').padEnd(64, '0'));
    const symbolKey = BigInt('0x' + Buffer.from('symbol').toString('hex').padEnd(64, '0'));
    const decimalsKey = BigInt('0x' + Buffer.from('decimals').toString('hex').padEnd(64, '0'));
    
    dict.set(nameKey, createSnakeContent(metadata.name));
    dict.set(descKey, createSnakeContent(metadata.description));
    dict.set(imageKey, createSnakeContent(metadata.image));
    dict.set(symbolKey, createSnakeContent(metadata.symbol));
    dict.set(decimalsKey, createSnakeContent(metadata.decimals));
    
    return beginCell()
        .storeUint(0, 8) // on-chain tag
        .storeDict(dict)
        .endCell();
}

function createContentValue(): DictionaryValue<Cell> {
    return {
        serialize: (src: Cell, builder) => {
            builder.storeRef(src);
        },
        parse: (src) => {
            return src.loadRef();
        },
    };
}

function createSnakeContent(content: string): Cell {
    return beginCell()
        .storeUint(0, 8) // snake data prefix
        .storeStringTail(content)
        .endCell();
}

export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
    return beginCell()
        .storeCoins(0) // total_supply
        .storeAddress(config.adminAddress)
        .storeRef(config.content)
        .storeRef(config.jettonWalletCode)
        .endCell();
}

export const Opcodes = {
    mint: 21,
    burn_notification: 0x7bdd97de,
    change_admin: 3,
    change_content: 4,
    provide_wallet_address: 0x2c76b973,
    take_wallet_address: 0xd1735400,
};

export class JettonMinter implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }

    static createFromConfig(config: JettonMinterConfig, code: Cell, workchain = 0) {
        const data = jettonMinterConfigToCell(config);
        const init = { code, data };
        return new JettonMinter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        opts: {
            toAddress: Address;
            jettonAmount: bigint;
            forwardTonAmount: bigint;
            totalTonAmount: bigint;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.totalTonAmount + toNano('0.05'), // extra for fees
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.mint, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.toAddress)
                .storeCoins(opts.jettonAmount)
                .storeCoins(opts.forwardTonAmount)
                .storeCoins(opts.totalTonAmount)
                .endCell(),
        });
    }

    async sendChangeAdmin(
        provider: ContractProvider,
        via: Sender,
        newAdmin: Address,
        queryId?: number
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.change_admin, 32)
                .storeUint(queryId ?? 0, 64)
                .storeAddress(newAdmin)
                .endCell(),
        });
    }

    async sendChangeContent(
        provider: ContractProvider,
        via: Sender,
        newContent: Cell,
        queryId?: number
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.change_content, 32)
                .storeUint(queryId ?? 0, 64)
                .storeRef(newContent)
                .endCell(),
        });
    }

    async getJettonData(provider: ContractProvider) {
        const result = await provider.get('get_jetton_data', []);
        return {
            totalSupply: result.stack.readBigNumber(),
            mintable: result.stack.readNumber() !== 0,
            adminAddress: result.stack.readAddress(),
            content: result.stack.readCell(),
            jettonWalletCode: result.stack.readCell(),
        };
    }

    async getWalletAddress(provider: ContractProvider, ownerAddress: Address) {
        const result = await provider.get('get_wallet_address', [
            { type: 'slice', cell: beginCell().storeAddress(ownerAddress).endCell() },
        ]);
        return result.stack.readAddress();
    }
}
