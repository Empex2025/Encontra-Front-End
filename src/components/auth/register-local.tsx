"use client";

import { LocateFixed } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { TextField } from "@/components/ui/text-field";
import { useUserLocation } from "@/hooks/use-user-location";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { DEFAULT_RADIUS } from "@/lib/domain/radius";
import { isValidCep, maskCep, onlyDigits } from "@/lib/domain/validation";

import { AuthCard, FormError, PrimaryButton, SecondaryButton } from "./auth-card";

const UFS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
] as const;

type Coords = { lat: number | null; lng: number | null };

/** Etapa 3: onde a pessoa está. Grava o endereço principal e o local do cabeçalho. */
export function RegisterLocal({ onBack, onDone }: { onBack: () => void; onDone: (label: string) => void }) {
  const { save } = useUserLocation();
  const cepRef = useRef<HTMLInputElement>(null);
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState<string>("");
  const [coords, setCoords] = useState<Coords>({ lat: null, lng: null });
  const [found, setFound] = useState(false);
  const [cepError, setCepError] = useState("");
  const [gps, setGps] = useState<"idle" | "searching" | "denied">("idle");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const lookup = async (masked: string) => {
    const digits = onlyDigits(masked);
    setFound(false);
    setCepError("");
    if (digits.length !== 8) return;
    try {
      const r = await authApi.cep(digits);
      setStreet(r.street ?? "");
      setNeighborhood(r.neighborhood ?? "");
      setCity(r.city);
      setUf(r.state);
      setCoords({ lat: r.lat, lng: r.lng });
      setFound(true);
    } catch (e) {
      setCepError(
        e instanceof ApiError && e.status === 404
          ? "CEP não encontrado. Confira os números."
          : "Não foi possível buscar o CEP agora. Preencha o bairro e a cidade.",
      );
    }
  };

  const useGps = () => {
    if (gps === "searching") return;
    if (!("geolocation" in navigator)) {
      setGps("denied");
      return;
    }
    setGps("searching");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const r = await authApi.reverseGeo(lat, lng);
          setCep(r.cep ? maskCep(r.cep) : "");
          setStreet(r.street ?? "");
          setNeighborhood(r.neighborhood ?? "");
          setCity(r.city);
          setUf(r.state);
          setCoords({ lat, lng });
          setFound(true);
          setGps("idle");
        } catch {
          setGps("denied");
        }
      },
      () => setGps("denied"),
      { timeout: 8000 },
    );
  };

  const nb = neighborhood.trim();
  const ct = city.trim();
  const errors = {
    cep: !isValidCep(cep) ? "CEP incompleto (8 números)." : undefined,
    neighborhood: nb.length < 2 || nb.length > 40 ? "Digite o bairro." : undefined,
    city: ct.length < 2 || ct.length > 40 ? "Digite a cidade." : undefined,
    uf: !uf ? "Escolha o estado." : undefined,
  };
  const valid = !errors.cep && !errors.neighborhood && !errors.city && !errors.uf;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (!valid || busy) return;
    setBusy(true);
    const label = `${nb}, ${ct} - ${uf}`;
    try {
      await authApi.saveAddress({
        cep: onlyDigits(cep),
        street: street.trim(),
        neighborhood: nb,
        city: ct,
        state: uf,
        lat: coords.lat,
        lng: coords.lng,
        main: true,
      });
      await save.mutateAsync({ label, lat: coords.lat, lng: coords.lng, radiusKm: DEFAULT_RADIUS });
      onDone(label);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Não foi possível salvar sua localização. Tente de novo.",
      );
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Sua localização"
      subtitle="Usamos para mostrar lojas e prestadores perto de você."
      step={{ current: 3, total: 4, label: "Localização" }}
      wide
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <button
          type="button"
          onClick={useGps}
          disabled={gps === "searching"}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface text-base font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-60"
        >
          <LocateFixed className="size-5" aria-hidden />
          {gps === "searching" ? "Buscando sua localização…" : "Usar minha localização atual"}
        </button>

        {gps === "denied" && (
          <div role="status" className="rounded-lg bg-accent-soft p-3 text-sm text-text-2">
            <p className="font-bold text-text-strong">Não conseguimos acessar sua localização</p>
            <p>Tudo bem! Digite seu CEP ou bairro abaixo.</p>
            <div className="mt-2 flex flex-wrap gap-x-4">
              <button
                type="button"
                onClick={() => cepRef.current?.focus()}
                className="h-10 font-semibold text-link hover:underline"
              >
                Digitar CEP
              </button>
              <Link
                href="/ajuda"
                target="_blank"
                className="inline-flex h-10 items-center font-semibold text-link hover:underline"
              >
                Como liberar a localização
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cep" className="text-sm font-bold text-text-strong">
            CEP
          </label>
          <input
            id="cep"
            ref={cepRef}
            value={cep}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00.000-000"
            aria-invalid={tried && !!errors.cep}
            onChange={(e) => {
              const m = maskCep(e.target.value);
              setCep(m);
              void lookup(m);
            }}
            className="h-12 rounded-lg border border-border-strong bg-surface px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-focus/40 aria-[invalid=true]:border-danger"
          />
          {found && (
            <p role="status" className="text-sm font-semibold text-success-text">
              Endereço encontrado
            </p>
          )}
          {(cepError || (tried && errors.cep)) && (
            <p role="alert" className="text-sm text-danger-text">
              {cepError || errors.cep}
            </p>
          )}
        </div>

        <TextField
          label="Endereço (opcional)"
          value={street}
          onChange={(e) => setStreet(e.target.value.slice(0, 80))}
          autoComplete="street-address"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Bairro"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value.slice(0, 40))}
            autoComplete="address-level3"
            error={tried ? errors.neighborhood : undefined}
          />
          <TextField
            label="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, 40))}
            autoComplete="address-level2"
            error={tried ? errors.city : undefined}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="uf" className="text-sm font-bold text-text-strong">
            Estado
          </label>
          <select
            id="uf"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            aria-invalid={tried && !!errors.uf}
            className="h-12 rounded-lg border border-border-strong bg-surface px-3 text-base text-text aria-[invalid=true]:border-danger"
          >
            <option value="">Escolha o estado</option>
            {UFS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
          {tried && errors.uf && (
            <p role="alert" className="text-sm text-danger-text">
              {errors.uf}
            </p>
          )}
        </div>

        <p className="text-sm text-text-muted">Você pode mudar sua localização quando quiser.</p>
        {serverError && <FormError>{serverError}</FormError>}

        <div className="flex gap-3">
          <SecondaryButton onClick={onBack}>Voltar</SecondaryButton>
          <div className="flex-1 [&>button]:w-full">
            <PrimaryButton looksDisabled={!valid} loading={busy}>
              {busy ? "Salvando…" : "Confirmar"}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
