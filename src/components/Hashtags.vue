<template>
  <div class="hashtag-field">
    <div class="comp_hashtag" :class="{ 'is-disabled': disabled }" @click="focusTagInput">
      <span v-for="tag in tags" :key="tag.value" class="tag-chip">
        <span class="tag">#{{ tag.value }}</span>
        <button type="button" :aria-label="`${tag.value} 태그 삭제`" :disabled="disabled" @click.stop="removeTag(tag.value)"><span aria-hidden="true">×</span></button>
      </span>
      <div class="inp">
        <input ref="input" v-model.trim="value" type="text" :placeholder="tags.length ? '태그 추가' : placeholder" aria-label="태그 입력"
          :disabled="disabled" :aria-invalid="Boolean(errorMsg)" :aria-describedby="errorMsg ? errorId : undefined"
          @input="errorMsg = ''" @keydown.space.prevent="addTagFromInput" @keydown.enter.prevent="addTagFromInput" />
      </div>
    </div>
    <p v-if="errorMsg" :id="errorId" role="alert" class="noti">{{ errorMsg }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, useId } from 'vue';
import type { PropType } from 'vue';
import type { HashtagInput } from '@/types/api';
export default defineComponent({
  // eslint-disable-next-line
  name: 'Hashtags',
  props: {
    placeholder: { type: String, default: '태그를 입력하세요' },
    initialTags: { type: Array as PropType<string[]>, default: () => [] },
    disabled: { type: Boolean, default: false },
  },
  emits: { addHashtags: (_tags: HashtagInput[]) => true },
  setup() { return { errorId: `${useId()}-tag-error` }; },
  data() { return { value: '', errorMsg: '', tags: this.initialTags.map(value => ({ value, select: false })) }; },
  watch: { initialTags(values: string[]) { this.tags = values.map(value => ({ value, select: false })); this.value = ''; this.errorMsg = ''; } },
  methods: {
    focusTagInput() { if (!this.disabled) (this.$refs.input as HTMLInputElement).focus(); },
    emitTags() { this.$emit('addHashtags', this.tags.map(tag => ({ ...tag }))); },
    removeTag(value: string) {
      if (this.disabled) return;
      this.tags = this.tags.filter(tag => tag.value !== value);
      this.errorMsg = '';
      this.emitTags();
    },
    addTagFromInput(event: KeyboardEvent) {
      if (this.disabled || event.isComposing) return;
      if (!this.value) { this.errorMsg = ''; return; }
      if (this.tags.some(tag => tag.value === this.value)) { this.errorMsg = '중복된 단어를 입력하셨습니다.'; return; }
      if (/[~!@#$%^&*()+|<>?:{},.="':;/-]/.test(this.value)) { this.errorMsg = '특수문자는 태그로 등록할 수 없습니다.'; return; }
      this.tags.push({ value: this.value, select: false });
      this.value = '';
      this.errorMsg = '';
      this.emitTags();
    },
  },
});
</script>

<style scoped>
.hashtag-field { min-width: 0; }
.comp_hashtag { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 48px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; background: white; }
.comp_hashtag:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px #818cf833; }
.tag-chip { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; min-height: 30px; border-radius: 6px; background: var(--primary-soft); color: var(--primary); padding: 3px 6px 3px 9px; }
.tag { padding: 0; overflow-wrap: anywhere; background: transparent; }
.tag-chip button { display: grid; place-items: center; flex-shrink: 0; border: 0; border-radius: 4px; background: transparent; color: inherit; width: 24px; height: 24px; padding: 0; font-size: 18px; }
.tag-chip button:hover:not(:disabled) { background: #c7d2fe; }
.inp { flex: 1 1 160px; min-width: 0; }
.inp input { border: 0; padding: 3px 0; min-height: 30px; line-height: 24px; border-radius: 0; background: transparent; font-size: 14px; }
.inp input:focus-visible { outline: 0; }
.noti { margin-top: 8px; color: var(--danger); font-size: 13px; line-height: 1.5; }
.is-disabled { background: var(--canvas); }
</style>
