<template><div class="page community-page"><header class="page-heading"><h1>함께 준비하는 면접</h1><p>경험을 나누고 생각을 더하며, 다음 면접을 준비하세요.</p></header><div class="community-toolbar"><questionMenu /><questionControl /></div><QuestionTagFilters /><questionSearch /><questionList /></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import QuestionList from "../../components/question/QuestionList.vue";
import QuestionSearch from "../../components/question/QuestionSearch.vue";
import QuestionMenu from "../../components/question/QuestionMenu.vue";
import QuestionControl from "../../components/question/QuestionControl.vue";
import QuestionTagFilters from '@/components/question/QuestionTagFilters.vue';
export default defineComponent({
  components: {
    QuestionTagFilters,
    QuestionList,
    QuestionSearch,
    QuestionMenu,
    QuestionControl,
  },
});
</script>
