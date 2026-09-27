import type { LocationQueryValue } from 'vue-router';

export function queryText(value: LocationQueryValue | LocationQueryValue[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function routeId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? '' : value;
}
