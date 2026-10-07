import { vi } from 'vitest';
import { apiClient } from '@/api/client';
import { getQuestionDetail } from '@/api/questions';

test('편집용 질문 조회는 조회수 집계에서 제외하는 HTTP 조건을 전달한다', async () => {
  const response = { data: { id: 17, hits: 3 } };
  const request = vi.spyOn(apiClient, 'get').mockResolvedValue(response);
  try {
    expect(await getQuestionDetail(17)).toBe(response);
    expect(request).toHaveBeenCalledWith('/api/question/detail/17', { params: { recordView: false } });
  } finally {
    request.mockRestore();
  }
});
