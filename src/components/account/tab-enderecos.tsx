"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Navigation } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { account, type Address } from "@/lib/api/account";
import { authApi } from "@/lib/api/auth";
import { queryKeys } from "@/lib/api/endpoints";
import {
  ADDRESS_LABEL_MAX,
  afterRemoval,
  canRemoveAddress,
  LAST_ADDRESS_MSG,
  validateNewAddress,
} from "@/lib/domain/account";
import { RADIUS_STEPS } from "@/lib/domain/radius";
import { isValidCep, maskCep, onlyDigits } from "@/lib/domain/validation";

import { btnPrimary, btnSmallDanger, Card, errMsg, Field, Loading } from "./shared";

const KEY = ["me", "addresses"];

export function TabEnderecos() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: KEY, queryFn: account.addresses });
  const [adding, setAdding] = useState<false | "form" | "gps">(false);
  const list = q.data?.items;

  const refreshLocation = () => void qc.invalidateQueries({ queryKey: queryKeys.location });
  const main = useMutation({
    mutationFn: (id: string) => account.updateAddress(id, { main: true }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      refreshLocation();
      toast("Endereço principal atualizado.");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => account.removeAddress(id),
    onSuccess: (_r, id) => {
      qc.setQueryData(KEY, (old: { items: Address[] } | undefined) =>
        old ? { items: afterRemoval(old.items, id) } : old,
      );
      void qc.invalidateQueries({ queryKey: KEY });
      refreshLocation();
      toast("Endereço removido.");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });

  const tryRemove = (a: Address) => {
    if (!list || !canRemoveAddress(list.length)) return toast(LAST_ADDRESS_MSG, "info");
    remove.mutate(a.id);
  };

  return (
    <>
      <Card title="Onde você busca" aside="Usamos para mostrar o que está perto e calcular distâncias.">
        {q.isPending ? (
          <Loading />
        ) : q.isError ? (
          <ErrorState
            error={q.error}
            onRetry={() => q.refetch()}
            title="Não foi possível carregar seus endereços"
          />
        ) : (
          <>
            {q.data.items.length === 0 ? (
              <p className="border-t border-surface-2 pt-4 text-sm text-text-muted">
                Você ainda não tem endereço salvo. Adicione um para ver o que está perto.
              </p>
            ) : (
              <ul role="radiogroup" aria-label="Endereço principal" className="flex flex-col">
                {q.data.items.map((a) => (
                  <li key={a.id} className="flex items-center gap-3.5 border-t border-surface-2 py-3.5">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={a.main}
                      aria-label={`Usar ${a.label || "Outro"} como principal`}
                      disabled={main.isPending}
                      onClick={() => !a.main && main.mutate(a.id)}
                      className={cn(
                        "size-5 shrink-0 rounded-full bg-surface",
                        a.main ? "border-[6px] border-primary" : "border-[1.5px] border-text-subtle",
                      )}
                    />
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-selected text-text-strong"
                    >
                      <Home className="size-[18px]" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-text">
                        {a.label || "Outro"}
                        {a.main && (
                          <span className="inline-flex h-5 items-center rounded bg-accent-soft px-2 text-[11px] font-bold text-accent-text">
                            Principal
                          </span>
                        )}
                      </p>
                      <p className="text-[13px] text-text-muted">
                        {[
                          [a.street, a.number].filter(Boolean).join(", ") + (a.neighborhood ? ` – ${a.neighborhood}` : ""),
                          `${a.city} - ${a.state}`,
                          a.cep ? `CEP ${maskCep(a.cep)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button type="button" className={btnSmallDanger} onClick={() => tryRemove(a)}>
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!adding && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex h-[42px] items-center rounded-lg border-[1.5px] border-dashed border-navy-300 bg-surface px-4 text-[13px] font-bold text-text-strong hover:bg-surface-2"
                  onClick={() => setAdding("form")}
                >
                  + Adicionar endereço
                </button>
                <button
                  type="button"
                  className="inline-flex h-[42px] items-center gap-1.5 rounded-lg bg-selected px-4 text-[13px] font-bold text-text-strong hover:opacity-90"
                  onClick={() => setAdding("gps")}
                >
                  <Navigation className="size-4" aria-hidden /> Usar minha localização atual
                </button>
              </div>
            )}
          </>
        )}
        {adding && (
          <NewAddress
            locateNow={adding === "gps"}
            onClose={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              void qc.invalidateQueries({ queryKey: KEY });
              toast("Endereço salvo.");
            }}
          />
        )}
      </Card>
      <RadiusCard />
    </>
  );
}

function NewAddress({
  onClose,
  onSaved,
  locateNow,
}: {
  onClose: () => void;
  onSaved: () => void;
  locateNow?: boolean;
}) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [hood, setHood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const fill = (r: {
    cep?: string | null;
    street: string | null;
    neighborhood: string | null;
    city: string;
    state: string;
    lat: number | null;
    lng: number | null;
  }) => {
    if (r.cep) setCep(maskCep(r.cep));
    setStreet(r.street ?? "");
    setHood(r.neighborhood ?? "");
    setCity(r.city);
    setState(r.state);
    setCoords({ lat: r.lat, lng: r.lng });
  };

  const onCep = async (v: string) => {
    const masked = maskCep(v);
    setCep(masked);
    if (!isValidCep(masked)) return;
    try {
      fill(await authApi.cep(onlyDigits(masked)));
    } catch {
      toast("Não encontramos esse CEP. Preencha o endereço.", "info");
    }
  };

  const locateHere = () => {
    if (!navigator.geolocation) return toast("Seu navegador não informa a localização.", "info");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          fill(await authApi.reverseGeo(pos.coords.latitude, pos.coords.longitude));
        } catch (e) {
          toast(errMsg(e, "Não foi possível descobrir o endereço."), "info");
        }
      },
      () => toast("Sem permissão de localização. Digite o CEP.", "info"),
      { timeout: 10_000 },
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (validateNewAddress({ cep, street }) || busy) return;
    setBusy(true);
    try {
      await account.addAddress({
        label: label.trim(),
        cep: onlyDigits(cep),
        street: street.trim(),
        number: number.trim() || undefined,
        neighborhood: hood.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        ...coords,
      });
      onSaved();
    } catch (err) {
      toast(errMsg(err), "info");
      setBusy(false);
    }
  };

  const locatedRef = useRef(false);
  useEffect(() => {
    if (locateNow && !locatedRef.current) {
      locatedRef.current = true;
      locateHere();
    }
    // só na abertura: "Usar minha localização atual" já pede a posição ao abrir o formulário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const err = tried ? validateNewAddress({ cep, street }) : null;
  const found = !!(hood || city) && isValidCep(cep);
  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-surface-3 bg-bg p-4"
    >
      <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr]">
        <Field
          label="CEP"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => void onCep(e.target.value)}
        />
        <Field
          label="Endereço"
          placeholder="Rua e número"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          error={err ?? undefined}
        />
        <Field
          label="Nome do endereço"
          placeholder="Ex.: Casa da mãe"
          maxLength={ADDRESS_LABEL_MAX}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[120px_1fr_1fr_80px]">
        <Field label="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
        <Field label="Bairro" value={hood} onChange={(e) => setHood(e.target.value)} />
        <Field label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Field label="UF" maxLength={2} value={state} onChange={(e) => setState(e.target.value)} />
      </div>
      <p className="text-xs text-text-subtle">
        {found
          ? `CEP encontrado: ${[hood, `${city} - ${state}`].filter(Boolean).join(", ")}. Complete o número.`
          : "Digite o CEP para preencher a rua e o bairro."}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center px-3 text-[13px] font-semibold text-text-muted"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button type="submit" className={cn(btnPrimary, "h-10 px-4 text-[13px]")} disabled={busy}>
          {busy ? "Salvando…" : "Salvar endereço"}
        </button>
      </div>
    </form>
  );
}

/** Distância padrão das buscas (1/3/5/10/20/50 km). */
function RadiusCard() {
  const toast = useToast();
  const { location, save } = useUserLocation();
  const idx = Math.max(0, RADIUS_STEPS.indexOf(location.radiusKm as (typeof RADIUS_STEPS)[number]));
  return (
    <Card title="Distância padrão das buscas">
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={RADIUS_STEPS.length - 1}
          step={1}
          value={idx}
          aria-label="Distância padrão em km"
          aria-valuetext={`${location.radiusKm} km`}
          onChange={async (e) => {
            const km = RADIUS_STEPS[Number(e.target.value)];
            try {
              await save.mutateAsync({ ...location, radiusKm: km });
            } catch (err) {
              toast(errMsg(err), "info");
            }
          }}
          className="h-6 flex-1 accent-[var(--color-primary)]"
        />
        <span className="flex h-10 w-[90px] shrink-0 items-center justify-center rounded-lg bg-selected text-[15px] font-extrabold text-text-strong">
          {location.radiusKm} km
        </span>
      </div>
      <div className="flex justify-between pr-[106px] text-xs text-text-subtle" aria-hidden>
        {RADIUS_STEPS.map((r) => (
          <span key={r} className={cn(r === location.radiusKm && "font-bold text-text-strong")}>
            {r}
          </span>
        ))}
      </div>
      <p className="text-[13px] text-text-subtle">
        Você sempre pode mudar a distância em cada busca. Se não houver resultado, ampliamos automaticamente.
      </p>
    </Card>
  );
}
