"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useRef, useState } from "react";

import { OtpStep } from "@/components/auth/otp-step";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { account, type Profile } from "@/lib/api/account";
import { authApi, type OtpChallenge } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/endpoints";
import {
  cleanPhoneInput,
  EMAIL_MAX,
  NAME_MAX,
  profileChanged,
  validatePhone,
  validateProfile,
} from "@/lib/domain/account";

import { btnPrimary, Card, errMsg, Field, readonlyBox } from "./shared";

export function TabPerfil({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [tried, setTried] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const errors = tried ? validateProfile({ name, email }) : {};
  const changed = profileChanged({ name, email }, profile);

  const save = useMutation({
    mutationFn: () => account.saveProfile({ name: name.trim(), email: email.trim() }),
    onSuccess: (fresh) => {
      qc.setQueryData(["me", "profile"], fresh);
      void qc.invalidateQueries({ queryKey: queryKeys.me });
      toast("Dados salvos.");
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fields?.email) toast(e.fields.email, "info");
      else toast(errMsg(e), "info");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(validateProfile({ name, email })).length > 0 || !changed || save.isPending) return;
    save.mutate();
  };

  return (
    <Card
      title="Meu perfil"
      aside="Lojas e prestadores só veem seu nome, e o telefone apenas se você chamar no WhatsApp."
    >
      <form id="form-perfil" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nome completo"
            value={name}
            maxLength={NAME_MAX}
            autoComplete="name"
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="E-mail"
            type="email"
            value={email}
            maxLength={EMAIL_MAX}
            autoComplete="email"
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-text">Celular</span>
            <div className="flex gap-2">
              <span className={cn(readonlyBox, "flex-1 justify-between gap-2")}>
                <span className="truncate">{profile.phone}</span>
                {profile.phoneVerified && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-success-text">
                    <Check className="size-[13px]" strokeWidth={3} aria-hidden /> Confirmado
                  </span>
                )}
              </span>
              <button
                type="button"
                className="inline-flex h-11 shrink-0 items-center rounded-lg border border-primary bg-surface px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2"
                onClick={() => setPhoneOpen(true)}
              >
                Trocar
              </button>
            </div>
            <p className="text-xs text-text-subtle">
              O número só muda depois que você digitar o código enviado por SMS.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-text">CPF</span>
            <span className={cn(readonlyBox, "text-text-subtle")}>{profile.cpfMasked}</span>
            <p className="text-xs text-text-subtle">
              O CPF não pode ser alterado. Fale com o suporte se houver erro.
            </p>
          </div>
        </div>
      </form>
      {phoneOpen && (
        <PhoneDialog
          onClose={() => setPhoneOpen(false)}
          onDone={(fresh) => {
            qc.setQueryData(["me", "profile"], fresh);
            setPhoneOpen(false);
            toast("Celular atualizado.");
          }}
        />
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-surface-2 pt-4 sm:justify-end">
        {changed && <span className="text-[13px] text-accent-text">Você tem alterações não salvas</span>}
        <button type="submit" form="form-perfil" className={btnPrimary} disabled={!changed || save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </Card>
  );
}

function PhoneDialog({ onClose, onDone }: { onClose: () => void; onDone: (p: Profile) => void }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const freshRef = useRef<Profile | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const bad = validatePhone(phone);
    if (bad) return setError(bad);
    setBusy(true);
    setError("");
    try {
      setChallenge(await account.sendPhoneCode(phone));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="group"
      aria-label="Trocar celular"
      className="flex flex-col gap-3 rounded-xl border border-surface-3 bg-bg p-4"
    >
      {challenge ? (
        <OtpStep
          initial={challenge}
          okLabel="Celular confirmado."
          verify={async (id, code) => {
            freshRef.current = await account.verifyPhoneCode({ challengeId: id, code });
          }}
          resend={(id, channel) => authApi.resend({ challengeId: id, channel })}
          onVerified={() => freshRef.current && onDone(freshRef.current)}
          onBack={() => setChallenge(null)}
        />
      ) : (
        <form onSubmit={send} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <Field
            className="flex-1"
            label="Novo celular"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(82) 9 0000-0000"
            value={phone}
            error={error || undefined}
            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
          />
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy ? "Enviando…" : "Enviar código por SMS"}
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center px-3 text-[13px] font-semibold text-text-muted"
            onClick={onClose}
          >
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
