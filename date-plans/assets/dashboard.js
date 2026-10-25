(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
  const plans = Array.from(document.querySelectorAll('.plans > li[data-start]'), node => ({
    start: node.dataset.start, end: node.dataset.end,
    url: node.querySelector('a').getAttribute('href'), title: node.querySelector('.t').textContent
  }));
  let days = [], loaded = false, loading = false, map, markers = [], mapLoading, revision = 0;
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const identity = p => p.name.replace(/\s/g, '') + '|' + p.address.replace(/\s/g, '');
  const inPeriod = date => date.startsWith($('record-period').value);
  const visitedPlaces = day => day.places.filter(p => !p.transport);
  const isDone = day => day.date <= today;
  const categories = [
    ['movie', '영화'], ['cafe', '카페'], ['board', '보드게임'], ['food', '맛집'],
    ['walk', '산책·나들이'], ['culture', '전시·공연'], ['escape', '방탈출·체험'],
    ['play', '만화·게임·노래방'], ['drink', '술·바'], ['stay', '숙박·휴식'], ['other', '기타']
  ];
  const cuisines = [['korean', '한식'], ['chinese', '중식'], ['japanese', '일식'],
    ['western', '양식'], ['asian', '동남아'], ['other', '기타 음식']];
  let selectedCategory = 'all', selectedCuisine = 'all';
  const weekday = date => '일월화수목금토'[new Date(date + 'T00:00:00Z').getUTCDay()];
  const dayLabel = date => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 (${weekday(date)})`;
  const hasPoint = p => Array.isArray(p.point) && p.point.length === 2 && p.point.every(Number.isFinite);
  const km = (a, b) => {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };
  const median = values => {
    const s = [...values].sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  async function load() {
    if (loaded || loading) return;
    loading = true; $('records-retry').hidden = true;
    $('record-status').textContent = '일정을 불러오고 있어요.';
    const classificationRequest = fetch('assets/classifications.json', { signal: AbortSignal.timeout(15000) })
      .then(response => { if (!response.ok) throw new Error('Classifications unavailable'); return response.json(); })
      .then(data => { if (data.version !== 1 || !data.plans || typeof data.plans !== 'object') throw new Error('Invalid classifications'); return data; })
      .catch(() => null);
    const results = await Promise.allSettled(plans.map(async plan => {
      const response = await fetch(plan.url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Plan unavailable');
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const places = new Map(Array.from(doc.querySelectorAll('[data-location]'), node => {
        const p = JSON.parse(node.dataset.location);
        const addressLabel = Array.from(node.querySelectorAll('dt')).find(dt => dt.textContent === '주소');
        const address = addressLabel?.nextElementSibling?.textContent.trim() || '';
        const parts = address.split(/\s+/);
        const regions = { '서울특별시': '서울', '경기도': '경기', '인천광역시': '인천', '부산광역시': '부산', '대구광역시': '대구', '경상북도': '경북' };
        parts[0] = regions[parts[0]] || parts[0];
        // '화서문(팔달구 장안동) ~ 장안문 …'처럼 주소 대신 구간을 적은 장소는 지역으로 세지 않는다 (2026-10-25)
        const known = parts.length > 1 && !/[()]/.test(parts[0]) && /^[^()]+(시|군|구|도|현|부)$/.test(parts[1]);
        return [p.id, { ...p, address, region: known ? parts.slice(0, 2).join(' ') : '지역 미상' }];
      }));
      return Array.from(doc.querySelectorAll('.day'), section => {
        const date = section.dataset.day || plan.start;
        const route = JSON.parse(section.querySelector('[data-route]')?.dataset.route || '[]');
        const unique = new Map();
        route.forEach(stop => {
          const place = places.get(stop.placeId);
          if (!place || place.name === '미정') return;
          const p = { ...place, key: identity(place) };
          p.transport = /역$|터미널|정류장|공항/.test(p.name);
          unique.set(p.key, p);

        });
        return { id: plan.url + '|' + date, date, plan, places: [...unique.values()], activities: [], classified: false };
      });
    }));
    days = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value).sort((a,b) => a.date.localeCompare(b.date));
    const classification = await classificationRequest;
    days.forEach(day => {
      const slug = decodeURIComponent(day.plan.url.replace(/\/$/, ''));
      const record = classification?.plans[slug];
      if (!record || !Array.isArray(record.activities)) return;
      day.classified = true;
      day.activities = record.activities.filter(a => a.date === day.date && a.url === day.plan.url &&
        typeof a.key === 'string' && typeof a.name === 'string' && typeof a.activity === 'string' &&
        categories.some(c => c[0] === a.category) &&
        (a.category === 'food' ? cuisines.some(c => c[0] === a.cuisine) : a.cuisine === null));
    });
    const failures = results.filter(r => r.status === 'rejected').length;
    loaded = failures === 0 && classification !== null; loading = false;
    $('record-status').textContent = failures ? `${failures}개 일정을 불러오지 못했어요. 현재 요약에는 불러온 일정만 포함돼요.` : '오늘까지의 모든 일정을 다녀온 것으로 집계해요. 역·터미널 등 이동 장소는 제외해요.';
    $('records-retry').hidden = !failures && classification !== null;
    const previous = $('record-period').value;
    const months = [...new Set(days.map(d => d.date.slice(0,7)))].sort().reverse();
    const years = [...new Set(months.map(m => m.slice(0,4)))];
    $('record-period').innerHTML = years.map(year => `<option value="${year}">${year}년 전체</option>` + months.filter(m => m.startsWith(year)).map(m => `<option value="${m}">${year}년 ${Number(m.slice(5))}월</option>`).join('')).join('');
    const valid = [...years, ...months];
    $('record-period').value = valid.includes(previous) ? previous : valid.includes(today.slice(0,7)) ? today.slice(0,7) : valid[0] || '';
    render();
  }
  function aggregate(records) {
    const places = new Map(), regions = new Map();
    records.forEach(day => visitedPlaces(day).forEach(p => {
      if (!places.has(p.key)) places.set(p.key, { ...p, dates: new Set(), url: day.plan.url });
      places.get(p.key).dates.add(day.date);
      places.get(p.key).href = day.plan.url + '#' + day.date;
      if (p.region !== '지역 미상') {
        if (!regions.has(p.region)) regions.set(p.region, new Set());
        regions.get(p.region).add(day.date);
      }
    }));
    return { places: [...places.values()].sort((a,b) => b.dates.size - a.dates.size || a.name.localeCompare(b.name, 'ko')), regions: [...regions].sort((a,b) => b[1].size - a[1].size || a[0].localeCompare(b[0], 'ko')) };
  }
  function render() {
    const complete = days.filter(isDone), current = complete.filter(d => inPeriod(d.date));
    const data = aggregate(current);
    const firstVisits = new Map();
    complete.forEach(d => visitedPlaces(d).forEach(p => { if (!firstVisits.has(p.key)) firstVisits.set(p.key, d.date); }));
    const fresh = data.places.filter(p => inPeriod(firstVisits.get(p.key))).length;
    const cards = [ ['함께한 날', new Set(current.map(d => d.date)).size + '일', '같은 날짜는 한 번만'], ['방문한 장소', data.places.length + '곳', '중복 장소 제외'], ['처음 기록한 곳', fresh + '곳', '전체 일정의 방문 기록 기준'], ['자주 간 지역', data.regions[0]?.[0] || '아직 없어요', data.regions.length ? data.regions[0][1].size + '일 함께했어요' : '이 기간의 방문 지역이 없어요'] ];
    $('record-stats').innerHTML = cards.map(([label, value, note]) => `<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`).join('');
    $('region-ranking').innerHTML = data.regions.slice(0,3).map(([name, dates]) => `<li>${esc(name)}<span>${dates.size}일</span></li>`).join('') || '<li class="empty-record">다녀온 지역이 여기에 모여요.</li>';
    $('place-ranking').innerHTML = data.places.slice(0,3).map(p => `<li><a href="${esc(p.url)}">${esc(p.name)}</a><span>${p.dates.size}일</span></li>`).join('') || '<li class="empty-record">다녀온 장소가 여기에 모여요.</li>';
    renderRecap(complete, current, data);
    const year = $('record-period').value.slice(0,4);
    $('timeline-heading').textContent = year + '년 월별 함께한 날';
    const counts = Array.from({length:12}, (_,i) => new Set(complete.filter(d => d.date.startsWith(year + '-' + String(i+1).padStart(2,'0'))).map(d => d.date)).size);
    // 아직 오지 않은 달은 0일이 아니라 모르는 값이라 선을 잇지 않는다.
    const thisYear = today.slice(0, 4);
    const lastMonth = year > thisYear ? 0 : year === thisYear ? Number(today.slice(5, 7)) : 12;
    const nowMonth = year === thisYear ? lastMonth - 1 : -1;
    const shown = counts.slice(0, lastMonth);
    const max = Math.max(2, ...shown);
    const x = i => 22 + i * 28.7;
    const y = n => 136 - n / max * 100;
    const description = shown.map((n, i) => `${i + 1}월 ${n}일`).join(', ') || '아직 지난 달이 없어요';
    const line = shown.map((n, i) => `${x(i)},${y(n)}`).join(' ');
    const trend = shown.length ? `<polygon points="${x(0)},${y(0)} ${line} ${x(shown.length - 1)},${y(0)}" class="chart-area"/><polyline points="${line}" class="chart-line"/>` : '';
    const dots = shown.map((n, i) => `<circle cx="${x(i)}" cy="${y(n)}" r="${i === nowMonth ? 4.5 : 3.5}" class="chart-dot${i === nowMonth ? ' is-current' : ''}"/>` +
      (n ? `<text x="${x(i)}" y="${y(n) - 11}" text-anchor="middle" class="chart-value">${n}</text>` : '')).join('');
    const labels = counts.map((n, i) => `<text x="${x(i)}" y="158" text-anchor="middle" class="chart-month${i === nowMonth ? ' is-current' : ''}">${i + 1}월</text>`).join('');
    $('record-timeline').innerHTML = `<svg class="month-chart" viewBox="0 0 360 164" role="img" aria-labelledby="month-chart-title month-chart-desc"><title id="month-chart-title">${year}년 월별 함께한 날</title><desc id="month-chart-desc">${description}. 가로축은 월, 세로축은 함께한 날 수예요.</desc>${trend}${dots}${labels}</svg>`;
    const pending = new Set(current.filter(day => !day.classified).map(day => day.plan.url)).size;
    $('classification-status').textContent = pending ? `${pending}개 일정의 분류가 준비되지 않았어요. 종류·음식 집계에는 분류가 완료된 일정만 포함돼요.` : '전체 일정과 메뉴를 함께 읽어 분류한 결과예요.';
    renderCategories(current);
    renderCuisines(current);
    drawMap(data.places);
  }
  // 함께 다녀온 곳 — Wrapped처럼 한 문장과 하이라이트 몇 장으로 돌아본다.
  // 위의 숫자 카드·순위와 겹치지 않는 것만 고르고, 장소 전체 목록은 접어 둔다 (2026-10-25).
  function renderRecap(complete, records, data) {
    const regions = records.flatMap(day => visitedPlaces(day).map(p => p.region)).filter(r => r !== '지역 미상');
    const distinct = [...new Set(regions)];
    const first = regions[0], last = regions[regions.length - 1];
    $('recap-hero').innerHTML = !distinct.length ? '' : distinct.length === 1
      ? `<span class="recap-big">${esc(first)}에서 함께했어요</span>`
      : (first === last ? '' : `<span class="recap-lead">${esc(first)}에서 시작해 ${esc(last)}까지</span>`) +
        `<span class="recap-big">${distinct.length}개 동네를 다녀왔어요</span>`;

    const visits = new Map(), nth = new Map(), firstRegion = new Map();
    complete.forEach(day => visitedPlaces(day).forEach(p => {
      const dates = visits.get(p.key) || new Set();
      dates.add(day.date); visits.set(p.key, dates);
      nth.set(day.id + '|' + p.key, dates.size);
      if (p.region !== '지역 미상' && !firstRegion.has(p.region)) firstRegion.set(p.region, day.date);
    }));
    const link = day => day.plan.url + '#' + day.date;
    const cards = [];
    // '평소 다니던 곳'은 지금까지 다녀온 모든 장소 좌표의 중앙값이다. 평균은 먼 여행 한 번에 끌려간다.
    // 거리는 직선이고, 30km 안쪽이면 멀리 갔다고 하지 않는다.
    const points = complete.flatMap(day => visitedPlaces(day).filter(hasPoint).map(p => p.point));
    if (points.length >= 3) {
      const home = [median(points.map(p => p[0])), median(points.map(p => p[1]))];
      let far = null;
      records.forEach(day => visitedPlaces(day).filter(hasPoint).forEach(p => {
        const d = km(home, p.point);
        if (!far || d >= far.d) far = { d, day, p };
      }));
      if (far && far.d >= 30) cards.push(['가장 멀리 간 날', far.p.region === '지역 미상' ? far.p.name : far.p.region,
        `${dayLabel(far.day.date)} · 평소 다니던 곳에서 직선 약 ${Math.round(far.d).toLocaleString('ko-KR')}km`, link(far.day)]);
    }
    let busy = null;
    records.forEach(day => { if (visitedPlaces(day).length >= Math.max(2, busy ? visitedPlaces(busy).length : 0)) busy = day; });
    if (busy) cards.push(['가장 바빴던 날', dayLabel(busy.date), `하루에 ${visitedPlaces(busy).length}곳을 다녀왔어요`, link(busy)]);
    // 동네가 모두 처음이면 hero와 같은 숫자라 타일 대신 hero 아래 한 줄로 단다.
    // '처음'은 기록 기준이다. 위 숫자 카드의 '처음 기록한 곳'과 같은 말을 쓴다
    const fresh = distinct.filter(r => inPeriod(firstRegion.get(r)));
    if (distinct.length > 1 && fresh.length === distinct.length) $('recap-hero').insertAdjacentHTML('beforeend', '<span class="recap-sub">모두 처음 기록한 동네예요</span>');
    else if (fresh.length) cards.push(['처음 기록한 동네', `${fresh.length}개`,
      fresh.slice(0, 2).join(', ') + (fresh.length > 2 ? ` 외 ${fresh.length - 2}개` : '')]);
    let again = null;
    records.forEach(day => visitedPlaces(day).forEach(p => {
      const n = nth.get(day.id + '|' + p.key);
      if (n > 1 && (!again || n >= again.n)) again = { n, day, p };
    }));
    if (again) cards.push(['다시 찾은 곳', again.p.name, `${dayLabel(again.day.date)} · ${again.n}번째 방문이에요`, link(again.day)]);
    $('recap-highlights').innerHTML = cards.map(([label, value, note, href]) => {
      const body = `<span class="recap-label">${esc(label)}</span><strong class="recap-value">${esc(value)}</strong><span class="recap-note">${esc(note)}</span>`;
      return href ? `<a class="recap-tile" href="${esc(href)}">${body}</a>` : `<div class="recap-tile">${body}</div>`;
    }).join('');

    $('visited-details').hidden = !data.places.length;
    $('visited-heading').textContent = `장소 ${data.places.length}곳 모두 보기`;
    $('visited-places').innerHTML = data.places.map(p => `<a href="${esc(p.href)}" title="${esc(p.name)} 데이트 일정 보기">${esc(p.name)} · ${p.dates.size}일</a>`).join('');
  }
  function renderCategories(records) {
    const entries = [...new Map(records.flatMap(day => day.activities).map(a => [a.key, a])).values()]
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name, 'ko'));
    const totals = new Map(categories.map(([id]) => [id, entries.filter(a => a.category === id).length]));
    const top = categories.filter(([id]) => totals.get(id) > 0)
      .sort((a, b) => totals.get(b[0]) - totals.get(a[0])).slice(0, 3);
    if (!top.some(([id]) => id === selectedCategory)) selectedCategory = 'all';
    const largest = Math.max(1, ...totals.values());
    $('category-board').innerHTML = `<button type="button" class="category-all" data-category="all" aria-pressed="${selectedCategory === 'all'}" aria-controls="category-visits">전체 <strong>${entries.length}회</strong></button>` + top.map(category => {
      const id = category[0], count = totals.get(id);
      return `<button type="button" class="category-tile" data-category="${id}" aria-pressed="${selectedCategory === id}" aria-controls="category-visits"><span>${category[1]}</span><strong>${count}<small>회</small></strong><span class="category-track" aria-hidden="true"><span style="width:${count / largest * 100}%"></span></span></button>`;
    }).join('');
    const filtered = selectedCategory === 'all' ? entries : entries.filter(a => a.category === selectedCategory);
    const label = selectedCategory === 'all' ? '전체 활동' : categories.find(c => c[0] === selectedCategory)[1];
    $('category-result-heading').textContent = `${label} · ${filtered.length}회`;
    $('category-visits').innerHTML = filtered.map(a => `<li><a href="${esc(a.url)}"><span class="category-visit-title">${esc(a.name)}</span><span class="category-visit-meta">${esc(a.date)} · ${esc(a.activity || categories.find(c => c[0] === a.category)[1])}</span><span class="category-arrow" aria-hidden="true">↗</span></a></li>`).join('') || `<li class="empty-record">${records.some(d => !d.classified) ? '일정 분류가 준비되면 여기에 표시돼요.' : '이 기간에는 해당 종류의 데이트가 없어요.'}</li>`;
  }
  $('category-board').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    selectedCategory = button.dataset.category;
    renderCategories(days.filter(day => isDone(day) && inPeriod(day.date)));
    $('category-board').querySelector(`[data-category="${selectedCategory}"]`).focus({ preventScroll: true });
  });
  function renderCuisines(records) {
    const entries = [...new Map(records.flatMap(day => day.activities).filter(a => a.category === 'food').map(a => [a.key, a])).values()]
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name, 'ko'));
    const totals = new Map(cuisines.map(([id]) => [id, entries.filter(a => a.cuisine === id).length]));
    const top = cuisines.filter(([id]) => totals.get(id) > 0)
      .sort((a, b) => totals.get(b[0]) - totals.get(a[0])).slice(0, 3);
    if (!top.some(([id]) => id === selectedCuisine)) selectedCuisine = 'all';
    const largest = Math.max(1, ...totals.values());
    $('cuisine-board').innerHTML = `<button type="button" class="category-all" data-cuisine="all" aria-pressed="${selectedCuisine === 'all'}" aria-controls="cuisine-visits">음식 전체 <strong>${entries.length}회</strong></button>` + top.map(([id, label]) => {
      const count = totals.get(id);
      return `<button type="button" class="category-tile" data-cuisine="${id}" aria-pressed="${selectedCuisine === id}" aria-controls="cuisine-visits"><span>${label}</span><strong>${count}<small>회</small></strong><span class="category-track" aria-hidden="true"><span style="width:${count / largest * 100}%"></span></span></button>`;
    }).join('');
    const filtered = selectedCuisine === 'all' ? entries : entries.filter(a => a.cuisine === selectedCuisine);
    const label = selectedCuisine === 'all' ? '음식 전체' : cuisines.find(c => c[0] === selectedCuisine)[1];
    $('cuisine-result-heading').textContent = `${label} · ${filtered.length}회`;
    $('cuisine-visits').innerHTML = filtered.map(a => `<li><a href="${esc(a.url)}"><span class="category-visit-title">${esc(a.name)}</span><span class="category-visit-meta">${esc(a.date)} · ${cuisines.find(c => c[0] === a.cuisine)[1]} · ${esc(a.activity)}</span><span class="category-arrow" aria-hidden="true">↗</span></a></li>`).join('') || `<li class="empty-record">${records.some(d => !d.classified) ? '음식 분류가 준비되면 여기에 표시돼요.' : '이 기간에는 해당 음식의 방문 기록이 없어요.'}</li>`;
  }
  $('cuisine-board').addEventListener('click', event => {
    const button = event.target.closest('[data-cuisine]');
    if (!button) return;
    selectedCuisine = button.dataset.cuisine;
    renderCuisines(days.filter(day => isDone(day) && inPeriod(day.date)));
    $('cuisine-board').querySelector(`[data-cuisine="${selectedCuisine}"]`).focus({ preventScroll: true });
  });
  async function ensureMap() {
    if (window.kakao?.maps?.Map) return;
    if (!mapLoading) mapLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(fail, 12000);
      function fail() { clearTimeout(timer); script.remove(); reject(new Error('Map unavailable')); }
      script.onerror = fail;
      script.onload = () => {
        if (!window.kakao?.maps) { fail(); return; }
        window.kakao.maps.load(() => { clearTimeout(timer); resolve(); });
      };
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=' + encodeURIComponent(document.querySelector('meta[name="kakao-maps-js-key"]').content);
      document.head.appendChild(script);
    }).catch(error => { mapLoading = null; throw error; });
    return mapLoading;
  }
  async function drawMap(places) {
    const version = ++revision;
    markers.forEach(m => m.setMap(null)); markers = [];
    // 방문 지도는 카카오 지도라 구글맵 링크로 적은 해외 장소는 빼고 목록에만 둔다 (2026-10-12).
    const located = places.filter(p => p.provider !== 'google' && Array.isArray(p.point) && p.point.length === 2 && p.point.every(Number.isFinite));
    $('map-retry').hidden = true;
    $('record-map').hidden = !located.length;
    if (!located.length) {
      $('map-status').textContent = places.length ? '지도에 올릴 좌표가 있는 장소가 없어요. 아래 장소 목록에서 일정을 볼 수 있어요.' : '이 기간에는 오늘까지 다녀온 장소가 없어요.';
      return;
    }
    $('map-status').textContent = '방문 지도를 불러오고 있어요.';
    try {
      await ensureMap();
      if (version !== revision) return;
      const k = window.kakao.maps;
      if (!map) {
        map = new k.Map($('record-map'), { center: new k.LatLng(...located[0].point), level: 6 });
        map.addControl(new k.ZoomControl(), k.ControlPosition.RIGHT);
        new ResizeObserver(() => { if (!$('records-view').hidden) map.relayout(); }).observe($('record-map'));
      }
      map.relayout();
      const bounds = new k.LatLngBounds();
      located.forEach(p => {
        const position = new k.LatLng(...p.point);
        const marker = new k.Marker({ map, position, title: p.name });
        k.event.addListener(marker, 'click', () => { window.location.href = p.href; });
        markers.push(marker); bounds.extend(position);
      });
      if (located.length === 1) { map.setCenter(new k.LatLng(...located[0].point)); map.setLevel(5); }
      else map.setBounds(bounds);
      $('map-status').textContent = places.length > located.length ? `${located.length}곳을 지도에 표시했어요. 나머지 ${places.length - located.length}곳은 아래 장소 목록에 있어요.` : '';
    } catch {
      if (version !== revision) return;
      $('record-map').hidden = true;
      $('map-status').textContent = '지도를 연결하지 못했어요. 아래 장소 목록에서 일정을 볼 수 있어요.';
      $('map-retry').hidden = false;
    }
  }
  function showView(view) {
    const records = view === 'records';
    $('schedule-view').hidden = records; $('records-view').hidden = !records;
    document.querySelectorAll('[data-home-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.homeView === view)));
    if (records) { if (loaded) render(); else load(); }
  }
  document.querySelector('.home-switch').hidden = false;
  document.querySelectorAll('[data-home-view]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.homeView; }));
  window.addEventListener('hashchange', () => showView(location.hash === '#records' ? 'records' : 'schedule'));
  $('record-period').addEventListener('change', render);
  $('records-retry').addEventListener('click', load);
  $('map-retry').addEventListener('click', render);
  showView(location.hash === '#records' ? 'records' : 'schedule');
})();
