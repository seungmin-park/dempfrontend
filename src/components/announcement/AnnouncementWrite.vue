<template>
  <div class="add-frame">
    <form action="post">
      <div class="add-frame-title">
        제목 :
        <input type="text" name="title" placeholder="채용 공고 제목" /> 회사명 :
        <input type="text" name="company" placeholder="회사명" />
        지원 기간 : <input type="date" name="startDate" /> ~
        <input type="date" name="deadLine" />
        연봉:/교육비
        <input type="number" name="payment" />
        포지션 :
        <select name="position" id="position">
          <option
            v-for="position in positions"
            :key="position.id"
            :value="position"
          >
            {{ position }}
          </option>
        </select>
      </div>
      <div>이미지 : <input type="file" accept="image/*" /></div>
      내용 : <textarea name="content" id="" cols="30" rows="10"></textarea>
    </form>
  </div>
</template>

<script>
import positions from "../../data/positon";
export default {
  data() {
    return {
      positions: positions,
    };
  },
};
</script>

<style></style>
