export type Theme = "light" | "dark";
export const THEME_KEY = "encontrae_tema";

/** Roda antes da primeira pintura (no <head>) para não piscar o tema errado. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;
