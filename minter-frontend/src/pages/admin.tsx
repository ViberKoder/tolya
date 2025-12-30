import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTonConnect } from '@/hooks/useTonConnect';
import { Address, toNano, beginCell } from '@ton/core';
import toast from 'react-hot-toast';

interface JettonInfo {
  totalSupply: string;
  adminAddress: string | null;
  mintable: boolean;
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
}

// Jetton 2.0 Operation codes
const Opcodes = {
  mint: 0x642b7d07,
  changeAdmin: 0x6501f354,
  claimAdmin: 0xfb88e119,
  dropAdmin: 0xcb862902,
  internalTransfer: 0x178d4519,
};

export default function AdminPage() {
  const router = useRouter();
  const { connected, wallet, sendTransaction } = useTonConnect();
  const [contractAddress, setContractAddress] = useState('');
  const [jettonInfo, setJettonInfo] = useState<JettonInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'mint' | 'admin'>('info');
  
  // Prevent double loading
  const loadedAddressRef = useRef<string>('');
  const isLoadingRef = useRef(false);

  // Load address from URL query parameter
  useEffect(() => {
    if (router.query.address && typeof router.query.address === 'string') {
      setContractAddress(router.query.address);
    }
  }, [router.query.address]);

  const handleLoadJetton = useCallback(async (showToast = true) => {
    if (!contractAddress) {
      if (showToast) toast.error('Введите адрес контракта');
      return;
    }

    // Prevent double loading
    if (isLoadingRef.current) return;
    if (loadedAddressRef.current === contractAddress && jettonInfo) return;

    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      const address = Address.parse(contractAddress);
      
      // Fetch real jetton data from TON API
      const response = await fetch(`https://tonapi.io/v2/jettons/${address.toString()}`);
      
      if (!response.ok) {
        // Try alternative API endpoint
        const altResponse = await fetch(`https://toncenter.com/api/v3/jetton/masters?address=${address.toString()}&limit=1`);
        if (!altResponse.ok) {
          throw new Error('Токен не найден');
        }
        const altData = await altResponse.json();
        if (!altData.jetton_masters || altData.jetton_masters.length === 0) {
          throw new Error('Токен не найден');
        }
        const master = altData.jetton_masters[0];
        const info: JettonInfo = {
          totalSupply: master.total_supply || '0',
          adminAddress: master.admin_address || null,
          mintable: master.mintable !== false,
          name: master.jetton_content?.name || '',
          symbol: master.jetton_content?.symbol || '',
          description: master.jetton_content?.description || '',
          image: master.jetton_content?.image || '',
          decimals: parseInt(master.jetton_content?.decimals || '9'),
        };
        setJettonInfo(info);
        loadedAddressRef.current = contractAddress;
        if (showToast) toast.success('Информация о токене загружена');
        return;
      }
      
      const data = await response.json();
      
      const info: JettonInfo = {
        totalSupply: data.total_supply || '0',
        adminAddress: data.admin?.address || null,
        mintable: data.mintable !== false,
        name: data.metadata?.name || '',
        symbol: data.metadata?.symbol || '',
        description: data.metadata?.description || '',
        image: data.metadata?.image || '',
        decimals: parseInt(data.metadata?.decimals || '9'),
      };
      
      setJettonInfo(info);
      loadedAddressRef.current = contractAddress;
      
      if (showToast) toast.success('Информация о токене загружена');
    } catch (error: any) {
      console.error('Failed to load jetton:', error);
      if (showToast) toast.error(error.message || 'Не удалось загрузить информацию о токене');
      
      // Set empty state for new tokens that aren't indexed yet
      if (!jettonInfo) {
        setJettonInfo({
          totalSupply: '0',
          adminAddress: wallet?.toString() || null,
          mintable: true,
          name: 'Новый токен',
          symbol: '???',
          description: 'Токен еще не проиндексирован. Попробуйте обновить через несколько минут.',
          image: '',
          decimals: 9,
        });
        loadedAddressRef.current = contractAddress;
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [contractAddress, wallet, jettonInfo]);

  // Auto-load jetton info when address is set from URL (only once)
  useEffect(() => {
    if (contractAddress && router.query.address && !loadedAddressRef.current) {
      handleLoadJetton(false);
    }
  }, [contractAddress, router.query.address, handleLoadJetton]);

  const handleMint = async () => {
    if (!connected || !wallet) {
      toast.error('Подключите кошелек');
      return;
    }

    if (!mintAmount || !mintTo) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const toAddress = Address.parse(mintTo);
      const decimals = jettonInfo?.decimals || 9;
      const amount = BigInt(mintAmount) * BigInt(10 ** decimals);
      
      // Jetton 2.0 mint message
      const internalTransferMsg = beginCell()
        .storeUint(Opcodes.internalTransfer, 32)
        .storeUint(0, 64)
        .storeCoins(amount)
        .storeAddress(null)
        .storeAddress(wallet)
        .storeCoins(0)
        .storeMaybeRef(null)
        .endCell();

      const mintBody = beginCell()
        .storeUint(Opcodes.mint, 32)
        .storeUint(0, 64)
        .storeAddress(toAddress)
        .storeCoins(toNano('0.1'))
        .storeRef(internalTransferMsg)
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.15').toString(),
        body: mintBody.toBoc().toString('base64'),
      });

      toast.success('Транзакция минтинга отправлена!');
      setMintAmount('');
      setMintTo('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка минтинга');
    }
  };

  const handleChangeAdmin = async () => {
    if (!connected || !wallet) {
      toast.error('Подключите кошелек');
      return;
    }

    if (!newAdmin) {
      toast.error('Введите адрес нового администратора');
      return;
    }

    try {
      const adminAddress = Address.parse(newAdmin);
      
      // Jetton 2.0 change_admin (0x6501f354)
      const changeAdminBody = beginCell()
        .storeUint(Opcodes.changeAdmin, 32)
        .storeUint(0, 64)
        .storeAddress(adminAddress)
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.05').toString(),
        body: changeAdminBody.toBoc().toString('base64'),
      });

      toast.success('Запрос на смену администратора отправлен! Новый администратор должен подтвердить права.');
      setNewAdmin('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка смены администратора');
    }
  };

  const handleRevokeAdmin = async () => {
    if (!connected || !wallet) {
      toast.error('Подключите кошелек');
      return;
    }

    try {
      // Jetton 2.0 drop_admin message (0xcb862902)
      const dropAdminBody = beginCell()
        .storeUint(Opcodes.dropAdmin, 32)
        .storeUint(0, 64)
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.05').toString(),
        body: dropAdminBody.toBoc().toString('base64'),
      });

      toast.success('Права администратора отозваны! Токен теперь полностью децентрализован.');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отзыва прав');
    }
  };

  const isAdmin = jettonInfo?.adminAddress && wallet && 
    Address.parse(jettonInfo.adminAddress).equals(wallet);

  const formatSupply = (supply: string, decimals: number) => {
    try {
      const num = BigInt(supply);
      const divisor = BigInt(10 ** decimals);
      const whole = num / divisor;
      return whole.toLocaleString();
    } catch {
      return supply;
    }
  };

  const handleRefresh = () => {
    loadedAddressRef.current = '';
    setJettonInfo(null);
    handleLoadJetton(true);
  };

  return (
    <>
      <Head>
        <title>Управление токеном | Jetton 2.0 Minter</title>
      </Head>

      <div className="min-h-screen flex flex-col">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-ton-blue/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        </div>

        <Header />

        <main className="flex-grow relative z-10 pt-24 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
              Управление <span className="gradient-text">токеном</span>
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Jetton 2.0 Admin Panel
            </p>

            {/* Contract Address Input */}
            <div className="card mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Адрес контракта
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => {
                    setContractAddress(e.target.value);
                    loadedAddressRef.current = '';
                  }}
                  placeholder="EQ... или UQ..."
                  className="input-ton flex-grow"
                />
                <button
                  onClick={() => handleLoadJetton(true)}
                  disabled={loading || !contractAddress}
                  className="btn-primary whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner" />
                      Загрузка...
                    </span>
                  ) : (
                    'Загрузить'
                  )}
                </button>
              </div>
            </div>

            {jettonInfo && (
              <>
                {/* Token Preview Card */}
                <div className="card mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-ton-gray-light overflow-hidden flex-shrink-0">
                      {jettonInfo.image ? (
                        <img 
                          src={jettonInfo.image} 
                          alt={jettonInfo.name}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                          {jettonInfo.symbol?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-white">{jettonInfo.name || 'Unnamed Token'}</h3>
                      <p className="text-gray-400">${jettonInfo.symbol || 'UNKNOWN'}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {isAdmin && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                          Вы администратор
                        </span>
                      )}
                      {!jettonInfo.adminAddress && (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">
                          Децентрализован
                        </span>
                      )}
                      <button
                        onClick={handleRefresh}
                        className="text-sm text-ton-blue hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Обновить
                      </button>
                    </div>
                  </div>

                  {/* Important notice about Jetton 2.0 */}
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-yellow-400 mb-1">Jetton 2.0 Standard</h4>
                        <p className="text-sm text-gray-400">
                          Стандарт Jetton 2.0 <strong className="text-yellow-400">не поддерживает изменение метаданных</strong> после создания токена. 
                          Название, тикер, описание и аватарка задаются один раз при деплое и не могут быть изменены. 
                          Это сделано для безопасности и защиты от мошенничества.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6 p-1 bg-ton-gray rounded-xl overflow-x-auto">
                  {[
                    { id: 'info', label: 'Информация' },
                    { id: 'mint', label: 'Минтинг' },
                    { id: 'admin', label: 'Администрирование' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
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
                        <span className="text-gray-400">Название</span>
                        <span className="text-white font-medium">{jettonInfo.name || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Тикер</span>
                        <span className="text-white font-medium">{jettonInfo.symbol || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Описание</span>
                        <span className="text-white font-medium text-right max-w-[250px]">
                          {jettonInfo.description || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Total Supply</span>
                        <span className="text-white font-medium">
                          {formatSupply(jettonInfo.totalSupply, jettonInfo.decimals)} {jettonInfo.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Decimals</span>
                        <span className="text-white font-medium">{jettonInfo.decimals}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-ton-gray-light">
                        <span className="text-gray-400">Mintable</span>
                        <span className={`font-medium ${jettonInfo.adminAddress ? 'text-green-400' : 'text-red-400'}`}>
                          {jettonInfo.adminAddress ? 'Да' : 'Нет (децентрализован)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-400">Администратор</span>
                        {jettonInfo.adminAddress ? (
                          <code className="text-ton-blue text-sm">
                            {jettonInfo.adminAddress.slice(0, 8)}...{jettonInfo.adminAddress.slice(-6)}
                          </code>
                        ) : (
                          <span className="text-gray-500">Отсутствует (децентрализован)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'mint' && (
                    <div className="space-y-6">
                      {!isAdmin && jettonInfo.adminAddress && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <p className="text-red-400 text-sm">
                            Вы не являетесь администратором этого токена и не можете минтить.
                          </p>
                        </div>
                      )}

                      {!jettonInfo.adminAddress && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                          <p className="text-yellow-400 text-sm">
                            Этот токен децентрализован. Права администратора отозваны, минтинг невозможен.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Количество токенов
                        </label>
                        <input
                          type="text"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          placeholder="1000000"
                          className="input-ton"
                          disabled={!isAdmin}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Без учета decimals (токен с 9 decimals: 1000000 = 1,000,000 токенов)
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Адрес получателя
                        </label>
                        <input
                          type="text"
                          value={mintTo}
                          onChange={(e) => setMintTo(e.target.value)}
                          placeholder="EQ..."
                          className="input-ton"
                          disabled={!isAdmin}
                        />
                        {wallet && isAdmin && (
                          <button
                            onClick={() => setMintTo(wallet.toString())}
                            className="text-sm text-ton-blue hover:underline mt-1"
                          >
                            Использовать мой адрес
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleMint}
                        disabled={!connected || !mintAmount || !mintTo || !isAdmin}
                        className="btn-primary w-full"
                      >
                        Минтить токены
                      </button>
                    </div>
                  )}

                  {activeTab === 'admin' && (
                    <div className="space-y-6">
                      {!isAdmin && jettonInfo.adminAddress && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <p className="text-red-400 text-sm">
                            Вы не являетесь администратором этого токена.
                          </p>
                        </div>
                      )}

                      {!jettonInfo.adminAddress && (
                        <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <div>
                              <h4 className="font-medium text-white">Токен децентрализован</h4>
                              <p className="text-gray-400 text-sm">
                                У этого токена нет администратора. Он полностью децентрализован и никто не может его контролировать.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <>
                          {/* Change Admin */}
                          <div className="p-6 bg-ton-gray-light rounded-xl">
                            <h4 className="font-semibold text-white mb-2">Передать права администратора</h4>
                            <p className="text-sm text-gray-400 mb-4">
                              Новый администратор должен будет подтвердить права с помощью транзакции claim_admin.
                            </p>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Адрес нового администратора
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
                              className="btn-primary w-full mt-4"
                            >
                              Передать права
                            </button>
                          </div>

                          {/* Revoke Admin (Danger Zone) */}
                          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div className="flex items-start gap-3 mb-4">
                              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div>
                                <h4 className="font-semibold text-red-400">Опасная зона</h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  Отзыв прав администратора сделает токен полностью децентрализованным. 
                                  После этого:
                                </p>
                                <ul className="text-sm text-gray-400 mt-2 space-y-1 list-disc list-inside">
                                  <li>Никто не сможет минтить новые токены</li>
                                  <li>Метаданные останутся неизменными навсегда</li>
                                  <li>Это действие <strong className="text-red-400">НЕОБРАТИМО</strong></li>
                                </ul>
                              </div>
                            </div>
                            <button
                              onClick={handleRevokeAdmin}
                              disabled={!connected}
                              className="w-full py-3 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-colors border border-red-500/30"
                            >
                              🔒 Отозвать права администратора
                            </button>
                          </div>
                        </>
                      )}
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
                <h3 className="text-xl font-semibold text-white mb-2">Подключите кошелек</h3>
                <p className="text-gray-400">Подключите кошелек для управления токенами</p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
