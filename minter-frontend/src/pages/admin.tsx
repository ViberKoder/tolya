import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTonConnect } from '@/hooks/useTonConnect';
import { Address, toNano, beginCell } from '@ton/core';
import { buildOnchainMetadata } from '@/utils/metadata';
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
  changeAdmin: 0xcb862902, // drop_admin in Jetton 2.0
  changeContent: 0x10b0c8f6, // set_content in Jetton 2.0
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
  const [activeTab, setActiveTab] = useState<'info' | 'mint' | 'metadata' | 'admin'>('info');
  
  // Metadata editing
  const [editName, setEditName] = useState('');
  const [editSymbol, setEditSymbol] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // Load address from URL query parameter
  useEffect(() => {
    if (router.query.address && typeof router.query.address === 'string') {
      setContractAddress(router.query.address);
    }
  }, [router.query.address]);

  const handleLoadJetton = useCallback(async () => {
    if (!contractAddress) {
      toast.error('Введите адрес контракта');
      return;
    }

    setLoading(true);
    try {
      const address = Address.parse(contractAddress);
      
      // Fetch real jetton data from TON API
      const response = await fetch(`https://tonapi.io/v2/jettons/${address.toString()}`);
      
      if (!response.ok) {
        throw new Error('Токен не найден');
      }
      
      const data = await response.json();
      
      const info: JettonInfo = {
        totalSupply: data.total_supply || '0',
        adminAddress: data.admin?.address || null,
        mintable: !!data.mintable,
        name: data.metadata?.name || '',
        symbol: data.metadata?.symbol || '',
        description: data.metadata?.description || '',
        image: data.metadata?.image || '',
        decimals: parseInt(data.metadata?.decimals || '9'),
      };
      
      setJettonInfo(info);
      setEditName(info.name);
      setEditSymbol(info.symbol);
      setEditDescription(info.description);
      setEditImage(info.image);
      setImagePreview(info.image);
      
      toast.success('Информация о токене загружена');
    } catch (error: any) {
      console.error('Failed to load jetton:', error);
      toast.error(error.message || 'Не удалось загрузить информацию о токене');
      
      // Set empty state for new tokens
      setJettonInfo({
        totalSupply: '0',
        adminAddress: wallet?.toString() || null,
        mintable: true,
        name: '',
        symbol: '',
        description: '',
        image: '',
        decimals: 9,
      });
    } finally {
      setLoading(false);
    }
  }, [contractAddress, wallet]);

  // Auto-load jetton info when address is set from URL
  useEffect(() => {
    if (contractAddress && router.query.address) {
      handleLoadJetton();
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

  const handleUpdateMetadata = async () => {
    if (!connected || !wallet) {
      toast.error('Подключите кошелек');
      return;
    }

    if (!editName.trim() || !editSymbol.trim()) {
      toast.error('Название и тикер обязательны');
      return;
    }

    try {
      // Build new metadata content
      const newMetadata = buildOnchainMetadata({
        name: editName.trim(),
        symbol: editSymbol.trim().toUpperCase(),
        description: editDescription.trim() || editName.trim(),
        image: editImage.trim(),
        decimals: jettonInfo?.decimals || 9,
      });

      // Jetton 2.0 set_content message (0x10b0c8f6)
      const changeContentBody = beginCell()
        .storeUint(Opcodes.changeContent, 32)
        .storeUint(0, 64)
        .storeRef(newMetadata)
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.05').toString(),
        body: changeContentBody.toBoc().toString('base64'),
      });

      toast.success('Метаданные обновлены! Изменения появятся в эксплорерах через несколько минут.');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления метаданных');
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
      
      // For Jetton 2.0, we use claim_admin flow
      // First, current admin initiates transfer, then new admin claims
      const changeAdminBody = beginCell()
        .storeUint(0x6501f354, 32) // change_admin op for Jetton 2.0
        .storeUint(0, 64)
        .storeAddress(adminAddress)
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.05').toString(),
        body: changeAdminBody.toBoc().toString('base64'),
      });

      toast.success('Запрос на смену администратора отправлен!');
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
        .storeUint(Opcodes.changeAdmin, 32) // drop_admin
        .storeUint(0, 64)
        .endCell();

      await sendTransaction({
        to: contractAddress,
        value: toNano('0.05').toString(),
        body: dropAdminBody.toBoc().toString('base64'),
      });

      toast.success('Права администратора отозваны! Теперь никто не сможет управлять токеном.');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отзыва прав');
    }
  };

  const isAdmin = jettonInfo?.adminAddress && wallet && 
    Address.parse(jettonInfo.adminAddress).equals(wallet);

  const formatSupply = (supply: string, decimals: number) => {
    const num = BigInt(supply);
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    return whole.toLocaleString();
  };

  return (
    <>
      <Head>
        <title>Модерация токена | Jetton 2.0 Minter</title>
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
              Модерация <span className="gradient-text">токена</span>
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Управляйте вашим Jetton 2.0 токеном
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
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="EQ... или UQ..."
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
                <div className="card mb-6 flex items-center gap-4">
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
                  {isAdmin && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      Вы администратор
                    </span>
                  )}
                  {!jettonInfo.adminAddress && (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">
                      Без администратора
                    </span>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6 p-1 bg-ton-gray rounded-xl overflow-x-auto">
                  {[
                    { id: 'info', label: 'Инфо' },
                    { id: 'metadata', label: 'Метаданные' },
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
                        <span className="text-white font-medium text-right max-w-[200px] truncate">
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
                        <span className={`font-medium ${jettonInfo.mintable ? 'text-green-400' : 'text-red-400'}`}>
                          {jettonInfo.mintable ? 'Да' : 'Нет'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-400">Администратор</span>
                        {jettonInfo.adminAddress ? (
                          <code className="text-ton-blue text-sm">
                            {jettonInfo.adminAddress.slice(0, 8)}...{jettonInfo.adminAddress.slice(-6)}
                          </code>
                        ) : (
                          <span className="text-gray-500">Отсутствует</span>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'metadata' && (
                    <div className="space-y-6">
                      {!isAdmin && jettonInfo.adminAddress && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <p className="text-red-400 text-sm">
                            Вы не являетесь администратором этого токена и не можете изменять метаданные.
                          </p>
                        </div>
                      )}

                      {!jettonInfo.adminAddress && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                          <p className="text-yellow-400 text-sm">
                            У этого токена нет администратора. Метаданные не могут быть изменены.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Название токена
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="My Token"
                            className="input-ton"
                            disabled={!isAdmin}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Тикер
                          </label>
                          <input
                            type="text"
                            value={editSymbol}
                            onChange={(e) => setEditSymbol(e.target.value)}
                            placeholder="MTK"
                            className="input-ton uppercase"
                            maxLength={10}
                            disabled={!isAdmin}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Описание
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Описание токена..."
                          className="input-ton min-h-[100px] resize-none"
                          rows={3}
                          disabled={!isAdmin}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          URL изображения
                        </label>
                        <div className="flex gap-4">
                          <div className="flex-grow">
                            <input
                              type="url"
                              value={editImage}
                              onChange={(e) => {
                                setEditImage(e.target.value);
                                setImagePreview(e.target.value);
                              }}
                              placeholder="https://example.com/token-logo.png"
                              className="input-ton"
                              disabled={!isAdmin}
                            />
                            <p className="text-xs text-gray-500 mt-1">PNG или JPEG, рекомендуется 256x256px</p>
                          </div>
                          <div className="w-20 h-20 rounded-xl bg-ton-gray-light border border-ton-gray-light overflow-hidden flex items-center justify-center flex-shrink-0">
                            {imagePreview ? (
                              <img 
                                src={imagePreview} 
                                alt="Token preview" 
                                className="w-full h-full object-cover"
                                onError={() => setImagePreview('')}
                              />
                            ) : (
                              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleUpdateMetadata}
                        disabled={!connected || !isAdmin}
                        className="btn-primary w-full"
                      >
                        Сохранить метаданные
                      </button>
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
                            У этого токена нет администратора. Минтинг невозможен.
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
                        {wallet && (
                          <button
                            onClick={() => setMintTo(wallet.toString())}
                            className="text-sm text-ton-blue hover:underline mt-1"
                            disabled={!isAdmin}
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
                          <p className="text-gray-400 text-sm">
                            У этого токена нет администратора. Токен полностью децентрализован.
                          </p>
                        </div>
                      )}

                      {/* Change Admin */}
                      <div className="p-6 bg-ton-gray-light rounded-xl">
                        <h4 className="font-semibold text-white mb-4">Передать права администратора</h4>
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
                            disabled={!isAdmin}
                          />
                        </div>
                        <button
                          onClick={handleChangeAdmin}
                          disabled={!connected || !newAdmin || !isAdmin}
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
                              Никто больше не сможет минтить новые токены или изменять метаданные. 
                              <strong className="text-red-400"> Это действие необратимо!</strong>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRevokeAdmin}
                          disabled={!connected || !isAdmin}
                          className="w-full py-3 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-colors border border-red-500/30"
                        >
                          Отозвать права администратора
                        </button>
                      </div>
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
