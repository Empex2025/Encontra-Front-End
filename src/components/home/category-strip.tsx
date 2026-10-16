import { Sparkles } from "lucide-react";
import Link from "next/link";

import { CATEGORIES } from "@/lib/domain/categories";
import { explorarHref } from "@/lib/domain/search-state";

/**
 * "Novidades" + as 12 categorias (CAT12, ordem fixa) em círculos, como no protótipo. Cada uma abre o Explorar
 * já filtrado; "Novidades" abre a lente de novidades.
 */
export function CategoryStrip() {
  return (
    <nav aria-label="Categorias" className="-mx-4 sm:mx-0">
      <ul className="flex items-start gap-0 overflow-x-auto px-4 pb-2 sm:justify-between sm:px-0">
        <li className="flex shrink-0 items-start gap-3">
          <Link
            href={explorarHref({ q: "", lens: "new", specialty: [], sort: "relevance" })}
            className="flex w-[88px] flex-col items-center gap-2 text-center text-sm leading-4 font-bold text-text-strong"
          >
            <span className="flex size-[72px] items-center justify-center rounded-full border-2 border-accent bg-accent-soft text-accent-text">
              <Sparkles className="size-7" aria-hidden />
            </span>
            Novidades
          </Link>
          <span aria-hidden className="mt-2 hidden h-14 w-px bg-border sm:block" />
        </li>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                href={explorarHref({ q: "", cat: c.id, specialty: [], sort: "relevance" })}
                className="flex w-[88px] flex-col items-center gap-2 text-center text-sm leading-4 font-bold text-text-strong"
              >
                <span
                  className="flex size-[72px] items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-2"
                  style={{ color: c.colorVar }}
                >
                  <Icon className="size-7" aria-hidden />
                </span>
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
