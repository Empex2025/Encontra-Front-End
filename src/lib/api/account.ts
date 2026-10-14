import { z } from "zod";

import { otpChallengeSchema } from "./auth";
import { api } from "./client";
import { radiusSchema } from "./schemas";

/** Contrato: docs/contratos/conta.md */
const none = z.undefined();
const seg = encodeURIComponent;
const nstr = z.string().nullable();
const count = z.number().int().nonnegative();

/* ---------- Perfil ---------- */

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  phoneVerified: z.boolean(),
  /** Sempre mascarado pelo servidor (ex.: "***.456.789-**"). Nunca editável. */
  cpfMasked: z.string(),
  createdAt: z.string(),
  avatarUrl: nstr.optional(),
  /** "first_initial" = "Maria S." · "full" = "Maria Souza" */
  reviewNameStyle: z.enum(["first_initial", "full"]),
  privacy: z.object({
    showNeighborhood: z.boolean(),
    keepSearchHistory: z.boolean(),
    suggestByInterests: z.boolean(),
  }),
  settings: z.object({
    whatsappOpen: z.enum(["app", "web"]),
    autoplay: z.boolean(),
    sounds: z.boolean(),
  }),
  hasBusiness: z.boolean(),
  /** Exclusão agendada: data em que a conta some, ou null. */
  deletionScheduledFor: nstr,
});
export type Profile = z.infer<typeof profileSchema>;

export type ProfilePatch = {
  name?: string;
  email?: string;
  reviewNameStyle?: Profile["reviewNameStyle"];
  privacy?: Partial<Profile["privacy"]>;
  settings?: Partial<Profile["settings"]>;
};

/* ---------- Endereços ---------- */

export const addressSchema = z.object({
  id: z.string(),
  /** Apelido (até 30). Vazio vira "Outro" no servidor. */
  label: z.string(),
  cep: z.string(),
  street: z.string(),
  number: nstr.optional(),
  neighborhood: nstr,
  city: z.string(),
  state: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  main: z.boolean(),
});
export type Address = z.infer<typeof addressSchema>;
const addressesSchema = z.object({ items: z.array(addressSchema) });
export type AddressInput = {
  label: string;
  cep: string;
  street: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  main?: boolean;
};

/* ---------- Sessões ---------- */

export const sessionRowSchema = z.object({
  id: z.string(),
  device: z.string(),
  place: nstr,
  lastSeenAt: z.string(),
  current: z.boolean(),
});
export type SessionRow = z.infer<typeof sessionRowSchema>;
const sessionsSchema = z.object({ items: z.array(sessionRowSchema) });

/* ---------- Histórico de buscas, exportação, exclusão ---------- */

const historyInfoSchema = z.object({ count, days: z.number().int().positive() });
const exportSchema = z.object({ requestedAt: z.string(), deliveryDays: z.number().int().positive() });
const deletionSchema = z.object({ scheduledFor: z.string() });
export const DELETION_REASONS = [
  "Não uso mais",
  "Recebo avisos demais",
  "Prefiro outra plataforma",
  "Preocupação com privacidade",
  "Não encontrei o que procurava",
  "Outro motivo",
] as const;

/* ---------- Ajuda ---------- */

export const faqCategorySchema = z.object({ id: z.string(), name: z.string(), count });
export const faqItemSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  question: z.string(),
  answer: z.string(),
});
export type FaqItem = z.infer<typeof faqItemSchema>;
const faqSchema = z.object({
  categories: z.array(faqCategorySchema),
  items: z.array(faqItemSchema),
  channels: z.object({
    chat: z.string(),
    email: z.string(),
    whatsapp: z.string(),
  }),
});
export type Faq = z.infer<typeof faqSchema>;
const protocolSchema = z.object({ protocol: z.string() });

export const CONTACT_SUBJECTS = [
  "Problema com minha conta",
  "Problema com uma loja ou prestador",
  "Dúvida sobre como funciona",
  "Sugestão ou elogio",
  "Outro assunto",
] as const;

/* ---------- Institucional e denúncia ---------- */

export const legalDocSchema = z.object({
  doc: z.string(),
  title: z.string(),
  version: z.string(),
  updatedAt: z.string(),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })),
});
export type LegalDoc = z.infer<typeof legalDocSchema>;
const legalIndexSchema = z.object({
  items: z.array(z.object({ doc: z.string(), title: z.string() })),
});

