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
          <button disabled>👍{{ question.recommend }}</button>
          <button disabled>👎{{ question.dislike }}</button>
          <span>반응 저장 기능 준비 중</span>
        </div>
      </div>
    </div>
    <div class="qusetion-detail-content">
      <SafeHtml :content="question.content" />
      <div>
        <router-link
          class="hashtags"
          v-for="hashtag in question.hashtags"
          :key="hashtag"
          v-text="`#${hashtag}`"
          :to="{ name: 'question', query: { hashtags: hashtag } }"
        ></router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { getQuestionDetail } from '@/api/questions';
import SafeHtml from "@/components/common/SafeHtml.vue";
export default {
  components: { SafeHtml },
  data() {
    return {
      question: {
        id: 0,
        title: "",
        content: "",
        hits: 0,
        recommend: 0,
        dislike: 0,
        username: "",
      },
    };
  },
  created(){
    if (this.$store.state.Login.token == "") {
      this.$router.replace({
        path: "/login",
        query: { redirect: this.$router.currentRoute.value.fullPath },
      });
    }},
  mounted() {
    this.getQuestion();
  },
  methods: {
    getQuestion() {
      getQuestionDetail(this.$route.params.questionId)
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
a:visited {
  text-decoration: none;
}
</style>
