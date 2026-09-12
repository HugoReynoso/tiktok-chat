import type { LiveUser } from "../../../shared/types.js";
export const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
export const str = (value: unknown, fallback = "") =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "bigint"
    ? String(value)
    : fallback;
export const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};
export function normalizeUser(value: unknown, identity?: unknown): LiveUser {
  const u = object(value);
  const flags = object(identity);
  const info = object(u.followInfo);
  const urls = object(u.profilePicture ?? u.avatarThumb).urlList;
  const avatar = Array.isArray(urls) ? str(urls[0]) : str(u.profilePictureUrl);
  return {
    id: str(u.userId ?? u.id ?? u.uniqueId ?? u.displayId, "unknown"),
    username: str(u.uniqueId ?? u.displayId, "unknown"),
    nickname: str(u.nickname ?? u.uniqueId ?? u.displayId, "unknown"),
    avatar: avatar.startsWith("https://") ? avatar : undefined,
    follower:
      flags.isFollowerOfAnchor === true ||
      flags.isMutualFollowingWithAnchor === true ||
      [1, 3].includes(num(info.followStatus)),
    subscriber: flags.isSubscriberOfAnchor === true || u.isSubscriber === true,
  };
}
export function finalGift(data: Record<string, unknown>) {
  return (
    num(
      data.giftType ??
        object(data.giftDetails).giftType ??
        object(data.gift).type,
    ) !== 1 ||
    data.repeatEnd === true ||
    data.repeatEnd === 1
  );
}
