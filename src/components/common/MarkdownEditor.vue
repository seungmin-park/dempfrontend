<template>
  <section class="markdown-editor" :class="`markdown-editor--${mode}`">
    <div class="editor-bar">
      <div class="editor-tools" role="group" aria-label="본문 서식">
        <button v-for="tool in tools" :key="tool.label" type="button" :aria-label="tool.label" :title="tool.label" :disabled="disabled" @mousedown.prevent @click="applyTool(tool)"><AppIcon :name="tool.icon" :size="18" /></button>
      </div>
      <div class="editor-modes" role="group" aria-label="편집기 보기">
        <button v-for="view in views" :key="view.value" type="button" :aria-label="view.label" :aria-pressed="mode === view.value" @click="mode = view.value">{{ view.text }}</button>
      </div>
    </div>
    <div class="editor-canvas">
      <textarea v-show="mode !== 'preview'" :id="id" ref="input" :aria-label="label" :value="modelValue" :disabled="disabled" :placeholder="placeholder" spellcheck="false" @input="onInput" @keydown="onKeydown" />
      <div v-show="mode !== 'edit'" class="editor-preview" :aria-label="`${label} 미리보기`" tabindex="0">
        <SafeHtml v-if="modelValue.trim()" :content="preview" />
        <p v-else class="editor-placeholder">작성한 내용이 여기에 표시됩니다.</p>
      </div>
    </div>
    <div class="editor-status"><span>Markdown으로 작성할 수 있어요.</span><span>{{ Array.from(modelValue).length.toLocaleString('ko-KR') }}자</span></div>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import SafeHtml from './SafeHtml.vue';
import { renderMarkdown } from '@/content/markdown';
const props = withDefaults(defineProps<{ modelValue: string; id: string; label?: string; disabled?: boolean; placeholder?: string }>(), {
  label: '본문', disabled: false, placeholder: '내용을 입력하세요. 코드와 예시를 함께 적으면 이해하기 쉬워요.',
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const input = ref<HTMLTextAreaElement>();
const mode = ref<'edit' | 'preview' | 'split'>('edit');
const preview = computed(() => renderMarkdown(props.modelValue));
const views = [{ value: 'edit', label: '작성', text: '작성' }, { value: 'preview', label: '미리보기', text: '미리보기' }, { value: 'split', label: '분할 보기', text: '나란히' }] as const;
const tools = [
  { label: '제목', icon: 'heading', prefix: '## ', suffix: '', fallback: '제목', block: true },
  { label: '굵게', icon: 'bold', prefix: '**', suffix: '**', fallback: '강조할 글', block: false },
  { label: '기울임', icon: 'italic', prefix: '_', suffix: '_', fallback: '기울일 글', block: false },
  { label: '목록', icon: 'list', prefix: '- ', suffix: '', fallback: '목록 항목', block: true },
  { label: '인용', icon: 'quote', prefix: '> ', suffix: '', fallback: '인용할 글', block: true },
  { label: '링크', icon: 'link', prefix: '[', suffix: '](https://)', fallback: '링크 이름', block: false },
  { label: '코드 블록', icon: 'code', prefix: '```\n', suffix: '\n```', fallback: '코드를 입력하세요', block: true },
] as const;
function onInput(event: Event) { emit('update:modelValue', (event.target as HTMLTextAreaElement).value); }
async function applyTool(tool: typeof tools[number]) {
  if (props.disabled) return;
  const field = input.value;
  const start = field?.selectionStart ?? props.modelValue.length;
  const end = field?.selectionEnd ?? start;
  const before = props.modelValue.slice(0, start);
  const selection = props.modelValue.slice(start, end) || tool.fallback;
  const prefix = (tool.block && before && !before.endsWith('\n') ? '\n' : '') + tool.prefix;
  const after = props.modelValue.slice(end);
  const suffix = tool.suffix + (tool.block && after && !after.startsWith('\n') ? '\n' : '');
  emit('update:modelValue', before + prefix + selection + suffix + after);
  mode.value = 'edit';
  await nextTick();
  field?.focus();
  field?.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
}
function onKeydown(event: KeyboardEvent) {
  if (event.isComposing || !(event.ctrlKey || event.metaKey)) return;
  const tool = event.key.toLowerCase() === 'b' ? tools[1] : event.key.toLowerCase() === 'i' ? tools[2] : undefined;
  if (tool) { event.preventDefault(); void applyTool(tool); }
}
</script>
<style scoped>
.markdown-editor{border:1px solid var(--line,#e2e8f0);border-radius:12px;overflow:hidden;background:#fff}
.editor-bar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 12px;background:var(--canvas,#f7f8fc);border-bottom:1px solid var(--line,#e2e8f0)}
.editor-tools,.editor-modes{display:flex;align-items:center;gap:3px}.editor-tools button{width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:6px;background:transparent;color:var(--muted,#475569)}
.editor-tools button:hover:not(:disabled){background:#e8e7fc;color:var(--primary,#4f46e5)}.editor-modes{background:#eaeef5;padding:3px;border-radius:7px}.editor-modes button{border:0;background:transparent;border-radius:5px;padding:5px 10px;font-size:12px;font-weight:600;color:var(--muted,#475569)}.editor-modes button[aria-pressed=true]{background:white;color:var(--primary,#4f46e5);box-shadow:0 1px 3px #0f172a12}
.editor-canvas{display:grid;grid-template-columns:minmax(0,1fr)}.markdown-editor--split .editor-canvas{grid-template-columns:repeat(2,minmax(0,1fr))}.editor-canvas textarea{width:100%;min-height:340px;resize:vertical;border:0;border-radius:0;padding:24px;font:15px/1.85 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--ink,#0f172a);background:#fff;outline-offset:-3px}.editor-canvas textarea:focus{box-shadow:none}.editor-preview{min-width:0;min-height:340px;padding:24px;overflow:auto;max-height:720px}.markdown-editor--split .editor-preview{border-left:1px solid var(--line,#e2e8f0)}.editor-placeholder{color:var(--muted,#64748b)}.editor-status{padding:9px 14px;border-top:1px solid var(--line,#e2e8f0);display:flex;justify-content:space-between;gap:12px;color:var(--muted,#64748b);font-size:12px}.editor-tools button:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:640px){.editor-bar{padding:8px}.editor-tools button{width:38px;height:40px}.editor-canvas textarea,.editor-preview{padding:18px;min-height:300px}.markdown-editor--split .editor-canvas{grid-template-columns:1fr}.markdown-editor--split .editor-preview{border-left:0;border-top:1px solid var(--line,#e2e8f0)}.editor-status{font-size:11px}}
</style>
