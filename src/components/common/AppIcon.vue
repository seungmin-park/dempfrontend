<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" :data-icon="name">
    <path v-for="(path, index) in paths[name]" :key="index" :d="path" />
  </svg>
</template>
<script setup lang="ts">
const paths = {
  search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm16 16 5 5'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z', 'M4 21v-2a8 8 0 0 1 16 0v2'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
  thumbsUp: ['M7 10v11H3V10h4Z', 'M7 10l5-8c3 0 3 3 1 7h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7'],
  thumbsDown: ['M7 14V3H3v11h4Z', 'M7 14l5 8c3 0 3-3 1-7h6a2 2 0 0 0 2-2l-2-8a2 2 0 0 0-2-2H7'],
  chevron: ['m6 9 6 6 6-6'],
  arrowLeft: ['M20 12H4', 'm10 6-6 6 6 6'],
  arrowRight: ['M4 12h16', 'm14 6 6 6-6 6'],
  external: ['M14 3h7v7', 'm11 13 10-10', 'M10 4H4v16h16v-6'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  check: ['m4 12 5 5L20 6'],
  filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'],
  refresh: ['M20 9a8 8 0 1 0 0 7', 'M20 3v6h-6'],
  briefcase: ['M8 6V3h8v3', 'M3 7h18v14H3V7Z', 'M3 12c5 4 13 4 18 0', 'M10 13h4v3h-4Z'],
  book: ['M12 5C8 2 5 2 2 3v16c3-1 6-1 10 2 4-3 7-3 10-2V3c-3-1-6-1-10 2v16'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7v5l3 2'],
  logout: ['M10 4H4v16h6', 'M10 12h11', 'm17 8 4 4-4 4'],
  message: ['M3 4h18v13H9l-6 4V4Z', 'M7 8h10', 'M7 12h7'],
  code: ['m8 5-6 7 6 7', 'm16 5 6 7-6 7', 'm14 3-4 18'],
  link: ['m10 14 4-4', 'M8 15l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0', 'm16 9 2-2a3 3 0 0 0-4-4l-5 5a3 3 0 0 0 0 4'],
  list: ['M9 6h12', 'M9 12h12', 'M9 18h12', 'M3 6h1', 'M3 12h1', 'M3 18h1'],
  quote: ['M10 5H3v8h7V5Z', 'M10 13c0 4-2 6-5 6', 'M21 5h-7v8h7V5Z', 'M21 13c0 4-2 6-5 6'],
  bold: ['M6 4h7a4 4 0 0 1 0 8H6V4Z', 'M6 12h8a4 4 0 0 1 0 8H6v-8Z'],
  italic: ['M10 4h9', 'M5 20h9', 'M15 4 9 20'],
  heading: ['M4 4v16', 'M16 4v16', 'M4 12h12', 'M20 15v5'],
  split: ['M3 4h18v16H3V4Z', 'M12 4v16'],
  edit: ['M4 20h5L21 8l-5-5L4 15v5Z', 'm13 6 5 5'],
  shield: ['M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Z', 'm8 12 3 3 5-6'],
} as const;
withDefaults(defineProps<{ name: keyof typeof paths; size?: number }>(), { size: 20 });
</script>
