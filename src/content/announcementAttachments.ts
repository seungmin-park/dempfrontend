// Keep 1MB for HTML, other fields and multipart headers under the server's 10MB limit.
export const MAX_ATTACHMENT_BYTES = 9 * 1024 * 1024;
export function announcementAttachmentError(cover: File | null, body: File[] = []): string {
  const all = cover ? [cover, ...body] : body;
  if (body.length > 10) return '본문 이미지는 최대 10개까지 추가할 수 있습니다.';
  if (all.some(file => !['image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024))
    return '이미지는 각각 5MB 이하의 JPEG 또는 PNG 파일이어야 합니다.';
  if (all.reduce((sum, file) => sum + file.size, 0) > MAX_ATTACHMENT_BYTES)
    return '대표 이미지와 본문 이미지는 합계 9MB 이하로 첨부해 주세요.';
  return '';
}
