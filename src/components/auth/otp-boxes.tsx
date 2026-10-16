"use client";

import { useRef } from "react";

import { cn } from "@/components/ui/cn";
import { OTP_LENGTH, parseOtp } from "@/lib/domain/validation";

/** 6 caixas para o código: digitar avança, colar distribui, Backspace em caixa vazia volta. */
export function OtpBoxes({
  value,
  onChange,
  onEnter,
  disabled,
  tone = "idle",
  label,
  gap = 12,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  disabled?: boolean;
  tone?: "idle" | "error" | "ok";
  label: string;
  /** espaço entre as caixas em px (12 no cadastro, 10 na recuperação de senha) */
  gap?: 10 | 12;
  /** foca a 1ª caixa ao abrir a etapa (protótipo) */
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[Math.min(Math.max(i, 0), OTP_LENGTH - 1)]?.focus();

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex justify-center", gap === 10 ? "gap-2.5" : "gap-3")}
    >
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          inputMode="numeric"
          autoFocus={autoFocus && i === 0}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${i + 1} de ${OTP_LENGTH}`}
          disabled={disabled}
          maxLength={OTP_LENGTH}
          onChange={(e) => {
            const digits = parseOtp(e.target.value);
            if (digits.length === 0) {
              onChange(value.slice(0, i) + value.slice(i + 1));
              return;
            }
            // colar vários dígitos distribui a partir desta caixa
            const next = (value.slice(0, i) + digits).slice(0, OTP_LENGTH);
            onChange(next);
            focus(Math.min(i + digits.length, OTP_LENGTH - 1));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i]) {
              e.preventDefault();
              onChange(value.slice(0, Math.max(0, i - 1)));
              focus(i - 1);
            } else if (e.key === "ArrowLeft") focus(i - 1);
            else if (e.key === "ArrowRight") focus(i + 1);
            else if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "auth-field h-14 w-full max-w-[52px] min-w-0 flex-1 rounded-lg border bg-surface text-center text-[22px] font-bold text-text-strong transition-[border-color,box-shadow] outline-none focus:ring-[3px] focus:ring-selected",
            tone === "error" && "border-danger bg-danger-soft",
            tone === "ok" && "border-success bg-success-soft",
            tone === "idle" && "border-navy-300 focus:border-primary dark:border-border-strong",
          )}
        />
      ))}
    </div>
  );
}
