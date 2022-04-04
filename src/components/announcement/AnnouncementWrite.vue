<template>
  <div class="add-frame">
    <form v-on:submit="saveAnnounce" enctype="multipart/form-data">
      <div>
        <label for="emp">
          <input type="radio" id="emp" name="type" value="emp" v-model="type" />
          채용
        </label>
        <label for="edu">
          <input type="radio" id="edu" name="type" value="edu" v-model="type" />
          교육
        </label>
        <label for="announce-title">제목: </label>
        <input
          type="text"
          id="announce-title"
          v-model="title"
          placeholder="제목"
        />
        <label for="company">회사명: </label>
        <input
          type="text"
          id="company"
          v-model="company"
          placeholder="회사명"
        />
        <label for="accessUrl">지원 페이지: </label>
        <input
          type="text"
          id="accessUrl"
          v-model="accessUrl"
          placeholder="지원 페이지"
        />
      </div>
      <div class="career-down" @click="switchStatus">경력</div>
      <div class="dropdown" v-if="careerStatus == true">
        <div class="minCareer">
          <label>
            <input type="radio" name="minCareer" value="" />
            전체
          </label>
        </div>
        <div class="minCareer">
          <label>
            <input type="radio" name="minCareer" value="0" />
            신입
          </label>
        </div>
        <div class="minCareer">
          <label>
            <input type="radio" name="minCareer" value="1" />
            1년 경력
          </label>
        </div>
        <div class="minCareer">
          <label>
            <input type="radio" name="minCareer" value="2" />
            2년 경력
          </label>
        </div>
      </div>
      <div>
        <label for="startedDate">지원기간: </label>
        <input type="date" id="startedDate" v-model="startedDate" />
        ~
        <input type="date" id="deadLineDate" v-model="deadLineDate" />
        <label for="announce_img">이미지: </label>
        <input
          type="file"
          id="announce_img"
          accept="image/*"
          ref="announceImg"
          @change="uploadImg"
        />
        <label for="position">분야: </label>
        <select id="position" v-model="position">
          <option
            v-for="position in positions"
            :key="position.id"
            :value="position"
          >
            {{ position }}
          </option>
        </select>
        <label for="content">내용</label>
        <textarea v-model="content" id="content" cols="30" rows="10"></textarea>
      </div>
      <button type="submit">login</button>
    </form>
  </div>
</template>

<script>
import positions from "../../data/positon";
import axios from "axios";
export default {
  data() {
    return {
      careerStatus: false,
      positions: positions,
      company: "",
      title: "",
      position: "",
      content: "",
      iamge: null,
      deadLineDate: "",
      type: "",
      accessUrl: "",
      startedDate: "",
    };
  },
  methods: {
    switchStatus() {
      if (this.careerStatus) {
        this.careerStatus = false;
      } else {
        this.careerStatus = true;
      }
      console.log(this.careerStatus);
    },
    uploadImg() {
      this.image = this.$refs.announceImg.files[0];
      console.log(this.image);
    },
    saveAnnounce() {
      var announcement = new FormData();
      announcement.append("title", this.title);
      announcement.append("company", this.company);
      announcement.append("position", this.position);
      announcement.append("content", this.content);
      announcement.append("image", this.image);
      axios
        .post("/api/announce/test", announcement, {
          headers: {
            "Content-type": "multipart/form-data",
          },
        })
        .then((res) => console.log(res));
    },
  },
};
</script>

<style>
.dropdown {
  background-color: aquamarine;
}
</style>
