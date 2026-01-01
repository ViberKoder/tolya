import { TonConnectButton } from '@tonconnect/ui-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-cook-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-cook flex items-center justify-center shadow-cook group-hover:shadow-cook-hover transition-shadow">
                <img 
                  src="https://em-content.zobj.net/source/telegram/386/poultry-leg_1f357.webp" 
                  alt="Cook" 
                  className="w-6 h-6"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-cook-text">Cook</span>
              <span className="text-xs text-cook-text-secondary ml-1 bg-cook-bg-secondary px-2 py-0.5 rounded-full">Jetton 2.0</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/"
              className="text-cook-text-secondary hover:text-ton-blue transition-colors text-sm font-medium"
            >
              Create Token
            </Link>
            <Link 
              href="/admin"
              className="text-cook-text-secondary hover:text-ton-blue transition-colors text-sm font-medium"
            >
              Admin
            </Link>
            <Link 
              href="https://docs.ton.org/develop/dapps/asset-processing/jettons" 
              target="_blank"
              className="text-cook-text-secondary hover:text-ton-blue transition-colors text-sm font-medium"
            >
              Docs
            </Link>
            <Link 
              href="https://tonscan.org" 
              target="_blank"
              className="text-cook-text-secondary hover:text-ton-blue transition-colors text-sm font-medium"
            >
              Explorer
            </Link>
          </nav>

          {/* Wallet Connect Button */}
          <div className="flex items-center space-x-4">
            <TonConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
