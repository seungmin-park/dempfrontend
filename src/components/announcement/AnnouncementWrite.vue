<template>
  <form v-on:submit="saveAnnounce" action="/" enctype="multipart/form-data">
    <div class="add-form">
      <div>
        <table>
          <tr>
            <td>
              <label for="announce-title">제목: </label>
            </td>
            <td>
              <input
                type="text"
                id="announce-title"
                v-model="title"
                placeholder="제목"
              />
            </td>
          </tr>
          <tr>
            <td>
              <label for="company"> 회사/교육기관: </label>
            </td>
            <td>
              <input
                type="text"
                id="company"
                v-model="company"
                placeholder="회사/교육기관"
              />
            </td>
          </tr>
          <tr>
            <td>
              <label for="accessUrl"> 지원 페이지: </label>
            </td>
            <td>
              <input
                type="text"
                id="accessUrl"
                v-model="accessUrl"
                placeholder="지원 페이지"
              />
            </td>
          </tr>
          <tr>
            <td>
              <label for="language"> 기술 스택 : </label>
            </td>
            <td>
              <input
                type="text"
                id="language"
                v-model="language"
                placeholder="기술 스택"
              />
            </td>
          </tr>
          <tr>
            <td>종류 :</td>
            <td>
              <label for="emp">
                채용 :
                <input
                  type="radio"
                  id="emp"
                  name="type"
                  value="emp"
                  v-model="type"
                />
              </label>
              <label for="edu">
                교육 :
                <input
                  type="radio"
                  id="edu"
                  name="type"
                  value="edu"
                  v-model="type"
                />
              </label>
            </td>
          </tr>
          <tr>
            <td>
              <label for="startedDate"> 지원기간: </label>
            </td>
            <td>
              <input
                type="datetime-local"
                id="startedDate"
                v-model="startedDate"
              />
              ~
              <input
                type="datetime-local"
                id="deadLineDate"
                v-model="deadLineDate"
              />
            </td>
          </tr>
          <tr>
            <td>
              <label for="career"> 경력 : </label>
            </td>
            <td>
              <select id="career" v-model="career">
                <option value="">====경력====</option>
                <option value="경력 무관">경력 무관</option>
                <option value="1년 이상~ 3년 미만">1년 이상~ 3년 미만</option>
                <option value="3년 이상 ~ 5년 미만">3년 이상 ~ 5년 미만</option>
                <option value="5년 이상 ~ 7년 미만">5년 이상 ~ 7년 미만</option>
                <option value="7년 이상 ~ 10년 미만">
                  7년 이상 ~ 10년 미만
                </option>
                <option value="10년 이상">10년 이상</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>
              <label for="position"> 분야 : </label>
            </td>
            <td>
              <select id="position" v-model="position">
                <option value="">====분야====</option>
                <option
                  v-for="position in positions"
                  :key="position.id"
                  :value="position"
                >
                  {{ position }}
                </option>
              </select>
            </td>
          </tr>
          <tr>
            <td>연봉/교육비:</td>
            <td><input type="number" v-model="payment" id="payment" />만원</td>
          </tr>
          <tr>
            <td>
              <label for="announce_img"> 이미지: </label>
            </td>
            <td>
              <input
                type="file"
                id="announce_img"
                accept="image/*"
                ref="announceImg"
                @change="uploadImg"
              />
            </td>
          </tr>
          <tr>
            <td>
              <label for="content"> 내용 : </label>
            </td>
            <td>
              <textarea
                v-model="content"
                id="content"
                cols="30"
                rows="10"
              ></textarea>
            </td>
          </tr>
        </table>
      </div>
      <div class="form-action-button">
        <button type="reset">취소</button>
        <button type="submit">작성하기</button>
      </div>
    </div>
  </form>
</template>

<script>
import positions from "../../data/positon";
// import { extend } from "vee-validate";
import axios from "axios";
export default {
  data() {
    return {
      title: "",
      company: "",
      accessUrl: "",
      type: "",
      startedDate: "",
      deadLineDate: "",
      career: "",
      language: "",
      positions: positions,
      position: "",
      payment: 2400,
      iamge: null,
      content: "",
    };
  },
  // created: function () {
  //   extend("notBlank", {
  //     validate(value) {
  //       if (!value) {
  //         return "{_field_}에 값이 비어있습니다.";
  //       }
  //     },
  //   });
  // },
  methods: {
    uploadImg() {
      this.image = this.$refs.announceImg.files[0];
    },
    saveAnnounce() {
      var announcement = new FormData();
      announcement.append("title", this.title);
      announcement.append("company", this.company);
      announcement.append("accessUrl", this.accessUrl);
      announcement.append("type", this.type);
      announcement.append("startedDate", this.startedDate);
      announcement.append("deadLineDate", this.deadLineDate);
      announcement.append("career", this.career);
      announcement.append("language", this.language);
      announcement.append("payment", this.payment);
      announcement.append("position", this.position);
      announcement.append("content", this.content);
      announcement.append("image", this.image);
      axios.post("/api/announce/test", announcement, {
        headers: {
          "Content-type": "multipart/form-data",
        },
      });
    },
  },
};
</script>

<style>
.add-form {
  display: flex;
}

textarea {
  width: 500px;
  height: 100vh;
  resize: none;
}

input[type="text"] {
  width: 500px;
  height: 32px;
  font-size: 15px;
  border: 0;
  border-radius: 15px;
  outline: none;
  padding-left: 10px;
  background-color: rgb(233, 233, 233);
}

input[type="number"] {
  width: 55px;
  text-align: center;
}

option {
  text-align: center;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

td:first-child {
  text-align: right;
  vertical-align: top;
}

.form-action-button button {
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
