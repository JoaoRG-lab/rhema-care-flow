import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  title?: string;
  description?: string;
  items: FAQItem[];
};

export function buildFAQJsonLd(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function FAQSection({
  title = 'Perguntas frequentes',
  description = 'Respostas educativas para dúvidas comuns. Elas não substituem avaliação médica individualizada.',
  items,
}: FAQSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="mb-8 max-w-3xl space-y-3">
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.question} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-start gap-2 text-lg">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {item.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
