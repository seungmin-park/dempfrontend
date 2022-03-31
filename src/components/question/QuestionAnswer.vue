<template>
  <div class="question-answer" v-for="answer in answers" :key="answer.id">
    <div class="question-answer-info">
      <div class="question-answer-info-user">
        🙋‍♂️ 작성자 : {{ answer.username }}
      </div>
      <div class="question-answer-info-content">
        <pre>{{ answer.content }}</pre>
      </div>
    </div>
    <div class="question-answer-reaction">
      <button>👍{{ answer.recomend }}</button>
      <button>👎{{ answer.dislike }}</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      answers: [],
    };
  },
  mounted() {
    this.getAnswer();
  },
  methods: {
    getAnswer() {
      axios.get(`/api/answer/${this.$route.params.questionId}`).then((res) => {
        this.answers = res.data;
      });
    },
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
