<template>
  <section class="question-results" aria-label="질문 목록" :aria-busy="loading">
    <AsyncState :loading="loading" :error="error || ''" @retry="loadQuestionPage(requestedPage)" />
    <p v-if="!loading && !error && !questions.length" class="state-panel" role="status">조건에 맞는 질문이 없습니다.</p>
    <template v-if="!loading && !error">
    <article class="question-list" v-for="question in questions" :key="question.id"><button class="question-list-title" @click="openQuestionDetail(question.id)">{{ question.title }}</button><div class="question-list-count"><span class="meta-count" :aria-label="`조회수 ${question.hits}`"><AppIcon name="eye" :size="17" />{{ question.hits }}</span><span class="meta-count" :aria-label="`추천 ${question.recommend}`"><AppIcon name="thumbsUp" :size="17" />{{ question.recommend }}</span></div></article>
    <div v-if="questions.length" class="question-pages"><button class="button button-secondary" data-test="previous-page" :disabled="page === 0 || loading" @click="loadQuestionPage(page - 1)">이전</button><span>{{ page + 1 }} 페이지</span><button class="button button-secondary" data-test="next-page" :disabled="last || loading" @click="loadQuestionPage(page + 1)">다음</button></div>
    </template>
  </section>
</template>
<script lang="ts">
import type { QuestionSummary } from '@/types/api';
import type { LocationQuery, RouteLocationNormalizedLoaded } from 'vue-router';
import { queryText } from '@/router/query';
import { defineComponent } from "vue";
import AsyncState from '@/components/common/AsyncState.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { fetchQuestionPage } from "@/api/questions";
export default defineComponent({
  components: { AppIcon, AsyncState },
  data() {
    return {
      orderBy: "",
      title: "",
      content: "",
      hashtags: [] as string[],
      questions: [] as QuestionSummary[],
      page: 0,
      requestedPage: 0,
      last: true,
      loading: false,
      error: null as string | null,
      requestGeneration: 0,
    };
  },
  mounted() {
    this.applyRoute(this.$route.query);
    this.emitter.on("getByHashtags", this.onHashtagsChanged);
    this.loadQuestionPage(0);
  },
  unmounted() {
    this.requestGeneration++;
    this.emitter.off("getByHashtags", this.onHashtagsChanged);
  },
  methods: {
    onHashtagsChanged(hashtags: string[]) {
      this.hashtags = hashtags;
      this.requestGeneration++;
      this.loading = false;
      this.loadQuestionPage(0);
    },
    applyRoute(query: LocationQuery) {
      this.orderBy = queryText(query.orderBy);
      this.title = queryText(query.title);
      this.content = queryText(query.content);
      this.hashtags = Array.isArray(query.hashtags)
        ? query.hashtags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
        : String(query.hashtags || "").split(",").filter(Boolean);
    },
    async loadQuestionPage(page: number) {
      if (this.loading || page < 0) return;
      const generation = ++this.requestGeneration;
      this.requestedPage = page;
      this.loading = true;
      this.error = null;
      try {
        const result = await fetchQuestionPage({
          orderBy: this.orderBy,
          title: this.title,
          content: this.content,
          hashtags: this.hashtags,
          page,
          size: 20,
        });
        if (generation === this.requestGeneration) {
          this.questions = result.content;
          this.page = result.number;
          this.last = result.last;
        }
      } catch {
        if (generation === this.requestGeneration) this.error = "질문을 불러오지 못했습니다.";
      } finally {
        if (generation === this.requestGeneration) this.loading = false;
      }
    },
    openQuestionDetail(questionId: number) {
      if (this.$store.state.Login.token != "") {
        this.$router.push(`/questions/${questionId}`)
      }else {
        alert("로그인이 필요한 서비스 입니다.");
      }
    },
  },
  watch: {
    $route: {
      handler(newValue: RouteLocationNormalizedLoaded) {
        this.applyRoute(newValue.query);
        this.requestGeneration++;
        this.loading = false;
        this.loadQuestionPage(0);
      },
    },
  },
});
</script>
