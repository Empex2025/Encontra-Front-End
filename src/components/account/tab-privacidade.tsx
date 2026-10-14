"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { ErrorState } from "@/components/ui/error-state";
import { Switch } from "@/components/ui/switch";
import { PasswordField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { account, DELETION_REASONS, type Profile } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { deletionDate, validateDeletion } from "@/lib/domain/account";
import { clearLocalState } from "@/lib/domain/session-cleanup";
import { isValidPassword, PASSWORD_MAX } from "@/lib/domain/validation";
import { formatTimeAgo } from "@/lib/format";

import { usePatchProfile } from "./tab-config";
import {
  btnDanger,
  btnOutline,
  btnPrimary,
  Card,
  errMsg,
  Loading,
  type ProfileState,
  ProfileStatus,
} from "./shared";

export function TabPrivacidade({ profile, profileState }: { profile?: Profile; profileState: ProfileState }) {
  return (
    <div className="flex flex-col gap-4">
      <PasswordCard />
      <SessionsCard />
      {profile ? (
        <PrivacyCard profile={profile} />
      ) : (
        <Card title="Privacidade">
          <ProfileStatus state={profileState} />
        </Card>
      )}
      <HistoryCard />
      <DataCard />
    </div>
  );
}

function PasswordCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card title="Senha">
      <p className="text-sm text-text-muted">Use uma senha que você não usa em outros lugares.</p>
      <div>
        <button type="button" className={btnOutline} onClick={() => setOpen(true)}>
          Trocar senha
        </button>
      </div>
      {open && <PasswordDialog onClose={() => setOpen(false)} />}
    </Card>
  );
}

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const m = useMutation({
    mutationFn: () => account.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast("Senha alterada.");
      onClose();
    },
    onError: (e) => setServerError(errMsg(e)),
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (!current || !isValidPassword(next) || m.isPending) return;
    m.mutate();
  };
  return (
    <Modal title="Trocar senha" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField
          label="Senha atual"
          autoComplete="current-password"
          value={current}
          maxLength={PASSWORD_MAX}
          error={tried && !current ? "Digite sua senha atual." : serverError || undefined}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          value={next}
          maxLength={PASSWORD_MAX}
          hint="De 8 a 64 caracteres, com letras e números."
          error={
            tried && !isValidPassword(next)
              ? "A senha precisa de 8 a 64 caracteres, com letras e números."
              : undefined
          }
          onChange={(e) => setNext(e.target.value)}
        />
        <button type="submit" className={btnPrimary} disabled={m.isPending}>
          {m.isPending ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </Modal>
  );
}

export function useLeave() {
  const qc = useQueryClient();
  const router = useRouter();
  return () => {
    clearLocalState();
    qc.clear();
    router.replace("/");
  };
}

function SessionsCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const leave = useLeave();
  const q = useQuery({ queryKey: ["me", "sessions"], queryFn: account.sessions });
  const [confirmAll, setConfirmAll] = useState(false);
  const others = useMutation({
    mutationFn: account.endOtherSessions,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me", "sessions"] });
      toast("Pronto. Você saiu dos outros aparelhos.");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const all = useMutation({
    mutationFn: () => account.logout(true),
    onSuccess: leave,
    onError: (e) => toast(errMsg(e), "info"),
  });
  return (
    <Card title="Aparelhos conectados">
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <ErrorState
          error={q.error}
          onRetry={() => q.refetch()}
          title="Não foi possível carregar seus aparelhos conectados"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {q.data.items.map((s) => (
            <li
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${s.current ? "border-success-text bg-success-soft" : "border-border"}`}
            >
              <Laptop className="size-5 shrink-0 text-text-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-strong">{s.device}</p>
                <p className="text-sm text-text-muted">
                  {[s.place, s.current ? null : formatTimeAgo(s.lastSeenAt)].filter(Boolean).join(" · ")}
                </p>
              </div>
              {s.current && <span className="text-sm font-bold text-success-text">Este aparelho</span>}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnOutline}
          disabled={others.isPending}
          onClick={() => others.mutate()}
        >
          Sair de todos os outros
        </button>
        <button type="button" className={btnOutline} onClick={() => setConfirmAll(true)}>
          Sair de todos os aparelhos
        </button>
      </div>
      {confirmAll && (
        <Modal title="Sair de todos os aparelhos?" onClose={() => setConfirmAll(false)}>
          <p className="mb-4 text-text-muted">Você também sai deste aparelho e precisa entrar de novo.</p>
          <div className="flex gap-2">
            <button type="button" className={btnDanger} disabled={all.isPending} onClick={() => all.mutate()}>
              Sair de todos
            </button>
            <button type="button" className={btnOutline} onClick={() => setConfirmAll(false)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function PrivacyCard({ profile }: { profile: Profile }) {
  const patch = usePatchProfile();
  const [style, setStyle] = useState(profile.reviewNameStyle);
  return (
    <Card title="Privacidade" className="divide-y divide-border">
      <Switch
        label="Mostrar meu bairro"
        hint="Aparece nas suas avaliações."
        checked={profile.privacy.showNeighborhood}
        onChange={(v) => patch.mutate({ privacy: { showNeighborhood: v } })}
      />
      <Switch
        label="Guardar histórico de buscas"
        checked={profile.privacy.keepSearchHistory}
        onChange={(v) => patch.mutate({ privacy: { keepSearchHistory: v } })}
      />
      <Switch
        label="Sugestões pelos meus interesses"
        checked={profile.privacy.suggestByInterests}
        onChange={(v) => patch.mutate({ privacy: { suggestByInterests: v } })}
      />
      <fieldset className="pt-3">
        <legend className="font-semibold text-text-strong">Nome nas suas avaliações</legend>
        {(
          [
            ["first_initial", "Primeiro nome + inicial (ex.: Maria S.)"],
            ["full", "Nome completo"],
          ] as const
        ).map(([v, l]) => (
          <label key={v} className="flex min-h-11 items-center gap-3 text-text">
            <input
              type="radio"
              name="reviewName"
              className="size-5"
              checked={style === v}
              onChange={() => {
                setStyle(v);
                patch.mutate({ reviewNameStyle: v });
              }}
            />
            {l}
          </label>
        ))}
      </fieldset>
    </Card>
  );
}

function HistoryCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ["me", "search-history"], queryFn: account.searchHistory });
  const clear = useMutation({
    mutationFn: account.clearSearchHistory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me", "search-history"] });
      void qc.invalidateQueries({ queryKey: ["autocomplete"] });
      toast("Histórico apagado.");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const n = q.data?.count ?? 0;
  return (
    <Card title="Histórico de buscas">
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <ErrorState
          error={q.error}
          onRetry={() => q.refetch()}
          title="Não foi possível carregar o histórico de buscas"
        />
      ) : (
        <>
          <p className="text-text-muted">
            {n === 0
              ? `Nenhuma busca nos últimos ${q.data.days} dias.`
              : `${n} ${n === 1 ? "busca" : "buscas"} nos últimos ${q.data.days} dias.`}
          </p>
          <div>
            <button
              type="button"
              className={btnOutline}
              disabled={n === 0 || clear.isPending}
              onClick={() => clear.mutate()}
            >
              Apagar histórico
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

function DataCard() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState<number | null>(null);
  const exp = useMutation({
    mutationFn: account.requestExport,
    onSuccess: (r) => setRequested(r.deliveryDays),
    onError: (e) => toast(errMsg(e), "info"),
  });
  return (
    <Card title="Seus dados">
      <p className="text-sm text-text-muted">
        Você pode pedir uma cópia dos seus dados ou excluir a conta quando quiser.
      </p>
      {requested ? (
        <p role="status" className="rounded-lg bg-success-soft p-3 text-success-text">
          Pedido recebido. Enviamos o arquivo para o seu e-mail em até {requested} dias.
        </p>
      ) : (
        <div>
          <button type="button" className={btnOutline} disabled={exp.isPending} onClick={() => exp.mutate()}>
            {exp.isPending ? "Pedindo…" : "Baixar meus dados"}
          </button>
        </div>
      )}
      <div className="border-t border-border pt-3">
        <button type="button" className={btnDanger} onClick={() => setOpen(true)}>
          Excluir conta
        </button>
      </div>
      {open && <DeleteDialog onClose={() => setOpen(false)} />}
    </Card>
  );
}

/** Exclusão em 3 passos: o que acontece → senha e confirmação → agendada para hoje + 30 dias. */
function DeleteDialog({ onClose }: { onClose: () => void }) {
  const leave = useLeave();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [when, setWhen] = useState("");
  const errors = tried ? validateDeletion({ password, confirmed }) : {};

  const del = useMutation({
    mutationFn: () => account.scheduleDeletion({ password, reason: reason || undefined }),
    onSuccess: (r) => {
      setWhen(deletionDate(new Date(r.scheduledFor), 0));
      setStep(3);
    },
    onError: (e) => setServerError(e instanceof ApiError ? e.message : errMsg(e)),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (Object.keys(validateDeletion({ password, confirmed })).length > 0 || del.isPending) return;
    del.mutate();
  };

  return (
    <Modal title="Excluir conta" onClose={step === 3 ? leave : onClose}>
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <ul className="list-disc space-y-2 pl-5 text-text">
            <li>
              Sua conta fica agendada para exclusão por 30 dias. Se entrar nesse prazo, ela volta ao normal.
            </li>
            <li>Depois disso, apagamos seus dados pessoais, favoritos, alertas e conversas.</li>
            <li>Suas avaliações deixam de mostrar seu nome.</li>
          </ul>
          <div className="flex gap-2">
            <button type="button" className={btnDanger} onClick={() => setStep(2)}>
              Continuar
            </button>
            <button type="button" className={btnOutline} onClick={onClose}>
              Voltar
            </button>
          </div>
        </div>
      )}
      {step === 2 && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-text-strong">Por que está saindo? (opcional)</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-12 rounded-lg border border-border-strong bg-surface px-3 text-text"
            >
              <option value="">Prefiro não dizer</option>
              {DELETION_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <PasswordField
            label="Sua senha"
            autoComplete="current-password"
            value={password}
            maxLength={PASSWORD_MAX}
            error={errors.password ?? (serverError || undefined)}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>
            <label className="flex min-h-11 items-start gap-3 text-text">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Entendi que minha conta e meus dados serão apagados.
            </label>
            {errors.confirmed && (
              <p role="alert" className="text-sm text-danger-text">
                {errors.confirmed}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className={btnDanger} disabled={del.isPending}>
              {del.isPending ? "Agendando…" : "Excluir minha conta"}
            </button>
            <button type="button" className={btnOutline} onClick={() => setStep(1)}>
              Voltar
            </button>
          </div>
        </form>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p role="status" className="text-lg font-bold text-text-strong">
            Exclusão agendada para {when}
          </p>
          <p className="text-text-muted">
            Se mudar de ideia, é só entrar de novo até essa data. Você será desconectado agora.
          </p>
          <button type="button" className={btnPrimary} onClick={leave}>
            Ok, entendi
          </button>
        </div>
      )}
    </Modal>
  );
}
