// Delivery — apartment entrance password lookup.
// Data lives in Firebase Realtime DB at /main as a JSON-encoded string
// (same format the Android/Flutter app writes):
//   { [apt]: { [line]: { [number]: { apt, line, number, pwd } } } }

const DB_URL = 'https://delivery-5e51d-default-rtdb.firebaseio.com/main.json';

const $ = (id) => document.getElementById(id);

let data = {};

async function load() {
  const res = await fetch(DB_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let value = await res.json();
  if (typeof value === 'string') value = JSON.parse(value);
  data = value && typeof value === 'object' ? value : {};
}

async function save() {
  const res = await fetch(DB_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(data)),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// Substring match at each level; an empty query matches everything.
function search(apt, line, number) {
  const match = (q, key) => !q || key.includes(q);
  const out = [];
  for (const [a, lines] of Object.entries(data)) {
    if (!match(apt, a) || !lines || typeof lines !== 'object') continue;
    for (const [l, numbers] of Object.entries(lines)) {
      if (!match(line, l) || !numbers || typeof numbers !== 'object') continue;
      for (const [n, item] of Object.entries(numbers)) {
        if (match(number, n) && item) out.push({ apt: a, line: l, number: n, pwd: item.pwd ?? '' });
      }
    }
  }
  const cmp = (x, y) => x.localeCompare(y, 'ko', { numeric: true });
  return out.sort((x, y) => cmp(x.apt, y.apt) || cmp(x.line, y.line) || cmp(x.number, y.number));
}

function upsert(apt, line, number, pwd) {
  data[apt] ??= {};
  data[apt][line] ??= {};
  data[apt][line][number] = { apt, line, number, pwd };
}

function remove(apt, line, number) {
  const lines = data[apt];
  if (!lines?.[line]?.[number]) return;
  delete lines[line][number];
  if (!Object.keys(lines[line]).length) delete lines[line];
  if (!Object.keys(lines).length) delete data[apt];
}

// ---------- UI ----------

const ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICON_DELETE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

const qApt = $('q-apt'), qLine = $('q-line'), qNumber = $('q-number');
const results = $('results'), status = $('status');

function setStatus(text) { status.textContent = text; }

let toastTimer;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function render() {
  const items = search(qApt.value.trim(), qLine.value.trim(), qNumber.value.trim());
  results.replaceChildren(...items.map((item) => {
    const pwd = el('button', {
      type: 'button',
      className: item.pwd ? 'pwd' : 'pwd empty',
      textContent: item.pwd || '비밀번호 없음',
      onclick: () => copy(item.pwd),
    });
    const edit = el('button', { type: 'button', className: 'icon-btn', innerHTML: ICON_EDIT, onclick: () => openEdit(item) });
    edit.setAttribute('aria-label', '수정');
    const del = el('button', { type: 'button', className: 'icon-btn', innerHTML: ICON_DELETE, onclick: () => confirmDelete(item) });
    del.setAttribute('aria-label', '삭제');
    return el('li', { className: 'card' }, [
      el('div', { className: 'info' }, [
        el('div', { className: 'apt', textContent: item.apt }),
        el('div', { className: 'unit', textContent: `${item.line}동 ${item.number}호` }),
        pwd,
      ]),
      edit,
      del,
    ]);
  }));
  const total = Object.keys(data).length;
  setStatus(items.length ? `${items.length}건` : total ? '검색 결과가 없습니다.' : '등록된 항목이 없습니다. + 버튼으로 추가하세요.');
}

async function copy(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast('비밀번호를 복사했습니다');
  } catch {
    /* clipboard unavailable (e.g. non-secure context) */
  }
}

async function refresh() {
  try {
    await load();
    render();
  } catch (err) {
    setStatus('데이터를 불러오지 못했습니다. 네트워크를 확인해 주세요.');
    console.error(err);
  }
}

// Search: re-fetch on submit, filter locally while typing.
$('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.activeElement?.blur();
  refresh();
});
for (const input of [qApt, qLine, qNumber]) input.addEventListener('input', render);

// Add / edit sheet
const editDialog = $('edit-dialog');
const fApt = $('f-apt'), fLine = $('f-line'), fNumber = $('f-number'), fPwd = $('f-pwd');

function openEdit(item) {
  const existing = item && data[item.apt]?.[item.line]?.[item.number];
  $('edit-title').textContent = existing ? '비밀번호 수정' : '비밀번호 등록';
  fApt.value = item?.apt ?? '';
  fLine.value = item?.line ?? '';
  fNumber.value = item?.number ?? '';
  fPwd.value = existing?.pwd ?? '';
  editDialog.showModal();
  const firstEmpty = [fApt, fLine, fNumber, fPwd].find((i) => !i.value) ?? fPwd;
  firstEmpty.focus();
}

$('add-btn').addEventListener('click', () => openEdit({
  apt: qApt.value.trim(), line: qLine.value.trim(), number: qNumber.value.trim(),
}));

editDialog.querySelector('[data-close]').addEventListener('click', () => editDialog.close());
editDialog.addEventListener('click', (e) => { if (e.target === editDialog) editDialog.close(); });

for (const btn of editDialog.querySelectorAll('[data-insert]')) {
  // Keep focus (and the mobile keyboard) on the password field.
  btn.addEventListener('pointerdown', (e) => e.preventDefault());
  btn.addEventListener('click', () => {
    const text = btn.dataset.insert;
    const start = fPwd.selectionStart ?? fPwd.value.length;
    const end = fPwd.selectionEnd ?? fPwd.value.length;
    fPwd.setRangeText(text, start, end, 'end');
    fPwd.focus();
  });
}

$('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const apt = fApt.value.trim(), line = fLine.value.trim(), number = fNumber.value.trim();
  if (!apt || !line || !number) return;
  editDialog.close();
  try {
    await load();
    upsert(apt, line, number, fPwd.value.trim());
    await save();
    toast('저장했습니다');
  } catch (err) {
    toast('저장하지 못했습니다');
    console.error(err);
  }
  render();
});

// Delete confirmation
const confirmDialog = $('confirm-dialog');
let pendingDelete = null;

function confirmDelete(item) {
  pendingDelete = item;
  $('confirm-text').textContent = `${item.apt} ${item.line}동 ${item.number}호 항목을 삭제하시겠습니까?`;
  confirmDialog.returnValue = '';
  confirmDialog.showModal();
}

confirmDialog.addEventListener('click', (e) => { if (e.target === confirmDialog) confirmDialog.close(); });
confirmDialog.addEventListener('close', async () => {
  const item = pendingDelete;
  pendingDelete = null;
  if (confirmDialog.returnValue !== 'yes' || !item) return;
  try {
    await load();
    remove(item.apt, item.line, item.number);
    await save();
    toast('삭제했습니다');
  } catch (err) {
    toast('삭제하지 못했습니다');
    console.error(err);
  }
  render();
});

// Remove the service worker left over from the previous Flutter build.
navigator.serviceWorker?.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));

refresh();
