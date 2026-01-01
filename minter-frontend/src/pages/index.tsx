import { useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TokenForm from '@/components/TokenForm';
import DeploymentStatus from '@/components/DeploymentStatus';
import Features from '@/components/Features';
import { useTonConnect } from '@/hooks/useTonConnect';

export interface TokenData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
  totalSupply: string;
  mintable: boolean;
  metadataUrl?: string; // URL to hosted JSON metadata
}

export type DeploymentStep = 'idle' | 'preparing' | 'deploying' | 'minting' | 'completed' | 'error';

export default function Home() {
  const { connected, wallet, sendTransaction, sendMultipleMessages } = useTonConnect();
  const [step, setStep] = useState<DeploymentStep>('idle');
  const [deployedAddress, setDeployedAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDeploy = async (tokenData: TokenData) => {
    if (!connected || !wallet) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setStep('preparing');
      setError('');
      
      // Import deployment logic
      const { deployJettonMinter } = await import('@/utils/deploy');
      
      setStep('deploying');
      
      const result = await deployJettonMinter(
        tokenData,
        wallet,
        sendTransaction,
        sendMultipleMessages
      );
      
      if (result.success && result.address) {
        setDeployedAddress(result.address);
        setStep('completed');
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      setError(err.message || 'Failed to deploy token');
      setStep('error');
    }
  };

  const handleReset = () => {
    setStep('idle');
    setDeployedAddress('');
    setError('');
  };

  return (
    <>
      <Head>
        <title>Cook | Create Jetton 2.0 on TON</title>
        <meta name="description" content="Deploy your own fungible token on The Open Network with the latest Jetton 2.0 standard." />
        <link rel="icon" href="https://em-content.zobj.net/source/telegram/386/poultry-leg_1f357.webp" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cook-orange/5 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-ton-blue/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cook-orange/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        <Header />

        <main className="flex-grow relative z-10">
          {/* Hero Section */}
          <section className="pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 bg-cook-bg-secondary rounded-full border border-cook-border mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                <span className="text-sm text-cook-text-secondary">Jetton 2.0 Standard</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-cook-text">
                Cook your{' '}
                <span className="gradient-text">Jetton 2.0</span>
                <br />on TON
              </h1>
              
              <p className="text-lg md:text-xl text-cook-text-secondary max-w-2xl mx-auto mb-8">
                Deploy your own fungible token on The Open Network with the latest 
                Jetton 2.0 standard. Up to 3 times faster than Jetton 1.0.
              </p>

              {!connected && (
                <div className="inline-flex items-center px-6 py-3 bg-cook-bg-secondary rounded-xl border border-cook-border">
                  <svg className="w-5 h-5 mr-2 text-ton-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-cook-text-secondary">Connect your wallet to get started</span>
                </div>
              )}
            </div>
          </section>

          {/* Main Content */}
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              {step === 'idle' || step === 'error' ? (
                <TokenForm 
                  onDeploy={handleDeploy} 
                  isConnected={connected}
                  error={error}
                />
              ) : (
                <DeploymentStatus 
                  step={step}
                  deployedAddress={deployedAddress}
                  onReset={handleReset}
                />
              )}
            </div>
          </section>

          {/* Features Section */}
          <Features />
        </main>

        <Footer />
      </div>
    </>
  );
}
