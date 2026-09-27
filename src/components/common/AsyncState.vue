<template>
  <div v-if="loading" class="state-panel" role="status" aria-live="polite"><AppIcon name="clock" :size="28" /><p>불러오는 중…</p></div>
  <div v-else-if="error" class="state-panel" role="alert"><AppIcon name="refresh" :size="28" /><h2>{{ error }}</h2><p>다시 시도하거나 목록으로 돌아가 주세요.</p><button class="button button-secondary" data-test="retry" @click="$emit('retry')">재시도</button></div>
</template>
<script setup lang="ts">
import AppIcon from './AppIcon.vue';
defineProps<{ loading: boolean; error: string }>();
defineEmits<{ retry: [] }>();
</script>
