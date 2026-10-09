/** Rotas do app do consumidor (Documento de entrega › Telas e regras › Índice). */
export const routes = {
  home: "/",
  explorar: "/explorar",
  ofertas: "/ofertas",
  favoritos: "/favoritos",
  comparar: "/comparar",
  conversas: "/conversas",
  notificacoes: "/notificacoes",
  atividade: "/atividade",
  conta: "/conta",
  ajuda: "/ajuda",
  institucional: "/institucional",
  entrar: "/entrar",
  cadastro: "/cadastro",
} as const;

export const explorarComBusca = (q: string) => `${routes.explorar}?q=${encodeURIComponent(q)}`;
