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
// OFFICIAL JETTON 2.0 CONTRACTS from ton-blockchain/stablecoin-contract
// This is the standard Jetton implementation used by USDT and other major tokens
// Source: https://github.com/ton-blockchain/stablecoin-contract
// ============================================================================

// Official Jetton Minter code from stablecoin-contract
const JETTON_MINTER_CODE_HEX = 'b5ee9c72410218010005bb000114ff00f4a413f4bcf2c80b0102016207020201200603020271050400cfaf16f6a2687d007d207d206a6a68bf99e836c1783872ebdb514d9c97c283b7f0ae5179029e2b6119c39462719e4f46ed8f7413e62c780a417877407e978f01a40711411b1acb773a96bdd93fa83bb5ca8435013c8c4b3ac91f4589b4780a38646583fa0064a180400085adbcf6a2687d007d207d206a6a688a2f827c1400b82a3002098a81e46581ac7d0100e78b00e78b6490e4658089fa00097a00658064fc80383a6465816503e5ffe4e8400025bd9adf6a2687d007d207d206a6a6888122f8240202cb0908001da23864658380e78b64814183fa0bc002f3d0cb434c0c05c6c238ecc200835c874c7c0608405e351466ea44c38601035c87e800c3b51343e803e903e90353534541168504d3214017e809400f3c58073c5b333327b55383e903e900c7e800c7d007e800c7e80004c5c3e0e80b4c7c04074cfc044bb51343e803e903e9035353449a084190adf41eeb8c089a150a03fa82107bdd97deba8ee7363805fa00fa40f82854120a70546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a14414506603c85005fa025003cf1601cf16ccccc9ed54fa40d120d70b01c000b3915be30de02682102c76b973bae302352514120b04f882106501f354ba8e223134365145c705f2e04902fa40d1103402c85005fa025003cf1601cf16ccccc9ed54e0258210fb88e119ba8e2132343603d15131c705f2e0498b025512c85005fa025003cf1601cf16ccccc9ed54e034248210235caf52bae30237238210cb862902bae302365b2082102508d66abae3026c310f0e0d0c00188210d372158cbadc840ff2f0001e3002c705f2e049d4d4d101ed54fb040044335142c705f2e049c85003cf16c9134440c85005fa025003cf1601cf16ccccc9ed5402ec3031325033c705f2e049fa40fa00d4d120d0d31f01018040d7212182100f8a7ea5ba8e4d36208210595f07bcba8e2c3004fa0031fa4031f401d120f839206e943081169fde718102f270f8380170f836a0811a7770f836a0bcf2b08e138210eed236d3ba9504d30331d19434f2c048e2e2e30d500370111000c082103b9aca0070fb02f828450470546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c920f9007074c8cb02ca07cbffc9d0c8801801cb0501cf1658fa02029858775003cb6bcccc9730017158cb6acce2c98011fb0000ce31fa0031fa4031fa4031f401fa0020d70b009ad74bc00101c001b0f2b19130e25442162191729171e2f839206e938124279120e2216e94318128739101e25023a813a0738103a370f83ca00270f83612a00170f836a07381040982100966018070f837a0bcf2b001fc145f04323401fa40d2000101d195c821cf16c9916de2c8801001cb055004cf1670fa027001cb6a8210d173540001cb1f500401cb3f23fa4430c0008e35f828440470546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c9f9007074c8cb02ca07cbffc9d012cf1697316c127001cb01e2f400c91300088050fb000044c8801001cb0501cf1670fa027001cb6a8210d53276db01cb1f0101cb3fc98042fb00019635355161c705f2e04904fa4021fa4430c000f2e14dfa00d4d120d0d31f018210178d4519baf2e0488040d721fa00fa4031fa4031fa0020d70b009ad74bc00101c001b0f2b19130e254431b16018e2191729171e2f839206e938124279120e2216e94318128739101e25023a813a0738103a370f83ca00270f83612a00170f836a07381040982100966018070f837a0bcf2b025597f1700ec82103b9aca0070fb02f828450470546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c920f9007074c8cb02ca07cbffc9d0c8801801cb0501cf1658fa02029858775003cb6bcccc9730017158cb6acce2c98011fb005005a04314c85005fa025003cf1601cf16ccccc9ed546f6e5bfb';

