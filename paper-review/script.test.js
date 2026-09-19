const test = require('node:test');
const assert = require('node:assert/strict');

const {
  categoryLabel,
  coerceReviewData,
  countCategories,
  filterReviews,
  getAllCategories,
  getAllTags,
  getFrequentTags,
  getReviewUrl,
  initReviewDetailApp,
  initPaperReviewApp,
  markdownToHtml,
  renderReviewList,
  sortReviews,
} = require('./script.js');

const fixture = {
  version: 1,
  updatedAt: '2026-06-04',
  reviews: [
    {
      id: '2403.01469',
      slug: 'kormedmcqa',
      title: 'KorMedMCQA: Korean Medical Benchmark',
      authors: ['Junyeong Song', 'Jane Researcher'],
      publishedAt: '2024-03-03',
      reviewedAt: '2026-06-04',
      summary: 'A Korean healthcare licensing exam benchmark for LLM evaluation.',
      category: 'evaluation',
      tags: ['benchmark', 'medical-llm', 'korean'],
      arxivUrl: 'https://arxiv.org/abs/2403.01469',
      pdfUrl: 'https://arxiv.org/pdf/2403.01469.pdf',
      reviewPath: 'reviews/kormedmcqa.md',
      assets: {
        figures: [
          {
            path: 'assets/kormedmcqa/figures/figure-01.png',
            caption: 'Figure 1. Dataset construction pipeline.',
            page: 3,
          },
        ],
        tables: [],
      },
    },
    {
      id: '2501.00001',
      slug: 'agent-planning-survey',
      title: 'Agent Planning Survey',
      authors: ['Another Author'],
      publishedAt: '2025-01-10',
      reviewedAt: '2026-05-20',
      summary: 'A survey of planning patterns for LLM agents.',
      category: 'web-agents',
      tags: ['agents', 'planning'],
      arxivUrl: 'https://arxiv.org/abs/2501.00001',
      pdfUrl: 'https://arxiv.org/pdf/2501.00001.pdf',
      reviewPath: 'reviews/agent-planning-survey.md',
      assets: { figures: [], tables: [] },
    },
  ],
};

function createFakeElement() {
  return {
    hidden: true,
    innerHTML: '',
    listeners: {},
    textContent: '',
    value: '',
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
  };
}

function createFakeDocument(elements) {
  return {
    querySelector(selector) {
      return elements[selector] || null;
    },
  };
}

function restoreTimezone(originalTimezone) {
  if (originalTimezone === undefined) {
    delete process.env.TZ;
    return;
  }

  process.env.TZ = originalTimezone;
}

test('coerceReviewData normalizes wrapped review payloads', () => {
  const reviews = coerceReviewData(fixture);

  assert.equal(reviews.length, 2);
  assert.equal(reviews[0].category, 'evaluation');
  assert.deepEqual(reviews[0].tags, ['benchmark', 'medical-llm', 'korean']);
  assert.deepEqual(reviews[1].assets, { figures: [], tables: [] });
});

test('coerceReviewData defaults missing categories to uncategorized', () => {
  const [review] = coerceReviewData([{ id: 'x', title: 'T' }]);

  assert.equal(review.category, 'uncategorized');
  assert.equal(categoryLabel('evaluation'), 'Evaluation');
  assert.equal(categoryLabel('rl-posttraining'), 'RL & Post-training');
});

test('getAllCategories returns unique sorted categories', () => {
  const reviews = coerceReviewData(fixture);

  assert.deepEqual(getAllCategories(reviews), ['evaluation', 'web-agents']);
  assert.deepEqual(Object.fromEntries(countCategories(reviews)), {
    evaluation: 1,
    'web-agents': 1,
  });
});

test('getFrequentTags keeps only tags at or above the threshold', () => {
  const reviews = coerceReviewData(fixture);

  assert.deepEqual(getFrequentTags(reviews, 1).sort(), [
    'agents',
    'benchmark',
    'korean',
    'medical-llm',
    'planning',
  ]);
  assert.deepEqual(getFrequentTags(reviews, 2), []);
});

