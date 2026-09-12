import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeUser, finalGift } from "./normalize.js";
test("v3 user identity and avatar are mapped without assuming missing roles", () => {
  const user = normalizeUser(
    {
      id: "10",
      displayId: "creator",
      nickname: "Creator",
      avatarThumb: { urlList: ["https://example.com/avatar.jpg"] },
    },
    { isFollowerOfAnchor: true, isSubscriberOfAnchor: true },
  );
  assert.equal(user.username, "creator");
  assert.equal(user.follower, true);
  assert.equal(user.subscriber, true);
  assert.equal(user.avatar, "https://example.com/avatar.jpg");
  assert.equal(normalizeUser({}).subscriber, false);
});
test("v3 numeric repeatEnd closes a gift combo", () => {
  assert.equal(finalGift({ gift: { type: 1 }, repeatEnd: 0 }), false);
  assert.equal(finalGift({ gift: { type: 1 }, repeatEnd: 1 }), true);
  assert.equal(finalGift({ gift: { type: 2 }, repeatEnd: 0 }), true);
});
