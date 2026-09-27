<template>
  <section class="announcement-editor" :aria-labelledby="`${id}-label`">
    <div class="body-editor-heading">
      <div><label :id="`${id}-label`" :for="id">{{ label }}</label><p>원문에서 확인한 핵심 내용을 정리해 주세요.</p></div>
      <div class="body-editor-tabs" role="group" aria-label="본문 보기">
        <button type="button" :aria-pressed="!preview" @click="preview = false">작성</button>
        <button type="button" :aria-pressed="preview" @click="showPreview">미리보기</button>
      </div>
    </div>
    <div v-show="!preview">
      <div class="body-toolbar" role="group" aria-label="본문 서식">
        <button type="button" :disabled="disabled" :aria-pressed="editor?.isActive('heading', { level: 2 })" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">제목</button>
        <button type="button" :disabled="disabled" :aria-pressed="editor?.isActive('bold')" @click="editor?.chain().focus().toggleBold().run()"><b>굵게</b></button>
        <button type="button" :disabled="disabled" :aria-pressed="editor?.isActive('bulletList')" @click="editor?.chain().focus().toggleBulletList().run()">목록</button>
        <button type="button" :disabled="disabled" @click="linkOpen = !linkOpen">링크</button>
        <button type="button" :disabled="disabled" @click="imageInput?.click()">이미지 추가</button>
        <button type="button" :disabled="disabled || !editor?.can().undo()" @click="editor?.chain().focus().undo().run()">되돌리기</button>
        <button type="button" data-test="body-template" :disabled="disabled" @click="addTemplate">{{ type === 'EDU' ? '교육' : '채용' }} 항목 추가</button>
      </div>
      <div v-if="linkOpen" class="body-link-controls">
        <label :for="`${id}-link`">링크 주소</label><input :id="`${id}-link`" v-model="linkUrl" type="url" placeholder="https://" :disabled="disabled" @keydown.enter.prevent="setLink" />
        <button type="button" class="button button-secondary" :disabled="disabled" @click="setLink">적용</button>
      </div>
      <EditorContent :editor="editor" />
      <input ref="imageInput" :id="`${id}-images`" class="body-image-input" type="file" multiple accept="image/jpeg,image/png" :disabled="disabled" aria-label="본문 이미지 파일" @change="selectFiles" />
      <p class="body-editor-help">텍스트를 붙여넣으면 서식을 정돈합니다. 이미지는 붙여넣기·드래그 또는 파일 선택으로 추가하세요. JPEG·PNG, 각 5MB, 최대 10개. 대표 이미지 포함 합계 9MB 이하.</p>
    </div>
    <div v-if="preview" class="body-preview-wrap">
      <label class="body-preview-toggle"><input v-model="mobilePreview" type="checkbox" /> 모바일 너비로 보기</label>
      <div class="safe-html body-preview" :class="{ 'is-mobile': mobilePreview }" v-html="previewHtml"></div>
    </div>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { MAX_ATTACHMENT_BYTES } from '@/content/announcementAttachments';
import { sanitizeHtml, sanitizeAnnouncementHtml } from '@/content/sanitizeHtml';

const props = withDefaults(defineProps<{ id: string; modelValue: string; type?: string; label?: string; disabled?: boolean; coverBytes?: number }>(), { type: 'EMP', label: '상세 내용', disabled: false, coverBytes: 0 });
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'update:bodyImages': [files: File[]] }>();
const imageInput = ref<HTMLInputElement>();
const preview = ref(false), mobilePreview = ref(false), previewHtml = ref(''), error = ref('');
const linkOpen = ref(false), linkUrl = ref('');
const pending = new Map<string, File>();
let lastEmitted = props.modelValue;

function publishContent() {
  if (!editor.value) return;
  const document = new DOMParser().parseFromString(editor.value.getHTML(), 'text/html');
  const images: File[] = [];
  document.querySelectorAll('img').forEach(image => {
    const file = pending.get(image.getAttribute('src') || '');
    if (file) { image.setAttribute('src', `attachment:${images.length}`); images.push(file); }
  });
  lastEmitted = document.body.innerHTML;
  emit('update:bodyImages', images);
  emit('update:modelValue', lastEmitted);
}

