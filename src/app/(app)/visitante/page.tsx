import { Check, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Modo visitante" };

/** Conteúdo fixo: o que dá para fazer sem conta e o que pede para entrar. */
const FREE = [
  "Buscar e explorar",
  "Ver mapa, rotas e distâncias",
  "Ver ofertas, menores preços e cupons",
  "Assistir stories e lives",
  "Ver perfis, avaliações e horários",
  "Comparar na hora (sem salvar)",
  "Chamar no WhatsApp ou ligar",
];
const LOCKED = [
  "Salvar nos favoritos",
  "Seguir uma loja",
  "Conversar pelo chat",
  "Avaliar",
  "Criar alerta de preço",
  "Pegar cupom",
  "Pedir orçamento",
  "Salvar comparação",
  "Pedir uma promoção",
  "Reservar, curtir e marcar como útil",
  "Comentar na live e confirmar presença",
];

export default function VisitantePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">Modo visitante</h1>
        <p className="text-base text-text-muted">
          Dá para explorar o EncontraÊ sem conta. Para guardar e conversar, é preciso entrar.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="livre" className="rounded-2xl border border-border bg-surface p-5">
          <h2 id="livre" className="mb-3 text-lg font-bold text-text-strong">
            Liberado sem conta
          </h2>
          <ul className="flex flex-col gap-2">
            {FREE.map((t) => (
              <li key={t} className="flex items-start gap-2 text-base text-text-2">
                <Check className="mt-0.5 size-5 shrink-0 text-success-text" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="pede" className="rounded-2xl border border-border bg-surface p-5">
          <h2 id="pede" className="mb-3 text-lg font-bold text-text-strong">
            Pede para entrar
          </h2>
          <ul className="flex flex-col gap-2">
            {LOCKED.map((t) => (
              <li key={t} className="flex items-start gap-2 text-base text-text-2">
                <Lock className="mt-0.5 size-4 shrink-0 text-text-subtle" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={routes.cadastro}
          className="flex h-12 items-center rounded-lg bg-primary px-6 text-base font-bold text-on-primary hover:bg-primary-hover"
        >
          Criar conta grátis
        </Link>
        <Link
          href={routes.entrar}
          className="flex h-12 items-center rounded-lg border border-border-strong px-6 text-base font-semibold text-text-2 hover:bg-surface-2"
        >
          Já tenho conta · Entrar
        </Link>
      </div>
    </div>
  );
}
