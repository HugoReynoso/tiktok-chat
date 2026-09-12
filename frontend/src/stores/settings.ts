import { defineStore } from "pinia";
import { reactive, watch, ref } from "vue";
import type { EventRule } from "../../../shared/types";
export const scoreConfig = { like: 1, diamond: 10, share: 100, follow: 200 };
const defaults = () => ({
  username: "",
  language: "it",
  theme: "system",
  tts: false,
  voice: "",
  voiceLanguage: "it-IT",
  speed: 1,
  pitch: 1,
  volume: 0.8,
  readUsername: true,
  cooldown: 1,
  filter: "all",
  keywords: "",
  blacklist: "",
  followThanks: false,
  rules: [] as EventRule[],
  scores: { ...scoreConfig },
});
export const useSettings = defineStore("settings", () => {
  const data = reactive(defaults());
  const storageError = ref(false);
  try {
    const saved = JSON.parse(
      localStorage.getItem("tiktok-chat:settings") ?? "null",
    );
    if (saved && typeof saved === "object") {
      for (const key of Object.keys(data) as (keyof typeof data)[]) {
        if (key === "rules" || key === "scores") continue;
        if (typeof saved[key] === typeof data[key])
          Object.assign(data, { [key]: saved[key] });
      }
      if (Array.isArray(saved.rules))
        data.rules = saved.rules
          .filter(
            (r: EventRule) =>
              r &&
              typeof r.id === "string" &&
              ["gift", "follow", "share"].includes(r.event) &&
              ["sound", "speak"].includes(r.action) &&
              typeof r.value === "string",
          )
          .slice(0, 50);
      if (saved.scores)
        for (const key of Object.keys(
          data.scores,
        ) as (keyof typeof data.scores)[])
          if (Number.isFinite(saved.scores[key]) && saved.scores[key] >= 0)
            data.scores[key] = saved.scores[key];
    }
  } catch {
    storageError.value = true;
  }
  watch(
    data,
    () => {
      try {
        localStorage.setItem("tiktok-chat:settings", JSON.stringify(data));
        storageError.value = false;
      } catch {
        storageError.value = true;
      }
    },
    { deep: true },
  );
  return { data, storageError };
});
