"use client";

import { CircleCheck, Navigation, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { useUserLocation } from "@/hooks/use-user-location";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { DEFAULT_RADIUS } from "@/lib/domain/radius";
import { isValidCep, maskCep, onlyDigits } from "@/lib/domain/validation";

import { cn } from "@/components/ui/cn";

import {
  ActionRow,
  AuthBackdrop,
  AuthPanel,
  FormError,
  linkCls,
  outlineBtnCls,
  PrimaryButton,
  SecondaryButton,
  StepHeader,
} from "./auth-card";
import { authInputCls, authLabelCls, AuthTextField, FieldError } from "./auth-fields";

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
    uf: !uf ? "Escolha a UF." : undefined,
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
    <AuthBackdrop footer="Você pode mudar sua localização quando quiser.">
      <AuthPanel width={800} labelledBy="local-title">
        <StepHeader
          id="local-title"
          title="Sua localização"
          subtitle="Usamos para mostrar lojas e prestadores perto de você."
          current={3}
        />
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <button
            type="button"
            onClick={useGps}
            aria-busy={gps === "searching"}
            className={cn(outlineBtnCls, "w-fit gap-2 px-4")}
          >
            {gps === "searching" ? (
              <>
                <span
                  aria-hidden
                  className="size-4 animate-spin rounded-full border-2 border-navy-200 border-t-primary"
                />
                Buscando sua localização…
              </>
            ) : (
              <>
                <Navigation className="size-[18px]" aria-hidden />
                Usar minha localização atual
              </>
            )}
          </button>

          {gps === "denied" && (
            <div
              role="alert"
              className="anim-rise flex gap-3 rounded-xl border border-accent-border bg-accent-soft px-4 py-3.5"
            >
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
              <div className="flex flex-col gap-1.5 text-accent-text">
                <span className="text-sm font-bold">Não conseguimos acessar sua localização</span>
                <span className="text-[13px] leading-[19px]">
                  Tudo bem! Digite seu CEP ou bairro abaixo. Se quiser usar o GPS, libere a localização no
                  cadeado ao lado do endereço do site (ou em Ajustes › Localização no celular).
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => cepRef.current?.focus()}
                    className={`${linkCls} min-h-6 text-[13px]`}
                  >
                    Digitar CEP
                  </button>
                  <Link
                    href="/ajuda"
                    target="_blank"
                    className={`${linkCls} inline-flex min-h-6 items-center text-[13px]`}
                  >
                    Como liberar a localização
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid items-end gap-4 md:grid-cols-2">
              <AuthTextField
                label="CEP"
                inputRef={cepRef}
                value={cep}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00.000-000"
                onChange={(e) => {
                  const m = maskCep(e.target.value);
                  setCep(m);
                  void lookup(m);
                }}
                error={cepError || (tried ? errors.cep : undefined)}
              />
              {found && (
                <span
                  role="status"
                  className="flex h-11 items-center gap-1.5 text-xs font-semibold text-success-text"
                >
                  <CircleCheck className="size-4" aria-hidden />
                  Endereço encontrado
                </span>
              )}
            </div>
            <AuthTextField
              label="Endereço"
              note="(opcional)"
              value={street}
              onChange={(e) => setStreet(e.target.value.slice(0, 80))}
              placeholder="Nome da rua"
              autoComplete="address-line1"
            />
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_96px]">
              <AuthTextField
                label="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value.slice(0, 40))}
                placeholder="Nome do bairro"
                autoComplete="address-level3"
                error={tried ? errors.neighborhood : undefined}
              />
              <AuthTextField
                label="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value.slice(0, 40))}
                placeholder="Nome da cidade"
                autoComplete="address-level2"
                error={tried ? errors.city : undefined}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="uf" className={authLabelCls}>
                  Estado
                </label>
                <select
                  id="uf"
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  aria-invalid={tried && !!errors.uf}
                  className={cn(authInputCls(tried && !!errors.uf), "px-2")}
                >
                  <option value="">UF</option>
                  {UFS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
                {tried && errors.uf && <FieldError>{errors.uf}</FieldError>}
              </div>
            </div>
          </div>

          {serverError && <FormError>{serverError}</FormError>}

          <ActionRow>
            <SecondaryButton onClick={onBack}>Voltar</SecondaryButton>
            <PrimaryButton looksDisabled={!valid} loading={busy}>
              {busy ? "Salvando…" : "Confirmar"}
            </PrimaryButton>
          </ActionRow>
        </form>
      </AuthPanel>
    </AuthBackdrop>
  );
}
