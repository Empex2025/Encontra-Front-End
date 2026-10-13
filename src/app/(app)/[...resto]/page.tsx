import { notFound } from "next/navigation";

/** Qualquer endereço sem tela cai aqui e mostra o 404 com o menu e o cabeçalho. */
export default function CatchAll() {
  notFound();
}
