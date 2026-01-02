import { useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTonConnect } from '@/hooks/useTonConnect';
import { Address, beginCell, Cell, toNano, storeStateInit, contractAddress, Dictionary } from '@ton/core';
import { sha256 } from '@noble/hashes/sha256';
import toast from 'react-hot-toast';

interface IceTokenData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
  totalSupply: string;
  metadataUrl?: string;
}

type PageMode = 'create' | 'admin';
type DeploymentStep = 'idle' | 'preparing' | 'deploying' | 'completed' | 'error';

// Monetization wallet
const MONETIZATION_WALLET = 'UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz';
const DEPLOY_FEE = toNano('0.3');
const MONETIZATION_FEE = toNano('0.7');

// GitHub raw URL for offchain metadata
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/ViberKoder/offchaindata/main';

// Using the Jetton 2.0 contracts from deploy.ts for Ice Jetton
// These are the same contracts but will be deployed with different settings
const STABLECOIN_MINTER_HEX = 'b5ee9c72410215010004e0000114ff00f4a413f4bcf2c80b0102016202100202cb030f02f7d0cb434c0c05c6c3000638ecc200835c874c7c0608405e351466ea44c38601035c87e800c3b51343e803e903e90353534541168504d3214017e809400f3c58073c5b333327b55383e903e900c7e800c7d007e800c7e80004c5c3e0e80b4c7c04074cfc044bb51343e803e903e9035353449a084190adf41eeb8c08e60408019635355161c705f2e04904fa4021fa4430c000f2e14dfa00d4d120d0d31f018210178d4519baf2e0488040d721fa00fa4031fa4031fa0020d70b009ad74bc00101c001b0f2b19130e254431b05018e2191729171e2f839206e9381239b9120e2216e94318128309101e25023a813a07381032c70f83ca00270f83612a00170f836a07381040282100966018070f837a0bcf2b025597f0601ea820898968070fb0224800bd721d70b07f82846057054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c9513384f701f90001b07074c8cb02ca0712cb07cbf7c9d0c8801801cb0501cf1658fa020397775003cb6bcccc96317158cb6acce2c98011fb005005a04314070022c85005fa025003cf1601cf16ccccc9ed5404e62582107bdd97debae3022582102c76b973ba8ecb355f033401fa40d2000101d195c821cf16c9916de2c8801001cb055004cf1670fa027001cb6a8210d173540001cb1f500401cb3f23fa4430c00097316c127001cb01e30df400c98050fb00e0342482106501f354bae302248210fb88e119ba090b0c0d01f23505fa00fa40f82854120722800bd721d70b0755207054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c984f701f90001b07074c8cb02ca0712cb07cbf7c9d05008c705f2e04a12a144145036c85005fa025003cf1601cf16ccccc9ed54fa40d120d70b01c000b3915be30d0a0044c8801001cb0501cf1670fa027001cb6a8210d53276db01cb1f0101cb3fc98042fb000092f828440422800bd721d70b0755207054201314c85003fa0201cf1601cf16c9227871c8cb00cb04cb0012f400f400cb00c984f701f90001b07074c8cb02ca0712cb07cbf7c9d012cf16004230335142c705f2e04902fa40d1400304c85005fa025003cf1601cf16ccccc9ed5401fe8e20313303d15131c705f2e0498b024034c85005fa025003cf1601cf16ccccc9ed54e02482107431f221ba8e2230335042c705f2e04901d18b028b024034c85005fa025003cf1601cf16ccccc9ed54e037238210cb862902ba8e22335142c705f2e049c85003cf16c9134440c85005fa025003cf1601cf16ccccc9ed54e0360e00505b2082102508d66aba9f3002c705f2e049d4d4d101ed54fb04e06c318210d372158cbadc840ff2f0001da23864658380e78b64814183fa0bc002012011120025bd9adf6a2687d007d207d206a6a6888122f824020271131400adadbcf6a2687d007d207d206a6a688a2f827c1400914005eb90eb8583aa90382a10098a642801fd0100e78b00e78b64913c38e4658065826580097a007a00658064c27b80fc8000d8383a6465816503896583e5fbe4e84000cfaf16f6a2687d007d207d206a6a68bf99e836c1783872ebdb514d9c97c283b7f0ae5179029e2b6119c39462719e4f46ed8f7413e62c780a417877407e978f01a40711411b1acb773a96bdd93fa83bb5ca8435013c8c4b3ac91f4589cc780a38646583fa0064a18040fa0d3a2f';