test('filterReviews matches category exactly and stays optional', () => {
  const reviews = coerceReviewData(fixture);

  assert.equal(filterReviews(reviews, { category: 'evaluation' }).length, 1);
  assert.equal(filterReviews(reviews, { category: 'evaluation' })[0].slug, 'kormedmcqa');
  assert.equal(filterReviews(reviews, { category: 'all' }).length, 2);
  assert.equal(filterReviews(reviews, {}).length, 2);
  assert.equal(filterReviews(reviews, { query: 'benchmark', category: 'web-agents' }).length, 0);
});

test('renderReviewList renders category filters with counts and badges', () => {
  const elements = {
    count: createFakeElement(),
    list: createFakeElement(),
    tags: createFakeElement(),
    categories: createFakeElement(),
  };
  const reviews = coerceReviewData(fixture);

  renderReviewList(reviews, { query: '', category: 'all', tags: [], sort: 'newest' }, elements);

  assert.ok(elements.categories.innerHTML.includes('data-category="evaluation"'));
  assert.ok(elements.categories.innerHTML.includes('Evaluation (1)'));
  assert.ok(elements.list.innerHTML.includes('review-category'));
  assert.ok(elements.list.innerHTML.includes('Evaluation'));
});

test('getAllTags returns unique sorted tags', () => {
  const reviews = coerceReviewData(fixture);

  assert.deepEqual(getAllTags(reviews), [
    'agents',
    'benchmark',
    'korean',
    'medical-llm',
    'planning',
  ]);
});

test('filterReviews matches query across title authors summary tags and arxiv id', () => {
  const reviews = coerceReviewData(fixture);

  assert.equal(filterReviews(reviews, { query: 'healthcare' }).length, 1);
  assert.equal(filterReviews(reviews, { query: 'Junyeong' })[0].slug, 'kormedmcqa');
  assert.equal(filterReviews(reviews, { query: '2501.00001' })[0].slug, 'agent-planning-survey');
  assert.equal(filterReviews(reviews, { query: 'agents' })[0].slug, 'agent-planning-survey');
});

test('filterReviews requires every selected tag to be present', () => {
  const reviews = coerceReviewData(fixture);

  assert.equal(filterReviews(reviews, { tags: ['benchmark'] }).length, 1);
  assert.equal(filterReviews(reviews, { tags: ['benchmark', 'korean'] }).length, 1);
  assert.equal(filterReviews(reviews, { tags: ['benchmark', 'agents'] }).length, 0);
});

test('sortReviews supports newest and title ordering without mutating input', () => {
  const reviews = coerceReviewData(fixture);
  const newest = sortReviews(reviews, 'newest');
  const title = sortReviews(reviews, 'title');

  assert.deepEqual(newest.map((review) => review.slug), ['kormedmcqa', 'agent-planning-survey']);
  assert.deepEqual(title.map((review) => review.slug), ['agent-planning-survey', 'kormedmcqa']);
  assert.deepEqual(reviews.map((review) => review.slug), ['kormedmcqa', 'agent-planning-survey']);
});

test('renderReviewList links reviews to the HTML detail page by slug', () => {
  const elements = {
    count: createFakeElement(),
    list: createFakeElement(),
    tags: createFakeElement(),
  };
  const reviews = coerceReviewData(fixture);

  renderReviewList(reviews, { query: '', tags: [], sort: 'newest' }, elements);

  assert.equal(getReviewUrl(reviews[0]), 'review.html?slug=kormedmcqa');
  assert.ok(elements.list.innerHTML.includes('href="review.html?slug=kormedmcqa"'));
  assert.ok(!elements.list.innerHTML.includes('href="reviews/kormedmcqa.md"'));
});