export const REPORT_TYPES = [
  "loja",
  "produto",
  "avaliacao",
  "story",
  "live",
  "evento",
  "lista",
  "prestador",
  "outro",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const REPORT_REASONS = [
  "Golpe ou fraude",
  "Preço ou oferta enganosa",
  "Produto proibido",
  "Conteúdo ofensivo",
  "Informação falsa",
  "Outro",
] as const;
export const reportTargetSchema = z.object({ name: z.string() });

/* ---------- Sistema ---------- */

export const statusSchema = z.object({
  state: z.enum(["ok", "maintenance"]),
  until: nstr.optional(),
  message: nstr.optional(),
});
export type SystemStatus = z.infer<typeof statusSchema>;

export const account = {
  profile: () => api("/me/profile", profileSchema),
  saveProfile: (body: ProfilePatch) => api("/me", profileSchema, { method: "PATCH", body }),
  sendPhoneCode: (phone: string) =>
    api("/auth/otp/send", otpChallengeSchema, { method: "POST", body: { purpose: "change_phone", phone } }),
  verifyPhoneCode: (body: { challengeId: string; code: string }) =>
    api("/auth/otp/verify", profileSchema, { method: "POST", body }),

  addresses: () => api("/me/addresses", addressesSchema),
  addAddress: (body: AddressInput) => api("/me/addresses", addressSchema, { method: "POST", body }),
  updateAddress: (id: string, body: Partial<Pick<AddressInput, "label" | "main">>) =>
    api(`/me/addresses/${seg(id)}`, addressSchema, { method: "PATCH", body }),
  removeAddress: (id: string) => api(`/me/addresses/${seg(id)}`, none, { method: "DELETE" }),
  saveRadius: (radiusKm: number) =>
    api("/me/location", z.object({ radiusKm: radiusSchema }).passthrough(), {
      method: "PUT",
      body: { radiusKm },
    }),

  interests: () => api("/me/interests", z.object({ categoryIds: z.array(z.string()) })),
  saveInterests: (categoryIds: string[]) =>
    api("/me/interests", none, { method: "PUT", body: { categoryIds } }),

  sessions: () => api("/me/sessions", sessionsSchema),
  endSession: (id: string) => api(`/me/sessions/${seg(id)}`, none, { method: "DELETE" }),
  endOtherSessions: () => api("/me/sessions", none, { method: "DELETE", query: { except: "current" } }),
  logout: (all = false) => api("/auth/logout", none, { method: "POST", body: { all } }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api("/me/password", none, { method: "PUT", body }),

  searchHistory: () => api("/me/search-history", historyInfoSchema),
  clearSearchHistory: () => api("/me/search-history", none, { method: "DELETE" }),
  requestExport: () => api("/me/export", exportSchema, { method: "POST" }),
  scheduleDeletion: (body: { password: string; reason?: string }) =>
    api("/me/deletion", deletionSchema, { method: "POST", body }),
  cancelDeletion: () => api("/me/deletion", none, { method: "DELETE" }),
};

export const help = {
  faq: () => api("/help/faq", faqSchema),
  helpful: (id: string, value: boolean) =>
    api(`/help/faq/${seg(id)}/feedback`, none, { method: "POST", body: { helpful: value } }),
  unhelpful: (id: string, comment: string) =>
    api(`/help/faq/${seg(id)}/feedback`, protocolSchema, {
      method: "POST",
      body: { helpful: false, comment },
    }),
  contact: (body: { subject: string; message: string; replyEmail: string; imageKey?: string }) =>
    api("/help/contact", protocolSchema, { method: "POST", body }),
};

export const legal = {
  index: () => api("/legal", legalIndexSchema),
  doc: (doc: string) => api(`/legal/${seg(doc)}`, legalDocSchema),
};

export const reports = {
  target: (type: ReportType, id: string) =>
    api("/reports/target", reportTargetSchema, { query: { type, id } }),
  send: (body: {
    type: ReportType;
    targetId: string | null;
    targetName: string | null;
    reason: string;
    description: string;
  }) => api("/reports", protocolSchema, { method: "POST", body }),
};

export const system = {
  status: () => api("/status", statusSchema),
  notifyWhenBack: (email?: string) =>
    api("/status/notify", none, { method: "POST", body: email ? { email } : {} }),
};
