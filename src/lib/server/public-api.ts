import type { z } from "zod";

/**
 * Leitura de dados públicos no servidor (prévia de links, título da página, 404 de verdade).
 * Endereço do back-end: BACKEND_URL (o mesmo do rewrite). Sem ele, ou com o back-end fora do ar, devolve "error":
 * a página continua funcionando pelo navegador e só perde a prévia. Nunca envia cookies: só dados públicos.
 */
export type PublicResult<T> = { kind: "ok"; data: T } | { kind: "notfound" } | { kind: "error" };

export async function publicGet<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
): Promise<PublicResult<z.infer<S>>> {
  const base = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!base) return { kind: "error" };
  try {
    const res = await fetch(`${base}/api/v1${path}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (res.status === 404) return { kind: "notfound" };
    if (!res.ok) return { kind: "error" };
    const parsed = schema.safeParse(await res.json());
    return parsed.success ? { kind: "ok", data: parsed.data } : { kind: "error" };
  } catch {
    return { kind: "error" };
  }
}