function addFiles(files: File[], position?: number) {
  if (props.disabled || !editor.value || !files.length) return;
  error.value = '';
  let existing = 0, pendingBytes = props.coverBytes;
  editor.value.state.doc.descendants(node => { if (node.type.name === 'image') { existing++; pendingBytes += pending.get(node.attrs.src)?.size || 0; } });
  if (existing + files.length > 10) { error.value = '본문 이미지는 최대 10개까지 추가할 수 있습니다.'; return; }
  if (files.some(file => !['image/png', 'image/jpeg'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024)) {
    error.value = '5MB 이하의 JPEG 또는 PNG 이미지를 선택해 주세요.'; return;
  }
  if (pendingBytes + files.reduce((sum, file) => sum + file.size, 0) > MAX_ATTACHMENT_BYTES) { error.value = '대표 이미지와 본문 이미지는 합계 9MB 이하로 첨부해 주세요.'; return; }
  const nodes = files.map(file => {
    const src = URL.createObjectURL(file); pending.set(src, file);
    return { type: 'image', attrs: { src, alt: file.name } };
  });
  if (position !== undefined) editor.value.chain().focus().insertContentAt(position, nodes).run();
  else editor.value.chain().focus().insertContent(nodes).run();
}

const editor = useEditor({
  content: sanitizeAnnouncementHtml(props.modelValue),
  extensions: [StarterKit.configure({ link: { openOnClick: false, protocols: ['http', 'https'], autolink: false } }), Image, TableKit],
  editable: !props.disabled,
  editorProps: {
    attributes: { id: props.id, role: 'textbox', 'aria-multiline': 'true', 'aria-labelledby': `${props.id}-label`, class: 'body-editor-content' },
    // Pasted HTML never imports remote images or page-specific styles.
    transformPastedHTML: html => sanitizeHtml(html),
    handlePaste: (_view, event) => {
      const files = Array.from(event.clipboardData?.files || []);
      if (!files.length) return false;
      event.preventDefault(); addFiles(files); return true;
    },
    handleDrop: (view, event, _slice, moved) => {
      const files = Array.from(event.dataTransfer?.files || []);
      if (moved || !files.length) return false;
      event.preventDefault();
      addFiles(files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
      return true;
    },
  },
  onUpdate: publishContent,
});
watch(() => props.modelValue, html => {
  if (html !== lastEmitted) { lastEmitted = html; editor.value?.commands.setContent(sanitizeAnnouncementHtml(html), { emitUpdate: false }); }
});
watch(() => props.disabled, disabled => editor.value?.setEditable(!disabled));
onBeforeUnmount(() => { pending.forEach((_file, url) => URL.revokeObjectURL(url)); editor.value?.destroy(); });
function selectFiles(event: Event) { const input = event.target as HTMLInputElement; addFiles(Array.from(input.files || [])); input.value = ''; }
function showPreview() { previewHtml.value = sanitizeAnnouncementHtml(editor.value?.getHTML() || '', true); preview.value = true; }
function setLink() {
  try {
    const url = new URL(linkUrl.value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    editor.value?.chain().focus().setLink({ href: url.href }).run(); linkOpen.value = false; error.value = '';
  } catch { error.value = 'http 또는 https 링크를 입력해 주세요.'; }
}
function addTemplate() {
  const sections = props.type === 'EDU' ? ['과정 소개', '지원 대상', '배우는 내용', '교육 일정·방식·비용', '선발 절차'] : ['주요 업무', '지원 자격', '우대 사항', '근무 조건', '전형 절차'];
  editor.value?.chain().focus().insertContentAt(editor.value.state.doc.content.size,
    sections.flatMap(text => [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] }, { type: 'paragraph' }])).run();
}
</script>
