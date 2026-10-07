<template>
  <div class="question-control">
    <button class="button button-secondary question-control-hastag" :aria-expanded="visible" @click="visibleHashtags">
      해시태그
    </button>
    <button
      class="button button-primary question-control-btn"
      @click="directQuestionWritePage"
    >
      질문하기
    </button>
    <div v-if="visible" @change="getByHashtags">
      <div v-for="hashtag in hashtags" :key="hashtag">
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
<script lang="ts">

import { defineComponent } from "vue";
import { getQuestionHashtags } from '@/api/questions';
import { queryTags } from '@/router/query';
export default defineComponent({
  data() {
    return {
      visible: false,
      searchTags: [] as string[],
      hashtags: [] as string[],
    };
  },
  mounted() {
    this.getHashtags();
  },
  watch: { '$route.query.hashtags': { immediate: true, handler(value) { this.searchTags = queryTags(value); } } },
  methods: {
    visibleHashtags() {
      this.visible = this.visible ? false : true;
    },
    getHashtags() {
      getQuestionHashtags().then((res) => {
        this.hashtags = res.data;
      });
    },
    getByHashtags() {
      this.$router.push({ path: '/question', query: { ...this.$route.query, hashtags: this.searchTags.length ? this.searchTags : undefined } });
    },
    directQuestionWritePage(){
      if (this.$store.state.Login.token != "") {
        this.$router.push(`/questions/new`)
      }else {
        alert("로그인이 필요한 서비스 입니다.");
      }
    }
  },
});
</script>
