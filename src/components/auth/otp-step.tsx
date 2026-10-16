"use client";

import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import type { OtpChallenge } from "@/lib/api/auth";
import { useCountdown } from "@/hooks/use-countdown";
import { formatClock, OTP_LENGTH } from "@/lib/domain/validation";

import { ActionRow, linkCls, PrimaryButton, SecondaryButton } from "./auth-card";
import { FieldError } from "./auth-fields";
import { OtpBoxes } from "./otp-boxes";

type Notice = { kind: "error" | "ok" | "info"; text: string } | null;

/**
 * Passo de código de 6 dígitos, igual no cadastro e na recuperação de senha.
 * Os limites (5 erros, bloqueio de 15 min, reenvio após 60 s) são do servidor; aqui só se mostra.
 */
export function OtpStep({
  title,
  intro,
  gap,
  resendLabel = "Não recebeu o código?",
  initial,
  okLabel,
  verify,
  resend,
  onVerified,
  onBack,
  backLabel = "Voltar",
  submitLabel = "Verificar",
  extra,
}: {
  /** Título da tela (cadastro e recuperação); sem ele, só o texto de apoio (ex.: dentro de uma janela). */
  title?: string;
  /** Texto abaixo do título; recebe o desafio atual porque o canal pode mudar (SMS ↔ e-mail). */
  intro?: (challenge: OtpChallenge) => React.ReactNode;
  gap?: 10 | 12;
  resendLabel?: string;
  initial: OtpChallenge;
  okLabel: string;
  /** Confere o código; lança ApiError quando está errado. */
  verify: (challengeId: string, code: string) => Promise<void>;
  resend: (challengeId: string, channel?: "sms" | "email") => Promise<OtpChallenge>;
  onVerified: () => void;
  onBack: () => void;
  backLabel?: string;
  submitLabel?: string;
  /** Ex.: "Receber por e-mail" na recuperação. */
  extra?: { label: string; channel: "sms" | "email" };
}) {
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(initial.resendAt);

  const expiresIn = useCountdown(challenge.expiresAt);
  const resendIn = useCountdown(resendAt);
  const lockedIn = useCountdown(lockedUntil);
  const locked = lockedIn > 0;
  const expired = expiresIn === 0;
  const canVerify = code.length === OTP_LENGTH && !locked && !expired && !verified && !busy;

  const submit = async () => {
    if (!canVerify) return;
    setBusy(true);
    setNotice(null);
    try {
      await verify(challenge.challengeId, code);
      setVerified(true);
      setNotice({ kind: "ok", text: okLabel });
      window.setTimeout(onVerified, 600);
    } catch (e) {
      if (e instanceof ApiError && e.code === "OTP_INVALID") {
        const left = Number(e.fields?.attemptsLeft ?? NaN);
        setNotice({
          kind: "error",
          text: Number.isFinite(left)
            ? `Código incorreto. Você tem mais ${left} ${left === 1 ? "tentativa" : "tentativas"}.`
            : e.message,
        });
      } else if (e instanceof ApiError && e.code === "OTP_LOCKED") {
        const secs = Number(e.fields?.retryAfterSeconds ?? 900);
        setLockedUntil(new Date(Date.now() + secs * 1000).toISOString());
        setNotice({ kind: "error", text: "Muitas tentativas. Tente de novo em 15 minutos." });
      } else if (e instanceof ApiError && e.code === "OTP_EXPIRED") {
        setNotice({ kind: "error", text: "Código expirado. Peça um novo código para continuar." });
      } else {
        setNotice({
          kind: "error",
          text: e instanceof ApiError ? e.message : "Não foi possível conferir o código.",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const doResend = async (channel?: "sms" | "email") => {
    if (locked || busy) return;
    setBusy(true);
    try {
      const next = await resend(challenge.challengeId, channel);
      setChallenge(next);
      setResendAt(next.resendAt);
      setCode("");
      setNotice({ kind: "info", text: "Enviamos um novo código." });
      window.setTimeout(() => setNotice((n) => (n?.kind === "info" ? null : n)), 3000);
    } catch (e) {
      if (e instanceof ApiError && e.code === "OTP_RESEND_TOO_SOON") {
        const secs = Number(e.fields?.retryAfterSeconds ?? 60);
        setResendAt(new Date(Date.now() + secs * 1000).toISOString());
      }
      setNotice({
        kind: "error",
        text: e instanceof ApiError ? e.message : "Não foi possível enviar o código.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-6"
      aria-labelledby={title ? "otp-title" : undefined}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {title && (
          <h1 id="otp-title" className="text-2xl leading-8 font-bold text-text-strong">
            {title}
          </h1>
        )}
        <p className="text-sm leading-5 text-text-muted">
          {intro ? (
            intro(challenge)
          ) : (
            <>
              Enviamos um código por {challenge.channel === "sms" ? "SMS" : "e-mail"} para{" "}
              <b className="whitespace-nowrap text-text">{challenge.destinationMasked}</b>.
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <OtpBoxes
          value={code}
          onChange={(v) => {
            setCode(v);
            setNotice((n) => (n?.kind === "error" ? null : n));
          }}
          onEnter={() => void submit()}
          disabled={locked || expired || verified}
          tone={verified ? "ok" : notice?.kind === "error" || locked ? "error" : "idle"}
          label="Código de 6 dígitos"
          gap={gap}
          autoFocus
        />

        {!locked && !expired && !verified && (
          <span
            role="timer"
            aria-live="off"
            className="flex items-center gap-1 text-xs leading-4 text-text-muted"
          >
            <Clock3 className="size-3.5 shrink-0" aria-hidden />O código vale por 5 minutos · expira em{" "}
            <b className="font-bold text-text tabular-nums">{formatClock(expiresIn)}</b>
          </span>
        )}
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
          {notice?.kind === "error" && !locked && !expired && <FieldError>{notice.text}</FieldError>}
          {expired && !locked && !verified && (
            <Banner>
              <b>Código expirado.</b> Peça um novo código para continuar.
            </Banner>
          )}
          {locked && (
            <Banner>
              <b>Muitas tentativas.</b> Tente de novo em 15 minutos.
            </Banner>
          )}
          {notice?.kind === "ok" && (
            <span className="flex items-center gap-1 text-xs leading-4 font-semibold text-success-text">
              <CheckCircle2 className="size-3.5" aria-hidden />
              {notice.text}
            </span>
          )}
          {notice?.kind === "info" && !locked && (
            <span className="anim-rise flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs leading-4 font-semibold text-success-text">
              <CheckCircle2 className="size-3.5" aria-hidden />
              {notice.text}
            </span>
          )}
        </div>
      </div>

      {!locked && !verified && (
        <div className="-my-2 flex flex-wrap items-baseline justify-center gap-x-1 text-xs leading-4 text-text-muted">
          <span className="font-semibold">{resendLabel}</span>
          {resendIn > 0 ? (
            <span aria-live="off" className="font-bold text-text-subtle tabular-nums">
              Reenviar em {formatClock(resendIn)}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void doResend()}
              disabled={busy}
              className={`${linkCls} inline-flex min-h-6 items-center text-xs`}
            >
              Reenviar código
            </button>
          )}
          {extra && (
            <>
              <span aria-hidden className="text-text-subtle/60">
                ·
              </span>
              <button
                type="button"
                onClick={() => void doResend(extra.channel)}
                disabled={resendIn > 0 || busy}
                className={`${linkCls} inline-flex min-h-6 items-center text-xs disabled:text-text-subtle disabled:no-underline`}
              >
                {extra.label}
              </button>
            </>
          )}
        </div>
      )}

      <ActionRow>
        <SecondaryButton onClick={onBack}>{backLabel}</SecondaryButton>
        <PrimaryButton looksDisabled={!canVerify && !busy} loading={busy}>
          {busy ? "Verificando…" : submitLabel}
        </PrimaryButton>
      </ActionRow>
    </form>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs leading-4 text-danger-text"
    >
      <CircleAlert className="size-4 shrink-0 text-danger" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
