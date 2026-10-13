"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { useSignIn } from "@/hooks/use-sign-in";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { safeReturnTo } from "@/lib/domain/validation";
import { routes } from "@/lib/routes";

import { AuthCard, FormError, PrimaryButton } from "./auth-card";
import { PasswordField, TextField } from "@/components/ui/text-field";

/** Entrar (Documento de entrega › Fluxo 1 › CadLogin). Sem Google/Apple na 1ª versão (Decisão 7). */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = safeReturnTo(params.get("voltar"));
  const { me } = useSession();
  const signIn = useSignIn();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  // Quem já está logado não precisa desta tela.
  useEffect(() => {
    if (me && !cancelled) router.replace(returnTo);
  }, [me, cancelled, returnTo, router]);

  const loginOk = login.trim().length >= 5;
  const passOk = password.length >= 1;
  const valid = loginOk && passOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (!valid || busy) return;
    setBusy(true);
    try {
      const res = await authApi.login({ login: login.trim(), password, keepSignedIn: keep });
      if (res.deletionCancelled) {
        setCancelled(true);
        signIn(res.user);
        window.setTimeout(() => router.push(returnTo), 1800);
        return;
      }
      signIn(res.user);
      router.push(returnTo);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Não foi possível entrar. Tente de novo em instantes.",
      );
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Entrar na sua conta" subtitle="Encontre produtos e serviços perto de você.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {cancelled && (
          <p
            role="status"
            className="rounded-lg bg-success-soft px-3 py-2 text-sm font-semibold text-success-text"
          >
            Exclusão cancelada. Que bom ter você de volta! Sua conta continua ativa.
          </p>
        )}
        <TextField
          label="CPF ou e-mail"
          value={login}
          onChange={(e) => setLogin(e.target.value.slice(0, 80))}
          autoComplete="username"
          inputMode="email"
          error={tried && !loginOk ? "Digite seu CPF ou e-mail." : undefined}
        />
        <PasswordField
          label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value.slice(0, 64))}
          autoComplete="current-password"
          error={tried && !passOk ? "Digite sua senha." : undefined}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-h-11 items-center gap-3 text-sm text-text-2">
            <input
              type="checkbox"
              checked={keep}
              onChange={(e) => setKeep(e.target.checked)}
              className="size-5 accent-[var(--primary)]"
            />
            <span>
              <span className="font-semibold text-text-strong">Manter conectado</span>
              <span className="block text-xs text-text-muted">Por 30 dias neste aparelho</span>
            </span>
          </label>
          <Link
            href="/entrar/recuperar"
            className="inline-flex h-11 items-center text-sm font-semibold text-link hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        {serverError && <FormError>{serverError}</FormError>}

        <PrimaryButton looksDisabled={!valid} loading={busy || cancelled}>
          {cancelled ? "Entrando…" : busy ? "Entrando…" : "Entrar"}
        </PrimaryButton>
      </form>

      <p className="text-center text-sm text-text-muted">
        Não tem uma conta?{" "}
        <Link href={routes.cadastro} className="font-bold text-link hover:underline">
          Cadastre-se
        </Link>
      </p>
      <div className="flex flex-col items-center gap-1 border-t border-border pt-4 text-sm">
        <Link
          href="/boas-vindas"
          className="inline-flex h-11 items-center font-semibold text-link hover:underline"
        >
          Explorar sem cadastro ›
        </Link>
        <p className="text-text-subtle">É lojista ou prestador? A área do comerciante chega em breve.</p>
      </div>
    </AuthCard>
  );
}
