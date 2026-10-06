<template><div class="page article-page"><div class="back-row"><questionReturn /></div><questionDetail @ready="detailReady = $event" /><questionAnswer v-if="detailReady" :question-id="questionId" :username="username" /></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import { routeId } from '@/router/query';
import QuestionDetail from "../../components/question/QuestionDetail.vue";
import QuestionAnswer from "../../components/question/QuestionAnswer.vue";
import QuestionReturn from "../../components/question/QuestionReturn.vue";
export default defineComponent({
  data() { return { detailReady: false }; },
  computed: {
    questionId() { return routeId(this.$route.params.questionId); },
    username() { return this.$store.state.Login.username; },
  },
  components: {
    QuestionDetail,
    QuestionAnswer,
    QuestionReturn,
  },
});
</script>
