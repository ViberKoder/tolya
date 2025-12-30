import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTonConnect } from '@/hooks/useTonConnect';
import { Address, toNano, beginCell } from '@ton/core';
import toast from 'react-hot-toast';

interface JettonInfo {
  totalSupply: string;
  adminAddress: string;
  mintable: boolean;
  name?: string;
  symbol?: string;
}

export default function AdminPage() {
  const { connected, wallet, sendTransaction } = useTonConnect();
  const [contractAddress, setContractAddress] = useState('');
  const [jettonInfo, setJettonInfo] = useState<JettonInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'mint' | 'admin'>('info');

  const handleLoadJetton = async () => {
    if (!contractAddress) {
      toast.error('Please enter a contract address');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you would fetch this from TON API or directly from the contract
      // For now, we'll show a mock response
      const address = Address.parse(contractAddress);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setJettonInfo({
        totalSupply: '1000000',
        adminAddress: wallet?.toString() || '',
        mintable: true,
        name: 'Loaded Token',
        symbol: 'LTK',
      });
      
      toast.success('Token info loaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load token info');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!connected || !wallet) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!mintAmount || !mintTo) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const toAddress = Address.parse(mintTo);
      const amount = BigInt(mintAmount) * BigInt(10 ** 9);
      
      const mintBody = beginCell()
        .storeUint(21, 32) // op::mint
        .storeUint(0, 64) // query_id
        .storeAddress(toAddress)
        .storeCoins(toNano('0.05'))
        .storeRef(
          beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(0, 64)
            .storeCoins(amount)
            .storeAddress(null)
            .storeAddress(wallet)
            .storeCoins(0)
            .storeBit(false)
            .endCell()
        )
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.1').toString(),
        body: mintBody.toBoc().toString('base64'),
      });

      toast.success('Mint transaction sent!');
    } catch (error: any) {
      toast.error(error.message || 'Mint failed');
    }
  };

  const handleChangeAdmin = async () => {
    if (!connected || !wallet) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!newAdmin) {
      toast.error('Please enter new admin address');
      return;
    }

    try {
      const adminAddress = Address.parse(newAdmin);
      
      const changeAdminBody = beginCell()
        .storeUint(3, 32) // op::change_admin
        .storeUint(0, 64) // query_id
        .storeAddress(adminAddress)
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.05').toString(),
        body: changeAdminBody.toBoc().toString('base64'),
      });

      toast.success('Change admin transaction sent!');
    } catch (error: any) {
      toast.error(error.message || 'Change admin failed');
    }
  };

  return (
    <>
      <Head>
        <title>Admin | Jetton 2.0 Minter</title>
      </Head>

      <div className="min-h-screen flex flex-col">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-ton-blue/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ton-accent/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        </div>

        <Header />

        <main className="flex-grow relative z-10 pt-24 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
              Token <span className="gradient-text">Admin Panel</span>
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Manage your deployed Jetton 2.0 tokens
            </p>

            {/* Contract Address Input */}
            <div className="card mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contract Address
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="EQ..."
                  className="input-ton flex-grow"
                />
                <button
                  onClick={handleLoadJetton}
                  disabled={loading || !contractAddress}
                  className="btn-primary whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner" />
                      Loading...
                    </span>
                  ) : (
                    'Load Token'
                  )}
                </button>
              </div>
            </div>

            {jettonInfo && (
              <>
                {/* Tabs */}
                <div className="flex space-x-2 mb-6 p-1 bg-ton-gray rounded-xl">
                  {[
                    { id: 'info', label: 'Token Info' },
                    { id: 'mint', label: 'Mint Tokens' },
                    { id: 'admin', label: 'Admin Settings' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-ton text-white shadow-ton'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="card">
                  {activeTab === 'info' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Name</span>
                        <span className="text-white font-medium">{jettonInfo.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Symbol</span>
                        <span className="text-white font-medium">{jettonInfo.symbol}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Total Supply</span>
                        <span className="text-white font-medium">{jettonInfo.totalSupply}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Mintable</span>
                        <span className={`font-medium ${jettonInfo.mintable ? 'text-green-400' : 'text-red-400'}`}>
                          {jettonInfo.mintable ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-400">Admin</span>
                        <code className="text-ton-blue text-sm">{jettonInfo.adminAddress.slice(0, 8)}...{jettonInfo.adminAddress.slice(-6)}</code>
                      </div>
                    </div>
                  )}

                  {activeTab === 'mint' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Amount to Mint
                        </label>
                        <input
                          type="text"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          placeholder="1000000"
                          className="input-ton"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Recipient Address
                        </label>
                        <input
                          type="text"
                          value={mintTo}
                          onChange={(e) => setMintTo(e.target.value)}
                          placeholder="EQ..."
                          className="input-ton"
                        />
                      </div>
                      <button
                        onClick={handleMint}
                        disabled={!connected || !mintAmount || !mintTo}
                        className="btn-primary w-full"
                      >
                        Mint Tokens
                      </button>
                    </div>
                  )}

                  {activeTab === 'admin' && (
                    <div className="space-y-6">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <h4 className="font-medium text-yellow-500 mb-1">Warning</h4>
                            <p className="text-sm text-gray-400">
                              Changing admin will transfer full control of the token contract. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          New Admin Address
                        </label>
                        <input
                          type="text"
                          value={newAdmin}
                          onChange={(e) => setNewAdmin(e.target.value)}
                          placeholder="EQ..."
                          className="input-ton"
                        />
                      </div>
                      <button
                        onClick={handleChangeAdmin}
                        disabled={!connected || !newAdmin}
                        className="btn-primary w-full bg-gradient-to-r from-yellow-500 to-orange-500"
                      >
                        Change Admin
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!connected && (
              <div className="card text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400">Please connect your wallet to manage tokens</p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
