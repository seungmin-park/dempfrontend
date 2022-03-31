<template>
  <div class="qusetion-detail-title">
    <span>Q. {{ question.title }}</span>
    <div class="qusetion-detail-info">
      <div class="qusetion-detail-info-additional">
        <span class="qusetion-detail-info-additional-user">
          🙋‍♂️{{ question.username }}
        </span>
        <span class="qusetion-detail-info-additional-hits">
          👁 : {{ question.hits }}
        </span>
      </div>
      <div class="qusetion-detail-info-reaction">
        <button @click="recomendUp">👍{{ question.recomend }}</button>
        <button @click="dislikedUp">👎{{ question.dislike }}</button>
      </div>
    </div>
  </div>
  <div class="qusetion-detail-content">
    <span>{{ question.content }}</span>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      question: {
        id: 0,
        title: "",
        content: "",
        hits: 0,
        recomend: 0,
        dislike: 0,
        username: "",
      },
    };
  },
  mounted() {
    this.getQuestion();
  },
  methods: {
    recomendUp() {
      this.question.recomend++;
    },
    dislikedUp() {
      this.question.dislike++;
    },
    getQuestion() {
      axios
        .get(`/api/question/${this.$route.params.questionId}`)
        .then((res) => {
          this.question = res.data;
        });
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
