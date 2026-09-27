import { marked } from 'marked';
import TurndownService from 'turndown';
import { sanitizeHtml } from './sanitizeHtml';

const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
// Underlines and arbitrary legacy tables have no lossless CommonMark equivalent.
converter.keep(['u', 'table']);

export function renderMarkdown(source: string): string {
  return sanitizeHtml(marked.parse(source, { async: false, gfm: true }));
}

export function markdownFromHtml(html: string): string {
  return converter.turndown(sanitizeHtml(html));
}
