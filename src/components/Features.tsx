'use client'

export default function Features() {
  const features = [
    {
      icon: '💎',
      title: 'Jetton 2.0 Standard',
      description: 'Fully compatible with the latest Jetton 2.0 standard, ensuring maximum compatibility and features.'
    },
    {
      icon: '🛡️',
      title: 'Secure & Audited',
      description: 'Built using official TON smart contracts that have been thoroughly tested and audited.'
    },
    {
      icon: '⚙️',
      title: 'Customizable',
      description: 'Configure name, symbol, decimals, supply, and mintability according to your needs.'
    },
    {
      icon: '💰',
      title: 'Low Fees',
      description: 'Deploy on TON blockchain with minimal gas fees compared to other networks.'
    },
    {
      icon: '📱',
      title: 'Easy Integration',
      description: 'Connect with TON Connect for seamless wallet integration and deployment.'
    },
    {
      icon: '🔄',
      title: 'Mintable Option',
      description: 'Choose whether to allow minting additional tokens after deployment.'
    },
  ]

  return (
    <section id="features" className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="gradient-text">Jetton Minter 2.0</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built on the latest Jetton standard with all the features you need to launch your token successfully
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg card-hover border border-gray-100"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-ton-blue to-blue-600 rounded-3xl p-8 md:p-12 text-white text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Launch Your Token?</h3>
          <p className="text-xl mb-8 opacity-90">Join thousands of projects building on TON</p>
          <button 
            onClick={() => document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-ton-blue font-bold py-4 px-8 rounded-xl hover:shadow-2xl transition-all duration-300 text-lg"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  )
}
