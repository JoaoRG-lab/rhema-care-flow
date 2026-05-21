/**
 * AIControlCenter — Página do painel de controle das IAs
 * Rota sugerida: /admin/ai-control
 *
 * Para usar como página real no app, monte este componente
 * e adicione a rota no React Router ou Tanstack Router.
 *
 * O dashboard completo está em: docs/ai-control-center.html
 * (versão standalone para abrir diretamente no browser)
 */
import { useEffect, useRef } from 'react';

export function AIControlCenter() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src="/ai-control-center.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Rhema AI Control Center"
      />
    </div>
  );
}

export default AIControlCenter;
