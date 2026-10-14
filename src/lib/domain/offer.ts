/** Regras da página de oferta (/o/{slug}). */

/** Milissegundos que faltam até `endsAt`; zero se já passou. Data inválida: null (sem contagem, nunca "encerrada" por engano). */
export function msLeft(endsAt: string, now: number): number | null {
  const t = new Date(endsAt).getTime();
  return Number.isNaN(t) ? null : Math.max(0, t - now);
}

/** "Termina em HH:MM:SS"; acima de 48 h mostra dias para não exibir "120:00:00". */
export function countdownText(ms: number): string {
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  if (days >= 2) return `${days} dias`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/** Oferta encerrada: o servidor diz `ended`, ou o prazo já passou. */
export function offerEnded(status: "active" | "ended", ms: number | null): boolean {
  return status === "ended" || ms === 0;
}

/** Link do mapa. Coordenadas valem mais que endereço; sem nenhum dos dois, null (não inventa destino). */
export function routeUrl(o: {
  lat: number | null;
  lng: number | null;
  address: string | null;
}): string | null {
  if (o.lat !== null && o.lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`;
  }
  return o.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`
    : null;
}
