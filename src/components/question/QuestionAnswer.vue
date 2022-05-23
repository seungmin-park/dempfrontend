<template>
  <div class="question-answer" v-for="answer in answers" :key="answer.id">
    <div class="question-answer-info">
      <div class="question-answer-info-user">
        🙋‍♂️ 작성자 : {{ answer.username }}
      </div>
      <div class="question-answer-info-content">
        <span v-html="answer.content"></span>
      </div>
    </div>
    <div class="question-answer-reaction">
      <button>👍{{ answer.recomend }}</button>
      <button>👎{{ answer.dislike }}</button>
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
    <button type="submit" @click="saveAnswer">댓글 달기</button>
  </div>
</template>

<script>
import axios from "axios";
export default {
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
    this.getAnswer();
    this.initSummernote();
  },
  methods: {
    getAnswer() {
      axios.get(`/api/answer/${this.$route.params.questionId}`,{
        headers:{
          'X-AUTH-TOKEN': this.$store.state.token
        },
      }).then((res) => {
        this.answers = res.data;
      });
    },
    saveAnswer() {
      // eslint-disable-next-line
      this.answerForm.answerContent = $("#answer").summernote("code");
      this.answerForm.questionId = this.$route.params.questionId;
      this.answerForm.username = this.$store.state.username;
      axios.post(`/api/answer/save`, this.answerForm,{
        headers:{
          "X-AUTH-TOKEN": this.$store.state.token,
        },
      }).then((res) => {
        this.answers = res.data;
      });
    },
    initSummernote() {
      // eslint-disable-next-line
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
