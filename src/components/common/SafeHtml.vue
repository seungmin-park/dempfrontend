<template>
  <div class="safe-html" v-html="sanitizedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { sanitizeHtml } from '@/content/sanitizeHtml';
const props = withDefaults(defineProps<{ content?: string }>(), { content: '' });
const sanitizedContent = computed(() => sanitizeHtml(props.content));
</script>
