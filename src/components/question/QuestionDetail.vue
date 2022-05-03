<template>
  <div class="qusetion-detail">
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
      <span v-html="question.content"></span>
      <div>
        <span
          class="hashtags"
          v-for="hastag in question.hashtags"
          :key="hastag"
          v-text="`#${hastag}`"
        ></span>
      </div>
    </div>
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
.qusetion-detail {
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

.qusetion-detail-title {
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  justify-content: space-between;
  padding-top: 10px;
  padding-bottom: 25px;
}

.qusetion-detail-content {
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 25px;
  padding-bottom: 25px;
  height: 330px;
}

.hashtags {
  margin-left: 10px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 15px;
  padding: 5px 10px 5px 10px;
}
</style>
