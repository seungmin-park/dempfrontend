// Registration follows BCrypt's byte limit. Existing passwords are never shortened at login.
export function validateRegistrationPassword(value: unknown): true | string {
  if (typeof value !== 'string' || !value.trim()) return '비밀번호를 입력해 주세요.';
  if (new TextEncoder().encode(value).byteLength > 72) {
    return '비밀번호가 너무 깁니다. 영문·숫자는 최대 72자, 한글은 최대 24자까지 입력할 수 있습니다.';
  }
  return true;
}
