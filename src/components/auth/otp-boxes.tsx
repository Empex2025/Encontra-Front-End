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
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  disabled?: boolean;
  tone?: "idle" | "error" | "ok";
  label: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[Math.min(Math.max(i, 0), OTP_LENGTH - 1)]?.focus();

  return (
    <div role="group" aria-label={label} className="flex justify-between gap-2">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          inputMode="numeric"
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
            "h-14 w-full min-w-0 rounded-lg border bg-surface text-center text-xl font-bold text-text-strong outline-none focus:ring-2 focus:ring-focus/40 disabled:opacity-60",
            tone === "error" && "border-danger",
            tone === "ok" && "border-success-text bg-success-soft",
            tone === "idle" && "border-border-strong focus:border-primary",
          )}
        />
      ))}
    </div>
  );
}
