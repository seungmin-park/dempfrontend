<template>
  <details class="state-panel announcement-report"><summary>공고 정보가 잘못되었나요?</summary><form data-test="report-form" @submit.prevent="submit"><div class="field"><label for="announcement-report">공고 오류 내용</label><textarea id="announcement-report" aria-label="공고 오류 내용" v-model="message" required maxlength="1000" :disabled="busy" placeholder="잘못된 링크·모집 마감·변경된 조건 등을 알려주세요. 개인정보는 작성하지 마세요." /></div><p v-if="error" role="alert">{{ error }}</p><p v-if="notice" role="status">{{ notice }}</p><button class="button button-secondary" :disabled="busy">{{ busy ? '접수 중…' : '오류 제보' }}</button></form></details>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import type { EntityId } from '@/types/api';
import { submitAnnouncementReport } from '@/api/announcementReports';
import { requestErrorMessage } from '@/presentation/requestError';
const props = defineProps<{ id: EntityId }>();
const message = ref(''), error = ref(''), notice = ref(''), busy = ref(false);
async function submit() {
  if (busy.value) return; error.value = ''; notice.value = '';
  if (!message.value.trim()) { error.value = '오류 내용을 입력해 주세요.'; return; }
  busy.value = true;
  try { await submitAnnouncementReport(props.id, message.value.trim()); message.value = ''; notice.value = '제보가 접수되었습니다. 운영자가 원문을 확인하겠습니다.'; }
  catch (reason) { error.value = requestErrorMessage(reason); }
  finally { busy.value = false; }
}
</script>
