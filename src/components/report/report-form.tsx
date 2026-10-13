"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { btnPrimary, Card, errMsg } from "@/components/account/shared";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { REPORT_REASONS, type ReportType, reports } from "@/lib/api/account";
import { reportTypeFromParam, validateReport } from "@/lib/domain/account";
import { routes } from "@/lib/routes";

const TYPE_LABEL: Record<ReportType, string> = {
  loja: "Loja",
  produto: "Produto ou oferta",
  avaliacao: "Avaliação",
  story: "Story",
  live: "Live",
  evento: "Evento",
  lista: "Lista compartilhada",
  prestador: "Prestador de serviço",
  outro: "Outro",
};
const TYPES = Object.keys(TYPE_LABEL) as ReportType[];

export function ReportForm() {
  const params = useSearchParams();
  const toast = useToast();
  const paramType = reportTypeFromParam(params.get("tipo"));
  const targetId = params.get("id");

  const [type, setType] = useState<string>(paramType);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  // Quando a denúncia vem de uma página (loja, produto…), o nome já vem preenchido.
  const target = useQuery({
    queryKey: ["report-target", paramType, targetId],
    queryFn: () => reports.target(paramType as ReportType, targetId as string),
    enabled: !!paramType && !!targetId,
    retry: false,
  });
  const linked = !!paramType && !!targetId && type === paramType;
  const shownName = name || (linked ? (target.data?.name ?? "") : "");

  const errors = tried ? validateReport({ type, name: shownName, reason, description }) : {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(validateReport({ type, name: shownName, reason, description })).length > 0) {
      return toast("Confira os campos destacados.", "info");
    }
    if (busy) return;
    setBusy(true);
    try {
      const r = await reports.send({
        type: type as ReportType,
        targetId: linked ? targetId : null,
        targetName: type === "outro" ? null : shownName.trim(),
        reason,
        description: description.trim(),
      });
      setProtocol(r.protocol);
    } catch (err) {
      toast(errMsg(err), "info");
    } finally {
      setBusy(false);
    }
  };

  if (protocol) {
    return (
      <div className="mx-auto max-w-xl">
        <Card title="Denúncia enviada">
          <p role="status" className="text-text">
            Obrigado por avisar. Seu protocolo é <strong className="text-text-strong">{protocol}</strong>.
            Nossa equipe analisa em até 48 horas.
          </p>
          <div>
            <Link href={routes.home} className={btnPrimary}>
              Voltar ao início
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">Denunciar</h1>
      <Card>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="r-tipo" className="text-sm font-bold text-text-strong">
              O que você quer denunciar?
            </label>
            <select
              id="r-tipo"
              value={type}
              aria-invalid={!!errors.type}
              onChange={(e) => setType(e.target.value)}
              className="h-12 rounded-lg border border-border-strong bg-surface px-3 text-text"
            >
              <option value="">Escolha</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            {errors.type && (
              <p role="alert" className="text-sm text-danger-text">
                {errors.type}
              </p>
            )}
          </div>

          {type !== "outro" && (
            <TextField
              label="Nome"
              hint={linked ? undefined : "Nome da loja, do produto ou de quem você está denunciando."}
              value={shownName}
              error={errors.name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="r-motivo" className="text-sm font-bold text-text-strong">
              Motivo
            </label>
            <select
              id="r-motivo"
              value={reason}
              aria-invalid={!!errors.reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-12 rounded-lg border border-border-strong bg-surface px-3 text-text"
            >
              <option value="">Escolha</option>
              {REPORT_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {errors.reason && (
              <p role="alert" className="text-sm text-danger-text">
                {errors.reason}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="r-desc" className="text-sm font-bold text-text-strong">
              O que aconteceu?
            </label>
            <textarea
              id="r-desc"
              rows={5}
              maxLength={1000}
              value={description}
              aria-invalid={!!errors.description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-border-strong bg-surface p-3 text-text"
            />
            <div className="flex justify-between text-sm">
              <span role={errors.description ? "alert" : undefined} className="text-danger-text">
                {errors.description}
              </span>
              <span className="text-text-subtle">{description.length}/1000</span>
            </div>
          </div>

          <p className="flex items-start gap-2 text-sm text-text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> A loja não fica sabendo quem
            denunciou.
          </p>
          <div>
            <button type="submit" className={btnPrimary} disabled={busy}>
              {busy ? "Enviando…" : "Enviar denúncia"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
