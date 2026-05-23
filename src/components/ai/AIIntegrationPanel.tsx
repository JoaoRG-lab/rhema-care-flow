import { useState, useRef, useEffect } from 'react';

// ── Tipos ────────────────────────────────────────────────────────────────────
type AgentId = 'perplexity' | 'codex' | 'chatgpt' | 'grok' | 'gemini';

interface Agent {
  id: AgentId;
  name: string;
  label: string;
  role: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  apiEndpoint?: string;
  context: string;
}

interface Message {
  id: string;
  agentId: AgentId;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'ok' | 'error';
}

// ── Config dos agentes ───────────────────────────────────────────────────────
const AGENTS: Agent[] = [
  {
    id: 'perplexity',
    name: 'Perplexity',
    label: 'Supervisor TMR',
    role: 'Supervisão de builds, monitoramento GitHub, busca em tempo real',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    icon: '🔍',
    context: 'supervisor_tmr',
  },
  {
    id: 'codex',
    name: 'Codex',
    label: 'Engenheiro',
    role: 'Codificação autônoma, refatoração, correção de bugs no repositório',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    icon: '⚙️',
    context: 'engenheiro_codigo',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    label: 'Agente Vercel',
    role: 'Deploy Vercel, variáveis de ambiente, Edge Functions Supabase',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-300',
    icon: '🚀',
    context: 'agente_vercel',
  },
  {
    id: 'grok',
    name: 'Grok',
    label: 'Auditor Segurança',
    role: 'Auditoria de secrets, revisão de segurança, análise de vulnerabilidades',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    icon: '🛡️',
    context: 'auditor_seguranca',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    label: 'Analista Clínico',
    role: 'Análise multimodal de imagens médicas, USG reumatológica, laudos assistidos por IA',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    icon: '🔬',
    context: 'analista_clinico',
  },
];

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
      }`}
    />
  );
}

// ── Card do agente ────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  selected,
  onClick,
  msgCount,
}: {
  agent: Agent;
  selected: boolean;
  onClick: () => void;
  msgCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? `${agent.border} ${agent.bg} shadow-md`
          : 'border-transparent bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{agent.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${agent.color} truncate`}>
            {agent.name}
          </div>
          <div className="text-xs text-gray-500 truncate">{agent.label}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusDot online={true} />
          {msgCount > 0 && (
            <span className="text-xs bg-teal-100 text-teal-700 rounded-full px-1.5 py-0.5 font-medium">
              {msgCount}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1.5 leading-tight line-clamp-2">
        {agent.role}
      </p>
    </button>
  );
}

// ── Balão de mensagem ─────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  agent,
}: {
  msg: Message;
  agent: Agent;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full ${agent.bg} ${agent.border} border flex items-center justify-center text-sm`}
        >
          {agent.icon}
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-teal-600 text-white rounded-tr-sm'
            : `${agent.bg} ${agent.color} border ${agent.border} rounded-tl-sm`
        }`}
      >
        {!isUser && (
          <div className="font-semibold text-xs mb-1 opacity-70">
            {agent.name} · {agent.label}
          </div>
        )}
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <div
          className={`text-[10px] mt-1 text-right opacity-50 ${
            isUser ? 'text-teal-100' : ''
          }`}
        >
          {msg.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {msg.status === 'sending' && ' · enviando…'}
          {msg.status === 'error' && ' · erro'}
        </div>
      </div>
    </div>
  );
}

