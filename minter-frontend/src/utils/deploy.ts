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
// OFFICIAL JETTON 2.0 CONTRACTS
// Source: https://github.com/ton-blockchain/jetton-contract (branch: jetton-2.0)
// ============================================================================

const JETTON_MINTER_CODE_HEX = 'b5ee9c72410215010004e0000114ff00f4a413f4bcf2c80b0102016202100202cb030f02f7d0cb434c0c05c6c3000638ecc200835c874c7c0608405e351466ea44c38601035c87e800c3b51343e803e903e90353534541168504d3214017e809400f3c58073c5b333327b55383e903e900c7e800c7d007e800c7e80004c5c3e0e80b4c7c04074cfc044bb51343e803e903e9035353449a084190adf41eeb8c08e60408019635355161c705f2e04904fa4021fa4430c000f2e14dfa00d4d120d0d31f018210178d4519baf2e0488040d721fa00fa4031fa4031fa0020d70b009ad74bc00101c001b0f2b19130e254431b05018e2191729171e2f839206e9381239b9120e2216e94318128309101e25023a813a07381032c70f83ca00270f83612a00170f836a07381040282100966018070f837a0bcf2b025597f0601ea820898968070fb0224800bd721d70b07f82846057054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c9513384f701f90001b07074c8cb02ca0712cb07cbf7c9d0c8801801cb0501cf1658fa020397775003cb6bcccc96317158cb6acce2c98011fb005005a04314070022c85005fa025003cf1601cf16ccccc9ed5404e62582107bdd97debae3022582102c76b973ba8ecb355f033401fa40d2000101d195c821cf16c9916de2c8801001cb055004cf1670fa027001cb6a8210d173540001cb1f500401cb3f23fa4430c00097316c127001cb01e30df400c98050fb00e0342482106501f354bae302248210fb88e119ba090b0c0d01f23505fa00fa40f82854120722800bd721d70b0755207054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c984f701f90001b07074c8cb02ca0712cb07cbf7c9d05008c705f2e04a12a144145036c85005fa025003cf1601cf16ccccc9ed54fa40d120d70b01c000b3915be30d0a0044c8801001cb0501cf1670fa027001cb6a8210d53276db01cb1f0101cb3fc98042fb000092f828440422800bd721d70b0755207054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c984f701f90001b07074c8cb02ca0712cb07cbf7c9d012cf16004230335142c705f2e04902fa40d1400304c85005fa025003cf1601cf16ccccc9ed5401fe8e20313303d15131c705f2e0498b024034c85005fa025003cf1601cf16ccccc9ed54e02482107431f221ba8e2230335042c705f2e04901d18b028b024034c85005fa025003cf1601cf16ccccc9ed54e037238210cb862902ba8e22335142c705f2e049c85003cf16c9134440c85005fa025003cf1601cf16ccccc9ed54e0360e00505b2082102508d66aba9f3002c705f2e049d4d4d101ed54fb04e06c318210d372158cbadc840ff2f0001da23864658380e78b64814183fa0bc002012011120025bd9adf6a2687d007d207d206a6a6888122f824020271131400adadbcf6a2687d007d207d206a6a688a2f827c1400914005eb90eb8583aa90382a10098a642801fd0100e78b00e78b64913c38e4658065826580097a007a00658064c27b80fc8000d8383a6465816503896583e5fbe4e84000cfaf16f6a2687d007d207d206a6a68bf99e836c1783872ebdb514d9c97c283b7f0ae5179029e2b6119c39462719e4f46ed8f7413e62c780a417877407e978f01a40711411b1acb773a96bdd93fa83bb5ca8435013c8c4b3ac91f4589cc780a38646583fa0064a18040fa0d3a2f';

