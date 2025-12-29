'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-ton-dark text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-ton-blue rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Jetton Minter 2.0</h3>
                <p className="text-sm text-gray-400">Create tokens on TON</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4">
              The easiest way to create and deploy Jetton 2.0 tokens on the TON blockchain. 
              Built with the official TON smart contracts and modern web technologies.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://docs.ton.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-ton-blue transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/ton-blockchain/jetton-contract" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-ton-blue transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://ton.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-ton-blue transition-colors">
                  TON Blockchain
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Community</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://t.me/tondev" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-ton-blue transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="https://twitter.com/ton_blockchain" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-ton-blue transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://ton.org/community" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-ton-blue transition-colors">
                  Community
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Jetton Minter 2.0. Built on TON Blockchain.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-ton-blue transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-gray-400 hover:text-ton-blue transition-colors text-sm">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
