import { isValidEmail, onlyDigits } from "./validation";

/** Regras de Minha Conta (Documento de entrega › Fluxo 5). Textos de erro são os do documento. */

export const NAME_MAX = 60;
export const EMAIL_MAX = 80;
export const PHONE_MAX = 16;
export const ADDRESS_LABEL_MAX = 30;
export const MIN_INTERESTS = 3;

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0][0];
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? "");
  return (a + b).toUpperCase();
};

export type ProfileErrors = { name?: string; email?: string; phone?: string };

export function validateProfile(v: { name: string; email: string }): ProfileErrors {
  const e: ProfileErrors = {};
  const name = v.name.trim();
  if (name.length > NAME_MAX || name.split(/\s+/).filter(Boolean).length < 2)
    e.name = "Escreva nome e sobrenome.";
  if (!isValidEmail(v.email.trim())) e.email = "Confira o e-mail.";
  return e;
}

/** Aceita só dígitos, parênteses, espaço e hífen; no máximo 16 caracteres. */
export const cleanPhoneInput = (v: string) => v.replace(/[^\d()\s-]/g, "").slice(0, PHONE_MAX);
export const validatePhone = (v: string) => (onlyDigits(v).length >= 10 ? null : "Digite o celular com DDD.");

export const profileChanged = (a: { name: string; email: string }, b: { name: string; email: string }) =>
  a.name.trim() !== b.name.trim() || a.email.trim() !== b.email.trim();

export const validateNewAddress = (v: { cep: string; street: string }) =>
  onlyDigits(v.cep).length === 8 && v.street.trim() ? null : "Preencha CEP e endereço.";

export const canRemoveAddress = (total: number) => total > 1;
export const LAST_ADDRESS_MSG = "Mantenha pelo menos um endereço.";

/** Quem vira principal quando a principal é removida: o primeiro que sobrar. */
export function afterRemoval<T extends { id: string; main: boolean }>(list: T[], id: string): T[] {
  const rest = list.filter((a) => a.id !== id);
  if (rest.length > 0 && !rest.some((a) => a.main)) rest[0] = { ...rest[0], main: true };
  return rest;
}

export const interestsError = (n: number) => (n < MIN_INTERESTS ? "Mantenha pelo menos 3 interesses." : null);

export function validateDeletion(v: { password: string; confirmed: boolean }) {
  const e: { password?: string; confirmed?: string } = {};
  if (!v.password) e.password = "Digite sua senha para confirmar.";
  if (!v.confirmed) e.confirmed = "Marque a caixa para confirmar.";
  return e;
}

/** Data em que a conta some: hoje + 30 dias, por extenso. */
export function deletionDate(from: Date, days = 30) {
  const d = new Date(from.getTime() + days * 86_400_000);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------- Ajuda ---------- */

/** Sem acento e sem diferença de maiúscula, para a busca da Central de Ajuda. */
export const normalizeText = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Com texto na busca, a categoria é ignorada e a procura é em pergunta + resposta. */
export function filterFaq<T extends { categoryId: string; question: string; answer: string }>(
  items: T[],
  query: string,
  categoryId: string | null,
): T[] {
  const q = normalizeText(query);
  if (q) return items.filter((i) => normalizeText(`${i.question} ${i.answer}`).includes(q));
  return categoryId ? items.filter((i) => i.categoryId === categoryId) : items;
}

export function validateContact(v: { subject: string; message: string }) {
  const e: { subject?: string; message?: string } = {};
  if (!v.subject) e.subject = "Escolha um assunto.";
  const len = v.message.trim().length;
  if (len < 10 || len > 1000) e.message = "Escreva pelo menos 10 caracteres.";
  return e;
}

/* ---------- Denunciar ---------- */

export function validateReport(v: { type: string; name: string; reason: string; description: string }) {
  const e: { type?: string; name?: string; reason?: string; description?: string } = {};
  if (!v.type) e.type = "Escolha o que você quer denunciar.";
  if (v.type !== "outro" && v.name.trim().length < 2) e.name = "Informe o nome.";
  if (!v.reason) e.reason = "Escolha o motivo.";
  const len = v.description.trim().length;
  if (len < 10 || len > 1000) e.description = "Descreva com pelo menos 10 caracteres.";
  return e;
}

/** Tipo da URL (?tipo=) → tipo do formulário. */
export const reportTypeFromParam = (p: string | null | undefined) =>
  (["produto", "loja", "prestador", "avaliacao", "story", "live", "evento"] as const).includes(p as never) ? (p as string) : "";
