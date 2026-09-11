/**
 * Minimal, safe rich text rendering.
 *
 * Article and rules content is stored as plain text with light markdown-ish
 * conventions. We escape first and only then add our own markup, so stored
 * content can never inject HTML (XSS-safe by construction).
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderRichText(value: string): string {
  const escaped = escapeHtml(value.trim());
  if (!escaped) return '';

  return escaped
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');

      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        const items = lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }

      const heading = block.match(/^(#{2,3})\s+(.*)$/);
      if (heading) {
        const level = heading[1]!.length;
        return `<h${level}>${inline(heading[2]!)}</h${level}>`;
      }

      return `<p>${inline(block.replace(/\n/g, '<br />'))}</p>`;
    })
    .join('');
}

function inline(value: string): string {
  return value
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Plain-text excerpt used for meta descriptions. */
export function excerpt(value: string, max = 160): string {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}
