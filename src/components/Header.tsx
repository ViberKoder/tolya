'use client'

import { TonConnectButton } from '@tonconnect/ui-react'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container-custom">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-ton-blue rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-ton-dark">Jetton Minter</h1>
              <p className="text-xs text-gray-500">Version 2.0</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#create" className="text-gray-600 hover:text-ton-blue transition-colors font-medium">
              Create
            </a>
            <a href="#features" className="text-gray-600 hover:text-ton-blue transition-colors font-medium">
              Features
            </a>
            <a href="https://docs.ton.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-ton-blue transition-colors font-medium">
              Docs
            </a>
          </nav>

          <TonConnectButton />
        </div>
      </div>
    </header>
  )
}
