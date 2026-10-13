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
