/** Validações e máscaras do Fluxo 1 (Documento de entrega › Entrada). Só lógica, sem tela. */

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** CPF com os dois dígitos verificadores (Decisão 6). Rejeita sequências repetidas. */
export function isValidCpf(value: string) {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}

export function maskCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Celular com DDD: (00) 0 0000-0000 */
export function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 1) return `(${ddd}) ${rest}`;
  if (rest.length <= 5) return `(${ddd}) ${rest[0]} ${rest.slice(1)}`;
  return `(${ddd}) ${rest[0]} ${rest.slice(1, 5)}-${rest.slice(5)}`;
}

export function maskCep(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2-$3");
}

export const isValidEmail = (v: string) => v.length <= 80 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isValidPhone = (v: string) => onlyDigits(v).length === 11;
export const isValidCep = (v: string) => onlyDigits(v).length === 8;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

/** Requisitos da senha: 8 a 64 caracteres, com letras e números. */
export function passwordChecks(password: string) {
  return {
    length: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    lettersAndNumbers: /[A-Za-zÀ-ÿ]/.test(password) && /\d/.test(password),
  };
}
export const isValidPassword = (p: string) => Object.values(passwordChecks(p)).every(Boolean);

/** Entrar e Recuperar aceitam o mesmo valor: e-mail ou CPF de 11 dígitos (com ou sem pontuação). */
export function isLoginIdentifier(v: string) {
  const t = v.trim();
  if (t.length === 0 || t.length > 80) return false;
  return isValidEmail(t) || onlyDigits(t).length === 11;
}

/** Código de verificação: só os 6 primeiros dígitos, letras e símbolos são ignorados. */
export const parseOtp = (v: string) => onlyDigits(v).slice(0, 6);
export const OTP_LENGTH = 6;

/** Só caminhos do próprio site, para não mandar a pessoa para fora depois de entrar. */
export function safeReturnTo(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";

/** Formata segundos como m:ss. */
export const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
