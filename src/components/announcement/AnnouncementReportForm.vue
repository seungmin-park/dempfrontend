<template>
  <details class="announcement-report">
    <summary>공고 정보가 잘못되었나요?<span class="report-toggle" aria-hidden="true">제보하기</span></summary>
    <form class="feedback-form" data-test="report-form" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="announcement-report">공고 오류 내용</label>
        <p id="announcement-report-hint" class="feedback-hint">잘못된 링크·모집 마감·변경된 조건을 알려주세요. 개인정보는 작성하지 마세요.</p>
        <textarea ref="input" id="announcement-report" aria-label="공고 오류 내용" v-model="message" required maxlength="1000" :disabled="busy"
          :aria-invalid="invalid" :aria-describedby="`announcement-report-hint${error ? ' announcement-report-error' : ''}`"
          placeholder="예: 지원 링크가 열리지 않아요." @input="clearFeedback" />
        <div class="feedback-input-footer"><p v-if="error" id="announcement-report-error" class="feedback-error" role="alert">{{ error }}</p><span data-test="report-length" class="feedback-length">{{ message.length.toLocaleString() }} / 1,000</span></div>
      </div>
      <div class="feedback-actions"><p v-if="notice" class="feedback-notice" role="status">{{ notice }}</p><button type="submit" class="button button-secondary" :disabled="busy">{{ busy ? '접수 중…' : '오류 제보' }}</button></div>
    </form>
  </details>
</template>
<script setup lang="ts">
import { nextTick, ref } from 'vue';
import type { EntityId } from '@/types/api';
import { submitAnnouncementReport } from '@/api/announcementReports';
import { mutationErrorMessage } from '@/presentation/requestError';
const props = defineProps<{ id: EntityId }>();
const message = ref(''), error = ref(''), notice = ref(''), busy = ref(false);
const input = ref<HTMLTextAreaElement>(), invalid = ref(false);
function clearFeedback() { error.value = ''; notice.value = ''; invalid.value = false; }
async function submit() {
  if (busy.value) return;
  clearFeedback();
  if (!message.value.trim() || message.value.length > 1000) {
    error.value = !message.value.trim() ? '오류 내용을 입력해 주세요.' : '오류 내용은 1,000자 이내로 작성해 주세요.';
    invalid.value = true; await nextTick(); input.value?.focus(); return;
  }
  busy.value = true;
  try { await submitAnnouncementReport(props.id, message.value.trim()); message.value = ''; notice.value = '제보가 접수되었습니다. 운영자가 원문을 확인하겠습니다.'; }
  catch (reason) { error.value = mutationErrorMessage(reason); }
  finally { busy.value = false; }
}
</script>