const STABLECOIN_WALLET_HEX = 'b5ee9c7241020b010001ed000114ff00f4a413f4bcf2c80b0102016202030202cb04050009a11f9fe00502012006070201200809001d3b513434c7c07e1874c7c07e18b46000adf07c81421840084210b0fb11f82f9d30e30d21c00020d721ed44d0fa403020d749c120d74ac120925f04e001f8665300f00bbaf2e044c81001db4458f003cf0202d33f5380d430d0f8238210178d4519807d5580e0db3c22fa003000cf16c9c88210178d4519ba0100d31f30b1c2fff2e04712c200a120c20001d431d0c8cb01f84554c705f2e04ac8801001cb0501cf1670fa027001cb6a8210595f07bc01cb1f5801cb3f5003fa0221cf165006cf16c9c8801801cb0501cf1658fa020171cb6accc98100a4fb00c858cf16c9ed54007af8445454c705f2e04a12a120c00093f841f844c2009130e2c85005cf1623fa0213cb6acb1fcb3f5230cf16c9c88210178d4519ba0292f84505cb01c97001f2e05001f84505f2e0530202ce080900201480a0b00e5323334335233c705b1c2fff2e04aa12082100966018024a1c0068210178d451911c8cb0258cf1601cf1701cf16c9ed54e05ff84305c8cb0058cf16c9ed54f847c200c2009401f844c8cbff5004cf1612cb00cb01cb07c9d0f844cf168209c9c380fa02017158cb6accc98011fb0001f8458e5233333334335233c705b1c2fff2e04921c200935f04e08210d53276db01c8cb0201cf1601cf16c9ed54f847c200c2009401f845c8cbff5004cf1612cb00cb01cb07c9d0f845cf168209c9c380fa02017158cb6accc98011fb0001006b0082017e817e0040dec0a0ea7e0021e09080ea7e019e09014c0080ea7e005e09004c0080ea7e00de09004c0082026a0200d830840ff2f000e0084201c820cf1601cf1701cf16c9ed5404fa00fa40d3d73334c705f2e04a01d0e3020c8cb01f84554c705f2e04ac8801001cb0501cf1670fa027001cb6a8210595f07bc01cb1f5801cb3f5003fa0221cf165003cf16c9c8801801cb0501cf1658fa020171cb6accc98011fb000094c85004cf16580082f84500000000544f4e2053746162696c697a65642053746f636b205069636b204d696e746572';

function hexToCell(hex: string): Cell {
  return Cell.fromBoc(Buffer.from(hex, 'hex'))[0];
}

// Lazy loading to avoid SSR issues
let _minterCode: Cell | null = null;
let _walletCode: Cell | null = null;

function getMinterCode(): Cell {
  if (!_minterCode) {
    _minterCode = hexToCell(STABLECOIN_MINTER_HEX);
  }
  return _minterCode;
}

function getWalletCode(): Cell {
  if (!_walletCode) {
    _walletCode = hexToCell(STABLECOIN_WALLET_HEX);
  }
  return _walletCode;
}

// Operation codes for stablecoin
const Op = {
  mint: 0x642b7d07,
  internal_transfer: 0x178d4519,
  burn: 0x595f07bc,
  set_status: 0xeed236d3, // For freezing wallets
  change_admin: 0x6501f354,
  claim_admin: 0xfb88e119,
  top_up: 0xd372158c,
};

// Lock types for set_status
const LockType = {
  unlock: 0,   // Normal operation
  out: 1,      // Block outgoing transfers
  in: 2,       // Block incoming transfers
  full: 3,     // Block all transfers (frozen)
};

function base64ToCell(base64: string): Cell {
  return Cell.fromBase64(base64);
}

// Build on-chain metadata (TEP-64)
function buildOnchainMetadata(data: { [key: string]: string | undefined }): Cell {
  const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());
  
  const keys: { [key: string]: 'utf8' | 'ascii' } = {
    name: 'utf8',
    symbol: 'utf8',
    description: 'utf8',
    image: 'ascii',
    decimals: 'utf8',
  };

  Object.entries(data).forEach(([key, value]) => {
    if (!value || !keys[key]) return;
    const keyHash = Buffer.from(sha256(key));
    const valueBuffer = Buffer.from(value, keys[key]);
    const cell = beginCell().storeUint(0x00, 8).storeBuffer(valueBuffer).endCell();
    dict.set(keyHash, cell);
  });

  return beginCell().storeUint(0x00, 8).storeDict(dict).endCell();
}

