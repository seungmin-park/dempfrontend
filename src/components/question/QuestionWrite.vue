<template>
  <ValidationForm as="form" @submit="submitQuestion" class="write-form">
    <div class="field"><label for="question-title">제목</label><Field id="question-title" name="question-title" v-model="questionForm.title" placeholder="궁금한 내용을 한 문장으로 적어주세요" rules="required" :disabled="saving" /><ErrorMessage class="field-error" name="question-title">제목을 입력해 주세요.</ErrorMessage></div>
    <div class="field"><label for="content">본문</label><MarkdownEditor id="content" v-model="questionForm.content" :disabled="saving" /></div>
    <div class="field"><label>태그</label><Hashtags placeholder="#태그를 입력하세요" @addHashtags="addHashtags" /><p class="field-hint">관련 기술을 입력하고 Enter를 누르세요.</p></div>
    <p v-if="error" role="alert" class="form-error">{{ error }}</p>
    <div class="form-actions"><router-link class="button button-secondary" to="/question">취소</router-link><button class="button button-primary" type="submit" :disabled="saving">{{ saving ? '저장 중…' : '작성하기' }}</button></div>
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
import { renderMarkdown } from '@/content/markdown';
import { createQuestion } from '@/api/questions';
defineRule('required', required);
export default defineComponent({
  components: { ValidationForm, Field, ErrorMessage, Hashtags, MarkdownEditor },
  data() { return {
    questionForm: { title: '', content: '', username: this.$store.state.Login.username, hashtags: [] as HashtagInput[] },
    saving: false, error: '',
  }; },
  methods: {
    async submitQuestion() {
      if (this.saving) return;
      this.saving = true;
      this.error = '';
      try {
        await createQuestion({ ...this.questionForm, content: renderMarkdown(this.questionForm.content), hashtags: this.questionForm.hashtags.map(tag => tag.value) });
        await this.$router.push({ path: '/question', query: { orderBy: 'createdDate' } });
      } catch { this.error = '질문을 저장하지 못했습니다. 입력한 내용을 확인하고 다시 시도해 주세요.'; }
      finally { this.saving = false; }
    },
    addHashtags(tags: HashtagInput[]) { this.questionForm.hashtags = tags; },
  },
});
</script>
