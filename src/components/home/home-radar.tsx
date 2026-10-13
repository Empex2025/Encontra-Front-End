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
      <div
        aria-busy="true"
        aria-label="Carregando o radar"
        className="h-40 animate-pulse rounded-2xl bg-navy/10"
      />
    );
  }
  if (q.isError) return null; // erro no radar não derruba a Home: a faixa só não aparece
  const items = visibleRadarItems(q.data.items, isGuest);
  // conta só o que está na tela: o número do servidor pode incluir tipos que o front não mostra
  const unseen = items.filter((i) => !i.seen).length;
  const guestNoData = isGuest && items.length === 0;
  const tabs = radarTabs(isGuest).map((id) => ({
    id,
    label: id === "all" ? "Tudo" : RADAR_KIND_LABEL[id],
    count: id === "all" ? items.length : items.filter((i) => i.kind === id).length,
  }));
  const shown = filterRadar(items, tab);
  const line = q.data.tracking ? trackingLine(q.data.tracking) : null;

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

      {guestNoData ? null : items.length === 0 ? (
        <p className="mt-4 rounded-xl bg-navy-700/50 px-4 py-6 text-center text-sm text-navy-200">
          Nada de novo por enquanto. Quando algo mudar perto de você, aparece aqui.
        </p>
      ) : (
        <>
          <Tabs
            dark
            tabs={tabs}
            value={tab}
            onChange={(id) => setTab(id as "all" | RadarKind)}
            label="Tipos de aviso"
            className="mt-4 border-navy-700"
          />
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
                    <span
                      className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", s.chip)}
                    >
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
        </>
      )}
    </section>
  );
}
