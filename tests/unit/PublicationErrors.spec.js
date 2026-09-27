import { mutationErrorMessage } from '@/presentation/requestError';
it('중복 공고는 제목 변경 대신 원문 기관 기수 확인을 안내한다', () => {
  const message = mutationErrorMessage({ response: { status: 409 } });
  expect(message).toContain('원문'); expect(message).toContain('기수'); expect(message).not.toContain('제목을 바꾸');
});
