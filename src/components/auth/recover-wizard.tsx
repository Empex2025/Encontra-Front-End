"use client";

import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { authApi, type OtpChallenge, type RecoveryChannels } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { isLoginIdentifier, isValidPassword, passwordChecks } from "@/lib/domain/validation";
import { routes } from "@/lib/routes";

import { AuthBackdrop, AuthPanel, FormError, linkCls, primaryBtnCls, PrimaryButton } from "./auth-card";
import { AuthCheckbox, AuthPasswordField, AuthTextField } from "./auth-fields";
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
    <div className="flex items-center justify-between">
      <Link href={routes.entrar} className={`${linkCls} inline-flex min-h-6 items-center text-[13px]`}>
        ← Voltar para entrar
      </Link>
      {step < 4 && (
        <span className="text-xs leading-4 font-semibold text-text-subtle">Passo {step} de 3</span>
      )}
    </div>
  );

  const frame = (children: React.ReactNode, labelledBy = "recuperar-title") => (
    <AuthBackdrop>
      <AuthPanel width={480} offset labelledBy={labelledBy}>
        {top}
        {children}
      </AuthPanel>
    </AuthBackdrop>
  );

  const heading = (title: string, text: string, icon?: React.ReactNode) => (
    <div className="flex flex-col items-center gap-2.5 text-center">
      {icon}
      <h1 id="recuperar-title" className="text-2xl leading-8 font-bold text-text-strong">
        {title}
      </h1>
      <p className="text-sm leading-5 text-text-muted">{text}</p>
    </div>
  );

  if (step === 1) {
    const shown = channels ?? [];
    return frame(
      <form onSubmit={send} noValidate className="anim-rise flex flex-col gap-5">
        {heading(
          "Esqueceu a senha?",
          "Sem problema. Digite o CPF ou e-mail da sua conta e enviamos um código para criar uma senha nova.",
          <span className="flex size-14 items-center justify-center rounded-full bg-selected text-text-strong">
            <Lock className="size-7" aria-hidden />
          </span>,
        )}
        <AuthTextField
          label="CPF ou e-mail"
          value={login}
          onChange={(e) => {
            const v = e.target.value.slice(0, 80);
            setLogin(v);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => void loadChannels(v), 400);
          }}
          placeholder="Digite aqui…"
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
          <div className="anim-rise flex flex-col gap-2">
            <span className="text-xs leading-4 font-semibold text-text-2" id="canal-l">
              Receber o código por
            </span>
            <div
              role="radiogroup"
              aria-labelledby="canal-l"
              className="flex gap-2 rounded-[10px] bg-surface-2 p-1"
            >
              {shown.map((c) => {
                const on = channel === c.channel;
                return (
                  <button
                    key={c.channel}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setChannel(c.channel)}
                    className={cn(
                      "h-11 min-w-0 flex-1 truncate rounded-lg px-1 text-[13px] font-bold sm:h-9",
                      on ? "bg-surface text-text-strong shadow-card" : "text-text-subtle",
                    )}
                  >
                    {c.channel === "sms" ? "SMS" : "E-mail"} · {c.destinationMasked}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {error && <FormError>{error}</FormError>}
        <PrimaryButton wide looksDisabled={!validLogin} loading={busy}>
          {busy ? "Enviando…" : "Enviar código"}
        </PrimaryButton>
        <p className="text-center text-xs leading-[18px] text-text-subtle">
          Não tem mais acesso a esse celular e e-mail?{" "}
          <Link href="/ajuda?aba=contato" className={linkCls}>
            Fale com o suporte
          </Link>
        </p>
      </form>,
    );
  }

  if (step === 2 && challenge) {
    const other = channels?.find((c) => c.channel !== challenge.channel);
    return frame(
      <div className="anim-rise">
        <OtpStep
          key={challenge.challengeId}
          title="Digite o código"
          intro={(c) =>
            c.channel === "sms"
              ? `Enviamos um código de 6 dígitos por SMS para ${c.destinationMasked}.`
              : `Enviamos um código de 6 dígitos para o e-mail ${c.destinationMasked}.`
          }
          gap={10}
          resendLabel="Não recebeu?"
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
      </div>,
      "otp-title",
    );
  }

  if (step === 3) {
    const rule = (ok: boolean, typed: boolean, text: string, neutral?: boolean) => (
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs leading-4",
          ok ? "text-success-text" : typed && !neutral ? "text-danger-text" : "text-text-subtle",
        )}
      >
        {ok ? (
          <Check className="size-3.5 shrink-0 text-success" strokeWidth={2.4} aria-hidden />
        ) : (
          <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
            <span className="size-1.5 rounded-full bg-text-subtle/50" />
          </span>
        )}
        {text}
        <span className="sr-only">{ok ? " (atendido)" : " (não atendido)"}</span>
      </span>
    );
    const typed = pass.length > 0;
    return frame(
      <form onSubmit={save} noValidate className="anim-rise flex flex-col gap-[18px]">
        {heading("Crie uma senha nova", "Use uma senha que você não usa em outros sites.")}
        <AuthPasswordField
          label="Nova senha"
          value={pass}
          onChange={(e) => setPass(e.target.value.slice(0, 64))}
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
        />
        <div className="flex flex-col gap-1.5 rounded-lg bg-bg px-3 py-2.5" aria-label="Requisitos da senha">
          {rule(checks.length, typed, "Pelo menos 8 caracteres")}
          {rule(checks.lettersAndNumbers, typed, "Letras e números")}
          {rule(false, false, "Diferente da senha antiga", true)}
        </div>
        <div className="flex flex-col gap-1.5">
          <AuthPasswordField
            label="Confirme a nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.slice(0, 64))}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />
          {rule(different, confirm.length > 0, "As duas senhas são iguais")}
        </div>
        <div className="flex items-center gap-2 text-[13px] text-text-2">
          <AuthCheckbox
            size={20}
            checked={signOutOthers}
            onChange={setSignOutOthers}
            aria-label="Sair da conta nos outros aparelhos"
          />
          <span onClick={() => setSignOutOthers((v) => !v)} className="cursor-pointer">
            Sair da conta nos outros aparelhos
          </span>
        </div>
        {error && <FormError>{error}</FormError>}
        <PrimaryButton wide looksDisabled={!allOk} loading={busy}>
          {busy ? "Salvando…" : "Salvar nova senha"}
        </PrimaryButton>
      </form>,
    );
  }

  return frame(
    <div className="flex flex-col items-center gap-3.5 py-2 text-center">
      <span className="anim-pop flex size-[72px] items-center justify-center rounded-full bg-success text-white">
        <Check className="size-9" strokeWidth={3} aria-hidden />
      </span>
      <h1 id="recuperar-title" className="text-2xl leading-8 font-bold text-text-strong">
        Senha alterada!
      </h1>
      <p role="status" className="text-sm leading-5 text-text-muted">
        {signOutOthers
          ? "Pronto! Por segurança, saímos da sua conta nos outros aparelhos. Entre de novo com a senha nova."
          : "Pronto! Use a senha nova da próxima vez que entrar."}
      </p>
      <Link href={routes.entrar} className={cn(primaryBtnCls, "mt-2 w-full")}>
        Entrar com a nova senha
      </Link>
    </div>,
  );
}
