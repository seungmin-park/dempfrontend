<template>
  <main>
    <div class="question-list" v-for="question in questions" :key="question.id">
      <div class="question-list-count">
        <p class="question-list-count-hits">조회 수 : {{ question.hits }}</p>
        <p class="question-list-count-recommend">
          추천 수 : {{ question.recommend }}
        </p>
      </div>
      <span
        class="question-list-title"
        @click="openQuestionDetail(question.id)"
      >
        Q. {{ question.title }}
      </span>
    </div>
    <div class="question-pages">
      <button data-test="previous-page" :disabled="page === 0 || loading" @click="loadQuestionPage(page - 1)">이전</button>
      <span>{{ page + 1 }} 페이지</span>
      <button data-test="next-page" :disabled="last || loading" @click="loadQuestionPage(page + 1)">다음</button>
    </div>
    <p v-if="error" role="alert">{{ error }} <button data-test="retry" @click="loadQuestionPage(page)">재시도</button></p>
  </main>
</template>

<script lang="ts">
import type { QuestionSummary } from '@/types/api';
import type { LocationQuery, RouteLocationNormalizedLoaded } from 'vue-router';
import { queryText } from '@/router/query';
import { defineComponent } from "vue";
import { fetchQuestionPage } from "@/api/questions";
export default defineComponent({
  data() {
    return {
      orderBy: "",
      title: "",
      content: "",
      hashtags: [] as string[],
      questions: [] as QuestionSummary[],
      page: 0,
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

<style>
main {
  padding: 0px 25px 0px 25px;
}

.question-list {
  display: flex;
  border: 2px solid #a9cbdd;
  border-left: none;
  border-right: none;
  border-bottom: none;
  align-items: center;
  padding: 15px 0px 15px 0px;
}

.question-list-count p {
  margin: 0;
  margin-right: 15px;
}
</style>
