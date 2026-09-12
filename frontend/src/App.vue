<script setup lang="ts">
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  Radio,
  MessageSquare,
  Trophy,
  Volume2,
  Gift,
  Zap,
  Settings,
  History,
  AudioLines,
  ArrowUpRight,
} from "lucide-vue-next";
import { useSettings } from "./stores/settings";
import { useLive } from "./stores/live";
import { initAudio, stopAudio } from "./services/audio";
const { t, locale } = useI18n();
const settings = useSettings();
const live = useLive();
const navigation = [
  { path: "/live", key: "live", icon: Radio },
  { path: "/chat", key: "chat", icon: MessageSquare },
  { path: "/rankings", key: "rankings", icon: Trophy },
  { path: "/voice", key: "voice", icon: Volume2 },
  { path: "/alerts", key: "alerts", icon: Gift },
  { path: "/rules", key: "rules", icon: Zap },
];
watch(
  () => settings.data.language,
  (value) => {
    locale.value = ["it", "en", "es"].includes(value) ? value : "it";
    document.documentElement.lang = locale.value;
  },
  { immediate: true },
);
const media = matchMedia("(prefers-color-scheme: dark)");
const theme = () => {
  document.documentElement.dataset.theme =
    settings.data.theme === "system"
      ? media.matches
        ? "dark"
        : "light"
      : settings.data.theme;
};
media.addEventListener("change", theme);
watch(() => settings.data.theme, theme, { immediate: true });
watch(
  () => settings.data.tts,
  (enabled) => {
    if (!enabled) stopAudio();
  },
);
initAudio();
</script>
<template>
  <aside class="sidebar">
    <RouterLink to="/" class="brand"
      ><span class="brand-icon"><AudioLines :size="24" /></span
      ><span>TikTok<span class="brand-light"> Chat</span></span></RouterLink
    >
    <div class="workspace-label">{{ t("workspace") }}</div>
    <nav>
      <RouterLink
        v-for="item in navigation"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        ><component :is="item.icon" :size="20" /><span>{{ t(item.key) }}</span
        ><span
          v-if="item.key === 'live' && live.status === 'connected'"
          class="dot"
      /></RouterLink>
    </nav>
    <div class="sidebar-bottom">
      <RouterLink to="/history" class="nav-item"
        ><History :size="20" />{{ t("history") }}</RouterLink
      ><RouterLink to="/settings" class="nav-item"
        ><Settings :size="20" />{{ t("settings") }}</RouterLink
      >
      <div class="local-note">
        <span class="privacy-dot"></span>
        <div>
          {{ t("localTitle") }}<small>{{ t("localSubtitle") }}</small>
        </div>
      </div>
    </div>
  </aside>
  <div class="app-main">
    <header class="topbar">
      <span class="mobile-brand"><AudioLines :size="21" /> TikTok Chat</span
      ><span class="desktop-only">{{ t("creatorWorkspace") }}</span
      ><span
        class="status-pill"
        :class="{ online: live.status === 'connected' }"
        ><span class="dot" />{{
          t(live.isDemo ? "demoBadge" : live.status)
        }}</span
      >
    </header>
    <main>
      <div v-if="live.isDemo" class="notice demo-notice">
        {{ t("demoNotice") }}
      </div>
      <RouterView />
    </main>
    <footer>
      {{ t("independent")
      }}<RouterLink to="/settings"
        >{{ t("settings") }} <ArrowUpRight :size="14"
      /></RouterLink>
    </footer>
  </div>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in [
        navigation[0]!,
        navigation[1]!,
        navigation[2]!,
        { path: '/settings', key: 'settings', icon: Settings },
      ]"
      :key="item.path"
      :to="item.path"
      ><component :is="item.icon" :size="22" />{{
        t(item.key === "live" ? "home" : item.key)
      }}</RouterLink
    >
  </nav>
</template>
