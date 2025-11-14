import MarkdownIt from 'markdown-it'

/**
 * Lightweight Markdown renderer configured for quest content with safe links.
 */

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const defaultLinkRenderer = md.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]

  const targetIndex = token.attrIndex('target')
  if (targetIndex < 0) token.attrPush(['target', '_blank'])
  else token.attrs[targetIndex][1] = '_blank'

  const relIndex = token.attrIndex('rel')
  if (relIndex < 0) token.attrPush(['rel', 'noopener noreferrer'])
  else token.attrs[relIndex][1] = 'noopener noreferrer'

  return defaultLinkRenderer(tokens, idx, options, env, self)
}

export function renderMarkdown(source?: string | null) {
  if (!source) return ''
  return md.render(source)
}
