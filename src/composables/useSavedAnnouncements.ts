import { onBeforeUnmount, readonly, ref, watch } from 'vue';
import { getBookmarks, setAnnouncementSaved, type BookmarkEntry } from '@/api/bookmarks';
export function useSavedAnnouncements(token: () => string, username: () => string) {
  const entries = ref<BookmarkEntry[]>([]), loading = ref(false), error = ref(''), hasNext = ref(false);
  const pending = ref<Record<number, boolean>>({}), errors = ref<Record<number, string>>({});
  let page = 0, generation = 0;
  async function loadMore() {
    if (loading.value || !token()) return;
    const request = generation, requestedPage = page;
    loading.value = true; error.value = '';
    try {
      const result = await getBookmarks(requestedPage);
      if (request !== generation) return;
      const ids = new Set(entries.value.map(entry => entry.announcementId));
      entries.value.push(...result.data.content.filter(entry => !ids.has(entry.announcementId)));
      hasNext.value = result.data.hasNext; page++;
    } catch { if (request === generation) error.value = '관심 공고를 불러오지 못했습니다. 다시 시도해 주세요.'; }
    finally { if (request === generation) loading.value = false; }
  }
  function reset() { generation++; page = 0; entries.value = []; pending.value = {}; errors.value = {}; loading.value = false; hasNext.value = false; error.value = ''; }
  async function remove(id: number) {
    if (loading.value || Object.values(pending.value).some(Boolean)) return;
    const request = generation;
    pending.value[id] = true; errors.value[id] = '';
    try {
      await setAnnouncementSaved(id, false);
      if (request !== generation) return;
      entries.value = entries.value.filter(entry => entry.announcementId !== id);
      // Offset pages shift after deletion. Requery the visible prefix before another page is requested.
      const depth = page;
      generation++; loading.value = true; pending.value = {}; page = 0;
      const prefix = entries.value;
      try {
        const refreshed: BookmarkEntry[] = [];
        for (let i = 0; i < depth; i++) {
          const result = await getBookmarks(i);
          if (generation !== request + 1) return;
          refreshed.push(...result.data.content); hasNext.value = result.data.hasNext; page = i + 1;
          if (!hasNext.value) break;
        }
        entries.value = refreshed;
      } catch { if (generation === request + 1) { entries.value = prefix; page = 0; hasNext.value = true; error.value = '해제는 완료했지만 목록을 다시 확인하지 못했습니다. 다시 시도해 주세요.'; } }
      finally { if (generation === request + 1) loading.value = false; }
    } catch { if (request === generation) errors.value[id] = '해제하지 못했습니다. 다시 눌러 시도해 주세요.'; }
    finally { if (request === generation) pending.value[id] = false; }
  }
  watch(() => [token(), username()], () => { reset(); void loadMore(); }, { immediate: true, flush: 'sync' });
  onBeforeUnmount(reset);
  return { entries: readonly(entries), loading: readonly(loading), error: readonly(error), hasNext: readonly(hasNext), pending: readonly(pending), errors: readonly(errors), loadMore, remove };
}
