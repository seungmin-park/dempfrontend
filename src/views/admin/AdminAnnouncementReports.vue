<template>
  <section><div class="admin-section-heading"><div><h2>공고 오류 제보</h2><p>원문을 확인해 공고를 수정한 뒤 처리 내용을 남겨주세요.</p></div><label><input type="checkbox" v-model="all" @change="page = 0; load()" /> 처리 완료 포함</label></div>
    <AsyncState :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error"><p v-if="!reports.length" class="state-panel">{{ all ? '접수된 제보가 없습니다.' : '미처리 제보가 없습니다.' }}</p>
      <div class="admin-rows"><article v-for="report in reports" :key="report.id" class="state-panel"><router-link :to="`/admin/announcements/${report.announcementId}`">{{ report.title }} · 공고 확인·수정</router-link><p>{{ report.message }}</p><p class="field-hint">{{ report.reporter }} · {{ formatRecruitDate(report.createdAt) }}</p><p v-if="report.resolvedAt">처리 완료 · {{ report.resolution }} · {{ report.resolvedBy }} · {{ formatRecruitDate(report.resolvedAt) }}</p><form v-else @submit.prevent="resolve(report.id)"><div class="field"><label :for="`resolution-${report.id}`">처리 내용</label><textarea :id="`resolution-${report.id}`" aria-label="제보 처리 내용" v-model="notes[report.id]" required maxlength="1000" :disabled="busy" /></div><button class="button button-primary" :disabled="busy">처리 완료</button></form></article></div>
      <div v-if="reports.length || page > 0" class="question-pages"><button class="button button-secondary" :disabled="page === 0 || busy" @click="page--; load()">이전</button><span>{{ page + 1 }} 페이지</span><button class="button button-secondary" :disabled="last || busy" @click="page++; load()">다음</button></div>
    </template><p v-if="mutationError" role="alert" class="form-error">{{ mutationError }}</p>
  </section>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getAnnouncementReports, resolveAnnouncementReport, type AnnouncementReport } from '@/api/announcementReports';
import { formatRecruitDate } from '@/presentation/announcement';
import { requestErrorMessage } from '@/presentation/requestError';
import AsyncState from '@/components/common/AsyncState.vue';
const reports = ref<AnnouncementReport[]>([]), notes = ref<Record<number,string>>({});
const all = ref(false), page = ref(0), last = ref(true), loading = ref(true), busy = ref(false), error = ref(''), mutationError = ref('');
let generation = 0;
async function load() {
  const current = ++generation; loading.value = true; error.value = '';
  try { const result = await getAnnouncementReports(all.value, page.value); if (current === generation) { reports.value = result.content; last.value = result.last; } }
  catch (reason) { if (current === generation) error.value = requestErrorMessage(reason); }
  finally { if (current === generation) loading.value = false; }
}
async function resolve(id: number) {
  if (busy.value) return; const note = notes.value[id]?.trim(); mutationError.value = '';
  if (!note) { mutationError.value = '처리 내용을 입력해 주세요.'; return; }
  busy.value = true;
  try { await resolveAnnouncementReport(id, note); await load(); }
  catch (reason) { mutationError.value = requestErrorMessage(reason); }
  finally { busy.value = false; }
}
onMounted(load); onBeforeUnmount(() => { generation++; });
</script>
