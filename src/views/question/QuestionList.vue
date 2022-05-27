<template>
  <div class="questions">
    <div class="questions-menu">
      <questionMenu />
    </div>
    <div class="center">
      <questionSearch />
      <questionList />
    </div>
    <div>
      <questionControl />
    </div>
  </div>
</template>

<script>
import QuestionList from "../../components/question/QuestionList";
import QuestionSearch from "../../components/question/QuestionSearch";
import QuestionMenu from "../../components/question/QuestionMenu";
import QuestionControl from "../../components/question/QuestionControl";
export default {
  components: {
    QuestionList,
    QuestionSearch,
    QuestionMenu,
    QuestionControl,
  },
};
</script>

<style>
.questions {
  display: flex;
}

.center {
  width: 80%;
}
</style>
