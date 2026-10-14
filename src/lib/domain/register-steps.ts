/** Etapas do cadastro; cada uma vive no endereço (`/cadastro?etapa=…`) para o botão voltar do navegador funcionar. */
export type RegisterStep = "dados" | "codigo" | "local" | "interesses" | "pronto";

const STEPS: readonly RegisterStep[] = ["dados", "codigo", "local", "interesses", "pronto"];

export const registerStepHref = (step: RegisterStep) =>
  step === "dados" ? "/cadastro" : `/cadastro?etapa=${step}`;

/**
 * Etapa a mostrar para o que veio no endereço. Etapa que depende de algo que não existe mais
 * (página recarregada, link colado) cai na mais próxima que ainda faz sentido.
 * - O código só existe enquanto o desafio está na memória.
 * - A conta nasce quando o código é confirmado: depois disso não há mais volta para o código.
 */
export function resolveRegisterStep(
  wanted: string | null,
  ctx: { hasChallenge: boolean; signedIn: boolean },
): RegisterStep {
  const step = STEPS.find((s) => s === wanted) ?? "dados";
  if (step === "dados") return "dados";
  if (step === "codigo") return ctx.signedIn ? "local" : ctx.hasChallenge ? "codigo" : "dados";
  return ctx.signedIn ? step : "dados";
}
