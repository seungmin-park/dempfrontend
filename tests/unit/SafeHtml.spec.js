import { mount } from '@vue/test-utils';
import SafeHtml from '@/components/common/SafeHtml.vue';

test.each(['javascript:alert(1)', 'jav&#x61;script:alert(1)', 'java&#10;script:alert(1)', 'data:text/html,evil', 'vbscript:evil', 'ftp://example.com'])('허용하지 않은 링크 주소 %s를 제거한다', (href) => {
  const wrapper = mount(SafeHtml, { props: { content: `<a href="${href}">링크</a>` } });
  expect(wrapper.get('a').attributes('href')).toBeUndefined();
});

test.each(['http://example.com', 'https://example.com', 'mailto:test@example.com', '/question/1', '../question/1', '#answer', '?page=2'])('허용한 링크 주소 %s를 보존한다', (href) => {
  const wrapper = mount(SafeHtml, { props: { content: `<a href="${href}">링크</a>` } });
  expect(wrapper.get('a').attributes('href')).toBe(href);
});

test('명시한 편집 서식만 보존하며 namespace 요소와 임의 속성을 제거한다', () => {
  const wrapper = mount(SafeHtml, { props: { content: '<b>B</b><strong>S</strong><i>I</i><em>E</em><u>U</u><p>P<br></p><ul><li>L</li></ul><ol><li>O</li></ol><blockquote>Q</blockquote><pre><code>C</code></pre><svg onload="evil()"><a href="javascript:evil()">X</a></svg><math><mtext>X</mtext></math><iframe srcdoc="evil"></iframe><p id="x" class="x" data-x="x" aria-label="x" style="color:red">속성 없음</p>' } });
  expect(wrapper.element.querySelector('svg, math, iframe, [id], [class], [data-x], [aria-label], [style]')).toBeNull();
  for (const tag of ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code']) {
    expect(wrapper.find(tag).exists()).toBe(true);
  }
});

test('새 콘텐츠가 전달되면 다시 정화하고 빈 콘텐츠도 표시한다', async () => {
  const wrapper = mount(SafeHtml, { props: { content: '<strong>기존</strong>' } });
  await wrapper.setProps({ content: '<p onmouseover="evil()">새 글<img src=x onerror="evil()"></p>' });
  expect(wrapper.text()).toBe('새 글');
  expect(wrapper.find('img, [onmouseover]').exists()).toBe(false);
  await wrapper.setProps({ content: '' });
  expect(wrapper.text()).toBe('');
});

test('Markdown 제목·표·취소선은 보존하고 표의 이벤트 속성은 제거한다', () => {
  const wrapper = mount(SafeHtml, { props: { content: '<h2>제목</h2><hr><del>삭제</del><table><thead><tr><th>언어</th></tr></thead><tbody><tr><td onclick="evil()">Java</td></tr></tbody></table>' } });
  expect(wrapper.get('h2').text()).toBe('제목');
  expect(wrapper.get('th').text()).toBe('언어');
  expect(wrapper.get('td').text()).toBe('Java');
  expect(wrapper.get('td').attributes('onclick')).toBeUndefined();
  expect(wrapper.find('hr').exists()).toBe(true);
  expect(wrapper.get('del').text()).toBe('삭제');
});
