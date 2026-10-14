import { z } from "zod";

/** Endereço da API do back-end. Por padrão "/api/v1", repassado ao back-end pelo next.config (BACKEND_URL). */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

const TIMEOUT_MESSAGE = "Está demorando mais que o normal. Tente de novo.";

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
  /** Limite de espera em ms. Padrão: 8 s para leituras (GET); escrita não tem limite (pode ter funcionado). */
  timeoutMs?: number;
};

/** Regra do documento: depois de 8 s sem resposta, a tela mostra "algo deu errado" com "Tentar de novo". */
export const READ_TIMEOUT_MS = 8000;

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
  { body, query, headers, timeoutMs, ...init }: RequestOptions = {},
): Promise<T> {
  const limit = timeoutMs ?? ((init.method ?? "GET") === "GET" ? READ_TIMEOUT_MS : undefined);
  const ctrl = limit ? new AbortController() : undefined;
  let slow = false;
  const timer = ctrl
    ? setTimeout(() => {
        slow = true;
        ctrl.abort();
      }, limit)
    : undefined;
  const signal =
    ctrl && init.signal ? AbortSignal.any([ctrl.signal, init.signal]) : (ctrl?.signal ?? init.signal);
  const timedOut = () => slow && !init.signal?.aborted;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      credentials: "include",
      ...init,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    clearTimeout(timer);
    if (timedOut()) throw new ApiError(0, "TIMEOUT", TIMEOUT_MESSAGE);
    throw new ApiError(0, "NETWORK", "Sem conexão com o servidor. Verifique sua internet e tente de novo.");
  }

  if (res.status === 204) {
    clearTimeout(timer);
    return schema.parse(undefined);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    // corpo que não chegou a tempo é demora; corpo que não é JSON segue para o erro padrão abaixo
    if (timedOut()) throw new ApiError(0, "TIMEOUT", TIMEOUT_MESSAGE);
    data = undefined;
  } finally {
    clearTimeout(timer);
  }

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
