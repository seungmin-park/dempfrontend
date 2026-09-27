<template><div class="page writing-page"><header class="page-heading"><router-link class="back-link" to="/question">면접 질문으로</router-link><h1>질문 작성</h1><p>궁금한 점을 나누고, 함께 답을 찾아보세요.</p></header><questionWrite /></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import QuestionWrite from "../../components/question/QuestionWrite.vue";

export default defineComponent({
  components: {
    QuestionWrite,
  },
});
</script>
