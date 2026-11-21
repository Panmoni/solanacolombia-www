// Turns the group's Markdown texts (content/telegram/*.md) into Telegram HTML.
// Telegram's HTML mode has no headings or lists, so headings become bold lines
// and list markers become bullets. Covers only the Markdown those files use.

export const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const formatInline = (line: string): string =>
  escapeHtml(line)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

export const markdownToTelegramHtml = (markdown: string): string =>
  markdown
    .trim()
    .split('\n')
    .map((line) => {
      const heading = line.match(/^#{1,6}\s+(.*)$/);
      if (heading) {
        return `<b>${formatInline(heading[1])}</b>`;
      }
      const bullet = line.match(/^\s*[-*]\s+(.*)$/);
      if (bullet) {
        return `• ${formatInline(bullet[1])}`;
      }
      return formatInline(line);
    })
    .join('\n');
