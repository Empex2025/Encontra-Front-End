"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { btnPrimary, errMsg, Field } from "@/components/account/shared";
import { cn } from "@/components/ui/cn";
import { useSession } from "@/hooks/use-session";
import { CONTACT_SUBJECTS, help } from "@/lib/api/account";
import { uploadFile } from "@/lib/api/chat";
import { validateContact } from "@/lib/domain/account";
import { isValidEmail } from "@/lib/domain/validation";

const MAX_IMAGE = 5 * 1024 * 1024;

export function ContactForm() {
  const { me } = useSession();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [protocol, setProtocol] = useState<string | null>(null);

  const replyEmail = email ?? me?.email ?? "";
  const errors = tried ? validateContact({ subject, message }) : {};
  const emailError = tried && !isValidEmail(replyEmail) ? "Confira o e-mail." : undefined;

  const pick = (f: File | undefined) => {
    setFileError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setFileError("Escolha uma imagem.");
    if (f.size > MAX_IMAGE) return setFileError("A imagem pode ter até 5 MB.");
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (Object.keys(validateContact({ subject, message })).length > 0 || !isValidEmail(replyEmail) || busy)
      return;
    setBusy(true);
    try {
      const imageKey = file ? await uploadFile("help", file) : undefined;
      const r = await help.contact({
        subject,
        message: message.trim(),
        replyEmail: replyEmail.trim(),
        imageKey,
      });
      setProtocol(r.protocol);
    } catch (err) {
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const filled = !!subject && message.trim().length >= 10;
  if (protocol) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-7 py-12 text-center shadow-card">
        <span className="flex size-16 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-8" strokeWidth={3} aria-hidden />
        </span>
        <h2 className="text-[22px] leading-[30px] font-bold text-text-strong">Mensagem enviada</h2>
        <p role="status" className="max-w-[460px] text-sm leading-[22px] text-text-muted">
          Protocolo <b className="text-text">{protocol}</b>. Respondemos em até 1 dia útil por e-mail e você
          também verá a resposta em Notificações.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setProtocol(null);
              setSubject("");
              setMessage("");
              setFile(null);
              setTried(false);
            }}
            className="inline-flex h-11 items-center rounded-lg border-[1.5px] border-primary bg-surface px-[18px] text-sm font-bold text-text-strong hover:bg-surface-2"
          >
            Enviar outra
          </button>
          <Link href="/" className={cn(btnPrimary, "px-[18px]")}>
            Voltar ao início
          </Link>
        </div>
      </section>
    );
  }

  const box =
    "rounded-lg border bg-surface text-sm text-text outline-none focus:ring-2 focus:ring-focus/40";
  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-card sm:p-7"
    >
      <h2 className="text-xl leading-7 font-bold text-text-strong">Fale conosco</h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="assunto" className="text-xs font-semibold text-text-2">
          Sobre o que você quer falar?
        </label>
        <select
          id="assunto"
          value={subject}
          aria-invalid={!!errors.subject}
          onChange={(e) => setSubject(e.target.value)}
          className={cn(box, "h-11 px-3", errors.subject ? "border-danger" : "border-navy-300")}
        >
          <option value="">Escolha um assunto</option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mensagem" className="text-xs font-semibold text-text-2">
          Conte o que aconteceu
        </label>
        <textarea
          id="mensagem"
          rows={6}
          maxLength={1000}
          value={message}
          aria-invalid={!!errors.message}
          placeholder="Quanto mais detalhes (loja, produto, horário), mais rápido resolvemos."
          onChange={(e) => setMessage(e.target.value)}
          className={cn(box, "resize-y p-3 leading-5", errors.message ? "border-danger" : "border-navy-300")}
        />
        <span
          role={errors.subject || errors.message ? "alert" : undefined}
          className={cn("text-xs", errors.subject || errors.message ? "text-danger-text" : "text-text-subtle")}
        >
          {errors.subject ?? errors.message ?? `${message.length}/1000`}
        </span>
      </div>
      {!me?.email && (
        <Field
          label="E-mail para a resposta"
          type="email"
          maxLength={80}
          value={replyEmail}
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        {file ? (
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-navy-300 bg-surface px-3.5 text-[13px] font-bold text-link">
            ✓ {file.name}
            <button
              type="button"
              aria-label="Remover imagem"
              onClick={() => setFile(null)}
              className="flex size-6 items-center justify-center rounded hover:bg-surface-2"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ) : (
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-dashed border-navy-300 bg-surface px-3.5 text-[13px] font-bold text-link hover:bg-surface-2">
            + Anexar imagem
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
        )}
        <span className="text-xs text-text-subtle">Opcional · print da tela ajuda muito</span>
      </div>
      {fileError && (
        <p role="alert" className="text-xs text-danger-text">
          {fileError}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-sm text-danger-text">
          {serverError}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-3 pt-2">
        <span className="min-w-0 text-xs text-text-subtle">
          Respondemos por e-mail e em Notificações{replyEmail ? ` · ${replyEmail}` : ""}
        </span>
        <button
          type="submit"
          className={cn(btnPrimary, "px-6", !filled && "bg-text-subtle!")}
          disabled={busy}
        >
          {busy ? "Enviando…" : "Enviar mensagem"}
        </button>
      </div>
    </form>
  );
}
