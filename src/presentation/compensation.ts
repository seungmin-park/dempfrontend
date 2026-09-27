import type { SalaryStatus } from '@/types/api';
export function formatTuition(payment?: number | null): string {
  if (payment == null) return '교육비 정보 없음';
  return payment === 0 ? '무료 교육' : `교육비 ${payment.toLocaleString('ko-KR')}만원`;
}
export function formatSalary(item: { payment?: number | null; salaryMax?: number | null; salaryStatus?: SalaryStatus }): string {
  if (item.salaryStatus === 'NEGOTIABLE') return '연봉 협의';
  if (item.salaryStatus === 'UNDISCLOSED' || !item.payment) return '연봉 미공개';
  const minimum = item.payment.toLocaleString('ko-KR');
  return `연봉 ${minimum}${item.salaryMax != null && item.salaryMax !== item.payment ? '~' + item.salaryMax.toLocaleString('ko-KR') : ''}만원`;
}
export function compensationError(item: { type: string; payment: number | null; salaryMax?: number | null; salaryStatus?: SalaryStatus }): string {
  if (item.payment != null && (!Number.isInteger(item.payment) || item.payment < 0)) return '금액은 0 이상의 정수로 입력해 주세요.';
  if (item.type !== 'EMP' || item.salaryStatus === 'UNDISCLOSED' || item.salaryStatus === 'NEGOTIABLE') return '';
  if (item.salaryStatus === 'DISCLOSED' && !item.payment) return '공개 연봉을 입력해 주세요.';
  if (item.salaryMax != null && (!Number.isInteger(item.salaryMax) || item.payment == null || item.salaryMax < item.payment)) return '연봉 상한은 최소 금액 이상이어야 합니다.';
  return '';
}
