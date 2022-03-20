<template>
  <div class="question-search">
    <select class="question-search-condition" name="condition">
      <option value="title">제목</option>
      <option value="content">내용</option>
    </select>
    <input
      type="text"
      placeholder="제목, 내용으로 검색하세요"
      class="question-search-content"
    />
  </div>
</template>

<script>
export default {};
</script>

<style>
.question-search {
  display: flex;
  justify-content: center;
  padding: 30px 0px 30px 0px;
}

.question-search-condition {
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
