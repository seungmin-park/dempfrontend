<template>
  <AsyncState :loading="loading" :error="error" @retry="load" />
  <div v-if="stats" class="admin-dashboard">
    <div class="admin-section-heading"><h2>운영 현황</h2><button class="button button-secondary" @click="load">새로고침</button></div>
    <div class="admin-stats"><article v-for="item in cards" :key="item.key" :data-test="`stat-${item.key}`"><span>{{ item.label }}</span><strong>{{ stats[item.key].toLocaleString() }}</strong><span>전체 {{ item.label }}</span></article></div>
    <div class="admin-shortcuts"><router-link to="/admin/announcements/new"><AppIcon name="plus" :size="26" /><h3>새 공고 등록</h3><p>채용과 교육의 다음 기회를 알리세요.</p></router-link><router-link to="/admin/questions"><AppIcon name="eye" :size="26" /><h3>커뮤니티 살펴보기</h3><p>질문과 답변을 확인하고 관리하세요.</p></router-link></div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { fetchAdminOverview, type AdminOverview } from '@/api/admin';
import AsyncState from '@/components/common/AsyncState.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { requestErrorMessage } from '@/presentation/requestError';
const stats = ref<AdminOverview | null>(null), loading = ref(true), error = ref('');
const cards: { key: keyof AdminOverview; label: string }[] = [{ key: 'announcements', label: '채용 공고' }, { key: 'bootcamps', label: '교육·부트캠프' }, { key: 'questions', label: '질문' }, { key: 'answers', label: '답변' }, { key: 'members', label: '회원' }];
let generation = 0;
async function load() {
  const current = ++generation; loading.value = true; error.value = ''; stats.value = null;
  try { const result = await fetchAdminOverview(); if (current === generation) stats.value = result; }
  catch (reason) { if (current === generation) error.value = requestErrorMessage(reason); }
  finally { if (current === generation) loading.value = false; }
}
onMounted(load); onBeforeUnmount(() => { generation++; });
</script>
