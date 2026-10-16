"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Sparkles, Tag, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { InlineError } from "@/components/ui/inline-state";
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

/** Cor do quadrado de cada tipo de aviso (verde = novidade, âmbar = preço, azul = quem você segue, vermelho = alerta). */
const KIND_STYLE: Record<RadarKind, { icon: typeof Sparkles; box: string }> = {
  new: { icon: Sparkles, box: "bg-success text-white" },
  price: { icon: Tag, box: "bg-amber text-navy" },
  follow: { icon: UserCheck, box: "bg-navy-700 text-white" },
  alert: { icon: BellRing, box: "bg-danger text-white" },
};

/** "Meu Radar" (painel azul do protótipo): avisos reais do servidor. Erro, vazio e carregando são telas distintas. */
export function HomeRadar() {
  const { me, isGuest, isLoading } = useSession();
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<"all" | RadarKind>("all");
  const key = ["radar", "mine", !!me];
  const q = useQuery({
    queryKey: key,
    queryFn: radar.mine,
    enabled: !isLoading,
    retry: false,
  });

  /** "Visto" é otimista: a bolinha some na hora e o servidor confirma em seguida. */
  const seen = useMutation({
    mutationFn: (ids: string[]) => radar.markSeen(ids),
    onMutate: (ids) => {
      qc.setQueryData<Radar>(key, (old) => {
        if (!old) return old;
        const fresh = old.items.filter((i) => ids.includes(i.id) && !i.seen).length;
        if (fresh === 0) return old;
        return {
          ...old,
          unseen: Math.max(0, old.unseen - fresh),
          items: old.items.map((i) => (ids.includes(i.id) ? { ...i, seen: true } : i)),
        };
      });
    },
  });

  if (isLoading || q.isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Carregando o radar"
        className="h-[445px] animate-pulse rounded-[20px] bg-navy/10"
      />
    );
  }
  const items = visibleRadarItems(q.data?.items ?? [], isGuest);
  // conta só o que está na tela: o número do servidor pode incluir tipos que o front não mostra
  const unseenIds = items.filter((i) => !i.seen).map((i) => i.id);
  const unseen = unseenIds.length;
  const tabs = radarTabs(isGuest).map((id) => ({
    id,
    label: id === "all" ? "Tudo" : RADAR_KIND_LABEL[id],
    count: id === "all" ? items.length : items.filter((i) => i.kind === id).length,
  }));
  const shown = filterRadar(items, tab);
  const line = q.data?.tracking ? trackingLine(q.data.tracking) : null;

  const open = (id: string, href: string | null) => {
    if (!isGuest) seen.mutate([id]);
    const safe = safeInternalHref(href);
    if (safe) router.push(safe);
  };

  const ghostBtn =
    "flex h-11 items-center justify-center rounded-lg border border-navy-300 px-4 text-sm font-bold text-white hover:bg-navy-700";

  return (
    <section
      aria-labelledby="radar-title"
      className="grid gap-6 rounded-[20px] bg-navy p-5 text-white shadow-raised sm:p-7 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-7"
    >
      <div className="flex min-w-0 flex-col gap-3.5">
        <span className="inline-flex items-center gap-2 text-[13px] font-extrabold tracking-[0.6px] text-amber uppercase">
          <span className="flex size-9 items-center justify-center rounded-full bg-amber text-navy">
            <Bell className="size-[18px]" strokeWidth={2.2} aria-hidden />
          </span>
          Meu Radar
        </span>
        <h2 id="radar-title" className="text-[30px] leading-[38px] font-extrabold">
          {isGuest ? "Deixe a plataforma procurar por você" : q.isError ? "Meu Radar" : radarHeadline(unseen)}
        </h2>
        <p className="text-sm leading-[21px] text-navy-200">
          {isGuest
            ? "Com uma conta, seu radar acompanha preços, lojas que você segue, alertas e o que é novo perto de você."
            : "Você não precisa ficar procurando: a gente avisa quando um preço cai, uma loja que você segue lança algo ou surge algo novo perto."}
        </p>
        {isGuest ? (
          <div className="flex flex-col gap-2">
            <Link
              href={routes.cadastro}
              className="flex h-[42px] items-center justify-center rounded-lg bg-amber px-4 text-sm font-bold text-navy hover:bg-amber-400"
            >
              Criar conta e ativar meu radar
            </Link>
            <Link href={routes.entrar} className={ghostBtn}>
              Já tenho conta
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {unseen > 0 && (
              <button
                type="button"
                onClick={() => seen.mutate(unseenIds)}
                className="h-[42px] rounded-lg bg-amber px-4 text-sm font-bold text-navy hover:bg-amber-400"
              >
                Marcar tudo como visto
              </button>
            )}
            <Link href={`${routes.favoritos}?aba=alertas`} className={ghostBtn}>
              Ajustar o que meu radar procura
            </Link>
          </div>
        )}
        {line && <p className="text-xs leading-[14px] text-navy-300">{line}</p>}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        {q.isError ? (
          <InlineError
            dark
            message="Não foi possível carregar seus avisos agora."
            onRetry={() => void q.refetch()}
            retrying={q.isFetching}
          />
        ) : (
          <>
            <div role="tablist" aria-label="Tipos de aviso" className="flex flex-wrap gap-2">
              {tabs.map((t) => {
                const on = t.id === tab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "inline-flex h-[34px] items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap",
                      on ? "border-white bg-white text-navy" : "border-navy-700 text-white hover:bg-navy-700",
                    )}
                  >
                    {t.label}
                    <span
                      className={cn(
                        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold",
                        on ? "bg-navy text-white" : "bg-navy-700 text-white",
                      )}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
            {shown.length === 0 && (
              <p className="rounded-xl bg-navy-700/50 px-4 py-6 text-center text-sm text-navy-200">
                {items.length > 0
                  ? "Nenhum aviso deste tipo por enquanto."
                  : isGuest
                    ? "Nenhum aviso de novidades ou preços perto de você por enquanto. Crie uma conta para o radar acompanhar também o que você segue."
                    : "Nada de novo por enquanto. Quando algo mudar perto de você, aparece aqui."}
              </p>
            )}
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 md:grid-cols-2" role="tabpanel">
              {shown.map((i) => {
                const s = KIND_STYLE[i.kind];
                const Icon = s.icon;
                return (
                  <li key={i.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => open(i.id, i.href ?? null)}
                      className="flex h-16 w-full items-center gap-3 rounded-xl bg-white/10 px-3.5 text-left transition-colors hover:bg-white/15"
                    >
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
                          s.box,
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm leading-5 font-bold">{i.title}</span>
                        {i.detail && (
                          <span className="block truncate text-xs leading-4 text-navy-200">{i.detail}</span>
                        )}
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5 self-stretch py-2.5">
                        <span className="text-[11px] leading-3 text-navy-300">
                          {formatTimeAgo(i.at) ?? ""}
                        </span>
                        {!i.seen && !isGuest && (
                          <>
                            <span aria-hidden className="size-2 rounded-full bg-amber" />
                            <span className="sr-only">Não visto</span>
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
