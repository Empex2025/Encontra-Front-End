"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  const enough = picked.length >= 3;
  return (
    <Card
      title="Seus interesses"
      aside={
        <span className={cn("font-bold", enough ? "text-success-text" : "text-danger-text")}>
          {picked.length === 1 ? "1 escolhido" : `${picked.length} escolhidos`}
        </span>
      }
    >
      <p className="text-sm text-text-muted">
        Escolha pelo menos 3. Eles decidem o que aparece primeiro em Descobrir, nos stories e nas ofertas.
      </p>
      <ul className="flex flex-wrap gap-2">
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
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap",
                  on
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-text-2 hover:border-navy-300",
                )}
              >
                <Icon
                  className="size-4"
                  style={on ? undefined : { color: c.colorVar }}
                  aria-hidden
                />
                {on && <span aria-hidden>✓</span>}
                {c.name}
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
      <div className="flex justify-end border-t border-surface-2 pt-4">
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
