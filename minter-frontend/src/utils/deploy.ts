import { Address, beginCell, Cell, toNano, storeStateInit, contractAddress, Dictionary } from '@ton/core';
import { TokenData } from '@/pages';
import { SendTransactionParams, TransactionMessage } from '@/hooks/useTonConnect';
import { sha256 } from '@noble/hashes/sha256';
import toast from 'react-hot-toast';

// Monetization wallet address
const MONETIZATION_WALLET = 'UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz';
const DEPLOY_FEE = toNano('0.2');
const MONETIZATION_FEE = toNano('0.8');
export const TOTAL_DEPLOY_COST = toNano('1');

// ============================================================================
// JETTON CONTRACTS with On-chain Metadata Support
// Based on https://github.com/ton-blockchain/minter-contract
// Compiled using func-js v0.4.6
// ============================================================================

// Jetton Minter code (from minter-contract - supports on-chain metadata)
const JETTON_MINTER_CODE_BASE64 = 'te6ccgECDQEAApwAART/APSkE/S88sgLAQIBYgIDAgLMBAUCA3pgCwwC8dkGOASS+B8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABgBaY/pn/aiaH0AfSBqahhACqk4XUcZmpqbGyiaY4L5cCSBfSB9AGoYEGhAMGuQ/QAYEogaKCF4BQpQKBnkKAJ9ASxni2ZmZPaqcEEIPe7L7yk4XXGBQGBwCTtfBQiAbgqEAmqCgHkKAJ9ASxniwDni2ZkkWRlgIl6AHoAZYBkkHyAODpkZYFlA+X/5Og7wAxkZYKsZ4soAn0BCeW1iWZmZLj9gEBwDY3NwH6APpA+ChUEgZwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAyfkAcHTIywLKB8v/ydBQBscF8uBKoQNFRchQBPoCWM8WzMzJ7VQB+kAwINcLAcMAkVvjDQgBpoIQLHa5c1JwuuMCNTc3I8ADjhozUDXHBfLgSQP6QDBZyFAE+gJYzxbMzMntVOA1AsAEjhhRJMcF8uBJ1DBDAMhQBPoCWM8WzMzJ7VTgXwWED/LwCQA+ghDVMnbbcIAQyMsFUAPPFiL6AhLLassfyz/JgEL7AAH+Nl8DggiYloAVoBW88uBLAvpA0wAwlcghzxbJkW3ighDRc1QAcIAYyMsFUAXPFiT6AhTLahPLHxTLPyP6RDBwuo4z+ChEA3BUIBNUFAPIUAT6AljPFgHPFszJIsjLARL0APQAywDJ+QBwdMjLAsoHy//J0M8WlmwicAHLAeL0AAoACsmAQPsAAH2tvPaiaH0AfSBqahg2GPwUALgqEAmqCgHkKAJ9ASxniwDni2ZkkWRlgIl6AHoAZYBk/IA4OmRlgWUD5f/k6EAAH68W9qJofQB9IGpqGD+qkEA=';

// Jetton Wallet code (from minter-contract)
const JETTON_WALLET_CODE_BASE64 = 'te6ccgECEQEAAyMAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHUBgcCASAICQDDCDHAJJfBOAB0NMDAXGwlRNfA/AM4PpA+kAx+gAxcdch+gAx+gAwc6m0AALTH4IQD4p+pVIgupUxNFnwCeCCEBeNRRlSILqWMUREA/AK4DWCEFlfB7y6k1nwC+BfBIQP8vCAAET6RDBwuvLhTYAIBIAoLAIPUAQa5D2omh9AH0gfSBqGAJpj8EIC8aijKkQXUEIPe7L7wndCVj5cWLpn5j9ABgJ0CgR5CgCfQEsZ4sA54tmZPaqQB8VA9M/+gD6QCHwAe1E0PoA+kD6QNQwUTahUirHBfLiwSjC//LiwlQ0QnBUIBNUFAPIUAT6AljPFgHPFszJIsjLARL0APQAywDJIPkAcHTIywLKB8v/ydAE+kD0BDH6ACDXScIA8uLEd4AYyMsFUAjPFnD6AhfLaxPMgMAgEgDQ4AnoIQF41FGcjLHxnLP1AH+gIizxZQBs8WJfoCUAPPFslQBcwjkXKRceJQCKgToIIJycOAoBS88uLFBMmAQPsAECPIUAT6AljPFgHPFszJ7VQC9ztRND6APpA+kDUMAjTP/oAUVGgBfpA+kBTW8cFVHNtcFQgE1QUA8hQBPoCWM8WAc8WzMkiyMsBEvQA9ADLAMn5AHB0yMsCygfL/8nQUA3HBRyx8uLDCvoAUaihggiYloBmtgihggiYloCgGKEnlxBJEDg3XwTjDSXXCwGAPEADXO1E0PoA+kD6QNQwB9M/+gD6QDBRUaFSSccF8uLBJ8L/8uLCBYIJMS0AoBa88uLDghB73ZfeyMsfFcs/UAP6AiLPFgHPFslxgBjIywUkzxZw+gLLaszJgED7AEATyFAE+gJYzxYBzxbMye1UgAHBSeaAYoYIQc2LQnMjLH1Iwyz9Y+gJQB88WUAfPFslxgBDIywUkzxZQBvoCFctqFMzJcfsAECQQIwB8wwAjwgCwjiGCENUydttwgBDIywVQCM8WUAT6AhbLahLLHxLLP8ly+wCTNWwh4gPIUAT6AljPFgHPFszJ7VQ=';

