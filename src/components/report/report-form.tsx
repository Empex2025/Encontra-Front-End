"use client";

import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { uploadFile } from "@/lib/api/chat";
import { REPORT_REASONS, type ReportType, reports } from "@/lib/api/account";
import { reportTypeFromParam, validateReport } from "@/lib/domain/account";
import { routes } from "@/lib/routes";

/** Tipos como no protótipo (Institucional › Denunciar): chips, com o rótulo e o nome do campo de cada um. */
const TYPE_INFO: Record<ReportType, { chip: string; summary: string; nameLabel: string }> = {
  loja: { chip: "Loja", summary: "Loja", nameLabel: "Nome da loja" },
  produto: {
    chip: "Produto/oferta",
    summary: "Produto ou oferta",
    nameLabel: "Nome do produto ou da oferta",
  },
  avaliacao: { chip: "Avaliação", summary: "Avaliação", nameLabel: "Autor ou loja da avaliação" },
  story: { chip: "Story/live", summary: "Story ou live", nameLabel: "Loja que publicou" },
  prestador: { chip: "Prestador", summary: "Prestador de serviço", nameLabel: "Nome do prestador" },
  outro: { chip: "Outro", summary: "Outro", nameLabel: "Do que se trata" },
  // tipos que só chegam por link da própria página (não são chips fixos)
  live: { chip: "Live", summary: "Live", nameLabel: "Loja que publicou" },
  evento: { chip: "Evento", summary: "Evento", nameLabel: "Nome do evento" },
  lista: { chip: "Lista compartilhada", summary: "Lista compartilhada", nameLabel: "Nome da lista" },
};
const BASE_CHIPS: ReportType[] = ["loja", "produto", "avaliacao", "story", "prestador", "outro"];
const PRINT_MAX = 5 * 1024 * 1024;

