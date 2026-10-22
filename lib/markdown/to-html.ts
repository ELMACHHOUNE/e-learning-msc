const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const FENCE_RE = /^\s*(`{3,}|~{3,})\s*(.*)$/
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const HR_RE = /^\s*([-*_])(?:\s*\1){2,}\s*$/
const QUOTE_RE = /^\s*>/
const LIST_RE = /^\s*([-*+]|\d+[.)])\s+/

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch)
}

function sanitizeHref(raw: string): string | null {
  const url = raw.trim()
  if (!url) return null
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url
  if (url.startsWith('/') || url.startsWith('#')) return url
  return null
}

function renderInline(text: string): string {
  const tokens: string[] = []
  const stash = (html: string) => {
    tokens.push(html)
    return `\u0000${tokens.length - 1}\u0000`
  }

  let source = text

  source = source.replace(/`([^`]+)`/g, (_m, code: string) => stash(`<code>${escapeHtml(code)}</code>`))

  source = source.replace(
    /!\[([^\]]*)\]\(([^\s()]+(?:\([^\s()]*\)[^\s()]*)*)(?:\s+"([^"]*)")?\)/g,
    (_m, alt: string, src: string, title?: string) => {
      const href = sanitizeHref(src)
      if (!href) return escapeHtml(alt)
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
      return stash(`<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${titleAttr} />`)
    },
  )

  source = source.replace(
    /\[([^\]]+)\]\(([^\s()]+(?:\([^\s()]*\)[^\s()]*)*)(?:\s+"([^"]*)")?\)/g,
    (_m, label: string, href: string, title?: string) => {
      const safe = sanitizeHref(href)
      if (!safe) return escapeHtml(label)
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
      const external = /^https?:/i.test(safe)
      const relAttr = external ? ' target="_blank" rel="noopener noreferrer"' : ''
      return stash(`<a href="${escapeHtml(safe)}"${titleAttr}${relAttr}>${renderInline(label)}</a>`)
    },
  )

  let html = escapeHtml(source)

  html = html
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\n]+)_/g, '$1<em>$2</em>')

  return html.replace(/\u0000(\d+)\u0000/g, (_m, index: string) => tokens[Number(index)] ?? '')
}

function isBlockStart(line: string): boolean {
  return FENCE_RE.test(line) || HEADING_RE.test(line) || HR_RE.test(line) || QUOTE_RE.test(line) || LIST_RE.test(line)
}

function parseTableRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    const fence = line.match(FENCE_RE)
    if (fence) {
      const marker = line.trim()[0]
      const seq = marker.repeat(3)
      const lang = (fence[2] ?? '').trim().split(/\s+/)[0] ?? ''
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith(seq)) {
        code.push(lines[i])
        i++
      }
      if (i < lines.length) i++
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : ''
      out.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      const level = Math.min(heading[1].length + 2, 6)
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      i++
      continue
    }

    if (HR_RE.test(line)) {
      out.push('<hr />')
      i++
      continue
    }

    if (QUOTE_RE.test(line)) {
      const quote: string[] = []
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${markdownToHtml(quote.join('\n'))}</blockquote>`)
      continue
    }

    const listItem = line.match(LIST_RE)
    if (listItem) {
      const ordered = /\d/.test(listItem[1])
      const items: string[] = []
      while (i < lines.length) {
        const current = lines[i].match(LIST_RE)
        if (!current || /\d/.test(current[1]) !== ordered) break
        let content = lines[i].replace(LIST_RE, '')
        i++
        while (
          i < lines.length &&
          lines[i].trim() !== '' &&
          !LIST_RE.test(lines[i]) &&
          /^\s+/.test(lines[i])
        ) {
          content += ` ${lines[i].trim()}`
          i++
        }
        items.push(`<li>${renderInline(content)}</li>`)
      }
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${items.join('')}</${tag}>`)
      continue
    }

    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      lines[i + 1].includes('-') &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])
    ) {
      const headers = parseTableRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) {
        rows.push(parseTableRow(lines[i]))
        i++
      }
      const thead = `<thead><tr>${headers.map((h) => `<th>${renderInline(h)}</th>`).join('')}</tr></thead>`
      const tbody = `<tbody>${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`
      out.push(`<table>${thead}${tbody}</table>`)
      continue
    }

    const paragraph: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim())
      i++
    }
    if (paragraph.length > 0) {
      out.push(`<p>${renderInline(paragraph.join('\n')).replace(/\n/g, '<br />')}</p>`)
    }
  }

  return out.join('\n')
}
