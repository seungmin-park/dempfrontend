<template>
  <div class="comp_hashtag" @click="focusTagInput" ref="group" tabindex="0" @focus="focusTagInput">
    <p class="help" v-if="helpVisible">{{ defaultPlaceholder }}</p>

    <!-- Hashtags -->
    <div class="tags" v-if="!helpVisible">
      <input
        type="text"
        class="fake"
        ref="fake"
        @keydown.backspace.prevent="deleteTag(focusIndex)"
        @keydown.delete.prevent="deleteTag(focusIndex)"
      />
      <span
        class="tag"
        v-for="(row, index) in tags"
        :key="index"
        :class="{ active: row.select }"
        @click="selectTag(index)"
        >{{ row.value }}</span
      >
    </div>
    <!--// Hashtags -->

    <div class="inp" v-show="!helpVisible">
      <input
        type="text"
        ref="input"
        v-model.trim="value"
        @focus="initSelect"
        @keydown.space.prevent="addTagFromInput"
        @keydown.enter.prevent="addTagFromInput"
        @keydown.backspace="initErrorMsg"
        @keydown.delete="initErrorMsg"
        placeholder="태그입력" aria-label="태그 입력"
      />
    </div>

    <transition
      enter-active-class="animate__animated animate__fadeInDown animate__faster"
      leave-active-class="animate__animated animate__fadeOut"
    >
      <p class="noti" v-if="errorMsg">{{ errorMsg }}</p>
    </transition>
  </div>
</template>

<script lang="ts">
import type { HashtagInput } from '@/types/api';
import { defineComponent } from "vue";
export default defineComponent({
  // eslint-disable-next-line
  name: "Hashtags",
  props: { placeholder: { type: String, default: '#추천태그 #특수문자제외' } },
  emits: { addHashtags: (_tags: HashtagInput[]) => true },
  data() {
    return {
      defaultPlaceholder: this.placeholder
        ? this.placeholder
        : "#추천태그 #특수문자제외",
      errorMsg: null as string | null,
      focusIndex: null as number | null,
      helpVisible: true,
      tags: [] as HashtagInput[],
      value: "",
    };
  },
  methods: {
    focusTagInput() {
      if (this.tags.length > 0) return;
      this.helpVisible = false;
      this.$nextTick(() => (this.$refs.input as HTMLInputElement).focus());
    },

    addTag() {
      this.tags.push({ value: this.value, select: false });
    },
    unselectTag() {
      this.tags.forEach((tag) => (tag.select = false));
    },
    selectTag(idx: number) {
      if (this.tags.some((tag) => tag.select)) {
        this.unselectTag();
      }

      this.tags[idx].select = !this.tags[idx].select;

      if (!this.tags[idx].select) {
        this.initSelectIndex();
        return;
      }

      (this.$refs.fake as HTMLInputElement).focus();
      this.focusIndex = idx;
    },
    deleteTag(idx: number | null) {
      if (idx === null) {
        return;
      }

      this.initSelectIndex();
      this.tags.splice(idx, 1);
    },

    initSelect() {
      if (!this.tags.some((tag) => tag.select)) {
        return;
      }

      this.unselectTag();
      this.initSelectIndex();
    },
    initSelectIndex() {
      this.focusIndex = null;
    },
    initErrorMsg() {
      this.errorMsg = null;
    },
    tagValidationError() {
      if (this.tags.some((tag) => tag.value === this.value)) {
        return "중복된 단어를 입력하셨습니다.";
      }

      const regex = /[~!@#$%^&*()+|<>?:{},.="':;/-]/;
      if (regex.test(this.value)) {
        return "특수문자는 태그로 등록할 수 없습니다.";
      }

      return false;
    },
    addTagFromInput(event: KeyboardEvent) {
      // CASE 공백
      if ((event.target as HTMLInputElement).value === "") {
        this.initErrorMsg();
        (event.target as HTMLInputElement).focus();
        return;
      }
      // CASE 유효성(중복,특문)
      const resultMsg = this.tagValidationError();
      if (resultMsg) {
        this.errorMsg = resultMsg;
        (this.$refs.input as HTMLInputElement).focus();
        return;
      }

      this.addTag();

      this.errorMsg = null;
      this.value = "";
      (this.$refs.input as HTMLInputElement).focus();
    },
  },
  mounted() {},
  watch: {
    tags: {
      handler(newValue) {
        this.$emit("addHashtags", newValue);
      },
      deep: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.comp_hashtag {
  position: relative;
  width: 100%;
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-height: 48px;
  margin: 10px auto;
  text-align: left;
  box-sizing: border-box;

  .noti {
    position: absolute;
    left: 0;
    top: 100%;
    font-size: 12px;
    margin-top: 5px;
    padding: 0 5px;
    border-radius: 8px;
    border: 1px solid #ea2136;
    color: #ea2136;
    text-align: left;
    line-height: 2;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }

  .help {
    padding: 0;
    margin: 0;
    line-height: 30px;
    font-weight: 300;
    font-size: 14px;
    color: #64748b;
    vertical-align: top;
  }

  .tags {
    position: relative;
    overflow: hidden;
    display: inline-block;
    vertical-align: top;
    margin-bottom: -6px;

    .fake {
      position: absolute;
      width: 1px;
      height: 1px;
      left: -1px;
      right: -1px;
      padding: 0;
      border: 0;
      outline: none;
      -webkit-appearance: none;
      -webkit-text-size-adjust: none;
    }
    .tag {
      display: inline-block;
      position: relative;
      margin: 0 5px 6px 0;
      padding: 0 5px;
      line-height: 30px;
      border-radius: 5px;
      background-color: #eee;
      vertical-align: top;
      word-wrap: break-word;
      word-break: break-all;
      font-size: 13px;
      text-align: left;
      &:hover:after {
        display: block;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 1px solid #aaa;
        content: "";
        border-radius: 5px;
      }

      &:before {
        display: inline;
        content: "#";
      }

      &.active {
        background-color: #656565;
        color: #fff;
        &:hover:after {
          display: none;
        }
      }
    }
  }

  .inp {
    display: inline-block;
    overflow: hidden;
    height: 30px;
    width: 150px;
    vertical-align: top;
    font-family: "Noto Sans KR", "Malgun Gothic", "굴림", Gulim, "돋움", Dotum,
      Sans-serif;

    &:before {
      display: inline;
      position: relative;
      top: -1px;
      content: "#";
      color: #3e3e3e;
      margin-right: 2px;
      vertical-align: top;
      line-height: 30px;
    }

    input {
      width: 135px;
      height: 28px;
      vertical-align: top;
      color: #3e3e3e;
      -webkit-appearance: none;
      -webkit-text-size-adjust: none;
      padding: 0;
      border: 0;
      outline: none;
      vertical-align: top;
      font-family: "Noto Sans KR", "Malgun Gothic", "굴림", Gulim, "돋움", Dotum,
        Sans-serif;
    }
  }
}
</style>
