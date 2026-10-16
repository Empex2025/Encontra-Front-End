"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Laptop, Smartphone } from "lucide-react";
import Link from "next/link";
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
import { routes } from "@/lib/routes";

import { usePatchProfile } from "./tab-config";
import {
  btnDanger,
  btnLine,
  btnLineDanger,
  btnLineMuted,
  btnPrimary,
  btnSmallDanger,
  btnSoftDanger,
  Card,
  ChoicePill,
  errMsg,
  Loading,
  type ProfileState,
  ProfileStatus,
  SettingRow,
} from "./shared";

export function TabPrivacidade({ profile, profileState }: { profile?: Profile; profileState: ProfileState }) {
  return (
    <>
      <SecurityCard />
      {profile ? (
        <PrivacyCard profile={profile} />
      ) : (
        <Card title="Privacidade">
          <ProfileStatus state={profileState} />
        </Card>
      )}
      <YourDataCard />
    </>
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

/** Dia e hora no estilo do protótipo ("Ontem, 19:02", "Segunda, 21:40"); com data se for mais antigo. */
function sessionWhen(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hm = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff <= 0) return `Hoje, ${hm}`;
  if (diff === 1) return `Ontem, ${hm}`;
  if (diff < 7) {
    const wd = d.toLocaleDateString("pt-BR", { weekday: "long" });
    return `${wd[0].toUpperCase()}${wd.slice(1).replace("-feira", "")}, ${hm}`;
  }
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}, ${hm}`;
}

const isPhone = (device: string) => /android|iphone|ios|mobile|celular|app/i.test(device);

function SecurityCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const leave = useLeave();
  const q = useQuery({ queryKey: ["me", "sessions"], queryFn: account.sessions });
  const [passOpen, setPassOpen] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["me", "sessions"] });
  const one = useMutation({
    mutationFn: (s: { id: string; device: string }) => account.endSession(s.id),
    onSuccess: (_r, s) => {
      refresh();
      toast(`${s.device} foi desconectado.`);
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const others = useMutation({
    mutationFn: account.endOtherSessions,
    onSuccess: () => {
      refresh();
      toast("Você saiu de todos os outros aparelhos.");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const all = useMutation({
    mutationFn: () => account.logout(true),
    onSuccess: leave,
    onError: (e) => toast(errMsg(e), "info"),
  });
  return (
    <Card title="Segurança">
      <SettingRow first title="Senha" hint="Use uma senha que você não usa em outros lugares.">
        <button type="button" className={btnLine} onClick={() => setPassOpen(true)}>
          Alterar senha
        </button>
      </SettingRow>
      <div className="flex flex-col gap-1 border-t border-surface-2 pt-3">
        <span className="text-[15px] font-semibold text-text">Aparelhos conectados</span>
        {q.isPending ? (
          <Loading />
        ) : q.isError ? (
          <ErrorState
            compact
            error={q.error}
            onRetry={() => q.refetch()}
            title="Não foi possível carregar seus aparelhos conectados"
          />
        ) : q.data.items.length === 0 ? (
          <p className="py-2 text-[13px] text-text-subtle">Nenhum aparelho conectado no momento.</p>
        ) : (
          <ul className="flex flex-col">
            {q.data.items.map((s) => {
              const Icon = isPhone(s.device) ? Smartphone : Laptop;
              const when = s.current ? "Agora (este aparelho)" : sessionWhen(s.lastSeenAt);
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-text-muted"
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-text">{s.device}</span>
                    <span className={s.current ? "text-xs text-success-text" : "text-xs text-text-subtle"}>
                      {[s.place, when].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  {!s.current && (
                    <button
                      type="button"
                      className={btnSmallDanger}
                      disabled={one.isPending}
                      onClick={() => one.mutate({ id: s.id, device: s.device })}
                    >
                      Desconectar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={btnSoftDanger} disabled={others.isPending} onClick={() => others.mutate()}>
            Sair de todos os outros aparelhos
          </button>
          <button type="button" className={btnLineDanger} onClick={() => setConfirmAll(true)}>
            Sair de todos os aparelhos
          </button>
        </div>
        <span className="text-xs text-text-subtle">
          “Sair de todos os aparelhos” também encerra a sessão neste aparelho.
        </span>
      </div>
      {passOpen && <PasswordDialog onClose={() => setPassOpen(false)} />}
      {confirmAll && (
        <Modal title="Sair de todos os aparelhos?" onClose={() => setConfirmAll(false)}>
          <p className="text-sm text-text-muted">
            Vamos encerrar sua sessão em todos os aparelhos, inclusive neste. Você pode entrar de novo quando
            quiser.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnLineMuted} onClick={() => setConfirmAll(false)}>
              Cancelar
            </button>
            <button type="button" className={btnDanger} disabled={all.isPending} onClick={() => all.mutate()}>
              Sair
            </button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

/** "Maria S." a partir do nome da conta (primeiro nome + inicial do último). */
function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "Primeiro nome + inicial";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function PrivacyCard({ profile }: { profile: Profile }) {
  const patch = usePatchProfile();
  const [style, setStyle] = useState(profile.reviewNameStyle);
  const pick = (v: Profile["reviewNameStyle"]) => {
    setStyle(v);
    patch.mutate({ reviewNameStyle: v });
  };
  return (
    <Card title="Privacidade">
      <div className="flex flex-col">
        <SettingRow
          title="Mostrar meu bairro para lojas"
          hint="Ajuda a loja a calcular entrega e retirada. Nunca mostramos seu endereço."
        >
          <Switch
            bare
            label="Mostrar meu bairro para lojas"
            checked={profile.privacy.showNeighborhood}
            onChange={(v) => patch.mutate({ privacy: { showNeighborhood: v } })}
          />
        </SettingRow>
        <SettingRow title="Guardar histórico de buscas" hint="Usamos para sugestões e para corrigir erros de digitação.">
          <Switch
            bare
            label="Guardar histórico de buscas"
            checked={profile.privacy.keepSearchHistory}
            onChange={(v) => patch.mutate({ privacy: { keepSearchHistory: v } })}
          />
        </SettingRow>
        <SettingRow
          title="Sugestões pelos meus interesses"
          hint="Se desligar, você vê o mais popular perto de você."
        >
          <Switch
            bare
            label="Sugestões pelos meus interesses"
            checked={profile.privacy.suggestByInterests}
            onChange={(v) => patch.mutate({ privacy: { suggestByInterests: v } })}
          />
        </SettingRow>
        <SettingRow title="Nome nas suas avaliações" hint="Como seu nome aparece para outras pessoas.">
          <div role="radiogroup" aria-label="Nome nas suas avaliações" className="flex gap-1.5">
            <ChoicePill radio on={style === "first_initial"} onClick={() => pick("first_initial")}>
              {shortName(profile.name)}
            </ChoicePill>
            <ChoicePill radio on={style === "full"} onClick={() => pick("full")}>
              Nome completo
            </ChoicePill>
          </div>
        </SettingRow>
      </div>
    </Card>
  );
}

function YourDataCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState<number | null>(null);
  const q = useQuery({ queryKey: ["me", "search-history"], queryFn: account.searchHistory });
  const clear = useMutation({
    mutationFn: account.clearSearchHistory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me", "search-history"] });
      void qc.invalidateQueries({ queryKey: ["autocomplete"] });
      toast("Histórico de buscas apagado.");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const exp = useMutation({
    mutationFn: account.requestExport,
    onSuccess: (r) => {
      setRequested(r.deliveryDays);
      toast(`Pedido recebido. Enviaremos a cópia para o seu e-mail em até ${r.deliveryDays} dias.`);
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const n = q.data?.count ?? 0;
  const histHint = q.isPending
    ? "Carregando…"
    : q.isError
      ? "Não foi possível carregar o histórico agora."
      : n === 0
        ? "Histórico vazio."
        : `${n} ${n === 1 ? "busca" : "buscas"} nos últimos ${q.data.days} dias.`;
  return (
    <Card title="Seus dados">
      <div className="flex flex-col">
        <SettingRow title="Histórico de buscas" hint={histHint}>
          {q.isError ? (
            <button type="button" className={btnLineMuted} onClick={() => q.refetch()}>
              Tentar de novo
            </button>
          ) : (
            <button
              type="button"
              className={btnLineMuted}
              disabled={n === 0 || clear.isPending}
              onClick={() => clear.mutate()}
            >
              Limpar histórico
            </button>
          )}
        </SettingRow>
        <SettingRow
          title="Baixar meus dados"
          hint={
            requested
              ? `Pedido recebido. Enviamos a cópia para o seu e-mail em até ${requested} dias.`
              : "Receba por e-mail uma cópia de tudo o que guardamos sobre você (LGPD)."
          }
        >
          <button
            type="button"
            className={btnLineMuted}
            disabled={exp.isPending || !!requested}
            onClick={() => exp.mutate()}
          >
            {exp.isPending ? "Pedindo…" : "Pedir cópia"}
          </button>
        </SettingRow>
        <SettingRow
          tone="danger"
          title="Excluir conta"
          hint="Apaga seus dados, favoritos, alertas e conversas. Você tem 30 dias para desistir."
        >
          <button type="button" className={btnLineDanger} onClick={() => setOpen(true)}>
            Excluir conta
          </button>
        </SettingRow>
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

  const consequences = [
    "Seus favoritos, alertas, avaliações e conversas serão apagados.",
    "As avaliações que você já publicou continuam no ar, mas ficam anônimas (sem seu nome).",
    "Você tem 30 dias para desistir: é só entrar na sua conta de novo.",
    "Alguns registros são guardados pelo prazo exigido em lei, como os registros de acesso, por 6 meses (Marco Civil da Internet).",
  ];
  return (
    <Modal
      title={step === 1 ? "Excluir sua conta" : step === 2 ? "Confirme a exclusão" : `Exclusão agendada para ${when}`}
      onClose={step === 3 ? leave : onClose}
    >
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="-mt-2 text-xs font-bold text-text-subtle">Passo 1 de 2</p>
          <p className="text-sm text-text-muted">Antes de continuar, veja o que acontece:</p>
          <ul className="flex flex-col gap-3">
            {consequences.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-sm text-text">
                <Check className="mt-0.5 size-4 shrink-0 text-text-subtle" aria-hidden />
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`${routes.institucional}/privacidade`}
            className="text-sm font-bold text-link hover:underline"
          >
            Ler a Política de Privacidade ›
          </Link>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnLineMuted} onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className={btnDanger} onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        </div>
      )}
      {step === 2 && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <p className="-mt-2 text-xs font-bold text-text-subtle">Passo 2 de 2</p>
          <div role="radiogroup" aria-labelledby="del-reason" className="flex flex-col gap-1">
            <span id="del-reason" className="text-[13px] font-bold text-text">
              Por que você está saindo? <span className="font-normal text-text-subtle">(opcional)</span>
            </span>
            {DELETION_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(reason === r ? "" : r)}
                className="flex h-9 items-center gap-2.5 px-1 text-left text-sm text-text"
              >
                <span
                  aria-hidden
                  className={
                    reason === r
                      ? "size-[18px] rounded-full border-[6px] border-primary bg-surface"
                      : "size-[18px] rounded-full border-[1.5px] border-text-subtle bg-surface"
                  }
                />
                {r}
              </button>
            ))}
          </div>
          <PasswordField
            label="Digite sua senha para confirmar"
            autoComplete="current-password"
            value={password}
            maxLength={PASSWORD_MAX}
            error={errors.password ?? (serverError || undefined)}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>
            <label className="flex min-h-11 items-start gap-2.5 text-[13px] text-text-2">
              <input
                type="checkbox"
                className="mt-0.5 size-5 accent-[var(--color-primary)]"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Entendo que esta ação vai excluir minha conta e meus dados em 30 dias, e que depois disso não dá
              para recuperar.
            </label>
            {errors.confirmed && (
              <p role="alert" className="text-xs text-danger-text">
                {errors.confirmed}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnLineMuted} onClick={() => setStep(1)}>
              Voltar
            </button>
            <button type="submit" className={btnDanger} disabled={del.isPending}>
              {del.isPending ? "Agendando…" : "Excluir minha conta"}
            </button>
          </div>
        </form>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p role="status" className="text-sm text-text-muted">
            Vamos sair da sua conta agora. Se mudar de ideia, é só entrar de novo até {when} que a exclusão é
            cancelada.
          </p>
          <div>
            <button type="button" className={btnPrimary} onClick={leave}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
