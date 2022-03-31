<template>
  <button class="question-answer-btn" @click="$router.go(-1)">돌아가기</button>
</template>

<script>
export default {};
</script>

<style>
.question-answer-btn {
  background-color: #b3dce0;
  color: black;
  width: 100px;
  height: 35px;
  border: none;
  box-shadow: 0px 0px 10px gray;
  font-weight: 600;
}
</style>