const JETTON_WALLET_CODE_HEX = 'b5ee9c7241020d0100038a000114ff00f4a413f4bcf2c80b01020162020c02f4d001d0d3030171b0c0018e43135f038020d721ed44d0fa00fa40fa40d103d31f01840f218210178d4519ba0282107bdd97deba12b1f2f48040d721fa003012a002c85003fa0201cf1601cf16c9ed54e0fa40fa4031fa0031f401fa0031fa00013170f83a02d31f012082100f8a7ea5ba8e85303459db3ce03322030601f403d33f0101fa00fa4021fa4430c000f2e14ded44d0fa00fa40fa40d15219c705f2e0495114a120c2fff2af23800bd721d70b07f82a5425907054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c9514484f701f90001b07074c8cb02ca0712cb07cbf7c9d003fa40f401fa002004019620d70b009ad74bc00101c001b0f2b19130e2c88210178d451901cb1f500901cb3f5007fa0223cf1601cf1625fa025006cf16c9c8801801cb055003cf1670fa025a775003cb6bccccc944460500b02191729171e2f839206e9381239b9120e2216e94318128309101e25023a813a07381032c70f83ca00270f83612a00170f836a07381040282100966018070f837a0bcf2b0038050fb0001c85003fa0201cf1601cf16c9ed54025a8210178d4519ba8e84325adb3ce034218210595f07bcba8e843101db3ce0135f038210d372158cbadc840ff2f0070a02f4ed44d0fa00fa40fa40d106d33f0101fa00fa40fa4053a9c705b38e4ef82a5463c022800bd721d70b0755207054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c984f701f90001b07074c8cb02ca0712cb07cbf7c9d0500ac705f2e04a9139e25152a008fa0021925f04e30d2208090060c882107362d09c01cb1f2501cb3f5004fa0258cf1658cf16c9c8801001cb0524cf1658fa02017158cb6accc98011fb0000aed70b01c000b38e3b5043a1f82fa07381040282100966018070f837b60972fb02c8801001cb0501cf1670fa027001cb6a8210d53276db01cb1f0101cb3fc9810082fb0093145f04e258c85003fa0201cf1601cf16c9ed5401eeed44d0fa00fa40fa40d105d33f0101fa00fa40f401d15141a15237c705f2e04925c2fff2afc882107bdd97de01cb1f5801cb3f01fa0221cf1658cf16c9c8801801cb0525cf1670fa02017158cb6accc902f839206e943081160dde718102f270f8380170f836a0811bdf70f836a0bcf2b0018050fb00580b001cc85003fa0201cf1601cf16c9ed54001da0f605da89a1f401f481f481a3f055d51d4010';

// Jetton 2.0 Operation Codes
const Op = {
  mint: 0x642b7d07,
  internal_transfer: 0x178d4519,
  transfer: 0xf8a7ea5,
  burn: 0x595f07bc,
  top_up: 0xd372158c,
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

    // Build initial data for Jetton 2.0 minter
    // IMPORTANT: Jetton 2.0 has different structure than Jetton 1.0!
    // Structure: supply:Coins admin:MsgAddress transfer_admin:MsgAddress wallet_code:^Cell content:^Cell
    const minterData = beginCell()
      .storeCoins(0) // total_supply starts at 0
      .storeAddress(walletAddress) // admin_address
      .storeAddress(null) // transfer_admin (null = no pending admin transfer)
      .storeRef(JETTON_WALLET_CODE) // wallet_code FIRST
      .storeRef(metadata) // content SECOND
      .endCell();

    // Create StateInit
    const stateInit = {
      code: JETTON_MINTER_CODE,
      data: minterData,
    };

    // Calculate contract address
    const minterAddress = contractAddress(0, stateInit);
    
    console.log('Deploying Jetton 2.0 to:', minterAddress.toString());

    // Build StateInit cell
    const stateInitCell = beginCell()
      .store(storeStateInit(stateInit))
      .endCell();

    // Build mint message for Jetton 2.0
    // Op::mint in Jetton 2.0 = 0x642b7d07
    const internalTransferMsg = beginCell()
      .storeUint(Op.internal_transfer, 32) // internal_transfer op
      .storeUint(0, 64) // query_id
      .storeCoins(supplyWithDecimals) // jetton_amount
      .storeAddress(null) // from_address
      .storeAddress(walletAddress) // response_address
      .storeCoins(0) // forward_ton_amount
      .storeMaybeRef(null) // custom_payload (null)
      .endCell();

    const mintBody = beginCell()
      .storeUint(Op.mint, 32) // op::mint = 0x642b7d07 for Jetton 2.0!
      .storeUint(0, 64) // query_id
      .storeAddress(walletAddress) // to_address
      .storeCoins(toNano('0.1')) // total_ton_amount for gas
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
    
    // Use sendMultipleMessages if available, otherwise fallback to separate transactions
    if (sendMultipleMessages) {
      result = await sendMultipleMessages([deployMessage, monetizationMessage]);
    } else {
      // Fallback: send deploy transaction (monetization won't be collected in this case)
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

// Export contract hashes for verification
export const JETTON_2_0_MINTER_HASH = '6eb01cd370f25445b7c9b598928e444009c31737334835a956b90bdd92228895';
export const JETTON_2_0_WALLET_HASH = '346250c205f56acfb6afa6fe7b76550805d256c6d8e47dd4f94ff672b47d19d3';
