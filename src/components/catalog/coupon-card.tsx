"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Ticket } from "lucide-react";
import { useState } from "react";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { useToast } from "@/components/ui/toast";
import { actions } from "@/lib/api/actions";
import type { Coupon } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";

const validity = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Maceio",
});

/** Cupom da loja: um por loja por pessoa. O preço com cupom vem calculado do servidor. */
export function CouponCard({
  coupon,
  productTitle,
  variant = "card",
}: {
  coupon: Coupon;
  productTitle?: string;
  /** `inline`: faixa tracejada na coluna de ações do produto; `band`: faixa larga da aba Ofertas da loja; `cta`: botão âmbar de 48 px da página pública. */
  variant?: "card" | "inline" | "band" | "cta";
}) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [claimed, setClaimed] = useState(coupon.claimed);
  const until = new Date(coupon.validUntil);
  const untilText = Number.isNaN(until.getTime()) ? null : validity.format(until);

  const claim = useMutation({
    mutationFn: () => actions.claimCoupon(coupon.id),
    onSuccess: () => {
      setClaimed(true);
      toast(`Cupom ${coupon.code} guardado. Ele aparece na comparação.`);
      qc.invalidateQueries({ queryKey: ["me", "coupons"] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "COUPON_ALREADY_CLAIMED") setClaimed(true);
      toast(e instanceof Error ? e.message : "Não foi possível pegar o cupom.", "info");
    },
  });

  useResumeAction("coupon", coupon.id, () => {
    if (!claimed) claim.mutate();
  });

  const rule = [
    productTitle && coupon.priceCents != null
      ? `${productTitle.length > 40 ? "este produto" : productTitle} sai por ${formatMoney(coupon.priceCents)}`
      : `${coupon.percentOff}% de desconto`,
    coupon.minCents ? `compras a partir de ${formatMoney(coupon.minCents)}` : null,
    untilText ? `válido até ${untilText}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const button = (
    <button
      type="button"
      disabled={claimed || claim.isPending}
      onClick={() => {
        if (!requireAuth("coupon", coupon.id)) return;
        claim.mutate();
      }}
      className={
        variant === "cta"
          ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-[15px] font-extrabold text-on-accent hover:bg-accent-hover disabled:opacity-70"
          : variant === "band"
            ? "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-[22px] text-sm font-extrabold whitespace-nowrap text-on-primary hover:bg-primary-hover disabled:opacity-70"
            : "inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-70"
      }
    >
      {claimed && <Check className="size-4" aria-hidden />}
      {claimed ? "Cupom guardado" : claim.isPending ? "Guardando…" : "Pegar cupom"}
    </button>
  );

  if (variant === "cta")
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[13px] leading-5 text-text-2">
          Cupom <b className="text-text-strong">{coupon.title}</b> · código <b>{coupon.code}</b>
          {rule && ` · ${rule}`}
        </p>
        {button}
      </div>
    );

  if (variant === "band")
    return (
      <section
        aria-label="Cupom da loja"
        className="flex flex-col gap-4 rounded-2xl border border-dashed border-accent-border bg-accent-soft px-5 py-4 sm:flex-row sm:items-center"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
          <Ticket className="size-6" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[11px] font-extrabold tracking-[.5px] text-accent-text">CUPOM DO DIA</span>
          <span className="text-[17px] leading-6 font-extrabold text-text-strong">{coupon.title}</span>
          <span className="text-[13px] text-accent-text">
            Código <b>{coupon.code}</b>
            {rule && ` · ${rule}`}
          </span>
        </div>
        {button}
      </section>
    );

  return (
    <section
      aria-label="Cupom da loja"
      className={
        variant === "inline"
          ? "flex flex-col gap-2 rounded-xl border-[1.5px] border-dashed border-accent-hover bg-accent-soft px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          : "flex flex-col gap-2 rounded-2xl border border-accent-border bg-accent-soft p-4"
      }
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-bold text-accent-text">
          <Ticket className="size-4" aria-hidden />
          Cupom da loja hoje: {coupon.title}
        </p>
        <p className="text-sm text-text">
          Com o cupom <b>{coupon.code}</b>
          {productTitle && coupon.priceCents != null ? (
            <>
              , {productTitle.length > 40 ? "este produto" : productTitle} sai por{" "}
              <b>{formatMoney(coupon.priceCents)}</b>
            </>
          ) : (
            <> você ganha {coupon.percentOff}% de desconto</>
          )}
          {coupon.minCents ? ` · compras a partir de ${formatMoney(coupon.minCents)}` : ""}
          {untilText ? ` · válido até ${untilText}` : ""}
        </p>
      </div>
      {button}
    </section>
  );
}
