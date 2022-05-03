<template>
  <Form as="form" @submit="saveQuestion" class="qusetion-add">
    <div class="qusetion-add">
      <div>
        <table>
          <tr>
            <td>
              <label for="question-title">제목: </label>
            </td>
            <td>
              <Field
                type="text"
                id="question-title"
                name="question-title"
                v-model="questionForm.title"
                placeholder="제목"
                rules="required"
              />
              <ErrorMessage class="errorMessage" name="question-title" as="div">
                제목을 입력해 주세요.
              </ErrorMessage>
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
      <hashtags
        :placeholder="`#해시태그를작성하세요`"
        v-on:addHashtags="addHashtags"
      ></hashtags>
      <div class="form-action-button">
        <button type="reset">취소</button>
        <button type="submit" @click="writeSummer">작성하기</button>
      </div>
    </div>
  </Form>
</template>

<script>
import { Form, Field, ErrorMessage } from "vee-validate";
import { defineRule } from "vee-validate";
import { required, url, min_value, image } from "@vee-validate/rules";
import Hashtags from "@/components/Hashtags";
import axios from "axios";

var temp = [];
defineRule("required", required);
defineRule("url", url);
defineRule("min_value", min_value);
defineRule("image", image);

export default {
  mounted() {
    // eslint-disable-next-line
    $("#content").summernote({
      height: 500,
      width: 1500,
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
    Hashtags,
    ErrorMessage,
  },
  data() {
    return {
      questionForm: {
        title: "",
        content: "",
        hashtags: [],
      },
    };
  },
  methods: {
    isRequired(value) {
      if (value && value.trim()) {
        return true;
      }
      return "해당 값은 필수 항목 입니다.";
    },
    saveQuestion() {
      // eslint-disable-next-line
      this.questionForm.content = $("#content").summernote("code");
      this.convertHashtags();
      axios
        .post("/api/question/add", this.questionForm, {
          headers: {
            "Content-Type": `application/json`,
          },
        })
        .then((res) => {
          console.log(res);
          this.$router.push({
            path: "/question",
            query: { orderBy: "createdDate" },
          });
        })
        .catch((e) => {
          console.log(e);
        });
    },
    addHashtags(hashtag) {
      this.questionForm.hashtags = hashtag;
    },
    convertHashtags() {
      this.questionForm.hashtags.forEach((element) => {
        temp.push(element.value);
      });
      this.questionForm.hashtags = temp;
    },
  },
};
</script>

<style>
.add-form {
  display: flex;
}

#question-title {
  width: 100%;
  height: 50px;
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
