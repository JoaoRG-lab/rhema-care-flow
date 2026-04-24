import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

// Tipagem para as mensagens do chat
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AISiteAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual do UHS Health OS. Como posso ajudar você a conhecer mais sobre nossas especialidades hoje?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Aqui o sistema invocará a Edge Function 'ai-assistant' no Supabase
      // Exemplo usando fetch (substitua pela sua função invokeEdgeFn do Supabase)
      /*
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: userMessage.content, context: 'public_site' }
      });
      */
      
      // Simulando tempo de resposta da IA para o Frontend
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Nossa plataforma oferece suporte a 14 especialidades clínicas, incluindo Reumatologia, Pediatria e Obstetrícia, com calculadoras validadas e integração blockchain. Deseja saber sobre alguma especialidade específica?',
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Erro ao chamar a IA:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Janela do Chat */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col mb-4 transition-all duration-300 ease-in-out">
          {/* Header do Widget */}
          <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teal-400" />
              <span className="font-semibold text-sm">UHS Site Agent</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="p-4 h-80 overflow-y-auto flex flex-col gap-3 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white self-end rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 self-start rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start rounded-lg rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>

          {/* Input de Texto */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça uma pergunta..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-slate-200"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full p-2 transition-colors flex items-center justify-center w-10 h-10"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Botão Flutuante (Floating Action Button) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-full shadow-xl hover:scale-105 transition-transform duration-200 flex items-center justify-center ring-4 ring-slate-900/10 dark:ring-white/10"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
