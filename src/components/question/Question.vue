<template>
  <main>
    <div class="question-type">
      <p>전체 질문</p>
      <p>인기 질문</p>
    </div>
    <div class="test-div">
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
      <div class="question-list-one">
        <span class="question-list-one-title"> 조회수 </span>
        <span class="question-list-one-title">Q. 접근 제어자가 헷갈려요</span>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: "CSQuestion",
};
</script>

<style>
main {
  display: flex;
}

.question-type {
  padding: 0 30px 0 30px;
}

.test-div {
  border: 1px solid palegreen;
  width: 70%;
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

.question-list-one {
  border: 2px solid #a9cbdd;
  border-left: none;
  border-right: none;
  padding: 30px 0px 30px 0px;
}
</style>