// Build off-chain metadata cell
function buildOffchainMetadata(uri: string): Cell {
  return beginCell()
    .storeUint(0x01, 8)
    .storeStringTail(uri)
    .endCell();
}

export default function IcePage() {
  const { connected, wallet, sendTransaction, sendMultipleMessages } = useTonConnect();
  const [mode, setMode] = useState<PageMode>('create');
  const [step, setStep] = useState<DeploymentStep>('idle');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [error, setError] = useState('');

  // Create mode state
  const [formData, setFormData] = useState<IceTokenData>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    decimals: 9,
    totalSupply: '1000000',
    metadataUrl: '',
  });

  // Admin mode state
  const [adminContractAddress, setAdminContractAddress] = useState('');
  const [targetWalletAddress, setTargetWalletAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !wallet) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setStep('preparing');
      setError('');

      // Generate metadata URL for offchain storage
      const timestamp = Date.now();
      const filename = `ice_${formData.symbol.toLowerCase()}_${timestamp}.json`;
      const metadataUrl = `${GITHUB_RAW_BASE}/${filename}`;

      // Build metadata cell - use offchain for compatibility
      let contentCell: Cell;
      if (formData.metadataUrl && formData.metadataUrl.trim()) {
        contentCell = buildOffchainMetadata(formData.metadataUrl.trim());
      } else {
        // Default to offchain with auto-generated URL
        contentCell = buildOffchainMetadata(metadataUrl);
        console.log('Ice Jetton metadata will be at:', metadataUrl);
        console.log('Metadata:', {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image: formData.image,
          decimals: formData.decimals.toString(),
        });
      }

      const supplyWithDecimals = BigInt(formData.totalSupply) * BigInt(10 ** formData.decimals);
      
      const minterCode = getMinterCode();
      const walletCode = getWalletCode();

      // Data structure for stablecoin minter:
      // total_supply:Coins admin_address:MsgAddress next_admin_address:MsgAddress jetton_wallet_code:^Cell content:^Cell
      const minterData = beginCell()
        .storeCoins(0) // total_supply (will increase after mint)
        .storeAddress(wallet) // admin_address
        .storeAddress(null) // next_admin_address
        .storeRef(walletCode) // jetton_wallet_code
        .storeRef(contentCell) // content
        .endCell();

      const stateInit = { code: minterCode, data: minterData };
      const minterAddress = contractAddress(0, stateInit);

      console.log('Deploying Ice Jetton to:', minterAddress.toString());

      setStep('deploying');
      toast.loading('Confirm transaction in wallet (1 TON)...', { id: 'deploy' });

      const stateInitCell = beginCell().store(storeStateInit(stateInit)).endCell();

      // Mint message for initial supply
      const internalTransferMsg = beginCell()
        .storeUint(Op.internal_transfer, 32)
        .storeUint(0, 64) // query_id
        .storeCoins(supplyWithDecimals) // jetton_amount
        .storeAddress(null) // from_address
        .storeAddress(wallet) // response_address
        .storeCoins(toNano('0.01')) // forward_ton_amount
        .storeMaybeRef(null) // forward_payload
        .endCell();

      const mintBody = beginCell()
        .storeUint(Op.mint, 32)
        .storeUint(0, 64) // query_id
        .storeAddress(wallet) // to_address
        .storeCoins(toNano('0.1')) // ton_amount for jetton wallet
        .storeRef(internalTransferMsg)
        .endCell();

      const deployMessage = {
        address: minterAddress.toString(),
        amount: DEPLOY_FEE.toString(),
        stateInit: stateInitCell.toBoc().toString('base64'),
        payload: mintBody.toBoc().toString('base64'),
      };

      const monetizationMessage = {
        address: MONETIZATION_WALLET,
        amount: MONETIZATION_FEE.toString(),
      };

      let result;
      if (sendMultipleMessages) {
        result = await sendMultipleMessages([deployMessage, monetizationMessage]);
      } else {
        result = await sendTransaction({
          to: minterAddress.toString(),
          value: DEPLOY_FEE.toString(),
          stateInit: stateInitCell.toBoc().toString('base64'),
          body: mintBody.toBoc().toString('base64'),
        });
      }

      if (result) {
        setDeployedAddress(minterAddress.toString());
        setStep('completed');
        toast.success('Ice Jetton created!', { id: 'deploy' });
      } else {
        throw new Error('Transaction rejected');
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      setError(err.message || 'Failed to deploy');
      setStep('error');
      toast.error(err.message || 'Deployment failed', { id: 'deploy' });
    }
  };

  const handleSetStatus = async (lockType: number) => {
    if (!connected || !wallet || !adminContractAddress || !targetWalletAddress) {
      toast.error('Please fill all fields and connect wallet');
      return;
    }

    try {
      setIsProcessing(true);
      
      // set_status#eed236d3 query_id:uint64 user_address:MsgAddress new_status:uint4 = InternalMsgBody
      const setStatusBody = beginCell()
        .storeUint(Op.set_status, 32)
        .storeUint(0, 64) // query_id
        .storeAddress(Address.parse(targetWalletAddress))
        .storeUint(lockType, 4) // new_status (4 bits)
        .endCell();

      const result = await sendTransaction({
        to: adminContractAddress,
        value: toNano('0.1').toString(),
        body: setStatusBody.toBoc().toString('base64'),
      });

      if (result) {
        const statusName = lockType === 0 ? 'Unlocked' : lockType === 3 ? 'Frozen' : `Status ${lockType}`;
        toast.success(`Wallet ${statusName}!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to set status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('idle');
    setDeployedAddress('');
    setError('');
  };

  const isValid = formData.name.trim() && formData.symbol.trim() && formData.totalSupply;

  return (
    <>
      <Head>
        <title>Ice Jetton | Freezable Tokens on TON</title>
        <link rel="icon" href="https://em-content.zobj.net/source/telegram/386/ice_1f9ca.webp" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-cyan-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-300/20 to-sky-400/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-[450px] h-[450px] bg-gradient-to-br from-cyan-400/15 to-blue-500/10 rounded-full blur-3xl" />
        </div>

        <Header />

        <main className="flex-grow relative z-10">
          <section className="pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-6">
                <img 
                  src="https://s4.ezgif.com/tmp/ezgif-46b0b67264ebfa39.gif" 
                  alt="Ice Jetton" 
                  className="w-40 h-40 mx-auto rounded-2xl shadow-lg"
                />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-800">
                <span className="gradient-text-ice">Ice Jetton</span>
                <br />Freezable Tokens
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Create tokens with freeze functionality. Perfect for stablecoins 
                and regulated assets on TON.
              </p>

              {/* Mode Toggle */}
              <div className="inline-flex bg-blue-50 rounded-xl p-1 border border-blue-200 mb-8">
                <button
                  onClick={() => setMode('create')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    mode === 'create' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  ❄️ Create Token
                </button>
                <button
                  onClick={() => setMode('admin')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    mode === 'admin' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  🔐 Freeze/Unfreeze
                </button>
              </div>
            </div>
          </section>

          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              {mode === 'create' ? (
                // CREATE MODE
                step === 'completed' ? (
                  <div className="card-ice text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Ice Jetton Created!</h2>
                    <p className="text-gray-600 mb-6">Your freezable token is deployed.</p>

                    <div className="p-4 bg-blue-50 rounded-xl mb-6">
                      <p className="text-sm text-gray-500 mb-2">Contract Address</p>
                      <code className="text-blue-600 font-mono text-sm break-all">{deployedAddress}</code>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a href={`https://tonviewer.com/${deployedAddress}`} target="_blank" className="btn-ice">
                        View on Explorer
                      </a>
                      <button onClick={() => { setMode('admin'); setAdminContractAddress(deployedAddress); }} className="btn-secondary">
                        🔐 Admin Panel
                      </button>
                      <button onClick={handleReset} className="btn-secondary">Create Another</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDeploy} className="card-ice">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Create Ice Jetton</h2>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Token Name *</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., USD Coin" className="input-ice" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Symbol *</label>
                          <input type="text" name="symbol" value={formData.symbol} onChange={handleChange} placeholder="e.g., USDC" className="input-ice uppercase" maxLength={10} required />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="input-ice min-h-[80px]" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                        <input type="url" name="image" value={formData.image} onChange={handleChange} placeholder="https://example.com/logo.png" className="input-ice" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Total Supply *</label>
                          <input type="text" name="totalSupply" value={formData.totalSupply} onChange={handleChange} className="input-ice" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Decimals</label>
                          <input type="number" name="decimals" value={formData.decimals} onChange={(e) => setFormData(prev => ({ ...prev, decimals: parseInt(e.target.value) || 9 }))} min={0} max={18} className="input-ice" />
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="font-medium text-blue-700 mb-2">❄️ Ice Jetton Features</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Admin can freeze individual wallets</li>
                          <li>• Frozen wallets cannot transfer tokens</li>
                          <li>• Based on TON stablecoin-contract</li>
                          <li>• Use Admin Panel to manage freezes</li>
                        </ul>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-red-600 text-sm">{error}</p>
                        </div>
                      )}

                      <div className="pt-6 border-t border-blue-200">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <p className="text-gray-500 text-sm">Deployment cost</p>
                            <p className="text-2xl font-bold text-gray-800">1 TON</p>
                          </div>
                          <button
                            type="submit"
                            disabled={!connected || !isValid || step === 'preparing' || step === 'deploying'}
                            className="btn-ice w-full md:w-auto min-w-[200px] text-lg py-4"
                          >
                            {step === 'preparing' || step === 'deploying' ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="spinner-ice" />
                                {step === 'preparing' ? 'Preparing...' : 'Deploying...'}
                              </span>
                            ) : !connected ? 'Connect Wallet' : '❄️ Create Ice Jetton'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )
              ) : (
                // ADMIN MODE - Freeze/Unfreeze
                <div className="card-ice">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">🔐 Freeze/Unfreeze Wallets</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ice Jetton Contract Address</label>
                      <input 
                        type="text" 
                        value={adminContractAddress} 
                        onChange={(e) => setAdminContractAddress(e.target.value)}
                        placeholder="EQ... or UQ..."
                        className="input-ice"
                      />
                      <p className="text-xs text-gray-500 mt-1">The minter contract address (you must be admin)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Wallet Address</label>
                      <input 
                        type="text" 
                        value={targetWalletAddress} 
                        onChange={(e) => setTargetWalletAddress(e.target.value)}
                        placeholder="EQ... or UQ..."
                        className="input-ice"
                      />
                      <p className="text-xs text-gray-500 mt-1">The wallet address to freeze/unfreeze</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleSetStatus(LockType.full)}
                        disabled={!connected || isProcessing || !adminContractAddress || !targetWalletAddress}
                        className="p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:border-red-400 transition-colors disabled:opacity-50"
                      >
                        <div className="text-2xl mb-2">🥶</div>
                        <div className="font-semibold text-red-700">Freeze Wallet</div>
                        <div className="text-xs text-red-600">Block all transfers</div>
                      </button>

                      <button
                        onClick={() => handleSetStatus(LockType.unlock)}
                        disabled={!connected || isProcessing || !adminContractAddress || !targetWalletAddress}
                        className="p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:border-green-400 transition-colors disabled:opacity-50"
                      >
                        <div className="text-2xl mb-2">🔓</div>
                        <div className="font-semibold text-green-700">Unfreeze Wallet</div>
                        <div className="text-xs text-green-600">Enable transfers</div>
                      </button>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="font-medium text-blue-700 mb-2">Lock Types</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li><strong>Unlock (0):</strong> Normal operation</li>
                        <li><strong>Out (1):</strong> Block outgoing only</li>
                        <li><strong>In (2):</strong> Block incoming only</li>
                        <li><strong>Full (3):</strong> Block all transfers</li>
                      </ul>
                    </div>

                    {!connected && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                        <p className="text-yellow-700">Connect your wallet to use admin functions</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Features */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                Why <span className="gradient-text-ice">Ice Jetton</span>?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: '❄️', title: 'Freeze Wallets', description: 'Admin can freeze any wallet to prevent transfers.' },
                  { icon: '🔐', title: 'Compliance Ready', description: 'Perfect for regulated assets and stablecoins.' },
                  { icon: '⚡', title: 'TON Native', description: 'Built on official TON stablecoin contracts.' },
                ].map((f, i) => (
                  <div key={i} className="card-ice text-center">
                    <div className="text-4xl mb-4">{f.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{f.title}</h3>
                    <p className="text-gray-600 text-sm">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
