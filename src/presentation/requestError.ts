export function requestErrorMessage(error: unknown): string {
  let status: unknown;
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response;
    if (response && typeof response === 'object' && 'status' in response) status = response.status;
  }
  if (status === 404) return '요청한 내용을 찾을 수 없습니다.';
  if (status === 403) return '접근 권한이 없습니다.';
  if (status === 401) return '로그인이 필요합니다.';
  return '내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
export function safeApplicationUrl(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try { return ['http:', 'https:'].includes(new URL(value, 'https://demp.invalid').protocol) ? value : undefined; }
  catch { return undefined; }
}
