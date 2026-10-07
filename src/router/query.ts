import type { LocationQueryValue } from 'vue-router';

export function queryText(value: LocationQueryValue | LocationQueryValue[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function queryTags(value: LocationQueryValue | LocationQueryValue[] | undefined): string[] {
  return [...new Set((Array.isArray(value) ? value : [value]).flatMap(tag => tag ? tag.split(',').filter(Boolean) : []))];
}

export function routeId(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
