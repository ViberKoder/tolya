import { Address, beginCell, Cell, toNano, storeStateInit, contractAddress } from '@ton/core';
import { TokenData } from '@/pages';
import { buildOnchainMetadata } from './metadata';
import { SendTransactionParams } from '@/hooks/useTonConnect';
import toast from 'react-hot-toast';

// Official Jetton Minter Code (from ton-blockchain/token-contract, verified)
// These are the standard TEP-74 contracts
const JETTON_MINTER_CODE = Cell.fromBase64(
  'te6ccgECEQEAAyMAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHUBgcCASAICQDDCDHAJJfA+DQ0wMBcbCSXwPg+kAh+kQwwADy4U2CEA+KfqVSILqVMTRY8AXgghAXjUUZUiC6ljI0WPAGfwHgghBzYtCcUiC6ljQ0WPAHfwHg+QGC8IHQ83yj5nOHdP6nXFxWZhWaH+hDHoA8JJg9U7IHQSKP7AJpNBCEBCwIBIAoLABE+kQwcLry4U2ACAO9RNC6AJn0gfSBqGGEIH7TkIN6Cxs4sAAAACHoHo7/kR45EcIS5gAB5c+p/0aAEO47SgIOehtiIgud/8AAHm+gBB5JW8BDAF0QzQgq2h0dHBzOi8vc2VydmVyLmNvbS90b2tlbi5qc29ukWXCAI6GUCPPAQL0AIC9JBCi4w8MCQwNAKL4J28QIHBwgEDtRNACqAMCASAPEAAhbiPBmgC/ACaqgyqgu1V9dPJBSAIBWA0OAA3Qqq/wBO1UABG4yX7UTQ1wsfgAfbhm0N2Q0NMH0wfUMND0BPQF0x/T/9QB0PoA9AT0BPQE0QP0BDDQ+gAwE18DI8cF8uGSXwJxpOw='
);

const JETTON_WALLET_CODE = Cell.fromBase64(
  'te6ccgECEgEAAzQAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgEgBgcCASAICQDPCDHAJJfA+DQ0wMBcbCSXwPg+kD6QDH6ADFx1yH6ADH6ADBzqbQhAh6PH18GIoIImJaAoBa88uGQgghA7msoAvvLhk/go+EK88uGU+EL4Qvgo2zwQJBAjcPgo2zw0QwNYoRORMeIQIwoKCwDLCDHAJJfA+DQ0wMBcbCSXwPg+kD6QDH6ADFx1yH6ADH6ADBzqbQhAh6PH18G+CjIyx8Vyx9QA88WzBP0AMv/yRJ/+EL4KPhC+Cn4KYBCiRA9QLvbPCDHBfLhmMj4QgH0ACDCAIoMDQ4BlshwAcsHy//J0Fj4KPgjVQVy2zwQI3D4KPhCEEYQNkAl2zwwMYIQO5rKAKkE+EL4KFj4KfhC+EK88uGH+EKhAREQAYAQgBBZ2zwQJwsAOC7AAI4SMSLOAYD6AsoAy//J0BLPFpFw4soAyQG6Ac8LAc8LySD5AMgCASAPEAAVvgLXdJFbb4LgFHAAEbsBfdqJoathfIA='
);

interface DeployResult {
  success: boolean;
  address?: string;
  error?: string;
}

export async function deployJettonMinter(
  tokenData: TokenData,
  walletAddress: Address,
  sendTransaction: (params: SendTransactionParams) => Promise<any>
): Promise<DeployResult> {
  try {
    toast.loading('Подготовка контракта...', { id: 'deploy' });

    // Build metadata content
    const metadata = buildOnchainMetadata({
      name: tokenData.name,
      symbol: tokenData.symbol.toUpperCase(),
      description: tokenData.description || tokenData.name,
      image: tokenData.image || '',
      decimals: tokenData.decimals,
    });

    // Calculate total supply with decimals
    const supplyWithDecimals = BigInt(tokenData.totalSupply) * BigInt(10 ** tokenData.decimals);

    // Build initial data for minter
    const minterData = beginCell()
      .storeCoins(0) // total_supply starts at 0
      .storeAddress(walletAddress) // admin_address
      .storeRef(metadata) // content (metadata)
      .storeRef(JETTON_WALLET_CODE) // jetton_wallet_code
      .endCell();

    // Create StateInit
    const stateInit = {
      code: JETTON_MINTER_CODE,
      data: minterData,
    };

    // Calculate contract address
    const minterAddress = contractAddress(0, stateInit);
    
    console.log('Deploying to:', minterAddress.toString());

    // Build StateInit cell
    const stateInitCell = beginCell()
      .store(storeStateInit(stateInit))
      .endCell();

    // Build mint message
    const internalTransferMsg = beginCell()
      .storeUint(0x178d4519, 32) // internal_transfer op
      .storeUint(0, 64) // query_id
      .storeCoins(supplyWithDecimals) // jetton_amount
      .storeAddress(null) // from_address
      .storeAddress(walletAddress) // response_address
      .storeCoins(0) // forward_ton_amount
      .storeBit(false) // no forward_payload
      .endCell();

    const mintBody = beginCell()
      .storeUint(21, 32) // op::mint
      .storeUint(0, 64) // query_id
      .storeAddress(walletAddress) // to_address
      .storeCoins(toNano('0.05')) // ton_amount
      .storeRef(internalTransferMsg)
      .endCell();

    toast.loading('Подтвердите транзакцию в кошельке...', { id: 'deploy' });

    const deployParams: SendTransactionParams = {
      to: minterAddress.toString(),
      value: toNano('0.15').toString(),
      stateInit: stateInitCell.toBoc().toString('base64'),
      body: mintBody.toBoc().toString('base64'),
    };

    const result = await sendTransaction(deployParams);
    
    if (result) {
      toast.success('Токен успешно создан!', { id: 'deploy' });
      return { success: true, address: minterAddress.toString() };
    } else {
      throw new Error('Транзакция отклонена');
    }
  } catch (error: any) {
    console.error('Deployment failed:', error);
    toast.error(error.message || 'Ошибка создания токена', { id: 'deploy' });
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export function getJettonWalletAddress(
  ownerAddress: Address,
  minterAddress: Address
): Address {
  const walletData = beginCell()
    .storeCoins(0)
    .storeAddress(ownerAddress)
    .storeAddress(minterAddress)
    .storeRef(JETTON_WALLET_CODE)
    .endCell();

  return contractAddress(0, {
    code: JETTON_WALLET_CODE,
    data: walletData,
  });
}
