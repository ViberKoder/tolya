import React, { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import './DeployForm.css';

interface DeployFormProps {
  onSubmit: (data: {
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    decimals: number;
    initialSupply: string;
  }) => void;
  isDeploying: boolean;
}

const DeployForm: React.FC<DeployFormProps> = ({ onSubmit, isDeploying }) => {
  const [tonConnectUI] = useTonConnectUI();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    decimals: 9,
    initialSupply: '1000000'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tonConnectUI.connected) {
      tonConnectUI.openModal();
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="deploy-form-container">
      <form className="deploy-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="form-section-title">Основная информация</h2>
          
          <div className="form-group">
            <label className="form-label">Название токена *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Например: My Token"
              required
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Символ токена *</label>
            <input
              type="text"
              className="form-input"
              value={formData.symbol}
              onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
              placeholder="Например: MTK"
              required
              maxLength={10}
            />
            <span className="form-hint">Обычно 3-5 символов</span>
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Краткое описание вашего токена"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL изображения</label>
            <input
              type="url"
              className="form-input"
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://example.com/token-image.png"
            />
            <span className="form-hint">Рекомендуемый размер: 500x500px</span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Параметры токена</h2>
          
          <div className="form-group">
            <label className="form-label">Количество знаков после запятой</label>
            <input
              type="number"
              className="form-input"
              value={formData.decimals}
              onChange={(e) => handleChange('decimals', parseInt(e.target.value) || 9)}
              min={0}
              max={18}
            />
            <span className="form-hint">Рекомендуемое значение: 9</span>
          </div>

          <div className="form-group">
            <label className="form-label">Начальный выпуск</label>
            <input
              type="text"
              className="form-input"
              value={formData.initialSupply}
              onChange={(e) => handleChange('initialSupply', e.target.value)}
              placeholder="1000000"
            />
            <span className="form-hint">Количество токенов для начального выпуска</span>
          </div>
        </div>

        <div className="form-actions">
          {!tonConnectUI.connected ? (
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={() => tonConnectUI.openModal()}
            >
              Подключить кошелек
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={isDeploying}
            >
              {isDeploying ? 'Деплой...' : 'Создать токен'}
            </button>
          )}
        </div>

        {tonConnectUI.connected && (
          <div className="wallet-info">
            <span className="wallet-address">
              Кошелек: {tonConnectUI.wallet?.account.address.slice(0, 6)}...{tonConnectUI.wallet?.account.address.slice(-4)}
            </span>
            <button
              type="button"
              className="btn-link"
              onClick={() => tonConnectUI.disconnect()}
            >
              Отключить
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default DeployForm;
