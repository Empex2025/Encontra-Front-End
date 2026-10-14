"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Radar as RadarIcon, Sparkles, Tag, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { Tabs } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { radar, type Radar, type RadarKind } from "@/lib/api/radar";
import {
  filterRadar,
  radarHeadline,
  RADAR_KIND_LABEL,
  radarTabs,
  safeInternalHref,
  trackingLine,
  visibleRadarItems,
} from "@/lib/domain/radar";
import { formatTimeAgo } from "@/lib/format";
import { routes } from "@/lib/routes";

const KIND_STYLE: Record<RadarKind, { icon: typeof Sparkles; dot: string; chip: string }> = {
  new: { icon: Sparkles, dot: "bg-success", chip: "bg-success-soft text-success-text" },
  price: { icon: Tag, dot: "bg-amber", chip: "bg-amber-50 text-navy" },
  follow: { icon: UserCheck, dot: "bg-link", chip: "bg-accent-soft text-accent-text" },
  alert: { icon: BellRing, dot: "bg-danger", chip: "bg-danger-soft text-danger-text" },
};

/** "Meu Radar": avisos reais do servidor. Sem avisos e sem convite a mostrar, a faixa não aparece. */
export function HomeRadar() {
  const { me, isGuest, isLoading } = useSession();
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<"all" | RadarKind>("all");
  const q = useQuery({
    queryKey: ["radar", "mine", !!me],
    queryFn: radar.mine,
    enabled: !isLoading,
    retry: false,
  });

  const seen = useMutation({
    mutationFn: (id: string) => radar.markSeen([id]),
    onMutate: (id) => {
      qc.setQueryData<Radar>(["radar", "mine", !!me], (old) => {
        const it = old?.items.find((i) => i.id === id);
        if (!old || !it || it.seen) return old;
        return {
          ...old,
          unseen: Math.max(0, old.unseen - 1),
          items: old.items.map((i) => (i.id === id ? { ...i, seen: true } : i)),
        };
      });
    },
  });

  if (isLoading || q.isPending) {
    return (
      <section
        aria-busy="true"
        aria-labelledby="radar-title"
        className="flex flex-col gap-3 rounded-2xl bg-navy p-5 text-white"
      >
        <h2 id="radar-title" className="flex items-center gap-2 text-xl font-bold">
          <RadarIcon className="size-5 text-amber" aria-hidden />
          Meu Radar
        </h2>
        <p className="text-sm text-navy-200">Carregando seus avisos…</p>
        <div className="h-16 animate-pulse rounded-xl bg-navy-700/60" aria-hidden />
      </section>
    );
  }
  // Erro no radar não derruba a Home. Quem tem conta vê o cartão de erro com "Tentar de novo" (o radar é pessoal
  // e sumir em silêncio parece "não há novidades"). O visitante continua vendo o convite e as abas; o corpo
  // da faixa mostra o erro, nunca "nada de novo".
  const failed = q.isError;
  if (failed && !isGuest) {
    return (
      <section
        role="alert"
        aria-labelledby="radar-title"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-5 text-white"
      >
        <div className="min-w-0">
          <h2 id="radar-title" className="flex items-center gap-2 text-xl font-bold">
            <RadarIcon className="size-5 text-amber" aria-hidden />
            Meu Radar
          </h2>
          <p className="mt-1 text-sm text-navy-200">Não foi possível carregar seus avisos agora.</p>
        </div>
        <button
          type="button"
          onClick={() => void q.refetch()}
          disabled={q.isFetching}
          className="inline-flex h-11 items-center rounded-xl border border-white/40 px-5 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
        >
          {q.isFetching ? "Tentando…" : "Tentar de novo"}
        </button>
      </section>
    );
  }
  const items = q.data ? visibleRadarItems(q.data.items, isGuest) : [];
  // conta só o que está na tela: o número do servidor pode incluir tipos que o front não mostra
  const unseen = items.filter((i) => !i.seen).length;
  const tabs = radarTabs(isGuest).map((id) => ({
    id,
    label: id === "all" ? "Tudo" : RADAR_KIND_LABEL[id],
    // sem resposta do servidor não há contagem: a aba aparece sem número (nunca "0")
    count: failed ? null : id === "all" ? items.length : items.filter((i) => i.kind === id).length,
  }));
  const shown = filterRadar(items, tab);
  const line = q.data?.tracking ? trackingLine(q.data.tracking) : null;

  const open = (id: string, href: string | null) => {
    if (!isGuest) seen.mutate(id);
    const safe = safeInternalHref(href);
    if (safe) router.push(safe);
  };

  return (
    <section aria-labelledby="radar-title" className="rounded-2xl bg-navy p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="radar-title" className="flex items-center gap-2 text-xl font-bold">
            <RadarIcon className="size-5 text-amber" aria-hidden />
            {isGuest ? "Deixe a plataforma procurar por você" : radarHeadline(unseen)}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-navy-200">
            {isGuest
              ? "Com uma conta, seu radar acompanha preços, lojas que você segue, alertas e o que é novo perto de você."
              : "Você não precisa ficar procurando: a gente avisa quando um preço cai, uma loja que você segue lança algo ou surge algo novo perto."}
          </p>
          {line && <p className="mt-1 text-xs text-navy-300">{line}</p>}
        </div>
        {isGuest ? (
          <div className="flex gap-2">
            <Link
              href={routes.cadastro}
              className="rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-navy hover:bg-amber-400"
            >
              Criar conta e ativar meu radar
            </Link>
            <Link
              href={routes.entrar}
              className="rounded-xl border border-navy-300 px-4 py-2 text-sm font-semibold hover:bg-navy-700"
            >
              Já tenho conta
            </Link>
          </div>
        ) : (
          <Link
            href={`${routes.favoritos}?aba=alertas`}
            className="rounded-xl border border-navy-300 px-4 py-2 text-sm font-semibold hover:bg-navy-700"
          >
            Ajustar o que meu radar procura
          </Link>
        )}
      </div>

      <Tabs
        dark
        tabs={tabs}
        value={tab}
        onChange={(id) => setTab(id as "all" | RadarKind)}
        label="Tipos de aviso"
        className="mt-4 border-navy-700"
      />
      {failed ? (
        <div
          role="alert"
          className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-700/50 px-4 py-5 text-sm text-navy-200"
        >
          <p>Não foi possível carregar os avisos agora.</p>
          <button
            type="button"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
            className="inline-flex h-10 items-center rounded-xl border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {q.isFetching ? "Tentando…" : "Tentar de novo"}
          </button>
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-3 rounded-xl bg-navy-700/50 px-4 py-6 text-center text-sm text-navy-200">
          {isGuest
            ? "Nenhum aviso de novidades ou preços por enquanto. Com uma conta, o radar também acompanha lojas que você segue e alertas."
            : items.length === 0
              ? "Nada de novo por enquanto. Quando algo mudar perto de você, aparece aqui."
              : "Nenhum aviso nesta aba."}
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {shown.map((i) => {
            const s = KIND_STYLE[i.kind];
            const Icon = s.icon;
            return (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => open(i.id, i.href ?? null)}
                  className="flex w-full items-start gap-3 rounded-xl bg-navy-700/60 p-3 text-left hover:bg-navy-700"
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", s.chip)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{i.title}</span>
                    {i.detail && <span className="block truncate text-xs text-navy-200">{i.detail}</span>}
                    <span className="block text-xs text-navy-300">{formatTimeAgo(i.at) ?? ""}</span>
                  </span>
                  {!i.seen && !isGuest && (
                    <>
                      <span aria-hidden className={cn("mt-1 size-2 shrink-0 rounded-full", s.dot)} />
                      <span className="sr-only">Não visto</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
