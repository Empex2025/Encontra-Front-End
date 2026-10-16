"use client";

import { Copy, ExternalLink, Eye, Flag, Link2, MessageCircle, Share, Share2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDismiss } from "@/components/ui/use-dismiss";
import { track } from "@/lib/analytics/track";

/**
 * Compartilhar: o link público é o endereço da própria página (/p, /l ou /s), sem nenhum dado de quem compartilha.
 * `report` leva à tela Denunciar.
 *
 * Variantes (Documento de entrega › Produto e Loja):
 * - `button` (padrão): botão com texto que abre uma janela.
 * - `icon`: círculo só com o ícone que abre o painel "Compartilhar este produto" (tela do produto).
 * - `pill`: pílula com o texto "Compartilhar" e o mesmo painel do `icon` (perfil do prestador).
 * - `menu`: botão redondo de ícone que abre o menu da loja (copiar link, ver como abre, denunciar).
 */
export function ShareButton({
  path,
  title,
  noun,
  report,
  trackTarget,
  label = "Compartilhar",
  className,
  trigger,
  variant = "button",
}: {
  path: string;
  title: string;
  /** "produto", "loja"… para o texto de "Link do produto copiado." */
  noun: string;
  report: string;
  trackTarget?: { targetType: "PRODUCT" | "STORE" | "PROVIDER"; targetId: string };
  label?: string;
  /** Troca só as classes do botão (ex.: botão sobre vídeo). */
  className?: string;
  /** Troca o botão inteiro: recebe a função que abre a janela de compartilhar. */
  trigger?: (open: () => void) => React.ReactNode;
  variant?: "button" | "icon" | "menu" | "pill";
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const toast = useToast();
  useDismiss(wrap, open && variant !== "button", () => setOpen(false));
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  const article = noun === "loja" || noun === "prestador" || noun === "oferta" ? "da" : "do";
  const reportLabel =
    noun === "produto"
      ? "Denunciar este anúncio"
      : noun === "loja"
        ? "Denunciar esta loja"
        : noun === "oferta"
          ? "Denunciar esta oferta"
          : "Denunciar este perfil";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast(`Link ${article} ${noun} copiado.`);
    } catch {
      toast("Não foi possível copiar. Selecione o link e copie à mão.", "info");
    }
    shared("copy");
    setOpen(false);
  };
  const shared = (via: string) => {
    if (trackTarget) track({ type: "PRODUCT_SHARED", ...trackTarget, props: { via } });
  };
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  if (variant !== "button") {
    return (
      <span ref={wrap} className="relative inline-flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={variant === "menu" ? "Mais opções" : label}
          className={cn(
            "flex items-center justify-center text-text-strong hover:bg-selected",
            variant === "icon" && "size-11 rounded-full bg-bg",
            variant === "menu" && "h-[38px] w-11 rounded-full border border-border bg-surface",
            variant === "pill" &&
              "h-10 gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[13px] font-bold",
          )}
        >
          {variant === "icon" && <Share2 className="size-5" aria-hidden />}
          {variant === "menu" && <Share className="size-[18px]" aria-hidden />}
          {variant === "pill" && (
            <>
              <Share2 className="size-4" aria-hidden />
              {label}
            </>
          )}
        </button>
        {open && variant !== "menu" && (
          <div
            role="menu"
            className="absolute top-[52px] right-0 z-40 flex w-[300px] max-w-[calc(100vw-32px)] flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 shadow-pop"
          >
            <span className="text-xs font-bold text-text-muted">Compartilhar este {noun}</span>
            <span className="flex h-9 items-center truncate rounded-lg border border-border bg-bg px-2.5 text-xs text-link">
              <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary bg-surface text-xs font-bold text-text-strong hover:bg-selected"
              >
                <Copy className="size-3.5" aria-hidden />
                Copiar link
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => shared("whatsapp")}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-success text-xs font-bold text-white hover:opacity-90"
              >
                <MessageCircle className="size-3.5" aria-hidden />
                WhatsApp
              </a>
            </div>
            <Link href={path} target="_blank" className="text-xs font-bold text-link hover:underline">
              Ver como abre para quem recebe ›
            </Link>
            <span className="h-px bg-border" aria-hidden />
            <Link href={report} className="text-xs font-semibold text-danger-text hover:underline">
              {reportLabel}
            </Link>
          </div>
        )}
        {open && variant === "menu" && (
          <div
            role="menu"
            className="absolute top-[52px] right-0 z-40 flex w-[260px] max-w-[calc(100vw-32px)] flex-col rounded-xl border border-border bg-surface p-2 shadow-pop"
          >
            <button
              type="button"
              role="menuitem"
              onClick={copy}
              className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-semibold text-text hover:bg-surface-2"
            >
              <Link2 className="size-4" aria-hidden />
              Copiar link {article} {noun}
            </button>
            <Link
              href={path}
              target="_blank"
              role="menuitem"
              className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-semibold text-text hover:bg-surface-2"
            >
              <Eye className="size-4" aria-hidden />
              Ver como abre para quem recebe
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => shared("whatsapp")}
              className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-semibold text-text hover:bg-surface-2"
            >
              <MessageCircle className="size-4" aria-hidden />
              Enviar pelo WhatsApp
            </a>
            <Link
              href={report}
              role="menuitem"
              className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-semibold text-danger-text hover:bg-surface-2"
            >
              <Flag className="size-4" aria-hidden />
              {reportLabel}
            </Link>
          </div>
        )}
      </span>
    );
  }

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ??
            "inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-semibold text-text-2 hover:bg-surface-2"
          }
        >
          <Share2 className="size-4" aria-hidden />
          {label}
        </button>
      )}
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
              href={waHref}
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
            {reportLabel}
          </Link>
        </Modal>
      )}
    </>
  );
}
