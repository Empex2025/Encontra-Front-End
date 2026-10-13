"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LocateFixed, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { TextField } from "@/components/ui/text-field";
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

import { btnOutline, btnPrimary, Card, errMsg, Loading } from "./shared";

const KEY = ["me", "addresses"];

export function TabEnderecos() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: KEY, queryFn: account.addresses });
  const [adding, setAdding] = useState(false);
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
    <div className="flex flex-col gap-4">
      <Card title="Seus endereços">
        {q.isPending ? (
          <Loading />
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {q.data.items.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-xl border p-3",
                    a.main ? "border-primary bg-selected" : "border-border",
                  )}
                >
                  <MapPin className="size-5 shrink-0 text-link" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text-strong">
                      {a.label || "Outro"}
                      {a.main && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-on-primary">
                          Principal
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-text-muted">
                      {[a.street, a.number, a.neighborhood, `${a.city} - ${a.state}`]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  {!a.main && (
                    <button
                      type="button"
                      className={btnOutline}
                      disabled={main.isPending}
                      onClick={() => main.mutate(a.id)}
                    >
                      <Star className="mr-1.5 size-4" aria-hidden /> Tornar principal
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Remover endereço ${a.label || "Outro"}`}
                    className="flex size-11 items-center justify-center rounded-lg text-danger-text hover:bg-surface-2"
                    onClick={() => tryRemove(a)}
                  >
                    <Trash2 className="size-5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            {!adding && (
              <div>
                <button type="button" className={btnOutline} onClick={() => setAdding(true)}>
                  <Plus className="mr-1.5 size-4" aria-hidden /> Adicionar endereço
                </button>
              </div>
            )}
          </>
        )}
        {adding && (
          <NewAddress
            onClose={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              void qc.invalidateQueries({ queryKey: KEY });
              toast("Endereço adicionado.");
            }}
          />
        )}
      </Card>
      <RadiusCard />
    </div>
  );
}

function NewAddress({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
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

  const useHere = () => {
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

  const err = tried ? validateNewAddress({ cep, street }) : null;
  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:p-4"
    >
      <h3 className="font-bold text-text-strong">Novo endereço</h3>
      <button type="button" className={cn(btnOutline, "self-start")} onClick={useHere}>
        <LocateFixed className="mr-1.5 size-4" aria-hidden /> Usar minha localização atual
      </button>
      <TextField
        label="Nome do endereço (opcional)"
        placeholder="Casa, Trabalho…"
        maxLength={ADDRESS_LABEL_MAX}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="CEP" inputMode="numeric" value={cep} onChange={(e) => void onCep(e.target.value)} />
        <TextField label="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
      </div>
      <TextField
        label="Endereço"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        error={err ?? undefined}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField label="Bairro" value={hood} onChange={(e) => setHood(e.target.value)} />
        <TextField label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <TextField label="UF" maxLength={2} value={state} onChange={(e) => setState(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? "Salvando…" : "Salvar endereço"}
        </button>
        <button type="button" className={btnOutline} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Raio padrão das buscas (1/3/5/10/20/50 km). */
function RadiusCard() {
  const toast = useToast();
  const { location, save } = useUserLocation();
  const idx = Math.max(0, RADIUS_STEPS.indexOf(location.radiusKm as (typeof RADIUS_STEPS)[number]));
  return (
    <Card title="Raio padrão de busca">
      <p className="text-sm text-text-muted">Até onde procuramos a partir do seu endereço principal.</p>
      <input
        type="range"
        min={0}
        max={RADIUS_STEPS.length - 1}
        step={1}
        value={idx}
        aria-label="Raio padrão de busca"
        aria-valuetext={`${location.radiusKm} km`}
        onChange={async (e) => {
          const km = RADIUS_STEPS[Number(e.target.value)];
          try {
            await save.mutateAsync({ ...location, radiusKm: km });
          } catch (err) {
            toast(errMsg(err), "info");
          }
        }}
        className="w-full accent-[var(--color-primary)]"
      />
      <div className="flex justify-between text-sm text-text-muted" aria-hidden>
        {RADIUS_STEPS.map((r) => (
          <span key={r} className={cn(r === location.radiusKm && "font-bold text-text-strong")}>
            {r} km
          </span>
        ))}
      </div>
    </Card>
  );
}
