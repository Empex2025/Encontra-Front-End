import type { Metadata } from "next";
import { Suspense } from "react";

import { StoriesViewer } from "@/components/stories/stories-viewer";

export const metadata: Metadata = { title: "Stories" };

export default function StoriesPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-busy="true" className="fixed inset-0 z-[60] bg-black text-white">
          <p className="flex h-full items-center justify-center text-white/80">Carregando stories…</p>
        </div>
      }
    >
      <StoriesViewer />
    </Suspense>
  );
}
