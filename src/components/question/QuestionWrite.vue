<template>
  <AsyncState :loading="loading" :error="loadError" @retry="loadQuestion" />
  <ValidationForm v-if="!loading && !loadError" as="form" @submit="submitQuestion" class="write-form">
    <div class="field"><label for="question-title">제목</label><Field id="question-title" name="question-title" v-model="questionForm.title" placeholder="궁금한 내용을 한 문장으로 적어주세요" rules="required" :disabled="saving" /><ErrorMessage class="field-error" name="question-title">제목을 입력해 주세요.</ErrorMessage></div>
    <div class="field"><label for="content">본문</label><MarkdownEditor id="content" v-model="questionForm.content" :disabled="saving" /></div>
    <div class="field"><label>태그</label><Hashtags :initial-tags="initialTags" placeholder="태그를 입력하세요" :disabled="saving" @addHashtags="addHashtags" /><p class="field-hint">관련 기술을 입력하고 Enter를 누르세요.</p></div>
    <p v-if="error" role="alert" class="form-error">{{ error }}</p>
    <div class="form-actions"><router-link class="button button-secondary" :to="editing ? `/questions/${questionId}` : '/question'">취소</router-link><button class="button button-primary" type="submit" :disabled="saving">{{ saving ? '저장 중…' : editing ? '변경 저장' : '작성하기' }}</button></div>
  </ValidationForm>
</template>
<script lang="ts">
import type { HashtagInput } from '@/types/api';
import { defineComponent } from 'vue';
import { defineRule } from 'vee-validate';
import { ValidationForm, Field, ErrorMessage } from '@/components/common/validationComponents';
import { required } from '@vee-validate/rules';
import Hashtags from '@/components/Hashtags.vue';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import AsyncState from '@/components/common/AsyncState.vue';
import { renderMarkdown, markdownFromHtml } from '@/content/markdown';
import { createQuestion, getQuestionDetail, updateQuestion } from '@/api/questions';
import { mutationErrorMessage, requestErrorMessage } from '@/presentation/requestError';
defineRule('required', required);
export default defineComponent({
  components: { ValidationForm, Field, ErrorMessage, Hashtags, MarkdownEditor, AsyncState },
  props: { questionId: { type: String, default: '' } },
  data() { return {
    questionForm: { title: '', content: '', username: this.$store.state.Login.username, hashtags: [] as HashtagInput[] },
    initialTags: [] as string[], loading: false, loadError: '', requestGeneration: 0, saving: false, error: '',
  }; },
  computed: { editing(): boolean { return Boolean(this.questionId); } },
  mounted() { this.loadQuestion(); },
  beforeUnmount() { this.requestGeneration++; },
  watch: { questionId: 'loadQuestion' },
  methods: {
    async loadQuestion() {
      const generation = ++this.requestGeneration;
      this.error = ''; this.loadError = ''; this.saving = false;
      this.initialTags = [];
      this.questionForm = { title: '', content: '', username: this.$store.state.Login.username, hashtags: [] };
      if (!this.editing) { this.loading = false; return; }
      this.loading = true;
      try {
        const result = (await getQuestionDetail(this.questionId)).data;
        if (generation !== this.requestGeneration) return;
        if (!this.$store.state.Login.token || result.username !== this.$store.state.Login.username) {
          this.loadError = '본인이 작성한 질문만 편집할 수 있습니다.'; return;
        }
        this.initialTags = [...result.hashtags];
        this.questionForm = { title: result.title || '', content: markdownFromHtml(result.content || ''), username: result.username, hashtags: result.hashtags.map(value => ({ value, select: false })) };
      } catch (reason) { if (generation === this.requestGeneration) this.loadError = requestErrorMessage(reason); }
      finally { if (generation === this.requestGeneration) this.loading = false; }
    },
    async submitQuestion() {
      if (this.saving || this.loading || this.loadError) return;
      const generation = this.requestGeneration, id = this.questionId;
      this.saving = true;
      this.error = '';
      try {
        const payload = { title: this.questionForm.title, content: renderMarkdown(this.questionForm.content), hashtags: this.questionForm.hashtags.map(tag => tag.value) };
        if (id) await updateQuestion({ ...payload, questionId: id });
        else await createQuestion({ ...payload, username: this.questionForm.username });
        if (generation === this.requestGeneration) await this.$router.push(id ? `/questions/${id}` : { path: '/question', query: { orderBy: 'createdDate' } });
      } catch (reason) { if (generation === this.requestGeneration) this.error = id ? mutationErrorMessage(reason) : '질문을 저장하지 못했습니다. 입력한 내용을 확인하고 다시 시도해 주세요.'; }
      finally { if (generation === this.requestGeneration) this.saving = false; }
    },
    addHashtags(tags: HashtagInput[]) { this.questionForm.hashtags = tags; },
  },
});
</script>
