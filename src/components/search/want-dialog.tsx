"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Lock, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import { createWant, type Want } from "@/lib/api/search";
import { routes } from "@/lib/routes";

const KMS = [1, 3, 5, 10] as const;
const DEADLINES: { id: Want["deadline"]; label: string; valid: string }[] = [
  { id: "today", label: "Hoje", valid: "até o fim do dia" },
  { id: "week", label: "Esta semana", valid: "por 7 dias" },
  { id: "month", label: "Sem pressa (30 dias)", valid: "por 30 dias" },
];

/** "Quero em promoção" (Documento de entrega › Explorar, regras 23–25). */
export function WantDialog({
  initialTerm,
  radiusKm,
  returnTo,
  onClose,
}: {
  initialTerm: string;
  radiusKm: number;
  returnTo: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { me, isLoading } = useSession();
  const [term, setTerm] = useState(initialTerm.slice(0, 60));
  // começa no raio atual, limitado entre 3 e 10 km (regra 23)
  const start = Math.min(10, Math.max(3, radiusKm));
  const [km, setKm] = useState<(typeof KMS)[number]>(KMS.filter((k) => k <= start).pop() ?? 3);
  const [deadline, setDeadline] = useState<Want["deadline"]>("week");
  const [maxPrice, setMaxPrice] = useState("");
  const [tried, setTried] = useState(false);

  const send = useMutation({
    mutationFn: () =>
      createWant({
        term: term.trim(),
        radiusKm: km,
        deadline,
        maxPriceCents: maxPrice ? Number(maxPrice) * 100 : null,
      }),
  });

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const valid = term.trim().length >= 2;
  const validTxt = DEADLINES.find((d) => d.id === deadline)!.valid;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(94vw,480px)] rounded-2xl border border-border bg-surface p-0 text-text shadow-pop backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-text-strong">
            {send.isSuccess ? "Pedido enviado!" : "Quero em promoção"}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Fechar"
            className="flex size-10 items-center justify-center rounded-full hover:bg-surface-2"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {isLoading ? null : !me ? (
          <div className="flex flex-col gap-4">
            <p className="text-text-muted">
              Entre na sua conta para pedir “{term}” em promoção. Assim avisamos você quando uma loja criar a
              oferta.
            </p>
            <Link
              href={`${routes.entrar}?volta=${encodeURIComponent(returnTo)}`}
              className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              Entrar ou criar conta grátis
            </Link>
          </div>
        ) : send.isSuccess ? (
          <div className="flex flex-col gap-4">
            <CheckCircle2 className="size-10 text-success" aria-hidden />
            <p className="text-text">
              Você e mais <b>{send.data.people} pessoas</b> até {send.data.radiusKm} km querem{" "}
              <b>“{send.data.term}”</b> em promoção. Já avisamos{" "}
              <b>{send.data.profilesNotified} lojas e prestadores</b> do ramo.
            </p>
            <p className="rounded-xl bg-accent-soft p-3 text-sm text-text">
              <b>Próximo passo:</b> quando uma loja criar a oferta, você recebe uma notificação com preço,
              distância e validade.
            </p>
            <div className="flex justify-end gap-2">
              <Link
                href={`${routes.atividade}?aba=want`}
                className="flex h-11 items-center rounded-lg px-4 text-sm font-semibold text-link hover:bg-surface-2"
              >
                Ver meus pedidos
              </Link>
              <button
                type="button"
                onClick={() => ref.current?.close()}
                className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary"
              >
                Pronto
              </button>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setTried(true);
              if (valid) send.mutate();
            }}
          >
            <p className="text-sm text-text-muted">
              Avisamos as lojas e prestadores perto que tem gente querendo isso. Quando alguém criar uma
              oferta, você é o primeiro a saber.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-text-strong">O que você quer</span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value.slice(0, 60))}
                placeholder="Ex.: açaí, manicure, tênis de corrida"
                aria-invalid={tried && !valid}
                className={cn(
                  "h-11 rounded-lg border bg-surface px-3 text-base outline-none focus:border-primary",
                  tried && !valid ? "border-danger" : "border-border-strong",
                )}
              />
            </label>
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-text-strong">Até onde você iria</legend>
              <div className="flex flex-wrap gap-2">
                {KMS.map((k) => (
                  <Option key={k} on={km === k} onClick={() => setKm(k)}>
                    até {k} km
                  </Option>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-text-strong">Para quando</legend>
              <div className="flex flex-wrap gap-2">
                {DEADLINES.map((d) => (
                  <Option key={d.id} on={deadline === d.id} onClick={() => setDeadline(d.id)}>
                    {d.label}
                  </Option>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-text-strong">Pago até (opcional)</span>
              <span className="flex h-11 items-center gap-2 rounded-lg border border-border-strong px-3 focus-within:border-primary">
                <span className="text-text-subtle">R$</span>
                <input
                  inputMode="numeric"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="min-w-0 flex-1 bg-transparent text-base outline-none focus-visible:outline-none"
                />
              </span>
            </label>
            <p className="flex gap-2 rounded-xl bg-surface-2 p-3 text-xs text-text-muted">
              <Lock className="size-4 shrink-0" aria-hidden />
              <span>
                <b className="text-text">Privado:</b> as lojas só veem quantas pessoas querem e a distância
                aproximada — nunca seu nome ou contato. O pedido vale {validTxt} e você pode cancelar quando
                quiser.
              </span>
            </p>
            {send.isError && (
              <p role="alert" className="text-sm text-danger-text">
                {send.error instanceof ApiError && send.error.status < 500
                  ? send.error.message
                  : "Não foi possível enviar agora. Tente de novo."}
              </p>
            )}
            <button
              type="submit"
              disabled={!valid || send.isPending}
              className="h-12 rounded-lg bg-accent text-[15px] font-bold text-on-accent hover:bg-accent-hover disabled:bg-surface-3 disabled:text-text-subtle"
            >
              {send.isPending ? "Enviando…" : "Enviar pedido"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

function Option({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "h-10 rounded-full border px-3.5 text-sm font-semibold",
        on ? "border-primary bg-primary text-on-primary" : "border-border text-text-2 hover:border-navy-300",
      )}
    >
      {children}
    </button>
  );
}
