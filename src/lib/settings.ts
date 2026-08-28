export type AppSettings = {
  language: string;
  locale: string;
  dateFormat: "system" | "dmy" | "mdy" | "iso";
  timeFormat: "12h" | "24h";
  webSearch: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: "English",
  locale: "en-ZA",
  dateFormat: "system",
  timeFormat: "24h",
  webSearch: false,
};

export const SETTINGS_KEY = "wai.settings";

export const LANGUAGES = [
  "English",
  "Afrikaans",
  "isiZulu",
  "French",
  "Spanish",
  "German",
  "Portuguese",
];

export const LOCALES = [
  { value: "en-ZA", label: "South Africa (en-ZA)" },
  { value: "en-US", label: "United States (en-US)" },
  { value: "en-GB", label: "United Kingdom (en-GB)" },
  { value: "de-DE", label: "Germany (de-DE)" },
  { value: "fr-FR", label: "France (fr-FR)" },
  { value: "pt-BR", label: "Brazil (pt-BR)" },
];

export function formatDateTime(at: number, s: AppSettings) {
  const locale =
    s.dateFormat === "iso" ? "sv-SE" : s.dateFormat === "mdy" ? "en-US" : s.dateFormat === "dmy" ? "en-GB" : s.locale;
  try {
    return new Date(at).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: s.timeFormat === "12h",
    });
  } catch {
    return new Date(at).toLocaleString();
  }
}
