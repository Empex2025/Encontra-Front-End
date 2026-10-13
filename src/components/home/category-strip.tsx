import Link from "next/link";

import { CATEGORIES } from "@/lib/domain/categories";
import { explorarHref } from "@/lib/domain/search-state";

/** As 12 categorias (CAT12, ordem fixa). Cada uma abre o Explorar já filtrado. */
export function CategoryStrip() {
  return (
    <nav aria-label="Categorias" className="-mx-4 sm:mx-0">
      <ul className="flex gap-2 overflow-x-auto px-4 pb-2 sm:flex-wrap sm:overflow-visible sm:px-0">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                href={explorarHref({ q: "", cat: c.id, specialty: [], sort: "relevance" })}
                className="flex w-24 flex-col items-center gap-1.5 rounded-2xl p-2 text-center text-xs font-semibold text-text-2 hover:bg-surface-2"
              >
                <span
                  className="flex size-14 items-center justify-center rounded-2xl bg-surface-2"
                  style={{ color: c.colorVar }}
                >
                  <Icon className="size-6" aria-hidden />
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
