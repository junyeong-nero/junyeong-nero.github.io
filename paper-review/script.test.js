const test = require('node:test');
const assert = require('node:assert/strict');

const {
  coerceReviewData,
  filterReviews,
  getAllTags,
  initPaperReviewApp,
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
  assert.deepEqual(reviews[0].tags, ['benchmark', 'medical-llm', 'korean']);
  assert.deepEqual(reviews[1].assets, { figures: [], tables: [] });
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