export function ReportForm() {
  const params = useSearchParams();
  const toast = useToast();
  const paramType = reportTypeFromParam(params.get("tipo"));
  const targetId = params.get("id");

  const [type, setType] = useState<string>(paramType);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [print, setPrint] = useState<{ name: string; key: string } | "uploading" | null>(null);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ protocol: string; summary: string; reason: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Quando a denúncia vem de uma página (loja, produto…), o nome já vem preenchido.
  const target = useQuery({
    queryKey: ["report-target", paramType, targetId],
    queryFn: () => reports.target(paramType as ReportType, targetId as string),
    enabled: !!paramType && !!targetId,
    retry: false,
  });
  const linked = !!paramType && !!targetId && type === paramType;
  const shownName = name || (linked ? (target.data?.name ?? "") : "");
  const nameLookupFailed = linked && target.isError;

  const errors = tried ? validateReport({ type, name: shownName, reason, description }) : {};
  const info = type ? TYPE_INFO[type as ReportType] : undefined;
  const chips =
    paramType && !BASE_CHIPS.includes(paramType as ReportType)
      ? [...BASE_CHIPS, paramType as ReportType]
      : BASE_CHIPS;
  const nameRequired = type !== "outro";

  const pickPrint = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type) || file.size > PRINT_MAX) {
      toast("Use uma imagem JPG ou PNG de até 5 MB.", "info");
      return;
    }
    setPrint("uploading");
    try {
      setPrint({ name: file.name, key: await uploadFile("help", file) });
    } catch (e) {
      setPrint(null);
      toast(e instanceof Error ? e.message : "Não foi possível enviar a imagem.", "info");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(validateReport({ type, name: shownName, reason, description })).length > 0) {
      return toast("Confira os campos destacados.", "info");
    }
    if (print === "uploading") return toast("Espere a imagem terminar de enviar.", "info");
    if (busy) return;
    setBusy(true);
    try {
      const r = await reports.send({
        type: type as ReportType,
        targetId: linked ? targetId : null,
        targetName: type === "outro" ? null : shownName.trim(),
        reason,
        description: description.trim(),
        attachmentKey: print ? print.key : undefined,
      });
      setSent({
        protocol: r.protocol,
        summary: `${info?.summary ?? ""}${shownName.trim() ? ` · ${shownName.trim()}` : ""}`,
        reason,
      });
      window.scrollTo(0, 0);
    } catch (err) {
      toast(
        err instanceof Error && err.message ? err.message : "Não foi possível enviar. Tente de novo.",
        "info",
      );
    } finally {
      setBusy(false);
    }
  };

  const again = () => {
    setSent(null);
    setType("");
    setName("");
    setReason("");
    setDescription("");
    setPrint(null);
    setTried(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] leading-10 font-bold text-text-strong">Denunciar</h1>
        <p className="text-base leading-6 text-text-2">
          Viu algo errado? Conte para a gente. Sua denúncia é anônima para a loja.
        </p>
      </div>

      {sent ? (
        <section
          role="status"
          className="flex flex-col items-start gap-3.5 rounded-2xl bg-surface p-6 shadow-sm sm:p-8"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-success text-white">
            <Check className="size-7" strokeWidth={3} aria-hidden />
          </span>
          <h2 className="text-xl leading-7 font-bold text-text-strong">Denúncia recebida</h2>
          <p className="text-[15px] leading-6 text-text-2">
            Obrigado por ajudar a manter a EncontraÊ segura. Seu protocolo é{" "}
            <b className="text-text">{sent.protocol}</b>.
          </p>
          <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-y-1.5 text-[15px] leading-6 sm:grid-cols-[160px_minmax(0,1fr)]">
            <dt className="text-text-muted">Sobre</dt>
            <dd className="font-semibold text-text">{sent.summary}</dd>
            <dt className="text-text-muted">Motivo</dt>
            <dd className="font-semibold text-text">{sent.reason}</dd>
            <dt className="text-text-muted">Prazo de análise</dt>
            <dd className="font-semibold text-text">até 48 h</dd>
          </dl>
          <p className="text-[15px] leading-6 text-text-2">
            Avisaremos o resultado por e-mail e em Notificações. Se houver risco imediato (golpe em
            andamento), não faça pagamentos e procure a polícia.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={again}
              className="inline-flex h-11 items-center rounded-lg border-[1.5px] border-primary px-[18px] text-sm font-bold text-text-strong hover:bg-selected"
            >
              Fazer outra denúncia
            </button>
            <Link
              href={routes.home}
              className="inline-flex h-11 items-center rounded-lg bg-primary px-[18px] text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              Voltar ao início
            </Link>
          </div>
        </section>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="flex flex-col gap-6 rounded-2xl bg-surface p-5 shadow-sm sm:p-8"
        >
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm leading-5 font-bold text-text">
              O que você quer denunciar?
            </legend>
            <div className="flex flex-wrap gap-2">
              {chips.map((t) => {
                const on = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setType(t)}
                    className={cn(
                      "h-[38px] rounded-full border px-4 text-sm font-semibold transition-colors",
                      on
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border bg-surface text-text-2 hover:border-border-strong",
                    )}
                  >
                    {TYPE_INFO[t].chip}
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <span role="alert" className="text-xs leading-4 font-medium text-danger-text">
                Escolha o tipo do que você quer denunciar.
              </span>
            )}
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm leading-5 font-bold text-text">
              {info ? info.nameLabel + (nameRequired ? "" : " (opcional)") : "Nome do item"}
            </span>
            <input
              type="text"
              value={shownName}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Boteco do Zé"
              aria-invalid={!!errors.name}
              className={cn(
                "h-11 rounded-lg border bg-surface px-3.5 text-[15px] text-text placeholder:text-text-subtle",
                errors.name ? "border-danger" : "border-border-strong",
              )}
            />
            {linked && target.isPending && (
              <span className="text-xs text-text-muted">Buscando o nome do item denunciado…</span>
            )}
            {errors.name && (
              <span role="alert" className="text-xs leading-4 font-medium text-danger-text">
                Informe o nome para encontrarmos o conteúdo.
              </span>
            )}
          </label>
          {nameLookupFailed && (
            <p role="alert" className="-mt-4 text-sm text-text-muted">
              Não foi possível buscar o nome do item automaticamente. Digite o nome acima ou{" "}
              <button
                type="button"
                onClick={() => target.refetch()}
                className="font-semibold text-link hover:underline"
              >
                tentar de novo
              </button>
              .
            </p>
          )}

          <fieldset>
            <legend className="mb-2.5 text-sm leading-5 font-bold text-text">Motivo</legend>
            <div role="radiogroup" aria-label="Motivo" className="grid gap-2 sm:grid-cols-2">
              {REPORT_REASONS.map((r) => {
                const on = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setReason(r)}
                    className={cn(
                      "flex h-11 items-center gap-2.5 rounded-lg border px-3.5 text-left text-sm text-text transition-colors",
                      on ? "border-primary bg-selected" : "border-border hover:border-border-strong",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-[18px] shrink-0 rounded-full bg-surface",
                        on ? "border-[5px] border-primary" : "border-2 border-border-strong",
                      )}
                    />
                    {r}
                  </button>
                );
              })}
            </div>
            {errors.reason && (
              <span role="alert" className="mt-1.5 block text-xs leading-4 font-medium text-danger-text">
                Escolha um motivo.
              </span>
            )}
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm leading-5 font-bold text-text">Descreva o que aconteceu</span>
            <textarea
              rows={5}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte o que viu, quando e, se puder, como a loja respondeu."
              aria-invalid={!!errors.description}
              className={cn(
                "resize-y rounded-lg border bg-surface px-3.5 py-3 text-[15px] leading-[22px] text-text placeholder:text-text-subtle",
                errors.description ? "border-danger" : "border-border-strong",
              )}
            />
            <span
              className={cn("text-xs leading-4", errors.description ? "text-danger-text" : "text-text-muted")}
              role={errors.description ? "alert" : undefined}
            >
              {errors.description
                ? "Escreva pelo menos 10 caracteres."
                : `${description.length}/1000 · mínimo 10 caracteres`}
            </span>
          </label>

          <div className="flex items-center gap-3.5 border-y border-border py-3.5">
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm leading-5 font-bold text-text">Anexar print</span>
              <span
                className={cn(
                  "text-[13px] leading-5",
                  print && print !== "uploading" ? "text-success-text" : "text-text-muted",
                )}
              >
                {print === "uploading"
                  ? "Enviando a imagem…"
                  : print
                    ? `✓ ${print.name} será enviado junto`
                    : "Opcional · uma imagem da tela ajuda muito na análise"}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!print}
              aria-label="Anexar print"
              onClick={() => (print ? setPrint(null) : fileRef.current?.click())}
              className={cn(
                "flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors",
                print ? "justify-end bg-primary" : "justify-start bg-border-strong",
              )}
            >
              <span className="size-5 rounded-full bg-white shadow" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                void pickPrint(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-[13px] leading-5 text-text-muted">
              A loja não fica sabendo quem denunciou.
            </span>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-[22px] text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-70"
            >
              {busy ? "Enviando…" : "Enviar denúncia"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
