function responseStatus(error: unknown): unknown {
  let status: unknown;
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response;
    if (response && typeof response === 'object' && 'status' in response) status = response.status;
  }
  return status;
}
export function requestErrorMessage(error: unknown): string {
  const status = responseStatus(error);
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

export function mutationErrorMessage(error: unknown): string {
  const status = responseStatus(error);
  if (status === 400) return '입력값을 확인해 주세요. 이미지 형식·크기와 필수 항목도 확인해 주세요.';
  if (status === 409) return '같은 원문·기관·기수의 공고가 있습니다. 기존 공고를 확인하고 수정해 주세요.';
  if (status === 401 || status === 403 || status === 404) return requestErrorMessage(error);
  return '변경을 저장하지 못했습니다. 입력한 내용은 유지되니 다시 시도해 주세요.';
}
