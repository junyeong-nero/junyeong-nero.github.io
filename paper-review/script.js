(function attachPaperReviewApp(root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.PaperReviewApp = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createPaperReviewApp() {
  const DEFAULT_STATE = {
    query: '',
    tags: [],
    sort: 'newest',
  };

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function normalizeAssets(value) {
    const assets = value && typeof value === 'object' ? value : {};

    return {
      figures: normalizeArray(assets.figures),
      tables: normalizeArray(assets.tables),
    };
  }

  function coerceReviewData(payload) {
    const source = Array.isArray(payload) ? payload : payload && Array.isArray(payload.reviews) ? payload.reviews : [];

    return source.map((review) => ({
      id: String(review.id || ''),
      slug: String(review.slug || review.id || ''),
      title: String(review.title || 'Untitled paper'),
      authors: normalizeArray(review.authors).map(String),
      publishedAt: String(review.publishedAt || ''),
      reviewedAt: String(review.reviewedAt || ''),
      summary: String(review.summary || ''),
      tags: normalizeArray(review.tags).map(String),
      arxivUrl: String(review.arxivUrl || ''),
      pdfUrl: String(review.pdfUrl || ''),
      reviewPath: String(review.reviewPath || ''),
      assets: normalizeAssets(review.assets),
    }));
  }

  function getAllTags(reviews) {
    return Array.from(new Set(reviews.flatMap((review) => review.tags))).sort((a, b) => a.localeCompare(b));
  }

  function reviewSearchBlob(review) {
    return normalizeText([
      review.id,
      review.slug,
      review.title,
      review.summary,
      review.authors.join(' '),
      review.tags.join(' '),
    ].join(' '));
  }

  function filterReviews(reviews, state = DEFAULT_STATE) {
    const query = normalizeText(state.query);
    const selectedTags = new Set(normalizeArray(state.tags));

    return reviews.filter((review) => {
      const queryMatches = !query || reviewSearchBlob(review).includes(query);
      const tagMatches = selectedTags.size === 0 || Array.from(selectedTags).every((tag) => review.tags.includes(tag));

      return queryMatches && tagMatches;
    });
  }

  function dateValue(review) {
    const value = Date.parse(review.reviewedAt || review.publishedAt || '');
    return Number.isNaN(value) ? 0 : value;
  }

  function sortReviews(reviews, sort = 'newest') {
    const copy = reviews.slice();

    if (sort === 'title') {
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    }

    return copy.sort((a, b) => dateValue(b) - dateValue(a));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatAuthors(authors) {
    if (!authors.length) return 'Unknown authors';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')} +${authors.length - 3}`;
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  }

  function mediaItems(review) {
    return [...review.assets.figures, ...review.assets.tables].slice(0, 3);
  }

  function getReviewUrl(review) {
    return `review.html?slug=${encodeURIComponent(review.slug)}`;
  }

  function safeUrl(value) {
    const url = String(value || '').trim();
    if (/^javascript:/i.test(url)) return '#';
    return url;
  }

  function resolveMarkdownPath(path, reviewPath = '') {
    const value = String(path || '').trim();
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) {
      return value;
    }
    if (value.startsWith('assets/')) {
      return value;
    }

    try {
      const resolved = new URL(value, `https://paper-review.local/${reviewPath || ''}`);
      return resolved.pathname.replace(/^\/+/, '');
    } catch {
      return value;
    }
  }

  function renderInlineMarkdown(value, context = {}) {
    return escapeHtml(value).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const resolvedHref = safeUrl(resolveMarkdownPath(href, context.reviewPath));
      const isExternal = /^https?:\/\//i.test(resolvedHref);
      return `<a href="${escapeHtml(resolvedHref)}"${isExternal ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
  }

  function renderMarkdownImage(line, context = {}) {
    const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (!match) return '';

    const alt = match[1] || 'Paper figure';
    const src = resolveMarkdownPath(match[2], context.reviewPath);
    return `
      <figure class="review-figure">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">
        ${alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ''}
      </figure>
    `;
  }

  function markdownToHtml(markdown, context = {}) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let paragraph = [];
    let listType = '';
    let listItems = [];
    let mathLines = null;

    function flushParagraph() {
      if (!paragraph.length) return;
      html.push(`<p>${renderInlineMarkdown(paragraph.join(' '), context)}</p>`);
      paragraph = [];
    }

    function flushList() {
      if (!listType) return;
      html.push(`<${listType}>${listItems.map((item) => `<li>${renderInlineMarkdown(item, context)}</li>`).join('')}</${listType}>`);
      listType = '';
      listItems = [];
    }

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (mathLines) {
        if (trimmed === '\\]') {
          html.push(`<div class="math-block">${escapeHtml(mathLines.join('\n'))}</div>`);
          mathLines = null;
        } else {
          mathLines.push(line);
        }
        continue;
      }

      if (!trimmed) {
        flushParagraph();
        flushList();
        continue;
      }

      if (trimmed === '\\[') {
        flushParagraph();
        flushList();
        mathLines = [];
        continue;
      }

      const image = renderMarkdownImage(trimmed, context);
      if (image) {
        flushParagraph();
        flushList();
        html.push(image);
        continue;
      }

      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        html.push(`<h${heading[1].length}>${renderInlineMarkdown(heading[2], context)}</h${heading[1].length}>`);
        continue;
      }

      const unordered = trimmed.match(/^-\s+(.+)$/);
      if (unordered) {
        flushParagraph();
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listItems.push(unordered[1]);
        continue;
      }

      const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
      if (ordered) {
        flushParagraph();
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        listItems.push(ordered[1]);
        continue;
      }

      paragraph.push(trimmed);
    }

    flushParagraph();
    flushList();
    if (mathLines) {
      html.push(`<div class="math-block">${escapeHtml(mathLines.join('\n'))}</div>`);
    }

    return html.join('\n');
  }

  function renderTagButton(tag, activeTags) {
    const isActive = activeTags.includes(tag);

    return `<button type="button" class="tag-chip${isActive ? ' active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
  }

  function renderMediaPreview(review) {
    const items = mediaItems(review);
    if (!items.length) return '';

    return `
      <div class="media-strip" aria-label="Captured figures and tables">
        ${items.map((item) => `
          <figure class="media-thumb">
            <img src="${escapeHtml(item.path)}" alt="${escapeHtml(item.caption || 'Paper figure or table capture')}" loading="lazy">
            <figcaption>${escapeHtml(item.caption || `Page ${item.page || ''}`)}</figcaption>
          </figure>
        `).join('')}
      </div>
    `;
  }

  function renderReviewCard(review) {
    const published = formatDate(review.publishedAt);
    const reviewed = formatDate(review.reviewedAt);

    return `
      <article class="review-card">
        <div class="review-main">
          <p class="review-meta">
            <span>${escapeHtml(review.id)}</span>
            ${published ? `<span>${escapeHtml(published)}</span>` : ''}
            ${reviewed ? `<span>Reviewed ${escapeHtml(reviewed)}</span>` : ''}
          </p>
          <h2>${escapeHtml(review.title)}</h2>
          <p class="review-authors">${escapeHtml(formatAuthors(review.authors))}</p>
          <p class="review-summary">${escapeHtml(review.summary || 'Review summary will be added during ingest.')}</p>
          <div class="review-tags">
            ${review.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        ${renderMediaPreview(review)}
        <div class="review-actions">
          ${review.arxivUrl ? `<a href="${escapeHtml(review.arxivUrl)}" target="_blank" rel="noopener">arXiv</a>` : ''}
          ${review.pdfUrl ? `<a href="${escapeHtml(review.pdfUrl)}" target="_blank" rel="noopener">PDF</a>` : ''}
          ${review.reviewPath ? `<a href="${escapeHtml(getReviewUrl(review))}">Review</a>` : ''}
        </div>
      </article>
    `;
  }

  function renderTagFilters(tags, activeTags, tagContainer) {
    if (!tagContainer) return;

    tagContainer.innerHTML = [
      `<button type="button" class="tag-chip${activeTags.length === 0 ? ' active' : ''}" data-tag="">All</button>`,
      ...tags.map((tag) => renderTagButton(tag, activeTags)),
    ].join('');
  }

  function renderReviewList(reviews, state, elements) {
    const filtered = sortReviews(filterReviews(reviews, state), state.sort);
    renderTagFilters(getAllTags(reviews), state.tags, elements.tags);

    if (elements.count) {
      elements.count.textContent = `${filtered.length} review${filtered.length === 1 ? '' : 's'}`;
    }

    if (!elements.list) return filtered;

    if (!filtered.length) {
      elements.list.innerHTML = `
        <div class="empty-state">
          <h2>No matching reviews</h2>
          <p>Try a different search term or clear the selected tags.</p>
        </div>
      `;
      return filtered;
    }

    elements.list.innerHTML = filtered.map(renderReviewCard).join('');
    return filtered;
  }

  function bindControls(reviews, state, elements) {
    if (elements.search) {
      elements.search.addEventListener('input', (event) => {
        state.query = event.target.value;
        renderReviewList(reviews, state, elements);
      });
    }

    if (elements.sort) {
      elements.sort.addEventListener('change', (event) => {
        state.sort = event.target.value;
        renderReviewList(reviews, state, elements);
      });
    }

    if (elements.tags) {
      elements.tags.addEventListener('click', (event) => {
        const button = event.target.closest('[data-tag]');
        if (!button) return;

        const tag = button.dataset.tag;
        if (!tag) {
          state.tags = [];
        } else if (state.tags.includes(tag)) {
          state.tags = state.tags.filter((selected) => selected !== tag);
        } else {
          state.tags = [...state.tags, tag];
        }

        renderReviewList(reviews, state, elements);
      });
    }
  }

  async function loadReviews(url = 'data/reviews.json') {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load reviews: ${response.status}`);
    }

    return coerceReviewData(await response.json());
  }

  async function loadReviewMarkdown(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load review: ${response.status}`);
    }

    return response.text();
  }

  function getSlugFromLocation(locationRef) {
    const search = locationRef && typeof locationRef.search === 'string' ? locationRef.search : '';
    return new URLSearchParams(search).get('slug') || '';
  }

  function findReviewBySlug(reviews, slug) {
    return reviews.find((review) => review.slug === slug || review.id === slug);
  }

  function renderReviewDetail(review, markdown) {
    const published = formatDate(review.publishedAt);
    const reviewed = formatDate(review.reviewedAt);

    return `
      <article class="review-detail">
        <p class="review-meta">
          <span>${escapeHtml(review.id)}</span>
          ${published ? `<span>${escapeHtml(published)}</span>` : ''}
          ${reviewed ? `<span>Reviewed ${escapeHtml(reviewed)}</span>` : ''}
        </p>
        <h1>${escapeHtml(review.title)}</h1>
        <p class="review-authors">${escapeHtml(formatAuthors(review.authors))}</p>
        <div class="review-tags detail-tags">
          ${review.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="review-actions detail-actions">
          ${review.arxivUrl ? `<a href="${escapeHtml(review.arxivUrl)}" target="_blank" rel="noopener">arXiv</a>` : ''}
          ${review.pdfUrl ? `<a href="${escapeHtml(review.pdfUrl)}" target="_blank" rel="noopener">PDF</a>` : ''}
        </div>
        <div class="markdown-body">
          ${markdownToHtml(markdown, { reviewPath: review.reviewPath })}
        </div>
      </article>
    `;
  }

  async function initPaperReviewApp(options = {}) {
    const documentRef = options.document || document;
    const elements = {
      search: documentRef.querySelector('[data-review-search]'),
      sort: documentRef.querySelector('[data-review-sort]'),
      tags: documentRef.querySelector('[data-review-tags]'),
      count: documentRef.querySelector('[data-review-count]'),
      list: documentRef.querySelector('[data-review-list]'),
      error: documentRef.querySelector('[data-review-error]'),
    };
    const state = { ...DEFAULT_STATE };

    try {
      const reviews = await loadReviews(options.dataUrl || 'data/reviews.json');
      bindControls(reviews, state, elements);
      renderReviewList(reviews, state, elements);
      return reviews;
    } catch (error) {
      if (elements.error) {
        elements.error.hidden = false;
        elements.error.textContent = error.message;
      }

      if (elements.list) {
        elements.list.innerHTML = `
          <div class="empty-state">
            <h2>Unable to load reviews</h2>
            <p>Check the static JSON index and try again.</p>
          </div>
        `;
      }

      throw error;
    }
  }

  async function initReviewDetailApp(options = {}) {
    const documentRef = options.document || document;
    const locationRef = options.location || (typeof window !== 'undefined' ? window.location : undefined);
    const elements = {
      detail: documentRef.querySelector('[data-review-detail]'),
      error: documentRef.querySelector('[data-review-error]'),
    };

    try {
      const slug = options.slug || getSlugFromLocation(locationRef);
      if (!slug) {
        throw new Error('Missing review slug');
      }

      const reviews = await loadReviews(options.dataUrl || 'data/reviews.json');
      const review = findReviewBySlug(reviews, slug);
      if (!review) {
        throw new Error(`Review not found: ${slug}`);
      }

      const markdown = await loadReviewMarkdown(review.reviewPath);
      if (elements.detail) {
        elements.detail.innerHTML = renderReviewDetail(review, markdown);
      }
      if (typeof documentRef.title === 'string') {
        documentRef.title = `${review.title} | Paper Review`;
      }

      return review;
    } catch (error) {
      if (elements.error) {
        elements.error.hidden = false;
        elements.error.textContent = error.message;
      }
      if (elements.detail) {
        elements.detail.innerHTML = `
          <div class="empty-state">
            <h2>Unable to load review</h2>
            <p>Return to the archive and choose another paper.</p>
          </div>
        `;
      }
      throw error;
    }
  }

  return {
    coerceReviewData,
    filterReviews,
    getAllTags,
    getReviewUrl,
    initReviewDetailApp,
    initPaperReviewApp,
    markdownToHtml,
    renderReviewList,
    sortReviews,
  };
});

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const app = window.PaperReviewApp;
    if (document.querySelector('[data-review-detail]')) {
      app.initReviewDetailApp().catch(() => {});
    } else {
      app.initPaperReviewApp().catch(() => {});
    }
  });
}
