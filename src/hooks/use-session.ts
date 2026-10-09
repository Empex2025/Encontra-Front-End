"use client";

import { useQuery } from "@tanstack/react-query";

import { isUnauthorized } from "@/lib/api/client";
import { endpoints, queryKeys } from "@/lib/api/endpoints";

/** Usuário logado, ou null para visitante. */
export function useSession() {
  const q = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await endpoints.me();
      } catch (e) {
        if (isUnauthorized(e)) return null;
        throw e;
      }
    },
  });
  return {
    me: q.data ?? null,
    /** Visitante, ou sessão que não pôde ser confirmada (servidor fora do ar). */
    isGuest: !q.isPending && !q.data,
    isLoading: q.isPending,
    isError: q.isError,
  };
}

export function useUnreadCount() {
  const { me } = useSession();
  return useQuery({
    queryKey: queryKeys.unread,
    queryFn: endpoints.unreadCount,
    enabled: !!me,
    refetchInterval: 60_000,
  });
}
