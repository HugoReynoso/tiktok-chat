import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { io, type Socket } from "socket.io-client";
import {
  emptyStats,
  type ClientEvents,
  type ServerEvents,
  type LiveStatus,
  type ChatMessage,
  type GiftEvent,
  type RankingEntry,
  type LiveStats,
} from "../../../shared/types";
import { useSettings } from "./settings";
import {
  readComment,
  runRules,
  speak,
  stopAudio,
  unlockAudio,
} from "../services/audio";
import { i18n } from "../locales";
import { isDemo, demoMessage, demoGift, demoRankings } from "../services/demo";
interface HistoryEntry {
  id: string;
  username: string;
  endedAt: number;
  stats: LiveStats;
}
export const useLive = defineStore("live", () => {
  const settings = useSettings();
  const status = ref<LiveStatus>("idle");
  const error = ref("");
  const stats = ref(emptyStats());
  const messages = ref<ChatMessage[]>([]);
  const gifts = ref<GiftEvent[]>([]);
  const rankings = ref<RankingEntry[]>([]);
  const activity = ref<{ id: string; text: string }[]>([]);
  const history = ref<HistoryEntry[]>([]);
  const username = ref("");
  const storageError = ref(false);
  try {
    const entries: unknown = JSON.parse(
      localStorage.getItem("tiktok-chat:history") ?? "[]",
    );
    if (Array.isArray(entries))
      history.value = entries
        .filter(
          (e) =>
            e &&
            typeof e.username === "string" &&
            e.stats &&
            Number.isFinite(e.endedAt),
        )
        .slice(0, 10);
  } catch {
    storageError.value = true;
  }
  let socket: Socket<ServerEvents, ClientEvents> | undefined;
  let desired = false;
  let savedStart = 0;
  let demoTimer: ReturnType<typeof setInterval> | undefined;
  let demoIndex = 6;
  function loadDemo() {
    clear();
    username.value = "creator_demo";
    rankings.value = demoRankings();
    stats.value = {
      ...emptyStats(),
      startedAt: Date.now(),
      viewers: 128,
      peakViewers: 156,
      likes: 720,
      detectedLikes: 720,
      gifts: 50,
      diamonds: 50,
      comments: 6,
      followers: 4,
      shares: 4,
    };
    messages.value = Array.from({ length: 6 }, (_, index) =>
      demoMessage(index, i18n.global.t(`demoMessage${index % 4}`)),
    );
    gifts.value = [demoGift(1), demoGift(2)];
  }
  function startDemo() {
    unlockAudio();
    if (demoTimer) clearInterval(demoTimer);
    status.value = "connected";
    demoTimer = setInterval(() => {
      const message = demoMessage(
        demoIndex++,
        i18n.global.t(`demoMessage${demoIndex % 4}`),
      );
      messages.value.push(message);
      if (messages.value.length > 500) messages.value.shift();
      stats.value.comments++;
      readComment(message, i18n.global.t("says"));
      if (demoIndex % 3 === 0) {
        const gift = demoGift(demoIndex);
        gifts.value.unshift(gift);
        gifts.value = gifts.value.slice(0, 100);
        stats.value.gifts += gift.count;
        stats.value.diamonds += gift.diamonds;
        const row = rankings.value.find((row) => row.user.id === gift.user.id)!;
        row.gifts += gift.count;
        row.diamonds += gift.diamonds;
        row.breakdown[gift.giftId]!.count += gift.count;
        row.breakdown[gift.giftId]!.diamonds += gift.diamonds;
        runRules("gift", gift.user, gift.name, gift.count);
      }
    }, 3500);
  }
  const active = computed(() =>
    ["connected", "connecting", "reconnecting"].includes(status.value),
  );
  function archive() {
    if (isDemo) return;
    if (!stats.value.startedAt || savedStart === stats.value.startedAt) return;
    savedStart = stats.value.startedAt;
    history.value.unshift({
      id: crypto.randomUUID(),
      username: username.value,
      endedAt: Date.now(),
      stats: { ...stats.value },
    });
    history.value = history.value.slice(0, 10);
    try {
      localStorage.setItem(
        "tiktok-chat:history",
        JSON.stringify(history.value),
      );
    } catch {
      storageError.value = true;
    }
  }
  function clear() {
    messages.value = [];
    gifts.value = [];
    rankings.value = [];
    activity.value = [];
    stats.value = emptyStats();
    stopAudio();
  }
  function setup() {
    if (socket) return socket;
    socket = io({
      autoConnect: false,
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socket.on("connect", () => {
      if (desired) socket!.emit("live:connect", settings.data.username);
    });
    socket.on("connect_error", () => {
      error.value = "serverUnavailable";
      status.value = "error";
    });
    socket.on("disconnect", () => {
      archive();
      stopAudio();
      status.value = desired ? "reconnecting" : "disconnected";
      if (desired) error.value = "sessionInterrupted";
    });
    socket.on("live:status", (data) => {
      status.value = data.status;
      error.value = data.code ?? "";
      if (data.status === "error" || data.status === "ended") {
        desired = false;
        archive();
        stopAudio();
      }
    });
    socket.on("live:connected", (data) => {
      username.value = data.username;
    });
    socket.on("live:stats", (data) => {
      if (
        stats.value.startedAt &&
        data.stats.startedAt &&
        stats.value.startedAt !== data.stats.startedAt
      ) {
        archive();
        clear();
      }
      stats.value = data.stats;
      rankings.value = data.rankings;
    });
    socket.on("chat:message", (message) => {
      messages.value.push(message);
      if (messages.value.length > 500) messages.value.shift();
      readComment(message, i18n.global.t("says"));
    });
    socket.on("gift:received", (gift) => {
      gifts.value.unshift(gift);
      gifts.value = gifts.value.slice(0, 100);
      runRules("gift", gift.user, gift.name, gift.count);
    });
    for (const event of ["follow", "share"] as const)
      socket.on(`${event}:received`, (user) => {
        activity.value.unshift({
          id: crypto.randomUUID(),
          text: i18n.global.t(
            event === "follow" ? "followActivity" : "shareActivity",
            { username: user.nickname },
          ),
        });
        activity.value = activity.value.slice(0, 50);
        runRules(event, user);
        if (event === "follow" && settings.data.followThanks)
          speak(i18n.global.t("thanksFollow", { username: user.nickname }));
      });
    socket.on("live:ended", () => {
      desired = false;
      archive();
      stopAudio();
      status.value = "ended";
    });
    socket.on("live:disconnected", () => {
      archive();
      stopAudio();
      status.value = "disconnected";
    });
    socket.on("live:reset", () => clear());
    return socket;
  }
  function connect() {
    if (isDemo) {
      startDemo();
      return;
    }
    unlockAudio();
    if (
      !/^[a-zA-Z0-9_.]{2,24}$/.test(settings.data.username.replace(/^@/, ""))
    ) {
      error.value = "invalidUsername";
      return;
    }
    archive();
    clear();
    error.value = "";
    status.value = "connecting";
    desired = true;
    username.value = settings.data.username.replace(/^@/, "");
    const connection = setup();
    if (connection.connected)
      connection.emit("live:connect", settings.data.username);
    else connection.connect();
  }
  function disconnect() {
    if (demoTimer) {
      clearInterval(demoTimer);
      demoTimer = undefined;
    }
    desired = false;
    socket?.emit("live:disconnect");
    archive();
    stopAudio();
    status.value = "disconnected";
  }
  function reset() {
    if (isDemo) {
      disconnect();
      loadDemo();
      return;
    }
    archive();
    if (socket?.connected) socket.emit("live:reset");
    else clear();
  }
  const score = (row: RankingEntry) =>
    row.likes * settings.data.scores.like +
    row.diamonds * settings.data.scores.diamond +
    row.shares * settings.data.scores.share +
    row.follows * settings.data.scores.follow;
  if (isDemo) loadDemo();
  return {
    isDemo,
    status,
    error,
    stats,
    messages,
    gifts,
    rankings,
    activity,
    history,
    username,
    active,
    connect,
    disconnect,
    reset,
    score,
    storageError,
  };
});
