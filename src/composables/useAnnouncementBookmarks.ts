import { computed, onBeforeUnmount, reactive, readonly, ref, watch } from 'vue';
import { getBookmarkStatus, setAnnouncementSaved } from '@/api/bookmarks';
interface BookmarkContext { ids: readonly number[]; token: string; username?: string | undefined; intentId?: string | undefined }
export function useAnnouncementBookmarks(context: BookmarkContext, login: (id: number) => void, consumeIntent: () => void) {
  const states = reactive<Record<number, boolean>>({});
  const pending = reactive<Record<number, boolean>>({});
  const errors = reactive<Record<number, string>>({});
  const ready = reactive<Record<number, boolean>>({});
  const loadError = ref(''), resumedId = ref<number | null>(null), resumeMessage = ref('');
  let generation = 0, loadGeneration = 0, consumed = '';
  const revisions: Record<number, number> = {};
  function reset() {
    generation++; loadGeneration++; consumed = ''; loadError.value = ''; resumedId.value = null; resumeMessage.value = '';
    for (const record of [states, pending, errors, ready, revisions]) for (const id of Object.keys(record)) delete record[Number(id)];
  }
  watch(() => [context.token, context.username], reset, { flush: 'sync' });
  onBeforeUnmount(reset);
  async function toggle(id: number, desired = !states[id]) {
    if (!context.token) { login(id); return; }
    if (!ready[id] || pending[id]) return;
    const request = generation;
    revisions[id] = (revisions[id] || 0) + 1;
    pending[id] = true; errors[id] = '';
    try {
      const response = await setAnnouncementSaved(id, desired);
      if (request === generation) states[id] = response.data.saved;
    } catch {
      if (request === generation) errors[id] = '관심 공고를 변경하지 못했습니다. 다시 눌러 시도해 주세요.';
    } finally { if (request === generation) { pending[id] = false; revisions[id] = (revisions[id] || 0) + 1; } }
  }
  async function load() {
    const request = generation, lookup = ++loadGeneration;
    loadError.value = '';
    if (!context.token) return;
    const intent = context.intentId || '';
    const id = Number(intent);
    const validIntent = /^-?[1-9]\d*$/.test(intent) && Number.isSafeInteger(id);
    const ids = [...new Set([...context.ids, ...(validIntent ? [id] : [])])];
    const versions = { ...revisions };
    try {
      const saved = new Set<number>();
      for (let offset = 0; offset < ids.length; offset += 100) {
        const result = await getBookmarkStatus(ids.slice(offset, offset + 100));
        if (request !== generation || lookup !== loadGeneration) return;
        result.data.savedIds.forEach(id => saved.add(id));
      }
      if (request !== generation || lookup !== loadGeneration) return;
      for (const id of ids) if (!pending[id] && (revisions[id] || 0) === (versions[id] || 0)) { states[id] = saved.has(id); ready[id] = true; }
      if (validIntent && consumed !== intent && ready[id]) {
        consumed = intent; resumedId.value = id;
        await resumeSave();
      }
    } catch {
      if (request === generation && lookup === loadGeneration) loadError.value = '관심 공고 상태를 확인하지 못했습니다. 다시 확인해 주세요.';
    }
  }
  async function resumeSave() {
    const id = resumedId.value;
    if (id === null) return;
    const request = generation;
    if (!states[id]) await toggle(id, true);
    if (request === generation && states[id]) { resumeMessage.value = '관심 공고에 저장했습니다.'; consumeIntent(); }
  }
  watch(() => [context.token, context.username, context.ids.join(','), context.intentId], load, { immediate: true });
  return { saved: (id: number) => !!states[id], busy: (id: number) => !!pending[id],
    enabled: (id: number) => !context.token || !!ready[id], error: (id: number) => errors[id] || '', loadError: readonly(loadError), load, toggle, resumeSave,
    resumeMessage: readonly(resumeMessage), resumeError: computed(() => resumedId.value === null ? '' : errors[resumedId.value] || ''),
    resumeSaving: computed(() => resumedId.value !== null && !!pending[resumedId.value]) };
}
