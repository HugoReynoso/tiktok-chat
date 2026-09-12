<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  Users,
  Heart,
  Gift,
  MessageSquare,
  ArrowUpRight,
  Volume2,
  Trophy,
  Radio,
  Clock,
  Plus,
  Trash2,
  Zap,
} from "lucide-vue-next";
import { useLive } from "../stores/live";
import { useSettings } from "../stores/settings";
import { audioError, playSound, unlockAudio } from "../services/audio";
import ConnectionPanel from "../components/ConnectionPanel.vue";
import ChatPanel from "../components/ChatPanel.vue";
import StatsCard from "../components/StatsCard.vue";
import VoiceSettings from "../components/VoiceSettings.vue";
import type { RankingEntry, EventRule } from "../../../shared/types";
const { t } = useI18n();
const route = useRoute();
const live = useLive();
const settings = useSettings();
const s = settings.data;
const tab = ref("gifts");
const selected = ref<RankingEntry>();
const confirmReset = ref(false);
const now = ref(Date.now());
const timer = setInterval(() => (now.value = Date.now()), 1000);
onUnmounted(() => clearInterval(timer));
const page = computed(() =>
  route.path === "/" ? "live" : route.path.slice(1),
);
const title = computed(() =>
  t(page.value === "live" ? "dashboardTitle" : page.value),
);
const sorted = computed(() =>
  [...live.rankings].sort((a, b) =>
    tab.value === "gifts"
      ? b.diamonds - a.diamonds || b.gifts - a.gifts
      : tab.value === "likes"
        ? b.likes - a.likes
        : live.score(b) - live.score(a),
  ),
);
const duration = computed(() =>
  live.stats.startedAt
    ? `${Math.floor((now.value - live.stats.startedAt) / 3600000)}h ${Math.floor((now.value - live.stats.startedAt) / 60000) % 60}m`
    : "—",
);
const draft = ref<EventRule>({
  id: "",
  enabled: true,
  event: "gift",
  gift: "Rose",
  minimum: 1,
  action: "sound",
  value: "bell",
});
function addRule() {
  if (
    s.rules.length >= 50 ||
    !draft.value.value.trim() ||
    (draft.value.event === "gift" && !draft.value.gift.trim())
  )
    return;
  s.rules.push({
    ...draft.value,
    minimum: Math.max(1, draft.value.minimum),
    id: crypto.randomUUID(),
  });
}
</script>
<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow">{{ t("yourLiveSimplified") }}</div>
      <h1>
        {{ title }}<span v-if="page === 'live'" class="title-dot">.</span>
      </h1>
      <p>{{ t(`${page}Description`) }}</p>
    </div>
    <RouterLink v-if="page === 'live'" to="/statistics" class="text-link"
      >{{ t("statistics") }}<ArrowUpRight :size="17"
    /></RouterLink>
  </div>
  <div
    v-if="
      live.error || audioError || settings.storageError || live.storageError
    "
    class="notice"
    role="alert"
  >
    {{ t(live.error || audioError || "storageError")
    }}<button
      v-if="audioError"
      class="text-link"
      @click="
        audioError = '';
        unlockAudio();
      "
    >
      {{ t("retryAudio") }}
    </button>
  </div>
  <template v-if="page === 'live' || page === 'chat'">
    <ConnectionPanel />
    <div v-if="page === 'live'" class="stats-grid">
      <StatsCard
        :label="t('viewers')"
        :value="live.stats.viewers"
        :icon="Users"
        tone="blue"
      /><StatsCard
        :label="t('likes')"
        :value="live.stats.likes"
        :icon="Heart"
        tone="pink"
      /><StatsCard
        :label="t('gifts')"
        :value="live.stats.gifts"
        :icon="Gift"
        tone="purple"
      /><StatsCard
        :label="t('comments')"
        :value="live.stats.comments"
        :icon="MessageSquare"
        tone="green"
      />
    </div>
    <div :class="page === 'live' ? 'live-grid' : 'full-chat'">
      <ChatPanel />
      <div v-if="page === 'live'" class="right-column">
        <section class="panel voice-summary">
          <div class="panel-heading">
            <h2><Volume2 :size="19" />{{ t("voice") }}</h2>
            <span class="mini-badge" :class="{ enabled: s.tts }">{{
              t(s.tts ? "on" : "off")
            }}</span>
          </div>
          <p>{{ t("voiceSummary") }}</p>
          <RouterLink to="/voice" class="secondary"
            >{{ t("configureVoice") }}<ArrowUpRight :size="16"
          /></RouterLink>
        </section>
        <section class="panel gift-panel">
          <div class="panel-heading">
            <h2><Gift :size="19" />{{ t("recentGifts") }}</h2>
            <RouterLink to="/alerts" :aria-label="t('alerts')"
              ><ArrowUpRight :size="18"
            /></RouterLink>
          </div>
          <div v-if="!live.gifts.length" class="small-empty">
            <Gift :size="29" />
            <p>{{ t("giftsEmpty") }}</p>
            <small>{{ t("giftsEmptyHint") }}</small>
          </div>
          <div
            v-for="gift in live.gifts.slice(0, 5)"
            :key="gift.id"
            class="gift-row"
          >
            <span class="gift-symbol"><Gift :size="20" /></span>
            <div>
              <strong>{{ gift.user.nickname }}</strong
              ><small>{{ gift.name }} ×{{ gift.count }}</small>
            </div>
            <span class="diamond-count">{{ gift.diamonds }} ◇</span>
          </div>
        </section>
        <div class="session-note">
          <Clock :size="17" /><span>{{ t("sessionDuration") }}</span
          ><strong>{{ duration }}</strong>
        </div>
      </div>
    </div>
    <div v-if="live.activity.length" class="panel activity-list">
      <div v-for="item in live.activity.slice(0, 5)" :key="item.id">
        {{ item.text }}
      </div>
    </div>
  </template>
  <template v-else-if="page === 'rankings'"
    ><div class="tabs" role="tablist">
      <button
        v-for="key in ['gifts', 'likes', 'overall']"
        :key="key"
        role="tab"
        :aria-selected="tab === key"
        :class="{ active: tab === key }"
        @click="tab = key"
      >
        {{ t(key) }}
      </button>
    </div>
    <p class="subtle">{{ t("detectedDisclaimer") }}</p>
    <section class="panel ranking-panel">
      <div v-if="!sorted.length" class="empty-state">
        <Trophy :size="40" />
        <h3>{{ t("rankingEmpty") }}</h3>
        <p>{{ t("rankingEmptyHint") }}</p>
      </div>
      <button
        v-for="(row, index) in sorted"
        :key="row.user.id"
        class="ranking-row"
        @click="selected = row"
      >
        <span class="rank-number">{{ index + 1 }}</span
        ><span class="avatar">{{ row.user.nickname.slice(0, 1) }}</span
        ><span class="rank-name"
          ><strong>{{ row.user.nickname }}</strong
          ><small>@{{ row.user.username }}</small></span
        ><strong
          >{{
            (tab === "gifts"
              ? row.diamonds
              : tab === "likes"
                ? row.likes
                : live.score(row)
            ).toLocaleString()
          }}
          <small>{{
            t(
              tab === "gifts"
                ? "diamonds"
                : tab === "likes"
                  ? "detectedLikes"
                  : "points",
            )
          }}</small></strong
        >
      </button>
    </section></template
  >
  <VoiceSettings v-else-if="page === 'voice'" />
  <template v-else-if="page === 'alerts' || page === 'rules'"
    ><div class="settings-grid">
      <section class="panel form-panel">
        <h2><Zap :size="20" />{{ t("newRule") }}</h2>
        <label
          >{{ t("when")
          }}<select v-model="draft.event">
            <option
              v-for="event in ['gift', 'follow', 'share']"
              :value="event"
              :key="event"
            >
              {{ t(event) }}
            </option>
          </select></label
        ><template v-if="draft.event === 'gift'"
          ><label
            >{{ t("giftName")
            }}<input v-model="draft.gift" maxlength="100" /></label
          ><label
            >{{ t("minimumQuantity")
            }}<input
              type="number"
              min="1"
              v-model.number="draft.minimum" /></label></template
        ><label
          >{{ t("action")
          }}<select
            v-model="draft.action"
            @change="
              draft.value =
                draft.action === 'sound' ? 'bell' : t('thanksFollowTemplate')
            "
          >
            <option value="sound">{{ t("playSound") }}</option>
            <option value="speak">{{ t("speak") }}</option>
          </select></label
        ><label v-if="draft.action === 'sound'"
          >{{ t("sound")
          }}<select v-model="draft.value">
            <option
              v-for="sound in ['bell', 'chime', 'celebration']"
              :key="sound"
              :value="sound"
            >
              {{ t(sound) }}
            </option>
          </select></label
        ><label v-else
          >{{ t("speechText") }}<input v-model="draft.value" maxlength="500"
        /></label>
        <p class="subtle">{{ t("soundHint") }}</p>
        <div class="button-row">
          <button class="primary" @click="addRule">
            <Plus :size="18" />{{ t("saveRule") }}</button
          ><button
            v-if="draft.action === 'sound'"
            class="secondary"
            @click="
              unlockAudio();
              playSound(draft.value);
            "
          >
            {{ t("testSound") }}
          </button>
        </div>
      </section>
      <section class="panel form-panel">
        <h2>
          {{ t("savedRules") }} <span class="count">{{ s.rules.length }}</span>
        </h2>
        <p v-if="!s.rules.length" class="subtle">{{ t("rulesEmpty") }}</p>
        <div v-for="rule in s.rules" :key="rule.id" class="rule-row">
          <input
            type="checkbox"
            v-model="rule.enabled"
            :aria-label="t('ruleEnabled')"
          />
          <div>
            <strong
              >{{ t(rule.event) }}
              {{
                rule.event === "gift" ? `${rule.gift} ×${rule.minimum}` : ""
              }}</strong
            ><small>{{
              rule.action === "sound" ? t(rule.value) : rule.value
            }}</small>
          </div>
          <button
            class="icon-button"
            :aria-label="t('delete')"
            @click="s.rules = s.rules.filter((r) => r.id !== rule.id)"
          >
            <Trash2 :size="18" />
          </button>
        </div>
      </section></div
  ></template>
  <template v-else-if="page === 'settings'"
    ><div class="mobile-shortcuts">
      <RouterLink to="/voice">{{ t("voice") }}</RouterLink
      ><RouterLink to="/alerts">{{ t("alerts") }}</RouterLink
      ><RouterLink to="/rules">{{ t("rules") }}</RouterLink
      ><RouterLink to="/history">{{ t("history") }}</RouterLink>
    </div>
    <div class="settings-grid">
      <section class="panel form-panel">
        <h2>{{ t("general") }}</h2>
        <label
          >{{ t("username")
          }}<input
            v-model.trim="s.username"
            :disabled="live.active"
            maxlength="25" /></label
        ><label
          >{{ t("language")
          }}<select v-model="s.language">
            <option value="it">Italiano</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select></label
        ><label
          >{{ t("theme")
          }}<select v-model="s.theme">
            <option
              v-for="mode in ['system', 'dark', 'light']"
              :key="mode"
              :value="mode"
            >
              {{ t(mode) }}
            </option>
          </select></label
        ><label class="toggle-row"
          >{{ t("followThanks")
          }}<input
            type="checkbox"
            v-model="s.followThanks"
            @change="unlockAudio()"
        /></label>
      </section>
      <section class="panel form-panel">
        <h2>{{ t("chatFilters") }}</h2>
        <label
          >{{ t("read")
          }}<select v-model="s.filter">
            <option
              v-for="filter in ['all', 'followers', 'subscribers', 'keywords']"
              :key="filter"
              :value="filter"
            >
              {{ t(filter) }}
            </option>
          </select></label
        ><label v-if="s.filter === 'keywords'"
          >{{ t("keywords") }}<textarea v-model="s.keywords" /></label
        ><label
          >{{ t("blacklist")
          }}<textarea v-model="s.blacklist" :placeholder="t('onePerLine')" />
        </label>
        <p class="subtle">{{ t("blacklistHint") }}</p>
        <p class="subtle">{{ t("filterDisclaimer") }}</p>
      </section>
      <section class="panel form-panel">
        <h2>{{ t("scoreConfig") }}</h2>
        <label
          v-for="key in ['like', 'diamond', 'share', 'follow'] as const"
          :key="key"
          >{{ t(key)
          }}<input type="number" min="0" v-model.number="s.scores[key]"
        /></label>
      </section>
      <section class="panel form-panel">
        <h2>{{ t("session") }}</h2>
        <p class="subtle">{{ t("resetHint") }}</p>
        <button class="danger" @click="confirmReset = true">
          {{ t("resetStats") }}
        </button>
      </section>
    </div></template
  >
  <template v-else-if="page === 'statistics'"
    ><div class="stats-grid">
      <StatsCard
        v-for="key in [
          'viewers',
          'peakViewers',
          'likes',
          'detectedLikes',
          'comments',
          'gifts',
          'diamonds',
          'followers',
          'shares',
        ] as const"
        :key="key"
        :label="t(key)"
        :value="live.stats[key]"
        :icon="key === 'gifts' ? Gift : key.includes('iewers') ? Users : Heart"
      /><StatsCard
        :label="t('sessionDuration')"
        :value="duration"
        :icon="Clock"
      />
    </div>
    <p class="subtle">{{ t("detectedDisclaimer") }}</p>
    <button class="danger" @click="confirmReset = true">
      {{ t("resetStats") }}
    </button></template
  >
  <template v-else-if="page === 'history'"
    ><section v-if="!live.history.length" class="panel empty-state">
      <Clock :size="38" />
      <h3>{{ t("historyEmpty") }}</h3>
      <p>{{ t("historyEmptyHint") }}</p>
    </section>
    <section
      v-for="entry in live.history"
      :key="entry.id"
      class="panel history-entry"
    >
      <h2>
        @{{ entry.username }}
        <small>{{ new Date(entry.endedAt).toLocaleString() }}</small>
      </h2>
      <div class="history-stats">
        <span
          >{{ Math.floor((entry.endedAt - entry.stats.startedAt) / 60000) }}
          {{ t("minutes") }}</span
        ><span
          v-for="key in [
            'likes',
            'gifts',
            'diamonds',
            'comments',
            'followers',
          ] as const"
          :key="key"
          ><strong>{{ entry.stats[key].toLocaleString() }}</strong>
          {{ t(key) }}</span
        >
      </div>
    </section></template
  >
  <div
    v-if="selected || confirmReset"
    class="modal-backdrop"
    @click.self="
      selected = undefined;
      confirmReset = false;
    "
  >
    <section
      class="panel modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t(confirmReset ? 'resetStats' : 'userDetails')"
      @keydown.esc="
        selected = undefined;
        confirmReset = false;
      "
    >
      <template v-if="selected"
        ><h2>{{ selected.user.nickname }}</h2>
        <p>@{{ selected.user.username }}</p>
        <div
          v-for="(gift, key) in selected.breakdown"
          :key="key"
          class="detail-row"
        >
          <span>{{ gift.name }}</span
          ><strong>×{{ gift.count }}</strong>
        </div>
        <p>
          {{ selected.gifts }} {{ t("gifts") }} · {{ selected.diamonds }}
          {{ t("diamonds") }}
        </p>
        <button class="secondary" autofocus @click="selected = undefined">
          {{ t("close") }}
        </button></template
      ><template v-else
        ><h2>{{ t("resetStats") }}</h2>
        <p>{{ t("resetConfirm") }}</p>
        <div class="button-row">
          <button class="secondary" autofocus @click="confirmReset = false">
            {{ t("cancel") }}</button
          ><button
            class="danger"
            @click="
              live.reset();
              confirmReset = false;
            "
          >
            {{ t("confirm") }}
          </button>
        </div></template
      >
    </section>
  </div>
</template>
