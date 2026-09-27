<template>
  <article class="question-detail">
    <header class="article-heading"><span class="section-label">면접 질문</span><h1>{{ question.title }}</h1><div class="article-meta"><MemberBadge :username="question.username" /><span class="meta-count" :aria-label="`조회수 ${question.hits}`"><AppIcon name="eye" :size="17" />{{ question.hits }}</span></div></header>
    <SafeHtml class="article-content" :content="question.content ?? ''" />
    <div class="tag-list"><router-link v-for="tag in question.hashtags" :key="tag" class="tag" :to="{ name: 'question', query: { hashtags: tag } }">#{{ tag }}</router-link></div>
    <ContentReactions :recommend="question.recommend" :dislike="question.dislike" />
  </article>
</template>
<script lang="ts">
import type { QuestionDetail } from '@/types/api';
import { routeId } from '@/router/query';
import { defineComponent } from "vue";
import { getQuestionDetail } from '@/api/questions';
import MemberBadge from '@/components/common/MemberBadge.vue';
import ContentReactions from '@/components/common/ContentReactions.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import SafeHtml from "@/components/common/SafeHtml.vue";
export default defineComponent({
  components: { SafeHtml, MemberBadge, ContentReactions, AppIcon },
  data(): { question: QuestionDetail } {
    return {
      question: {
        id: 0,
        title: "",
        content: "",
        hits: 0,
        recommend: 0,
        dislike: 0,
        username: "",
        hashtags: [] as string[],
      },
    };
  },
  created(){
    if (this.$store.state.Login.token == "") {
      this.$router.replace({
        path: "/login",
        query: { redirect: this.$router.currentRoute.value.fullPath },
      });
    }},
  mounted() {
    this.loadQuestionDetail();
  },
  methods: {
    loadQuestionDetail() {
      getQuestionDetail(routeId(this.$route.params.questionId))
        .then((res) => {
          this.question = res.data;
        });
    },
  },
});
</script>
