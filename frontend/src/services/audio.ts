import { ref } from "vue";
import { useSettings } from "../stores/settings";
import type { ChatMessage, LiveUser } from "../../../shared/types";
export const audioError = ref("");
export const voices = ref<SpeechSynthesisVoice[]>([]);
export const supported =
  typeof window !== "undefined" && "speechSynthesis" in window;
let context: AudioContext | undefined;
let queue: string[] = [];
let speaking = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let version = 0;
export function initAudio() {
  if (supported) {
    const refresh = () => {
      voices.value = speechSynthesis.getVoices();
    };
    refresh();
    speechSynthesis.addEventListener("voiceschanged", refresh);
  }
}
export function unlockAudio() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => (audioError.value = "audioError"));
    if (supported) {
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      speechSynthesis.speak(utterance);
    }
  } catch {
    audioError.value = "audioError";
  }
}
export function stopAudio() {
  version++;
  queue = [];
  speaking = false;
  if (timer) clearTimeout(timer);
  if (supported) speechSynthesis.cancel();
}
export function speak(text: string) {
  if (!supported) {
    audioError.value = "noTts";
    return;
  }
  if (queue.length < 30) queue.push(text.slice(0, 500));
  drain();
}
function drain() {
  if (speaking || !queue.length) return;
  const s = useSettings().data;
  speaking = true;
  const current = version;
  const u = new SpeechSynthesisUtterance(queue.shift());
  u.lang = s.voiceLanguage;
  u.voice = voices.value.find((v) => v.voiceURI === s.voice) ?? null;
  u.rate = s.speed;
  u.pitch = s.pitch;
  u.volume = s.volume;
  const done = () => {
    if (current !== version) return;
    timer = setTimeout(() => {
      speaking = false;
      drain();
    }, s.cooldown * 1000);
  };
  u.onend = done;
  u.onerror = () => {
    audioError.value = "audioError";
    done();
  };
  speechSynthesis.speak(u);
}
export function readComment(message: ChatMessage, says: string) {
  const s = useSettings().data;
  const text = message.text.toLocaleLowerCase();
  const words = (value: string) =>
    value
      .toLocaleLowerCase()
      .split(/[,\n]/)
      .map((w) => w.trim())
      .filter(Boolean);
  if (!s.tts || words(s.blacklist).some((w) => text.includes(w))) return;
  if (
    (s.filter === "followers" && !message.user.follower) ||
    (s.filter === "subscribers" && !message.user.subscriber) ||
    (s.filter === "keywords" &&
      !words(s.keywords).some((w) => text.includes(w)))
  )
    return;
  speak(
    s.readUsername
      ? `${message.user.nickname} ${says}: ${message.text}`
      : message.text,
  );
}
export function playSound(name: string) {
  try {
    context ??= new AudioContext();
    if (context.state !== "running") {
      audioError.value = "audioError";
      return;
    }
    const sequence =
      name === "celebration"
        ? [523, 659, 784, 1047]
        : name === "chime"
          ? [880, 1175]
          : [660];
    for (const [index, frequency] of sequence.entries()) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = frequency;
      const start = context.currentTime + index * 0.13;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(
        useSettings().data.volume * 0.18,
        start + 0.01,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      oscillator.start(start);
      oscillator.stop(start + 0.42);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  } catch {
    audioError.value = "audioError";
  }
}
export function runRules(
  event: "gift" | "follow" | "share",
  user: LiveUser,
  gift = "",
  count = 1,
) {
  for (const rule of useSettings().data.rules)
    if (
      rule.enabled &&
      rule.event === event &&
      (event !== "gift" ||
        (rule.gift.toLowerCase() === gift.toLowerCase() &&
          count >= rule.minimum))
    ) {
      if (rule.action === "speak")
        speak(rule.value.replaceAll("{username}", user.nickname));
      else playSound(rule.value);
    }
}
