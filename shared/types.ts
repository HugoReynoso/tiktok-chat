export interface LiveUser {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  follower: boolean;
  subscriber: boolean;
}
export interface ChatMessage {
  id: string;
  user: LiveUser;
  text: string;
  timestamp: number;
}
export interface GiftEvent {
  id: string;
  user: LiveUser;
  giftId: string;
  name: string;
  count: number;
  diamonds: number;
  timestamp: number;
}
export interface LikeEvent {
  user: LiveUser;
  count: number;
  total: number;
}
export interface GiftStats {
  name: string;
  count: number;
  diamonds: number;
}
export interface RankingEntry {
  user: LiveUser;
  gifts: number;
  diamonds: number;
  likes: number;
  follows: number;
  shares: number;
  breakdown: Record<string, GiftStats>;
}
export interface LiveStats {
  startedAt: number;
  viewers: number;
  peakViewers: number;
  likes: number;
  detectedLikes: number;
  comments: number;
  gifts: number;
  diamonds: number;
  followers: number;
  shares: number;
}
export type LiveStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "ended"
  | "error";
export interface EventRule {
  id: string;
  enabled: boolean;
  event: "gift" | "follow" | "share";
  gift: string;
  minimum: number;
  action: "sound" | "speak";
  value: string;
}
export interface Snapshot {
  stats: LiveStats;
  rankings: RankingEntry[];
}
export interface ServerEvents {
  "live:status": (data: { status: LiveStatus; code?: string }) => void;
  "live:connected": (data: { username: string }) => void;
  "live:stats": (data: Snapshot) => void;
  "live:ended": () => void;
  "live:disconnected": () => void;
  "chat:message": (data: ChatMessage) => void;
  "gift:received": (data: GiftEvent) => void;
  "like:received": (data: LikeEvent) => void;
  "follow:received": (data: LiveUser) => void;
  "share:received": (data: LiveUser) => void;
  "viewer:update": (data: number) => void;
  "live:reset": () => void;
}
export interface ClientEvents {
  "live:connect": (username: string) => void;
  "live:disconnect": () => void;
  "live:reset": () => void;
}
export const emptyStats = (): LiveStats => ({
  startedAt: 0,
  viewers: 0,
  peakViewers: 0,
  likes: 0,
  detectedLikes: 0,
  comments: 0,
  gifts: 0,
  diamonds: 0,
  followers: 0,
  shares: 0,
});
