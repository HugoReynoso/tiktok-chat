import type {
  LiveUser,
  ChatMessage,
  GiftEvent,
  RankingEntry,
} from "../../../shared/types";
export const isDemo = import.meta.env.VITE_DEMO === "true";
export const demoUsers: LiveUser[] = [
  {
    id: "demo-1",
    username: "marco_demo",
    nickname: "Marco",
    follower: true,
    subscriber: false,
  },
  {
    id: "demo-2",
    username: "anna_demo",
    nickname: "Anna",
    follower: true,
    subscriber: true,
  },
  {
    id: "demo-3",
    username: "luca_demo",
    nickname: "Luca",
    follower: false,
    subscriber: false,
  },
  {
    id: "demo-4",
    username: "sofia_demo",
    nickname: "Sofia",
    follower: true,
    subscriber: false,
  },
];
export function demoMessage(index: number, text: string): ChatMessage {
  return {
    id: `demo-message-${index}`,
    user: demoUsers[index % demoUsers.length]!,
    text,
    timestamp: Date.now(),
  };
}
export function demoGift(index: number): GiftEvent {
  return {
    id: `demo-gift-${index}`,
    user: demoUsers[index % demoUsers.length]!,
    giftId: "demo-rose",
    name: "Rose",
    count: 5,
    diamonds: 5,
    timestamp: Date.now(),
  };
}
export function demoRankings(): RankingEntry[] {
  return demoUsers.map((user, index) => ({
    user,
    gifts: 20 - index * 5,
    diamonds: 20 - index * 5,
    likes: 240 - index * 40,
    follows: 1,
    shares: 1,
    breakdown: {
      "demo-rose": {
        name: "Rose",
        count: 20 - index * 5,
        diamonds: 20 - index * 5,
      },
    },
  }));
}
