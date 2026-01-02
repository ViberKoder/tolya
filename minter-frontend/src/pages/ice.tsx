import { useState, useEffect } from 'react';
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

// Stablecoin contract codes from https://github.com/ton-blockchain/stablecoin-contract
// These are the official pre-compiled contracts with freeze functionality
const STABLECOIN_MINTER_HEX = 'b5ee9c72410218010005bb000114ff00f4a413f4bcf2c80b0102016207020201200603020271050400cfaf16f6a2687d007d207d206a6a68bf99e836c1783872ebdb514d9c97c283b7f0ae5179029e2b6119c39462719e4f46ed8f7413e62c780a417877407e978f01a40711411b1acb773a96bdd93fa83bb5ca8435013c8c4b3ac91f4589b4780a38646583fa0064a180400085adbcf6a2687d007d207d206a6a688a2f827c1400b82a3002098a81e46581ac7d0100e78b00e78b6490e4658089fa00097a00658064fc80383a6465816503e5ffe4e8400025bd9adf6a2687d007d207d206a6a6888122f8240202cb0908001da23864658380e78b64814183fa0bc002f3d0cb434c0c05c6c238ecc200835c874c7c0608405e351466ea44c38601035c87e800c3b51343e803e903e90353534541168504d3214017e809400f3c58073c5b333327b55383e903e900c7e800c7d007e800c7e80004c5c3e0e80b4c7c04074cfc044bb51343e803e903e9035353449a084190adf41eeb8c089a150a03fa82107bdd97deba8ee7363805fa00fa40f82854120a70546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a14414506603c85005fa025003cf1601cf16ccccc9ed54fa40d120d70b01c000b3915be30de02682102c76b973bae302352514120b04f882106501f354ba8e223134365145c705f2e04902fa40d1103402c85005fa025003cf1601cf16ccccc9ed54e0258210fb88e119ba8e2132343603d15131c705f2e0498b025512c85005fa025003cf1601cf16ccccc9ed54e034248210235caf52bae30237238210cb862902bae302365b2082102508d66abae3026c310f0e0d0c00188210d372158cbadc840ff2f0001e3002c705f2e049d4d4d101ed54fb040044335142c705f2e049c85003cf16c9134440c85005fa025003cf1601cf16ccccc9ed5402ec3031325033c705f2e049fa40fa00d4d120d0d31f01018040d7212182100f8a7ea5ba8e4d36208210595f07bcba8e2c3004fa0031fa4031f401d120f839206e943081169fde718102f270f8380170f836a0811a7770f836a0bcf2b08e138210eed236d3ba9504d30331d19434f2c048e2e2e30d500370111000c082103b9aca0070fb02f828450470546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c920f9007074c8cb02ca07cbffc9d0c8801801cb0501cf1658fa02029858775003cb6bcccc9730017158cb6acce2c98011fb0000ce31fa0031fa4031fa4031f401fa0020d70b009ad74bc00101c001b0f2b19130e25442162191729171e2f839206e938124279120e2216e94318128739101e25023a813a0738103a370f83ca00270f83612a00170f836a07381040982100966018070f837a0bcf2b001fc145f04323401fa40d2000101d195c821cf16c9916de2c8801001cb055004cf1670fa027001cb6a8210d173540001cb1f500401cb3f23fa4430c0008e35f828440470546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c9f9007074c8cb02ca07cbffc9d012cf1697316c127001cb01e2f400c91300088050fb000044c8801001cb0501cf1670fa027001cb6a8210d53276db01cb1f0101cb3fc98042fb00019635355161c705f2e04904fa4021fa4430c000f2e14dfa00d4d120d0d31f018210178d4519baf2e0488040d721fa00fa4031fa4031fa0020d70b009ad74bc00101c001b0f2b19130e254431b16018e2191729171e2f839206e938124279120e2216e94318128739101e25023a813a0738103a370f83ca00270f83612a00170f836a07381040982100966018070f837a0bcf2b025597f1700ec82103b9aca0070fb02f828450470546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c920f9007074c8cb02ca07cbffc9d0c8801801cb0501cf1658fa02029858775003cb6bcccc9730017158cb6acce2c98011fb005005a04314c85005fa025003cf1601cf16ccccc9ed546f6e5bfb';

