import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-text">
            Создано с использованием официальных контрактов Jetton 2.0
          </p>
          <div className="footer-links">
            <a
              href="https://ton.org"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              TON.org
            </a>
            <a
              href="https://github.com/ton-blockchain/jetton-contract"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
            <a
              href="https://docs.ton.org"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Документация
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
