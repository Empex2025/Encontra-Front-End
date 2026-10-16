/**
 * Documentos do menu de Institucional. O texto de cada um vem do back-end (GET /legal/{doc}); aqui ficam só os
 * nomes do índice e a frase de apoio do cabeçalho (rótulos de interface, como no protótipo).
 */
export const LEGAL_DOCS = [
  { doc: "sobre", label: "Como funciona", title: "Como a EncontraÊ funciona", sub: "A vitrine do comércio perto de você." },
  {
    doc: "termos",
    label: "Termos de uso",
    title: "Termos de uso",
    sub: "As regras para usar a EncontraÊ, em linguagem simples.",
  },
  {
    doc: "privacidade",
    label: "Privacidade (LGPD)",
    title: "Política de privacidade",
    sub: "Como cuidamos dos seus dados, de acordo com a LGPD (Lei 13.709/2018).",
  },
  { doc: "cookies", label: "Cookies", title: "Cookies", sub: "O que são, para que usamos e como escolher." },
  {
    doc: "avaliacoes",
    label: "Regras de avaliação",
    title: "Regras de avaliação",
    sub: "Como manter as avaliações úteis e justas para todo mundo.",
  },
  {
    doc: "denunciar",
    label: "Denunciar",
    title: "Denunciar",
    sub: "Viu algo errado? Conte para a gente. Sua denúncia é anônima para a loja.",
  },
] as const;

export type LegalDocId = (typeof LEGAL_DOCS)[number]["doc"];
