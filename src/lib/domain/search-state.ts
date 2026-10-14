import { KINDS, type Kind, type Lens, LENSES, type ServiceMode, type Sort, SORTS } from "@/lib/api/search";

import { CATEGORY_IDS } from "./categories";

/** Estado do Explorar guardado na URL: dá para voltar, recarregar e compartilhar a mesma busca. */
export type ExplorarState = {
  q: string;
  cat?: string;
  lens?: Lens;
  kind?: Kind;
  serviceMode?: ServiceMode;
  specialty: string[];
  minRating?: number;
  sort: Sort;
};

const oneOf = <T extends string>(list: readonly T[], v: string | null): T | undefined =>
  v && (list as readonly string[]).includes(v) ? (v as T) : undefined;

export const MIN_RATING_FILTER = 4.8;

export function readExplorarState(p: URLSearchParams): ExplorarState {
  const q = (p.get("q") ?? "").trim().slice(0, 80);
  return {
    q,
    cat: oneOf(CATEGORY_IDS, p.get("cat")),
    lens: oneOf(LENSES, p.get("lente")),
    kind: q ? oneOf(KINDS, p.get("tipo")) : undefined,
    serviceMode: q ? oneOf(["local", "home"] as const, p.get("atende")) : undefined,
    specialty: q ? p.getAll("servico").slice(0, 10) : [],
    minRating: q && p.get("nota") === "48" ? MIN_RATING_FILTER : undefined,
    sort: (q && oneOf(SORTS, p.get("ordem"))) || "relevance",
  };
}

export function explorarHref(s: ExplorarState) {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.cat) p.set("cat", s.cat);
  if (s.lens) p.set("lente", s.lens);
  if (s.kind) p.set("tipo", s.kind);
  if (s.serviceMode) p.set("atende", s.serviceMode);
  s.specialty.forEach((x) => p.append("servico", x));
  if (s.minRating) p.set("nota", "48");
  if (s.sort !== "relevance") p.set("ordem", s.sort);
  const qs = p.toString();
  return `/explorar${qs ? `?${qs}` : ""}`;
}

export const hasRefinements = (s: ExplorarState) =>
  !!(s.kind || s.serviceMode || s.specialty.length || s.minRating);
