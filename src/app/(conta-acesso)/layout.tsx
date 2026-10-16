/** Telas de entrada (boas-vindas, entrar, cadastro, recuperar senha): sem menu lateral; cada tela traz o próprio fundo. */
export default function AcessoLayout({ children }: LayoutProps<"/">) {
  return <>{children}</>;
}
