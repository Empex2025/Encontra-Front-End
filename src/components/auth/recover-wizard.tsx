"use client";

import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { PasswordField, TextField } from "@/components/ui/text-field";
import { authApi, type OtpChallenge, type RecoveryChannels } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { isLoginIdentifier, isValidPassword, passwordChecks } from "@/lib/domain/validation";
import { routes } from "@/lib/routes";

import { AuthCard, FormError, PrimaryButton, SecondaryButton } from "./auth-card";
import { OtpStep } from "./otp-step";

type Step = 1 | 2 | 3 | 4;

/** Recuperar senha: identificar → código → senha nova → pronto (Documento de entrega › CadRecuperar). */
export function RecoverWizard() {
  const [step, setStep] = useState<Step>(1);
  const [login, setLogin] = useState("");
  const [tried, setTried] = useState(false);
  const [channels, setChannels] = useState<RecoveryChannels | null>(null);
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);

  const validLogin = isLoginIdentifier(login);
  const timer = useRef<number | undefined>(undefined);

  const loadChannels = async (value: string) => {
    setChannels(null);
    if (!isLoginIdentifier(value)) return;
    try {
      const r = await authApi.recoveryChannels(value.trim());
      setChannels(r.channels);
      if (!r.channels.some((c) => c.channel === channel)) setChannel(r.channels[0]?.channel ?? "sms");
    } catch {
      setChannels(null);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setError("");
    if (!validLogin || busy) return;
    setBusy(true);
    try {
      const c = await authApi.forgot({ login: login.trim(), channel });
      setChallenge(c);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o código. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const checks = passwordChecks(pass);
  const different = pass.length > 0 && confirm.length > 0 && pass === confirm;
  const allOk = isValidPassword(pass) && different;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!allOk || busy) return;
    setBusy(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword: pass, signOutOtherDevices: signOutOthers });
      setStep(4);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar a senha. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const top = (
    <div className="flex items-center justify-between text-sm">
      <Link
        href={routes.entrar}
        className="inline-flex h-10 items-center gap-1.5 font-semibold text-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para entrar
      </Link>
      {step < 4 && <span className="text-text-muted">Passo {step} de 3</span>}
    </div>
  );

  if (step === 1) {
    const shown = channels ?? [];
    return (
      <AuthCard title="Esqueceu a senha?" subtitle="Digite seu CPF ou e-mail para receber um código.">
        {top}
        <form onSubmit={send} noValidate className="flex flex-col gap-4">
          <TextField
            label="CPF ou e-mail"
            value={login}
            onChange={(e) => {
              const v = e.target.value.slice(0, 80);
              setLogin(v);
              window.clearTimeout(timer.current);
              timer.current = window.setTimeout(() => void loadChannels(v), 400);
            }}
            autoComplete="username"
            error={
              tried && !validLogin
                ? login.trim()
                  ? "Confira o CPF (11 números) ou o e-mail."
                  : "Digite seu CPF ou e-mail."
                : undefined
            }
          />
          {validLogin && shown.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-bold text-text-strong">Receber o código por</legend>
              {shown.map((c) => (
                <label
                  key={c.channel}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-lg border px-3 text-sm",
                    channel === c.channel ? "border-primary bg-selected" : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name="canal"
                    checked={channel === c.channel}
                    onChange={() => setChannel(c.channel)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="font-semibold text-text-strong">
                      {c.channel === "sms" ? "SMS" : "E-mail"}
                    </span>{" "}
                    · {c.destinationMasked}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {error && <FormError>{error}</FormError>}
          <PrimaryButton looksDisabled={!validLogin} loading={busy}>
            {busy ? "Enviando…" : "Enviar código"}
          </PrimaryButton>
          <p className="text-center text-sm text-text-muted">
            Não tem mais acesso a esse celular e e-mail?{" "}
            <Link href="/ajuda?aba=contato" className="font-semibold text-link hover:underline">
              Fale com o suporte
            </Link>
          </p>
        </form>
      </AuthCard>
    );
  }

  if (step === 2 && challenge) {
    const other = channels?.find((c) => c.channel !== challenge.channel);
    return (
      <AuthCard title="Digite o código" subtitle="Confirme que é você para criar uma senha nova.">
        {top}
        <OtpStep
          key={challenge.challengeId}
          initial={challenge}
          okLabel="Código confirmado"
          verify={async (challengeId, code) => {
            const r = await authApi.verifyReset({ challengeId, code });
            setResetToken(r.resetToken);
          }}
          resend={(challengeId, ch) => authApi.resend({ challengeId, channel: ch })}
          onVerified={() => setStep(3)}
          onBack={() => setStep(1)}
          submitLabel="Continuar"
          extra={
            other
              ? {
                  label: other.channel === "email" ? "Receber por e-mail" : "Receber por SMS",
                  channel: other.channel,
                }
              : undefined
          }
        />
      </AuthCard>
    );
  }

  if (step === 3) {
    const req = (ok: boolean, text: string) => (
      <li className={cn("flex items-center gap-2 text-sm", ok ? "text-success-text" : "text-text-muted")}>
        {ok ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <X className="size-4 text-danger-text" aria-hidden />
        )}
        <span>{text}</span>
        <span className="sr-only">{ok ? "atendido" : "não atendido"}</span>
      </li>
    );
    return (
      <AuthCard title="Crie uma senha nova">
        {top}
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <PasswordField
            label="Nova senha"
            value={pass}
            onChange={(e) => setPass(e.target.value.slice(0, 64))}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirme a nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.slice(0, 64))}
            autoComplete="new-password"
            error={confirm.length > 0 && pass !== confirm ? "As senhas não são iguais." : undefined}
          />
          <ul className="flex flex-col gap-1" aria-label="Requisitos da senha">
            {req(checks.length, "De 8 a 64 caracteres")}
            {req(checks.lettersAndNumbers, "Letras e números")}
            {req(different, "As duas senhas são iguais")}
          </ul>
          <p className="text-xs text-text-muted">A senha nova precisa ser diferente da antiga.</p>
          <label className="flex min-h-11 items-center gap-3 text-sm text-text-2">
            <input
              type="checkbox"
              checked={signOutOthers}
              onChange={(e) => setSignOutOthers(e.target.checked)}
              className="size-5 accent-[var(--primary)]"
            />
            Sair da conta nos outros aparelhos
          </label>
          {error && <FormError>{error}</FormError>}
          <PrimaryButton disabled={!allOk} loading={busy}>
            {busy ? "Salvando…" : "Salvar nova senha"}
          </PrimaryButton>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Senha alterada!">
      {top}
      <p role="status" className="text-base text-text-2">
        {signOutOthers
          ? "Pronto! Por segurança, saímos da sua conta nos outros aparelhos. Entre de novo com a senha nova."
          : "Pronto! Use a senha nova da próxima vez que entrar."}
      </p>
      <Link
        href={routes.entrar}
        className="flex h-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-on-primary hover:bg-primary-hover"
      >
        Entrar com a nova senha
      </Link>
      <SecondaryButton onClick={() => setStep(1)}>Usar outra conta</SecondaryButton>
    </AuthCard>
  );
}
