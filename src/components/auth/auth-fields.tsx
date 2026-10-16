"use client";

import { Check, CircleAlert, Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/components/ui/cn";

/**
 * Campos das telas de entrada, com as medidas do protótipo: rótulo 12/16 em negrito, campo de 44 px com raio 8,
 * borda navy-300, foco com anel de 3 px, erro com ícone e texto de 12/16.
 */
const frame =
  "border bg-surface text-sm leading-5 text-text transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-selected";
const borderOk = "border-navy-300 dark:border-border-strong";

export const authInputCls = (error?: boolean) =>
  cn(
    "auth-field h-11 w-full rounded-lg px-3 outline-none placeholder:text-text-subtle/60",
    frame,
    "focus:border-primary focus:ring-[3px] focus:ring-selected",
    error ? "border-danger" : borderOk,
  );

export const authLabelCls = "text-xs leading-4 font-semibold text-text-2";

export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <span id={id} role="alert" className="flex items-center gap-1 text-xs leading-4 text-danger-text">
      <CircleAlert className="size-3.5 shrink-0 text-danger" aria-hidden />
      {children}
    </span>
  );
}

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  label: React.ReactNode;
  error?: string;
  /** texto discreto ao lado do rótulo, ex.: "(opcional)" */
  note?: string;
  /** linha de ajuda abaixo do campo (ex.: "Mínimo de 8 caracteres") */
  hint?: React.ReactNode;
  hintTone?: "neutral" | "ok" | "bad";
  inputRef?: React.Ref<HTMLInputElement>;
};

const hintCls = (tone: "neutral" | "ok" | "bad") =>
  cn(
    "text-xs leading-4",
    tone === "ok" ? "text-success-text" : tone === "bad" ? "text-danger-text" : "text-text-subtle",
  );

export function AuthTextField({
  label,
  note,
  error,
  hint,
  hintTone = "neutral",
  inputRef,
  ...rest
}: FieldProps) {
  const id = useId();
  const msg = `${id}-msg`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={authLabelCls}>
        {label}
        {note && <span className="font-normal text-text-subtle"> {note}</span>}
      </label>
      <input
        id={id}
        ref={inputRef}
        aria-invalid={!!error}
        aria-describedby={error || hint ? msg : undefined}
        className={authInputCls(!!error)}
        {...rest}
      />
      {error ? (
        <FieldError id={msg}>{error}</FieldError>
      ) : (
        hint && (
          <span id={msg} className={hintCls(hintTone)}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

export function AuthPasswordField({
  label,
  error,
  hint,
  hintTone = "neutral",
  ...rest
}: Omit<FieldProps, "note" | "inputRef">) {
  const id = useId();
  const msg = `${id}-msg`;
  const [shown, setShown] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={authLabelCls}>
        {label}
      </label>
      <div
        className={cn(
          "flex h-11 items-stretch overflow-hidden rounded-lg",
          frame,
          error ? "border-danger" : borderOk,
        )}
      >
        <input
          id={id}
          type={shown ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error || hint ? msg : undefined}
          className="auth-field min-w-0 flex-1 bg-transparent px-3 text-sm text-text outline-none placeholder:text-text-subtle/60"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={shown}
          className="flex w-11 items-center justify-center text-text-muted hover:text-text-strong"
        >
          {shown ? (
            <EyeOff className="size-[18px]" aria-hidden />
          ) : (
            <Eye className="size-[18px]" aria-hidden />
          )}
        </button>
      </div>
      {error ? (
        <FieldError id={msg}>{error}</FieldError>
      ) : (
        hint && (
          <span id={msg} className={hintCls(hintTone)}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

/** Caixa de marcação de 18 px (protótipo: botão `role="checkbox"` navy com ✓). */
export function AuthCheckbox({
  checked,
  onChange,
  invalid,
  size = 18,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  invalid?: boolean;
  size?: 18 | 20;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded border-[1.5px] text-on-primary after:absolute after:-inset-3 after:content-['']",
        size === 20 ? "size-5" : "size-[18px]",
        checked
          ? "border-primary bg-primary"
          : invalid
            ? "border-danger bg-surface"
            : "border-navy-300 bg-surface dark:border-border-strong",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3.5} aria-hidden />}
    </button>
  );
}
