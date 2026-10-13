"use client";

import { ImagePlus, X } from "lucide-react";
import { useState } from "react";

import { Card, btnPrimary, errMsg } from "@/components/account/shared";
import { TextField } from "@/components/ui/text-field";
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

  if (protocol) {
    return (
      <Card title="Mensagem enviada">
        <p role="status" className="text-text">
          Recebemos sua mensagem. Seu protocolo é <strong className="text-text-strong">{protocol}</strong>.
          Respondemos por e-mail em até 1 dia útil.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Fale conosco">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assunto" className="text-sm font-bold text-text-strong">
            Assunto
          </label>
          <select
            id="assunto"
            value={subject}
            aria-invalid={!!errors.subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-12 rounded-lg border border-border-strong bg-surface px-3 text-text"
          >
            <option value="">Escolha um assunto</option>
            {CONTACT_SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {errors.subject && (
            <p role="alert" className="text-sm text-danger-text">
              {errors.subject}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mensagem" className="text-sm font-bold text-text-strong">
            Mensagem
          </label>
          <textarea
            id="mensagem"
            rows={6}
            maxLength={1000}
            value={message}
            aria-invalid={!!errors.message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-lg border border-border-strong bg-surface p-3 text-text"
          />
          <div className="flex justify-between text-sm">
            <span role={errors.message ? "alert" : undefined} className="text-danger-text">
              {errors.message}
            </span>
            <span className="text-text-subtle">{message.length}/1000</span>
          </div>
        </div>
        <TextField
          label="E-mail para a resposta"
          type="email"
          maxLength={80}
          value={replyEmail}
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-text-strong">Imagem (opcional)</span>
          {file ? (
            <p className="flex items-center gap-2 text-text">
              {file.name}
              <button
                type="button"
                aria-label="Remover imagem"
                onClick={() => setFile(null)}
                className="flex size-9 items-center justify-center rounded-lg hover:bg-surface-2"
              >
                <X className="size-4" aria-hidden />
              </button>
            </p>
          ) : (
            <label className="inline-flex h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-2 hover:bg-surface-2">
              <ImagePlus className="size-4" aria-hidden /> Anexar imagem
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </label>
          )}
          {fileError && (
            <p role="alert" className="text-sm text-danger-text">
              {fileError}
            </p>
          )}
        </div>
        {serverError && (
          <p role="alert" className="text-sm text-danger-text">
            {serverError}
          </p>
        )}
        <div>
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy ? "Enviando…" : "Enviar mensagem"}
          </button>
        </div>
      </form>
    </Card>
  );
}
