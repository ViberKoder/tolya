import React, { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from '@ton/core';
import './MainContent.css';
import DeployForm from './DeployForm';
import SuccessMessage from './SuccessMessage';

interface MainContentProps {
  isTestnet: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ isTestnet }) => {
  const [tonConnectUI] = useTonConnectUI();
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async (formData: {
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    decimals: number;
    initialSupply: string;
  }) => {
    if (!tonConnectUI.connected) {
      await tonConnectUI.openModal();
      return;
    }

    setIsDeploying(true);
    try {
      // Здесь будет логика деплоя контракта
      // Пока что симулируем успешный деплой
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDeployedAddress('EQD__________________________________________0vo'); // Пример адреса
    } catch (error) {
      console.error('Deploy error:', error);
      alert('Ошибка при деплое контракта');
    } finally {
      setIsDeploying(false);
    }
  };

  if (deployedAddress) {
    return (
      <div className="main-content">
        <SuccessMessage address={deployedAddress} />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="content-wrapper">
        <div className="hero-section">
          <h1 className="hero-title">Создайте свой Jetton 2.0</h1>
          <p className="hero-description">
            Выпустите свой токен в сети TON за несколько минут. 
            Простой и безопасный способ создания жетонов на блокчейне TON.
          </p>
        </div>
        <DeployForm onSubmit={handleDeploy} isDeploying={isDeploying} />
      </div>
    </div>
  );
};

export default MainContent;
