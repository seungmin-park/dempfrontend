<template>
  <img v-if="src && !failed" :src="src" alt="" loading="lazy" @error="failed = true" />
  <span v-else class="job-image-fallback" aria-hidden="true">DEMP</span>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
const props = defineProps<{ src?: string | null }>();
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
</script>
