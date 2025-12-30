import { Address, beginCell, Cell, toNano, storeStateInit, contractAddress } from '@ton/core';
import { TokenData } from '@/pages';
import { buildOnchainMetadata } from './metadata';
import { SendTransactionParams } from '@/hooks/useTonConnect';
import toast from 'react-hot-toast';

// Official Jetton Minter Code from ton-blockchain/token-contract
// Compiled and verified
const JETTON_MINTER_CODE_BASE64 = 'te6cckECDQEAAdQAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgEgBgcCASAICQC7CDHAJJfA+DQ0wMBcbCSXwPg+kAh+kQwwADy4U0w+kD6APpA+gDTHwFwINdJwh+OKjCEEIAAAAAAAACBLe+X4AFwgEBINdJwh/mMPLgeO37AOBfBNMfAcAA8uFN7UTQIBAKAgEgCwwACTQ/fDqRAAhMjKgPQD6APQAzxYjzxbKAMntVAAP0AdMHIcKgAdMAAeMC7VT4DwBxG+AAKDB0JCEw8vAEgCjXCgEm0N8QRG1tyMoAEss/EvQA9ADLAMkg2zx/ADEzMjQz0NU1EH8zVRLbPMjKABLLP0v0AMsAye1UAQD0E9DTAfpAMPpEMqJz+CXXSaACAqCrEfgjgggPQkC+8uBMIKsC+GPy4ExSYNs8gggPQkC8cPLgTIAg1yGwHPLgTL3y4E0iwgCOGCKCEDuaygC+8uBNBXCAQNs8f3BwVSBtbW3bPBA0PVvgIIIQ83x4InK6sPLgTNs8FRYXACCBAOq6EqGhArny0E1SINs8MgJq0NMf0z/R+CjXSddbFvhD+EL4KVUCED1VA9s8KYBCBqYBqYRw+CMgED9VGds8GxwdAOxAcIBA+EJY+EHbPHD4I4EBC/QKIYEBAfSDb6UgjjJfA4EBLPRL2zwgbpMwcJUgwQG68uLMkTHi1DDQ0wMBeLCTXwNw4PpAMPhC+EHbPH/bMeCCEJW4+5e64wI0NAL4Qvgo2zz4Qm1DE9s8XvhFxwXjAlUTREQe';

const JETTON_WALLET_CODE_BASE64 = 'te6cckECEQEAA0MAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHOBgcCASAMDQC7CDHAJJfBODQ0wMBcbCSXwTg+kAh+kQwwADy4U0w0x8BIMMAkl8E4PpA+gAx+gAwc6m0AALTH4IQe92X3roSsfLhS/go+ELbPPhCcPgo2zz4RfhCxwXy4U0T2zyAICQoLAAj0BNMHAAjXCx9/ADAg10nBIJFbj2Mg1wsfIIIQ8MDmcLrjAjDgAgFqDg8AOjD4Qvgo2zwwgggbd0Dy4VD4QvhCyMoAE8v/ye1UAPBBbIIIG3dA+ELbPIEBC/QKIYEBAfSDb6UgjjJfA4EBLPRL2zwgbpMwcJUgwQG68uLMkTHi1DDQ0wMBeLCTXwNw4PpAMPhC+EHbPH/bMeCCEJW4+5e64wI0NAL4Qvgo2zz4Qm1DE9s8XvhFxwXjAlUTREQQAAmhH5egWAAVvgLXdJFbb4tBBHAA6IIQO5rKAFIwufLhS/hCxwXy4UxSQNs8VQTbPMjKABPL/1AF+gIWygBYzxYTygDLB8ntVPhCcPgjUAT4Qts8gggbd0Chwv/y4VBwgEDbPFE0oVIHuY4VUUShqwAhwgCOl1EUoKsAoKsAoKH5QQEB';

// Create Cell from base64
function cellFromBase64(base64: string): Cell {
  return Cell.fromBase64(base64);
}

const JETTON_MINTER_CODE = cellFromBase64(JETTON_MINTER_CODE_BASE64);
const JETTON_WALLET_CODE = cellFromBase64(JETTON_WALLET_CODE_BASE64);

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
    // Jetton Minter data structure:
    // total_supply:Coins admin_address:MsgAddress content:^Cell jetton_wallet_code:^Cell
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

    // Build mint message body
    // op::mint = 21 (0x15)
    const internalTransferMsg = beginCell()
      .storeUint(0x178d4519, 32) // internal_transfer op
      .storeUint(0, 64) // query_id
      .storeCoins(supplyWithDecimals) // jetton_amount
      .storeAddress(null) // from_address (null = minter)
      .storeAddress(walletAddress) // response_address
      .storeCoins(0) // forward_ton_amount
      .storeBit(false) // no forward_payload
      .endCell();

    const mintBody = beginCell()
      .storeUint(21, 32) // op::mint = 21
      .storeUint(0, 64) // query_id
      .storeAddress(walletAddress) // to_address
      .storeCoins(toNano('0.05')) // ton_amount for wallet deploy
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
      
      return {
        success: true,
        address: minterAddress.toString(),
      };
    } else {
      throw new Error('Транзакция отклонена');
    }
  } catch (error: any) {
    console.error('Deployment failed:', error);
    toast.error(error.message || 'Ошибка создания токена', { id: 'deploy' });
    
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
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
