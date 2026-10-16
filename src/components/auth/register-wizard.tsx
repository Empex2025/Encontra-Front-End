"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { useSignIn } from "@/hooks/use-sign-in";
import { authApi, type OtpChallenge } from "@/lib/api/auth";
import { type RegisterStep, registerStepHref, resolveRegisterStep } from "@/lib/domain/register-steps";
import { safeReturnTo } from "@/lib/domain/validation";

import { AuthBackdrop, AuthPanel } from "./auth-card";
import { OtpStep } from "./otp-step";
import { type DadosForm, RegisterDados } from "./register-dados";
import { RegisterInteresses } from "./register-interesses";
import { RegisterLocal } from "./register-local";
import { RegisterPronto } from "./register-pronto";

const readBack = () => {
  const v = new URLSearchParams(window.location.search).get("voltar");
  return v ? safeReturnTo(v) : null;
};

const EMPTY: DadosForm = { name: "", cpf: "", email: "", phone: "", password: "" };

/** Cadastro em 4 etapas: dados → código por SMS → localização → interesses → tudo pronto. */
export function RegisterWizard() {
  const router = useRouter();
  const { me } = useSession();
  const signIn = useSignIn();
  const [form, setForm] = useState<DadosForm>(EMPTY);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [label, setLabel] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  // De onde a pessoa veio (convite para entrar): as etapas trocam o endereço, então guardamos aqui.
  const [back] = useState(() => (typeof window === "undefined" ? null : readBack()));

  // A etapa vive no endereço (?etapa=…): o botão voltar do navegador volta uma etapa em vez de sair do cadastro.
  // Etapa que depende de algo que não existe mais (recarregou a página, por exemplo) cai em "dados".
  const step = resolveRegisterStep(useSearchParams().get("etapa"), {
    hasChallenge: !!challenge,
    signedIn: !!me,
  });
  const goTo = (next: RegisterStep) => window.history.pushState(null, "", registerStepHref(next));
  const goBack = () => window.history.back();

  // Quem já tem conta não cria outra; durante o cadastro a sessão nasce na etapa 2.
  const inFlow = step !== "dados";
  useEffect(() => {
    if (me && !inFlow) router.replace("/");
  }, [me, inFlow, router]);

  if (step === "dados") {
    return (
      <RegisterDados
        initial={form}
        onDone={(f, c) => {
          setForm(f);
          setChallenge(c);
          goTo("codigo");
        }}
      />
    );
  }

  if (step === "codigo" && challenge) {
    return (
      <AuthBackdrop>
        <AuthPanel width={560} labelledBy="otp-title">
          <div className="flex justify-end">
            <span className="text-xs leading-4 font-semibold text-text-subtle">Etapa 2 de 4</span>
          </div>
          <div className="-mt-4">
            <OtpStep
              title="Confirmação do celular"
              intro={(c) => (
                <>
                  Enviamos um código por {c.channel === "sms" ? "SMS" : "e-mail"} para o celular cadastrado:{" "}
                  <b className="whitespace-nowrap text-text">{c.destinationMasked}</b>. Digite o código de 6
                  dígitos abaixo para confirmar.
                </>
              )}
              initial={challenge}
              okLabel="Celular confirmado"
              verify={async (challengeId, code) => {
                const res = await authApi.verifyRegistration({ challengeId, code });
                signIn(res.user);
              }}
              resend={(challengeId) => authApi.resend({ challengeId })}
              onVerified={() => goTo("local")}
              onBack={goBack}
            />
          </div>
        </AuthPanel>
      </AuthBackdrop>
    );
  }

  if (step === "local") {
    return (
      <RegisterLocal
        onBack={goBack}
        onDone={(l) => {
          setLabel(l);
          goTo("interesses");
        }}
      />
    );
  }

  if (step === "interesses") {
    return (
      <RegisterInteresses
        onBack={goBack}
        onDone={(ids) => {
          setInterests(ids);
          goTo("pronto");
        }}
      />
    );
  }

  return (
    <RegisterPronto
      name={form.name}
      phoneMasked={challenge?.destinationMasked ?? ""}
      locationLabel={label}
      interestIds={interests}
      continueHref={back ? `/boas-vindas?voltar=${encodeURIComponent(back)}` : "/boas-vindas"}
    />
  );
}
