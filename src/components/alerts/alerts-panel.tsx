"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Pause, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { type Access, LockedBody } from "@/components/auth/session-gate";
import { cn } from "@/components/ui/cn";
import { EmptyCard } from "@/components/ui/empty-card";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton, SearchField } from "@/components/ui/list-states";
import { useToast } from "@/components/ui/toast";
import { actions } from "@/lib/api/actions";
import { type AlertRow, me } from "@/lib/api/me";
import { CONDITION_LABEL } from "@/lib/domain/alert-form";
import { matches } from "@/lib/domain/text-match";
import { formatMoney, formatTimeAgo } from "@/lib/format";
import { produtoHref, routes } from "@/lib/routes";

export const ALERTS_KEY = ["me", "alerts"] as const;

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

type Filter = "all" | "active" | "paused";

/**
 * Lista e gestão de alertas (Favoritos › Alertas e Notificações › Gerenciar alertas).
 * `variant` só troca o texto do aviso do topo, como no protótipo.
 */
export function AlertsPanel({
  access = "member",
  variant = "favoritos",
}: {
  access?: Access;
  variant?: "favoritos" | "notificacoes";
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const locked = access !== "member";
  const [filter, setFilter] = useState<Filter>("all");
  const [term, setTerm] = useState("");
  const q = useQuery({ queryKey: ALERTS_KEY, queryFn: me.alerts, enabled: !locked });

  const toggle = useMutation({
    mutationFn: (a: AlertRow) => me.setAlertActive(a.id, !a.active),
    onSuccess: (_d, a) => {
      toast(a.active ? "Alerta pausado." : "Alerta ativado.");
      void qc.invalidateQueries({ queryKey: ALERTS_KEY });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível alterar o alerta.", "info"),
  });
  const del = useMutation({
    mutationFn: (a: AlertRow) => actions.deleteAlert(a.id),
    onSuccess: () => {
      toast("Alerta excluído.");
      void qc.invalidateQueries({ queryKey: ALERTS_KEY });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível excluir o alerta.", "info"),
  });

  const all = q.data?.items ?? [];
  const items = all.filter(
    (a) =>
      (filter === "all" || (filter === "active" ? a.active : !a.active)) &&
      matches(term, a.product.title, a.profile?.name, a.city),
  );
  const FILTERS: { id: Filter; label: string; n: number }[] = [
    { id: "all", label: "Todos", n: all.length },
    { id: "active", label: "Ativos", n: all.filter((a) => a.active).length },
    { id: "paused", label: "Pausados", n: all.filter((a) => !a.active).length },
  ];

  return (
    <section
      aria-label={variant === "favoritos" ? "Alertas" : "Gerenciar alertas"}
      className="flex flex-col gap-3"
    >
      {variant === "favoritos" ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent-border bg-accent-soft px-4 py-3.5 text-sm leading-5 text-text-2">
          <Bell className="size-[22px] shrink-0 text-accent-text" aria-hidden />
          <span className="flex-1">
            Os alertas avisam quando o preço baixa, um item volta ao estoque, entra em promoção ou uma loja
            nova passa a vender. Crie pelo botão <b>Avise-me</b> na página do produto ou numa busca sem
            resultado.
          </span>
          <Link
            href={routes.notificacoes}
            className="text-[13px] font-bold whitespace-nowrap text-link hover:underline"
          >
            Ver avisos recebidos ›
          </Link>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-accent-border bg-accent-soft px-5 py-4 text-sm leading-5 text-text-2">
          <Bell className="size-[22px] shrink-0 text-accent-text" aria-hidden />
          <span>
            <b>Seus alertas inteligentes.</b> Você recebe um aviso quando o produto <b>voltar ao estoque</b>,{" "}
            <b>baixar de preço</b>, <b>entrar em promoção</b> ou quando <b>outra loja perto cadastrar</b>.
            Crie um alerta pelo botão <b>“Avise-me”</b> na página do produto.
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchField
          value={term}
          onChange={setTerm}
          disabled={locked}
          label="Buscar nos alertas"
          className="sm:w-64"
        />
        <ul className="flex flex-wrap gap-1.5" aria-label="Mostrar alertas">
          {FILTERS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                aria-pressed={filter === f.id}
                disabled={locked}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-[34px] rounded-full border px-3 text-[13px] font-semibold disabled:opacity-60",
                  filter === f.id
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-text-2 hover:border-navy-300",
                )}
              >
                {f.label} ({q.data ? f.n : "—"})
              </button>
            </li>
          ))}
        </ul>
      </div>
      {locked ? (
        <LockedBody
          access={access}
          area="favoritos"
          hint="Avisamos por notificação quando o preço baixar ou o produto voltar."
        />
      ) : q.isPending ? (
        <ListSkeleton label="Carregando alertas…" />
      ) : q.isError ? (
        <ErrorState
          title="Não foi possível carregar seus alertas"
          error={q.error}
          onRetry={() => q.refetch()}
        />
      ) : all.length === 0 ? (
        <EmptyCard
          icon={<Bell className="size-8 text-text-subtle" aria-hidden />}
          title={variant === "favoritos" ? "Nenhum alerta ativo." : "Você não tem alertas."}
          hint="Abra um produto e use “Avise-me” para ser avisado quando o preço baixar ou ele voltar."
          href={routes.explorar}
          cta="Buscar um produto para acompanhar"
        />
      ) : items.length === 0 ? (
        <EmptyCard title="Nenhum alerta encontrado" hint="Troque o filtro ou a busca." />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a) => {
            const left = daysLeft(a.expiresAt);
            const ago = a.lastTrigger ? formatTimeAgo(a.lastTrigger.at) : null;
            return (
              <li
                key={a.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl bg-surface px-5 py-4 shadow-card sm:flex-row sm:items-center sm:gap-4",
                  !a.active && "opacity-60",
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-3">
                    {a.product.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.product.imageUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={produtoHref(a.product.slug)}
                        className="truncate text-[15px] leading-[22px] font-bold text-text hover:underline"
                      >
                        {a.product.title}
                      </Link>
                      <span
                        className={cn(
                          "inline-flex h-5 items-center rounded px-2 text-[11px] font-bold",
                          a.active ? "bg-success-soft text-success-text" : "bg-surface-2 text-text-subtle",
                        )}
                      >
                        {a.active ? "Ativo" : "Pausado"}
                      </span>
                    </div>
                    <p className="text-[13px] leading-[18px] text-text-muted">
                      {[
                        a.profile?.name,
                        a.city,
                        a.size ? `Tamanho ${a.size}` : null,
                        `até ${a.radiusKm} km`,
                        `avisar por ${a.channels.map((c) => ({ site: "site", whatsapp: "WhatsApp", email: "e-mail" })[c]).join(", ")}`,
                        Number.isNaN(left)
                          ? "validade não informada"
                          : left > 0
                            ? `vence em ${left} ${left === 1 ? "dia" : "dias"}`
                            : "venceu",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <ul className="flex flex-wrap gap-1.5" aria-label="Condições">
                      {a.conditions.map((c) => (
                        <li
                          key={c}
                          className="inline-flex h-6 items-center rounded-full bg-surface-2 px-2.5 text-xs font-semibold text-text-2"
                        >
                          {c === "price_drop" && a.belowCents
                            ? `Preço abaixo de ${formatMoney(a.belowCents)}`
                            : CONDITION_LABEL[c].label}
                        </li>
                      ))}
                    </ul>
                    {a.active && a.lastTrigger && (
                      <p className="self-start rounded-md bg-success-soft px-2 py-1 text-xs font-bold text-success-text">
                        ✓ Disparou{ago ? ` ${ago}` : ""}: {a.lastTrigger.text}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate(a)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-strong hover:bg-surface-2"
                  >
                    {a.active ? (
                      <Pause className="size-3.5" aria-hidden />
                    ) : (
                      <Play className="size-3.5" aria-hidden />
                    )}
                    {a.active ? "Pausar" : "Ativar"}
                    <span className="sr-only"> alerta de {a.product.title}</span>
                  </button>
                  <button
                    type="button"
                    disabled={del.isPending}
                    onClick={() => del.mutate(a)}
                    aria-label={`Excluir alerta de ${a.product.title}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-danger/40 bg-surface px-3 text-xs font-bold text-danger-text hover:bg-danger-soft"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
