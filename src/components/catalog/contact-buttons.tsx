"use client";

import { useMutation } from "@tanstack/react-query";
import { MessageCircle, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { actions } from "@/lib/api/actions";
import type { ProfileSummary } from "@/lib/api/catalog";
import { whatsappUrl } from "@/lib/domain/whatsapp";
import { conversaHref } from "@/lib/routes";

/**
 * "Conversar" (chat próprio, pede conta) e "Chamar no WhatsApp" (livre). `draft` só vai quando há mensagem pronta
 * a editar (quantidade > 1 ou pergunta pronta); `whatsappText` é a mensagem que abre no WhatsApp.
 */
export function ContactButtons({
  profile,
  productId,
  serviceId,
  draft,
  whatsappText,
  chatLabel = "Conversar com a loja",
  target,
  layout = "row",
}: {
  profile: Pick<ProfileSummary, "id" | "whatsapp" | "kind">;
  productId?: string;
  serviceId?: string;
  draft?: string;
  whatsappText: string;
  chatLabel?: string;
  target: { targetType: "PRODUCT" | "STORE" | "PROVIDER"; targetId: string };
  layout?: "row" | "stack";
}) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const toast = useToast();

  const chat = useMutation({
    mutationFn: () => actions.startConversation({ profileId: profile.id, productId, serviceId, draft }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });

  useResumeAction("chat", profile.id, () => chat.mutate());

  const wa = whatsappUrl(profile.whatsapp, whatsappText);

  return (
    <div className={cn("flex gap-2", layout === "stack" ? "flex-col" : "flex-col sm:flex-row")}>
      <button
        type="button"
        disabled={chat.isPending}
        onClick={() => {
          if (!requireAuth("chat", profile.id)) return;
          chat.mutate();
        }}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        <MessageCircle className="size-5" aria-hidden />
        {chat.isPending ? "Abrindo…" : chatLabel}
      </button>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track({ type: "WHATSAPP_CLICK", ...target })}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-success px-4 text-[15px] font-bold text-success-text hover:bg-success-soft"
        >
          <Phone className="size-5" aria-hidden />
          Chamar no WhatsApp
        </a>
      )}
    </div>
  );
}
