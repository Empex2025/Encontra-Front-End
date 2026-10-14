"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import type { OtpChallenge } from "@/lib/api/auth";
import { useCountdown } from "@/hooks/use-countdown";
import { formatClock, OTP_LENGTH } from "@/lib/domain/validation";

import { FormError, PrimaryButton, SecondaryButton } from "./auth-card";
import { OtpBoxes } from "./otp-boxes";

type Notice = { kind: "error" | "ok" | "info"; text: string } | null;

/**
 * Passo de código de 6 dígitos, igual no cadastro e na recuperação de senha.
 * Os limites (5 erros, bloqueio de 15 min, reenvio após 60 s) são do servidor; aqui só se mostra.
 */
export function OtpStep({
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
      className="flex flex-col gap-4"
    >
      <p className="text-base text-text-muted">
        Enviamos um código por {challenge.channel === "sms" ? "SMS" : "e-mail"} para{" "}
        <strong className="text-text-strong">{challenge.destinationMasked}</strong>.
      </p>

      <OtpBoxes
        value={code}
        onChange={(v) => {
          setCode(v);
          setNotice((n) => (n?.kind === "error" ? null : n));
        }}
        onEnter={() => void submit()}
        disabled={locked || verified}
        tone={verified ? "ok" : notice?.kind === "error" ? "error" : "idle"}
        label="Código de 6 dígitos"
      />

      <p className="text-sm text-text-muted" aria-live="off">
        {expired ? "O código expirou." : `O código vale por 5 minutos · expira em ${formatClock(expiresIn)}`}
      </p>

      <div role="status" aria-live="polite" className="min-h-6">
        {notice?.kind === "error" && <FormError>{notice.text}</FormError>}
        {notice?.kind === "ok" && <p className="text-sm font-bold text-success-text">{notice.text}</p>}
        {notice?.kind === "info" && <p className="text-sm text-text-muted">{notice.text}</p>}
        {expired && !notice && !verified && (
          <p className="text-sm font-semibold text-danger-text">
            Código expirado. Peça um novo código para continuar.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
        <span>Não recebeu o código?</span>
        <button
          type="button"
          onClick={() => void doResend()}
          disabled={resendIn > 0 || locked || busy}
          className="h-10 font-semibold text-link hover:underline disabled:text-text-subtle disabled:no-underline"
        >
          {resendIn > 0 ? `Reenviar em ${formatClock(resendIn)}` : "Reenviar código"}
        </button>
        {extra && (
          <button
            type="button"
            onClick={() => void doResend(extra.channel)}
            disabled={resendIn > 0 || locked || busy}
            className="h-10 font-semibold text-link hover:underline disabled:text-text-subtle disabled:no-underline"
          >
            {extra.label}
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <SecondaryButton onClick={onBack}>{backLabel}</SecondaryButton>
        <div className="flex-1 [&>button]:w-full">
          <PrimaryButton disabled={!canVerify} loading={busy}>
            {busy ? "Verificando…" : submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
