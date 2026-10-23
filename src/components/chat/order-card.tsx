"use client";

import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { chat } from "@/lib/api/chat";
import { orderCardView, type OrderAction, type OrderRequest } from "@/lib/domain/order-card";

const TONE = {
  ok: "bg-success-soft text-success-text",
  warn: "bg-accent-soft text-accent-text",
  danger: "bg-danger-soft text-danger-text",
} as const;

/** Cartão do pedido no topo da conversa: cancelar/remarcar sem custo, "Serviço realizado"/"Recebi" e nota em 1 toque. */
export function OrderCard({
  conversationId,
  request,
  partner,
  reviewHref,
  onChanged,
}: {
  conversationId: string;
  request: OrderRequest;
  partner: string;
  reviewHref: string | null;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const v = orderCardView(request, partner);
  const fail = (e: unknown) => toast(e instanceof Error ? e.message : "Não foi possível concluir.", "info");

  const act = useMutation({
    mutationFn: (a: OrderAction) => chat.requestAction(conversationId, a),
    onSuccess: () => {
      setConfirming(false);
      onChanged();
    },
    onError: fail,
  });
  const rate = useMutation({
    mutationFn: (b: { rating: number; tags: string[] }) => chat.rateRequest(conversationId, b),
    onSuccess: onChanged,
    onError: fail,
  });
  const tags = request.tags ?? [];
  const btn = "h-10 rounded-full border-[1.5px] px-4 text-sm font-bold whitespace-nowrap";

  return (
    <article
      aria-label="Resumo do pedido"
      className="flex shrink-0 flex-col gap-3 rounded-2xl border-[1.5px] border-border-strong bg-surface p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-bold tracking-wide text-text-muted uppercase">{v.kindLabel}</span>
        <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold", TONE[v.tone])}>
          {v.statusLabel}
        </span>
      </div>
      <h2 className="text-[17px] font-extrabold text-text-strong">{request.title}</h2>
      {request.rows.length > 0 && (
        <dl className="flex flex-wrap gap-x-7 gap-y-2">
          {request.rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-text-muted">{r.label}</dt>
              <dd className="text-sm font-semibold text-text">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-[13px] leading-[19px] text-text-2">{v.note}</p>

      {confirming && (
        <div role="alertdialog" aria-label={v.cancelConfirm.title} className="flex flex-col gap-2.5 rounded-xl border border-accent-border bg-accent-soft p-3.5">
          <strong className="text-sm text-accent-ink">{v.cancelConfirm.title}</strong>
          <span className="text-[13px] leading-[19px] text-accent-ink">{v.cancelConfirm.text}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={cn(btn, "border-primary bg-surface text-text-strong")}>
              Voltar
            </button>
            <button type="button" disabled={act.isPending} onClick={() => act.mutate("cancel")} className={cn(btn, "border-danger-text bg-danger-text text-white")}>
              {v.cancelConfirm.ok}
            </button>
          </div>
        </div>
      )}

      {!confirming && v.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {v.actions.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={act.isPending}
              onClick={() => (a.id === "cancel" ? setConfirming(true) : act.mutate(a.id))}
              className={cn(
                btn,
                a.danger
                  ? "border-danger-text bg-surface text-danger-text"
                  : a.id === "done"
                    ? "border-primary bg-primary text-on-primary"
                    : "border-primary bg-surface text-text-strong",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {v.askRating && (
        <div className="flex gap-1.5" role="group" aria-label="Sua nota">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={rate.isPending}
              aria-label={n === 1 ? "1 estrela" : `${n} estrelas`}
              onClick={() => rate.mutate({ rating: n, tags: [] })}
              className="grid size-12 place-items-center rounded-xl border-[1.5px] border-border-strong bg-surface hover:bg-selected"
            >
              <Star className="size-6 fill-accent text-accent" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {v.tagOptions.length > 0 && request.rating != null && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] text-text-2">Quer destacar algo? (opcional)</span>
          <div className="flex flex-wrap gap-2">
            {v.tagOptions.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  disabled={rate.isPending}
                  onClick={() => rate.mutate({ rating: request.rating!, tags: on ? tags.filter((x) => x !== t) : [...tags, t] })}
                  className={cn(
                    "h-[34px] rounded-full border-[1.5px] border-primary px-3.5 text-[13px] font-semibold",
                    on ? "bg-primary text-on-primary" : "bg-surface text-text-strong",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
          {reviewHref && (
            <Link href={reviewHref} className="self-start text-[13px] font-bold text-primary underline">
              Escrever um comentário
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
