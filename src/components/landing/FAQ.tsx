'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

const items = [
  {
    q: "Como funciona a Batuca?",
    a: "Você descreve a ideia da sua música — estilo, tema, vibe — e nossa IA gera uma faixa completa com beat, letra e arranjo em segundos.",
  },
  {
    q: "Preciso saber tocar algum instrumento?",
    a: "Não. Basta escrever em português o que você imagina. A Batuca cuida de toda a produção musical pra você.",
  },
  {
    q: "Posso usar as músicas comercialmente?",
    a: "Sim. Dependendo do plano escolhido, você tem direitos para usar suas músicas em projetos pessoais ou comerciais.",
  },
  {
    q: "Quais estilos musicais estão disponíveis?",
    a: "Diversos: pop, rock, sertanejo, funk, eletrônico, MPB, hip-hop, lo-fi e muito mais. Você pode misturar e explorar.",
  },
  {
    q: "Quanto tempo leva para gerar uma música?",
    a: "Segundos. A maioria das faixas fica pronta em menos de um minuto, prontas para ouvir, baixar e compartilhar.",
  },
];

const FAQItem = ({ q, a, index }: { q: string; a: string; index: number }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        "md:!opacity-100 md:!translate-y-0",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <AccordionItem value={`item-${index}`} className="border-white/10">
        <AccordionTrigger className="text-white text-base md:text-lg font-medium text-left hover:no-underline">
          {q}
        </AccordionTrigger>
        <AccordionContent className="text-white/70 text-sm md:text-base leading-relaxed">
          {a}
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};

const FAQ = () => {
  const heading = useInView<HTMLDivElement>();

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container max-w-3xl mx-auto px-4">
        <div
          ref={heading.ref}
          className={cn(
            "transition-all duration-700 ease-out",
            "md:!opacity-100 md:!translate-y-0",
            heading.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <h2
            className={cn(
              "text-3xl md:text-5xl font-bold tracking-tight text-center text-white",
              "mb-3 md:mb-4",
            )}
          >
            Perguntas{" "}
            <span
              className={cn(
                "inline-block bg-clip-text text-transparent",
                "bg-[linear-gradient(135deg,#FFB3B5_0%,#FF7D80_50%,#E85A5E_100%)]",
              )}
            >
              frequentes
            </span>
          </h2>
          <p className="text-white/60 text-center mb-10 md:mb-12 text-sm md:text-base">
            Tudo que você precisa saber antes de criar sua primeira música.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
