<template>
  <div class="safe-html" v-html="sanitizedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { sanitizeHtml, sanitizeAnnouncementHtml } from '@/content/sanitizeHtml';
const props = withDefaults(defineProps<{ content?: string; images?: boolean }>(), { content: '' });
const sanitizedContent = computed(() => props.images ? sanitizeAnnouncementHtml(props.content) : sanitizeHtml(props.content));
</script>
