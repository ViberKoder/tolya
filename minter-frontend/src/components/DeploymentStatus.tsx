import { DeploymentStep } from '@/pages';
import Link from 'next/link';

interface DeploymentStatusProps {
  step: DeploymentStep;
  deployedAddress: string;
  onReset: () => void;
}

const steps = [
  { id: 'preparing', label: 'Preparing Contract', description: 'Building your token contract...' },
  { id: 'deploying', label: 'Deploying', description: 'Confirm transaction in your wallet...' },
  { id: 'minting', label: 'Minting', description: 'Creating initial token supply...' },
  { id: 'completed', label: 'Completed', description: 'Your token is ready!' },
];

export default function DeploymentStatus({ step, deployedAddress, onReset }: DeploymentStatusProps) {
  const currentStepIndex = steps.findIndex(s => s.id === step);

  if (step === 'completed') {
    return (
      <div className="card text-center">
        {/* Success Animation */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Token Created Successfully!</h2>
        <p className="text-gray-400 mb-8">Your Jetton 2.0 token has been deployed to the TON blockchain.</p>

        {/* Contract Address */}
        <div className="p-4 bg-ton-gray-light rounded-xl mb-6">
          <p className="text-sm text-gray-400 mb-2">Contract Address</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-ton-blue font-mono text-sm break-all">{deployedAddress}</code>
            <button
              onClick={() => navigator.clipboard.writeText(deployedAddress)}
              className="p-2 hover:bg-ton-gray rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`https://tonscan.org/address/${deployedAddress}`}
            target="_blank"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Explorer
          </Link>
          <button onClick={onReset} className="btn-primary flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Another Token
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-ton-blue/10 border border-ton-blue/20 rounded-xl">
          <div className="flex items-start gap-3 text-left">
            <svg className="w-5 h-5 text-ton-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-ton-blue mb-1">What&apos;s Next?</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Add your token to DEXes like DeDust or STON.fi</li>
                <li>• Share your token contract address with your community</li>
                <li>• Token will appear in wallets automatically when received</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white text-center mb-8">Deploying Your Token</h2>

      {/* Progress Steps */}
      <div className="max-w-md mx-auto mb-8">
        {steps.slice(0, -1).map((s, index) => {
          const isActive = s.id === step;
          const isCompleted = currentStepIndex > index;

          return (
            <div key={s.id} className="flex items-start mb-6 last:mb-0">
              {/* Step Indicator */}
              <div className="flex flex-col items-center mr-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-ton-blue text-white animate-pulse'
                      : 'bg-ton-gray-light text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 2 && (
                  <div
                    className={`w-0.5 h-12 mt-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-ton-gray-light'
                    }`}
                  />
                )}
              </div>

              {/* Step Content */}
              <div className="pt-2">
                <h3
                  className={`font-semibold ${
                    isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </h3>
                <p className="text-sm text-gray-400">{s.description}</p>

                {/* Loading indicator for active step */}
                {isActive && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="spinner" />
                    <span className="text-sm text-ton-blue">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Button */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cancel deployment
        </button>
      </div>
    </div>
  );
}
