"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import type { Product } from "@/lib/api/catalog";

/** Galeria: mídia grande, setas em ciclo, contador "n / total" e miniaturas. A 1ª pode ser vídeo. */
export function Gallery({ media, title }: { media: Product["media"]; title: string }) {
  const [i, setI] = useState(0);
  if (media.length === 0)
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-surface-2 text-sm text-text-subtle">
        Sem foto
      </div>
    );
  const cur = media[i];
  const go = (d: number) => setI((n) => (n + d + media.length) % media.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-2">
        {cur.type === "video" ? (
          <video
            key={cur.id}
            src={cur.url}
            poster={cur.posterUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
            aria-label={`Vídeo: ${title}`}
            className="size-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
          <img
            src={cur.url}
            alt={`${title} — foto ${i + 1} de ${media.length}`}
            className="size-full object-contain"
          />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
          Produto
        </span>
        {cur.type === "video" && cur.viewsText && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            Vídeo · {cur.viewsText}
          </span>
        )}
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Mídia anterior"
              className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima mídia"
              className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {i + 1} / {media.length}
            </span>
          </>
        )}
      </div>
      {media.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, n) => (
            <li key={m.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={`Ver mídia ${n + 1} de ${media.length}`}
                aria-current={n === i}
                className={cn(
                  "relative size-16 overflow-hidden rounded-lg border-2 bg-surface-2",
                  n === i ? "border-primary" : "border-transparent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura */}
                <img
                  src={m.type === "video" ? (m.posterUrl ?? m.url) : m.url}
                  alt=""
                  className="size-full object-cover"
                />
                {m.type === "video" && (
                  <Play
                    className="absolute inset-0 m-auto size-5 fill-white text-white drop-shadow"
                    aria-hidden
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
