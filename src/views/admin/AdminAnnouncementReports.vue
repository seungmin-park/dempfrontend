<template>
  <section><div class="admin-section-heading"><div><h2>공고 오류 제보</h2><p>원문을 확인해 공고를 수정한 뒤 처리 내용을 남겨주세요.</p></div><label><input type="checkbox" v-model="all" @change="page = 0; load()" /> 처리 완료 포함</label></div>
    <AsyncState :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error"><p v-if="!reports.length" class="state-panel">{{ all ? '접수된 제보가 없습니다.' : '미처리 제보가 없습니다.' }}</p>
      <div class="admin-rows">
        <article v-for="report in reports" :key="report.id" class="report-review-card">
          <header class="report-review-heading"><router-link :to="`/admin/announcements/${report.announcementId}`">{{ report.title }} · 공고 확인·수정</router-link><span :class="['report-state', { 'is-resolved': report.resolvedAt }]">{{ report.resolvedAt ? '처리 완료' : '미처리' }}</span></header>
          <p class="report-message">{{ report.message }}</p><p class="report-meta">{{ report.reporter }} · {{ formatRecruitDate(report.createdAt) }}</p>
          <div v-if="report.resolvedAt" class="report-resolution"><strong>처리 내용</strong><p>{{ report.resolution }}</p><p class="report-meta">{{ report.resolvedBy }} · {{ formatRecruitDate(report.resolvedAt) }}</p></div>
          <form v-else class="feedback-form report-resolution" novalidate @submit.prevent="resolve(report.id)">
            <div class="field">
              <label :for="`resolution-${report.id}`">처리 내용</label><p :id="`resolution-${report.id}-hint`" class="feedback-hint">원문에서 확인한 내용과 공고에 반영한 조치를 남겨주세요.</p>
              <textarea :id="`resolution-${report.id}`" aria-label="제보 처리 내용" v-model="notes[report.id]" required maxlength="1000" :disabled="busy"
                :aria-invalid="failures[report.id]?.invalid ?? false" :aria-describedby="`resolution-${report.id}-hint${failures[report.id] ? ` resolution-${report.id}-error` : ''}`"
                placeholder="예: 원문 확인 후 모집 마감일을 수정했습니다." @input="delete failures[report.id]" />
              <div class="feedback-input-footer"><p v-if="failures[report.id]" :id="`resolution-${report.id}-error`" class="feedback-error" role="alert">{{ failures[report.id]?.message }}</p><span data-test="resolution-length" class="feedback-length">{{ (notes[report.id]?.length ?? 0).toLocaleString() }} / 1,000</span></div>
            </div><div class="feedback-actions"><button type="submit" class="button button-primary" :disabled="busy">{{ busy ? '처리 중…' : '처리 완료' }}</button></div>
          </form>
        </article>
      </div>
      <div v-if="reports.length || page > 0" class="question-pages"><button class="button button-secondary" :disabled="page === 0 || busy" @click="page--; load()">이전</button><span>{{ page + 1 }} 페이지</span><button class="button button-secondary" :disabled="last || busy" @click="page++; load()">다음</button></div>
    </template>
  </section>
</template>
<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { getAnnouncementReports, resolveAnnouncementReport, type AnnouncementReport } from '@/api/announcementReports';
import { formatRecruitDate } from '@/presentation/announcement';
import { mutationErrorMessage, requestErrorMessage } from '@/presentation/requestError';
import AsyncState from '@/components/common/AsyncState.vue';
const reports = ref<AnnouncementReport[]>([]), notes = ref<Record<number,string>>({});
const all = ref(false), page = ref(0), last = ref(true), loading = ref(true), busy = ref(false), error = ref('');
const failures = ref<Record<number, { message: string; invalid: boolean }>>({});
let generation = 0;
async function load() {
  const current = ++generation; loading.value = true; error.value = '';
  try { const result = await getAnnouncementReports(all.value, page.value); if (current === generation) { reports.value = result.content; last.value = result.last; } }
  catch (reason) { if (current === generation) error.value = requestErrorMessage(reason); }
  finally { if (current === generation) loading.value = false; }
}
async function resolve(id: number) {
  if (busy.value) return; const note = notes.value[id]?.trim(); delete failures.value[id];
  if (!note || (notes.value[id]?.length ?? 0) > 1000) {
    failures.value[id] = { message: !note ? '처리 내용을 입력해 주세요.' : '처리 내용은 1,000자 이내로 작성해 주세요.', invalid: true };
    await nextTick(); document.getElementById(`resolution-${id}`)?.focus(); return;
  }
  busy.value = true;
  try { await resolveAnnouncementReport(id, note); delete notes.value[id]; await load(); }
  catch (reason) { failures.value[id] = { message: mutationErrorMessage(reason), invalid: false }; }
  finally { busy.value = false; }
}
onMounted(load); onBeforeUnmount(() => { generation++; });
</script>
