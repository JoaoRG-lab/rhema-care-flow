import { clinicalCriteriaCards, type CriteriaDomain } from '../../lib/clinicalCriteria';

interface ClinicalCriteriaCardsProps {
  domain?: CriteriaDomain;
  compact?: boolean;
}

function SectionList({ title, items, tone }: { title: string; items: string[]; tone: 'neutral' | 'positive' | 'danger' | 'action' }) {
  const toneClass = {
    neutral: 'bg-gray-50 text-gray-700 border-gray-100',
    positive: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    danger: 'bg-rose-50 text-rose-800 border-rose-100',
    action: 'bg-teal-50 text-teal-800 border-teal-100',
  }[tone];

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide opacity-80">{title}</p>
      <ul className="space-y-1 text-xs leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ClinicalCriteriaCards({ domain, compact = false }: ClinicalCriteriaCardsProps) {
  const cards = domain ? clinicalCriteriaCards.filter((card) => card.domain === domain) : clinicalCriteriaCards;

  if (!cards.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
        Nenhum card de critério clínico cadastrado para este domínio.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {cards.map((card) => (
        <article key={card.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">{card.domain} · {card.purpose}</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">{card.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{card.summary}</p>
            </div>
          </div>

          <div className={`grid gap-3 ${compact ? 'md:grid-cols-2' : 'xl:grid-cols-4'}`}>
            <SectionList title="Contexto obrigatório" items={card.requiredContext} tone="neutral" />
            <SectionList title="Sinais a favor" items={card.positiveSignals} tone="positive" />
            <SectionList title="Alertas / diferenciais" items={card.redFlags} tone="danger" />
            <SectionList title="Próximos passos" items={card.nextSteps} tone="action" />
          </div>

          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
            {card.caveat}
          </p>
        </article>
      ))}
    </section>
  );
}
