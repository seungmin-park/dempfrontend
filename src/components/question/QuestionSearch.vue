<template>
  <div class="question-search">
    <select aria-label="검색 기준" class="question-search-condition" name="condition" v-model="searchCondition">
      <option selected value="title">제목</option>
      <option value="content">내용</option>
    </select>
    <input
      type="text"
      v-model="conditionValue"
      placeholder="제목, 내용으로 검색하세요"
      aria-label="질문 검색어" class="question-search-content"
      @keyup.enter="submitSearch"
    />
    <button class="button button-primary" type="submit" @click="submitSearch">검색</button>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  data(){
    return{
      searchCondition:"title",
      conditionValue:"",
    }
  },
  methods:{
    submitSearch(){
      this.$router.push({path: '/question',
        query:{
        orderBy:this.$route.query.orderBy,
          hashtags:this.$route.query.hashtags,
          title:this.searchCondition === "title" ? this.conditionValue : "",
          content:this.searchCondition === "content" ? this.conditionValue : "",
      }})
    }
  }
});
</script>
