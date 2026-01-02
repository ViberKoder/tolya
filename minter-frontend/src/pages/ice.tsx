import { useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTonConnect } from '@/hooks/useTonConnect';
import { Address, beginCell, Cell, toNano, storeStateInit, contractAddress } from '@ton/core';
import { buildOnchainMetadataCell, buildOffchainMetadataCell } from '@/utils/onchain-metadata';
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

type DeploymentStep = 'idle' | 'preparing' | 'deploying' | 'completed' | 'error';

// Monetization wallet address
const MONETIZATION_WALLET = 'UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz';
const DEPLOY_FEE = toNano('0.3');
const MONETIZATION_FEE = toNano('0.7');

// Stablecoin contract codes from https://github.com/ton-blockchain/stablecoin-contract
// These are the compiled contracts that support freezing functionality
const STABLECOIN_MINTER_CODE_HEX = 'b5ee9c7241021101000323000114ff00f4a413f4bcf2c80b0102016202030202cb04050201201011020148060f025bbf2ffc4f2fff82e14d4d1f822c000f2e04305d37f821005138d919140e2f84301c705f2e049d0d3030171b0915be0fa40d33f308e2d54c7c7c9d7c0d7c1c8cb00cb04cb01cb03cbffcb07fa02c9d333c0018e9134c7c700c000925f04e0d33f30923003c7095401c001d4d1f80582019321f80501f841a4f841c8cb1fcbff58cf16c9ed5401f80583db31e0f84101d31f308e21317108c7055005c705b1f2e04a12a1705010120f823f800e3020c8cb3fc9d00582015080f841cf1621fa02ca00c9f842cf1601cf16c92012005ac881001f846ccc9f847c200f848cf16c9ed540082f8465454c705f2e04aa060cf4020c9f8444fc07e903e900c3e09c1c87e80dc0082f846545458c705f2e04a22a120c2009130e2c85008cf1670fa027001cb6a8210178d451901cb1f5801cb3f5003fa0221cf165006cf16c9c8801801cb0501cf1670fa027001cb6a8210d53276db01cb1f0101cb3fc98100a4fb00c858cf16c9ed54007af8445454c705f2e04a12a120c00093f841f844c2009130e2c85005cf1623fa0213cb6acb1fcb3f5230cf16c9c88210178d4519ba0292f84505cb01c97001f2e05001f84505f2e0530202ce080900201480a0b0200c30c0d00e5323334335233c705b1c2fff2e04aa12082100966018024a1c0068210178d451911c8cb0258cf1601cf1701cf16c9ed54e05ff84305c8cb0058cf16c9ed54f847c200c2009401f844c8cbff5004cf1612cb00cb01cb07c9d0f844cf168209c9c380fa02017158cb6accc98011fb0001f8458e5233333334335233c705b1c2fff2e04921c200935f04e08210d53276db01c8cb0201cf1601cf16c9ed54f847c200c2009401f845c8cbff5004cf1612cb00cb01cb07c9d0f845cf168209c9c380fa02017158cb6accc98011fb0001006b0082017e817e0040dec0a0ea7e0021e09080ea7e019e09014c0080ea7e005e09004c0080ea7e00de09004c0082026a0200d830840ff2f000e0084201c820cf1601cf1701cf16c9ed5404fa00fa40d3d73334c705f2e04a01d0e3020c8cb01f84554c705f2e04ac8801001cb0501cf1670fa027001cb6a8210595f07bc01cb1f5801cb3f5003fa0221cf165003cf16c9c8801801cb0501cf1658fa020171cb6accc98011fb000094c85004cf16580082f84500000000544f4e2053746162696c697a65642053746f636b205069636b204d696e746572';

const STABLECOIN_WALLET_CODE_HEX = 'b5ee9c7241020b010001ed000114ff00f4a413f4bcf2c80b0102016202030202cb04050009a11f9fe00502012006070201200809001d3b513434c7c07e1874c7c07e18b46000adf07c81421840084210b0fb11f82f9d30e30d21c00020d721ed44d0fa403020d749c120d74ac120925f04e001f8665300f00bbaf2e044c81001db4458f003cf0202d33f5380d430d0f8238210178d4519807d5580e0db3c22fa003000cf16c9c88210178d4519ba0100d31f30b1c2fff2e04712c200a120c20001d431d0c8cb01f84554c705f2e04ac8801001cb0501cf1670fa027001cb6a8210595f07bc01cb1f5801cb3f5003fa0221cf165003cf16c9c8801801cb0501cf1658fa020171cb6accc98011fb00f840f8444fc07e903e900c3e0ac87e80dc0071f84a54c705f2e04a12a1705401c0018e245021c705f2e04ae302f84954c705f2e04a23a1705501c00193f841cf16c9ed54e30d';

function hexToCell(hex: string): Cell {
  return Cell.fromBoc(Buffer.from(hex, 'hex'))[0];
}

