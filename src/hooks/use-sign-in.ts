"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { queryKeys } from "@/lib/api/endpoints";
import type { Me } from "@/lib/api/schemas";

/** Depois de entrar ou criar a conta: guarda o usuário e refaz o que dependia de ser visitante. */
export function useSignIn() {
  const qc = useQueryClient();
  return useCallback(
    (user: Me) => {
      qc.setQueryData(queryKeys.me, user);
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "me" || q.queryKey.length > 1 });
    },
    [qc],
  );
}
