<template>
  <div class="questions-detail">
    <div class="questions-detail-return">
      <questionReturn />
    </div>
    <div class="center">
      <questionDetail />
      <questionAnswer />
    </div>
  </div>
</template>

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

<style>
.questions-detail {
  display: flex;
  height: 100vh;
}

.questions-detail-return {
  padding: 40px 30px 0 30px;
}
.center {
  width: 80vw;
}
</style>
