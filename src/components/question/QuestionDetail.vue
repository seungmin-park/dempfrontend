<template>
  <AsyncState :loading="loading" :error="error" @retry="loadQuestionDetail" />
  <article v-if="!loading && !error" class="question-detail">
    <header class="article-heading"><span class="section-label">면접 질문</span><h1>{{ question.title }}</h1><div class="article-meta"><MemberBadge :username="question.username" /><span class="meta-count" :aria-label="`조회수 ${question.hits}`"><AppIcon name="eye" :size="17" />{{ question.hits }}</span></div></header>
    <SafeHtml class="article-content" :content="question.content ?? ''" />
    <div class="tag-list"><router-link v-for="tag in question.hashtags" :key="tag" class="tag" :to="{ name: 'question', query: { hashtags: tag } }">#{{ tag }}</router-link></div>
    <ContentReactions :recommend="question.recommend" :dislike="question.dislike" />
  </article>
</template>
<script lang="ts">
import type { QuestionDetail } from '@/types/api';
import { routeId } from '@/router/query';
import AsyncState from '@/components/common/AsyncState.vue';
import { requestErrorMessage } from '@/presentation/requestError';
import { defineComponent } from "vue";
import { getQuestionDetail } from '@/api/questions';
import MemberBadge from '@/components/common/MemberBadge.vue';
import ContentReactions from '@/components/common/ContentReactions.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import SafeHtml from "@/components/common/SafeHtml.vue";
export default defineComponent({
  components: { AsyncState, SafeHtml, MemberBadge, ContentReactions, AppIcon },
  emits: { ready: (_ready: boolean) => true },
  data() {
    return {
      loading: true, error: '', requestGeneration: 0,
      question: {
        id: 0,
        title: "",
        content: "",
        hits: 0,
        recommend: 0,
        dislike: 0,
        username: "",
        hashtags: [] as string[],
      } as QuestionDetail,
    };
  },
  created(){
    if (this.$store.state.Login.token == "") {
      this.$router.replace({
        path: "/login",
        query: { redirect: this.$router.currentRoute.value.fullPath },
      });
    }},
  unmounted() { this.requestGeneration++; },
  mounted() {
    this.loadQuestionDetail();
  },
  methods: {
    async loadQuestionDetail() {
      const generation = ++this.requestGeneration;
      this.loading = true;
      this.$emit('ready', false);
      this.error = '';
      try {
        const result = await getQuestionDetail(routeId(this.$route.params.questionId));
        if (generation === this.requestGeneration) { this.question = result.data; this.$emit('ready', true); }
      } catch (error) { if (generation === this.requestGeneration) this.error = requestErrorMessage(error); }
      finally { if (generation === this.requestGeneration) this.loading = false; }
    },
  },
  watch: { '$route.params.questionId'() { this.loadQuestionDetail(); } },
});
</script>
