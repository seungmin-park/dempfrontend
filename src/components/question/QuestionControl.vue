<template>
  <div class="question-control">
    <button class="question-control-hastag" @click="visibleHashtags">
      해시태그
    </button>
    <button
      class="question-control-btn"
      @click="directQuestionWritePage"
    >
      질문하기
    </button>
    <div v-if="visible" @change="getByHashtags">
      <div v-for="hashtag in hashtags" :key="hashtag.id">
        <label :for="hashtag" class="dropdown-item">
          <input
            v-model="searchTags"
            type="checkbox"
            name="hashtags"
            :id="hashtag"
            :value="hashtag"
          />{{ hashtag }}
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      visible: false,
      searchTags: [],
      hashtags: [],
    };
  },
  mounted() {
    this.getHashtags();
  },
  methods: {
    visibleHashtags() {
      this.visible = this.visible ? false : true;
    },
    getHashtags() {
      axios.get("/api/question/hashtags").then((res) => {
        this.hashtags = res.data;
      });
    },
    getByHashtags() {
      this.$router.push({path: '/question',
        query:{orderBy:this.$route.query.orderBy,
        hashtags:this.searchTags}});
    },
    directQuestionWritePage(){
      if (this.$store.state.Login.token != "") {
        this.$router.push(`/questions/new`)
      }else {
        alert("로그인이 필요한 서비스 입니다.");
      }
    }
  },
};
</script>

<style>
.question-control {
  align-items: center;
}

.question-control button {
  display: block;
  color: white;
  background-color: #a9cbdd;
  width: 100px;
  height: 41px;
  border: none;
  border-radius: 5px;
  margin: 10px 10px 10px 10px;
  font-size: 15px;
  font-weight: 600;
}
</style>
