import { z } from "zod";

import { api } from "./client";

/** Contrato: docs/contratos/acompanhar.md › Conversas */
const none = z.undefined();
const nstr = z.string().nullable();
const seg = encodeURIComponent;

const profileRef = z.object({
  id: z.string(),
  slug: z.string(),
  kind: z.enum(["store", "provider"]),
  name: z.string(),
  avatarUrl: nstr,
});

export const conversationSchema = z.object({
  id: z.string(),
  profile: profileRef,
  online: z.boolean().optional(),
  context: nstr,
  last: z.object({ text: nstr, hasImage: z.boolean(), mine: z.boolean(), at: z.string() }).nullable(),
  unread: z.number().int().nonnegative(),
  muted: z.boolean(),
  blocked: z.boolean(),
});
export type Conversation = z.infer<typeof conversationSchema>;

const listSchema = z.object({
  items: z.array(conversationSchema),
  unreadTotal: z.number().int().nonnegative(),
});

export const conversationDetailSchema = conversationSchema.extend({
  product: z
    .object({ slug: z.string(), title: z.string(), priceCents: z.number().int().nullable(), imageUrl: nstr })
    .nullable(),
  status: z.object({ online: z.boolean(), responseText: nstr }),
  whatsapp: nstr,
  profileHref: z.string(),
  /** Rascunho vindo de outra tela; o servidor entrega uma única vez. */
  draft: nstr.optional(),
});
export type ConversationDetail = z.infer<typeof conversationDetailSchema>;

export const messageSchema = z.object({
  id: z.string(),
  mine: z.boolean(),
  text: nstr,
  imageUrl: nstr,
  at: z.string(),
});
export type Message = z.infer<typeof messageSchema>;
const messagesSchema = z.object({ items: z.array(messageSchema), hasMore: z.boolean() });

const presignSchema = z.object({ uploadUrl: z.string(), key: z.string() });

export const chat = {
  list: (q: { q: string; unread: boolean }) =>
    api("/conversations", listSchema, { query: { q: q.q || undefined, unread: q.unread ? 1 : undefined } }),
  detail: (id: string) => api(`/conversations/${seg(id)}`, conversationDetailSchema),
  messages: (id: string, before?: string) =>
    api(`/conversations/${seg(id)}/messages`, messagesSchema, { query: { before } }),
  send: (id: string, body: { text?: string; imageKey?: string }) =>
    api(`/conversations/${seg(id)}/messages`, messageSchema, { method: "POST", body }),
  mute: (id: string, muted: boolean) =>
    api(`/conversations/${seg(id)}/mute`, none, { method: "PUT", body: { muted } }),
  block: (id: string, blocked: boolean) =>
    api(`/conversations/${seg(id)}/block`, none, { method: "PUT", body: { blocked } }),
  remove: (id: string) => api(`/conversations/${seg(id)}`, none, { method: "DELETE" }),
  report: (body: { conversationId: string; reason: string; details?: string; alsoBlock: boolean }) =>
    api("/reports", none, { method: "POST", body }),
  presign: (purpose: "chat" | "review" | "help", file: { type: string; size: number }) =>
    api("/uploads/presign", presignSchema, {
      method: "POST",
      body: { purpose, contentType: file.type, size: file.size },
    }),
};

/** Envia o arquivo direto ao armazenamento (URL assinada) e devolve a chave para a mensagem/avaliação. */
export async function uploadFile(purpose: "chat" | "review" | "help", file: File): Promise<string> {
  const { uploadUrl, key } = await chat.presign(purpose, file);
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!res.ok) throw new Error("Não foi possível enviar o arquivo. Tente de novo.");
  return key;
}
