import React from 'react';
import './SuccessMessage.css';

interface SuccessMessageProps {
  address: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ address }) => {
  const explorerUrl = `https://tonscan.org/jetton/${address}`;
  const testnetExplorerUrl = `https://testnet.tonscan.org/jetton/${address}`;
  const isTestnet = window.location.search.includes('testnet=true');
  const explorerLink = isTestnet ? testnetExplorerUrl : explorerUrl;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    alert('Адрес скопирован!');
  };

  return (
    <div className="success-container">
      <div className="success-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="32" fill="#10b981"/>
          <path d="M20 32L28 40L44 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 className="success-title">Токен успешно создан!</h1>
      <p className="success-description">
        Ваш Jetton 2.0 токен был успешно развернут в сети TON.
      </p>
      
      <div className="address-container">
        <label className="address-label">Адрес контракта:</label>
        <div className="address-box">
          <code className="address-text">{address}</code>
          <button className="copy-button" onClick={copyToClipboard}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5.5 3.5H3.5C2.67157 3.5 2 4.17157 2 5V12.5C2 13.3284 2.67157 14 3.5 14H11C11.8284 14 12.5 13.3284 12.5 12.5V10.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5.5 3.5C5.5 2.67157 6.17157 2 7 2H12.5C13.3284 2 14 2.67157 14 3.5V9C14 9.82843 13.3284 10.5 12.5 10.5H7C6.17157 10.5 5.5 9.82843 5.5 9V3.5Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="success-actions">
        <a
          href={explorerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Открыть в Explorer
        </a>
        <button
          className="btn btn-secondary"
          onClick={() => window.location.reload()}
        >
          Создать еще один токен
        </button>
      </div>
    </div>
  );
};

export default SuccessMessage;
