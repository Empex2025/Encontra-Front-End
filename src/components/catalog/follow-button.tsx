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

/** Seguir / Seguindo (+ sino quando segue). Visitante vê o convite; seguir ≠ favoritar. */
export function FollowButton({
  profile,
  onFollowersChange,
  withBell = false,
  className,
}: {
  profile: Pick<ProfileSummary, "id" | "name" | "following">;
  /** +1 ou −1, para o contador de seguidores da tela. */
  onFollowersChange?: (delta: 1 | -1) => void;
  withBell?: boolean;
  className?: string;
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
          "inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-bold transition-colors disabled:opacity-60",
          following
            ? "border border-border-strong bg-surface text-text-2 hover:bg-surface-2"
            : "bg-primary text-on-primary hover:bg-primary-hover",
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
          className="flex size-10 items-center justify-center rounded-lg border border-border-strong text-text-2 hover:bg-surface-2"
        >
          {bell ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
        </button>
      )}
    </span>
  );
}
