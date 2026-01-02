import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTonConnect } from '@/hooks/useTonConnect';
import { TokenData } from '@/pages/index';
import { deployJettonMinter } from '@/utils/deploy';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokenSuggestion?: TokenSuggestion;
}

interface TokenSuggestion {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  narrative: string;
}

// AI Response templates for token creation assistance
const AI_RESPONSES = {
  greeting: `Hey! 🍗 I'm Cook AI, your token creation assistant!

I can help you with:
• Brainstorming token names and narratives
• Designing tokenomics (supply, distribution)
• Creating compelling token descriptions
• Suggesting lockup strategies

Tell me about your token idea, or ask me anything!`,

  noIdea: `No worries! Let me help you brainstorm. Here are some popular token themes:

🎮 **Gaming** - In-game currencies, NFT ecosystems
💰 **DeFi** - Yield tokens, governance tokens
🐕 **Meme** - Community-driven, viral potential
🌍 **Utility** - Platform tokens, service credits
🎨 **Creator** - Fan tokens, content monetization

Which theme interests you? Or describe your project!`,

  tokenomics: `Great question! Here's a solid tokenomics framework:

📊 **Supply Distribution:**
• Team: 10-15% (vested 2-4 years)
• Community: 40-50% (airdrops, rewards)
• Liquidity: 20-30% (DEX pools)
• Treasury: 10-20% (development, partnerships)

💡 **Best Practices:**
• Lock team tokens for at least 1 year
• Gradual unlocks (cliff + linear vesting)
• Reserve tokens for future development

What's your project about? I'll give specific recommendations!`,

  lockups: `Lock-ups are crucial for investor confidence! Here are common strategies:

🔒 **Team Tokens:**
• 12-month cliff, then 24-month linear vesting
• Shows long-term commitment

🔒 **Investor Tokens:**
• 6-month cliff, 18-month vesting
• Prevents immediate dumps

🔒 **Community:**
• Staking rewards for locking
• Governance voting power for locked tokens

Would you like me to suggest a lockup schedule for your token?`,
};

function generateTokenSuggestion(userInput: string): TokenSuggestion | null {
  const input = userInput.toLowerCase();
  
  // Gaming token
  if (input.includes('game') || input.includes('gaming') || input.includes('play')) {
    return {
      name: 'GameVerse Token',
      symbol: 'GVT',
      description: 'The native currency of the GameVerse ecosystem. Used for in-game purchases, rewards, and governance voting.',
      totalSupply: '1000000000',
      narrative: 'GameVerse is building the future of blockchain gaming with play-to-earn mechanics and true digital ownership.',
    };
  }
  
  // Meme token
  if (input.includes('meme') || input.includes('fun') || input.includes('community')) {
    return {
      name: 'Moon Pepe',
      symbol: 'MPEPE',
      description: 'The most based meme token on TON. Community-driven with weekly burns and holder rewards.',
      totalSupply: '420690000000',
      narrative: 'Born from the dankest corners of the internet. MPEPE is for the culture.',
    };
  }
  
  // DeFi token
  if (input.includes('defi') || input.includes('yield') || input.includes('finance')) {
    return {
      name: 'Yield Protocol',
      symbol: 'YLD',
      description: 'Governance and utility token for Yield Protocol. Stake to earn fees and vote on protocol upgrades.',
      totalSupply: '100000000',
      narrative: 'Yield Protocol aims to become the leading DeFi aggregator on TON, offering optimized yields across multiple protocols.',
    };
  }
  
  // DAO/Governance
  if (input.includes('dao') || input.includes('governance') || input.includes('vote')) {
    return {
      name: 'CommunityDAO',
      symbol: 'CDAO',
      description: 'The governance token for CommunityDAO. 1 CDAO = 1 vote on all protocol decisions.',
      totalSupply: '10000000',
      narrative: 'CommunityDAO is a decentralized collective building tools and infrastructure for the TON ecosystem.',
    };
  }
  
  // AI/Tech
  if (input.includes('ai') || input.includes('tech') || input.includes('artificial')) {
    return {
      name: 'Neural Network Token',
      symbol: 'NNT',
      description: 'Powering the decentralized AI revolution. Use NNT to access AI models and earn from contributing compute.',
      totalSupply: '500000000',
      narrative: 'Neural Network is building a decentralized marketplace for AI models and compute resources on TON.',
    };
  }

  return null;
}

