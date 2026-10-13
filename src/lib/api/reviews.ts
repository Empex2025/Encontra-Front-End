import { z } from "zod";

import { api } from "./client";

/** Contrato: docs/contratos/acompanhar.md › Avaliar */
export const REVIEW_TYPES = ["produto", "servico", "loja", "prestador"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const reviewTargetSchema = z.object({
  type: z.enum(REVIEW_TYPES),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  imageUrl: z.string().nullable(),
  neighborhood: z.string().nullable(),
  backHref: z.string(),
});
export type ReviewTarget = z.infer<typeof reviewTargetSchema>;

export const reviews = {
  target: (type: ReviewType, slug: string) =>
    api(`/review-targets/${type}/${encodeURIComponent(slug)}`, reviewTargetSchema),
  publish: (body: {
    targetType: ReviewType;
    targetId: string;
    rating: number;
    photoKeys: string[];
    videoKey?: string;
    text?: string;
    highlights: string[];
    extras?: { service?: number; response?: number };
    showName: boolean;
  }) => api("/reviews", z.object({ id: z.string(), status: z.literal("pending") }), { method: "POST", body }),
};
