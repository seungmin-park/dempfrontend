<template>
  <Form as="form" @submit="saveAnnounce" enctype="multipart/form-data">
    <div class="add-form">
      <div>
        <table>
          <tr>
            <td>
              <label for="announce-title">제목: </label>
            </td>
            <td>
              <Field
                type="text"
                id="announce-title"
                name="announce-title"
                v-model="title"
                placeholder="제목"
                rules="required"
              />
              <ErrorMessage class="errorMessage" name="announce-title" as="div">
                제목을 입력해 주세요.
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>
              <label for="company"> 회사/교육기관: </label>
            </td>
            <td>
              <Field
                type="text"
                id="company"
                name="company"
                v-model="company"
                placeholder="회사/교육기관"
                rules="required"
              />
              <ErrorMessage class="errorMessage" name="company" as="div">
                회사/교육기관을 입력해 주세요.
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>
              <label for="accessUrl"> 지원 페이지: </label>
            </td>
            <td>
              <Field
                type="text"
                id="accessUrl"
                name="accessUrl"
                v-model="accessUrl"
                placeholder="지원 페이지"
                rules="required|url"
              />
              <ErrorMessage class="errorMessage" name="accessUrl" as="div">
                지원 페이지를 형식에 맞게 입력해 주세요.(https://)
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>
              <label for="language"> 기술 스택 : </label>
            </td>
            <td>
              <Field
                type="text"
                id="language"
                name="language"
                v-model="language"
                placeholder="기술 스택"
                rules="required"
              />
              <ErrorMessage class="errorMessage" name="language" as="div">
                기술 스택을 입력해 주세요.
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>종류 :</td>
            <td>
              <label for="emp">
                채용 :
                <Field
                  type="radio"
                  id="emp"
                  name="type"
                  value="emp"
                  v-model="type"
                  rules="required"
                />
              </label>
              <label for="edu">
                교육 :
                <Field
                  type="radio"
                  id="edu"
                  name="type"
                  value="edu"
                  v-model="type"
                />
                <ErrorMessage class="errorMessage" name="type" as="div">
                  종류를 선택해 주세요.
                </ErrorMessage>
              </label>
            </td>
          </tr>
          <tr>
            <td>
              <label for="startedDate"> 지원기간: </label>
            </td>
            <td>
              <Field
                type="datetime-local"
                id="startedDate"
                name="startedDate"
                v-model="startedDate"
                rules="required"
              />
              ~
              <Field
                type="datetime-local"
                id="deadLineDate"
                name="deadLineDate"
                v-model="deadLineDate"
                rules="required"
              />
              <ErrorMessage class="errorMessage" name="startedDate" as="div">
                시작 기간을 지정해 주세요.
              </ErrorMessage>
              <ErrorMessage class="errorMessage" name="deadLineDate" as="div">
                마감 기간을 지정해 주세요.
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>
              <label for="career"> 경력 : </label>
            </td>
            <td>
              <Field
                as="select"
                name="career"
                id="career"
                v-model="career"
                rules="required"
              >
                <option value="">====경력====</option>
                <option value="경력 무관">경력 무관</option>
                <option value="1년 이상~ 3년 미만">1년 이상~ 3년 미만</option>
                <option value="3년 이상 ~ 5년 미만">3년 이상 ~ 5년 미만</option>
                <option value="5년 이상 ~ 7년 미만">5년 이상 ~ 7년 미만</option>
                <option value="7년 이상 ~ 10년 미만">
                  7년 이상 ~ 10년 미만
                </option>
                <option value="10년 이상">10년 이상</option>
              </Field>
              <ErrorMessage class="errorMessage" name="career" as="div">
                경력 사항을 선택해 주세요.
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>
              <label for="position"> 분야 : </label>
            </td>
            <td>
              <Field
                as="select"
                name="position"
                id="position"
                v-model="position"
                rules="required"
              >
                <option value="">====분야====</option>
                <option
                  v-for="position in positions"
                  :key="position.id"
                  :value="position"
                >
                  {{ position }}
                </option>
              </Field>
              <ErrorMessage class="errorMessage" name="position" as="div">
                분야를 선택해 주세요.
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>연봉/교육비:</td>
            <td>
              <Field
                type="number"
                v-model="payment"
                id="payment"
                name="payment"
                rules="required|min_value:2400"
              />만원
              <ErrorMessage class="errorMessage" name="payment" as="div">
                연봉/교육비를 입력해 주세요.
              </ErrorMessage>
            </td>
          </tr>
          <tr>
            <td>
              <label for="announce_img"> 이미지: </label>
            </td>
            <td>
              <input
                type="file"
                id="announce_img"
                name="announce_img"
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
                name="content"
                as="textarea"
                wrap="hard"
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
  </Form>
</template>

<script>
import positions from "../../data/positon";
import { Form, Field, ErrorMessage } from "vee-validate";
import { defineRule } from "vee-validate";
import { required, url, min_value, image } from "@vee-validate/rules";
import axios from "axios";

defineRule("required", required);
defineRule("url", url);
defineRule("min_value", min_value);
defineRule("image", image);

export default {
  created(){
    if (!this.$store.state.token) {
      this.$router.push("/login");
    }
  },
  mounted() {
    // eslint-disable-next-line
    $("#content").summernote({
      height: 800,
      minHeight: null,
      maxHeight: null,
      focus: true,
      toolbar: [
        ["style", ["bold", "italic", "underline", "clear"]],
        ["font", ["strikethrough", "superscript", "subscript", "forecolor"]],
        ["fontsize", ["fontsize"]],
        ["color", ["color"]],
        ["para", ["ul", "ol", "paragraph"]],
        ["height", ["height"]],
      ],
    });
  },
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  data() {
    return {
      title: "",
      company: "",
      accessUrl: "",
      type: "",
      startedDate: null,
      deadLineDate: null,
      career: "",
      language: "",
      positions: positions,
      position: "",
      payment: 2400,
      iamge: "noimg.jpg",
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
    isRequired(value) {
      if (value && value.trim()) {
        return true;
      }
      return "해당 값은 필수 항목 입니다.";
    },
    uploadImg() {
      this.image = this.$refs.announceImg.files[0];
    },
    saveAnnounce() {
      // eslint-disable-next-line
      this.content = $("#content").summernote("code");
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
      axios
        .post("/api/announce/add", announcement, {
          headers: {
              "X-AUTH-TOKEN": this.$store.state.token,
            "Content-type": "multipart/form-data",
          },
        })
        .then(() => {
          this.$router.push("/");
        })
        .catch((e) => {
          console.log(e);
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

.errorMessage {
  display: flex;
  color: red;
}
</style>
