import { Address, beginCell, Cell, toNano, storeStateInit, contractAddress } from '@ton/core';
import { TokenData } from '@/pages';
import { buildOnchainMetadata } from './metadata';
import { SendTransactionParams, TransactionMessage } from '@/hooks/useTonConnect';
import toast from 'react-hot-toast';

// Monetization wallet address
const MONETIZATION_WALLET = 'UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz';
const DEPLOY_FEE = toNano('0.2'); // Fee for contract deployment + mint
const MONETIZATION_FEE = toNano('0.8'); // Service fee
export const TOTAL_DEPLOY_COST = toNano('1'); // Total cost: 0.2 + 0.8 = 1 TON

// ============================================================================
// OFFICIAL JETTON CONTRACTS (from TonWeb / ton-blockchain/token-contract)
// These are the standard, widely-supported jetton contracts used by all explorers
// ============================================================================

// Official Jetton Minter code from TonWeb
// Source: https://github.com/nickkubrick/tonweb/blob/master/src/contract/token/ft/JettonMinter.js
const JETTON_MINTER_CODE_HEX = 'B5EE9C7241020B010001ED000114FF00F4A413F4BCF2C80B0102016202030202CC040502037A60090A03EFD9910E38048ADF068698180B8D848ADF07D201800E98FE99FF6A2687D007D206A6A18400AA9385D47181A9AA8AAE382F9702480FD207D006A18106840306B90FD001812881A28217804502A906428027D012C678B666664F6AA7041083DEECBEF29385D71811A92E001F1811802600271812F82C207F97840607080093DFC142201B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064907C80383A6465816503E5FFE4E83BC00C646582AC678B28027D0109E5B589666664B8FD80400FE3603FA00FA40F82854120870542013541403C85004FA0258CF1601CF16CCC922C8CB0112F400F400CB00C9F9007074C8CB02CA07CBFFC9D05008C705F2E04A12A1035024C85004FA0258CF16CCCCC9ED5401FA403020D70B01C3008E1F8210D53276DB708010C8CB055003CF1622FA0212CB6ACB1FCB3FC98042FB00915BE200303515C705F2E049FA403059C85004FA0258CF16CCCCC9ED54002E5143C705F2E049D43001C85004FA0258CF16CCCCC9ED54007DADBCF6A2687D007D206A6A183618FC1400B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064FC80383A6465816503E5FFE4E840001FAF16F6A2687D007D206A6A183FAA904051007F09';

// Official Jetton Wallet code from TonWeb
const JETTON_WALLET_CODE_HEX = 'B5EE9C7241021201000328000114FF00F4A413F4BCF2C80B0102016202030202CC0405001BA0F605DA89A1F401F481F481A8610201D40607020148080900BB0831C02497C138007434C0C05C6C2544D7C0FC02F83E903E900C7E800C5C75C87E800C7E800C00B4C7E08403E29FA954882EA54C4D167C0238208405E3514654882EA58C511100FC02780D60841657C1EF2EA4D67C02B817C12103FCBC2000113E910C1C2EBCB853600201200A0B020120101101F500F4CFFE803E90087C007B51343E803E903E90350C144DA8548AB1C17CB8B04A30BFFCB8B0950D109C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C032483E401C1D3232C0B281F2FFF274013E903D010C7E801DE0063232C1540233C59C3E8085F2DAC4F3208405E351467232C7C6600C03F73B51343E803E903E90350C0234CFFE80145468017E903E9014D6F1C1551CDB5C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C0327E401C1D3232C0B281F2FFF274140371C1472C7CB8B0C2BE80146A2860822625A020822625A004AD822860822625A028062849F8C3C975C2C070C008E00D0E0F009ACB3F5007FA0222CF165006CF1625FA025003CF16C95005CC2391729171E25008A813A08208989680AA008208989680A0A014BCF2E2C504C98040FB001023C85004FA0258CF1601CF16CCC9ED5400705279A018A182107362D09CC8CB1F5230CB3F58FA025007CF165007CF16C9718018C8CB0524CF165006FA0215CB6A14CCC971FB0010241023000E10491038375F040076C200B08E218210D53276DB708010C8CB055008CF165004FA0216CB6A12CB1F12CB3FC972FB0093356C21E203C85004FA0258CF1601CF16CCC9ED5400DB3B51343E803E903E90350C01F4CFFE803E900C145468549271C17CB8B049F0BFFCB8B0A0822625A02A8005A805AF3CB8B0E0841EF765F7B232C7C572CFD400FE8088B3C58073C5B25C60063232C14933C59C3E80B2DAB33260103EC01004F214013E809633C58073C5B3327B55200083200835C87B51343E803E903E90350C0134C7E08405E3514654882EA0841EF765F784EE84AC7CB8B174CFCC7E800C04E81408F214013E809633C58073C5B3327B55205ECCF23D';

