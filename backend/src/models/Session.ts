import {
  emptyStats,
  type GiftEvent,
  type LiveUser,
  type RankingEntry,
  type Snapshot,
} from "../../../shared/types.js";
export class Session {
  stats = emptyStats();
  users = new Map<string, RankingEntry>();
  private seen = new Set<string>();
  accept(id: string) {
    if (this.seen.has(id)) return false;
    this.seen.add(id);
    if (this.seen.size > 10000)
      this.seen.delete(this.seen.values().next().value!);
    return true;
  }
  user(user: LiveUser) {
    let row = this.users.get(user.id);
    if (!row) {
      if (this.users.size >= 10000) return undefined;
      row = {
        user,
        gifts: 0,
        diamonds: 0,
        likes: 0,
        follows: 0,
        shares: 0,
        breakdown: {},
      };
      this.users.set(user.id, row);
    }
    return row;
  }
  gift(event: GiftEvent) {
    this.stats.gifts += event.count;
    this.stats.diamonds += event.diamonds;
    const row = this.user(event.user);
    if (!row) return;
    row.gifts += event.count;
    row.diamonds += event.diamonds;
    const item = (row.breakdown[event.giftId] ??= {
      name: event.name,
      count: 0,
      diamonds: 0,
    });
    item.count += event.count;
    item.diamonds += event.diamonds;
  }
  reset() {
    this.stats = emptyStats();
    this.stats.startedAt = Date.now();
    this.users.clear(); /* preserve deduplication across reset */
  }
  snapshot(): Snapshot {
    return { stats: this.stats, rankings: [...this.users.values()] };
  }
}