function generateAIResponse(userInput: string, messages: Message[]): { content: string; suggestion?: TokenSuggestion } {
  const input = userInput.toLowerCase();
  
  // Check for specific questions
  if (input.includes('tokenomics') || input.includes('supply') || input.includes('distribution')) {
    return { content: AI_RESPONSES.tokenomics };
  }
  
  if (input.includes('lock') || input.includes('vest') || input.includes('unlock')) {
    return { content: AI_RESPONSES.lockups };
  }
  
  if (input.includes('no idea') || input.includes('help me') || input.includes('don\'t know') || input.includes('suggest')) {
    return { content: AI_RESPONSES.noIdea };
  }
  
  // Try to generate a token suggestion
  const suggestion = generateTokenSuggestion(input);
  
  if (suggestion) {
    return {
      content: `Based on what you described, here's a token concept I created for you:

🚀 **${suggestion.name} (${suggestion.symbol})**

📝 *Description:*
${suggestion.description}

💰 *Total Supply:* ${Number(suggestion.totalSupply).toLocaleString()} ${suggestion.symbol}

📖 *Narrative:*
${suggestion.narrative}

**Suggested Tokenomics:**
• Community: 45%
• Liquidity: 25%
• Team: 15% (2-year vest)
• Treasury: 15%

Want me to deploy this token? Click the button below, or tell me what you'd like to change!`,
      suggestion,
    };
  }
  
  // Default response
  return {
    content: `Interesting idea! Let me think about this...

Based on what you shared, I'd recommend focusing on:
1. **Clear utility** - What problem does your token solve?
2. **Strong narrative** - Why should people care?
3. **Fair distribution** - Build community trust

Could you tell me more about:
- What's the main use case?
- Who's your target audience?
- Any specific tokenomics in mind?

I'll create a detailed token concept once I understand better!`,
  };
}

export default function AIPage() {
  const { connected, wallet, sendTransaction, sendMultipleMessages } = useTonConnect();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: AI_RESPONSES.greeting,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateAIResponse(input, messages);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      tokenSuggestion: response.suggestion,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleDeploy = async (suggestion: TokenSuggestion) => {
    if (!connected || !wallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);

    try {
      const tokenData: TokenData = {
        name: suggestion.name,
        symbol: suggestion.symbol,
        description: suggestion.description,
        image: '',
        decimals: 9,
        totalSupply: suggestion.totalSupply,
        mintable: true,
      };

      const result = await deployJettonMinter(
        tokenData,
        wallet,
        sendTransaction,
        sendMultipleMessages
      );

      if (result.success && result.address) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🎉 **Token deployed successfully!**

Your **${suggestion.name} (${suggestion.symbol})** is now live on TON!

📋 **Contract Address:**
\`${result.address}\`

🔗 [View on TonViewer](https://tonviewer.com/${result.address})

Next steps:
1. Add liquidity on DeDust or STON.fi
2. Share with your community
3. Build and grow!

Need help with anything else?`,
        }]);
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to deploy token');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Head>
        <title>AI Chat | Cook - Token Creation Assistant</title>
        <link rel="icon" href="https://em-content.zobj.net/source/telegram/386/robot_1f916.webp" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-300/15 to-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <Header />

        <main className="flex-grow relative z-10 pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-4 h-full flex flex-col">
            {/* Header */}
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                <span className="text-3xl">🤖</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Cook <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="text-gray-600">Your token creation assistant</p>
            </div>

            {/* Chat Container */}
            <div className="flex-grow bg-white rounded-2xl border border-purple-200 shadow-lg overflow-hidden flex flex-col" style={{ minHeight: '500px', maxHeight: 'calc(100vh - 300px)' }}>
              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i}>{part.slice(2, -2)}</strong>;
                          } else if (part.startsWith('*') && part.endsWith('*')) {
                            return <em key={i}>{part.slice(1, -1)}</em>;
                          } else if (part.startsWith('`') && part.endsWith('`')) {
                            return <code key={i} className="bg-black/10 px-1 rounded text-xs">{part.slice(1, -1)}</code>;
                          }
                          return part;
                        })}
                      </div>
                      
                      {/* Deploy button for token suggestions */}
                      {message.tokenSuggestion && (
                        <button
                          onClick={() => handleDeploy(message.tokenSuggestion!)}
                          disabled={!connected || isDeploying}
                          className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isDeploying ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Deploying...
                            </span>
                          ) : !connected ? (
                            'Connect Wallet to Deploy'
                          ) : (
                            `🚀 Deploy ${message.tokenSuggestion.symbol}`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-purple-100 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your token idea..."
                    className="flex-grow px-4 py-3 bg-gray-50 border border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Try: &quot;I want to create a meme token&quot; or &quot;Help me with tokenomics&quot;
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
