<template>
  <section class="answer-section" aria-label="답변">
    <h2>답변 <span class="count-label">{{ answers.length }}</span></h2>
    <article class="question-answer" v-for="item in answers" :key="item.answerId">
      <MemberBadge :username="item.username" />
      <SafeHtml class="answer-content" :content="item.content ?? ''" />
      <ContentReactions class="question-answer-reaction" :recommend="item.recommend" :dislike="item.dislike" />
    </article>
    <p v-if="!answers.length" class="empty-answer">알고 있는 내용을 첫 답변으로 남겨주세요.</p>
    <div class="answer-composer">
      <h3>답변 작성</h3><MarkdownEditor id="answer" label="답변 본문" v-model="answer" :disabled="saving" />
      <p v-if="error" role="alert" class="form-error">{{ error }}</p>
      <div class="form-actions"><button class="button button-primary" type="submit" :disabled="saving" @click="submitAnswer">{{ saving ? '저장 중…' : '댓글 달기' }}</button></div>
    </div>
  </section>
</template>
<script lang="ts">
import type { Answer } from '@/types/api';
import { routeId } from '@/router/query';
import { defineComponent } from 'vue';
import { getAnswers, createAnswer } from '@/api/answers';
import SafeHtml from '@/components/common/SafeHtml.vue';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import MemberBadge from '@/components/common/MemberBadge.vue';
import ContentReactions from '@/components/common/ContentReactions.vue';
import { renderMarkdown } from '@/content/markdown';
export default defineComponent({
  components: { SafeHtml, MarkdownEditor, MemberBadge, ContentReactions },
  data() { return { answers: [] as Answer[], answer: '', saving: false, error: '' }; },
  mounted() { this.loadAnswers(); },
  methods: {
    loadAnswers() { getAnswers(routeId(this.$route.params.questionId)).then(res => { this.answers = res.data; }); },
    async submitAnswer() {
      if (this.saving) return;
      this.saving = true;
      this.error = '';
      try {
        const res = await createAnswer({ username: this.$store.state.Login.username, questionId: routeId(this.$route.params.questionId), answerContent: renderMarkdown(this.answer) });
        this.answers = res.data;
        this.answer = '';
      } catch { this.error = '답변을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'; }
      finally { this.saving = false; }
    },
  },
});
</script>
