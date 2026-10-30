import { mount } from '@vue/test-utils';
import DiscoveryPage from '@/views/announcement/AnnouncementList.vue';

function page() {
  return mount(DiscoveryPage, { global: { stubs: {
    AnnouncementHeader: { template: '<div data-test="live-filters">실제 검색 조건</div>' },
    AnnouncementList: { template: '<div data-test="live-list">실제 공고 목록</div>' },
    RouterLink: true,
  } } });
}

test('첫 화면은 목업의 커리어 안내와 실제 공고 검색·목록을 함께 표시한다', () => {
  const wrapper = page();
  expect(wrapper.get('h1').text()).toContain('다음 커리어의 시작,');
  expect(wrapper.get('h1').text()).toContain('내 조건에 맞게.');
  expect(wrapper.findAll('[data-test="live-filters"]')).toHaveLength(1);
  expect(wrapper.findAll('[data-test="live-list"]')).toHaveLength(1);
  const action = wrapper.get('a.discovery-primary-action');
  expect(action.text()).toContain('내 조건으로 찾아보기');
  const target = wrapper.get(action.attributes('href'));
  expect(target.find('[data-test="live-filters"]').exists()).toBe(true);
  expect(target.find('[data-test="live-list"]').exists()).toBe(true);
});

test('이용 안내는 현재 인증·원본 지원 정책을 설명하고 실제 질문 경로를 제공한다', () => {
  const wrapper = page();
  expect(wrapper.text()).toContain('목록은 가입 없이');
  expect(wrapper.text()).toContain('상세 조회와 관심 공고 저장에는 로그인이 필요합니다');
  expect(wrapper.text()).toContain('원본 모집 페이지');
  expect(wrapper.findAll('details')).toHaveLength(6);
  expect(wrapper.find('router-link-stub[to="/question"]').exists()).toBe(true);
  expect(wrapper.text()).not.toContain('모노랩스');
});
