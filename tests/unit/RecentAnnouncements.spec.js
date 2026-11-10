import { mount } from '@vue/test-utils';
import { recordRecentAnnouncement, readRecentAnnouncements } from '@/composables/useRecentAnnouncements';
import RecentAnnouncements from '@/components/announcement/RecentAnnouncements.vue';

const RouterLinkStub = { name: 'RouterLink', props: ['to'], template: '<a class="router-link-stub"><slot /></a>' };
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

test('최근 본 공고는 계정별로 최신순 20개까지 같은 공고 없이 기록한다', () => {
  for (let id = 1; id <= 22; id++) recordRecentAnnouncement('member', { id, title: `공고 ${id}`, company: 'DEMP' }, Date.parse('2026-11-11T00:00:00Z') + id);
  recordRecentAnnouncement('member', { id: 5, title: '다시 본 공고 5', company: 'DEMP' }, Date.parse('2026-11-12T00:00:00Z'));
  const items = readRecentAnnouncements('member');
  expect(items).toHaveLength(20);
  expect(items.slice(0, 3).map(item => [item.id, item.title])).toEqual([[5, '다시 본 공고 5'], [22, '공고 22'], [21, '공고 21']]);
  expect(items.filter(item => item.id === 5)).toHaveLength(1);
  expect(items[0].viewedAt).toBe('2026-11-12T00:00:00.000Z');
  expect(readRecentAnnouncements('other')).toEqual([]);
  expect(readRecentAnnouncements('')).toEqual([]);
});

test('손상된 기록은 무시하고 저장소를 쓸 수 없어도 화면 흐름을 막지 않는다', () => {
  localStorage.setItem('demp:recent-announcements:member', '{');
  expect(readRecentAnnouncements('member')).toEqual([]);
  localStorage.setItem('demp:recent-announcements:member', JSON.stringify([{ id: 'x', title: 1 }, { id: 3, title: '정상', company: 'DEMP', viewedAt: '2026-11-11T00:00:00.000Z' }]));
  expect(readRecentAnnouncements('member').map(item => item.id)).toEqual([3]);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(() => recordRecentAnnouncement('member', { id: 4, title: '공고', company: 'DEMP' })).not.toThrow();
});

test('목록 위에 이 계정이 최근 본 공고를 보여주고 이 기기 기록을 지울 수 있다', async () => {
  recordRecentAnnouncement('member', { id: 7, title: '백엔드 채용', company: 'DEMP' });
  recordRecentAnnouncement('member', { id: 8, title: '프론트 채용', company: '데모' });
  const wrapper = mount(RecentAnnouncements, { props: { username: 'member' }, global: { stubs: { RouterLink: RouterLinkStub } } });
  const links = wrapper.findAllComponents(RouterLinkStub);
  expect(links.map(link => [link.text(), link.props('to')])).toEqual([['프론트 채용 · 데모', '/detail/8'], ['백엔드 채용 · DEMP', '/detail/7']]);
  expect(wrapper.text()).toContain('이 기기에만 저장됩니다');
  await wrapper.get('button[aria-label="최근 본 공고 기록 지우기"]').trigger('click');
  expect(wrapper.find('[aria-label="최근 본 공고"]').exists()).toBe(false);
  expect(readRecentAnnouncements('member')).toEqual([]);
});

test('로그인하지 않았거나 기록이 없으면 영역을 만들지 않는다', () => {
  recordRecentAnnouncement('member', { id: 7, title: '백엔드 채용', company: 'DEMP' });
  expect(mount(RecentAnnouncements, { props: { username: '' }, global: { stubs: { RouterLink: RouterLinkStub } } }).find('[aria-label="최근 본 공고"]').exists()).toBe(false);
  expect(mount(RecentAnnouncements, { props: { username: 'other' }, global: { stubs: { RouterLink: RouterLinkStub } } }).find('[aria-label="최근 본 공고"]').exists()).toBe(false);
});