test('renderReviewList uses a generic source label for non-arxiv papers', () => {
  const elements = {
    count: createFakeElement(),
    list: createFakeElement(),
    tags: createFakeElement(),
  };
  const reviews = coerceReviewData({
    reviews: [
      {
        id: 'pirolli-card-2005',
        slug: 'sensemaking-process-analyst-technology',
        title: 'The Sensemaking Process and Leverage Points for Analyst Technology',
        authors: ['Peter Pirolli', 'Stuart Card'],
        publishedAt: '2005-04-28',
        reviewedAt: '2026-06-16',
        summary: 'A cognitive task analysis paper.',
        tags: ['sensemaking'],
        sourceUrl: 'https://andymatuschak.org/files/papers/example.pdf',
        pdfUrl: 'https://andymatuschak.org/files/papers/example.pdf',
        reviewPath: 'reviews/sensemaking-process-analyst-technology.md',
        assets: { figures: [], tables: [] },
      },
    ],
  });

  renderReviewList(reviews, { query: '', tags: [], sort: 'newest' }, elements);

  assert.equal(reviews[0].sourceUrl, 'https://andymatuschak.org/files/papers/example.pdf');
  assert.ok(elements.list.innerHTML.includes('>Source</a>'));
  assert.ok(!elements.list.innerHTML.includes('>arXiv</a>'));
});

test('markdownToHtml escapes text and resolves review-relative figure paths', () => {
  const html = markdownToHtml(`
## Method

Read [the paper](https://arxiv.org/abs/2504.18575).

- safe item
- <script>alert(1)</script>

![Figure <1>](../assets/wasp/figures/figure-01.png)
`, { reviewPath: 'reviews/wasp.md' });

  assert.ok(html.includes('<h2>Method</h2>'));
  assert.ok(html.includes('<a href="https://arxiv.org/abs/2504.18575"'));
  assert.ok(html.includes('<li>&lt;script&gt;alert(1)&lt;/script&gt;</li>'));
  assert.ok(html.includes('src="assets/wasp/figures/figure-01.png"'));
  assert.ok(html.includes('alt="Figure &lt;1&gt;"'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
});

test('renderReviewList escapes review HTML and keeps date-only display stable', () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';

  try {
    const elements = {
      count: createFakeElement(),
      list: createFakeElement(),
      tags: createFakeElement(),
    };
    const reviews = coerceReviewData({
      reviews: [
        {
          id: '2606.00001',
          title: '<img src=x onerror=alert(1)>',
          authors: ['Jane <Admin>'],
          publishedAt: '2026-06-04',
          reviewedAt: '2026-06-04',
          summary: 'Use <b>escaped</b> & "quoted" values.',
          tags: ['xss<script>'],
          assets: { figures: [], tables: [] },
        },
      ],
    });

    renderReviewList(reviews, { query: '', tags: [], sort: 'newest' }, elements);

    assert.ok(elements.list.innerHTML.includes('Jun 04, 2026'));
    assert.ok(!elements.list.innerHTML.includes('Jun 03, 2026'));
    assert.ok(elements.list.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(elements.list.innerHTML.includes('Jane &lt;Admin&gt;'));
    assert.ok(elements.list.innerHTML.includes('Use &lt;b&gt;escaped&lt;/b&gt; &amp; &quot;quoted&quot; values.'));
    assert.ok(elements.list.innerHTML.includes('xss&lt;script&gt;'));
    assert.ok(!elements.list.innerHTML.includes('<img src=x onerror=alert(1)>'));
  } finally {
    restoreTimezone(originalTimezone);
  }
});

test('initPaperReviewApp fetches uncached reviews and updates rendered results on search', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const elements = {
    '[data-review-search]': createFakeElement(),
    '[data-review-sort]': createFakeElement(),
    '[data-review-tags]': createFakeElement(),
    '[data-review-count]': createFakeElement(),
    '[data-review-list]': createFakeElement(),
    '[data-review-error]': createFakeElement(),
  };
  const document = createFakeDocument(elements);

  globalThis.fetch = async (url, options) => {
    calls.push([url, options]);

    return {
      ok: true,
      async json() {
        return fixture;
      },
    };
  };

  try {
    const reviews = await initPaperReviewApp({ document, dataUrl: 'custom-reviews.json' });

    assert.equal(reviews.length, 2);
    assert.deepEqual(calls, [['custom-reviews.json', { cache: 'no-cache' }]]);
    assert.equal(elements['[data-review-count]'].textContent, '2 reviews');
    assert.ok(elements['[data-review-list]'].innerHTML.includes('KorMedMCQA: Korean Medical Benchmark'));
    assert.ok(elements['[data-review-list]'].innerHTML.includes('Agent Planning Survey'));
    assert.equal(typeof elements['[data-review-search]'].listeners.input, 'function');

    elements['[data-review-search]'].value = 'planning';
    elements['[data-review-search]'].listeners.input({ target: elements['[data-review-search]'] });

    assert.equal(elements['[data-review-count]'].textContent, '1 review');
    assert.ok(!elements['[data-review-list]'].innerHTML.includes('KorMedMCQA: Korean Medical Benchmark'));
    assert.ok(elements['[data-review-list]'].innerHTML.includes('Agent Planning Survey'));
  } finally {
    if (originalFetch === undefined) {
      delete globalThis.fetch;
    } else {
      globalThis.fetch = originalFetch;
    }
  }
});

test('initPaperReviewApp replaces loading state when reviews fail to load', async () => {
  const originalFetch = globalThis.fetch;
  const elements = {
    '[data-review-search]': createFakeElement(),
    '[data-review-sort]': createFakeElement(),
    '[data-review-tags]': createFakeElement(),
    '[data-review-count]': createFakeElement(),
    '[data-review-list]': createFakeElement(),
    '[data-review-error]': createFakeElement(),
  };
  const document = createFakeDocument(elements);
  elements['[data-review-list]'].innerHTML = `
    <div class="empty-state">
      <h2>Loading reviews</h2>
      <p>The archive index is loading from static JSON.</p>
    </div>
  `;

  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
  });

  try {
    await assert.rejects(
      initPaperReviewApp({ document }),
      /Failed to load reviews: 503/,
    );

    assert.equal(elements['[data-review-error]'].hidden, false);
    assert.equal(elements['[data-review-error]'].textContent, 'Failed to load reviews: 503');
    assert.ok(!elements['[data-review-list]'].innerHTML.includes('Loading reviews'));
    assert.ok(elements['[data-review-list]'].innerHTML.includes('Unable to load reviews'));
  } finally {
    if (originalFetch === undefined) {
      delete globalThis.fetch;
    } else {
      globalThis.fetch = originalFetch;
    }
  }
});

