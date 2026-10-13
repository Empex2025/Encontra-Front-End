import { NotFoundView } from "@/components/system/not-found-view";

/** 404 fora do grupo (app): sem menu, mas com a mesma tela. */
export default function RootNotFound() {
  return (
    <main className="px-4 py-6">
      <NotFoundView />
    </main>
  );
}
