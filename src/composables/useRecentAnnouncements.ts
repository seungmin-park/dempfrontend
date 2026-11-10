import { readonly, ref, watch } from 'vue';

/** Recently opened postings, kept on this device per signed-in account; nothing is sent to the server. */
export interface RecentAnnouncement { id: number; title: string; company: string; viewedAt: string }
const LIMIT = 20;
const keyFor = (username: string) => `demp:recent-announcements:${username}`;

function isRecent(item: unknown): item is RecentAnnouncement {
  if (!item || typeof item !== 'object') return false;
  const { id, title, company, viewedAt } = item as Record<string, unknown>;
  return Number.isInteger(id) && typeof title === 'string' && typeof company === 'string' && typeof viewedAt === 'string';
}

export function readRecentAnnouncements(username: string): RecentAnnouncement[] {
  if (!username) return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(keyFor(username)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isRecent).slice(0, LIMIT) : [];
  } catch { return []; }
}

export function recordRecentAnnouncement(username: string, item: Omit<RecentAnnouncement, 'viewedAt'>, now = Date.now()) {
  if (!username) return;
  const items = [{ ...item, viewedAt: new Date(now).toISOString() }, ...readRecentAnnouncements(username).filter(entry => entry.id !== item.id)].slice(0, LIMIT);
  try { localStorage.setItem(keyFor(username), JSON.stringify(items)); } catch { /* storage full or blocked: the posting itself still opens */ }
}

export function forgetRecentAnnouncements(username: string) {
  if (!username) return;
  try { localStorage.removeItem(keyFor(username)); } catch { /* ignore */ }
}

export function useRecentAnnouncements(username: () => string) {
  const items = ref<RecentAnnouncement[]>([]);
  watch(username, name => { items.value = readRecentAnnouncements(name); }, { immediate: true });
  function clear() { forgetRecentAnnouncements(username()); items.value = []; }
  return { recentAnnouncements: readonly(items), clearRecentAnnouncements: clear };
}
