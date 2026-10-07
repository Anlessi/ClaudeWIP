export type Theme = "light" | "dark"

export const THEME_KEY = "familyflow.theme"

export function parseTheme(value: string | null): Theme | null {
  return value === "light" || value === "dark" ? value : null
}

export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function savedTheme(): Theme | null {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY))
  } catch {
    return null
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // The choice still applies until the page is closed.
  }
}
