<template><div class="page writing-page"><header class="page-heading"><router-link class="back-link" :to="questionId ? `/questions/${questionId}` : '/question'">{{ questionId ? '질문으로 돌아가기' : '면접 질문으로' }}</router-link><h1>{{ questionId ? '질문 편집' : '질문 작성' }}</h1><p>{{ questionId ? '제목과 본문, 태그를 수정하세요.' : '궁금한 점을 나누고, 함께 답을 찾아보세요.' }}</p></header><questionWrite :question-id="questionId" /></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import QuestionWrite from "../../components/question/QuestionWrite.vue";
import { routeId } from '@/router/query';

export default defineComponent({
  computed: { questionId(): string { return routeId(this.$route.params.questionId); } },
  components: {
    QuestionWrite,
  },
});
</script>
