"use client";

import { MapPin } from "lucide-react";

import { OPEN_LOCATION_EVENT } from "@/components/layout/location-picker";

export function NeedLocation() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
        <MapPin className="size-6" aria-hidden />
      </span>
      <h2 className="text-xl font-bold text-text-strong">Onde você quer procurar?</h2>
      <p className="max-w-md text-text-muted">
        Precisamos de um bairro, cidade ou da sua localização para mostrar o que está perto e calcular as
        distâncias.
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT))}
        className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
      >
        Definir local
      </button>
    </section>
  );
}
