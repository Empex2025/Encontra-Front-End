"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Pause, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { type Access, LockedBody } from "@/components/auth/session-gate";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState, ListSkeleton, SearchField } from "@/components/ui/list-states";
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

/** Lista e gestão de alertas (Favoritos › Alertas e Notificações › Gerenciar alertas). */
export function AlertsPanel({ access = "member" }: { access?: Access }) {
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
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-text-strong">Meus alertas</h2>
        <p className="text-sm text-text-muted">
          Seus alertas inteligentes. Você recebe um aviso quando o produto voltar ao estoque, baixar de preço,
          entrar em promoção ou quando outra loja perto cadastrar. Crie um alerta pelo botão “Avise-me” na
          página do produto.{" "}
          <Link href={routes.notificacoes} className="font-semibold text-link hover:underline">
            Ver avisos recebidos ›
          </Link>
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={term}
          onChange={setTerm}
          disabled={locked}
          label="Buscar nos alertas"
          className="sm:w-72"
        />
        <ul className="flex flex-wrap gap-2" aria-label="Mostrar alertas">
          {FILTERS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                aria-pressed={filter === f.id}
                disabled={locked}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm font-semibold disabled:opacity-60",
                  filter === f.id
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-text hover:bg-surface-2",
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
        <EmptyState
          icon={<Bell className="size-8 text-text-subtle" aria-hidden />}
          title="Você ainda não tem alertas."
          hint="Abra um produto e toque em “Avise-me” para ser avisado quando o preço baixar."
          href={routes.explorar}
          cta="Buscar um produto para acompanhar"
        />
      ) : items.length === 0 ? (
        <EmptyState title="Nenhum alerta encontrado" hint="Troque o filtro ou a busca." />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a) => {
            const left = daysLeft(a.expiresAt);
            const ago = a.lastTrigger ? formatTimeAgo(a.lastTrigger.at) : null;
            return (
              <li
                key={a.id}
                className={cn("flex gap-3 rounded-2xl border border-border p-4", !a.active && "opacity-60")}
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {a.product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.product.imageUrl} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={produtoHref(a.product.slug)}
                      className="truncate font-bold text-text-strong hover:underline"
                    >
                      {a.product.title}
                    </Link>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        a.active ? "bg-success-bg text-success-text" : "bg-surface-2 text-text-muted",
                      )}
                    >
                      {a.active ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">
                    {[
                      a.profile?.name,
                      a.city,
                      a.size ? `tamanho ${a.size}` : null,
                      `${a.radiusKm} km`,
                      `avisar por ${a.channels.map((c) => ({ site: "site", whatsapp: "WhatsApp", email: "e-mail" })[c]).join(", ")}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <ul className="flex flex-wrap gap-1.5" aria-label="Condições">
                    {a.conditions.map((c) => (
                      <li
                        key={c}
                        className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-text-2"
                      >
                        {c === "price_drop" && a.belowCents
                          ? `Preço abaixo de ${formatMoney(a.belowCents)}`
                          : CONDITION_LABEL[c].label}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-text-subtle">
                    {Number.isNaN(left)
                      ? "Validade não informada"
                      : left > 0
                        ? `Vence em ${left} ${left === 1 ? "dia" : "dias"}`
                        : "Venceu"}
                  </p>
                  {a.active && a.lastTrigger && (
                    <p className="text-xs font-semibold text-success-text">
                      Disparou{ago ? ` ${ago}` : ""}: {a.lastTrigger.text}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate(a)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2"
                    >
                      {a.active ? (
                        <Pause className="size-4" aria-hidden />
                      ) : (
                        <Play className="size-4" aria-hidden />
                      )}
                      {a.active ? "Pausar" : "Ativar"}
                      <span className="sr-only"> alerta de {a.product.title}</span>
                    </button>
                    <button
                      type="button"
                      disabled={del.isPending}
                      onClick={() => del.mutate(a)}
                      aria-label={`Excluir alerta de ${a.product.title}`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-semibold text-danger-text hover:bg-surface-2"
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
