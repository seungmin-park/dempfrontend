/**
 * Where the announcement list was when a posting was opened. It is bound to one history entry,
 * so only a return to that entry (browser back, or the detail page's return button) restores it.
 */
export interface ListReturnPoint { pages: number; id: number }
const KEY = 'demp:announcement-list-return';
const MAX_PAGES = 50;

function historyEntry(): { position?: unknown; forward?: unknown } {
  const state: unknown = window.history.state;
  return state && typeof state === 'object' ? state : {};
}

export function rememberListReturn(path: string, point: ListReturnPoint) {
  const { position } = historyEntry();
  if (typeof position !== 'number') return;
  try { sessionStorage.setItem(KEY, JSON.stringify({ position, path, pages: point.pages, id: point.id })); } catch { /* storage unavailable: the list starts over */ }
}

export function takeListReturn(path: string): ListReturnPoint | null {
  const { position, forward } = historyEntry();
  if (typeof forward !== 'string' || !forward.startsWith('/detail/')) return null;
  let stored: { position?: unknown; path?: unknown; pages?: unknown; id?: unknown };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    stored = JSON.parse(raw);
  } catch { return null; }
  if (stored.position !== position || stored.path !== path) return null;
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  const { pages, id } = stored;
  if (typeof pages !== 'number' || typeof id !== 'number' || !Number.isInteger(pages) || !Number.isInteger(id) || pages < 1 || pages > MAX_PAGES) return null;
  return { pages, id };
}
