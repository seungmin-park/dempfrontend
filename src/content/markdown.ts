import { marked } from 'marked';
import TurndownService from 'turndown';
import { sanitizeHtml } from './sanitizeHtml';

const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
// Preserve supported HTML that the built-in converter cannot round-trip.
converter.keep(['u', 'table', 'del']);

export function renderMarkdown(source: string): string {
  return sanitizeHtml(marked.parse(source, { async: false, gfm: true }));
}

export function markdownFromHtml(html: string): string {
  return converter.turndown(sanitizeHtml(html));
}
