'use client'

import { useState, FormEvent } from 'react'
import { useTonConnect } from '@/hooks/useTonConnect'
import { useJettonDeploy } from '@/hooks/useJettonDeploy'
import { validateJettonForm, formatValidationErrors } from '@/lib/validation'
import toast from 'react-hot-toast'
import DeploymentStatus from './DeploymentStatus'

interface JettonFormData {
  name: string
  symbol: string
  decimals: number
  description: string
  imageUrl: string
  totalSupply: string
  mintable: boolean
}

export default function MinterForm() {
  const { connected, address } = useTonConnect()
  const { deploy, isLoading, status, error, contractAddress } = useJettonDeploy()
  
  const [formData, setFormData] = useState<JettonFormData>({
    name: '',
    symbol: '',
    decimals: 9,
    description: '',
    imageUrl: '',
    totalSupply: '1000000',
    mintable: true,
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!connected) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate form
    const validationErrors = validateJettonForm(formData)
    if (validationErrors.length > 0) {
      toast.error(formatValidationErrors(validationErrors))
      return
    }

    try {
      await deploy(formData)
      
      // Reset form on success
      setFormData({
        name: '',
        symbol: '',
        decimals: 9,
        description: '',
        imageUrl: '',
        totalSupply: '1000000',
        mintable: true,
      })
    } catch (error) {
      console.error('Deployment error:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <>
      <DeploymentStatus 
        status={status} 
        error={error} 
        contractAddress={contractAddress}
      />
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <h2 className="text-4xl font-bold mb-2 text-center">Create Your Jetton</h2>
        <p className="text-gray-600 text-center mb-8">Fill in the details to deploy your Jetton 2.0 token</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Token Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., My Awesome Token"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Token Symbol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g., MAT"
                className="input-field"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your token..."
              className="input-field min-h-[100px] resize-y"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.png"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: URL to your token's logo image</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Total Supply
              </label>
              <input
                type="number"
                name="totalSupply"
                value={formData.totalSupply}
                onChange={handleChange}
                placeholder="1000000"
                className="input-field"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Initial supply (can mint more if mintable)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Decimals
              </label>
              <select
                name="decimals"
                value={formData.decimals}
                onChange={handleChange}
                className="input-field"
              >
                {[0, 3, 6, 9, 12, 18].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-ton-gray rounded-xl">
            <input
              type="checkbox"
              id="mintable"
              name="mintable"
              checked={formData.mintable}
              onChange={handleChange}
              className="w-5 h-5 text-ton-blue rounded focus:ring-ton-blue"
            />
            <label htmlFor="mintable" className="text-sm font-medium text-gray-700 cursor-pointer">
              Allow minting additional tokens after deployment
            </label>
          </div>

          {!connected ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Connect your wallet to deploy</p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deploying...
                </span>
              ) : (
                'Deploy Jetton'
              )}
            </button>
          )}

          <div className="bg-blue-50 border-l-4 border-ton-blue p-4 rounded">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> You'll need approximately 0.5 TON for deployment. The remaining TON will be returned after deployment.
            </p>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
