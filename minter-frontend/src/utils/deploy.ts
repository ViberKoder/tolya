import { Address, beginCell, Cell, toNano, storeStateInit, contractAddress } from '@ton/core';
import { TokenData } from '@/pages';
import { buildOnchainMetadata } from './metadata';
import { SendTransactionParams } from '@/hooks/useTonConnect';
import toast from 'react-hot-toast';

// Jetton 2.0 Minter code (compiled)
// This is a simplified version - in production you would use the actual compiled contract
const JETTON_MINTER_CODE = Cell.fromBase64(
  'te6ccgECEwEAA0UAART/APSkE/S88sgLAQIBYgIDAgLMBAUCASAPEAT9CDHAJJfA+DQ0wMBcbDyQPpAMNMfMfgjvPLh9FMMghD///8AsI4gMWq2CAKRW+D4I9DTH9Mf0gD6QDAg1ws/qSfhMN4D4DQhgAsBgAr4AfpAMfoA+gD0BPoAMFjXCwHDAI4SLKQB9FowgggZxnxeqQEggggXTLSqAxBwEXVzBQYHCAIBIAwNAhW+CbZ5tnnwR8DpkAkKAChwgEAl10nCArHy4cqL0FRYdNs8ARMByIIQ/////3CAQCFulVtZ9FowkXDi0yHXCwHDAI4S+kAx+gDSAAGYMdMfghDxC/oAut4xbBJZdnADyMv/ydBQBgOkA0MA+CNAQts84HFzBcjLH1JAyx9SQMs/UjDLP8s/yciCEBKVDmtQBssfUATPFhLLHxLLH8s/y3/J7VQD4tMfMAvIy38Sy/8TzxbIy/8S9AAT9ADLB8ntVFkCG38LAt8I0NMDAG3jAt4K5DELAOT4I9DTH9P/0gD6QDAg1ws/ghB3d3d3cPsCQUTbPBBGWSBulTBZ9FswlEEz9BXiUANBQNs8UAbHBY4S+kAx0gD6AAFvIgGYMdMfVUC63gFvIwT5AVQQJFYRVhJWEds8VBdHECRbEDcQKxBKcHBwcHBwcHBwcNs8EwwAZI4UI9MfMhWlA6UDqAFWENdJqwLjDfhj4AOVIoAgkl8E4i4hqTgBWScZvpJfBOA0NVAEArQw+CO88uL0+CP4I/gjgQCmJ74S8uL0BoIArw+xGPL0BoIA4nOxGPL0WLCCEP////9x+wK6jir4I18D+CdfBCNwBMgBghD0TfHkcIAQyMsFUAPPFsmDBvsAQzDbPOMNEQ4ASI4eMivTH9Mf0x8BqQGlA6UDqASAZvsAQEPbPFmhBdQB4DQCASA2NwIBIBESABG1Hx9qJoaQAAoAEbMl+1E0NIAAYABRt2znaiaGmvmOuF/8AX0AGihREDePEiuppj5jpxI1QABvA+b7HfAbr6AANb/AH9IBj9AH0AfSAfoAMFjXCwHDAAbwD9s8'
);

