import { mount, flushPromises } from '@vue/test-utils';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';

function editor(value = '') {
  const wrapper = mount(MarkdownEditor, { props: {
    id: 'test-editor', label: '본문', modelValue: value,
    'onUpdate:modelValue': next => wrapper.setProps({ modelValue: next }),
  } });
  return wrapper;
}

it('선택한 글을 굵게 바꾸고 선택과 커서 위치를 보존한다', async () => {
  const wrapper = editor('앞 강조 뒤');
  const input = wrapper.get('textarea').element;
  input.setSelectionRange(2, 4);
  await wrapper.get('button[aria-label="굵게"]').trigger('click');
  await flushPromises();
  expect(input.value).toBe('앞 **강조** 뒤');
  expect([input.selectionStart, input.selectionEnd]).toEqual([4, 6]);
});

it('키보드 단축키로 코드가 아닌 선택한 글에 강조를 적용한다', async () => {
  const wrapper = editor('강조');
  const input = wrapper.get('textarea');
  input.element.setSelectionRange(0, 2);
  await input.trigger('keydown', { key: 'b', ctrlKey: true });
  await flushPromises();
  expect(input.element.value).toBe('**강조**');
});

it('미리보기는 Markdown 제목과 코드를 보여주며 위험한 HTML은 실행 요소로 남기지 않는다', async () => {
  const wrapper = editor('## 제목\n\n```java\nreturn 1;\n```\n<script>alert(1)</script><img src=x onerror="evil()">');
  await wrapper.get('button[aria-label="미리보기"]').trigger('click');
  const preview = wrapper.get('[aria-label="본문 미리보기"]');
  expect(preview.get('h2').text()).toBe('제목');
  expect(preview.get('pre code').text()).toContain('return 1;');
  expect(preview.find('script, img, [onerror]').exists()).toBe(false);
  expect(wrapper.get('button[aria-label="미리보기"]').attributes('aria-pressed')).toBe('true');
});

it('목록·링크·코드 도구와 분할 보기를 키보드로 접근할 수 있다', async () => {
  const wrapper = editor('항목');
  for (const label of ['제목', '굵게', '기울임', '목록', '인용', '링크', '코드 블록']) {
    expect(wrapper.get(`button[aria-label="${label}"]`).attributes('type')).toBe('button');
  }
  await wrapper.get('button[aria-label="분할 보기"]').trigger('click');
  expect(wrapper.get('textarea').isVisible()).toBe(true);
  expect(wrapper.get('[aria-label="본문 미리보기"]').isVisible()).toBe(true);
});

it('저장 중에는 편집과 도구 동작을 비활성화한다', async () => {
  const wrapper = editor('본문');
  await wrapper.setProps({ disabled: true });
  expect(wrapper.get('textarea').attributes('disabled')).toBeDefined();
  expect(wrapper.get('button[aria-label="굵게"]').attributes('disabled')).toBeDefined();
});
