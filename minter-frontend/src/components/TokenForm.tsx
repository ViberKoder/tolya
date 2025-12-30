import { useState } from 'react';
import { TokenData } from '@/pages';

interface TokenFormProps {
  onDeploy: (data: TokenData) => void;
  isConnected: boolean;
  error?: string;
}

export default function TokenForm({ onDeploy, isConnected, error }: TokenFormProps) {
  const [formData, setFormData] = useState<TokenData>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    decimals: 9,
    totalSupply: '1000000',
    mintable: true,
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === 'decimals') {
      const num = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: Math.min(Math.max(num, 0), 18),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    if (name === 'image' && value) {
      setImagePreview(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeploy(formData);
  };

  const isValid = formData.name.trim() && formData.symbol.trim() && formData.totalSupply;

  return (
    <form onSubmit={handleSubmit} className="card">
      {/* Tabs */}
      <div className="flex space-x-2 mb-8 p-1 bg-ton-gray-light rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'basic'
              ? 'bg-gradient-ton text-white shadow-ton'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Basic Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'advanced'
              ? 'bg-gradient-ton text-white shadow-ton'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Advanced
        </button>
      </div>

      {activeTab === 'basic' ? (
        <div className="space-y-6">
          {/* Token Name & Symbol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Name <span className="text-ton-blue">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., My Token"
                className="input-ton"
                required
              />
              <p className="text-xs text-gray-500 mt-1">The full name of your token</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Symbol <span className="text-ton-blue">*</span>
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g., MTK"
                className="input-ton uppercase"
                maxLength={10}
                required
              />
              <p className="text-xs text-gray-500 mt-1">3-5 characters recommended</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your token..."
              className="input-ton min-h-[100px] resize-none"
              rows={3}
            />
          </div>

          {/* Image URL with Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Image URL
            </label>
            <div className="flex gap-4">
              <div className="flex-grow">
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/token-logo.png"
                  className="input-ton"
                />
                <p className="text-xs text-gray-500 mt-1">PNG or JPEG, 256x256px recommended</p>
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

          {/* Total Supply */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Supply <span className="text-ton-blue">*</span>
            </label>
            <input
              type="text"
              name="totalSupply"
              value={formData.totalSupply}
              onChange={handleChange}
              placeholder="1000000"
              className="input-ton"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Total number of tokens to mint (without decimals)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Decimals */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Decimals
            </label>
            <input
              type="number"
              name="decimals"
              value={formData.decimals}
              onChange={handleChange}
              min={0}
              max={18}
              className="input-ton"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of decimal places (9 is standard for TON tokens)
            </p>
          </div>

          {/* Mintable */}
          <div className="flex items-center justify-between p-4 bg-ton-gray-light rounded-xl">
            <div>
              <h4 className="font-medium text-white">Mintable</h4>
              <p className="text-sm text-gray-400">Allow minting additional tokens after deployment</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="mintable"
                checked={formData.mintable}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ton-gray rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ton-blue"></div>
            </label>
          </div>

          {/* Info Card */}
          <div className="p-4 bg-ton-blue/10 border border-ton-blue/20 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-ton-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-ton-blue mb-1">Jetton 2.0 Standard</h4>
                <p className="text-sm text-gray-400">
                  Токен будет создан по стандарту Jetton 2.0 для максимальной совместимости с кошельками и DEX.
                </p>
              </div>
            </div>
          </div>

          {/* Warning about immutable metadata */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-400 mb-1">Важно!</h4>
                <p className="text-sm text-gray-400">
                  Название, тикер, описание и аватарка <strong className="text-yellow-400">не могут быть изменены</strong> после создания токена. Убедитесь, что все данные введены правильно!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Summary & Submit */}
      <div className="mt-8 pt-6 border-t border-ton-gray-light">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm">Стоимость создания токена</p>
            <p className="text-white font-semibold">1 TON</p>
            <p className="text-xs text-gray-500">0.2 TON на деплой • 0.8 TON сервисный сбор</p>
          </div>
          
          <button
            type="submit"
            disabled={!isConnected || !isValid}
            className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 min-w-[200px]"
          >
            {!isConnected ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect Wallet
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Jetton
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
