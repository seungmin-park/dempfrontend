import { renderMarkdown, markdownFromHtml } from '@/content/markdown';

it('제목·목록·코드·표·링크를 안전한 저장 HTML로 변환한다', () => {
  const html = renderMarkdown('## 제목\n\n- 목록\n\n```js\nconst x = 1;\n```\n\n| 언어 |\n| --- |\n| Java |\n\n[지원](https://example.com)');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  expect(doc.querySelector('h2')?.textContent).toBe('제목');
  expect(doc.querySelector('li')?.textContent).toBe('목록');
  expect(doc.querySelector('pre code')?.textContent).toContain('const x = 1;');
  expect(doc.querySelector('td')?.textContent).toBe('Java');
  expect(doc.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
});

it('Markdown의 HTML 및 링크 입력은 XSS 실행 요소와 위험 주소를 제거한다', () => {
  const html = renderMarkdown('[위험](javascript:alert%281%29)\n\n<img src=x onerror=evil()><svg onload=evil()></svg><p onclick=evil()>본문</p>');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  expect(doc.querySelector('img, svg, script, [onclick], [onerror]')).toBeNull();
  expect(doc.querySelector('a')?.hasAttribute('href')).toBe(false);
});

it('기존 HTML 글은 다시 편집해도 강조·밑줄·목록·코드·링크·표가 유지된다', () => {
  const oldHtml = '<h2>기존 제목</h2><p><strong>강조</strong> <u>밑줄</u> <em>기울임</em></p><ul><li>목록</li></ul><pre><code>print(1)\nprint(2)</code></pre><p><a href="/questions/1">링크</a></p><table><tbody><tr><td>값</td></tr></tbody></table>';
  const markdown = markdownFromHtml(oldHtml);
  expect(markdown).toContain('## 기존 제목');
  expect(markdown).toContain('**강조**');
  const doc = new DOMParser().parseFromString(renderMarkdown(markdown), 'text/html');
  for (const [selector, text] of [['h2', '기존 제목'], ['strong', '강조'], ['u', '밑줄'], ['em', '기울임'], ['li', '목록'], ['code', 'print(1)\nprint(2)'], ['td', '값']]) {
    expect(doc.querySelector(selector)?.textContent.trim()).toBe(text);
  }
  expect(doc.querySelector('a').getAttribute('href')).toBe('/questions/1');
});