test('initReviewDetailApp renders selected markdown review with resolved figures', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const elements = {
    '[data-review-detail]': createFakeElement(),
    '[data-review-error]': createFakeElement(),
  };
  const document = createFakeDocument(elements);

  globalThis.fetch = async (url, options) => {
    calls.push([url, options]);

    if (url === 'custom-reviews.json') {
      return {
        ok: true,
        async json() {
          return fixture;
        },
      };
    }

    if (url === 'reviews/kormedmcqa.md') {
      return {
        ok: true,
        async text() {
          return '## Review Body\n\n![Figure 1](../assets/kormedmcqa/figures/figure-01.png)';
        },
      };
    }

    return { ok: false, status: 404 };
  };

  try {
    const review = await initReviewDetailApp({
      document,
      dataUrl: 'custom-reviews.json',
      slug: 'kormedmcqa',
    });

    assert.equal(review.slug, 'kormedmcqa');
    assert.deepEqual(calls, [
      ['custom-reviews.json', { cache: 'no-cache' }],
      ['reviews/kormedmcqa.md', { cache: 'no-cache' }],
    ]);
    assert.ok(elements['[data-review-detail]'].innerHTML.includes('KorMedMCQA: Korean Medical Benchmark'));
    assert.ok(elements['[data-review-detail]'].innerHTML.includes('<h2>Review Body</h2>'));
    assert.ok(elements['[data-review-detail]'].innerHTML.includes('src="assets/kormedmcqa/figures/figure-01.png"'));
  } finally {
    if (originalFetch === undefined) {
      delete globalThis.fetch;
    } else {
      globalThis.fetch = originalFetch;
    }
  }
});
