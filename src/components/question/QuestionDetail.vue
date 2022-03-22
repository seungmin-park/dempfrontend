<template>
  <div class="qusetion-detail-title">
    <span>Q. {{ questions[questionId].title }}</span>
    <div class="qusetion-detail-info">
      <div class="qusetion-detail-info-additional">
        <span class="qusetion-detail-info-additional-user">
          🙋‍♂️{{ user[0].username }}
        </span>
        <span class="qusetion-detail-info-additional-hits">
          👁 : {{ questions[questionId].hits }}
        </span>
      </div>
      <div class="qusetion-detail-info-reaction">
        <button @click="recomendUp">
          👍{{ questions[questionId].recomend }}
        </button>
        <button @click="dislikedUp">
          👎{{ questions[questionId].dislike }}
        </button>
      </div>
    </div>
  </div>
  <div class="qusetion-detail-content">
    <span>{{ questions[questionId].content }}</span>
  </div>
</template>

<script>
import questions from "../../data/questions";
import user from "../../data/user";
export default {
  data() {
    return {
      questionId: this.$route.params.questionId,
      questions: questions,
      user: user,
    };
  },
  methods: {
    recomendUp() {
      this.questions[this.questionId].recomend++;
    },
    dislikedUp() {
      this.questions[this.questionId].dislike++;
    },
  },
};
</script>

<style>
.qusetion-detail-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  padding-bottom: 25px;
}

.qusetion-detail-content {
  margin-top: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  height: 330px;
}
</style>
