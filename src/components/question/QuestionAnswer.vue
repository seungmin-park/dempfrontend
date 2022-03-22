<template>
  <div class="question-answer">
    <div class="question-answer-info">
      <div class="question-answer-info-user">
        🙋‍♂️ 작성자 : {{ user[userId].username }}
      </div>
      <div class="question-answer-info-content">
        <pre>{{ answer[questionId].content }}</pre>
      </div>
    </div>
    <div class="question-answer-reaction">
      <button>👍{{ answer[questionId].recomend }}</button>
      <button>👎{{ answer[questionId].dislike }}</button>
    </div>
  </div>
</template>

<script>
import answer from "../../data/answer";
import user from "../../data/user";
export default {
  data() {
    return {
      user: user,
      answer: answer,
      questionId: this.$route.params.questionId,
      userId: this.$route.params.questionId,
    };
  },
};
</script>

<style>
.question-answer {
  display: flex;
  align-items: center;
}

.question-answer-info {
  width: 80%;
}

.question-answer-info-user {
  padding: 20px 0px 20px 0px;
}
</style>
