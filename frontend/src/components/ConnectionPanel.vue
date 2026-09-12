<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Radio, ArrowRight, LoaderCircle } from "lucide-vue-next";
import { useSettings } from "../stores/settings";
import { useLive } from "../stores/live";
const { t } = useI18n();
const settings = useSettings();
const live = useLive();
</script>
<template>
  <section class="connection-panel">
    <div class="connection-symbol"><Radio :size="27" /></div>
    <div class="connection-copy">
      <h2>
        {{
          t(
            live.isDemo
              ? "demoTitle"
              : live.status === "connected"
                ? "youAreLive"
                : "connectTitle",
          )
        }}
      </h2>
      <p>
        {{
          live.isDemo
            ? t("demoDescription")
            : live.status === "connected"
              ? `@${live.username}`
              : t("connectDescription")
        }}
      </p>
    </div>
    <form @submit.prevent="live.connect" class="connection-form">
      <label v-if="!live.isDemo" class="username-input"
        ><span aria-hidden="true">@</span
        ><input
          v-model.trim="settings.data.username"
          :aria-label="t('username')"
          :placeholder="t('usernamePlaceholder')"
          :disabled="live.active"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          maxlength="25" /></label
      ><button v-if="!live.active" class="primary" type="submit">
        {{ t(live.isDemo ? "startDemo" : "connect")
        }}<ArrowRight :size="18" /></button
      ><button v-else class="secondary" type="button" @click="live.disconnect">
        <LoaderCircle
          v-if="live.status !== 'connected'"
          class="spin"
          :size="18"
        />{{ t(live.isDemo ? "pauseDemo" : "disconnect") }}
      </button>
    </form>
  </section>
</template>
