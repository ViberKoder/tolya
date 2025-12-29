import { TonConnectButton } from '@tonconnect/ui-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ton-black/80 backdrop-blur-xl border-b border-ton-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-ton flex items-center justify-center shadow-ton group-hover:shadow-ton-hover transition-shadow">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-ton-black" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-white">Jetton</span>
              <span className="text-xl font-bold text-ton-blue">2.0</span>
              <span className="text-xl font-light text-gray-400 ml-1">Minter</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Create Token
            </Link>
            <Link 
              href="/admin"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Admin
            </Link>
            <Link 
              href="https://docs.ton.org/develop/dapps/asset-processing/jettons" 
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Docs
            </Link>
            <Link 
              href="https://tonscan.org" 
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
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
