import { test } from "node:test";
import assert from "node:assert/strict";
import { Session } from "../models/Session.js";
import { finalGift } from "./normalize.js";
test("streak counts only final event and rejects duplicate", () => {
  const session = new Session();
  for (const d of [
    { giftType: 1, repeatCount: 1, repeatEnd: false },
    { giftType: 1, repeatCount: 10, repeatEnd: false },
    { giftType: 1, repeatCount: 10, repeatEnd: true },
    { giftType: 1, repeatCount: 10, repeatEnd: true },
  ]) {
    if (finalGift(d) && session.accept("gift:combo"))
      session.gift({
        id: "combo",
        user: {
          id: "1",
          username: "test",
          nickname: "Test",
          follower: false,
          subscriber: false,
        },
        giftId: "rose",
        name: "Rose",
        count: d.repeatCount,
        diamonds: d.repeatCount,
        timestamp: 0,
      });
  }
  assert.equal(session.stats.gifts, 10);
  assert.equal(session.stats.diamonds, 10);
  session.reset();
  assert.equal(session.users.size, 0);
  assert.equal(session.stats.gifts, 0);
  assert.equal(session.accept("gift:combo"), false);
});