// Jetton Wallet code (compiled)
const JETTON_WALLET_CODE = Cell.fromBase64(
  'te6ccgECDgEAAxUAART/APSkE/S88sgLAQIBYgIDAgLOBAUCAWIMDQT9CDHAJJfA+DQ0wMBcbDyQPpAMNMfMfgjvPLh9FMMghD///8AsI4gMWq2CAKRW+D4I9DTH9Mf0gD6QDAg1ws/qSfhMN4D4DQhgAsBgAr4AfpAMfoA+gD0BPoAMFjXCwHDAI4SLKQB9FowgggZxnxeqQEggggXTLSqAxBwEXVzBgcICQAb7UT4APoAMNMDAXGwkl8D4PpAMfhj+GPBYAPTPzBQI9dJwh+OKiHTPzEhwwCUMQ/JlA7jDXD4I9Ag10rBCAHUAdAg10rBcOLTH/pAMAHwBJNfA+BTAdI/0j9ZAtMfAQHT/wH6APoA+kD6QNdLAY5IMBDNUML2CFBz+kDXC/9UdnNUdnP4I9DTAfpA+kDU1NTV0z8x+gDUAdDUAdDXCwFwVXBZ2zxsGXtwDqQC2zwKCwA0MNs8VBOgBfhj+CP4I4EA7VioKr7y4fEF8AUANDDT/9Mf0z/TH9Mf0z/6QNdLAcsAMBBWEFUA6tQB0NQB0AHTH9M/0x/TH9MfMBBoVhJWE1YUVhVWFVYVVhRWFFYUVhRWF1YXVhdWF1YXVhdWGFYYVhhWGFYYVhhWGFYY2zzIy//J0FAnEDsQKxBKUInIyxfIyx/LP8s/y3/Lf8t/y3/LfxL0ABL0ABLLf/QAye1UAL4wMHBTQG1tbV8DJNdJqwIB0wABwADy4c9TJdcLB8MBjh1TQ9cKAfAFxwUV8uHNBscF8uHN+EFw+CPbPBWlA9QkWRBNEDxLuls8MyBulTBZ9FswlEEz9BXiQwNwQLYIDAASMIED6Lzy4c8wAIG47UTQBNIAMTGCEA+KfqVSILD4I9DTAfpA0gD6QNIHBVBVbfhj+CO88uHwAfAF+ACCEHvdl95SIMjLP1AD+gIB+gLJ7VQANb3ejBOC52Hq6WVz2PQnYc6yVCjbNBOE7rGpaVsA'
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
    // Data structure for Jetton 2.0 Minter:
    // total_supply: Coins
    // admin_address: MsgAddress
    // content: Cell (metadata)
    // jetton_wallet_code: Cell
    const minterData = beginCell()
      .storeCoins(0) // total_supply starts at 0, will mint after
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
    
    toast.loading('Preparing deployment transaction...', { id: 'deploy' });

    // Build StateInit cell
    const stateInitCell = beginCell()
      .store(storeStateInit(stateInit))
      .endCell();

    // Build mint message body
    // op::mint = 21 (0x15)
    // query_id: uint64
    // to_address: MsgAddress
    // amount: Coins
    // master_msg: Cell (internal transfer message)
    const mintBody = beginCell()
      .storeUint(21, 32) // op::mint
      .storeUint(0, 64) // query_id
      .storeAddress(walletAddress) // to_address (mint to admin)
      .storeCoins(toNano('0.05')) // forward_ton_amount
      .storeRef(
        beginCell()
          .storeUint(0x178d4519, 32) // internal_transfer op
          .storeUint(0, 64) // query_id
          .storeCoins(supplyWithDecimals) // jetton_amount
          .storeAddress(null) // from_address (null for mint)
          .storeAddress(walletAddress) // response_address
          .storeCoins(0) // forward_ton_amount
          .storeBit(false) // forward_payload flag
          .endCell()
      )
      .endCell();

    // For deployment, we send a transaction with StateInit
    const deployParams: SendTransactionParams = {
      to: minterAddress.toString(),
      value: toNano('0.15').toString(), // 0.15 TON for deployment + mint
      stateInit: stateInitCell.toBoc().toString('base64'),
      body: mintBody.toBoc().toString('base64'),
    };

    toast.loading('Please confirm the transaction in your wallet...', { id: 'deploy' });

    // Send transaction
    const result = await sendTransaction(deployParams);
    
    if (result) {
      toast.success('Token deployed successfully!', { id: 'deploy' });
      
      return {
        success: true,
        address: minterAddress.toString(),
      };
    } else {
      throw new Error('Transaction was rejected');
    }
  } catch (error: any) {
    console.error('Deployment failed:', error);
    toast.error(error.message || 'Deployment failed', { id: 'deploy' });
    
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

// Helper to get Jetton wallet address
export function getJettonWalletAddress(
  ownerAddress: Address,
  minterAddress: Address
): Address {
  const walletData = beginCell()
    .storeCoins(0) // balance
    .storeAddress(ownerAddress) // owner_address
    .storeAddress(minterAddress) // jetton_master_address
    .storeRef(JETTON_WALLET_CODE) // jetton_wallet_code
    .endCell();

  return contractAddress(0, {
    code: JETTON_WALLET_CODE,
    data: walletData,
  });
}
