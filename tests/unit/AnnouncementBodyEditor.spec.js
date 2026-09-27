import { mount } from '@vue/test-utils';
import SafeHtml from '@/components/common/SafeHtml.vue';
import { toAnnouncementFormData } from '@/api/announcements';

it('공고 상세는 첨부 이미지를 보여주되 이벤트와 외부 스타일은 제거한다', () => {
  const wrapper = mount(SafeHtml, { props: { content: '<p>업무</p><img src="/local-files/body.png" alt="교육 공간" onerror="bad()" style="width:9999px">', images: true } });
  expect(wrapper.find('img').exists()).toBe(true);
  expect(wrapper.get('img').attributes()).toMatchObject({ src: '/local-files/body.png', alt: '교육 공간' });
  expect(wrapper.get('img').attributes('onerror')).toBeUndefined();
  expect(wrapper.get('img').attributes('style')).toBeUndefined();
});

it('공고 multipart에 본문 첨부를 순서대로 전달한다', () => {
  const image = new File(['png'], 'body.png', { type: 'image/png' });
  const result = toAnnouncementFormData({ content: '<p>업무</p><img src="attachment:0">', bodyImages: [image], language: ['JAVA'], image: null });
  expect(result.getAll('bodyImages')).toEqual([image]);
  expect(result.get('content')).toContain('attachment:0');
  expect(result.has('image')).toBe(false);
});
