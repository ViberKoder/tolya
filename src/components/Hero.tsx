'use client'

export default function Hero() {
  const scrollToCreate = () => {
    document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="section-padding bg-gradient-to-b from-white to-ton-gray">
      <div className="container-custom text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Create Your Own <span className="gradient-text">Jetton</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Launch your token on TON blockchain in minutes. Jetton 2.0 standard with advanced features and full compatibility.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button onClick={scrollToCreate} className="btn-primary text-lg px-8 py-4">
              Create Jetton Now
            </button>
            <a 
              href="https://github.com/ton-blockchain/jetton-contract/tree/jetton-2.0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary text-lg px-8 py-4"
            >
              View on GitHub
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-2xl shadow-lg card-hover">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Fast Deploy</h3>
              <p className="text-gray-600">Deploy your token in under 2 minutes</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg card-hover">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Secure</h3>
              <p className="text-gray-600">Audited smart contracts following best practices</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg card-hover">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Jetton 2.0</h3>
              <p className="text-gray-600">Latest standard with advanced features</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
