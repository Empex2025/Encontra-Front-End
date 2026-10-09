/** Telas de entrada (entrar, cadastro, recuperar senha): sem menu lateral. */
export default function AcessoLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="conteudo" tabIndex={-1} className="min-h-dvh px-4 py-10 outline-none">
      {children}
    </main>
  );
}
