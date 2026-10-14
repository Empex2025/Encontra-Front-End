"use client";

import { Compass, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/layout/logo";
import { cn } from "@/components/ui/cn";
import { useSession } from "@/hooks/use-session";
import { routes } from "@/lib/routes";

/** Conteúdo fixo da apresentação (3 slides, ordem fixa). */
const SLIDES = [
  {
    icon: Compass,
    title: "Encontre o que precisa, perto de você",
    text: "Produtos, serviços e lugares do seu bairro em um só lugar. Busque e compare as opções antes de sair de casa.",
  },
  {
    icon: Sparkles,
    title: "Descubra o que está acontecendo agora",
    text: "Lives, ofertas, novidades das lojas e preços da sua região: o comércio local ao vivo, no seu ritmo.",
  },
  {
    icon: MessageCircle,
    title: "Fale direto com a loja",
    text: "Sem intermediário: converse pelo chat ou pelo WhatsApp e combine direto com a loja.",
  },
] as const;

/** Boas-vindas: 3 telas curtas antes da primeira entrada. Sem avanço automático; "Pular" sempre disponível. */
export function WelcomeSlides() {
  const { me, isLoading } = useSession();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const Icon = slide.icon;
  const last = i === SLIDES.length - 1;
  const guest = !isLoading && !me;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-md flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-header px-3 py-1.5">
          <Logo />
        </div>
        <Link
          href={routes.home}
          className="inline-flex h-11 items-center px-2 text-sm font-semibold text-link hover:underline"
        >
          Pular
        </Link>
      </div>

      <section
        aria-roledescription="carrossel"
        aria-label="Apresentação"
        className="flex flex-1 flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-surface p-8 text-center shadow-card"
      >
        <span className="flex size-20 items-center justify-center rounded-3xl bg-accent-soft text-accent-text">
          <Icon className="size-10" aria-hidden />
        </span>
        <div aria-live="polite" className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-strong">{slide.title}</h1>
          <p className="text-base text-text-muted">{slide.text}</p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Ir para o slide">
          {SLIDES.map((s, n) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Ir para ${n + 1} de ${SLIDES.length}`}
              aria-current={n === i}
              className="flex h-11 items-center"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all",
                  n === i ? "w-6 bg-primary" : "w-2 bg-surface-3",
                )}
              />
            </button>
          ))}
        </div>
      </section>

      {guest && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-text-2">
          Você está entrando como visitante: dá para buscar, explorar e ver ofertas. Para salvar, seguir e
          conversar, é só criar sua conta.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {i > 0 && (
            <button
              type="button"
              onClick={() => setI(i - 1)}
              className="h-12 rounded-lg border border-border-strong px-5 text-base font-semibold text-text-2 hover:bg-surface-2"
            >
              Voltar
            </button>
          )}
          {last ? (
            <Link
              href={routes.home}
              className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary text-base font-bold text-on-primary hover:bg-primary-hover"
            >
              {guest ? "Começar a explorar" : "Começar"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setI(i + 1)}
              className="h-12 flex-1 rounded-lg bg-primary text-base font-bold text-on-primary hover:bg-primary-hover"
            >
              Próximo
            </button>
          )}
        </div>
        {last && guest && (
          <Link
            href={routes.cadastro}
            className="inline-flex h-11 items-center justify-center text-sm font-semibold text-link hover:underline"
          >
            Criar conta
          </Link>
        )}
      </div>
    </div>
  );
}
