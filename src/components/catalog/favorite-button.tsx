"use client";

import { useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { actions } from "@/lib/api/actions";

/** Coração: "Salvo em Meus Favoritos." / "Removido dos favoritos." Visitante vê o convite. */
export function FavoriteButton({
  type,
  id,
  initial,
  label,
}: {
  type: "product" | "profile";
  id: string;
  initial: boolean;
  /** Nome para leitor de tela (ex.: título do produto). */
  label: string;
}) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [on, setOn] = useState(initial);

  const m = useMutation({
    mutationFn: (next: boolean) => actions.favorite(type, id, next),
    onMutate: (next) => setOn(next),
    onSuccess: (_d, next) => {
      toast(next ? "Salvo em Meus Favoritos." : "Removido dos favoritos.");
      if (next)
        track({
          type: type === "product" ? "PRODUCT_FAVORITE" : "STORE_FAVORITE",
          targetType: type === "product" ? "PRODUCT" : "STORE",
          targetId: id,
        });
    },
    onError: (e, next) => {
      setOn(!next);
      toast(e instanceof Error ? e.message : "Não foi possível salvar agora.", "info");
    },
  });

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${on ? "Remover dos favoritos" : "Salvar nos favoritos"}: ${label}`}
      disabled={m.isPending}
      onClick={() => {
        if (!requireAuth("favorite", id)) return;
        m.mutate(!on);
      }}
      className="flex size-10 items-center justify-center rounded-full border border-border-strong text-text-2 hover:bg-surface-2 disabled:opacity-60"
    >
      <Heart className={cn("size-5", on && "fill-danger text-danger")} aria-hidden />
    </button>
  );
}
