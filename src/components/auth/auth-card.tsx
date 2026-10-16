import { CircleAlert } from "lucide-react";

import { cn } from "@/components/ui/cn";

/**
 * Moldura das telas de entrada (artboards CadLogin, CadDados, CadCodigo, CadLocal, CadInteresses, CadPronto,
 * CadRecuperar e BoasVindas): página inteira com fundo, cartão branco central (raio 16, padding 32, gap 24,
 * sombra elevada) e, em algumas telas, o cartão amarelo deslocado atrás.
 */
export function AuthBackdrop({
  children,
  tone = "photo",
  footer,
}: {
  children: React.ReactNode;
  /** `photo`: cinza com véu (protótipo usa foto desfocada); `navy`: Boas-vindas. */
  tone?: "photo" | "navy";
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center justify-center px-4 py-10",
        tone === "navy" ? "bg-navy" : "bg-charcoal",
      )}
    >
      {tone === "photo" && <span aria-hidden className="absolute inset-0 bg-charcoal-900/35" />}
      <div className="relative flex w-full flex-col items-center">{children}</div>
      {footer && <p className="relative mt-10 text-center text-xs leading-4 text-white/85">{footer}</p>}
    </div>
  );
}

export function AuthPanel({
  width,
  offset,
  children,
  label,
  labelledBy,
}: {
  /** largura do cartão em px no desktop (440, 480, 520, 560, 588, 800) */
  width: number;
  /** cartão amarelo deslocado atrás: `true` (Entrar e Recuperar) ou `"welcome"` (Boas-vindas) */
  offset?: boolean | "welcome";
  children: React.ReactNode;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <div className="relative w-full" style={{ maxWidth: width }}>
      {offset && (
        <span
          aria-hidden
          className={cn(
            "absolute hidden rounded-2xl bg-amber sm:block",
            offset === "welcome"
              ? "-top-[39px] right-[34px] bottom-[54px] -left-11"
              : "top-6 right-[50px] -bottom-6 -left-[18px]",
          )}
        />
      )}
      <main
        id="conteudo"
        tabIndex={-1}
        aria-label={label}
        aria-labelledby={labelledBy}
        className="anim-rise relative flex flex-col gap-6 rounded-2xl bg-surface p-5 shadow-pop outline-none sm:p-8"
      >
        {children}
      </main>
    </div>
  );
}

/** "Etapa 1 de 4" + 4 barrinhas (amarelas até a etapa atual). */
export function StepMeter({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div className="flex flex-col items-end gap-1.5 pt-1.5">
      <span className="text-xs leading-4 font-semibold text-text-subtle">
        Etapa {current} de {total}
      </span>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label="Progresso do cadastro"
        className="flex gap-1"
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-1 w-6 rounded-full", i < current ? "bg-amber" : "bg-surface-3")} />
        ))}
      </div>
    </div>
  );
}

/** Cabeçalho das etapas 1, 3 e 4: título à esquerda, progresso à direita. */
export function StepHeader({
  id,
  title,
  subtitle,
  current,
}: {
  id?: string;
  title: string;
  subtitle: string;
  current: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 id={id} className="text-2xl leading-8 font-bold text-text-strong">
          {title}
        </h1>
        <p className="text-sm leading-5 text-text-muted">{subtitle}</p>
      </div>
      <StepMeter current={current} />
    </div>
  );
}

const btnBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm leading-5 font-semibold transition-colors";

export const primaryBtnCls = cn(btnBase, "bg-primary text-on-primary hover:bg-primary-hover");
export const disabledBtnCls = cn(btnBase, "bg-border text-text-subtle");
export const outlineBtnCls =
  "inline-flex h-11 min-w-[104px] items-center justify-center rounded-lg border-[1.5px] border-primary bg-surface px-5 text-sm font-semibold text-text-strong transition-colors hover:bg-selected dark:border-border-strong";
export const socialBtnCls =
  "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-surface text-sm font-semibold text-text-strong transition-colors hover:bg-selected dark:border-border-strong";
export const linkCls = "font-bold text-text-strong hover:underline";

/** Botão principal. `looksDisabled`: cinza, mas ainda clicável (o clique mostra os erros dos campos). */
export function PrimaryButton({
  children,
  disabled,
  type = "submit",
  onClick,
  loading,
  looksDisabled,
  wide,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  loading?: boolean;
  looksDisabled?: boolean;
  /** largura total (Entrar, Enviar código…) em vez de `min-w-[120px]` */
  wide?: boolean;
  className?: string;
}) {
  const off = disabled || loading || looksDisabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={looksDisabled || undefined}
      className={cn(
        off ? disabledBtnCls : primaryBtnCls,
        wide ? "w-full" : "min-w-[120px]",
        (disabled || loading) && "cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  return (
    <button type={type} onClick={onClick} className={outlineBtnCls}>
      {children}
    </button>
  );
}

/** Linha de rodapé do cartão: "Voltar/Cancelar" à esquerda, ação principal à direita. */
export function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 pt-2">{children}</div>;
}

/** Erro de servidor (faixa vermelha), com o mesmo vermelho dos erros de campo. */
export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs leading-4 text-danger-text"
    >
      <CircleAlert className="mt-px size-3.5 shrink-0 text-danger" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
