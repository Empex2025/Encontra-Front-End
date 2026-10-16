"use client";

import { Check, Lock } from "lucide-react";
import { useState } from "react";

import { type AuthActionType } from "@/lib/domain/auth-actions";

import { InviteDialog } from "./invite-dialog";

/** Conteúdo fixo do artboard Visitante: o que dá para fazer sem conta. */
const FREE = [
  "Buscar e explorar produtos, serviços e lugares",
  "Ver o mapa, rotas e distâncias",
  "Ver ofertas, menores preços e cupons disponíveis",
  "Assistir stories e lives",
  "Ver perfis, avaliações e horários",
  "Comparar na hora (sem salvar)",
  "Chamar a loja no WhatsApp ou ligar",
];

/** O que pede conta e a ação (convite) de cada linha; o texto do aviso vem de `AUTH_ACTIONS`. */
const GATES: readonly { action: AuthActionType; label: string }[] = [
  { action: "favorite", label: "Salvar nos favoritos" },
  { action: "follow", label: "Seguir uma loja" },
  { action: "chat", label: "Conversar pelo chat" },
  { action: "review", label: "Avaliar" },
  { action: "alert", label: "Criar alerta de preço" },
  { action: "coupon", label: "Pegar cupom" },
  { action: "quote", label: "Pedir orçamento" },
  { action: "saveComparison", label: "Salvar comparação" },
];

const card = "flex flex-col gap-2.5 rounded-2xl bg-surface p-6 shadow-card";

/** Modo visitante (artboard Visitante): o que é livre, o que pede conta e o aviso de cada ação. */
export function VisitorGuide() {
  const [open, setOpen] = useState<AuthActionType | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-9 font-bold text-text-strong sm:text-[32px] sm:leading-10">
          Modo visitante
        </h1>
        <p className="text-base leading-6 text-text-muted">
          O que dá para fazer sem conta e como pedimos o cadastro na hora certa — sem bloquear quem só quer
          olhar.
        </p>
      </header>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <section aria-labelledby="livre" className={card}>
          <h2 id="livre" className="mb-1 text-lg leading-[26px] font-bold text-success-text">
            Liberado sem conta
          </h2>
          <ul className="flex flex-col gap-3 lg:gap-2.5">
            {FREE.map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm leading-4 text-text">
                <Check className="size-4 shrink-0 text-success-text" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pede" className={card}>
          <h2 id="pede" className="mb-1 text-lg leading-[26px] font-bold text-accent-text">
            Pede para entrar{" "}
            <span className="text-[13px] font-medium text-text-subtle">— toque para ver o aviso</span>
          </h2>
          <ul className="flex flex-col lg:gap-2.5">
            {GATES.map((g) => (
              <li key={g.action}>
                <button
                  type="button"
                  onClick={() => setOpen(g.action)}
                  aria-label={`${g.label}: ver aviso`}
                  className="-mx-2 flex min-h-11 w-[calc(100%+16px)] items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm leading-5 text-text hover:bg-surface-2 lg:min-h-8"
                >
                  <Lock className="size-4 shrink-0 text-accent-text" aria-hidden />
                  <span className="flex-1">{g.label}</span>
                  <span className="text-xs font-bold text-link" aria-hidden>
                    Ver aviso ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="rounded-xl bg-surface-2 px-[18px] py-3.5 text-[13px] leading-5 text-text-muted">
        <b className="text-text">Regras:</b> o aviso aparece só quando a pessoa tenta a ação (nunca na
        entrada). Depois de entrar, a ação é concluída sozinha — se ela tocou em “Salvar”, o item já aparece
        salvo. Mostramos a barra azul de visitante no topo das páginas, sem cobrir conteúdo.
      </p>

      {open && <InviteDialog action={open} backTo="/" onClose={() => setOpen(null)} />}
    </div>
  );
}
