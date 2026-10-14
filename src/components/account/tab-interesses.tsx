"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { account } from "@/lib/api/account";
import { CATEGORIES } from "@/lib/domain/categories";
import { interestsError } from "@/lib/domain/account";

import { btnPrimary, Card, errMsg, Loading } from "./shared";

export function TabInteresses() {
  const q = useQuery({ queryKey: ["me", "interests"], queryFn: account.interests });
  if (q.isPending)
    return (
      <Card title="Seus interesses">
        <Loading />
      </Card>
    );
  if (q.isError)
    return (
      <Card title="Seus interesses">
        <ErrorState
          error={q.error}
          onRetry={() => q.refetch()}
          title="Não foi possível carregar seus interesses"
        />
      </Card>
    );
  return <Form initial={q.data.categoryIds} />;
}

function Form({ initial }: { initial: string[] }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [picked, setPicked] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => account.saveInterests(picked),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me", "interests"] });
      void qc.invalidateQueries({ queryKey: ["home"] });
      toast("Interesses salvos.");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });
  const toggle = (id: string) => {
    setError(null);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };
  const changed = picked.length !== initial.length || picked.some((x) => !initial.includes(x));

  return (
    <Card title="Seus interesses">
      <p className="text-sm text-text-muted">Usamos para decidir o que mostrar primeiro. Mínimo de 3.</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => {
          const on = picked.includes(c.id);
          const Icon = c.icon;
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(c.id)}
                className={cn(
                  "relative flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center text-sm font-semibold",
                  on
                    ? "border-primary bg-selected text-text-strong"
                    : "border-border bg-surface text-text-2 hover:border-navy-300",
                )}
              >
                <Icon className="size-6" style={{ color: c.colorVar }} aria-hidden />
                {c.name}
                {on && (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      )}
      <div>
        <button
          type="button"
          className={btnPrimary}
          disabled={!changed || save.isPending}
          onClick={() => {
            const e = interestsError(picked.length);
            if (e) return setError(e);
            save.mutate();
          }}
        >
          {save.isPending ? "Salvando…" : "Salvar interesses"}
        </button>
      </div>
    </Card>
  );
}
