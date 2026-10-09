import { z } from "zod";

/** Endereço da API do back-end. Por padrão "/api/v1", repassado ao back-end pelo next.config (BACKEND_URL). */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string()).optional(),
});

/** Erro no formato combinado com o back-end: { code, message, fields? }. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null | readonly string[]>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.set(key, String(value));
  }
  const qs = params.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
}

/**
 * Chamada à API validada por um schema Zod: o front nunca confia em dado sem conferir o formato.
 */
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  { body, query, headers, ...init }: RequestOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      credentials: "include",
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Sem conexão com o servidor. Verifique sua internet e tente de novo.");
  }

  if (res.status === 204) return schema.parse(undefined);

  const data: unknown = await res.json().catch(() => undefined);

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(data);
    if (parsed.success) {
      throw new ApiError(res.status, parsed.data.code, parsed.data.message, parsed.data.fields);
    }
    throw new ApiError(res.status, "UNKNOWN", "Algo deu errado. Tente de novo em alguns segundos.");
  }

  return schema.parse(data);
}

export const isUnauthorized = (e: unknown) => e instanceof ApiError && e.status === 401;