// Operation codes
export const Op = {
  transfer: 0xf8a7ea5,
  internal_transfer: 0x178d4519,
  burn: 0x595f07bc,
  burn_notification: 0x7bdd97de,
  mint: 21,
  change_admin: 3,
  change_content: 4,
  provide_wallet_address: 0x2c76b973,
  take_wallet_address: 0xd1735400,
  excesses: 0xd53276db,
};

// Parse base64 to Cell
function base64ToCell(base64: string): Cell {
  return Cell.fromBase64(base64);
}

const JETTON_MINTER_CODE = base64ToCell(JETTON_MINTER_CODE_BASE64);
const JETTON_WALLET_CODE = base64ToCell(JETTON_WALLET_CODE_BASE64);

interface DeployResult {
  success: boolean;
  address?: string;
  error?: string;
}

// ============================================================================
// TEP-64 On-chain Metadata Builder
// Based on https://github.com/ton-blockchain/minter-contract
// ============================================================================

const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

type JettonMetaDataKeys = 'name' | 'description' | 'image' | 'symbol' | 'decimals';

const jettonOnChainMetadataSpec: { [key in JettonMetaDataKeys]: 'utf8' | 'ascii' } = {
  name: 'utf8',
  description: 'utf8',
  image: 'ascii',
  symbol: 'utf8',
  decimals: 'utf8',
};

/**
 * Build on-chain metadata cell for Jetton (TEP-64)
 * Exactly matches the format used by minter-contract
 */
function buildOnchainMetadataCell(data: { [s: string]: string | undefined }): Cell {
  const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    
    const encoding = jettonOnChainMetadataSpec[key as JettonMetaDataKeys];
    if (!encoding) return;

    // Create SHA256 hash of the key
    const keyHash = Buffer.from(sha256(key));
    
    // Encode the value
    const valueBuffer = Buffer.from(value, encoding);
    
    // Build the value cell with snake format (0x00 prefix + data)
    const CELL_MAX_SIZE_BYTES = 127;
    
    if (valueBuffer.length <= CELL_MAX_SIZE_BYTES - 1) {
      // Fits in single cell
      const cell = beginCell()
        .storeUint(SNAKE_PREFIX, 8)
        .storeBuffer(valueBuffer)
        .endCell();
      dict.set(keyHash, cell);
    } else {
      // Need multiple cells - snake format
      let remaining = valueBuffer;
      let rootBuilder = beginCell().storeUint(SNAKE_PREFIX, 8);
      
      const firstChunkSize = CELL_MAX_SIZE_BYTES - 1;
      rootBuilder.storeBuffer(remaining.slice(0, firstChunkSize));
      remaining = remaining.slice(firstChunkSize);
      
      let tailCell: Cell | null = null;
      const chunks: Buffer[] = [];
      while (remaining.length > 0) {
        chunks.push(remaining.slice(0, CELL_MAX_SIZE_BYTES));
        remaining = remaining.slice(CELL_MAX_SIZE_BYTES);
      }
      
      for (let i = chunks.length - 1; i >= 0; i--) {
        const builder = beginCell().storeBuffer(chunks[i]);
        if (tailCell) {
          builder.storeRef(tailCell);
        }
        tailCell = builder.endCell();
      }
      
      if (tailCell) {
        rootBuilder.storeRef(tailCell);
      }
      
      dict.set(keyHash, rootBuilder.endCell());
    }
  });

  // Build final cell: 0x00 prefix + dictionary
  return beginCell()
    .storeUint(ONCHAIN_CONTENT_PREFIX, 8)
    .storeDict(dict)
    .endCell();
}

/**
 * Build off-chain metadata cell (URL to JSON)
 */