// Jetton 1.0 Operation Codes
const Op = {
  mint: 21, // 0x15
  internal_transfer: 0x178d4519,
  transfer: 0xf8a7ea5,
  burn: 0x595f07bc,
  change_admin: 3,
  change_content: 4,
};

// Parse hex to Cell
function hexToCell(hex: string): Cell {
  return Cell.fromBoc(Buffer.from(hex, 'hex'))[0];
}

const JETTON_MINTER_CODE = hexToCell(JETTON_MINTER_CODE_HEX);
const JETTON_WALLET_CODE = hexToCell(JETTON_WALLET_CODE_HEX);

interface DeployResult {
  success: boolean;
  address?: string;
  error?: string;
}

export async function deployJettonMinter(
  tokenData: TokenData,
  walletAddress: Address,
  sendTransaction: (params: SendTransactionParams) => Promise<any>,
  sendMultipleMessages?: (messages: TransactionMessage[]) => Promise<any>
): Promise<DeployResult> {
  try {
    toast.loading('Подготовка Jetton контракта...', { id: 'deploy' });

    // Build metadata content using TEP-64 on-chain format
    const metadata = buildOnchainMetadata({
      name: tokenData.name,
      symbol: tokenData.symbol.toUpperCase(),
      description: tokenData.description || tokenData.name,
      image: tokenData.image || '',
      decimals: tokenData.decimals,
    });

    // Calculate total supply with decimals
    const supplyWithDecimals = BigInt(tokenData.totalSupply) * BigInt(10 ** tokenData.decimals);

    // Build initial data for Jetton Minter
    // Structure (Jetton 1.0): total_supply:Coins admin:MsgAddress content:^Cell wallet_code:^Cell
    const minterData = beginCell()
      .storeCoins(0) // total_supply starts at 0
      .storeAddress(walletAddress) // admin_address
      .storeRef(metadata) // content (TEP-64 on-chain metadata)
      .storeRef(JETTON_WALLET_CODE) // wallet_code
      .endCell();

    // Create StateInit
    const stateInit = {
      code: JETTON_MINTER_CODE,
      data: minterData,
    };

    // Calculate contract address
    const minterAddress = contractAddress(0, stateInit);
    
    console.log('Deploying Jetton to:', minterAddress.toString());

    // Build StateInit cell
    const stateInitCell = beginCell()
      .store(storeStateInit(stateInit))
      .endCell();

    // Build mint message
    // Op::mint = 21
    const mintBody = beginCell()
      .storeUint(Op.mint, 32) // op::mint = 21
      .storeUint(0, 64) // query_id
      .storeAddress(walletAddress) // to_address (destination)
      .storeCoins(toNano('0.05')) // ton_amount for internal transfer
      .storeRef(
        beginCell()
          .storeUint(Op.internal_transfer, 32) // internal_transfer op
          .storeUint(0, 64) // query_id
          .storeCoins(supplyWithDecimals) // jetton_amount
          .storeAddress(null) // from_address (null for mint)
          .storeAddress(walletAddress) // response_address
          .storeCoins(0) // forward_ton_amount
          .storeBit(false) // no forward_payload
          .endCell()
      )
      .endCell();

    toast.loading('Подтвердите транзакцию в кошельке (1 TON)...', { id: 'deploy' });

    // Create messages: deploy + monetization
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
    
    // Use sendMultipleMessages if available
    if (sendMultipleMessages) {
      result = await sendMultipleMessages([deployMessage, monetizationMessage]);
    } else {
      // Fallback: send deploy transaction only
      const deployParams: SendTransactionParams = {
        to: minterAddress.toString(),
        value: DEPLOY_FEE.toString(),
        stateInit: stateInitCell.toBoc().toString('base64'),
        body: mintBody.toBoc().toString('base64'),
      };
      result = await sendTransaction(deployParams);
    }
    
    if (result) {
      toast.success('Jetton токен успешно создан!', { id: 'deploy' });
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

// Export contract info
export const JETTON_VERSION = '1.0';

// Export operation codes for admin panel
export { Op as JettonOpcodes };
