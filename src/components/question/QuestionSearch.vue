<template>
  <div class="question-search">
    <select class="question-search-condition" name="condition" v-model="searchCondition">
      <option selected value="title">제목</option>
      <option value="content">내용</option>
    </select>
    <input
      type="text"
      v-model="conditionValue"
      placeholder="제목, 내용으로 검색하세요"
      class="question-search-content"
      @keyup.enter="printCondition"
    />
    <button type="submit" @click="printCondition">검색</button>
  </div>
</template>

<script>
export default {
  data(){
    return{
      searchCondition:"title",
      conditionValue:"",
      titleValue:"",
      contentValue:"",
    }
  },
  methods:{
    printCondition(){
      this.searchCondition === "title" ? this.titleValue = this.conditionValue:this.contentValue = this.conditionValue;
      this.$router.push({path: '/question',
        query:{
        orderBy:this.$route.query.orderBy,
          hashtags:this.$route.query.hashtags,
          title:this.titleValue,
          content:this.contentValue,
      }})
    }
  }
};
</script>

<style>
.question-search {
  display: flex;
  justify-content: center;
  padding: 30px 0px 30px 0px;
}

.question-search-condition {
  margin-right: 10px;
  width: 70px;
  border: none;
  border-bottom: 1px solid black;
}
.question-search-content {
  padding: 5px 0px 5px 0px;
  width: 300px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}
</style>