function buildOffchainMetadataCell(uri: string): Cell {
  return beginCell()
    .storeUint(0x01, 8) // Off-chain prefix
    .storeStringTail(uri)
    .endCell();
}

export async function deployJettonMinter(
  tokenData: TokenData,
  walletAddress: Address,
  sendTransaction: (params: SendTransactionParams) => Promise<any>,
  sendMultipleMessages?: (messages: TransactionMessage[]) => Promise<any>
): Promise<DeployResult> {
  try {
    toast.loading('Preparing Jetton contract...', { id: 'deploy' });

    let contentCell: Cell;

    // Check if user provided an off-chain metadata URL
    if (tokenData.metadataUrl && tokenData.metadataUrl.trim()) {
      console.log('Using off-chain metadata URL:', tokenData.metadataUrl);
      contentCell = buildOffchainMetadataCell(tokenData.metadataUrl.trim());
    } else {
      // Use on-chain metadata (TEP-64) - minter-contract style
      console.log('Building on-chain metadata...');
      contentCell = buildOnchainMetadataCell({
        name: tokenData.name,
        symbol: tokenData.symbol.toUpperCase(),
        description: tokenData.description || tokenData.name,
        image: tokenData.image || undefined,
        decimals: tokenData.decimals.toString(),
      });
    }

    // Calculate total supply with decimals
    const supplyWithDecimals = BigInt(tokenData.totalSupply) * BigInt(10 ** tokenData.decimals);

    // Build initial data for minter-contract style Jetton
    // Structure: total_supply, admin_address, content, jetton_wallet_code
    const minterData = beginCell()
      .storeCoins(0) // total_supply starts at 0
      .storeAddress(walletAddress) // admin_address
      .storeRef(contentCell) // content (TEP-64 on-chain or off-chain)
      .storeRef(JETTON_WALLET_CODE) // jetton_wallet_code
      .endCell();

    // Create StateInit
    const stateInit = {
      code: JETTON_MINTER_CODE,
      data: minterData,
    };

    // Calculate contract address
    const minterAddress = contractAddress(0, stateInit);
    
    console.log('Deploying Jetton to:', minterAddress.toString());
    console.log('Admin:', walletAddress.toString());
    console.log('Token:', tokenData.name, tokenData.symbol);

    // Build StateInit cell
    const stateInitCell = beginCell()
      .store(storeStateInit(stateInit))
      .endCell();

    // Build mint message (op::mint = 21 for minter-contract)
    const internalTransferMsg = beginCell()
      .storeUint(Op.internal_transfer, 32)
      .storeUint(0, 64) // query_id
      .storeCoins(supplyWithDecimals) // jetton_amount
      .storeAddress(null) // from_address
      .storeAddress(walletAddress) // response_address
      .storeCoins(toNano('0.01')) // forward_ton_amount
      .storeMaybeRef(null) // custom_payload
      .endCell();

    const mintBody = beginCell()
      .storeUint(Op.mint, 32) // op = 21 (mint)
      .storeUint(0, 64) // query_id
      .storeAddress(walletAddress) // to_address
      .storeCoins(toNano('0.1')) // amount for wallet deployment
      .storeRef(internalTransferMsg) // master_msg
      .endCell();

    toast.loading('Confirm transaction in wallet (1 TON)...', { id: 'deploy' });

    const deployMessage: TransactionMessage = {
      address: minterAddress.toString(),
      amount: DEPLOY_FEE.toString(),
      stateInit: stateInitCell.toBoc().toString('base64'),
      payload: mintBody.toBoc().toString('base64'),
    };

    const monetizationMessage: TransactionMessage = {
      address: MONETIZATION_WALLET,
      amount: MONETIZATION_FEE.toString(),
    };

    let result;
    
    if (sendMultipleMessages) {
      result = await sendMultipleMessages([deployMessage, monetizationMessage]);
    } else {
      const deployParams: SendTransactionParams = {
        to: minterAddress.toString(),
        value: DEPLOY_FEE.toString(),
        stateInit: stateInitCell.toBoc().toString('base64'),
        body: mintBody.toBoc().toString('base64'),
      };
      result = await sendTransaction(deployParams);
    }
    
    if (result) {
      toast.success('Jetton token created successfully!', { id: 'deploy' });
      return { success: true, address: minterAddress.toString() };
    } else {
      throw new Error('Transaction rejected');
    }
  } catch (error: any) {
    console.error('Deployment failed:', error);
    toast.error(error.message || 'Failed to create token', { id: 'deploy' });
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
    .endCell();

  return contractAddress(0, {
    code: JETTON_WALLET_CODE,
    data: walletData,
  });
}

export { Op as JettonOpcodes };
export const JETTON_VERSION = '2.0';
