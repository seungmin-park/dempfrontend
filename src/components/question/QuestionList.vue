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
import questions from "../../data/questions";
export default {
  data() {
    return {
      questions: questions,
    };
  },
  methods: {
    testMethod(value) {
      console.log(value);
    },
    mounted() {
      this.emitter.on("date", this.testMethod);
    },
    // eventBus.$on("data", (data) => {
    //   console.log(data);
    // });
    // eventBus.$on("hits", (data) => {
    //   console.log(data);
    // });
    // eventBus.$on("recomend", (data) => {
    //   console.log(data);
    // });
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
