"use client";

import { useMutation } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId } from "react";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
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
  look = "default",
}: {
  profile: Pick<ProfileSummary, "id" | "whatsapp" | "kind">;
  productId?: string;
  serviceId?: string;
  draft?: string;
  whatsappText: string;
  chatLabel?: string;
  target: { targetType: "PRODUCT" | "STORE" | "PROVIDER"; targetId: string };
  layout?: "row" | "stack";
  /** `bold`: botões de 56 px com WhatsApp verde cheio (tela do produto). */
  look?: "default" | "bold";
}) {
  const router = useRouter();
  const noWaId = useId();
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
    <div className="flex flex-col gap-1.5">
      <div className={cn("flex gap-2", layout === "stack" ? "flex-col" : "flex-col sm:flex-row")}>
        <button
          type="button"
          disabled={chat.isPending}
          onClick={() => {
            if (!requireAuth("chat", profile.id)) return;
            chat.mutate();
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2.5 rounded-lg bg-primary px-4 font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60",
            look === "bold" ? "h-14 text-base" : "h-12 text-[15px]",
          )}
        >
          <MessageCircle className="size-5" aria-hidden />
          {chat.isPending ? "Abrindo…" : chatLabel}
        </button>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ type: "WHATSAPP_CLICK", ...target })}
            className={cn(
              "flex flex-1 items-center justify-center gap-2.5 rounded-lg px-4 font-bold",
              look === "bold"
                ? "h-14 bg-success text-base text-white hover:opacity-90"
                : "h-12 border border-success text-[15px] text-success-text hover:bg-success-soft",
            )}
          >
            <WhatsAppIcon className="size-5" />
            Chamar no WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            aria-describedby={noWaId}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 font-bold text-text-subtle disabled:cursor-not-allowed",
              look === "bold" ? "h-14 text-base" : "h-12 text-[15px]",
            )}
          >
            <WhatsAppIcon className="size-5" />
            WhatsApp não informado
          </button>
        )}
      </div>
      {!wa && (
        <p id={noWaId} className="text-xs text-text-muted">
          Este perfil ainda não informou um WhatsApp. Use o chat da EncontraÊ para falar com{" "}
          {profile.kind === "provider" ? "o prestador" : "a loja"}.
        </p>
      )}
    </div>
  );
}
