<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  MessageSquare,
  Pause,
  Play,
  Volume2,
  ArrowDown,
} from "lucide-vue-next";
import { useLive } from "../stores/live";
import { useSettings } from "../stores/settings";
import { unlockAudio } from "../services/audio";
const { t } = useI18n();
const live = useLive();
const settings = useSettings();
const paused = ref(false);
const list = ref<HTMLElement>();
watch(
  () => live.messages[live.messages.length - 1]?.id,
  async () => {
    await nextTick();
    if (!paused.value && list.value)
      list.value.scrollTop = list.value.scrollHeight;
  },
);
function resume() {
  paused.value = false;
  if (list.value) list.value.scrollTop = list.value.scrollHeight;
}
</script>
<template>
  <section class="panel chat-panel">
    <div class="panel-heading">
      <h2>
        <MessageSquare :size="19" />{{ t("liveChat")
        }}<span class="count">{{ live.messages.length }}</span>
      </h2>
      <button
        class="icon-button"
        :aria-label="t(paused ? 'resumeScroll' : 'pauseScroll')"
        @click="paused ? resume() : (paused = true)"
      >
        <Play v-if="paused" :size="17" /><Pause v-else :size="17" />
      </button>
    </div>
    <div class="chat-list" ref="list" role="log" :aria-label="t('liveChat')">
      <div v-if="!live.messages.length" class="empty-state">
        <div class="empty-chat-icon"><MessageSquare :size="32" /></div>
        <h3>{{ t("chatEmpty") }}</h3>
        <p>{{ t("chatEmptyHint") }}</p>
        <span class="empty-caption"
          ><span class="dot" />{{ t("waitingComments") }}</span
        >
      </div>
      <article
        v-for="message in live.messages"
        :key="message.id"
        class="chat-message"
      >
        <img
          v-if="message.user.avatar"
          :src="message.user.avatar"
          class="avatar"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
        /><span v-else class="avatar">{{
          message.user.nickname.slice(0, 1).toUpperCase()
        }}</span>
        <div>
          <div class="message-meta">
            <strong>{{ message.user.nickname }}</strong
            ><time>{{
              new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}</time>
          </div>
          <p>{{ message.text }}</p>
        </div>
      </article>
    </div>
    <button v-if="paused" class="resume" @click="resume">
      <ArrowDown :size="16" />{{ t("resumeScroll") }}
    </button>
    <div class="chat-toolbar">
      <span><Volume2 :size="17" />{{ t("readComments") }}</span
      ><button
        class="switch"
        :class="{ enabled: settings.data.tts }"
        role="switch"
        :aria-checked="settings.data.tts"
        :aria-label="t('ttsEnabled')"
        @click="
          unlockAudio();
          settings.data.tts = !settings.data.tts;
        "
      >
        <span />
      </button>
    </div>
  </section>
</template>
