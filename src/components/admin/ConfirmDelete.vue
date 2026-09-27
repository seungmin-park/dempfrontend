<template>
  <dialog ref="dialog" class="confirm-dialog" aria-labelledby="delete-heading" @cancel.prevent="!busy && $emit('cancel')">
    <h2 id="delete-heading">삭제하시겠어요?</h2><p><strong>{{ title }}</strong></p><p>{{ description }} 삭제한 내용은 되돌릴 수 없습니다.</p>
    <div class="form-actions"><button class="button button-secondary" data-test="cancel-delete" :disabled="busy" @click="$emit('cancel')">취소</button><button class="button button-danger" data-test="confirm-delete" :disabled="busy" @click="$emit('confirm')">{{ busy ? '삭제 중…' : '삭제하기' }}</button></div>
  </dialog>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
defineProps<{ title: string; description: string; busy: boolean }>();
defineEmits<{ cancel: []; confirm: [] }>();
const dialog = ref<HTMLDialogElement>();
onMounted(() => { if (dialog.value?.showModal) dialog.value.showModal(); else dialog.value?.setAttribute('open',''); });
onBeforeUnmount(() => { dialog.value?.close?.(); });
</script>
