"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { track } from "@/lib/analytics/track";
import { actions, type AlertChannel, type AlertCondition } from "@/lib/api/actions";
import type { Alert, Product } from "@/lib/api/catalog";
import {
  type AlertDraft,
  belowCents,
  CHANNEL_LABEL,
  CONDITION_LABEL,
  RADIUS_OPTIONS,
  summarizeAlert,
  validateAlert,
} from "@/lib/domain/alert-form";

/** "Avise-me": várias condições, tamanho, raio e canais; vale 30 dias; um alerta por produto (criar de novo substitui). */
export function AlertDialog({
  product,
  initialConditions,
  initialSize,
  onClose,
}: {
  product: Pick<Product, "id" | "slug" | "title" | "sizes" | "location">;
  initialConditions: AlertCondition[];
  initialSize: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [d, setD] = useState<AlertDraft>({
    conditions: initialConditions,
    belowReais: "",
    size: initialSize,
    radiusKm: 10,
    channels: ["site"],
  });
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState<Alert | null>(null);
  const error = validateAlert(d);

  const create = useMutation({
    mutationFn: () =>
      actions.createAlert({
        productId: product.id,
        conditions: d.conditions,
        belowCents: belowCents(d),
        size: d.size ?? undefined,
        radiusKm: d.radiusKm,
        channels: d.channels,
      }),
    onSuccess: (a) => {
      setDone(a);
      track({
        type: "ALERT_CREATED",
        targetType: "PRODUCT",
        targetId: product.id,
        props: { conditions: a.conditions },
      });
      qc.invalidateQueries({ queryKey: ["product", product.slug] });
      qc.invalidateQueries({ queryKey: ["me", "alerts"] });
    },
  });

  const toggle = <T extends string>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  if (done)
    return (
      <Modal title="Alerta criado!" onClose={onClose}>
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <p className="text-text">
          {summarizeAlert({
            conditions: done.conditions,
            size: done.size,
            city: done.city ?? product.location.city,
            radiusKm: done.radiusKm,
            channels: done.channels,
            belowCents: done.belowCents,
          })}
        </p>
        <p className="text-sm text-text-muted">
          O alerta vale por 30 dias. Você pode editar ou cancelar em Minha atividade.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary"
        >
          Pronto
        </button>
      </Modal>
    );

  return (
    <Modal title="Avise-me" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (!error) create.mutate();
        }}
      >
        <p className="text-sm text-text-muted">{product.title}</p>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold text-text-strong">Me avise quando:</legend>
          {(Object.keys(CONDITION_LABEL) as AlertCondition[]).map((c) => (
            <label
              key={c}
              className="flex items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-selected"
            >
              <input
                type="checkbox"
                checked={d.conditions.includes(c)}
                onChange={() => setD({ ...d, conditions: toggle(d.conditions, c) })}
                className="mt-1 size-4"
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-text-strong">{CONDITION_LABEL[c].label}</span>
                {CONDITION_LABEL[c].hint && (
                  <span className="text-xs text-text-muted">{CONDITION_LABEL[c].hint}</span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        {d.conditions.includes("price_drop") && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-text-strong">Só me avise abaixo de R$ (opcional)</span>
            <input
              inputMode="numeric"
              value={d.belowReais}
              maxLength={5}
              onChange={(e) => setD({ ...d, belowReais: e.target.value.replace(/\D/g, "") })}
              placeholder="Ex.: 250"
              className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-base text-text"
            />
          </label>
        )}

        {product.sizes && product.sizes.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-text-strong">Tamanho</span>
            <select
              value={d.size ?? ""}
              onChange={(e) => setD({ ...d, size: e.target.value || null })}
              className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-base text-text"
            >
              <option value="">Qualquer tamanho</option>
              {product.sizes.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold text-text-strong">
            Onde procurar{product.location.city ? ` · a partir de ${product.location.city}` : ""}
          </legend>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <label
                key={r}
                className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg border border-border text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-on-primary"
              >
                <input
                  type="radio"
                  name="raio"
                  className="sr-only"
                  checked={d.radiusKm === r}
                  onChange={() => setD({ ...d, radiusKm: r })}
                />
                até {r} km
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold text-text-strong">Avisar por</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CHANNEL_LABEL) as AlertChannel[]).map((c) => (
              <label
                key={c}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-selected"
              >
                <input
                  type="checkbox"
                  checked={d.channels.includes(c)}
                  onChange={() => setD({ ...d, channels: toggle(d.channels, c) })}
                  className="size-4"
                />
                {CHANNEL_LABEL[c]}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-sm text-text-muted">O alerta vale por 30 dias.</p>
        {tried && error && (
          <p role="alert" className="text-sm font-semibold text-danger-text">
            {error}
          </p>
        )}
        {create.isError && (
          <p role="alert" className="text-sm font-semibold text-danger-text">
            {create.error.message}
          </p>
        )}
        <button
          type="submit"
          disabled={create.isPending}
          className="h-12 rounded-lg bg-primary text-base font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {create.isPending ? "Criando…" : "Criar alerta"}
        </button>
      </form>
    </Modal>
  );
}
