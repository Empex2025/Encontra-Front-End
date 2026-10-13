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
export function CouponCard({ coupon, productTitle }: { coupon: Coupon; productTitle?: string }) {
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

  return (
    <section
      aria-label="Cupom da loja"
      className="flex flex-col gap-2 rounded-2xl border border-accent-border bg-accent-soft p-4"
    >
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
      <button
        type="button"
        disabled={claimed || claim.isPending}
        onClick={() => {
          if (!requireAuth("coupon", coupon.id)) return;
          claim.mutate();
        }}
        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-70"
      >
        {claimed && <Check className="size-4" aria-hidden />}
        {claimed ? "Cupom guardado" : claim.isPending ? "Guardando…" : "Pegar cupom"}
      </button>
    </section>
  );
}
