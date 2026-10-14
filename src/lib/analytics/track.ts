/**
 * Registro de eventos de uso (docs/DIRETRIZES.md §7).
 *
 * - Nomes iguais ao enum EventType do back-end, para não haver tradução.
 * - Só o necessário: nada de nome, e-mail, telefone ou coordenadas do usuário. O back-end
 *   associa o usuário logado pela sessão e a região pelo local salvo, quando permitido.
 * - Visualizações repetidas do mesmo item na mesma aba, em 30 min, não são reenviadas.
 * - Um clique em WhatsApp, telefone ou rota é "contato iniciado", nunca "venda".
 * - Medição só com consentimento: sem escolha ainda ou com "Só os necessários", nenhum evento é enviado (LGPD).
 * - Falha no envio nunca atrapalha o uso: o evento é descartado em silêncio.
 */
import { API_BASE } from "@/lib/api/client";
import { readCookieChoice } from "@/lib/domain/cookie-consent";

export type EventType =
  | "SEARCH"
  | "SEARCH_RESULT_CLICK"
  | "FILTER_USED"
  | "MAP_OPEN"
  | "PRODUCT_VIEW"
  | "STORE_VIEW"
  | "SERVICE_VIEW"
  | "PRODUCT_FAVORITE"
  | "STORE_FAVORITE"
  | "WHATSAPP_CLICK"
  | "PHONE_CLICK"
  | "ROUTE_REQUESTED"
  | "AVAILABILITY_CHECK"
  | "PRODUCT_SHARED"
  | "ALERT_CREATED";

export type TargetType = "PRODUCT" | "STORE" | "PROVIDER" | "SERVICE" | "OFFER";

export type TrackEvent = {
  type: EventType;
  targetType?: TargetType;
  targetId?: string;
  /** Contexto mínimo e não pessoal: termo buscado, filtros, posição do resultado, origem do clique… */
  props?: Record<string, string | number | boolean | readonly string[] | null>;
};

const VIEW_TYPES = new Set<EventType>(["PRODUCT_VIEW", "STORE_VIEW", "SERVICE_VIEW"]);
const DEDUP_MS = 30 * 60 * 1000;
const SESSION_KEY = "encontrae_sessao";

function sessionId() {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

const recentViews = new Map<string, number>();

function isDuplicateView(e: TrackEvent) {
  if (!VIEW_TYPES.has(e.type) || !e.targetId) return false;
  const key = `${e.type}:${e.targetId}`;
  const now = Date.now();
  const last = recentViews.get(key);
  if (last && now - last < DEDUP_MS) return true;
  recentViews.set(key, now);
  return false;
}

export function track(event: TrackEvent) {
  if (typeof window === "undefined" || readCookieChoice() !== "all" || isDuplicateView(event)) return;
  const body = JSON.stringify({
    ...event,
    sessionId: sessionId(),
    occurredAt: new Date().toISOString(),
    path: window.location.pathname,
  });
  const url = `${API_BASE}/tracking`;
  try {
    const sent = navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch(url, {
        method: "POST",
        body,
        keepalive: true,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  } catch {}
}
