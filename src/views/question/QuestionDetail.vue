<template><div class="page article-page"><div class="back-row"><questionReturn /></div><questionDetail /><questionAnswer /></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import QuestionDetail from "../../components/question/QuestionDetail.vue";
import QuestionAnswer from "../../components/question/QuestionAnswer.vue";
import QuestionReturn from "../../components/question/QuestionReturn.vue";
export default defineComponent({
  components: {
    QuestionDetail,
    QuestionAnswer,
    QuestionReturn,
  },
});
</script>
