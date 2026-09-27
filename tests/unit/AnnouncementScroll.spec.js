import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementScroll from '@/components/announcement/AnnouncementScroll.vue';
vi.mock('axios');

it('이전 공고에 회사 정보가 없어도 관련 공고를 보여준다', async () => {
  axios.get.mockResolvedValue({ data: [{ id: 1, title: '레거시 공고', company: null, image: '' }] });
  const wrapper = mount(AnnouncementScroll, { global: { mocks: { $router: { push: vi.fn() } } } });
  await flushPromises();
  expect(wrapper.text()).toContain('레거시 공고');
  expect(wrapper.findAll('.anncoucement-scroll-items')).toHaveLength(1);
});
