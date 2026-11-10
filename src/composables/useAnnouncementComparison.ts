import { onUnmounted, readonly, ref, watch } from 'vue';
import type { AnnouncementDetail } from '@/types/api';
import { getAnnouncementDetail } from '@/api/announcements';
import { responseStatus } from '@/presentation/requestError';

export type ComparisonColumn = { id: number; status: 'loading' | 'unavailable' | 'failed' } | { id: number; status: 'loaded'; announcement: AnnouncementDetail };

/** Loads each compared posting on its own, so one private or failed posting never hides the others. */
export function useAnnouncementComparison(ids: () => readonly number[]) {
  const columns = ref<ComparisonColumn[]>([]);
  let generation = 0;
  const replace = (column: ComparisonColumn) => { columns.value = columns.value.map(current => current.id === column.id ? column : current); };
  async function loadColumn(id: number, request: number) {
    try {
      // Comparing is not a new visit, so the view count is left untouched.
      const announcement = await getAnnouncementDetail(id);
      if (request === generation) replace({ id, status: 'loaded', announcement });
    } catch (error) {
      if (request === generation) replace({ id, status: responseStatus(error) === 404 ? 'unavailable' : 'failed' });
    }
  }
  function load(list: readonly number[]) {
    const request = ++generation;
    columns.value = list.map(id => ({ id, status: 'loading' as const }));
    if (list.length >= 2) list.forEach(id => { void loadColumn(id, request); });
  }
  function retry(id: number) { replace({ id, status: 'loading' }); void loadColumn(id, generation); }
  watch(() => [...ids()], load, { immediate: true });
  onUnmounted(() => { generation++; });
  return { comparisonColumns: readonly(columns), retryComparison: retry };
}
