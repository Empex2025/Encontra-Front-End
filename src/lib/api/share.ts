import { z } from "zod";

import { api } from "./client";
import { searchItemSchema } from "./search";

/** Contrato: docs/contratos/lista-publica.md */
export const sharedListSchema = z.object({
  name: z.string(),
  /** Só o primeiro nome (ou nada): a lista pública nunca mostra identidade completa. */
  ownerFirstName: z.string().nullable(),
  updatedAt: z.string(),
  items: z.array(searchItemSchema),
});
export type SharedList = z.infer<typeof sharedListSchema>;

export const shareApi = {
  list: (token: string) => api(`/share/lists/${encodeURIComponent(token)}`, sharedListSchema),
};
