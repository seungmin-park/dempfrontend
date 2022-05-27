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

<script>
import QuestionDetail from "../../components/question/QuestionDetail";
import QuestionAnswer from "../../components/question/QuestionAnswer";
import QuestionReturn from "../../components/question/QuestionReturn";
export default {
  components: {
    QuestionDetail,
    QuestionAnswer,
    QuestionReturn,
  },
};
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
