"use client";

import { MapPin, MessageCircleMore, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { useSession } from "@/hooks/use-session";
import { safeReturnTo } from "@/lib/domain/validation";
import { routes } from "@/lib/routes";

import { AuthBackdrop, AuthPanel, linkCls, outlineBtnCls, primaryBtnCls } from "./auth-card";

/** Conteúdo fixo da apresentação (artboard BoasVindas: 3 slides, ordem fixa). */
const SLIDES: readonly { icon: LucideIcon; title: string; text: string; bg: string }[] = [
  {
    icon: MapPin,
    title: "Encontre o que precisa, perto de você",
    text: "Produtos, serviços e lugares do seu bairro em um só lugar. Busque, veja no mapa e compare preços antes de sair de casa.",
    bg: "bg-navy",
  },
  {
    icon: Sparkles,
    title: "Descubra o que está acontecendo agora",
    text: "Lives, ofertas do dia, lojas novas e o preço da gasolina caindo — o comércio local ao vivo, no seu ritmo.",
    bg: "bg-accent-text",
  },
  {
    icon: MessageCircleMore,
    title: "Fale direto com a loja",
    text: "Sem intermediário: converse pelo chat ou WhatsApp, combine retirada e pagamento e trace a rota até lá.",
    bg: "bg-kind-service",
  },
];

/** Boas-vindas: 3 telas curtas antes da primeira entrada. Sem avanço automático; "Pular" sempre disponível. */
export function WelcomeSlides() {
  const { me, isLoading } = useSession();
  const params = useSearchParams();
  const destination = safeReturnTo(params.get("voltar"), routes.home);
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const Icon = slide.icon;
  const last = i === SLIDES.length - 1;
  const guest = !isLoading && !me;

  return (
    <AuthBackdrop tone="navy">
      <AuthPanel width={588} offset="welcome" label="Boas-vindas">
        <div className="flex items-center justify-between">
          <span className="text-xl leading-7 font-extrabold text-text-strong">
            Encontra<span className="text-amber">Ê</span>
          </span>
          <Link
            href={destination}
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-text-subtle hover:underline"
          >
            Pular
          </Link>
        </div>

        <section
          aria-roledescription="carrossel"
          aria-label="Apresentação"
          className="anim-rise flex min-h-[360px] flex-col items-center justify-center gap-4 text-center"
          key={i}
        >
          <div
            className={cn("relative flex h-[200px] w-full items-center justify-center rounded-2xl", slide.bg)}
          >
            <span className="flex size-[88px] items-center justify-center rounded-[30px] bg-navy text-amber shadow-[0px_8px_16px_rgba(0,0,0,0.3)]">
              <Icon className="size-10" strokeWidth={1.8} aria-hidden />
            </span>
          </div>
          <div aria-live="polite" className="flex flex-col items-center gap-4">
            <h1 className="text-[26px] leading-[34px] font-extrabold text-text-strong">{slide.title}</h1>
            <p className="max-w-[460px] text-[15px] leading-[23px] text-text-muted">{slide.text}</p>
          </div>
        </section>

        <div className="flex justify-center gap-2" role="group" aria-label="Ir para o slide">
          {SLIDES.map((s, n) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Ir para ${n + 1} de ${SLIDES.length}`}
              aria-current={n === i}
              className="relative flex h-2 items-center after:absolute after:-inset-x-1 after:-inset-y-4 after:content-['']"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-[width] duration-200",
                  n === i ? "w-7 bg-primary" : "w-2 bg-border",
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          {i > 0 ? (
            <button type="button" onClick={() => setI(i - 1)} className={outlineBtnCls}>
              Voltar
            </button>
          ) : (
            <span />
          )}
          {last ? (
            <div className="flex items-center gap-4">
              {guest && (
                <Link href={routes.cadastro} className={cn(linkCls, "text-sm")}>
                  Criar conta
                </Link>
              )}
              <Link href={destination} className={cn(primaryBtnCls, "min-w-[120px]")}>
                {guest ? "Começar a explorar" : "Começar"}
              </Link>
            </div>
          ) : (
            <button type="button" onClick={() => setI(i + 1)} className={cn(primaryBtnCls, "min-w-[120px]")}>
              Próximo
            </button>
          )}
        </div>

        {guest && (
          <p className="-mt-2 text-center text-xs leading-[18px] text-text-subtle">
            Você está entrando como visitante: dá para buscar, explorar e ver ofertas. Para salvar, seguir e
            conversar, é só criar sua conta.
          </p>
        )}
      </AuthPanel>
    </AuthBackdrop>
  );
}
