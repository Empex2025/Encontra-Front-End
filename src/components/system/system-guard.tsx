"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { WifiOff, Wrench } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { system } from "@/lib/api/account";
import { SystemCard, sysBtnOutline, sysBtnPrimary } from "@/components/system/system-card";
import { useToast } from "@/components/ui/toast";

type State = "ok" | "offline" | "maintenance";
const RETRY_MS = 10_000;

/**
 * Sem internet e manutenção (Documento de entrega › Telas de sistema).
 * - Falha de rede em qualquer consulta, ou o navegador avisando que caiu: faixa "Ainda sem conexão", nova tentativa a cada 10 s.
 * - Resposta 503 do servidor (MAINTENANCE): tela cheia "Voltamos em instantes".
 * A volta é detectada por GET /status; ao voltar, as consultas são refeitas.
 */
export function SystemGuard() {
  const qc = useQueryClient();
  const [state, setState] = useState<State>("ok");
  const [until, setUntil] = useState<string | null>(null);

  useEffect(() => {
    const mark = (e: unknown) => {
      if (e instanceof ApiError && e.status === 0) setState((s) => (s === "maintenance" ? s : "offline"));
      else if (e instanceof ApiError && e.status === 503 && e.code === "MAINTENANCE") setState("maintenance");
    };
    const offUq = qc.getQueryCache().subscribe((ev) => {
      if (ev.type === "updated" && ev.action.type === "error") mark(ev.action.error);
    });
    const offMc = qc.getMutationCache().subscribe((ev) => {
      if (ev.type === "updated" && ev.action.type === "error") mark(ev.action.error);
    });
    const onOffline = () => setState((s) => (s === "maintenance" ? s : "offline"));
    window.addEventListener("offline", onOffline);
    return () => {
      offUq();
      offMc();
      window.removeEventListener("offline", onOffline);
    };
  }, [qc]);

  const check = useCallback(async () => {
    try {
      const s = await system.status();
      if (s.state === "maintenance") {
        setUntil(s.until ?? null);
        return setState("maintenance");
      }
      setState("ok");
      void qc.invalidateQueries();
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) setState("maintenance");
      else if (e instanceof ApiError && e.status === 0)
        setState((x) => (x === "maintenance" ? x : "offline"));
      else {
        // o servidor respondeu (ainda que com erro): a conexão voltou
        setState("ok");
        void qc.invalidateQueries();
      }
    }
  }, [qc]);

  useEffect(() => {
    if (state === "ok") return;
    const id = window.setInterval(() => void check(), RETRY_MS);
    // em manutenção, busca já a previsão de volta (campo opcional do GET /status)
    const first = state === "maintenance" ? window.setTimeout(() => void check(), 0) : 0;
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [state, check]);

  if (state === "offline") {
    return (
      <div
        role="alert"
        className="fixed inset-x-0 top-0 z-[80] flex flex-wrap items-center gap-3 bg-[#343a45] px-4 py-3 text-white lg:px-[max(80px,calc((100vw-1280px)/2))]"
      >
        <WifiOff className="size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">Você está sem internet</p>
          <p className="text-[13px] text-white/80">
            Tentamos de novo sozinhos a cada 10 s. Preços e horários podem ter mudado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void check()}
          className="h-11 rounded-lg bg-accent px-5 text-sm font-bold text-navy hover:bg-accent-hover"
        >
          Tentar de novo
        </button>
      </div>
    );
  }
  if (state === "maintenance") return <Maintenance until={until} onRetry={() => void check()} />;
  return null;
}

function Maintenance({ until, onRetry }: { until?: string | null; onRetry: () => void }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const notify = async () => {
    setBusy(true);
    try {
      await system.notifyWhenBack();
      setDone(true);
    } catch {
      toast("Não foi possível registrar agora. Tente de novo em instantes.", "info");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div role="alert" className="fixed inset-0 z-[90] flex items-center overflow-y-auto bg-bg px-4">
      <SystemCard
        tone="navy"
        icon={<Wrench className="size-10" aria-hidden />}
        title="Voltamos em instantes"
        text="A EncontraÊ está passando por uma melhoria rápida. Esta tela some sozinha quando terminar."
      >
        {until && (
          <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-text-muted">
            Previsão de volta <strong className="ml-2 text-lg text-navy">{until}</strong>
          </p>
        )}
        {done ? (
          <p role="status" className="font-semibold text-success-text">
            Combinado! Avisamos quando voltar.
          </p>
        ) : (
          <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <button type="button" onClick={onRetry} className={sysBtnPrimary}>
              Tentar de novo
            </button>
            <button type="button" disabled={busy} onClick={notify} className={sysBtnOutline}>
              Me avise quando voltar
            </button>
          </div>
        )}
      </SystemCard>
    </div>
  );
}
