import { useState } from 'react';
import { Bot, MessageCircle, X } from 'lucide-react';

export function AISiteAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-teal-700 p-4 text-white shadow-xl ring-4 ring-teal-700/20 transition-transform hover:scale-105 hover:bg-teal-800"
        aria-label="Abrir assistente"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between bg-teal-700 p-4 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-teal-200" />
          <div>
            <p className="text-sm font-semibold leading-none">Assistente Reumatismos</p>
            <p className="mt-1 text-xs text-teal-100">Modo leitura seguro</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-teal-100 transition-colors hover:text-white"
          aria-label="Fechar assistente"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 p-4 text-sm text-slate-700 dark:text-slate-200">
        <p>O assistente interativo esta temporariamente pausado.</p>
        <p>Enquanto isso, use os guias publicos do site para leitura e navegacao.</p>
      </div>
    </div>
  );
}
