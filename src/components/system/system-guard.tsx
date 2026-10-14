"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { system } from "@/lib/api/account";
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

  useEffect(() => {
    if (state === "ok") return;
    let stop = false;
    const check = async () => {
      try {
        const s = await system.status();
        if (stop) return;
        if (s.state === "maintenance") return setState("maintenance");
        setState("ok");
        void qc.invalidateQueries();
      } catch (e) {
        if (stop) return;
        if (e instanceof ApiError && e.status === 503) setState("maintenance");
        else if (e instanceof ApiError && e.status === 0)
          setState((x) => (x === "maintenance" ? x : "offline"));
        else {
          // o servidor respondeu (ainda que com erro): a conexão voltou
          setState("ok");
          void qc.invalidateQueries();
        }
      }
    };
    const id = window.setInterval(check, RETRY_MS);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [state, qc]);

  if (state === "offline") {
    return (
      <div
        role="alert"
        className="fixed inset-x-0 top-0 z-[80] bg-danger px-4 py-2 text-center text-sm font-semibold text-white"
      >
        Ainda sem conexão. Tentamos de novo sozinhos em 10 s.
      </div>
    );
  }
  if (state === "maintenance") return <Maintenance />;
  return null;
}

function Maintenance() {
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
    <div
      role="alert"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-bg px-6 text-center"
    >
      <div className="flex max-w-md flex-col items-center gap-4">
        <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">
          Voltamos em instantes
        </h1>
        <p className="text-text-muted">
          Estamos fazendo uma manutenção rápida. Esta tela some sozinha quando terminar.
        </p>
        {done ? (
          <p role="status" className="font-semibold text-success-text">
            Combinado! Avisamos quando voltar.
          </p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={notify}
            className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            Me avise quando voltar
          </button>
        )}
      </div>
    </div>
  );
}