// Official Jetton Wallet code from stablecoin-contract
const JETTON_WALLET_CODE_HEX = 'b5ee9c7241020f010003d1000114ff00f4a413f4bcf2c80b01020162050202012004030021bc508f6a2686981fd007d207d2068af81c0027bfd8176a2686981fd007d207d206899fc152098402f8d001d0d3030171b08e48135f038020d721ed44d0d303fa00fa40fa40d104d31f01840f218210178d4519ba0282107bdd97deba12b1f2f48040d721fa003012a0401303c8cb0358fa0201cf1601cf16c9ed54e0fa40fa4031fa0031f401fa0031fa00013170f83a02d31f012082100f8a7ea5ba8e85303459db3ce0330c0602d0228210178d4519ba8e84325adb3ce034218210595f07bcba8e843101db3ce032208210eed236d3ba8e2f30018040d721d303d1ed44d0d303fa00fa40fa40d1335142c705f2e04a403303c8cb0358fa0201cf1601cf16c9ed54e06c218210d372158cbadc840ff2f0080701f2ed44d0d303fa00fa40fa40d106d33f0101fa00fa40f401d15141a15288c705f2e04926c2fff2afc882107bdd97de01cb1f5801cb3f01fa0221cf1658cf16c9c8801801cb0526cf1670fa02017158cb6accc903f839206e943081169fde718102f270f8380170f836a0811a7770f836a0bcf2b0028050fb00030903f4ed44d0d303fa00fa40fa40d12372b0c002f26d07d33f0101fa005141a004fa40fa4053bac705f82a5464e070546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c9f9007074c8cb02ca07cbffc9d0500cc7051bb1f2e04a09fa0021925f04e30d26d70b01c000b393306c33e30d55020b0a09002003c8cb0358fa0201cf1601cf16c9ed54007a5054a1f82fa07381040982100966018070f837b60972fb02c8801001cb055005cf1670fa027001cb6a8210d53276db01cb1f5801cb3fc9810082fb00590060c882107362d09c01cb1f2501cb3f5004fa0258cf1658cf16c9c8801001cb0524cf1658fa02017158cb6accc98011fb0001f203d33f0101fa00fa4021fa4430c000f2e14ded44d0d303fa00fa40fa40d15309c7052471b0c00021b1f2ad522bc705500ab1f2e0495115a120c2fff2aff82a54259070546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c920f9007074c8cb02ca07cbffc9d004fa40f401fa00200d019820d70b009ad74bc00101c001b0f2b19130e2c88210178d451901cb1f500a01cb3f5008fa0223cf1601cf1626fa025007cf16c9c8801801cb055004cf1670fa024063775003cb6bccccc945370e00b42191729171e2f839206e938124279120e2216e94318128739101e25023a813a0738103a370f83ca00270f83612a00170f836a07381040982100966018070f837a0bcf2b0048050fb005803c8cb0358fa0201cf1601cf16c9ed5401f9319e';

// Jetton 2.0 Operation Codes (from stablecoin-contract)
const Op = {
  mint: 0x642b7d07,
  internal_transfer: 0x178d4519,
  transfer: 0xf8a7ea5,
  burn: 0x595f07bc,
  burn_notification: 0x7bdd97de,
  set_status: 0xeed236d3,
  top_up: 0xd372158c,
  change_admin: 0x6501f354,
  claim_admin: 0xfb88e119,
  upgrade: 0x2508d66a,
  drop_admin: 0xcb862902,
  call_to: 0x235caf52,
  change_metadata: 0xcb862902, // Note: drop_admin and change_metadata might share same code
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
    toast.loading('Подготовка Jetton 2.0 контракта...', { id: 'deploy' });

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

    // Build initial data for Jetton 2.0 minter (stablecoin-contract format)
    // Structure: total_supply:Coins admin:MsgAddress next_admin:MsgAddress wallet_code:^Cell content:^Cell
    const minterData = beginCell()
      .storeCoins(0) // total_supply starts at 0
      .storeAddress(walletAddress) // admin_address
      .storeAddress(null) // next_admin (null = no pending admin transfer)
      .storeRef(JETTON_WALLET_CODE) // wallet_code
      .storeRef(metadata) // content (TEP-64 on-chain metadata)
      .endCell();

    // Create StateInit
    const stateInit = {
      code: JETTON_MINTER_CODE,
      data: minterData,
    };

    // Calculate contract address
    const minterAddress = contractAddress(0, stateInit);
    
    console.log('Deploying Jetton 2.0 to:', minterAddress.toString());
    console.log('Admin:', walletAddress.toString());

    // Build StateInit cell
    const stateInitCell = beginCell()
      .store(storeStateInit(stateInit))
      .endCell();

    // Build mint message for Jetton 2.0
    const internalTransferMsg = beginCell()
      .storeUint(Op.internal_transfer, 32)
      .storeUint(0, 64) // query_id
      .storeCoins(supplyWithDecimals)
      .storeAddress(null) // from_address
      .storeAddress(walletAddress) // response_address
      .storeCoins(0) // forward_ton_amount
      .storeBit(false) // no forward_payload
      .endCell();

    const mintBody = beginCell()
      .storeUint(Op.mint, 32)
      .storeUint(0, 64) // query_id
      .storeAddress(walletAddress) // to_address
      .storeCoins(toNano('0.1')) // forward_ton_amount
      .storeRef(internalTransferMsg)
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
      toast.success('Jetton 2.0 токен успешно создан!', { id: 'deploy' });
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

// Export for admin panel
export { Op as JettonOpcodes };
export const JETTON_VERSION = '2.0';
