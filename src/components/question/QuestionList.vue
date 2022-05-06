<template>
  <main>
    <div class="question-list" v-for="question in questions" :key="question.id">
      <div class="question-list-count">
        <p class="question-list-count-hits">조회 수 : {{ question.hits }}</p>
        <p class="question-list-count-recomend">
          추천 수 : {{ question.recomend }}
        </p>
      </div>
      <span
        class="question-list-title"
        @click="$router.push(`/questions/${question.id}`)"
      >
        Q. {{ question.title }}
      </span>
    </div>
  </main>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      orderBy: this.$route.query.orderBy,
      hashtags: [],
      questions: [],
    };
  },
  mounted() {
    this.emitter.on("getByHashtags", (e) => {
      this.hashtags = e;
      this.getQuestions();
    });
    this.getQuestions();
  },
  methods: {
    getQuestions() {
      axios
        .get("/api/question", {
          params: { orderBy: this.orderBy, hashtags: this.hashtags.join(",") },
        })
        .then((res) => {
          this.questions = res.data;
        });
    },
  },
  watch: {
    orderBy: function () {
      this.getQuestions();
    },
  },
};
</script>

<style>
main {
  padding: 0px 25px 0px 25px;
}

.question-list {
  display: flex;
  border: 2px solid #a9cbdd;
  border-left: none;
  border-right: none;
  border-bottom: none;
  align-items: center;
  padding: 15px 0px 15px 0px;
}

.question-list-count p {
  margin: 0;
  margin-right: 15px;
}
</style>
