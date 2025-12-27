import {
    Address,
    beginCell,
    Cell,
    Contract,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';

export const JettonWalletOpcodes = {
    transfer: 0xf8a7ea5,
    transfer_notification: 0x7362d09c,
    internal_transfer: 0x178d4519,
    excesses: 0xd53276db,
    burn: 0x595f07bc,
    burn_notification: 0x7bdd97de,
};

export class JettonWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new JettonWallet(address);
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        opts: {
            toAddress: Address;
            jettonAmount: bigint;
            responseAddress?: Address;
            forwardTonAmount?: bigint;
            forwardPayload?: Cell;
            queryId?: number;
        }
    ) {
        const body = beginCell()
            .storeUint(JettonWalletOpcodes.transfer, 32)
            .storeUint(opts.queryId ?? 0, 64)
            .storeCoins(opts.jettonAmount)
            .storeAddress(opts.toAddress)
            .storeAddress(opts.responseAddress ?? via.address!)
            .storeMaybeRef(null) // custom_payload
            .storeCoins(opts.forwardTonAmount ?? 0)
            .storeMaybeRef(opts.forwardPayload ?? null);

        await provider.internal(via, {
            value: toNano('0.1'), // gas for transfer
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: body.endCell(),
        });
    }

    async sendBurn(
        provider: ContractProvider,
        via: Sender,
        opts: {
            jettonAmount: bigint;
            responseAddress?: Address;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(JettonWalletOpcodes.burn, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeCoins(opts.jettonAmount)
                .storeAddress(opts.responseAddress ?? via.address!)
                .endCell(),
        });
    }

    async getWalletData(provider: ContractProvider) {
        const result = await provider.get('get_wallet_data', []);
        return {
            balance: result.stack.readBigNumber(),
            ownerAddress: result.stack.readAddress(),
            jettonMasterAddress: result.stack.readAddress(),
            jettonWalletCode: result.stack.readCell(),
        };
    }
}
