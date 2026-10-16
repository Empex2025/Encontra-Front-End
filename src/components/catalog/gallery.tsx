"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import type { Product } from "@/lib/api/catalog";

/**
 * Galeria (Documento de entrega › Produto): quadro grande de 600 px, setas em ciclo, contador "n / total" e
 * miniaturas de 96 px com a selecionada em âmbar. A 1ª pode ser vídeo: mostra a capa com o botão de tocar e,
 * ao clicar, o player de verdade.
 */
export function Gallery({ media, title }: { media: Product["media"]; title: string }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  if (media.length === 0)
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-surface-3 text-sm text-text-subtle">
        Sem foto
      </div>
    );
  const cur = media[i];
  const go = (d: number) => {
    setPlaying(null);
    setI((n) => (n + d + media.length) % media.length);
  };
  const isVideo = cur.type === "video";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-3">
        {isVideo && playing === cur.id ? (
          <video
            key={cur.id}
            src={cur.url}
            poster={cur.posterUrl ?? undefined}
            controls
            autoPlay
            playsInline
            aria-label={`Vídeo: ${title}`}
            className="size-full bg-black object-contain"
          />
        ) : (
          <>
            {(isVideo ? cur.posterUrl : cur.url) ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
              <img
                src={(isVideo ? cur.posterUrl : cur.url) ?? undefined}
                alt={`Foto ${i + 1} de ${media.length} do ${title}${isVideo ? " (vídeo)" : ""}`}
                className="size-full object-cover"
              />
            ) : (
              <span className="block size-full bg-navy" aria-hidden />
            )}
            {isVideo && (
              <button
                type="button"
                onClick={() => setPlaying(cur.id)}
                aria-label="Reproduzir vídeo"
                className="absolute top-1/2 left-1/2 flex size-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy/55 text-white hover:bg-navy/70"
              >
                <Play className="size-8 fill-white" aria-hidden />
              </button>
            )}
          </>
        )}
        {isVideo && cur.viewsText && playing !== cur.id && (
          <span
            aria-label={`Vídeo · ${cur.viewsText} visualizações`}
            className="absolute top-4 left-4 flex h-7 items-center gap-1.5 rounded-full bg-black/30 px-3 text-[13px] font-semibold text-white"
          >
            <Play className="size-3 fill-white" aria-hidden />
            {cur.viewsText}
          </span>
        )}
        <span className="pointer-events-none absolute top-4 right-4 flex h-7 items-center rounded-full bg-white px-3 text-[13px] font-bold text-navy">
          Produto
        </span>
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Imagem anterior"
              className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-raised hover:bg-navy-50"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima imagem"
              className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-raised hover:bg-navy-50"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <span className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
              {i + 1} / {media.length}
            </span>
          </>
        )}
      </div>
      {media.length > 1 && (
        <div role="tablist" aria-label="Galeria" className="flex gap-3 overflow-x-auto pb-1">
          {media.map((m, n) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={n === i}
              onClick={() => {
                setPlaying(null);
                setI(n);
              }}
              aria-label={`Ver mídia ${n + 1} de ${media.length}`}
              className={cn(
                "relative size-24 shrink-0 overflow-hidden rounded-lg border-2 bg-surface-3 transition-colors",
                n === i ? "border-accent" : "border-transparent",
              )}
            >
              {(m.type === "video" ? m.posterUrl : m.url) && (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura
                <img
                  src={(m.type === "video" ? m.posterUrl : m.url) ?? undefined}
                  alt=""
                  className="size-full object-cover"
                />
              )}
              {m.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Play className="size-5 fill-white text-white" aria-hidden />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
