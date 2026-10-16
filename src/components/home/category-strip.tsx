import { Sparkles } from "lucide-react";
import Link from "next/link";

import { CATEGORIES } from "@/lib/domain/categories";
import { explorarHref } from "@/lib/domain/search-state";

const circle =
  "flex size-[72px] items-center justify-center rounded-full border bg-surface transition-colors";
const label = "text-[13px] leading-4 font-bold text-text-strong";

/**
 * Categorias da Home (protótipo): "Novidades" em destaque, um divisor e as 12 categorias (CAT12, ordem fixa).
 * Cada uma abre o Explorar já filtrado; "Novidades" abre o que é novo perto da pessoa.
 */
export function CategoryStrip() {
  return (
    <nav aria-label="Categorias" className="-mx-4 sm:mx-0">
      <ul className="flex items-start gap-1 overflow-x-auto px-4 pb-2 sm:px-0 xl:justify-between xl:overflow-visible">
        <li className="shrink-0">
          <Link
            href={explorarHref({ q: "", lens: "new", specialty: [], sort: "relevance" })}
            className="group flex w-[86px] flex-col items-center gap-2 text-center"
          >
            <span
              className={`${circle} border-2 border-accent bg-accent-soft group-hover:border-accent-hover`}
            >
              <Sparkles className="size-7 text-text-strong" aria-hidden />
            </span>
            <span className={label}>Novidades</span>
          </Link>
        </li>
        <li aria-hidden className="mt-2 h-14 w-px shrink-0 self-start bg-border" />
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                href={explorarHref({ q: "", cat: c.id, specialty: [], sort: "relevance" })}
                className="group flex w-[86px] flex-col items-center gap-2 text-center"
              >
                <span
                  className={`${circle} border-border group-hover:border-accent`}
                  style={{ color: c.colorVar }}
                >
                  <Icon className="size-7" aria-hidden />
                </span>
                <span className={label}>{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
