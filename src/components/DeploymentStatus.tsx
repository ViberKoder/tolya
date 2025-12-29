'use client'

interface DeploymentStatusProps {
  status: 'idle' | 'preparing' | 'deploying' | 'minting' | 'success' | 'error'
  error?: string
  contractAddress?: string
}

export default function DeploymentStatus({ status, error, contractAddress }: DeploymentStatusProps) {
  if (status === 'idle') return null

  const steps = [
    { id: 'preparing', label: 'Preparing contract', icon: '📝' },
    { id: 'deploying', label: 'Deploying to blockchain', icon: '🚀' },
    { id: 'minting', label: 'Minting initial supply', icon: '💎' },
    { id: 'success', label: 'Success!', icon: '✅' },
  ]

  const getStepStatus = (stepId: string) => {
    if (status === 'error') return 'error'
    if (status === stepId) return 'active'
    
    const currentIndex = steps.findIndex(s => s.id === status)
    const stepIndex = steps.findIndex(s => s.id === stepId)
    
    if (stepIndex < currentIndex) return 'completed'
    return 'pending'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <h3 className="text-2xl font-bold mb-6 text-center">
          {status === 'error' ? '❌ Deployment Failed' : 
           status === 'success' ? '🎉 Jetton Deployed!' : 
           '⏳ Deploying Your Jetton...'}
        </h3>

        {status !== 'error' && status !== 'success' && (
          <div className="space-y-4 mb-6">
            {steps.map((step) => {
              const stepStatus = getStepStatus(step.id)
              return (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
                    ${stepStatus === 'completed' ? 'bg-green-100' : 
                      stepStatus === 'active' ? 'bg-ton-blue text-white animate-pulse' : 
                      'bg-gray-100'}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${stepStatus === 'active' ? 'text-ton-blue' : 'text-gray-700'}`}>
                      {step.label}
                    </p>
                  </div>
                  {stepStatus === 'active' && (
                    <div className="animate-spin w-5 h-5 border-2 border-ton-blue border-t-transparent rounded-full"></div>
                  )}
                  {stepStatus === 'completed' && (
                    <div className="text-green-500 text-xl">✓</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {status === 'success' && contractAddress && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
            <p className="text-sm font-semibold text-gray-700 mb-2">Contract Address:</p>
            <code className="text-xs bg-white p-2 rounded block break-all">
              {contractAddress}
            </code>
          </div>
        )}

        {(status === 'error' || status === 'success') && (
          <button
            onClick={() => window.location.reload()}
            className="w-full btn-primary"
          >
            {status === 'error' ? 'Try Again' : 'Create Another Jetton'}
          </button>
        )}

        {status === 'success' && contractAddress && (
          <a
            href={`https://tonscan.org/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center btn-secondary mt-3"
          >
            View on TON Explorer
          </a>
        )}
      </div>
    </div>
  )
}
