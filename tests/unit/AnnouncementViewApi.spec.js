import { vi } from 'vitest';
import axios from 'axios';
import * as announcements from '@/api/announcements';
vi.mock('axios');
afterEach(() => vi.resetAllMocks());
test('순수 공고 상세 API는 집계 제외 조건을 명시한다', async () => {
  axios.get.mockResolvedValue({ data: { company: null } });
  await announcements.getAnnouncementDetail(71);
  expect(axios.get).toHaveBeenCalledExactlyOnceWith('/api/announce/detail/71', { params: { recordView: false } });
});
test('공개 방문 API는 기본 집계 요청과 정규화한 응답을 사용한다', async () => {
  axios.get.mockResolvedValue({ data: { company: { name: 'DEMP' }, hits: 1, announcementType: 'EMP' } });
  expect(typeof announcements.viewAnnouncement).toBe('function');
  const result = await announcements.viewAnnouncement(71);
  expect(axios.get).toHaveBeenCalledExactlyOnceWith('/api/announce/detail/71');
  expect(result).toMatchObject({ company: 'DEMP', hits: 1, type: 'EMP' });
});
