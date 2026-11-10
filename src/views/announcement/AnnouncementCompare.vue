<template>
  <div class="page compare-page">
    <header class="page-heading compare-heading">
      <div><h1>공고 비교</h1><p>관심 공고에서 고른 공고의 조건을 같은 기준으로 나란히 봅니다. 지원 전에는 원문에서 최신 내용을 확인하세요.</p></div>
      <RouterLink class="button button-secondary" :to="savedLink">관심 공고로 돌아가기</RouterLink>
    </header>
    <p v-if="ids.length < 2" role="status" class="compare-empty">비교하려면 관심 공고에서 2개 이상, 최대 4개까지 골라 주세요. <RouterLink :to="savedLink">관심 공고에서 고르기</RouterLink></p>
    <div v-else class="compare-scroll" role="region" aria-label="공고 비교 표" tabindex="0">
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th v-for="column in comparisonColumns" :key="column.id" scope="col">
              <RouterLink v-if="column.status === 'loaded'" :to="`/detail/${column.id}`">{{ column.announcement.title || '제목 없음' }}</RouterLink>
              <span v-else-if="column.status === 'loading'" role="status">불러오는 중…</span>
              <template v-else-if="column.status === 'unavailable'"><strong>이용할 수 없는 공고</strong><small>비공개로 바뀌었거나 삭제되었습니다.</small></template>
              <template v-else><strong>불러오지 못했습니다</strong><button type="button" class="compare-action" data-test="retry-compare" @click="retryComparison(column.id)">다시 시도</button></template>
              <button type="button" class="compare-action" data-test="remove-compare" :aria-label="`${columnLabel(column)} 비교에서 빼기`" @click="$router.replace({ path: '/compare', query: { ids: idsWithout(column.id) } })">빼기</button>
            </th>
          </tr>
        </thead>
        <tbody><tr v-for="row in rows" :key="row.label"><th scope="row">{{ row.label }}</th><td v-for="(value, index) in row.values" :key="index">{{ value }}</td></tr></tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { DeepReadonly } from 'vue';
import { RouterLink } from 'vue-router';
import { useAnnouncementComparison, type ComparisonColumn } from '@/composables/useAnnouncementComparison';
import { useRecruitmentTime } from '@/composables/useRecruitmentTime';
import { comparisonRows } from '@/presentation/announcementComparison';

const props = defineProps<{ ids: number[] }>();
const { comparisonColumns, retryComparison } = useAnnouncementComparison(() => props.ids);
const { recruitmentNow } = useRecruitmentTime();
const rows = computed(() => comparisonRows(comparisonColumns.value.map(column => column.status === 'loaded' ? column.announcement : null), recruitmentNow.value));
const savedLink = computed(() => ({ path: '/mypage', query: { tab: 'saved', compare: props.ids.join(',') } }));
const idsWithout = (id: number) => props.ids.filter(selected => selected !== id).join(',');
const columnLabel = (column: DeepReadonly<ComparisonColumn>) => column.status === 'loaded' ? column.announcement.title || '제목 없음' : `공고 ${column.id}`;
</script>
<style scoped>
.compare-page { max-width: 1180px; margin-inline: auto; }
.compare-heading { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.compare-heading p { color: var(--muted); font-size: 14px; margin: 8px 0 0; }
.compare-empty { padding: 32px 24px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); line-height: 1.8; }
.compare-scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.compare-scroll:focus-visible { outline: 3px solid var(--muted); outline-offset: 3px; }
.compare-table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 14px; }
.compare-table th, .compare-table td { padding: 14px 16px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
.compare-table thead th { min-width: 180px; background: var(--canvas); }
.compare-table thead th > * { display: block; }
.compare-table thead a { font-weight: 650; color: var(--primary); }
.compare-table small { color: var(--meta); margin-top: 4px; }
.compare-table tbody th { position: sticky; left: 0; z-index: 1; min-width: 104px; background: var(--surface); color: var(--meta); font-size: 13px; font-weight: 600; }
.compare-table tr:last-child > * { border-bottom: 0; }
.compare-action { min-height: 44px; margin-top: 4px; padding: 0; border: 0; background: transparent; color: var(--muted); font-size: 12px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
</style>
