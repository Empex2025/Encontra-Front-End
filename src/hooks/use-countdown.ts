"use client";

import { useEffect, useState } from "react";

/** Segundos que faltam até `targetIso` (0 quando já passou). Atualiza uma vez por segundo. */
export function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetIso) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);
  if (!targetIso) return 0;
  const ms = new Date(targetIso).getTime() - now;
  return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 1000)) : 0;
}
