<template>
  <div v-html="sanitizedContent"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DOMPurify from 'dompurify';

const htmlPolicy = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a'],
  ALLOWED_ATTR: ['href'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

export default defineComponent({
  name: 'SafeHtml',
  props: { content: { type: String, default: '' } },
  computed: {
    sanitizedContent() {
      return DOMPurify.sanitize(this.content || '', htmlPolicy);
    },
  },
});
</script>
