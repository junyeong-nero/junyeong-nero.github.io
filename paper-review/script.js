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
          ${review.reviewPath ? `<a href="${escapeHtml(review.reviewPath)}">Review</a>` : ''}
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
      throw error;
    }
  }

  return {
    coerceReviewData,
    filterReviews,
    getAllTags,
    initPaperReviewApp,
    renderReviewList,
    sortReviews,
  };
});

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.PaperReviewApp.initPaperReviewApp().catch(() => {});
  });
}
