'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'What is a Jetton?',
    answer: 'A Jetton is a token standard on TON blockchain, similar to ERC-20 on Ethereum. Jettons allow you to create fungible tokens with customizable properties like name, symbol, and supply.'
  },
  {
    question: 'What is Jetton 2.0?',
    answer: 'Jetton 2.0 is the latest version of the Jetton standard with improved features including better gas efficiency, enhanced burn notifications, and better compatibility with TON ecosystem tools.'
  },
  {
    question: 'How much does it cost to create a Jetton?',
    answer: 'Creating a Jetton costs approximately 0.5-0.6 TON. This includes deployment of the minter contract and initial token minting. Any excess TON is returned to your wallet.'
  },
  {
    question: 'What happens if I make my token mintable?',
    answer: 'If you enable the mintable option, you (as the admin) will be able to create additional tokens after deployment. If disabled, the total supply will be fixed and no more tokens can be created.'
  },
  {
    question: 'Can I change the token information after deployment?',
    answer: 'Yes! As the admin, you can update the token metadata (name, description, image) after deployment. However, you cannot change the symbol or decimals.'
  },
  {
    question: 'What are decimals?',
    answer: 'Decimals determine how divisible your token is. For example, with 9 decimals, 1 token = 1,000,000,000 smallest units. Most tokens use 9 decimals (like TON) or 18 decimals (like ETH).'
  },
  {
    question: 'Is this secure?',
    answer: 'Yes! The smart contracts are based on official TON blockchain implementations and follow the Jetton 2.0 standard. However, always test on testnet first before deploying on mainnet.'
  },
  {
    question: 'Can I transfer the admin role?',
    answer: 'Yes, you can transfer the admin role to another address using the change_admin operation. This is useful if you want to transfer control or implement multi-sig governance.'
  },
  {
    question: 'What wallets are supported?',
    answer: 'Any wallet that supports TON Connect can be used, including Tonkeeper, TON Hub, MyTonWallet, OpenMask, and others.'
  },
  {
    question: 'Can users burn tokens?',
    answer: 'Yes, Jetton 2.0 includes built-in burn functionality. Any token holder can burn their own tokens, which reduces the total supply.'
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about creating Jettons on TON
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-ton-gray rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold text-lg pr-4">{faq.question}</span>
                <span className={`text-2xl transform transition-transform duration-300 flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  ↓
                </span>
              </button>
              
              <div className={`transition-all duration-300 overflow-hidden ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}>
                <div className="px-6 pb-5 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="https://docs.ton.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Read TON Docs
            </a>
            <a 
              href="https://t.me/tondev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Join TON Dev Chat
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
