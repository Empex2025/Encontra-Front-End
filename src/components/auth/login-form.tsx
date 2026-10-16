"use client";

import { CircleCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { useSignIn } from "@/hooks/use-sign-in";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { safeReturnTo } from "@/lib/domain/validation";
import { routes } from "@/lib/routes";

import { AuthBackdrop, AuthPanel, FormError, linkCls, PrimaryButton } from "./auth-card";
import { AuthCheckbox, AuthPasswordField, AuthTextField } from "./auth-fields";
import { SocialButtons } from "./social-buttons";

/** Endereço da área do comerciante: só vira link quando a hospedagem define (não existe no app do consumidor). */
const MERCHANT_URL = process.env.NEXT_PUBLIC_MERCHANT_URL;

/** Entrar (artboard CadLogin): cartão de 440 px com o cartão amarelo deslocado atrás. */
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

  const back = params.get("voltar");
  const withBack = (href: string) => (back ? `${href}?voltar=${encodeURIComponent(returnTo)}` : href);

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
    <AuthBackdrop
      footer={
        MERCHANT_URL ? (
          <>
            É lojista ou prestador?{" "}
            <a href={MERCHANT_URL} className="font-bold text-amber-400 hover:underline">
              Acesse a área do comerciante
            </a>
          </>
        ) : undefined
      }
    >
      <AuthPanel width={440} offset>
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/brand/simbolo.png"
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-xl object-cover"
            priority
          />
          <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.2px] text-text-strong">
            Encontra<span className="text-amber">Ê</span>
            <span className="sr-only"> · Entrar na sua conta</span>
          </h1>
          <p className="text-sm leading-5 text-text-muted">Encontre produtos e serviços perto de você</p>
        </div>

        {cancelled && (
          <p
            role="status"
            className="anim-rise -my-2 flex items-start gap-2.5 rounded-lg border border-success/40 bg-success-soft px-3.5 py-3 text-[13px] leading-[19px] text-success-text"
          >
            <CircleCheck className="mt-px size-[18px] shrink-0" aria-hidden />
            <span>
              <b>Exclusão cancelada.</b> Que bom ter você de volta! Sua conta continua ativa.
            </span>
          </p>
        )}

        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <AuthTextField
              label="CPF ou e-mail"
              value={login}
              onChange={(e) => setLogin(e.target.value.slice(0, 80))}
              placeholder="Digite aqui…"
              autoComplete="username"
              inputMode="email"
              error={tried && !loginOk ? "Digite seu CPF ou e-mail." : undefined}
            />
            <div className="flex flex-col gap-1">
              <AuthPasswordField
                label="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 64))}
                placeholder="Sua senha"
                autoComplete="current-password"
                error={tried && !passOk ? "Digite sua senha." : undefined}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AuthCheckbox
                    checked={keep}
                    onChange={setKeep}
                    aria-labelledby="keep-l"
                    aria-describedby="keep-d"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span
                      id="keep-l"
                      onClick={() => setKeep((v) => !v)}
                      className="cursor-pointer text-[13px] leading-[18px] font-semibold text-text-2"
                    >
                      Manter conectado
                    </span>
                    <span id="keep-d" className="text-xs leading-4 text-text-subtle">
                      Por 30 dias neste aparelho
                    </span>
                  </span>
                </div>
                <Link
                  href={withBack("/entrar/recuperar")}
                  className={`${linkCls} inline-flex min-h-6 items-center text-xs leading-[18px] whitespace-nowrap`}
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>
          </div>

          {serverError && <FormError>{serverError}</FormError>}

          <PrimaryButton wide looksDisabled={!valid} loading={busy || cancelled}>
            {cancelled || busy ? "Entrando…" : "Entrar"}
          </PrimaryButton>
        </form>

        <div className="-my-1 flex items-center gap-3">
          <span className="h-px flex-1 bg-surface-3" />
          <span className="text-xs text-text-subtle">ou</span>
          <span className="h-px flex-1 bg-surface-3" />
        </div>
        <SocialButtons />

        <p className="text-center text-sm leading-5 text-text-muted">
          Não tem uma conta?{" "}
          <Link href={withBack(routes.cadastro)} className={linkCls}>
            Cadastre-se
          </Link>
        </p>
        <Link
          href="/boas-vindas"
          className="-mt-2 inline-flex min-h-6 items-center self-center text-[13px] font-bold text-link hover:underline"
        >
          Explorar sem cadastro ›
        </Link>
      </AuthPanel>
    </AuthBackdrop>
  );
}