const STABLECOIN_WALLET_HEX = 'b5ee9c7241020f010003d1000114ff00f4a413f4bcf2c80b01020162050202012004030021bc508f6a2686981fd007d207d2068af81c0027bfd8176a2686981fd007d207d206899fc152098402f8d001d0d3030171b08e48135f038020d721ed44d0d303fa00fa40fa40d104d31f01840f218210178d4519ba0282107bdd97deba12b1f2f48040d721fa003012a0401303c8cb0358fa0201cf1601cf16c9ed54e0fa40fa4031fa0031f401fa0031fa00013170f83a02d31f012082100f8a7ea5ba8e85303459db3ce0330c0602d0228210178d4519ba8e84325adb3ce034218210595f07bcba8e843101db3ce032208210eed236d3ba8e2f30018040d721d303d1ed44d0d303fa00fa40fa40d1335142c705f2e04a403303c8cb0358fa0201cf1601cf16c9ed54e06c218210d372158cbadc840ff2f0080701f2ed44d0d303fa00fa40fa40d106d33f0101fa00fa40f401d15141a15288c705f2e04926c2fff2afc882107bdd97de01cb1f5801cb3f01fa0221cf1658cf16c9c8801801cb0526cf1670fa02017158cb6accc903f839206e943081169fde718102f270f8380170f836a0811a7770f836a0bcf2b0028050fb00030903f4ed44d0d303fa00fa40fa40d12372b0c002f26d07d33f0101fa005141a004fa40fa4053bac705f82a5464e070546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c9f9007074c8cb02ca07cbffc9d0500cc7051bb1f2e04a09fa0021925f04e30d26d70b01c000b393306c33e30d55020b0a09002003c8cb0358fa0201cf1601cf16c9ed54007a5054a1f82fa07381040982100966018070f837b60972fb02c8801001cb055005cf1670fa027001cb6a8210d53276db01cb1f5801cb3fc9810082fb00590060c882107362d09c01cb1f2501cb3f5004fa0258cf1658cf16c9c8801001cb0524cf1658fa02017158cb6accc98011fb0001f203d33f0101fa00fa4021fa4430c000f2e14ded44d0d303fa00fa40fa40d15309c7052471b0c00021b1f2ad522bc705500ab1f2e0495115a120c2fff2aff82a54259070546004131503c8cb0358fa0201cf1601cf16c921c8cb0113f40012f400cb00c920f9007074c8cb02ca07cbffc9d004fa40f401fa00200d019820d70b009ad74bc00101c001b0f2b19130e2c88210178d451901cb1f500a01cb3f5008fa0223cf1601cf1626fa025007cf16c9c8801801cb055004cf1670fa024063775003cb6bccccc945370e00b42191729171e2f839206e938124279120e2216e94318128739101e25023a813a0738103a370f83ca00270f83612a00170f836a07381040982100966018070f837a0bcf2b0048050fb005803c8cb0358fa0201cf1601cf16c9ed5401f9319e';

// Operation codes for stablecoin
const Op = {
  mint: 0x642b7d07,
  internal_transfer: 0x178d4519,
  burn: 0x595f07bc,
  set_status: 0xeed236d3, // For freezing wallets
  change_admin: 0x6501f354,
  claim_admin: 0xfb88e119,
};

// Lock types
const LockType = {
  unlock: 0,   // Normal operation
  out: 1,      // Block outgoing transfers
  in: 2,       // Block incoming transfers
  full: 3,     // Block all transfers (frozen)
};

function hexToCell(hex: string): Cell {
  return Cell.fromBoc(Buffer.from(hex, 'hex'))[0];
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
  const [selectedLockType, setSelectedLockType] = useState<number>(LockType.full);
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

      // Build metadata cell
      let contentCell: Cell;
      if (formData.metadataUrl && formData.metadataUrl.trim()) {
        contentCell = buildOffchainMetadata(formData.metadataUrl.trim());
      } else {
        contentCell = buildOnchainMetadata({
          name: formData.name,
          symbol: formData.symbol.toUpperCase(),
          description: formData.description || formData.name,
          image: formData.image || undefined,
          decimals: formData.decimals.toString(),
        });
      }

      const supplyWithDecimals = BigInt(formData.totalSupply) * BigInt(10 ** formData.decimals);
      
      const minterCode = hexToCell(STABLECOIN_MINTER_HEX);
      const walletCode = hexToCell(STABLECOIN_WALLET_HEX);

      // Data structure for stablecoin: total_supply, admin, next_admin, wallet_code, content
      const minterData = beginCell()
        .storeCoins(0)
        .storeAddress(wallet)
        .storeAddress(null)
        .storeRef(walletCode)
        .storeRef(contentCell)
        .endCell();

      const stateInit = { code: minterCode, data: minterData };
      const minterAddress = contractAddress(0, stateInit);

      setStep('deploying');
      toast.loading('Confirm transaction in wallet...', { id: 'deploy' });

      const stateInitCell = beginCell().store(storeStateInit(stateInit)).endCell();

      // Mint message
      const internalTransferMsg = beginCell()
        .storeUint(Op.internal_transfer, 32)
        .storeUint(0, 64)
        .storeCoins(supplyWithDecimals)
        .storeAddress(null)
        .storeAddress(wallet)
        .storeCoins(toNano('0.01'))
        .storeMaybeRef(null)
        .endCell();

      const mintBody = beginCell()
        .storeUint(Op.mint, 32)
        .storeUint(0, 64)
        .storeAddress(wallet)
        .storeCoins(toNano('0.1'))
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
        .storeUint(lockType, 4) // new_status
        .endCell();

      await sendTransaction({
        to: adminContractAddress,
        value: toNano('0.1').toString(),
        body: setStatusBody.toBoc().toString('base64'),
      });

      const statusName = lockType === 0 ? 'Unlocked' : lockType === 3 ? 'Frozen' : `Status ${lockType}`;
      toast.success(`Wallet ${statusName}!`);
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
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-300/15 to-sky-400/10 rounded-full blur-3xl" />
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
                          <input type="number" name="decimals" value={formData.decimals} onChange={handleChange} min={0} max={18} className="input-ice" />
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
                        disabled={!connected || isProcessing}
                        className="p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:border-red-400 transition-colors disabled:opacity-50"
                      >
                        <div className="text-2xl mb-2">🥶</div>
                        <div className="font-semibold text-red-700">Freeze Wallet</div>
                        <div className="text-xs text-red-600">Block all transfers</div>
                      </button>

                      <button
                        onClick={() => handleSetStatus(LockType.unlock)}
                        disabled={!connected || isProcessing}
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
