<template>
  <AsyncState :loading="loading" :error="loadError" @retry="load" />
  <div v-if="item && !loading && !loadError">
    <div class="admin-section-heading"><div><h2>{{ kind === 'questions' ? '질문' : '답변' }} 내용·수정</h2><p>작성자 {{ item.username }} · #{{ item.id }}</p></div><router-link class="button button-secondary" :to="`/admin/${kind}`">목록</router-link></div>
    <details class="admin-original"><summary>현재 저장된 내용 보기</summary><SafeHtml :content="item.content || ''" /></details>
    <form class="write-form" @submit.prevent="save">
      <div class="field"><label for="admin-title">{{ kind === 'questions' ? '질문 제목' : '연결된 질문' }}</label><input id="admin-title" v-model="title" required :readonly="kind === 'answers'" :disabled="saving" /></div>
      <p v-if="item.hashtags.length" class="field-hint">태그: {{ item.hashtags.join(', ') }}</p>
      <div class="field"><MarkdownEditor id="admin-content" label="본문" v-model="content" :disabled="saving" /></div>
      <p v-if="error" role="alert" class="form-error">{{ error }}</p>
      <div class="form-actions"><router-link class="button button-secondary" :to="`/admin/${kind}`">취소</router-link><button class="button button-primary" :disabled="saving">{{ saving ? '저장 중…' : '변경 저장' }}</button></div>
    </form>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { fetchAdminPost, saveAdminPost, type AdminPost, type PostKind } from '@/api/admin';
import { markdownFromHtml, renderMarkdown } from '@/content/markdown';
import { requestErrorMessage, mutationErrorMessage } from '@/presentation/requestError';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import AsyncState from '@/components/common/AsyncState.vue';
import SafeHtml from '@/components/common/SafeHtml.vue';
export default defineComponent({
  components: { MarkdownEditor, AsyncState, SafeHtml },
  props: { kind: { type: String as PropType<PostKind>, required: true } },
  data: () => ({ item: null as AdminPost | null, title: '', content: '', loading: true, loadError: '', error: '', saving: false, generation: 0 }),
  mounted() { this.load(); }, beforeUnmount() { this.generation++; },
  watch: { '$route.params.id': 'load', kind: 'load' },
  methods: {
    async load() {
      const current = ++this.generation; this.loading = true; this.loadError = ''; this.error = ''; this.item = null;
      try {
        const item = await fetchAdminPost(this.kind, String(this.$route.params.id));
        if (current !== this.generation) return;
        this.item = item; this.title = item.title; this.content = markdownFromHtml(item.content || '');
      } catch (reason) { if (current === this.generation) this.loadError = requestErrorMessage(reason); }
      finally { if (current === this.generation) this.loading = false; }
    },
    async save() {
      if (this.saving || !this.item) return;
      if (!this.title.trim() || !this.content.trim()) { this.error = '제목과 본문을 입력해 주세요.'; return; }
      const current = this.generation;
      this.saving = true; this.error = '';
      try {
        await saveAdminPost(this.kind, this.item.id, this.title, renderMarkdown(this.content));
        if (current === this.generation) this.$router.push(`/admin/${this.kind}`);
      } catch (reason) { if (current === this.generation) this.error = mutationErrorMessage(reason); }
      finally { this.saving = false; }
    },
  },
});
</script>
