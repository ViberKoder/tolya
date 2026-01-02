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
  showDeployButton?: boolean;
}

interface TokenSuggestion {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  decimals: number;
  image?: string;
}

// Helper to detect if user wants to deploy
function wantsToDeployToken(input: string): boolean {
  const confirmPhrases = [
    'да', 'yes', 'deploy', 'деплой', 'создай', 'create', 'давай', 'let\'s go', 'отлично', 'perfect',
    'нравится', 'like it', 'это', 'this one', 'хочу', 'want', 'ok', 'ок', 'да,', 'yes,', 'go', 'делай'
  ];
  const lower = input.toLowerCase();
  return confirmPhrases.some(phrase => lower.includes(phrase));
}

// Free AI API call using a public endpoint
async function callFreeAI(prompt: string): Promise<string> {
  try {
    // Using a free AI API - you can replace with any free LLM API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer gsk_placeholder_use_your_own_key`,
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: `You are Cook AI, a friendly token creation assistant for TON blockchain. 
You help users create Jetton tokens by suggesting names, symbols, descriptions, and tokenomics.

ALWAYS respond in the same language the user writes in.
When suggesting a token, ALWAYS include this EXACT format (use these exact markers):

---TOKEN_START---
Name: [Token Name]
Symbol: [SYMBOL]
Description: [Description]
Supply: [number without commas]
---TOKEN_END---

Be creative, friendly, and helpful. If user asks about tokenomics, explain distribution strategies.
If user confirms (says "yes", "да", "давай", "create", etc.), generate a final token suggestion.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateFallbackResponse(prompt);
  } catch (error) {
    console.log('Using fallback AI response');
    return generateFallbackResponse(prompt);
  }
}

// Fallback AI responses when API is unavailable
function generateFallbackResponse(input: string): string {
  const lower = input.toLowerCase();

  // User confirms deployment
  if (wantsToDeployToken(lower)) {
    return `Отлично! Вот финальный токен для деплоя:

---TOKEN_START---
Name: Moon Rocket
Symbol: MOON
Description: Community-driven token with deflationary mechanics and rewards for holders
Supply: 1000000000
---TOKEN_END---

Нажми кнопку "Deploy it" чтобы создать токен! 🚀`;
  }

  // Meme token
  if (lower.includes('meme') || lower.includes('мем') || lower.includes('fun') || lower.includes('смешн')) {
    return `Мемные токены - отличная идея! 🐸 Вот мое предложение:

---TOKEN_START---
Name: Super Pepe
Symbol: SPEPE
Description: The most based meme token on TON. Community-driven with weekly burns
Supply: 420690000000
---TOKEN_END---

Что думаешь? Если нравится, скажи "Да, давай!" или опиши что хочешь изменить.`;
  }

  // DeFi
  if (lower.includes('defi') || lower.includes('yield') || lower.includes('finance') || lower.includes('финанс')) {
    return `DeFi токены сейчас очень актуальны! 💰 Вот моя идея:

---TOKEN_START---
Name: Yield Master
Symbol: YLD
Description: Governance token for decentralized yield optimization protocol on TON
Supply: 100000000
---TOKEN_END---

Нравится? Скажи "создай" или расскажи что изменить!`;
  }

  // Gaming
  if (lower.includes('game') || lower.includes('игр') || lower.includes('play') || lower.includes('nft')) {
    return `Игровые токены имеют огромный потенциал! 🎮 Мое предложение:

---TOKEN_START---
Name: GameVerse Token
Symbol: GVT
Description: In-game currency for the GameVerse metaverse with play-to-earn mechanics
Supply: 5000000000
---TOKEN_END---

Как тебе? Скажи "да" для деплоя или опиши свою идею!`;
  }

  // Tokenomics question
  if (lower.includes('tokenomics') || lower.includes('токеномик') || lower.includes('supply') || lower.includes('распред')) {
    return `Отличный вопрос о токеномике! 📊

**Рекомендуемое распределение:**
• Community: 40-50% (airdrops, rewards)
• Liquidity: 20-30% (DEX pools)
• Team: 10-15% (vested 2-4 years)
• Treasury: 10-20% (development)

**Советы:**
• Lock team tokens минимум на 1 год
• Постепенный unlock (cliff + linear vesting)
• Резерв для будущего развития

Расскажи о своем проекте, и я предложу конкретные цифры!`;
  }

  // Help / no idea
  if (lower.includes('help') || lower.includes('помог') || lower.includes('не знаю') || lower.includes('idea') || lower.includes('идея')) {
    return `Без проблем, помогу! 💡

Популярные категории токенов:
🐕 **Meme** - вирусный потенциал, комьюнити
💰 **DeFi** - yield, governance, utility
🎮 **Gaming** - play-to-earn, in-game currency
🎨 **Creator** - fan tokens, content
🌍 **Utility** - платформенные токены

Просто скажи какая тема тебе ближе или опиши свою идею!`;
  }

  // Default with token suggestion
  const names = ['Alpha Token', 'Nova Coin', 'Star Protocol', 'Thunder Token', 'Wave Finance'];
  const symbols = ['ALPHA', 'NOVA', 'STAR', 'THDR', 'WAVE'];
  const idx = Math.floor(Math.random() * names.length);

  return `Интересная идея! Вот что я придумал:

---TOKEN_START---
Name: ${names[idx]}
Symbol: ${symbols[idx]}
Description: Next-generation token on TON blockchain with innovative utility
Supply: 1000000000
---TOKEN_END---

Нравится? Скажи "да, создай" или расскажи что хочешь изменить!`;
}

// Parse token suggestion from AI response
function parseTokenSuggestion(content: string): TokenSuggestion | null {
  const startMarker = '---TOKEN_START---';
  const endMarker = '---TOKEN_END---';
  
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  
  if (startIdx === -1 || endIdx === -1) return null;
  
  const tokenBlock = content.substring(startIdx + startMarker.length, endIdx);
  
  const nameMatch = tokenBlock.match(/Name:\s*(.+)/i);
  const symbolMatch = tokenBlock.match(/Symbol:\s*(\w+)/i);
  const descMatch = tokenBlock.match(/Description:\s*(.+)/i);
  const supplyMatch = tokenBlock.match(/Supply:\s*([\d,]+)/i);
  
  if (!nameMatch || !symbolMatch) return null;
  
  return {
    name: nameMatch[1].trim(),
    symbol: symbolMatch[1].trim().toUpperCase(),
    description: descMatch ? descMatch[1].trim() : `${nameMatch[1].trim()} token on TON`,
    totalSupply: supplyMatch ? supplyMatch[1].replace(/,/g, '') : '1000000000',
    decimals: 9,
  };
}

// Format response for display (remove markers)
function formatResponseForDisplay(content: string): string {
  return content
    .replace(/---TOKEN_START---/g, '📦 **Token:**')
    .replace(/---TOKEN_END---/g, '');
}

export default function AIPage() {
  const { connected, wallet, sendTransaction, sendMultipleMessages } = useTonConnect();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Привет! 🍗 Я Cook AI - твой помощник в создании токенов!

Я могу помочь с:
• Придумать название и нарратив токена
• Разработать токеномику
• Создать описание
• Предложить стратегии lockup

Просто расскажи о своей идее или напиши "помоги" если не знаешь с чего начать!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [lastSuggestion, setLastSuggestion] = useState<TokenSuggestion | null>(null);
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
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Call AI
      const aiResponse = await callFreeAI(userInput);
      
      // Parse token suggestion
      const suggestion = parseTokenSuggestion(aiResponse);
      if (suggestion) {
        setLastSuggestion(suggestion);
      }

      // Check if user confirms deployment
      const hasLastSuggestion = suggestion !== null || lastSuggestion !== null;
      const showDeploy = wantsToDeployToken(userInput) && hasLastSuggestion;
      const tokenToShow = suggestion || (showDeploy ? lastSuggestion : null);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatResponseForDisplay(aiResponse),
        tokenSuggestion: tokenToShow || undefined,
        showDeployButton: showDeploy || suggestion !== null,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async (suggestion: TokenSuggestion) => {
    if (!connected || !wallet) {
      toast.error('Сначала подключи кошелек');
      return;
    }

    setIsDeploying(true);

    try {
      const tokenData: TokenData = {
        name: suggestion.name,
        symbol: suggestion.symbol,
        description: suggestion.description,
        image: suggestion.image || '',
        decimals: suggestion.decimals,
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
          content: `🎉 **Токен создан!**

**${suggestion.name} (${suggestion.symbol})** теперь на TON!

📋 Адрес: \`${result.address}\`

🔗 [Открыть на TonViewer](https://tonviewer.com/${result.address})

Что дальше:
1. Добавь ликвидность на DeDust или STON.fi
2. Поделись адресом с комьюнити
3. Начни строить! 🚀

Нужна еще помощь?`,
        }]);
      } else {
        throw new Error(result.error || 'Ошибка деплоя');
      }
    } catch (err: any) {
      toast.error(err.message || 'Не удалось создать токен');
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
        <title>Cook AI | Помощник создания токенов</title>
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
              <p className="text-gray-600">Придумаю токен, помогу с токеномикой</p>
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
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i}>{part.slice(2, -2)}</strong>;
                          } else if (part.startsWith('*') && part.endsWith('*')) {
                            return <em key={i}>{part.slice(1, -1)}</em>;
                          } else if (part.startsWith('`') && part.endsWith('`')) {
                            return <code key={i} className="bg-black/10 px-1.5 py-0.5 rounded text-xs font-mono break-all">{part.slice(1, -1)}</code>;
                          } else if (part.match(/\[.*?\]\(.*?\)/)) {
                            const match = part.match(/\[(.*?)\]\((.*?)\)/);
                            if (match) {
                              return <a key={i} href={match[2]} target="_blank" className="text-purple-600 underline">{match[1]}</a>;
                            }
                          }
                          return part;
                        })}
                      </div>
                      
                      {/* Deploy button */}
                      {message.showDeployButton && message.tokenSuggestion && (
                        <button
                          onClick={() => handleDeploy(message.tokenSuggestion!)}
                          disabled={!connected || isDeploying}
                          className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isDeploying ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Создаем...
                            </>
                          ) : !connected ? (
                            '🔗 Подключи кошелек'
                          ) : (
                            <>🚀 Deploy it!</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-1.5">
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
                    placeholder="Опиши свою идею токена..."
                    className="flex-grow px-4 py-3 bg-gray-50 border border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Отправить
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Попробуй: &quot;Хочу создать мем токен&quot; или &quot;Помоги с токеномикой&quot;
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
