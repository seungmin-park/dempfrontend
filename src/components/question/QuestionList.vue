<template>
  <main>
    <div class="question-list" v-for="question in questions" :key="question.id">
      <div class="question-list-count">
        <p class="question-list-count-hits">조회 수 : {{ question.hits }}</p>
        <p class="question-list-count-recomend">
          추천 수 : {{ question.recomend }}
        </p>
      </div>
      <span class="question-list-title">Q. {{ question.title }}</span>
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
