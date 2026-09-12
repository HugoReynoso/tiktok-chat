import {
  TikTokLiveConnection,
  WebcastEvent,
  ControlEvent,
} from "tiktok-live-connector";
import type { Socket } from "socket.io";
import type {
  ClientEvents,
  ServerEvents,
  GiftEvent,
} from "../../../shared/types.js";
import { Session } from "../models/Session.js";
import {
  object,
  str,
  num,
  normalizeUser,
  finalGift,
} from "../utils/normalize.js";

export class TikTokLiveService {
  private connection?: TikTokLiveConnection;
  private retry?: ReturnType<typeof setTimeout>;
  private timer: ReturnType<typeof setInterval>;
  private generation = 0;
  private attempts = 0;
  private username = "";
  private active = false;
  private dirty = false;
  private session = new Session();
  constructor(private socket: Socket<ClientEvents, ServerEvents>) {
    this.timer = setInterval(() => {
      if (this.dirty) {
        this.socket.emit("live:stats", this.session.snapshot());
        this.dirty = false;
      }
    }, 750);
  }
  private status(
    status: Parameters<ServerEvents["live:status"]>[0]["status"],
    code?: string,
  ) {
    this.socket.emit("live:status", { status, code });
  }
  async connect(username: unknown) {
    if (
      typeof username !== "string" ||
      !/^[a-zA-Z0-9_.]{2,24}$/.test(username.replace(/^@/, ""))
    ) {
      this.status("error", "invalidUsername");
      return;
    }
    this.stop();
    this.username = username.replace(/^@/, "");
    this.session = new Session();
    this.active = true;
    this.attempts = 0;
    await this.open(this.generation);
  }
  private async open(generation: number) {
    if (!this.active || generation !== this.generation) return;
    this.status(this.attempts ? "reconnecting" : "connecting");
    
    console.log("EulerStream API key configured:",Boolean(process.env.SIGN_API_KEY));
    
    const connection = new TikTokLiveConnection(this.username, {
      enableExtendedGiftInfo: true,
      processInitialData: false,
      signApiKey: process.env.SIGN_API_KEY,
    });
    this.connection = connection;
    const current = () =>
      this.active &&
      generation === this.generation &&
      this.connection === connection;
    const event = (
      kind: "chat" | "gift" | "like" | "follow" | "share" | "viewer",
      raw: unknown,
    ) => {
      if (!current()) return;
      const d = object(raw);
      const user = normalizeUser(d.user ?? d, d.userIdentity);
      const common = object(d.common);
      const group = str(d.groupId);
      const id =
        kind === "gift" && group && group !== "0"
          ? `${user.id}:${str(d.giftId)}:${group}`
          : str(
              common.msgId ?? common.messageId ?? d.msgId,
              crypto.randomUUID(),
            );
      if (kind === "gift" && !finalGift(d)) return;
      if (!this.session.accept(`${kind}:${id}`)) return;
      const stats = this.session.stats;
      this.dirty = true;
      if (kind === "chat") {
        stats.comments++;
        this.socket.emit("chat:message", {
          id,
          user,
          text: str(d.comment ?? d.content).slice(0, 2000),
          timestamp: Date.now(),
        });
      }
      if (kind === "gift") {
        const detail = object(d.giftDetails ?? d.gift);
        const count = Math.max(1, num(d.repeatCount));
        const gift: GiftEvent = {
          id,
          user,
          giftId: str(d.giftId),
          name: str(
            d.giftName ?? detail.giftName ?? detail.name,
            `Gift ${str(d.giftId)}`,
          ),
          count,
          diamonds: num(d.diamondCount ?? detail.diamondCount) * count,
          timestamp: Date.now(),
        };
        this.session.gift(gift);
        this.socket.emit("gift:received", gift);
      }
      if (kind === "like") {
        const count = num(d.likeCount ?? d.count);
        stats.detectedLikes += count;
        stats.likes = Math.max(stats.likes, num(d.totalLikeCount ?? d.total));
        const row = this.session.user(user);
        if (row) row.likes += count;
        this.socket.emit("like:received", { user, count, total: stats.likes });
      }
      if (kind === "follow") {
        stats.followers++;
        const row = this.session.user(user);
        if (row) row.follows++;
        this.socket.emit("follow:received", user);
      }
      if (kind === "share") {
        stats.shares++;
        const row = this.session.user(user);
        if (row) row.shares++;
        this.socket.emit("share:received", user);
      }
      if (kind === "viewer") {
        stats.viewers = num(d.viewerCount ?? d.total);
        stats.peakViewers = Math.max(stats.peakViewers, stats.viewers);
        this.socket.emit("viewer:update", stats.viewers);
      }
    };
    connection.on(WebcastEvent.CHAT, (d) => event("chat", d));
    connection.on(WebcastEvent.GIFT, (d) => event("gift", d));
    connection.on(WebcastEvent.LIKE, (d) => event("like", d));
    connection.on(WebcastEvent.FOLLOW, (d) => event("follow", d));
    connection.on(WebcastEvent.SHARE, (d) => event("share", d));
    connection.on(WebcastEvent.ROOM_USER, (d) => event("viewer", d));
    connection.on(WebcastEvent.STREAM_END, () => {
      if (!current()) return;
      this.socket.emit("live:stats", this.session.snapshot());
      this.socket.emit("live:ended");
      this.stop();
      this.status("ended");
    });
    connection.on(ControlEvent.ERROR, () => {
        console.error("TikTok ControlEvent.ERROR:", error);

    });
    connection.on(ControlEvent.DISCONNECTED, () => {
      if (current()) this.schedule(generation);
    });
    try {
      await connection.connect();
      if (!current()) {
        connection.disconnect();
        return;
      }
      this.attempts = 0;
      if (!this.session.stats.startedAt)
        this.session.stats.startedAt = Date.now();
      this.status("connected");
      this.socket.emit("live:connected", { username: this.username });
      this.dirty = true;
    }  catch (error: unknown) {
          if (!current()) return;
        
          console.error("TikTok connection failed:", error);
        
          const message =
            error instanceof Error
              ? error.message
              : String(error);
        
          console.error("TikTok error message:", message);
        
          if (/not live|offline|LIVE_NOT_FOUND/i.test(message)) {
            this.stop();
            this.status("error", "offline");
            return;
          }
        
          if (/sign|signature|euler|401|403|429/i.test(message)) {
            console.error(
              "TikTok signing/EulerStream error. Check SIGN_API_KEY."
            );
          }
        
          this.schedule(generation);
}
  }
  private schedule(generation: number) {
    if (this.retry || !this.active) return;
    this.connection?.removeAllListeners();
    this.connection?.disconnect();
    this.connection = undefined;
    if (++this.attempts > 3) {
      this.stop();
      this.status("error", "tiktokError");
      return;
    }
    this.status("reconnecting");
    this.retry = setTimeout(() => {
      this.retry = undefined;
      void this.open(generation);
    }, 2000 * this.attempts);
  }
  reset() {
    this.session.reset();
    this.socket.emit("live:reset");
    this.socket.emit("live:stats", this.session.snapshot());
  }
  stop() {
    this.active = false;
    this.generation++;
    if (this.retry) clearTimeout(this.retry);
    this.retry = undefined;
    this.connection?.removeAllListeners();
    this.connection?.disconnect();
    this.connection = undefined;
  }
  disconnect() {
    this.socket.emit("live:stats", this.session.snapshot());
    this.stop();
    this.socket.emit("live:disconnected");
    this.status("disconnected");
  }
  dispose() {
    this.stop();
    clearInterval(this.timer);
  }
}
