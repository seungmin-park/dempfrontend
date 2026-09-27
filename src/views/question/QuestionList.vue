<template>
  <div class="questions">
    <div class="questions-menu">
      <questionMenu />
    </div>
    <div class="center">
      <questionSearch />
      <questionList />
    </div>
    <div>
      <questionControl />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import QuestionList from "../../components/question/QuestionList.vue";
import QuestionSearch from "../../components/question/QuestionSearch.vue";
import QuestionMenu from "../../components/question/QuestionMenu.vue";
import QuestionControl from "../../components/question/QuestionControl.vue";
export default defineComponent({
  components: {
    QuestionList,
    QuestionSearch,
    QuestionMenu,
    QuestionControl,
  },
});
</script>

<style>
.questions {
  display: flex;
}

.center {
  width: 80%;
}
</style>
