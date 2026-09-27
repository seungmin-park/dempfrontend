<template>
  <ValidationForm as="form" @submit="saveAnnounce" class="write-form" enctype="multipart/form-data">
    <div class="form-grid">
      <div class="field"><label for="announce-title">제목</label><Field id="announce-title" name="announce-title" type="text" v-model="title" rules="required" placeholder="어떤 기회인지 명확하게 적어주세요" :disabled="saving" /><ErrorMessage name="announce-title" class="field-error">제목을 확인해 주세요.</ErrorMessage></div>
      <div class="field"><label for="company">회사·교육기관</label><Field id="company" name="company" type="text" v-model="company" rules="required" placeholder="회사 또는 교육기관 이름" :disabled="saving" /><ErrorMessage name="company" class="field-error">회사·교육기관을 확인해 주세요.</ErrorMessage></div>
      <div class="field"><label for="accessUrl">원문 공고 URL</label><Field id="accessUrl" name="accessUrl" type="url" v-model="accessUrl" rules="required|url" placeholder="https://" :disabled="saving" /><ErrorMessage name="accessUrl" class="field-error">원문 공고 URL을 확인해 주세요.</ErrorMessage></div>
      <div class="field"><label for="language">기술 스택</label><Field id="language" name="language" type="text" v-model="language" rules="required" placeholder="JAVA, SPRING" :disabled="saving" /><ErrorMessage name="language" class="field-error">기술 스택을 확인해 주세요.</ErrorMessage></div>
      <fieldset class="field"><legend>공고 종류</legend><div class="radio-options"><label><Field type="radio" name="type" v-model="type" value="EMP" rules="required" :disabled="saving" /> 채용</label><label><Field type="radio" name="type" v-model="type" value="EDU" :disabled="saving" /> 교육·부트캠프</label></div><ErrorMessage name="type" class="field-error">공고 종류를 선택해 주세요.</ErrorMessage></fieldset>
      <div class="field"><label for="position">분야</label><Field as="select" id="position" name="position" v-model="position" rules="required" :disabled="saving"><option value="">분야 선택</option><option v-for="item in positions" :key="item" :value="item">{{ formatPosition(item) }}</option></Field><ErrorMessage name="position" class="field-error">분야를 선택해 주세요.</ErrorMessage></div>
      <div class="field"><label for="startedDate">모집 시작</label><Field id="startedDate" name="startedDate" type="datetime-local" v-model="startedDate" rules="required" :disabled="saving" /><ErrorMessage name="startedDate" class="field-error">모집 시작일을 입력해 주세요.</ErrorMessage></div>
      <div class="field"><label for="deadLineDate">모집 마감</label><Field id="deadLineDate" name="deadLineDate" type="datetime-local" v-model="deadLineDate" rules="required" :disabled="saving" /><ErrorMessage name="deadLineDate" class="field-error">모집 마감일을 입력해 주세요.</ErrorMessage></div>
      <div class="field"><label for="minCareer">최소 경력 (년)</label><Field id="minCareer" name="minCareer" type="number" min="0" v-model="minCareer" rules="required|min_value:0" :disabled="saving" /><ErrorMessage name="minCareer" class="field-error">0 이상의 경력을 입력해 주세요.</ErrorMessage></div>
      <div class="field"><label for="maxCareer">최대 경력 (년)</label><Field id="maxCareer" name="maxCareer" type="number" min="0" v-model="maxCareer" rules="required|min_value:0" :disabled="saving" /><ErrorMessage name="maxCareer" class="field-error">0 이상의 경력을 입력해 주세요.</ErrorMessage></div>
      <div class="field"><label for="payment">{{ type === 'EDU' ? '교육비' : '연봉' }} (만원)</label><Field id="payment" name="payment" type="number" min="0" v-model="payment" rules="required|min_value:0" :disabled="saving" /><ErrorMessage name="payment" class="field-error">0 이상의 금액을 입력해 주세요.</ErrorMessage></div>
      <div class="field"><label for="announce_img">대표 이미지 (선택)</label><input id="announce_img" name="announce_img" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" ref="announceImg" :disabled="saving" @change="uploadImg" /><p class="field-hint">JPEG 또는 PNG 파일을 선택하세요.</p></div>
    </div>
    <div class="field"><label for="content">상세 내용</label><MarkdownEditor id="content" v-model="content" :disabled="saving" /></div>
    <p v-if="error" role="alert" class="form-error">{{ error }}</p>
    <div class="form-actions"><router-link class="button button-secondary" to="/">취소</router-link><button type="submit" class="button button-primary" :disabled="saving">{{ saving ? '저장 중…' : '등록하기' }}</button></div>
  </ValidationForm>
</template>
<script lang="ts">
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import { renderMarkdown } from '@/content/markdown';
import type { AnnouncementForm } from '@/types/api';
import { formatPosition } from '@/presentation/positions';
import { defineComponent } from "vue";
import positions from "../../data/positions";
import { Form as ValidationForm, Field, ErrorMessage } from "vee-validate";
import { defineRule } from "vee-validate";
import { required, url, min_value, image } from "@vee-validate/rules";
import { createAnnouncement } from "@/api/announcements";

defineRule("required", required);
defineRule("url", url);
defineRule("min_value", min_value);
defineRule("image", image);

export default defineComponent({
  created(){
    if (!this.$store.state.Login.token) {
      this.$router.push("/login");
    }
  },
  components: {
    MarkdownEditor,
    ValidationForm,
    Field,
    ErrorMessage,
  },
  data() {
    return {
      title: "",
      company: "",
      accessUrl: "",
      type: "" as AnnouncementForm["type"],
      startedDate: null as string | null,
      deadLineDate: null as string | null,
      minCareer: 0,
      maxCareer: 0,
      language: "",
      positions: positions,
      position: "" as AnnouncementForm["position"],
      payment: 2400,
      image: null as File | null,
      content: "",
      saving: false, error: "",
    };
  },
  methods: {
    formatPosition,
    isRequired(value: unknown) {
      if (typeof value === 'string' && value.trim()) {
        return true;
      }
      return "해당 값은 필수 항목 입니다.";
    },
    uploadImg() {
      this.image = (this.$refs.announceImg as HTMLInputElement).files?.[0] ?? null;
    },
    saveAnnounce() {
      if (this.saving) return;
      this.saving = true;
      this.error = "";
      createAnnouncement({
        title: this.title,
        company: this.company,
        accessUrl: this.accessUrl,
        type: this.type,
        startedDate: this.startedDate,
        deadLineDate: this.deadLineDate,
        minCareer: this.minCareer,
        maxCareer: this.maxCareer,
        language: this.language,
        payment: this.payment,
        position: this.position,
        content: renderMarkdown(this.content),
        image: this.image,
      })
        .then(() => {
          this.$router.push("/");
        })
        .catch(() => {
          this.error = "공고를 저장하지 못했습니다. 입력한 내용을 확인하고 다시 시도해 주세요.";
        }).finally(() => { this.saving = false; });
    },
  },
});
</script>
