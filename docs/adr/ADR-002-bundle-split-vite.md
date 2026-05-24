# ADR-002: Otimização de Bundle Vite com manualChunks

**Data:** 2026-05-24  
**Status:** Implementado  
**Autores:** Perplexity AI (SQA parceiro)  
**Relacionado:** ADR-001 seção Performance

---

## Contexto

O build do Vite gerava chunks acima de 500kb (limite de warning configurado). Em um CDSS médico, performance de carregamento é crítica — um médico em atendimento não pode esperar 3s para carregar uma calculadora.

Problemas identificados:
- Vendor bundle monolítico misturando React, Radix UI, Solana SDK e bibliotecas de PDF
- O SDK da Solana (`@solana/web3.js`) é pesado (~800kb minificado) e só é usado no módulo URV Privacy
- Bibliotecas de PDF (`jspdf`, `html2canvas`) só são necessárias ao exportar

---

## Decisão

Aplicar `build.rollupOptions.output.manualChunks` no `vite.config.ts` para separar:

| Chunk | Conteúdo | Carregamento |
|---|---|---|
| `vendor-react` | react, react-dom, react-router-dom | Eager (sempre) |
| `vendor-ui` | @radix-ui/*, @shadcn, class-variance-authority | Eager |
| `vendor-query` | @tanstack/react-query | Eager |
| `vendor-supabase` | @supabase/supabase-js | Eager |
| `vendor-blockchain` | @solana/web3.js, @coral-xyz/anchor | **Lazy** (só URV Privacy) |
| `vendor-pdf` | jspdf, html2canvas | **Lazy** (só ao exportar) |
| `calculators` | src/lib/calculators*.ts, src/lib/clinicalScores.ts | Eager (core clínico) |

O `vite.config.ts` foi atualizado conforme abaixo.

---

## Consequências

### Positivas
- Elimina warning de chunk >500kb no CI
- Módulo blockchain (~800kb) carregado apenas quando médico usa URV Privacy
- First Contentful Paint e LCP melhorados para o fluxo de consulta
- Calculadoras sempre disponíveis imediatamente (chunk `calculators` eager)

### Negativas
- Mais chunks para monitorar no bundle analyzer
- Lazy loading da Solana requer `React.lazy()` + `Suspense` no componente URV (pendente)

---

## Referências
- [Vite manualChunks docs](https://vitejs.dev/config/build-options#build-rollupoptions)
- [Bundle Analyzer: vite-bundle-visualizer](https://github.com/KusStar/vite-bundle-visualizer)