// ── Painel principal ──────────────────────────────────────────────────────────
export function AIIntegrationPanel() {
  const [activeAgent, setActiveAgent] = useState<AgentId>('perplexity');
  const [messages, setMessages] = useState<Record<AgentId, Message[]>>({
    perplexity: [],
    codex: [],
    chatgpt: [],
    grok: [],
    gemini: [],
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agent = AGENTS.find((a) => a.id === activeAgent)!;
  const activeMessages = messages[activeAgent];

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  async function sendToAgent(targetId: AgentId, text: string) {
    const targetAgent = AGENTS.find((a) => a.id === targetId)!;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const msgId = crypto.randomUUID();
    const userMsg: Message = {
      id: msgId,
      agentId: targetId,
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'ok',
    };

    const pendingId = crypto.randomUUID();
    const pendingMsg: Message = {
      id: pendingId,
      agentId: targetId,
      role: 'assistant',
      content: '…',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => ({
      ...prev,
      [targetId]: [...prev[targetId], userMsg, pendingMsg],
    }));

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          message: text,
          context: targetAgent.context,
          agent: targetId,
        }),
      });

      const data = await res.json();
      const reply = data?.reply ?? data?.message ?? 'Sem resposta recebida.';

      setMessages((prev) => ({
        ...prev,
        [targetId]: prev[targetId].map((m) =>
          m.id === pendingId
            ? { ...m, content: reply, status: 'ok' }
            : m
        ),
      }));
    } catch {
      setMessages((prev) => ({
        ...prev,
        [targetId]: prev[targetId].map((m) =>
          m.id === pendingId
            ? {
                ...m,
                content: '❌ Erro ao conectar com o agente. Verifique a Edge Function.',
                status: 'error',
              }
            : m
        ),
      }));
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    if (broadcastMode) {
      await Promise.all(AGENTS.map((a) => sendToAgent(a.id, text)));
    } else {
      await sendToAgent(activeAgent, text);
    }

    setLoading(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalMsgs = Object.values(messages).reduce(
    (acc, arr) => acc + arr.filter((m) => m.role === 'assistant').length,
    0
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Header sidebar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="font-bold text-gray-800 text-sm leading-tight">
                Ecossistema IA
              </h2>
              <p className="text-xs text-gray-400">
                {totalMsgs} resposta{totalMsgs !== 1 ? 's' : ''} · 5 agentes
              </p>
            </div>
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {AGENTS.map((a) => (
            <AgentCard
              key={a.id}
              agent={a}
              selected={activeAgent === a.id}
              onClick={() => setActiveAgent(a.id)}
              msgCount={messages[a.id].filter((m) => m.role === 'assistant').length}
            />
          ))}
        </div>

        {/* Broadcast toggle */}
        <div className="p-3 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setBroadcastMode((b) => !b)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                broadcastMode ? 'bg-teal-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  broadcastMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">
              Broadcast todos
            </span>
          </label>
          <p className="text-[10px] text-gray-400 mt-1 leading-tight">
            Envia a mesma mensagem para todos os agentes simultaneamente
          </p>
        </div>
      </aside>

      {/* ── Área principal ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header do agente ativo */}
        <header
          className={`flex items-center gap-3 px-5 py-3 border-b border-gray-200 ${agent.bg}`}
        >
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <div className={`font-bold text-base ${agent.color}`}>
              {agent.name}
              <span className="ml-2 text-xs font-normal opacity-60">
                {agent.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">{agent.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <StatusDot online={true} />
            <span className="text-xs text-gray-500">online</span>
          </div>
        </header>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-gray-400">
              <span className="text-5xl opacity-40">{agent.icon}</span>
              <div>
                <p className="font-medium text-gray-500">
                  {agent.name} pronto para interagir
                </p>
                <p className="text-sm mt-1">{agent.role}</p>
              </div>
              {broadcastMode && (
                <div className="mt-2 text-xs bg-teal-50 border border-teal-200 text-teal-700 rounded-lg px-3 py-2">
                  📡 Modo broadcast ativo — sua mensagem será enviada para todos os 5 agentes
                </div>
              )}
            </div>
          ) : (
            activeMessages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} agent={agent} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-200 bg-white">
          {broadcastMode && (
            <div className="mb-2 text-xs bg-teal-50 border border-teal-200 text-teal-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <span>📡</span>
              <span>
                Broadcast ativo — enviará para todos os agentes
              </span>
            </div>
          )}
          <div
            className={`flex items-end gap-2 rounded-xl border-2 transition-colors ${
              loading ? 'border-gray-200 bg-gray-50' : `${agent.border} bg-white`
            } px-3 py-2`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={`Mensagem para ${broadcastMode ? 'todos os agentes' : agent.name}…`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-h-[24px] max-h-[120px]"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                loading || !input.trim()
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95'
              }`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 19-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </main>
    </div>
  );
}
