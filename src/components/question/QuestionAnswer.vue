<template>
  <div class="question-answer" v-for="answer in answers" :key="answer.id">
    <div class="question-answer-info">
      <div class="question-answer-info-user">
        🙋‍♂️ 작성자 : {{ answer.username }}
      </div>
      <div class="question-answer-info-content">
        <SafeHtml :content="answer.content" />
      </div>
    </div>
    <div class="question-answer-reaction">
      <button disabled>👍{{ answer.recommend }}</button>
      <button disabled>👎{{ answer.dislike }}</button>
      <span>반응 저장 기능 준비 중</span>
    </div>
  </div>
  <div>
    <textarea
      v-model="answer"
      id="answer"
      name="answer"
      as="textarea"
      wrap="hard"
    ></textarea>
    <button type="submit" @click="submitAnswer">댓글 달기</button>
  </div>
</template>

<script>
import { getAnswers, createAnswer } from '@/api/answers';
import SafeHtml from "@/components/common/SafeHtml.vue";
export default {
  components: { SafeHtml },
  data() {
    return {
      answers: [],
      answer: "",
      answerForm: {
        username: "",
        questionId: 0,
        answerContent: "",
      },
    };
  },
  mounted() {
    this.loadAnswers();
    this.initSummernote();
  },
  methods: {
    loadAnswers() {
      getAnswers(this.$route.params.questionId).then((res) => {
        this.answers = res.data;
      });
    },
    submitAnswer() {
      this.answerForm.answerContent = $("#answer").summernote("code");
      this.answerForm.questionId = this.$route.params.questionId;
      this.answerForm.username = this.$store.state.Login.username;
      createAnswer(this.answerForm).then((res) => {
        this.answers = res.data;
      });
    },
    initSummernote() {
      $("#answer").summernote({
        height: 250,
        width: 1250,
        minHeight: null,
        maxHeight: null,
        focus: true,
        toolbar: [
          ["style", ["bold", "italic", "underline", "clear"]],
          ["font", ["strikethrough", "superscript", "subscript", "forecolor"]],
          ["fontsize", ["fontsize"]],
          ["color", ["color"]],
          ["para", ["ul", "ol", "paragraph"]],
          ["height", ["height"]],
        ],
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