export default function IcePage() {
  const { connected, wallet, sendTransaction, sendMultipleMessages } = useTonConnect();
  const [step, setStep] = useState<DeploymentStep>('idle');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<IceTokenData>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    decimals: 9,
    totalSupply: '1000000',
    metadataUrl: '',
  });

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

      let metadataCell: Cell;
      if (formData.metadataUrl && formData.metadataUrl.trim()) {
        metadataCell = buildOffchainMetadataCell(formData.metadataUrl.trim());
      } else {
        metadataCell = buildOnchainMetadataCell({
          name: formData.name,
          symbol: formData.symbol.toUpperCase(),
          description: formData.description || formData.name,
          image: formData.image || undefined,
          decimals: formData.decimals,
        });
      }

      const supplyWithDecimals = BigInt(formData.totalSupply) * BigInt(10 ** formData.decimals);

      // Build minter data for stablecoin contract
      const minterCode = hexToCell(STABLECOIN_MINTER_CODE_HEX);
      const walletCode = hexToCell(STABLECOIN_WALLET_CODE_HEX);

      const minterData = beginCell()
        .storeCoins(0) // total_supply
        .storeAddress(wallet) // admin_address
        .storeRef(metadataCell) // content
        .storeRef(walletCode) // jetton_wallet_code
        .endCell();

      const stateInit = { code: minterCode, data: minterData };
      const minterAddress = contractAddress(0, stateInit);

      setStep('deploying');
      toast.loading('Confirm transaction in wallet...', { id: 'deploy' });

      const stateInitCell = beginCell().store(storeStateInit(stateInit)).endCell();

      // Mint message
      const mintBody = beginCell()
        .storeUint(0x642b7d07, 32) // mint opcode
        .storeUint(0, 64) // query_id
        .storeAddress(wallet) // to_address
        .storeCoins(toNano('0.1')) // ton_amount
        .storeRef(
          beginCell()
            .storeUint(0x178d4519, 32) // internal_transfer
            .storeUint(0, 64)
            .storeCoins(supplyWithDecimals)
            .storeAddress(null)
            .storeAddress(wallet)
            .storeCoins(toNano('0.01'))
            .storeMaybeRef(null)
            .endCell()
        )
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
        toast.success('Ice Jetton created successfully!', { id: 'deploy' });
      } else {
        throw new Error('Transaction rejected');
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      setError(err.message || 'Failed to deploy token');
      setStep('error');
      toast.error(err.message || 'Deployment failed', { id: 'deploy' });
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
        <title>Ice Jetton | Create Freezable Tokens on TON</title>
        <link rel="icon" href="https://em-content.zobj.net/source/telegram/386/ice_1f9ca.webp" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-300/15 to-sky-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-gradient-to-br from-cyan-400/10 to-blue-300/15 rounded-full blur-3xl" />
        </div>

        <Header />

        <main className="flex-grow relative z-10">
          {/* Hero Section */}
          <section className="pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* GIF Logo */}
              <div className="mb-6">
                <img 
                  src="https://s4.ezgif.com/tmp/ezgif-46b0b67264ebfa39.gif" 
                  alt="Ice Jetton" 
                  className="w-32 h-32 mx-auto rounded-2xl shadow-lg"
                />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-800">
                <span className="gradient-text-ice">Ice Jetton</span>
                <br />Freezable Tokens
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Create tokens with freeze functionality. Perfect for stablecoins, 
                regulated assets, and compliance-ready tokens on TON.
              </p>

              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-8">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm text-blue-700">Admin can freeze/unfreeze user wallets</span>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              {step === 'completed' ? (
                <div className="card-ice text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Ice Jetton Created!</h2>
                  <p className="text-gray-600 mb-6">Your freezable token is now deployed.</p>

                  <div className="p-4 bg-blue-50 rounded-xl mb-6">
                    <p className="text-sm text-gray-500 mb-2">Contract Address</p>
                    <code className="text-blue-600 font-mono text-sm break-all">{deployedAddress}</code>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href={`https://tonviewer.com/${deployedAddress}`}
                      target="_blank"
                      className="btn-ice flex items-center justify-center gap-2"
                    >
                      View on Explorer
                    </a>
                    <button onClick={handleReset} className="btn-secondary">
                      Create Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDeploy} className="card-ice">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Create Ice Jetton</h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Token Name <span className="text-blue-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., USD Coin"
                          className="input-ice"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Symbol <span className="text-blue-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="symbol"
                          value={formData.symbol}
                          onChange={handleChange}
                          placeholder="e.g., USDC"
                          className="input-ice uppercase"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your token..."
                        className="input-ice min-h-[80px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                      <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png"
                        className="input-ice"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Supply <span className="text-blue-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="totalSupply"
                          value={formData.totalSupply}
                          onChange={handleChange}
                          placeholder="1000000"
                          className="input-ice"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Decimals</label>
                        <input
                          type="number"
                          name="decimals"
                          value={formData.decimals}
                          onChange={handleChange}
                          min={0}
                          max={18}
                          className="input-ice"
                        />
                      </div>
                    </div>

                    {/* Features Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="font-medium text-blue-700 mb-2">Ice Jetton Features</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Admin can freeze individual wallet balances</li>
                        <li>• Frozen wallets cannot transfer tokens</li>
                        <li>• Perfect for regulatory compliance</li>
                        <li>• Based on TON stablecoin-contract</li>
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
                          ) : !connected ? (
                            'Connect Wallet'
                          ) : (
                            '❄️ Create Ice Jetton'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                Why <span className="gradient-text-ice">Ice Jetton</span>?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: '❄️',
                    title: 'Freeze Wallets',
                    description: 'Admin can freeze any wallet, preventing transfers.',
                  },
                  {
                    icon: '🔐',
                    title: 'Compliance Ready',
                    description: 'Perfect for regulated assets and stablecoins.',
                  },
                  {
                    icon: '⚡',
                    title: 'TON Native',
                    description: 'Built on official TON stablecoin contracts.',
                  },
                ].map((feature, index) => (
                  <div key={index} className="card-ice text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
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
