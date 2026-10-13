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

/** Endereços públicos (decisão do Documento de entrega: /p, /l, /s, /o). */
export const produtoHref = (slug: string) => `/p/${encodeURIComponent(slug)}`;
export const lojaHref = (slug: string) => `/l/${encodeURIComponent(slug)}`;
export const prestadorHref = (slug: string) => `/s/${encodeURIComponent(slug)}`;
export const liveHref = (id: string) => `/ao-vivo/${encodeURIComponent(id)}`;

export const conversaHref = (id: string) => `/conversas/${encodeURIComponent(id)}`;
export const avaliarHref = (tipo: "produto" | "loja" | "prestador", slug: string) =>
  `/avaliar?tipo=${tipo}&id=${encodeURIComponent(slug)}`;
export const denunciarHref = (tipo: "produto" | "loja" | "prestador" | "avaliacao", id: string) =>
  `/denunciar?tipo=${tipo}&id=${encodeURIComponent(id)}`;
