import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#0088cc"/>
            <path d="M16 8L22 14L16 20L10 14L16 8Z" fill="white"/>
          </svg>
          <span className="header-title">Jetton Minter</span>
        </div>
        <nav className="header-nav">
          <a href="https://ton.org" target="_blank" rel="noopener noreferrer" className="header-link">
            TON.org
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
