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
        @click="getDetailQuestion(question.id)"
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
      orderBy: "",
      title: "",
      content: "",
      hashtags: [],
      questions: [],
    };
  },
  mounted() {
    if (this.$route.query.orderBy != null)
      this.orderBy = this.$route.query.orderBy;
    if (this.$route.query.hashtags != null)
      this.hashtags.push(this.$route.query.hashtags);
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
          params: {
            orderBy: this.orderBy,
            title: this.title,
            content: this.content,
            hashtags: this.hashtags.join(","),
          },
        })
        .then((res) => {
          this.questions = res.data;
        });
    },
    getDetailQuestion(questionId) {
      if (this.$store.state.Login.token != "") {
        this.$router.push(`/questions/${questionId}`)
      }else {
        alert("로그인이 필요한 서비스 입니다.");
      }
    },
  },
  watch: {
    $route: {
      handler(newValue) {
        this.orderBy = newValue.query.orderBy;
        this.title = newValue.query.title;
        this.content = newValue.query.content;
        this.hashtags = [newValue.query.hashtags];
        this.getQuestions();
      },
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
