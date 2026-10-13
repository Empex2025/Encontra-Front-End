import type { Metadata } from "next";
import { Suspense } from "react";

import { StoriesViewer } from "@/components/stories/stories-viewer";

export const metadata: Metadata = { title: "Stories" };

export default function StoriesPage() {
  return (
    <Suspense fallback={null}>
      <StoriesViewer />
    </Suspense>
  );
}
