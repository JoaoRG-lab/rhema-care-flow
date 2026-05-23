import { AIIntegrationPanel } from '@/components/ai/AIIntegrationPanel';

export default function AIIntegrationPage() {
  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-800">Painel Integrativo de IA</h1>
        <p className="text-sm text-gray-500">
          Perplexity · Codex · ChatGPT · Grok · Gemini — ecossistema multi-agente
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AIIntegrationPanel />
      </div>
    </div>
  );
}
