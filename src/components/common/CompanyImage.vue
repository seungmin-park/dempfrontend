<template>
  <img class="company-image" v-if="src && !failed" :src="src" alt="" loading="lazy" @error="failed = true" />
  <span v-else class="job-image-fallback" aria-hidden="true">DEMP</span>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
const props = defineProps<{ src?: string | null }>();
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
</script>

<style scoped>
.company-image { display: block; width: 100%; height: 100%; box-sizing: border-box; object-fit: contain; object-position: center; padding: 6px; background: white; }
</style>
