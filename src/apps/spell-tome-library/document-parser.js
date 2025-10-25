/**
 * Document Parser
 * Parses and renders various document formats (markdown, text, code)
 */

/**
 * Render document content
 * @param {string} content - Document content
 * @param {string} fileName - File name for format detection
 * @returns {Object} { html: string, sections: Array }
 */
export function renderDocument(content, fileName = '') {
  const ext = getFileExtension(fileName);
  
  switch (ext) {
    case 'md':
    case 'markdown':
      return renderMarkdown(content);
    case 'js':
    case 'javascript':
    case 'ts':
    case 'typescript':
    case 'py':
    case 'python':
    case 'css':
    case 'html':
    case 'json':
      return renderCode(content, ext);
    default:
      return renderPlainText(content);
  }
}

/**
 * Render markdown content
 * @param {string} markdown - Markdown text
 * @returns {Object} { html: string, sections: Array }
 */
function renderMarkdown(markdown) {
  const sections = [];
  let html = markdown;
  
  // Extract sections for navigation
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  let headerId = 0;
  
  while ((match = headerRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = `section-${headerId++}`;
    
    sections.push({ id, level, text });
  }
  
  // Convert markdown to HTML (simplified version)
  html = html
    // Headers with IDs
    .replace(/^######\s+(.+)$/gm, (match, text, offset) => {
      const id = `section-${getSectionIndex(markdown, offset)}`;
      return `<h6 id="${id}">${escapeHtml(text)}</h6>`;
    })
    .replace(/^#####\s+(.+)$/gm, (match, text, offset) => {
      const id = `section-${getSectionIndex(markdown, offset)}`;
      return `<h5 id="${id}">${escapeHtml(text)}</h5>`;
    })
    .replace(/^####\s+(.+)$/gm, (match, text, offset) => {
      const id = `section-${getSectionIndex(markdown, offset)}`;
      return `<h4 id="${id}">${escapeHtml(text)}</h4>`;
    })
    .replace(/^###\s+(.+)$/gm, (match, text, offset) => {
      const id = `section-${getSectionIndex(markdown, offset)}`;
      return `<h3 id="${id}">${escapeHtml(text)}</h3>`;
    })
    .replace(/^##\s+(.+)$/gm, (match, text, offset) => {
      const id = `section-${getSectionIndex(markdown, offset)}`;
      return `<h2 id="${id}">${escapeHtml(text)}</h2>`;
    })
    .replace(/^#\s+(.+)$/gm, (match, text, offset) => {
      const id = `section-${getSectionIndex(markdown, offset)}`;
      return `<h1 id="${id}">${escapeHtml(text)}</h1>`;
    })
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]+?)```/g, (match, lang, code) => {
      return `<pre class="code-block language-${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`;
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Unordered lists
    .replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    .replace(/^\*\*\*$/gm, '<hr>')
    // Paragraphs (wrap non-tag lines)
    .split('\n\n')
    .map(para => {
      para = para.trim();
      if (!para) return '';
      if (para.startsWith('<') || para.startsWith('```')) return para;
      if (para.match(/^<\/?(h[1-6]|li|blockquote|hr|pre)/)) return para;
      return `<p>${para}</p>`;
    })
    .join('\n');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, match => {
    return `<ul>${match}</ul>`;
  });
  
  return { html, sections };
}

/**
 * Get section index for a header at given offset
 */
function getSectionIndex(markdown, offset) {
  const headers = Array.from(markdown.matchAll(/^#{1,6}\s+.+$/gm));
  return headers.findIndex(match => match.index === offset);
}

/**
 * Render code with syntax highlighting
 * @param {string} code - Code content
 * @param {string} language - Programming language
 * @returns {Object} { html: string, sections: Array }
 */
function renderCode(code, language) {
  const html = `
    <div class="code-viewer">
      <div class="code-header">
        <span class="code-language">${getLanguageName(language)}</span>
        <span class="code-lines">${code.split('\n').length} lines</span>
      </div>
      <pre class="code-content language-${language}"><code>${escapeHtml(code)}</code></pre>
    </div>
  `;
  
  return { html, sections: [] };
}

/**
 * Render plain text
 * @param {string} text - Plain text content
 * @returns {Object} { html: string, sections: Array }
 */
function renderPlainText(text) {
  const paragraphs = text.split(/\n\n+/);
  
  const html = paragraphs
    .map(para => {
      para = para.trim();
      if (!para) return '';
      
      // Preserve line breaks within paragraphs
      const lines = para.split('\n').map(escapeHtml).join('<br>');
      return `<p>${lines}</p>`;
    })
    .filter(Boolean)
    .join('\n');
  
  return { html, sections: [] };
}

/**
 * Get file extension from filename
 * @param {string} fileName - File name
 * @returns {string} Extension
 */
function getFileExtension(fileName) {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Get human-readable language name
 * @param {string} ext - File extension
 * @returns {string} Language name
 */
function getLanguageName(ext) {
  const languages = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    css: 'CSS',
    html: 'HTML',
    json: 'JSON',
    md: 'Markdown',
    markdown: 'Markdown',
    txt: 'Text'
  };
  
  return languages[ext] || ext.toUpperCase();
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
