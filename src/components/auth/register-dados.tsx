"use client";

import Link from "next/link";
import { useState } from "react";

import { authApi, type OtpChallenge } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  isValidCpf,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  maskCpf,
  maskPhone,
  onlyDigits,
  passwordChecks,
} from "@/lib/domain/validation";
import { routes } from "@/lib/routes";

import {
  ActionRow,
  AuthBackdrop,
  AuthPanel,
  FormError,
  linkCls,
  outlineBtnCls,
  PrimaryButton,
  StepHeader,
} from "./auth-card";
import { AuthCheckbox, AuthPasswordField, AuthTextField, FieldError } from "./auth-fields";

export type DadosForm = { name: string; cpf: string; email: string; phone: string; password: string };

const fieldMap: Record<string, keyof DadosForm> = {
  name: "name",
  cpf: "cpf",
  email: "email",
  phone: "phone",
  password: "password",
};

/** Etapa 1: dados pessoais, senha e aceite dos termos. Cria a conta pendente e dispara o SMS. */
export function RegisterDados({
  initial,
  onDone,
}: {
  initial: DadosForm;
  onDone: (form: DadosForm, challenge: OtpChallenge) => void;
}) {
  const [f, setF] = useState(initial);
  const [accepted, setAccepted] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverFields, setServerFields] = useState<Partial<Record<keyof DadosForm, string>>>({});
  const [serverError, setServerError] = useState("");

  const set = (k: keyof DadosForm, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setServerFields((p) => ({ ...p, [k]: undefined }));
  };

  const name = f.name.trim();
  const cpfDigits = onlyDigits(f.cpf);
  const checks = passwordChecks(f.password);
  const errors = {
    name: name.length < 3 || name.length > 60 ? "Digite seu nome." : undefined,
    cpf:
      cpfDigits.length < 11
        ? "CPF incompleto (11 números)."
        : !isValidCpf(f.cpf)
          ? "CPF inválido. Confira os números."
          : undefined,
    email: !isValidEmail(f.email) ? "Digite um e-mail válido." : undefined,
    phone: !isValidPhone(f.phone) ? "Celular com DDD (11 números)." : undefined,
    password: !isValidPassword(f.password) ? "Use de 8 a 64 caracteres, com letras e números." : undefined,
  };
  const valid = Object.values(errors).every((e) => !e) && accepted;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (!valid || busy) return;
    setBusy(true);
    try {
      const challenge = await authApi.register({
        name,
        cpf: cpfDigits,
        email: f.email.trim(),
        phone: onlyDigits(f.phone),
        password: f.password,
        acceptTerms: true,
      });
      onDone(f, challenge);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const next: Partial<Record<keyof DadosForm, string>> = {};
        for (const [k, msg] of Object.entries(err.fields)) {
          const key = fieldMap[k];
          if (key) next[key] = msg;
        }
        setServerFields(next);
      }
      setServerError(
        err instanceof ApiError ? err.message : "Não foi possível criar a conta. Tente de novo em instantes.",
      );
      setBusy(false);
    }
  };

  const err = (k: keyof DadosForm) => serverFields[k] ?? (tried ? errors[k] : undefined);
  const passwordOk = checks.length && checks.lettersAndNumbers;
  const passwordHint =
    checks.length && !checks.lettersAndNumbers ? "Use letras e números" : "Mínimo de 8 caracteres";

  return (
    <AuthBackdrop>
      <AuthPanel width={800} labelledBy="dados-title">
        <StepHeader
          id="dados-title"
          title="Crie sua conta"
          subtitle="Preencha seus dados. Leva menos de 1 minuto."
          current={1}
        />
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <AuthTextField
              label="Nome completo"
              value={f.name}
              onChange={(e) => set("name", e.target.value.slice(0, 60))}
              placeholder="Digite seu nome…"
              autoComplete="name"
              error={err("name")}
            />
            <AuthTextField
              label="Informe seu CPF"
              note="(Você poderá alterar seus dados de cadastro depois)."
              value={f.cpf}
              onChange={(e) => set("cpf", maskCpf(e.target.value))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              error={err("cpf")}
            />
            <AuthTextField
              label="E-mail"
              type="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value.slice(0, 80).trim())}
              placeholder="nome@provedor.com"
              autoComplete="email"
              error={err("email")}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <AuthTextField
                label="Telefone de contato"
                note="(vamos confirmar por SMS)"
                value={f.phone}
                onChange={(e) => set("phone", maskPhone(e.target.value))}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(00) 0 0000-0000"
                error={err("phone")}
              />
              <AuthPasswordField
                label="Senha"
                value={f.password}
                onChange={(e) => set("password", e.target.value.slice(0, 64))}
                placeholder="Senha"
                autoComplete="new-password"
                hint={passwordHint}
                hintTone={passwordOk ? "ok" : tried ? "bad" : "neutral"}
                error={serverFields.password}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2 text-xs leading-[18px] text-text-muted">
                <AuthCheckbox
                  checked={accepted}
                  onChange={setAccepted}
                  invalid={tried && !accepted}
                  aria-label="Aceito os Termos de uso e a Política de privacidade"
                />
                <span>
                  Li e aceito os{" "}
                  <Link href="/institucional/termos" target="_blank" className={linkCls}>
                    Termos de uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/institucional/privacidade" target="_blank" className={linkCls}>
                    Política de privacidade
                  </Link>
                  .
                </span>
              </div>
              {tried && !accepted && <FieldError>Para criar a conta, aceite os termos.</FieldError>}
            </div>
          </div>

          {serverError && <FormError>{serverError}</FormError>}

          <ActionRow>
            <Link href={routes.entrar} className={outlineBtnCls}>
              Cancelar
            </Link>
            <PrimaryButton looksDisabled={!valid} loading={busy}>
              {busy ? "Criando…" : "Próximo"}
            </PrimaryButton>
          </ActionRow>
        </form>
      </AuthPanel>
    </AuthBackdrop>
  );
}
