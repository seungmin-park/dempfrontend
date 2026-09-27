<template>
  <section class="page admin-page">
    <div class="page-heading"><span class="eyebrow">DEMP ADMIN</span><h1>운영 관리</h1><p>공고와 커뮤니티 콘텐츠를 한곳에서 관리하세요.</p></div>
    <AsyncState :loading="loading" :error="error" @retry="verifyAccess" />
    <template v-if="identity">
      <nav class="admin-nav" aria-label="관리자 메뉴"><router-link to="/admin" exact-active-class="is-active">운영 현황</router-link><router-link to="/admin/announcements">공고·부트캠프</router-link><router-link to="/admin/announcement-reports">오류 제보</router-link><router-link to="/admin/questions">질문</router-link><router-link to="/admin/answers">답변</router-link></nav>
      <router-view />
    </template>
  </section>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { fetchAdminIdentity } from '@/api/admin';
import type { Member } from '@/types/api';
import AsyncState from '@/components/common/AsyncState.vue';
import { requestErrorMessage } from '@/presentation/requestError';
const loading = ref(true), error = ref(''), identity = ref<Member | null>(null);
let generation = 0;
async function verifyAccess() {
  const current = ++generation;
  loading.value = true; error.value = ''; identity.value = null;
  try {
    const admin = await fetchAdminIdentity();
    if (current === generation) identity.value = admin;
  } catch (reason) {
    if (current === generation) error.value = requestErrorMessage(reason).includes('권한') ? '관리자 권한이 필요합니다.' : requestErrorMessage(reason);
  } finally { if (current === generation) loading.value = false; }
}
onMounted(verifyAccess);
onBeforeUnmount(() => { generation++; });
</script>
