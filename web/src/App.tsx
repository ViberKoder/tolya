import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import './App.css';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';

const App: React.FC = () => {
  const isTestnet = window.location.search.includes('testnet=true');

  return (
    <TonConnectUIProvider
      manifestUrl="https://ton.org/tonconnect-manifest.json"
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/tonkeeper'
      }}
    >
      <div className="app">
        <Header />
        <MainContent isTestnet={isTestnet} />
        <Footer />
      </div>
    </TonConnectUIProvider>
  );
};

export default App;
