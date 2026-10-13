export const WHEN_OPTIONS = [
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "week", label: "Esta semana" },
  { id: "flexible", label: "Sou flexível" },
] as const;
export type QuoteWhen = (typeof WHEN_OPTIONS)[number]["id"];

export const DETAILS_MAX = 400;

/** Validação do pedido de orçamento (Documento de entrega › Perfil do prestador). Retorna erros por campo. */
export function validateQuote(f: {
  serviceId: string | null;
  when: string;
  neighborhood: string;
  details: string;
  needsNeighborhood: boolean;
}): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.serviceId) e.serviceId = "Escolha o serviço.";
  if (!WHEN_OPTIONS.some((o) => o.id === f.when)) e.when = "Diga para quando você precisa.";
  if (f.needsNeighborhood && f.neighborhood.trim().length < 2) e.neighborhood = "Informe o seu bairro.";
  if (f.details.length > DETAILS_MAX) e.details = `Use até ${DETAILS_MAX} caracteres.`;
  return e;
}

/** Rascunho do pedido, guardado só nesta aba enquanto a pessoa entra na conta; volta uma vez e é apagado. */
export type QuoteDraft = {
  serviceId: string | null;
  when: QuoteWhen | "";
  neighborhood: string;
  details: string;
};
export const quoteDraftKey = (profileId: string) => `encontrae_rascunho_orcamento:${profileId}`;

export function saveQuoteDraft(profileId: string, d: QuoteDraft) {
  try {
    window.sessionStorage.setItem(quoteDraftKey(profileId), JSON.stringify(d));
  } catch {}
}

export function takeQuoteDraft(profileId: string): QuoteDraft | null {
  try {
    const raw = window.sessionStorage.getItem(quoteDraftKey(profileId));
    window.sessionStorage.removeItem(quoteDraftKey(profileId));
    const v = JSON.parse(raw ?? "null") as Partial<QuoteDraft> | null;
    if (!v || typeof v !== "object") return null;
    return {
      serviceId: typeof v.serviceId === "string" ? v.serviceId : null,
      when: WHEN_OPTIONS.some((o) => o.id === v.when) ? (v.when as QuoteWhen) : "",
      neighborhood: typeof v.neighborhood === "string" ? v.neighborhood.slice(0, 80) : "",
      details: typeof v.details === "string" ? v.details.slice(0, DETAILS_MAX) : "",
    };
  } catch {
    return null;
  }
}
