import { createI18n } from "vue-i18n";
import it from "./it.json";
import en from "./en.json";
import es from "./es.json";
export const i18n = createI18n({
  legacy: false,
  locale: "it",
  fallbackLocale: "en",
  messages: { it, en, es },
});
