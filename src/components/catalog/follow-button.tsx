"use client";

import { useMutation } from "@tanstack/react-query";
import { Bell, BellOff, Check, Plus } from "lucide-react";
import { useState } from "react";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { actions } from "@/lib/api/actions";
import type { ProfileSummary } from "@/lib/api/catalog";

/**
 * Seguir / Seguindo (+ sino quando segue). Visitante vê o convite; seguir ≠ favoritar.
 * Variantes: `default`; `card` (produto: 36 px, borda azul, cantos 8); `pill` (perfil da loja: redondo, 38 px).
 */
export function FollowButton({
  profile,
  onFollowersChange,
  withBell = false,
  className,
  variant = "default",
}: {
  profile: Pick<ProfileSummary, "id" | "name" | "following">;
  /** +1 ou −1, para o contador de seguidores da tela. */
  onFollowersChange?: (delta: 1 | -1) => void;
  withBell?: boolean;
  className?: string;
  variant?: "default" | "card" | "pill";
}) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [following, setFollowing] = useState(profile.following);
  const [bell, setBell] = useState(true);

  const follow = useMutation({
    mutationFn: (next: boolean) => actions.follow(profile.id, next),
    onMutate: (next) => {
      setFollowing(next);
      onFollowersChange?.(next ? 1 : -1);
    },
    onSuccess: (_d, next) =>
      toast(
        next
          ? `Você está seguindo a ${profile.name}. Vai ver as novidades e ofertas dela primeiro.`
          : `Você deixou de seguir a ${profile.name}.`,
      ),
    onError: (e, next) => {
      setFollowing(!next);
      onFollowersChange?.(next ? -1 : 1);
      toast(e instanceof Error ? e.message : "Não foi possível seguir agora.", "info");
    },
  });

  useResumeAction("follow", profile.id, () => {
    if (!following) follow.mutate(true);
  });

  const bellMut = useMutation({
    mutationFn: (enabled: boolean) => actions.setBell(profile.id, enabled),
    onMutate: (enabled) => setBell(enabled),
    onError: (e, enabled) => {
      setBell(!enabled);
      toast(e instanceof Error ? e.message : "Não foi possível mudar o aviso.", "info");
    },
  });

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-pressed={following}
        disabled={follow.isPending}
        onClick={() => {
          if (!requireAuth("follow", profile.id)) return;
          follow.mutate(!following);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap transition-colors disabled:opacity-60",
          variant === "default" &&
            (following
              ? "h-10 rounded-lg border border-border-strong bg-surface px-4 text-text-2 hover:bg-surface-2"
              : "h-10 rounded-lg bg-primary px-4 text-on-primary hover:bg-primary-hover"),
          variant === "card" &&
            (following
              ? "h-9 rounded-lg border-[1.5px] border-primary bg-selected px-4 text-text-strong hover:brightness-95"
              : "h-9 rounded-lg border-[1.5px] border-primary bg-primary px-4 text-on-primary hover:bg-primary-hover"),
          variant === "pill" &&
            (following
              ? "h-[38px] justify-center gap-2 rounded-full border border-border bg-surface px-[18px] text-text-strong hover:bg-surface-2"
              : "h-[38px] justify-center gap-2 rounded-full bg-primary px-5 text-on-primary hover:bg-primary-hover"),
          className,
        )}
      >
        {following ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        {following ? "Seguindo" : "Seguir"}
      </button>
      {withBell && following && (
        <button
          type="button"
          aria-pressed={bell}
          aria-label={bell ? "Desligar avisos desta loja" : "Ligar avisos desta loja"}
          onClick={() => bellMut.mutate(!bell)}
          className={cn(
            "flex items-center justify-center text-text-strong hover:bg-surface-2",
            variant === "pill"
              ? cn(
                  "h-[38px] w-11 rounded-full border border-border",
                  bell ? "bg-selected" : "bg-surface",
                )
              : "size-10 rounded-lg border border-border-strong text-text-2",
          )}
        >
          {bell ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
        </button>
      )}
    </span>
  );
}
