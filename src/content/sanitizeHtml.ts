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

// Announcement images have already been checked against the owning announcement by the server.
export function sanitizeAnnouncementHtml(content: string, preview = false): string {
  const clean = DOMPurify.sanitize(content, { ...htmlPolicy,
    ALLOWED_TAGS: [...htmlPolicy.ALLOWED_TAGS, 'img'], ALLOWED_ATTR: ['href', 'src', 'alt'],
    ALLOWED_URI_REGEXP: preview ? /^(?:(?:https?|mailto|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i : htmlPolicy.ALLOWED_URI_REGEXP,
  });
  const document = new DOMParser().parseFromString(clean, 'text/html');
  document.querySelectorAll('img').forEach(image => {
    const src = image.getAttribute('src') || '';
    if (!/^(https?:\/\/|\/(?!\/))/i.test(src) && !(preview && src.startsWith('blob:'))) image.remove();
  });
  return document.body.innerHTML;
}

export function hasTextContent(html: string): boolean {
  return Boolean(new DOMParser().parseFromString(sanitizeHtml(html), 'text/html').body.textContent?.trim());
}
