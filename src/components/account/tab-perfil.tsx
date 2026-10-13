"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { useRef, useState } from "react";

import { OtpStep } from "@/components/auth/otp-step";
import { Modal } from "@/components/ui/modal";
import { TextField } from "@/components/ui/text-field";
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

import { btnOutline, btnPrimary, Card, errMsg } from "./shared";

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
    <Card title="Seus dados">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Nome completo"
          value={name}
          maxLength={NAME_MAX}
          autoComplete="name"
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="E-mail"
          type="email"
          value={email}
          maxLength={EMAIL_MAX}
          autoComplete="email"
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-text-strong">Celular</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-12 min-w-44 flex-1 items-center rounded-lg border border-border bg-surface-2 px-3 whitespace-nowrap text-text">
              {profile.phone}
            </span>
            {profile.phoneVerified && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-success-text">
                <BadgeCheck className="size-4" aria-hidden /> Confirmado
              </span>
            )}
            <button type="button" className={btnOutline} onClick={() => setPhoneOpen(true)}>
              Trocar
            </button>
          </div>
          <p className="text-sm text-text-muted">
            O número só muda depois que você digitar o código enviado por SMS.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-text-strong">CPF</span>
          <span className="flex h-12 items-center rounded-lg border border-border bg-surface-2 px-3 text-text-muted">
            {profile.cpfMasked}
          </span>
          <p className="text-sm text-text-muted">O CPF não pode ser alterado.</p>
        </div>
        <div>
          <button type="submit" className={btnPrimary} disabled={!changed || save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar alterações"}
          </button>
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
    <Modal title="Trocar celular" onClose={onClose}>
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
        <form onSubmit={send} className="flex flex-col gap-4" noValidate>
          <TextField
            label="Novo celular"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(82) 99999-9999"
            value={phone}
            error={error || undefined}
            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
          />
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy ? "Enviando…" : "Enviar código por SMS"}
          </button>
        </form>
      )}
    </Modal>
  );
}
