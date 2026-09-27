import DOMPurify from 'dompurify';

// Kept in sync with the server ContentSanitizer. Content never gains active attributes.
const htmlPolicy = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
  ALLOWED_ATTR: ['href'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

export function sanitizeHtml(content: string | null | undefined): string {
  return DOMPurify.sanitize(content ?? '', htmlPolicy);
}
