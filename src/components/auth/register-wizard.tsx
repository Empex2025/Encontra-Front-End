"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { useSignIn } from "@/hooks/use-sign-in";
import { authApi, type OtpChallenge } from "@/lib/api/auth";
import { type RegisterStep, registerStepHref, resolveRegisterStep } from "@/lib/domain/register-steps";

import { AuthCard } from "./auth-card";
import { OtpStep } from "./otp-step";
import { type DadosForm, RegisterDados } from "./register-dados";
import { RegisterInteresses } from "./register-interesses";
import { RegisterLocal } from "./register-local";
import { RegisterPronto } from "./register-pronto";

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
      <AuthCard
        title="Confirmação do celular"
        subtitle="Digite o código para ativar sua conta."
        step={{ current: 2, total: 4, label: "Código" }}
      >
        <OtpStep
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
      </AuthCard>
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
    />
  );
}
