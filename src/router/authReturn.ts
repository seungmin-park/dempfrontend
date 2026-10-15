export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some(character => character.charCodeAt(0) <= 32)) return '/';
  try { const url = new URL(value, 'https://demp.invalid'); return url.origin === 'https://demp.invalid' ? url.pathname + url.search + url.hash : '/'; }
  catch { return '/'; }
}
export function bookmarkReturnPath(path: string, id: number): string {
  const url = new URL(safeReturnPath(path), 'https://demp.invalid');
  url.searchParams.set('saveAnnouncement', String(id));
  return url.pathname + url.search + url.hash;
}
