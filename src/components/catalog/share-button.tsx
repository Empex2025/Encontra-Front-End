"use client";

import { Copy, ExternalLink, Flag, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";

/**
 * Compartilhar: o link público é o endereço da própria página (/p, /l ou /s), sem nenhum dado de quem compartilha.
 * `report` leva à tela Denunciar.
 */
export function ShareButton({
  path,
  title,
  noun,
  report,
  trackTarget,
  label = "Compartilhar",
}: {
  path: string;
  title: string;
  /** "produto", "loja"… para o texto de "Link do produto copiado." */
  noun: string;
  report: string;
  trackTarget?: { targetType: "PRODUCT" | "STORE" | "PROVIDER"; targetId: string };
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast(`Link ${noun === "loja" || noun === "prestador" ? "da" : "do"} ${noun} copiado.`);
    } catch {
      toast("Não foi possível copiar. Selecione o link e copie à mão.", "info");
    }
    shared("copy");
  };
  const shared = (via: string) => {
    if (trackTarget) track({ type: "PRODUCT_SHARED", ...trackTarget, props: { via } });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-semibold text-text-2 hover:bg-surface-2"
      >
        <Share2 className="size-4" aria-hidden />
        {label}
      </button>
      {open && (
        <Modal title="Compartilhar" onClose={() => setOpen(false)}>
          <p className="truncate text-sm font-semibold text-text-strong">{title}</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-text-strong">Link</span>
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 rounded-lg border border-border-strong bg-surface-2 px-3 text-sm text-text"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={copy}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              <Copy className="size-4" aria-hidden />
              Copiar link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => shared("whatsapp")}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border-strong text-sm font-bold text-text-2 hover:bg-surface-2"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </div>
          <Link
            href={path}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline"
          >
            Ver como abre para quem recebe
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <Link
            href={report}
            className="inline-flex items-center gap-1 text-sm font-semibold text-danger-text hover:underline"
          >
            <Flag className="size-3.5" aria-hidden />
            Denunciar {noun === "produto" ? "este anúncio" : noun === "loja" ? "esta loja" : "este perfil"}
          </Link>
        </Modal>
      )}
    </>
  );
}
