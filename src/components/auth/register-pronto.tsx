import { Check, Heart, MapPin, Smartphone } from "lucide-react";
import Link from "next/link";

import { cn } from "@/components/ui/cn";
import { categoryById } from "@/lib/domain/categories";
import { firstName } from "@/lib/domain/validation";

import { AuthBackdrop, AuthPanel, primaryBtnCls } from "./auth-card";

/** Confete do protótipo: posição (px, no bloco de 456 px), forma, cor e atraso de cada peça. */
const CONFETTI = [
  { x: 90, y: 30, size: 10, round: false, rot: 20, color: "bg-amber", delay: 0.1 },
  { x: 390, y: 24, size: 8, round: true, rot: 0, color: "bg-accent-text/40", delay: 0.2 },
  { x: 60, y: 110, size: 8, round: true, rot: 0, color: "bg-link", delay: 0.25 },
  { x: 420, y: 100, size: 10, round: false, rot: -15, color: "bg-amber", delay: 0.15 },
  { x: 140, y: 4, size: 6, round: true, rot: 0, color: "bg-success", delay: 0.3 },
  { x: 360, y: 140, size: 6, round: false, rot: 30, color: "bg-navy-300", delay: 0.35 },
] as const;

/** Etapa final (artboard CadPronto): resumo do que foi configurado, com os dados reais gravados. */
export function RegisterPronto({
  name,
  phoneMasked,
  locationLabel,
  interestIds,
  continueHref = "/boas-vindas",
}: {
  name: string;
  phoneMasked: string;
  locationLabel: string;
  interestIds: string[];
  continueHref?: string;
}) {
  const interests = interestIds
    .map((id) => categoryById(id)?.name)
    .filter(Boolean)
    .join(", ");
  const first = firstName(name);
  return (
    <AuthBackdrop>
      <AuthPanel width={520} labelledBy="pronto-title">
        <div className="relative flex flex-col items-center gap-4 pt-2 text-center">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "anim-pop absolute hidden sm:block",
                c.color,
                c.round ? "rounded-full" : "rounded-sm",
              )}
              style={{
                left: c.x,
                top: c.y,
                width: c.size,
                height: c.size,
                transform: `rotate(${c.rot}deg)`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
          <span className="anim-pop flex size-[88px] items-center justify-center rounded-full bg-success-soft">
            <span className="flex size-16 items-center justify-center rounded-full bg-success text-white">
              <Check className="size-[34px]" strokeWidth={3} aria-hidden />
            </span>
          </span>
          <h1 id="pronto-title" className="text-[28px] leading-9 font-extrabold text-text-strong">
            {first ? `Tudo pronto, ${first}!` : "Tudo pronto!"}
          </h1>
          <p className="max-w-[360px] text-sm leading-5 text-text-muted">
            Sua conta está pronta para descobrir e encontrar o que você precisa perto de você.
          </p>
        </div>
        <ul className="flex flex-col gap-2 rounded-lg border border-surface-3 bg-bg px-4 py-3 text-xs leading-4 text-text-muted">
          <li className="flex items-center gap-2">
            <Smartphone className="size-4 shrink-0 text-text-muted" aria-hidden />
            <span>
              Celular <b className="text-text">{phoneMasked || "—"}</b> confirmado
            </span>
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-text-muted" aria-hidden />
            <span>
              <b className="text-text">{locationLabel || "—"}</b>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Heart className="size-4 shrink-0 text-text-muted" aria-hidden />
            <span>
              <b className="text-text">{interests || "—"}</b>
            </span>
          </li>
        </ul>
        <Link href={continueHref} className={cn(primaryBtnCls, "w-full")}>
          Continuar
        </Link>
      </AuthPanel>
    </AuthBackdrop>
  );
}
