<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSettings } from "../stores/settings";
import {
  voices,
  supported,
  speak,
  unlockAudio,
  stopAudio,
} from "../services/audio";
import { Volume2 } from "lucide-vue-next";
const { t } = useI18n();
const s = useSettings().data;
</script>
<template>
  <section class="panel form-panel">
    <h2><Volume2 :size="20" />{{ t("voice") }}</h2>
    <p v-if="!supported" class="notice">{{ t("noTts") }}</p>
    <label class="toggle-row"
      >{{ t("ttsEnabled")
      }}<input type="checkbox" v-model="s.tts" @change="unlockAudio()" /></label
    ><label
      >{{ t("voiceLanguage")
      }}<select v-model="s.voiceLanguage">
        <option value="it-IT">Italiano</option>
        <option value="en-US">English</option>
        <option value="es-ES">Español</option>
      </select></label
    ><label
      >{{ t("voiceChoice")
      }}<select v-model="s.voice">
        <option value="">{{ t("defaultVoice") }}</option>
        <option
          v-for="voice in voices"
          :key="voice.voiceURI"
          :value="voice.voiceURI"
        >
          {{ voice.name }} · {{ voice.lang }}
        </option>
      </select></label
    ><label v-for="field in ['speed', 'pitch', 'volume'] as const" :key="field"
      >{{ t(field) }} <output>{{ s[field] }}</output
      ><input
        type="range"
        v-model.number="s[field]"
        :min="field === 'speed' ? 0.5 : 0"
        :max="field === 'volume' ? 1 : 2"
        step="0.1" /></label
    ><label class="toggle-row"
      >{{ t("readUsername")
      }}<input type="checkbox" v-model="s.readUsername" /></label
    ><label
      >{{ t("cooldown")
      }}<select v-model.number="s.cooldown">
        <option v-for="n in [0, 1, 2, 3, 5]" :key="n" :value="n">
          {{ n }} {{ t("seconds") }}
        </option>
      </select></label
    >
    <div class="button-row">
      <button
        class="primary"
        @click="
          unlockAudio();
          speak(t('testVoiceText'));
        "
      >
        {{ t("testVoice") }}</button
      ><button class="secondary" @click="stopAudio">{{ t("stop") }}</button>
    </div>
  </section>
</template>
