// Gina — 漫画オーサリングツール

// --- フォント設定(ここを追記すれば select と書き出しの両方に反映) ---
const FONTS = [
  {
    name: 'GenEiAntiquePv6',
    label: '源暎アンチック Pv6',
    file: 'assets/fonts/GenEiAntiquePv6-M.ttf',
  },
  {
    name: 'GenEiAntiqueNv6',
    label: '源暎アンチック Nv6',
    file: 'assets/fonts/GenEiAntiqueNv6-M.ttf',
  },
  {
    name: 'ChikaraDzuyoku',
    label: '851チカラヅヨク かなA',
    file: 'assets/fonts/851CHIKARA-DZUYOKU_kanaA_004.ttf',
  },
];

const FONT_FILES = Object.fromEntries(FONTS.map((f) => [f.name, f.file]));

function registerFonts() {
  if (typeof FontFace === 'undefined' || !document.fonts) return;
  for (const f of FONTS) {
    const face = new FontFace(f.name, `url(${f.file})`, { display: 'swap' });
    document.fonts.add(face);
    face.load().catch((err) => console.warn(`Font load failed: ${f.name}`, err));
  }
}

registerFonts();

const els = {
  fileInput: document.getElementById('fileInput'),
  openBtn: document.getElementById('openBtn'),
  exportBtn: document.getElementById('exportBtn'),
  stageWrapper: document.getElementById('stageWrapper'),
  stage: document.getElementById('stage'),
  layerContainer: document.getElementById('layerContainer'),
  panelContainer: document.getElementById('panelContainer'),
  templateSelect: document.getElementById('templateSelect'),
  panelBorderInput: document.getElementById('panelBorderInput'),
  panelBorderValue: document.getElementById('panelBorderValue'),
  panelGutterInput: document.getElementById('panelGutterInput'),
  panelGutterValue: document.getElementById('panelGutterValue'),
  splitTopBottomBtn: document.getElementById('splitTopBottomBtn'),
  splitLeftRightBtn: document.getElementById('splitLeftRightBtn'),
  deletePanelBtn: document.getElementById('deletePanelBtn'),
  panelMaterialProps: document.getElementById('panelMaterialProps'),
  materialResetBtn: document.getElementById('materialResetBtn'),
  materialRemoveBtn: document.getElementById('materialRemoveBtn'),
  textProps: document.getElementById('textProps'),
  propText: document.getElementById('propText'),
  propFont: document.getElementById('propFont'),
  propSize: document.getElementById('propSize'),
  propSizeValue: document.getElementById('propSizeValue'),
  propOrientation: document.getElementById('propOrientation'),
  propLineHeight: document.getElementById('propLineHeight'),
  propLineHeightValue: document.getElementById('propLineHeightValue'),
  propDelete: document.getElementById('propDelete'),
  stickerProps: document.getElementById('stickerProps'),
  stickerDelete: document.getElementById('stickerDelete'),
  bubblePicker: document.getElementById('bubblePicker'),
  memoToggle: document.getElementById('memoToggle'),
  memoPanel: document.getElementById('memoPanel'),
  memoHeader: document.getElementById('memoHeader'),
  memoTitle: document.getElementById('memoTitle'),
  memoClose: document.getElementById('memoClose'),
  memoText: document.getElementById('memoText'),
  saveProjectBtn: document.getElementById('saveProjectBtn'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageIndicator: document.getElementById('pageIndicator'),
  deletePageBtn: document.getElementById('deletePageBtn'),
  contextMenu: document.getElementById('contextMenu'),
};

// コマ割りテンプレート。panels は 0-1 の正規化座標（{x,y,w,h}）。
// 初期状態は 'one'（1コマ全面）。「テンプレなし」は廃止。
const DEFAULT_TEMPLATE = 'one';
const TEMPLATES = {
  one: { label: '1コマ（全面）', panels: [
    { x: 0, y: 0, w: 1, h: 1 },
  ]},
  splitV: { label: '縦2分割', panels: [
    { x: 0, y: 0,   w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 1, h: 0.5 },
  ]},
  splitH: { label: '横2分割', panels: [
    { x: 0,   y: 0, w: 0.5, h: 1 },
    { x: 0.5, y: 0, w: 0.5, h: 1 },
  ]},
  fourKoma: { label: '4コマ縦', panels: [
    { x: 0, y: 0,    w: 1, h: 0.25 },
    { x: 0, y: 0.25, w: 1, h: 0.25 },
    { x: 0, y: 0.5,  w: 1, h: 0.25 },
    { x: 0, y: 0.75, w: 1, h: 0.25 },
  ]},
  six: { label: '6コマ', panels: [
    { x: 0,   y: 0,        w: 0.5, h: 1 / 3 },
    { x: 0.5, y: 0,        w: 0.5, h: 1 / 3 },
    { x: 0,   y: 1 / 3,    w: 0.5, h: 1 / 3 },
    { x: 0.5, y: 1 / 3,    w: 0.5, h: 1 / 3 },
    { x: 0,   y: 2 / 3,    w: 0.5, h: 1 / 3 },
    { x: 0.5, y: 2 / 3,    w: 0.5, h: 1 / 3 },
  ]},
  eight: { label: '8コマ', panels: [
    { x: 0,   y: 0,    w: 0.5, h: 0.25 },
    { x: 0.5, y: 0,    w: 0.5, h: 0.25 },
    { x: 0,   y: 0.25, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0,   y: 0.5,  w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.5,  w: 0.5, h: 0.25 },
    { x: 0,   y: 0.75, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
  ]},
};

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 1700;

const OPPOSITE_EDGE = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
const MIN_PANEL_DIM = 0.05; // コマがゼロサイズにならないよう正規化座標での最小寸法

const MONOLOGUE_PADDING = 12;
const MONOLOGUE_BORDER = 2;

// 吹き出しステッカー(画像)の既定値
const STICKER_DEFAULT_SRC = 'assets/bubbles/vertical/bubble-01-oval.png';

// 吹き出しピッカーに並べる候補。vertical と horizontal の両方を一覧表示する。
const BUBBLE_CATALOG = [
  ...[
    'bubble-01-oval', 'bubble-02-oval-thin', 'bubble-03-spiky', 'bubble-04-spiky-angular',
    'bubble-05-dashed-oval', 'bubble-06-cloud', 'bubble-07-rect', 'bubble-08-poly',
    'bubble-09-poly-marked', 'bubble-10-dashed-poly',
  ].map((n) => `assets/bubbles/vertical/${n}.png`),
  ...[
    'bubble-01-oval', 'bubble-02-oval-thin', 'bubble-03-spiky', 'bubble-04-spiky-angular',
    'bubble-05-dashed-oval', 'bubble-06-cloud', 'bubble-07-rect', 'bubble-08-poly',
    'bubble-09-poly-marked', 'bubble-10-dashed-poly',
    'bubble-11-long-oval', 'bubble-12-long-oval-2', 'bubble-13-long-oval-3',
    'bubble-14-long-oval-tail', 'bubble-15-long-rect', 'bubble-16-long-rect-dashed',
  ].map((n) => `assets/bubbles/horizontal/${n}.png`),
];
const STICKER_DEFAULT_WIDTH = 280; // ページ座標での初期表示幅

// フキダシ：楕円の長半径 = (テキスト半幅 + パディング) × √2 で外接楕円にする。
// 尾は楕円の下方向に少し左寄りで短く伸びる「三角形のシッポ」。楕円周上 a1/a2
// から tip まで直線で結び、楕円弧と合わせて 1 つの閉じたパスにする(継ぎ目なし)。
const BUBBLE_PADDING_X = 32;
const BUBBLE_PADDING_Y = 20;
const BUBBLE_BORDER = 3;
const BUBBLE_MIN_RX = 70;
const BUBBLE_MIN_RY = 46;
const BUBBLE_TAIL_OFFSET_X = -8;   // 中心からの水平オフセット(px)。負で本体の左寄り
const BUBBLE_TAIL_OFFSET_Y = 70;   // 楕円の下端より少し外に tip を置く
const BUBBLE_TAIL_HALF_ANGLE = 0.18; // 付け根の弧の半開き角(rad)。狭めて鋭い三角形に

// 旧 .mj に同梱されていた漫画全体画像の拡張子（読み込み時に無視する判定に使う）
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|avif|svg)$/i;
const BUNDLE_EXT = '.mj';
const BUNDLE_TEXT_NAME = 'text.json';
const BUNDLE_MEMO_NAME = 'memo.txt';

function detectFileKind(file) {
  const name = file.name || '';
  const type = file.type || '';
  if (/\.mj$/i.test(name)) return 'bundle';
  if (type.startsWith('image/') || IMAGE_EXT_RE.test(name)) return 'image';
  if (type.startsWith('text/') || /\.txt$/i.test(name)) return 'memo';
  return null;
}

function openFile(file) {
  if (!file) return;
  const kind = detectFileKind(file);
  if (kind === 'bundle') {
    loadBundleFile(file);
  } else if (kind === 'memo') {
    loadMemoFile(file);
  } else {
    alert(`対応していないファイル形式です: ${file.name}\n.mj / .txt のみ受け付けます。`);
  }
}

const MAX_PAGES = 4;

function createEmptyPage() {
  const page = {
    layers: [], // { id, el, x, y, text, font, size, orientation, lineHeight }
    selectedId: null,
    nextId: 1,
    memo: '',
    template: DEFAULT_TEMPLATE,
    panels: [], // { id, x, y, w, h, material } 0-1 正規化
    nextPanelId: 1,
    selectedPanelId: null,
    canvasWidth: DEFAULT_CANVAS_WIDTH,
    canvasHeight: DEFAULT_CANVAS_HEIGHT,
  };
  // 初期テンプレートのコマを生成する（テンプレなし状態は作らない）
  page.panels = TEMPLATES[DEFAULT_TEMPLATE].panels.map((p) => ({
    id: page.nextPanelId++,
    x: p.x, y: p.y, w: p.w, h: p.h,
    material: null,
  }));
  return page;
}

const state = {
  pages: Array.from({ length: MAX_PAGES }, createEmptyPage),
  currentPageIndex: 0,
  // 上書き保存用。showSaveFilePicker / showOpenFilePicker で得たハンドルを保持する。
  // フォールバック（<input type=file>）経由で開いた場合は fileName だけ入って handle は null。
  fileHandle: null,
  fileName: null,
};

const BASE_DOC_TITLE = document.title;
function updateDocumentTitle() {
  document.title = state.fileName ? `${state.fileName} - ${BASE_DOC_TITLE}` : BASE_DOC_TITLE;
}

let cur = state.pages[0];

// 何か書き出す/保存する価値があるかどうか。コマ割りは常に存在する前提なので、
// 「素材かテキストが何か置かれているか」で判定する。
function hasPageContent(page) {
  return page.panels.some((p) => p.material) || page.layers.length > 0;
}

function isPageEmpty(page) {
  return !hasPageContent(page);
}

function updatePageIndicator() {
  els.pageIndicator.textContent = `${state.currentPageIndex + 1} / ${state.pages.length}`;
  els.prevPageBtn.disabled = state.currentPageIndex === 0;
  els.nextPageBtn.disabled = state.currentPageIndex === state.pages.length - 1;
  els.memoTitle.textContent = `メモ (P${state.currentPageIndex + 1})`;
}

// 現在ページの memo を textarea に反映
function syncMemoFromPage() {
  els.memoText.value = cur.memo || '';
}

// 中身（素材かテキスト）の有無で開閉する各種ボタンの enable 状態を一括更新。
// 素材セット/外し、テキスト追加/削除など hasPageContent に影響する操作の後に呼ぶ。
function updateActionButtons() {
  const hasContent = hasPageContent(cur);
  els.exportBtn.disabled = !hasContent;
  els.saveProjectBtn.disabled = !anyPageHasContent();
  els.deletePageBtn.disabled = !hasContent;
}

// 表示中ページのレイヤー・有効状態をいまの cur に同期する。
// ページ切替時と一括読み込み(.mj)後の初期表示の両方から使う。
function refreshPageView() {
  // ステージは常に canvasWidth × canvasHeight の白いページとして表示
  els.stage.style.width = `${cur.canvasWidth}px`;
  els.stage.style.height = `${cur.canvasHeight}px`;
  updateActionButtons();
  renderPanels();
  if (els.templateSelect) els.templateSelect.value = cur.template;
  // 現在ページのレイヤー DOM を layerContainer に並べ直す。ステッカーは canvas より
  // 背面、テキストレイヤーは canvas より前面になるよう挿入位置を分ける。
  for (const l of cur.layers) {
    if (l.kind === 'sticker') {
      els.layerContainer.insertBefore(l.el, previewCanvas);
    } else {
      els.layerContainer.appendChild(l.el);
    }
  }
  applyAllLayerStyles();
  updateInspector();
}

function isCanvasEdge(p, edge) {
  const EPS = 0.001;
  if (edge === 'left') return p.x <= EPS;
  if (edge === 'right') return p.x + p.w >= 1 - EPS;
  if (edge === 'top') return p.y <= EPS;
  return p.y + p.h >= 1 - EPS;
}

function getEdgeCoord(p, edge) {
  if (edge === 'left') return p.x;
  if (edge === 'right') return p.x + p.w;
  if (edge === 'top') return p.y;
  return p.y + p.h;
}

function getPerpRange(p, edge) {
  if (edge === 'left' || edge === 'right') return [p.y, p.y + p.h];
  return [p.x, p.x + p.w];
}

// パネルの edge を共有する隣接パネルを返す。共有が「クリーンタイリング」（隣接群が
// 完全に dragged panel のエッジ範囲を覆い、はみ出さない）でない場合は null を返す。
// 戻り値 [] は「隣接なし＝自由辺」を意味し、ドラッグ自体は可能。
function findAlignedNeighbors(panel, edge) {
  const EPS = 0.001;
  const target = getEdgeCoord(panel, edge);
  const opposite = OPPOSITE_EDGE[edge];
  const [ps, pe] = getPerpRange(panel, edge);
  const candidates = [];
  for (const q of cur.panels) {
    if (q.id === panel.id) continue;
    if (Math.abs(getEdgeCoord(q, opposite) - target) > EPS) continue;
    const [qs, qe] = getPerpRange(q, opposite);
    if (qs >= pe - EPS || qe <= ps + EPS) continue;
    if (qs < ps - EPS || qe > pe + EPS) return null; // 範囲外にはみ出す（T字接続）
    candidates.push({ panel: q, edge: opposite, qs, qe });
  }
  if (candidates.length === 0) return [];
  candidates.sort((a, b) => a.qs - b.qs);
  if (Math.abs(candidates[0].qs - ps) > EPS) return null;
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].qs > candidates[i - 1].qe + EPS) return null;
  }
  if (Math.abs(candidates[candidates.length - 1].qe - pe) > EPS) return null;
  return candidates.map((c) => ({ panel: c.panel, edge: c.edge }));
}

const EDGE_HIT_PX = 14; // パネル端からの距離がこの値以内ならその辺を「掴んでいる」と判定

// パネル DOM 要素内でのマウス位置から、近接エッジと可否を返す。
// 戻り値 null: 端に近くない / キャンバス端のみ。 { edge, resizable } を返す場合は UX フィードバックの対象。
function getEdgeFromPoint(el, panel, clientX, clientY) {
  const rect = el.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const w = rect.width;
  const h = rect.height;
  const candidates = [];
  if (y < EDGE_HIT_PX) candidates.push({ edge: 'top', d: y });
  if (h - y < EDGE_HIT_PX) candidates.push({ edge: 'bottom', d: h - y });
  if (x < EDGE_HIT_PX) candidates.push({ edge: 'left', d: x });
  if (w - x < EDGE_HIT_PX) candidates.push({ edge: 'right', d: w - x });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.d - b.d);
  // キャンバス外周はそもそも操作対象外（カーソル変化なし）
  const usable = candidates.filter((c) => !isCanvasEdge(panel, c.edge));
  if (usable.length === 0) return null;
  // 角で2辺に近い場合は、リサイズ可能な方を優先
  for (const c of usable) {
    if (findAlignedNeighbors(panel, c.edge) !== null) {
      return { edge: c.edge, resizable: true };
    }
  }
  return { edge: usable[0].edge, resizable: false };
}

function cursorForEdge(edge) {
  if (edge === 'top' || edge === 'bottom') return 'ns-resize';
  if (edge === 'left' || edge === 'right') return 'ew-resize';
  return '';
}

// パネルのスタイルを再生成せず更新（ドラッグ中の高頻度更新用）
function applyPanelLayoutStyle(el, p) {
  el.style.left = `calc(${p.x * 100}% + var(--panel-half-gutter))`;
  el.style.top = `calc(${p.y * 100}% + var(--panel-half-gutter))`;
  el.style.width = `calc(${p.w * 100}% - var(--panel-gutter))`;
  el.style.height = `calc(${p.h * 100}% - var(--panel-gutter))`;
}

function startEdgeDrag(panel, edge, startEvent) {
  if (startEvent.button !== 0) return;
  startEvent.preventDefault();
  startEvent.stopPropagation();
  const aligned = findAlignedNeighbors(panel, edge);
  if (aligned === null) return;
  const rect = els.panelContainer.getBoundingClientRect();
  const isHorizontal = edge === 'left' || edge === 'right';
  const startClient = isHorizontal ? startEvent.clientX : startEvent.clientY;
  const totalAxis = isHorizontal ? rect.width : rect.height;
  const oldVal = getEdgeCoord(panel, edge);
  const snap = [{ panel, edge }, ...aligned].map((a) => ({
    panel: a.panel, edge: a.edge,
    ox: a.panel.x, oy: a.panel.y, ow: a.panel.w, oh: a.panel.h,
  }));
  let lo = 0, hi = 1;
  for (const s of snap) {
    if (s.edge === 'right') lo = Math.max(lo, s.ox + MIN_PANEL_DIM);
    else if (s.edge === 'left') hi = Math.min(hi, s.ox + s.ow - MIN_PANEL_DIM);
    else if (s.edge === 'bottom') lo = Math.max(lo, s.oy + MIN_PANEL_DIM);
    else hi = Math.min(hi, s.oy + s.oh - MIN_PANEL_DIM);
  }
  document.body.style.cursor = cursorForEdge(edge);
  const onMove = (ev) => {
    const delta = ((isHorizontal ? ev.clientX : ev.clientY) - startClient) / totalAxis;
    const newVal = Math.max(lo, Math.min(hi, oldVal + delta));
    for (const s of snap) {
      const p = s.panel;
      if (s.edge === 'right') p.w = newVal - s.ox;
      else if (s.edge === 'left') { p.x = newVal; p.w = (s.ox + s.ow) - newVal; }
      else if (s.edge === 'bottom') p.h = newVal - s.oy;
      else { p.y = newVal; p.h = (s.oy + s.oh) - newVal; }
      const el = els.panelContainer.querySelector(`[data-panel-id="${s.panel.id}"]`);
      if (el) {
        applyPanelLayoutStyle(el, s.panel);
        const img = el.querySelector('.panel-material');
        if (img) applyMaterialTransform(img, s.panel, el);
      }
    }
  };
  const onUp = () => {
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// 素材 img を「コマ全体を覆う cover フィット」を基準に、user の tx/ty/scale/rotation で動かす。
function applyMaterialTransform(img, panel, panelEl) {
  const m = panel.material;
  if (!m) return;
  const pw = panelEl.clientWidth;
  const ph = panelEl.clientHeight;
  if (pw === 0 || ph === 0 || m.naturalWidth === 0 || m.naturalHeight === 0) return;
  const coverScale = Math.max(pw / m.naturalWidth, ph / m.naturalHeight);
  const finalW = m.naturalWidth * coverScale * (m.scale || 1);
  const finalH = m.naturalHeight * coverScale * (m.scale || 1);
  const cx = pw / 2 + (m.tx || 0) * pw;
  const cy = ph / 2 + (m.ty || 0) * ph;
  img.style.width = `${finalW}px`;
  img.style.height = `${finalH}px`;
  img.style.left = `${cx - finalW / 2}px`;
  img.style.top = `${cy - finalH / 2}px`;
  img.style.transform = `rotate(${m.rotation || 0}deg)`;
}

function mountMaterialOnPanel(panelEl, panel) {
  if (!panel.material) return;
  const img = document.createElement('img');
  img.className = 'panel-material';
  img.src = panel.material.src;
  img.draggable = false;
  panelEl.classList.add('has-material');
  panelEl.appendChild(img);
  // 画像 onload 後の natural size とコマレイアウトの両方が揃ってから transform 反映
  applyMaterialTransform(img, panel, panelEl);
  // 初回レンダ時にコマがまだ 0 サイズだったケースに備えて次フレームで再適用
  requestAnimationFrame(() => applyMaterialTransform(img, panel, panelEl));
}

function findPanelAtClientPoint(clientX, clientY) {
  if (cur.panels.length === 0) return null;
  const rect = els.panelContainer.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  return cur.panels.find((p) => nx >= p.x && nx < p.x + p.w && ny >= p.y && ny < p.y + p.h) || null;
}

function openImagePickerForPanel(panel) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    loadImageAsPanelMaterial(panel, file).catch((err) => {
      console.error(err);
      alert('素材の読み込みに失敗しました: ' + (err && err.message ? err.message : err));
    });
  });
  input.click();
}

async function loadImageAsPanelMaterial(panel, blob) {
  const dataUrl = await blobToDataUrl(blob);
  const sz = await getImageNaturalSize(dataUrl);
  panel.material = {
    src: dataUrl,
    naturalWidth: sz.width,
    naturalHeight: sz.height,
    tx: 0, ty: 0,
    scale: 1,
    rotation: 0,
  };
  // 素材の img を panel DOM にマウントするため、ここは renderPanels で再描画する
  // （selectPanel は class toggle のみで DOM 再生成しないため）
  cur.selectedPanelId = panel.id;
  renderPanels();
  updateActionButtons();
}

function startMaterialDrag(panel, panelEl, startEvent) {
  startEvent.preventDefault();
  startEvent.stopPropagation();
  const startX = startEvent.clientX;
  const startY = startEvent.clientY;
  const pw = panelEl.clientWidth;
  const ph = panelEl.clientHeight;
  const origTx = panel.material.tx || 0;
  const origTy = panel.material.ty || 0;
  const img = panelEl.querySelector('.panel-material');
  document.body.style.cursor = 'grabbing';
  const onMove = (ev) => {
    panel.material.tx = origTx + (ev.clientX - startX) / pw;
    panel.material.ty = origTy + (ev.clientY - startY) / ph;
    if (img) applyMaterialTransform(img, panel, panelEl);
  };
  const onUp = () => {
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function renderPanels() {
  els.panelContainer.innerHTML = '';
  for (const p of cur.panels) {
    const el = document.createElement('div');
    el.className = 'panel';
    if (p.id === cur.selectedPanelId) el.classList.add('selected');
    el.dataset.panelId = String(p.id);
    // 隣接コマ間にフル gutter、外周にはハーフ gutter の余白を取り、各コマが独立した箱に見えるようにする。
    // gutter は CSS 変数経由なのでスライダー操作で再描画なしに反映される。
    applyPanelLayoutStyle(el, p);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPanel(p.id);
    });
    // dblclick は panelContainer 側に一本化（panel ごとに付けても renderPanels の
    // DOM 再生成タイミングで成立しなくなるため）
    // 以下のハンドラは全 panel に常時アタッチ。実行時に「自分が選択中か」をチェックすることで、
    // selectPanel での DOM 再生成を不要にして dblclick イベントが成立する状態を保つ。
    el.addEventListener('mousemove', (e) => {
      if (p.id !== cur.selectedPanelId) return;
      const hit = getEdgeFromPoint(el, p, e.clientX, e.clientY);
      if (hit && !hit.resizable) el.style.cursor = 'not-allowed';
      else if (hit) el.style.cursor = cursorForEdge(hit.edge);
      else if (p.material) el.style.cursor = 'grab';
      else el.style.cursor = 'pointer';
    });
    el.addEventListener('mouseleave', () => { el.style.cursor = ''; });
    el.addEventListener('mousedown', (e) => {
      if (p.id !== cur.selectedPanelId) return;
      if (e.button !== 0) return;
      const hit = getEdgeFromPoint(el, p, e.clientX, e.clientY);
      if (hit && hit.resizable) {
        startEdgeDrag(p, hit.edge, e);
      } else if (p.material) {
        startMaterialDrag(p, el, e);
      }
    });
    // ホイールで拡縮、Shift+ホイールで回転
    el.addEventListener('wheel', (e) => {
      if (p.id !== cur.selectedPanelId) return;
      if (!p.material) return;
      e.preventDefault();
      const img = el.querySelector('.panel-material');
      if (e.shiftKey) {
        const step = e.deltaY < 0 ? -5 : 5;
        p.material.rotation = ((p.material.rotation || 0) + step) % 360;
      } else {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        p.material.scale = Math.max(0.1, Math.min(10, (p.material.scale || 1) * factor));
      }
      if (img) applyMaterialTransform(img, p, el);
    }, { passive: false });
    els.panelContainer.appendChild(el);
    mountMaterialOnPanel(el, p);
  }
  updatePanelControls();
}

// 選択切替は DOM 再生成せず、.selected クラスの付け外しだけで済ませる。
// renderPanels を呼ぶと dblclick イベントが成立しなくなるため。
// 排他: テキスト選択は同時に解除（アプリ全体で選択オブジェクトは常に 1 つ）。
function selectPanel(id) {
  if (cur.selectedId != null) {
    cur.selectedId = null;
    cur.layers.forEach((l) => l.el.classList.remove('selected'));
    updateInspector();
  }
  if (cur.selectedPanelId === id) return;
  if (cur.selectedPanelId != null) {
    const prev = els.panelContainer.querySelector(`[data-panel-id="${cur.selectedPanelId}"]`);
    if (prev) prev.classList.remove('selected');
  }
  cur.selectedPanelId = id;
  if (id != null) {
    const next = els.panelContainer.querySelector(`[data-panel-id="${id}"]`);
    if (next) next.classList.add('selected');
  }
  updatePanelControls();
}

function updatePanelControls() {
  const sel = getSelectedPanel();
  const hasSelection = sel != null;
  els.splitTopBottomBtn.disabled = !hasSelection;
  els.splitLeftRightBtn.disabled = !hasSelection;
  els.deletePanelBtn.disabled = !canDeletePanel(sel);
  els.panelMaterialProps.hidden = !(hasSelection && sel.material);
}

function getSelectedPanel() {
  return cur.panels.find((p) => p.id === cur.selectedPanelId) || null;
}

// 削除パネル吸収のための「最良の辺」を探す。
// 戻り値 null: クリーンタイリングが成立する辺が無い（=削除不可）
// 戻り値 { edge, neighbors }: その辺の隣接群が削除パネルの空きを埋められる
function findBestDeleteEdge(panel) {
  const candidates = [];
  for (const edge of ['top', 'right', 'bottom', 'left']) {
    const neighbors = findAlignedNeighbors(panel, edge);
    if (neighbors === null) continue;
    if (neighbors.length === 0) continue; // キャンバス外周（隣接なし）
    candidates.push({ edge, neighbors });
  }
  if (candidates.length === 0) return null;
  // 隣接数が少ない辺を優先（単純な吸収ほど見た目が綺麗）
  candidates.sort((a, b) => a.neighbors.length - b.neighbors.length);
  return candidates[0];
}

function canDeletePanel(panel) {
  if (!panel) return false;
  if (cur.panels.length <= 1) return false;
  return findBestDeleteEdge(panel) !== null;
}

function deleteSelectedPanel() {
  const panel = getSelectedPanel();
  if (!panel) return;
  if (cur.panels.length <= 1) return;
  const choice = findBestDeleteEdge(panel);
  if (!choice) return;
  // 隣接コマを削除パネル側へ拡張。qEdge は隣接コマ q のうち panel に接している辺。
  for (const { panel: q, edge: qEdge } of choice.neighbors) {
    if (qEdge === 'left') { q.x = panel.x; q.w += panel.w; }
    else if (qEdge === 'right') { q.w += panel.w; }
    else if (qEdge === 'top') { q.y = panel.y; q.h += panel.h; }
    else /* bottom */ { q.h += panel.h; }
  }
  cur.panels = cur.panels.filter((p) => p.id !== panel.id);
  cur.selectedPanelId = null;
  renderPanels();
  updateActionButtons();
}

function splitSelectedPanel(direction) {
  const panel = getSelectedPanel();
  if (!panel) return;
  const idx = cur.panels.indexOf(panel);
  // 素材は元コマ（先頭側）にだけ引き継ぐ。もう一方は空のコマになる。
  let a, b;
  if (direction === 'topBottom') {
    a = { id: cur.nextPanelId++, x: panel.x, y: panel.y,             w: panel.w, h: panel.h / 2, material: panel.material };
    b = { id: cur.nextPanelId++, x: panel.x, y: panel.y + panel.h / 2, w: panel.w, h: panel.h / 2, material: null };
  } else {
    a = { id: cur.nextPanelId++, x: panel.x,             y: panel.y, w: panel.w / 2, h: panel.h, material: panel.material };
    b = { id: cur.nextPanelId++, x: panel.x + panel.w / 2, y: panel.y, w: panel.w / 2, h: panel.h, material: null };
  }
  cur.panels.splice(idx, 1, a, b);
  cur.selectedPanelId = a.id;
  renderPanels();
}

function applyTemplate(templateId) {
  const tmpl = TEMPLATES[templateId];
  if (!tmpl) return;
  cur.template = templateId;
  cur.panels = tmpl.panels.map((p) => ({
    id: cur.nextPanelId++,
    x: p.x, y: p.y, w: p.w, h: p.h,
    material: null,
  }));
  cur.selectedPanelId = null;
  refreshPageView();
}

function switchToPage(index) {
  if (index < 0 || index >= state.pages.length) return;
  if (index === state.currentPageIndex) return;
  // いまのページのレイヤー DOM を退避(削除はしない、要素は残す)
  for (const l of cur.layers) l.el.remove();
  state.currentPageIndex = index;
  cur = state.pages[index];
  refreshPageView();
  updatePageIndicator();
  syncMemoFromPage();
}

els.prevPageBtn.addEventListener('click', () => switchToPage(state.currentPageIndex - 1));
els.nextPageBtn.addEventListener('click', () => switchToPage(state.currentPageIndex + 1));

els.templateSelect.addEventListener('change', () => {
  const newTemplate = els.templateSelect.value;
  if (newTemplate !== cur.template && cur.panels.some((p) => p.material)) {
    if (!confirm('テンプレートを変更すると、各コマに配置した画像はすべて消えます。よろしいですか?')) {
      els.templateSelect.value = cur.template;
      return;
    }
  }
  applyTemplate(newTemplate);
});

function applyPanelBorderWidth(px) {
  document.documentElement.style.setProperty('--panel-border-width', `${px}px`);
  els.panelBorderValue.textContent = String(px);
}

function applyPanelGutter(px) {
  document.documentElement.style.setProperty('--panel-gutter', `${px}px`);
  document.documentElement.style.setProperty('--panel-half-gutter', `${px / 2}px`);
  els.panelGutterValue.textContent = String(px);
}

els.panelBorderInput.addEventListener('input', () => {
  applyPanelBorderWidth(Number(els.panelBorderInput.value));
});

els.panelGutterInput.addEventListener('input', () => {
  applyPanelGutter(Number(els.panelGutterInput.value));
});

els.splitTopBottomBtn.addEventListener('click', () => splitSelectedPanel('topBottom'));
els.splitLeftRightBtn.addEventListener('click', () => splitSelectedPanel('leftRight'));
els.deletePanelBtn.addEventListener('click', () => deleteSelectedPanel());

els.materialResetBtn.addEventListener('click', () => {
  const sel = getSelectedPanel();
  if (!sel || !sel.material) return;
  sel.material.tx = 0;
  sel.material.ty = 0;
  sel.material.scale = 1;
  sel.material.rotation = 0;
  const el = els.panelContainer.querySelector(`[data-panel-id="${sel.id}"]`);
  const img = el && el.querySelector('.panel-material');
  if (img) applyMaterialTransform(img, sel, el);
});

els.materialRemoveBtn.addEventListener('click', () => {
  const sel = getSelectedPanel();
  if (!sel || !sel.material) return;
  sel.material = null;
  renderPanels();
  updateActionButtons();
});

applyPanelBorderWidth(Number(els.panelBorderInput.value));
applyPanelGutter(Number(els.panelGutterInput.value));

// コマのダブルクリックで画像ピッカーを開く。panel ごとに付けると selectPanel →
// renderPanels の DOM 再生成で dblclick が成立しないため、コンテナに一本化する。
els.panelContainer.addEventListener('dblclick', (e) => {
  const panel = findPanelAtClientPoint(e.clientX, e.clientY);
  if (!panel) return;
  e.stopPropagation();
  openImagePickerForPanel(panel);
});

els.deletePageBtn.addEventListener('click', () => {
  if (isPageEmpty(cur)) return;
  if (!confirm(`ページ ${state.currentPageIndex + 1} のコマ・素材・テキストをすべて消去します。よろしいですか?`)) return;
  for (const l of cur.layers) l.el.remove();
  state.pages[state.currentPageIndex] = createEmptyPage();
  cur = state.pages[state.currentPageIndex];
  refreshPageView();
  syncMemoFromPage();
});

updatePageIndicator();

function populateFontSelect() {
  els.propFont.innerHTML = '';
  for (const f of FONTS) {
    const opt = document.createElement('option');
    opt.value = f.name;
    opt.textContent = f.label;
    els.propFont.appendChild(opt);
  }
}
populateFontSelect();

const previewCanvas = document.createElement('canvas');
previewCanvas.className = 'text-preview-canvas';
els.layerContainer.prepend(previewCanvas);

// previewCanvas を生成してから初期描画する（refreshPageView 内で previewCanvas を参照するため）
refreshPageView();

// --- 画像読み込み ---

els.fileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) openFile(file);
  els.fileInput.value = '';
});

// 「開く」ボタン。showOpenFilePicker が使えればハンドル付きで開く（→ 以降 Ctrl+S で上書き保存可能）。
// 非対応ブラウザは従来通り <input type=file> にフォールバック。
async function openProject() {
  if (window.showOpenFilePicker) {
    let handle;
    try {
      [handle] = await window.showOpenFilePicker({
        types: [
          { description: 'Gina プロジェクト', accept: { 'application/zip': [BUNDLE_EXT] } },
          { description: 'メモ', accept: { 'text/plain': ['.txt'] } },
        ],
        multiple: false,
      });
    } catch (err) {
      if (err && err.name === 'AbortError') return; // ユーザーキャンセル
      console.warn('showOpenFilePicker が使えなかったので <input type=file> に切り替えます:', err);
      els.fileInput.click();
      return;
    }
    const file = await handle.getFile();
    const kind = detectFileKind(file);
    if (kind === 'bundle') {
      loadBundleFile(file, handle);
    } else {
      // .mj 以外はハンドル不要（上書き保存対象ではない）
      openFile(file);
    }
    return;
  }
  els.fileInput.click();
}

els.openBtn.addEventListener('click', openProject);

els.stageWrapper.addEventListener('dragover', (e) => {
  e.preventDefault();
  els.stageWrapper.classList.add('dragover');
});
els.stageWrapper.addEventListener('dragleave', () => {
  els.stageWrapper.classList.remove('dragover');
});
els.stageWrapper.addEventListener('drop', (e) => {
  e.preventDefault();
  els.stageWrapper.classList.remove('dragover');
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  // 画像はコマへのドロップだけ受け付ける（コマ外へのドロップは何もしない）
  if (detectFileKind(file) === 'image') {
    const panel = findPanelAtClientPoint(e.clientX, e.clientY);
    if (panel) {
      loadImageAsPanelMaterial(panel, file).catch((err) => {
        console.error(err);
        alert('素材の読み込みに失敗しました: ' + (err && err.message ? err.message : err));
      });
    } else {
      alert('画像はコマの上にドロップしてください。');
    }
    return;
  }
  openFile(file);
});

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(blob);
  });
}

function getImageNaturalSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('画像のデコードに失敗しました'));
    img.src = dataUrl;
  });
}

// --- ステージ上の選択 / 右クリックメニュー ---

// クリック位置(ページ座標 = canvasWidth/Height 基準)を覚えておき、メニューの「テキストを追加」で使う
let contextMenuTargetCoords = { x: 0, y: 0 };

// layer-container は pointer-events: none なので、ステージ全体でメニューを受ける。
// stage は panel-container/layer-container/text-layer すべての親なので、
// 右クリックはどこで起きてもバブリングでここに届く。
els.stage.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const rect = els.stage.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const scaleX = cur.canvasWidth / rect.width;
  const scaleY = cur.canvasHeight / rect.height;
  contextMenuTargetCoords = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
  showContextMenu(e.clientX, e.clientY);
});

function showContextMenu(clientX, clientY) {
  els.contextMenu.style.left = `${clientX}px`;
  els.contextMenu.style.top = `${clientY}px`;
  els.contextMenu.hidden = false;
  // 画面外にはみ出していたら寄せる
  const rect = els.contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    els.contextMenu.style.left = `${Math.max(0, window.innerWidth - rect.width - 4)}px`;
  }
  if (rect.bottom > window.innerHeight) {
    els.contextMenu.style.top = `${Math.max(0, window.innerHeight - rect.height - 4)}px`;
  }
}

function hideContextMenu() {
  els.contextMenu.hidden = true;
}

els.contextMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.context-menu-item');
  if (!item) return;
  const action = item.dataset.action;
  hideContextMenu();
  if (action === 'add-text') {
    addTextLayer({ x: contextMenuTargetCoords.x, y: contextMenuTargetCoords.y });
  } else if (action === 'add-monologue') {
    addTextLayer({ x: contextMenuTargetCoords.x, y: contextMenuTargetCoords.y, kind: 'monologue' });
  } else if (action === 'add-bubble') {
    addStickerLayer({ x: contextMenuTargetCoords.x, y: contextMenuTargetCoords.y, src: STICKER_DEFAULT_SRC });
  }
});

// メニュー外のマウスダウンで閉じる(キャプチャ段階で他の stopPropagation より先に拾う)
document.addEventListener('mousedown', (e) => {
  if (els.contextMenu.hidden) return;
  if (els.contextMenu.contains(e.target)) return;
  hideContextMenu();
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.contextMenu.hidden) {
    hideContextMenu();
  }
});

// Ctrl(または Cmd)+S/O/E のグローバルショートカット。
// ブラウザ標準動作(ページ保存・ファイル選択)を抑止して各ボタンに割り当てる。
// Ctrl+S = 上書き保存（ハンドル有なら無確認、無ければダイアログ） / Ctrl+Shift+S = 名前を付けて保存。
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  if (e.altKey) return;
  const key = e.key.toLowerCase();
  if (key === 's') {
    e.preventDefault();
    if (!anyPageHasContent()) return;
    saveProject({ saveAs: e.shiftKey });
    return;
  }
  if (e.shiftKey) return; // 以降の O / E は Shift 付きでは反応しない
  if (key === 'o') {
    e.preventDefault();
    openProject();
  } else if (key === 'e') {
    e.preventDefault();
    if (!els.exportBtn.disabled) els.exportBtn.click();
  }
});

function addTextLayer({ x, y, text = 'テキスト', font, size, orientation, lineHeight, kind = 'text' }, targetPage = cur) {
  const id = targetPage.nextId++;
  const layer = {
    id,
    text,
    x,
    y,
    font: font || els.propFont.value || 'GenEiAntiquePv6',
    size: size ?? 24,
    orientation: orientation || 'horizontal',
    lineHeight: lineHeight ?? 1.1,
    kind,
    el: null,
  };
  const el = document.createElement('div');
  el.className = 'text-layer';
  if (kind === 'monologue') el.classList.add('monologue');
  el.dataset.id = String(id);
  el.textContent = text;
  layer.el = el;
  targetPage.layers.push(layer);

  attachLayerHandlers(layer);
  if (targetPage === cur) {
    els.layerContainer.appendChild(el);
    applyLayerStyle(layer);
    renderTextPreview();
    selectLayer(id);
    updateActionButtons();
  }
}

// 吹き出しステッカー(独立配置の画像レイヤー)。テキストレイヤー配列(cur.layers)に
// 同居させて、選択/削除/Delete/矢印キー移動などの既存ロジックを再利用する。
function addStickerLayer({ x, y, src, width, height }, targetPage = cur) {
  const id = targetPage.nextId++;
  const layer = {
    id,
    kind: 'sticker',
    src,
    x,
    y,
    width: width || 0,
    height: height || 0,
    el: null,
  };
  const el = document.createElement('img');
  el.className = 'sticker-layer';
  el.draggable = false;
  el.dataset.id = String(id);
  el.src = src;
  layer.el = el;
  targetPage.layers.push(layer);
  attachStickerHandlers(layer);
  if (targetPage === cur) {
    // ステッカーは text-preview-canvas より前(DOM 順で先 = 視覚的に背面)に挿入し、
    // テキスト(canvas でレンダリング)が常にステッカーの上に出るようにする
    els.layerContainer.insertBefore(el, previewCanvas);
    // 自然サイズ未指定なら、画像ロード後にデフォルト幅で初期化する
    const initFromNatural = () => {
      if (!layer.width || !layer.height) {
        const nw = el.naturalWidth || STICKER_DEFAULT_WIDTH;
        const nh = el.naturalHeight || STICKER_DEFAULT_WIDTH;
        const aspect = nh / nw;
        layer.width = STICKER_DEFAULT_WIDTH;
        layer.height = STICKER_DEFAULT_WIDTH * aspect;
        applyStickerStyle(layer);
      }
    };
    if (el.complete && el.naturalWidth > 0) {
      initFromNatural();
    } else {
      el.addEventListener('load', initFromNatural, { once: true });
    }
    applyStickerStyle(layer);
    selectLayer(id);
    updateActionButtons();
  }
}

function attachStickerHandlers(layer) {
  const el = layer.el;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectLayer(layer.id);
    const rect = els.layerContainer.getBoundingClientRect();
    const scaleX = cur.canvasWidth / rect.width;
    const scaleY = cur.canvasHeight / rect.height;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = layer.x;
    const origY = layer.y;
    const onMove = (ev) => {
      layer.x = origX + (ev.clientX - startX) * scaleX;
      layer.y = origY + (ev.clientY - startY) * scaleY;
      applyStickerStyle(layer);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    selectLayer(layer.id);
  });

  // ホイールで中心を保ったまま拡縮
  el.addEventListener('wheel', (e) => {
    if (cur.selectedId !== layer.id) return;
    if (!layer.width || !layer.height) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    layer.width = Math.max(20, layer.width * factor);
    layer.height = Math.max(20, layer.height * factor);
    layer.x = cx - layer.width / 2;
    layer.y = cy - layer.height / 2;
    applyStickerStyle(layer);
  }, { passive: false });
}

function applyStickerStyle(layer) {
  const el = layer.el;
  const displayWidth = els.layerContainer.clientWidth;
  if (displayWidth === 0 || cur.canvasWidth === 0) return;
  const scale = displayWidth / cur.canvasWidth;
  el.style.left = `${layer.x * scale}px`;
  el.style.top = `${layer.y * scale}px`;
  el.style.width = `${(layer.width || 0) * scale}px`;
  el.style.height = `${(layer.height || 0) * scale}px`;
}

// --- レイヤーのドラッグ・選択・編集 ---

function attachLayerHandlers(layer) {
  const el = layer.el;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // 左クリックのみドラッグ開始
    if (el.classList.contains('editing')) return;
    e.stopPropagation();
    selectLayer(layer.id);

    const rect = els.layerContainer.getBoundingClientRect();
    const scaleX = cur.canvasWidth / rect.width;
    const scaleY = cur.canvasHeight / rect.height;
    const startX = e.clientX;
    const startY = e.clientY;
    const origLayerX = layer.x;
    const origLayerY = layer.y;

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) * scaleX;
      const dy = (ev.clientY - startY) * scaleY;
      layer.x = origLayerX + dx;
      layer.y = origLayerY + dy;
      applyLayerStyle(layer);
      renderTextPreview();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    selectLayer(layer.id);
  });

  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    enterEditMode(layer);
  });
}

function enterEditMode(layer) {
  layer.el.classList.add('editing');
  layer.el.contentEditable = 'true';
  layer.el.focus();
  renderTextPreview();

  // テキスト全体を選択
  const range = document.createRange();
  range.selectNodeContents(layer.el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finish = () => {
    layer.el.classList.remove('editing');
    layer.el.contentEditable = 'false';
    layer.text = layer.el.innerText;
    els.propText.value = layer.text;
    layer.el.removeEventListener('blur', finish);
    applyLayerStyle(layer);
    renderTextPreview();
  };
  layer.el.addEventListener('blur', finish);
}

// 排他: コマ選択は同時に解除（アプリ全体で選択オブジェクトは常に 1 つ）。
function selectLayer(id) {
  if (cur.selectedPanelId != null) {
    const prev = els.panelContainer.querySelector(`[data-panel-id="${cur.selectedPanelId}"]`);
    if (prev) prev.classList.remove('selected');
    cur.selectedPanelId = null;
    updatePanelControls();
  }
  cur.selectedId = id;
  cur.layers.forEach((l) => {
    l.el.classList.toggle('selected', l.id === id);
  });
  updateInspector();
}

function deselect() {
  cur.selectedId = null;
  cur.layers.forEach((l) => l.el.classList.remove('selected'));
  selectPanel(null);
  updateInspector();
}

// ステージ外をクリックしたら選択解除
els.stageWrapper.addEventListener('click', (e) => {
  if (e.target === els.stageWrapper) {
    deselect();
  }
});

// 矢印キーで選択中レイヤーを1pxずつ移動(微調整)
const ARROW_DELTAS = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
};

function isEditableTarget() {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (active.isContentEditable) return true;
  return false;
}

function deleteLayer(layer) {
  layer.el.remove();
  cur.layers = cur.layers.filter((l) => l.id !== layer.id);
  renderTextPreview();
  deselect();
  updateActionButtons();
}

document.addEventListener('keydown', (e) => {
  if (isEditableTarget()) return;

  // Ctrl+←/→ でページ移動(選択状態に関係なく動作)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    switchToPage(state.currentPageIndex + (e.key === 'ArrowRight' ? 1 : -1));
    return;
  }

  // パネル選択中（テキスト/ステッカー未選択）に Delete でコマ削除。
  // selectPanel / selectLayer は排他的なので getSelectedLayer() は null のはず。
  if (e.key === 'Delete' && cur.selectedPanelId != null && !getSelectedLayer()) {
    if (canDeletePanel(getSelectedPanel())) {
      e.preventDefault();
      deleteSelectedPanel();
    }
    return;
  }

  const layer = getSelectedLayer();
  if (!layer) return;

  // Ctrl+↑/↓ で文字サイズを変更(スライダーと同じ 8〜120 の範囲)。ステッカーには適用しない
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    if (layer.kind === 'sticker') return;
    e.preventDefault();
    const sizeDelta = e.key === 'ArrowUp' ? 1 : -1;
    layer.size = Math.max(8, Math.min(120, layer.size + sizeDelta));
    applyLayerStyle(layer);
    renderTextPreview();
    updateInspector();
    return;
  }

  const delta = ARROW_DELTAS[e.key];
  if (delta && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    layer.x += delta.dx;
    layer.y += delta.dy;
    applyLayerStyle(layer);
    renderTextPreview();
    return;
  }

  if (e.key === 'Delete') {
    e.preventDefault();
    deleteLayer(layer);
  }
});

function getSelectedLayer() {
  return cur.layers.find((l) => l.id === cur.selectedId) || null;
}

// --- スタイル反映 ---

function applyLayerStyle(layer) {
  if (layer.kind === 'sticker') {
    applyStickerStyle(layer);
    return;
  }
  const el = layer.el;
  // ページ座標(cur.canvasWidth/Height) → 表示座標
  const displayWidth = els.layerContainer.clientWidth;
  if (displayWidth === 0 || cur.canvasWidth === 0) return;
  const scale = displayWidth / cur.canvasWidth;
  const bounds = measureTextLayerBounds(layer);
  el.style.left = `${(layer.x + bounds.x) * scale}px`;
  el.style.top = `${(layer.y + bounds.y) * scale}px`;
  el.style.width = `${Math.max(bounds.width * scale, layer.size * scale)}px`;
  el.style.height = `${Math.max(bounds.height * scale, layer.size * scale)}px`;
  el.style.fontFamily = `'${layer.font}', sans-serif`;
  el.style.fontSize = `${layer.size * scale}px`;
  el.style.lineHeight = String(layer.lineHeight);
  el.style.padding = layer.kind === 'monologue' ? `${MONOLOGUE_PADDING * scale}px` : '';
  el.classList.toggle('vertical', layer.orientation === 'vertical');
  el.classList.toggle('monologue', layer.kind === 'monologue');
}

function applyAllLayerStyles() {
  cur.layers.forEach(applyLayerStyle);
  renderTextPreview();
}

// ステージのリサイズ(ウィンドウサイズ変更等)に追随
window.addEventListener('resize', () => {
  applyAllLayerStyles();
  for (const p of cur.panels) {
    if (!p.material) continue;
    const el = els.panelContainer.querySelector(`[data-panel-id="${p.id}"]`);
    const img = el && el.querySelector('.panel-material');
    if (img) applyMaterialTransform(img, p, el);
  }
});
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(applyAllLayerStyles).catch(() => {});
}

// --- インスペクター ---

function updateInspector() {
  const layer = getSelectedLayer();
  if (!layer) {
    els.textProps.hidden = true;
    els.stickerProps.hidden = true;
    return;
  }
  if (layer.kind === 'sticker') {
    els.textProps.hidden = true;
    els.stickerProps.hidden = false;
    updateBubblePickerSelection(layer);
    return;
  }
  els.stickerProps.hidden = true;
  els.textProps.hidden = false;
  els.propText.value = layer.text;
  els.propFont.value = layer.font;
  els.propSize.value = String(layer.size);
  els.propSizeValue.textContent = String(layer.size);
  els.propOrientation.value = layer.orientation;
  els.propLineHeight.value = String(layer.lineHeight);
  els.propLineHeightValue.textContent = String(layer.lineHeight);
}

els.propText.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.text = els.propText.value;
  layer.el.textContent = layer.text;
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propFont.addEventListener('change', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.font = els.propFont.value;
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propSize.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.size = Number(els.propSize.value);
  els.propSizeValue.textContent = String(layer.size);
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propOrientation.addEventListener('change', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.orientation = els.propOrientation.value;
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propLineHeight.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.lineHeight = Number(els.propLineHeight.value);
  els.propLineHeightValue.textContent = String(layer.lineHeight);
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propDelete.addEventListener('click', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  deleteLayer(layer);
});

els.stickerDelete.addEventListener('click', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  deleteLayer(layer);
});

// --- 吹き出しピッカー(形状の差し替え) ---

function initBubblePicker() {
  const picker = els.bubblePicker;
  if (!picker) return;
  for (const src of BUBBLE_CATALOG) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bubble-thumb';
    btn.dataset.src = src;
    // ツールチップ: 末尾2階層(vertical/bubble-xx.png)を出す
    const parts = src.split('/');
    btn.title = parts.slice(-2).join('/');
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.draggable = false;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      const layer = getSelectedLayer();
      if (!layer || layer.kind !== 'sticker') return;
      changeStickerSrc(layer, src);
    });
    picker.appendChild(btn);
  }
}

function changeStickerSrc(layer, src) {
  if (layer.src === src) return;
  layer.src = src;
  layer.el.src = src;
  // 新しい画像の自然サイズに合わせて高さを再計算(幅は維持)
  const apply = () => {
    const nw = layer.el.naturalWidth;
    const nh = layer.el.naturalHeight;
    if (nw && nh && layer.width) {
      layer.height = layer.width * (nh / nw);
      applyStickerStyle(layer);
    }
  };
  if (layer.el.complete && layer.el.naturalWidth > 0) {
    apply();
  } else {
    layer.el.addEventListener('load', apply, { once: true });
  }
  updateBubblePickerSelection(layer);
}

function updateBubblePickerSelection(layer) {
  const picker = els.bubblePicker;
  if (!picker) return;
  for (const btn of picker.querySelectorAll('.bubble-thumb')) {
    btn.classList.toggle('selected', btn.dataset.src === layer.src);
  }
}

initBubblePicker();

// --- PNG 書き出し ---
// canvasWidth × canvasHeight の白いページに、コマ・素材・テキストを合成して PNG 化する。

// 素材の cover フィット計算（DOM 用と canvas 用で共有できる pure 計算）。
// 戻り値は panel 矩形ローカル座標での素材の最終配置情報。
function computeMaterialPlacement(material, panelW, panelH) {
  if (!material || panelW === 0 || panelH === 0) return null;
  if (material.naturalWidth === 0 || material.naturalHeight === 0) return null;
  const coverScale = Math.max(panelW / material.naturalWidth, panelH / material.naturalHeight);
  const finalW = material.naturalWidth * coverScale * (material.scale || 1);
  const finalH = material.naturalHeight * coverScale * (material.scale || 1);
  const cx = panelW / 2 + (material.tx || 0) * panelW;
  const cy = panelH / 2 + (material.ty || 0) * panelH;
  return { finalW, finalH, cx, cy, rotation: material.rotation || 0 };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('素材画像のデコードに失敗しました'));
    img.src = src;
  });
}

// renderPanels と同じピクセル矩形を canvas 用に再現する。
// gutter は panel 同士の間に「フル gutter」、外周には「ハーフ gutter」入る CSS と同じレイアウト。
function computePanelPixelRect(panel, pageW, pageH, gutterPx) {
  const half = gutterPx / 2;
  return {
    x: panel.x * pageW + half,
    y: panel.y * pageH + half,
    w: panel.w * pageW - gutterPx,
    h: panel.h * pageH - gutterPx,
  };
}

// 現在ページのコマと素材を canvas に合成する。テキストは呼び出し側で別途。
async function drawPanelsAndMaterials(ctx, page, pageW, pageH) {
  if (page.panels.length === 0) return;
  // プレビューの表示寸法 → 出力寸法のスケール比で gutter/border-width を拡大（B-2）
  const previewW = els.panelContainer.clientWidth || pageW;
  const scale = pageW / previewW;
  const gutterCss = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-gutter')) || 0;
  const borderCss = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-border-width')) || 0;
  const gutterPx = gutterCss * scale;
  const borderPx = borderCss * scale;

  // 素材画像を並列ロード
  const materialImgs = await Promise.all(
    page.panels.map((p) => (p.material ? loadImageElement(p.material.src).catch(() => null) : null))
  );

  page.panels.forEach((p, i) => {
    const rect = computePanelPixelRect(p, pageW, pageH, gutterPx);
    if (rect.w <= 0 || rect.h <= 0) return;

    // 素材描画は枠の内側にクリップ
    if (p.material && materialImgs[i]) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      const place = computeMaterialPlacement(p.material, rect.w, rect.h);
      if (place) {
        ctx.translate(rect.x + place.cx, rect.y + place.cy);
        ctx.rotate((place.rotation * Math.PI) / 180);
        ctx.drawImage(materialImgs[i], -place.finalW / 2, -place.finalH / 2, place.finalW, place.finalH);
      }
      ctx.restore();
    }

    // 枠線（CSS の border-box を再現: 矩形の内側に半幅オフセットで描く）
    if (borderPx > 0) {
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = borderPx;
      const inset = borderPx / 2;
      ctx.strokeRect(rect.x + inset, rect.y + inset, rect.w - borderPx, rect.h - borderPx);
      ctx.restore();
    }
  });
}

async function ensureExportFontsReady() {
  const usedFonts = new Set();
  for (const layer of cur.layers) {
    if (FONT_FILES[layer.font]) usedFonts.add(layer.font);
  }
  if (!document.fonts) return;
  await Promise.all([...usedFonts].map((name) => document.fonts.load(`16px "${name}"`)));
  if (document.fonts.ready) {
    await document.fonts.ready;
  }
}

function splitTextLines(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

function setupTextContext(ctx, layer) {
  ctx.fillStyle = '#000';
  ctx.font = `${layer.size}px "${layer.font}", sans-serif`;
}

function getVerticalGlyphOffset(char, size) {
  if ('、。，．､｡'.includes(char)) {
    return {
      x: size * 0.25,
      y: -size * 0.45,
    };
  }
  return { x: 0, y: 0 };
}

function drawVerticalGlyph(ctx, char, x, y, size) {
  const offset = getVerticalGlyphOffset(char, size);
  const drawX = x + offset.x;
  const drawY = y + offset.y;

  if ('…‥ーｰ'.includes(char)) {
    ctx.save();
    ctx.translate(drawX, drawY + size / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(char, 0, -size / 2);
    ctx.restore();
    return;
  }

  ctx.fillText(char, drawX, drawY);
}

function measureTextLayerBounds(layer) {
  if (layer.kind === 'bubble') {
    const s = computeBubbleShape(layer);
    const left = Math.min(s.cx - s.rx, s.tipX) - BUBBLE_BORDER;
    const top = Math.min(s.cy - s.ry, s.tipY) - BUBBLE_BORDER;
    const right = Math.max(s.cx + s.rx, s.tipX) + BUBBLE_BORDER;
    const bottom = Math.max(s.cy + s.ry, s.tipY) + BUBBLE_BORDER;
    return { x: left, y: top, width: right - left, height: bottom - top };
  }
  const padding = layer.kind === 'monologue' ? MONOLOGUE_PADDING : 0;
  const lines = splitTextLines(layer.text);
  const lineAdvance = layer.size * layer.lineHeight;
  if (layer.orientation === 'vertical') {
    const columns = Math.max(lines.length, 1);
    const rows = Math.max(...lines.map((line) => [...line].length), 1);
    return {
      x: -lineAdvance * (columns - 1) - padding,
      y: -padding,
      width: lineAdvance * (columns - 1) + layer.size + padding * 2,
      height: lineAdvance * (rows - 1) + layer.size + padding * 2,
    };
  }

  const canvas = measureTextLayerBounds.canvas || document.createElement('canvas');
  measureTextLayerBounds.canvas = canvas;
  const ctx = canvas.getContext('2d');
  setupTextContext(ctx, layer);
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width), layer.size);
  return {
    x: -padding,
    y: -padding,
    width: width + padding * 2,
    height: Math.max(lines.length, 1) * lineAdvance + padding * 2,
  };
}

function syncPreviewCanvasSize() {
  previewCanvas.width = cur.canvasWidth;
  previewCanvas.height = cur.canvasHeight;
  previewCanvas.style.width = `${els.layerContainer.clientWidth}px`;
  previewCanvas.style.height = `${els.layerContainer.clientHeight}px`;
  return previewCanvas.width > 0 && previewCanvas.height > 0;
}

function renderTextPreview() {
  if (!syncPreviewCanvasSize()) return;
  const ctx = previewCanvas.getContext('2d');
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  cur.layers.forEach((layer) => {
    // ステッカー(画像)は DOM の <img> として直接表示するのでプレビュー canvas には描かない
    if (layer.kind === 'sticker') return;
    if (!layer.el.classList.contains('editing')) {
      drawTextLayer(ctx, layer);
    }
  });
}

function drawHorizontalTextLayer(ctx, layer) {
  setupTextContext(ctx, layer);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lineAdvance = layer.size * layer.lineHeight;
  splitTextLines(layer.text).forEach((line, index) => {
    ctx.fillText(line, layer.x, layer.y + lineAdvance * index);
  });
}

function drawVerticalTextLayer(ctx, layer) {
  setupTextContext(ctx, layer);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const charAdvance = layer.size * layer.lineHeight;
  const columnAdvance = layer.size * layer.lineHeight;
  splitTextLines(layer.text).forEach((column, columnIndex) => {
    const x = layer.x + layer.size / 2 - columnAdvance * columnIndex;
    for (const [charIndex, char] of [...column].entries()) {
      drawVerticalGlyph(ctx, char, x, layer.y + charAdvance * charIndex, layer.size);
    }
  });
}

// テキストの矩形(横書きなら原点が左上、縦書きなら最初の列の上端)を返す。
// computeBubbleShape からだけ使う pure 関数で、measureTextLayerBounds の
// 既存ロジックと同じ計算を分離したもの。
function measureBubbleTextRect(layer) {
  const lines = splitTextLines(layer.text);
  const lineAdvance = layer.size * layer.lineHeight;
  if (layer.orientation === 'vertical') {
    const columns = Math.max(lines.length, 1);
    const rows = Math.max(...lines.map((line) => [...line].length), 1);
    return {
      x: -lineAdvance * (columns - 1),
      y: 0,
      width: lineAdvance * (columns - 1) + layer.size,
      height: lineAdvance * (rows - 1) + layer.size,
    };
  }
  const canvas = measureTextLayerBounds.canvas || document.createElement('canvas');
  measureTextLayerBounds.canvas = canvas;
  const ctx = canvas.getContext('2d');
  setupTextContext(ctx, layer);
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width), layer.size);
  return {
    x: 0,
    y: 0,
    width,
    height: Math.max(lines.length, 1) * lineAdvance,
  };
}

// フキダシの本体(楕円)+ 尾(先端 tip)のジオメトリをまとめて算出。
// すべて layer.x / layer.y を原点としたローカル座標で返す。
function computeBubbleShape(layer) {
  const textRect = measureBubbleTextRect(layer);
  const cx = textRect.x + textRect.width / 2;
  const cy = textRect.y + textRect.height / 2;
  // 矩形に外接する楕円は半径を √2 倍にすると四隅をちょうど通る。
  // パディングを足してから √2 倍することで「テキストから一定の余白」を持つフキダシになる。
  const halfW = textRect.width / 2 + BUBBLE_PADDING_X;
  const halfH = textRect.height / 2 + BUBBLE_PADDING_Y;
  const rx = Math.max(halfW * Math.SQRT2, BUBBLE_MIN_RX);
  const ry = Math.max(halfH * Math.SQRT2, BUBBLE_MIN_RY);
  const tipX = cx + BUBBLE_TAIL_OFFSET_X;
  const tipY = cy + BUBBLE_TAIL_OFFSET_Y;
  // 楕円の媒介変数角(rx*cosθ, ry*sinθ) が tip 方向に来る θ を求める
  const tipAngle = Math.atan2((tipY - cy) * rx, (tipX - cx) * ry);
  return { cx, cy, rx, ry, tipX, tipY, tipAngle };
}

// 楕円本体 → 尾 → 楕円本体 と一筆書きでパスを構築する。
// 尾は楕円上の p1/p2 から tip まで直線で結ぶ純粋な三角形。先端は完全に尖る。
function drawSpeechBubblePath(ctx, shape) {
  const { cx, cy, rx, ry, tipX, tipY, tipAngle } = shape;
  const a1 = tipAngle - BUBBLE_TAIL_HALF_ANGLE;
  const a2 = tipAngle + BUBBLE_TAIL_HALF_ANGLE;

  ctx.beginPath();
  // a2 → a1+2π の長い方を回って戻ってくる(尾の付け根のコードを空ける)
  ctx.ellipse(cx, cy, rx, ry, 0, a2, a1 + 2 * Math.PI);
  // 楕円弧の終点 = p1。直線で tip へ。closePath で tip → p2(始点)へ戻り三角形が閉じる。
  ctx.lineTo(tipX, tipY);
  ctx.closePath();
}

function drawBubbleBox(ctx, layer) {
  const shape = computeBubbleShape(layer);
  ctx.save();
  ctx.translate(layer.x, layer.y);
  drawSpeechBubblePath(ctx, shape);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = BUBBLE_BORDER;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 10;
  ctx.stroke();
  ctx.restore();
}

function drawMonologueBox(ctx, layer) {
  const bounds = measureTextLayerBounds(layer);
  const x = layer.x + bounds.x;
  const y = layer.y + bounds.y;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, bounds.width, bounds.height);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = MONOLOGUE_BORDER;
  const inset = MONOLOGUE_BORDER / 2;
  ctx.strokeRect(x + inset, y + inset, bounds.width - MONOLOGUE_BORDER, bounds.height - MONOLOGUE_BORDER);
}

function drawTextLayer(ctx, layer) {
  if (layer.kind === 'monologue') {
    drawMonologueBox(ctx, layer);
  } else if (layer.kind === 'bubble') {
    drawBubbleBox(ctx, layer);
  }
  if (layer.orientation === 'vertical') {
    drawVerticalTextLayer(ctx, layer);
  } else {
    drawHorizontalTextLayer(ctx, layer);
  }
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        resolve(pngBlob);
      } else {
        reject(new Error('PNG blob could not be created.'));
      }
    }, 'image/png');
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 保存ダイアログで場所を選んで書き出す(未対応ブラウザはダウンロードフォルダへ)
async function saveBlob(blob, suggestedName, { description, mimeType, extension }) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description, accept: { [mimeType]: [extension] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return; // ユーザーキャンセル
      console.warn('showSaveFilePicker が使えなかったので通常ダウンロードに切り替えます:', err);
    }
  }
  downloadBlob(blob, suggestedName);
}

// --- プロジェクト保存・読み込み(テキストレイヤー) ---

const PROJECT_VERSION = 2;

function buildProjectData(page = cur) {
  return {
    version: PROJECT_VERSION,
    canvas: {
      width: page.canvasWidth,
      height: page.canvasHeight,
    },
    layers: page.layers.map((l) => {
      if (l.kind === 'sticker') {
        return {
          kind: 'sticker',
          src: l.src,
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height,
        };
      }
      return {
        text: l.text,
        x: l.x,
        y: l.y,
        font: l.font,
        size: l.size,
        orientation: l.orientation,
        lineHeight: l.lineHeight,
        kind: l.kind || 'text',
      };
    }),
  };
}

function applyProjectData(data, targetPage = cur) {
  for (const l of targetPage.layers) l.el.remove();
  targetPage.layers = [];
  targetPage.selectedId = null;
  targetPage.nextId = 1;
  for (const l of data.layers) {
    if (l.kind === 'sticker') {
      addStickerLayer({
        x: Number(l.x) || 0,
        y: Number(l.y) || 0,
        src: typeof l.src === 'string' ? l.src : STICKER_DEFAULT_SRC,
        width: typeof l.width === 'number' ? l.width : 0,
        height: typeof l.height === 'number' ? l.height : 0,
      }, targetPage);
      continue;
    }
    addTextLayer({
      x: Number(l.x) || 0,
      y: Number(l.y) || 0,
      text: typeof l.text === 'string' ? l.text : '',
      font: l.font,
      size: typeof l.size === 'number' ? l.size : undefined,
      orientation: l.orientation,
      lineHeight: typeof l.lineHeight === 'number' ? l.lineHeight : undefined,
      kind: (l.kind === 'monologue' || l.kind === 'bubble') ? l.kind : 'text',
    }, targetPage);
  }
  if (targetPage === cur) deselect();
}

function extFromMime(mime) {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'image/svg+xml') return '.svg';
  if (mime === 'image/bmp') return '.bmp';
  if (mime === 'image/avif') return '.avif';
  return '.png';
}

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = String(dataUrl).split(',', 2);
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function anyPageHasContent() {
  return state.pages.some((p) => hasPageContent(p));
}

const BUNDLE_VERSION = 3;
const BUNDLE_PANELS_NAME = 'panels.json';

async function buildBundleBlob() {
  if (typeof JSZip === 'undefined') throw new Error('JSZip ライブラリが読み込まれていません');
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify({ version: BUNDLE_VERSION, pages: state.pages.length }));
  state.pages.forEach((page, i) => {
    const idx = i + 1;
    zip.file(`pages/${idx}/${BUNDLE_TEXT_NAME}`, JSON.stringify(buildProjectData(page), null, 2));
    const memo = page.memo || '';
    if (memo.length > 0) {
      zip.file(`pages/${idx}/${BUNDLE_MEMO_NAME}`, memo);
    }
    // コマ割り情報は常に保存（テンプレなしの状態は廃止されたため、panels と canvas
    // サイズは常に存在する）
    const panelsData = {
      version: 1,
      template: page.template,
      nextPanelId: page.nextPanelId,
      canvasWidth: page.canvasWidth,
      canvasHeight: page.canvasHeight,
      panels: page.panels.map((p) => {
        const out = { id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, material: null };
        if (p.material) {
          const blob = dataUrlToBlob(p.material.src);
          const ext = extFromMime(blob.type);
          const file = `materials/${p.id}${ext}`;
          zip.file(`pages/${idx}/${file}`, blob);
          out.material = {
            file,
            naturalWidth: p.material.naturalWidth,
            naturalHeight: p.material.naturalHeight,
            tx: p.material.tx, ty: p.material.ty,
            scale: p.material.scale, rotation: p.material.rotation,
          };
        }
        return out;
      }),
    };
    zip.file(`pages/${idx}/${BUNDLE_PANELS_NAME}`, JSON.stringify(panelsData, null, 2));
  });
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

// .mj プロジェクトの保存。
// - saveAs=false かつ state.fileHandle あり → ダイアログ無しで上書き保存
// - saveAs=true または state.fileHandle なし → showSaveFilePicker でハンドルを取得して書き込み、
//                                                  以降の保存はその場所への上書きになる
// - showSaveFilePicker 非対応ブラウザ → 従来通りダウンロード（毎回新規ファイル）
async function saveProject({ saveAs = false } = {}) {
  if (!anyPageHasContent()) return;
  els.saveProjectBtn.disabled = true;
  try {
    const blob = await buildBundleBlob();
    let handle = saveAs ? null : state.fileHandle;
    if (!handle && window.showSaveFilePicker) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: state.fileName || 'gina.mj',
          types: [{ description: 'Gina プロジェクト', accept: { 'application/zip': [BUNDLE_EXT] } }],
        });
      } catch (err) {
        if (err && err.name === 'AbortError') return; // ユーザーキャンセル
        console.warn('showSaveFilePicker が使えなかったのでダウンロードに切り替えます:', err);
        handle = null;
      }
    }
    if (handle) {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      state.fileHandle = handle;
      state.fileName = handle.name || state.fileName || 'gina.mj';
      updateDocumentTitle();
    } else {
      // フォールバック: ダウンロードフォルダへ新規ファイル保存
      downloadBlob(blob, state.fileName || 'gina.mj');
    }
  } catch (err) {
    console.error(err);
    alert('保存に失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    els.saveProjectBtn.disabled = !anyPageHasContent();
  }
}

els.saveProjectBtn.addEventListener('click', () => saveProject());

function resetAllPagesForBundle() {
  // 表示中ページの DOM をクリア
  for (const l of cur.layers) l.el.remove();
  // 全ページを空に置き換え
  for (let i = 0; i < state.pages.length; i++) {
    state.pages[i] = createEmptyPage();
  }
  state.currentPageIndex = 0;
  cur = state.pages[0];
}

async function loadPageFromBundle(pageIndex, entries) {
  const page = state.pages[pageIndex];
  const { textEntry, memoEntry, panelsEntry, materialEntries } = entries;
  if (textEntry) {
    try {
      const data = JSON.parse(await textEntry.async('string'));
      if (data && Array.isArray(data.layers)) {
        // 旧形式の image: {width,height} は canvas: {} として読む（panels.json 側に
        // canvasWidth/Height が無いケースだけ反映するため、ここでは保持しない）
        applyProjectData(data, page);
      }
    } catch (err) {
      console.warn(`pages/${pageIndex + 1}/text.json の展開に失敗:`, err);
    }
  }
  if (memoEntry) {
    try {
      page.memo = await memoEntry.async('string');
    } catch (err) {
      console.warn(`pages/${pageIndex + 1}/memo.txt の展開に失敗:`, err);
    }
  }
  if (panelsEntry) {
    try {
      const data = JSON.parse(await panelsEntry.async('string'));
      // 旧形式の 'none'（テンプレなし）は廃止。読んだら 1コマ全面に正規化する。
      let template = data.template || DEFAULT_TEMPLATE;
      if (template === 'none' || !TEMPLATES[template]) template = DEFAULT_TEMPLATE;
      page.template = template;
      if (typeof data.canvasWidth === 'number') page.canvasWidth = data.canvasWidth;
      if (typeof data.canvasHeight === 'number') page.canvasHeight = data.canvasHeight;
      page.panels = [];
      for (const p of (data.panels || [])) {
        const panel = { id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, material: null };
        if (p.material) {
          const matEntry = materialEntries[p.id];
          if (matEntry) {
            const blob = await matEntry.async('blob');
            const dataUrl = await blobToDataUrl(blob);
            panel.material = {
              src: dataUrl,
              naturalWidth: p.material.naturalWidth || 0,
              naturalHeight: p.material.naturalHeight || 0,
              tx: p.material.tx || 0, ty: p.material.ty || 0,
              scale: p.material.scale || 1, rotation: p.material.rotation || 0,
            };
          }
        }
        page.panels.push(panel);
      }
      // 旧 'none' で panels が空だったケースは 1コマ全面で埋める
      if (page.panels.length === 0) {
        page.panels = TEMPLATES[DEFAULT_TEMPLATE].panels.map((p) => ({
          id: page.nextPanelId++,
          x: p.x, y: p.y, w: p.w, h: p.h,
          material: null,
        }));
      }
      const ids = page.panels.map((p) => p.id);
      page.nextPanelId = data.nextPanelId || (ids.length > 0 ? Math.max(...ids) + 1 : 1);
      page.selectedPanelId = null;
    } catch (err) {
      console.warn(`pages/${pageIndex + 1}/panels.json の展開に失敗:`, err);
    }
  }
}

async function loadBundleFile(file, handle = null) {
  if (typeof JSZip === 'undefined') {
    alert('JSZip ライブラリが読み込まれていません');
    return;
  }
  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (err) {
    alert('.mj ファイルの読み込みに失敗しました: ' + (err && err.message ? err.message : err));
    return;
  }

  if (anyPageHasContent() && !confirm('現在のページ・テキスト・メモ・コマ割りをすべて置き換えます。よろしいですか?')) return;

  // 取り込み成立。以降の Ctrl+S は「開いたファイルへの上書き」になるよう状態を更新。
  // フォールバック（<input type=file>）経由では handle が来ないので名前だけ更新。
  state.fileHandle = handle;
  state.fileName = file.name || state.fileName || null;
  updateDocumentTitle();

  // pages/N/... の新形式のみを読む（漫画全体画像のエントリは検出したら warn して捨てる）。
  const pageEntries = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    pageEntries.push({ textEntry: null, memoEntry: null, panelsEntry: null, materialEntries: {} });
  }
  let droppedLegacyImage = false;
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const m = path.match(/^pages\/(\d+)\/(.+)$/);
    if (!m) {
      // 旧形式（ルートに image.* / text.json / memo.txt）は廃止。検出だけして warn。
      if (!path.includes('/') && IMAGE_EXT_RE.test(path)) droppedLegacyImage = true;
      return;
    }
    const idx = parseInt(m[1], 10) - 1;
    if (idx < 0 || idx >= MAX_PAGES) return;
    const name = m[2];
    const matM = name.match(/^materials\/(\d+)\.[a-z0-9]+$/i);
    if (matM) {
      pageEntries[idx].materialEntries[parseInt(matM[1], 10)] = entry;
      return;
    }
    if (name === BUNDLE_PANELS_NAME) {
      pageEntries[idx].panelsEntry = entry;
      return;
    }
    if (name.includes('/')) return;
    if (IMAGE_EXT_RE.test(name)) {
      // 旧バージョンが pages/N/image.* として保存していた漫画全体画像は捨てる
      droppedLegacyImage = true;
    } else if (name === BUNDLE_TEXT_NAME) {
      pageEntries[idx].textEntry = entry;
    } else if (name === BUNDLE_MEMO_NAME) {
      pageEntries[idx].memoEntry = entry;
    }
  });

  if (droppedLegacyImage) {
    console.warn('旧形式の漫画全体画像が含まれていましたが、画像機能は廃止されたため無視しました。');
  }

  resetAllPagesForBundle();

  for (let i = 0; i < MAX_PAGES; i++) {
    const e = pageEntries[i];
    if (!e.textEntry && !e.memoEntry && !e.panelsEntry && Object.keys(e.materialEntries).length === 0) continue;
    try {
      await loadPageFromBundle(i, e);
    } catch (err) {
      console.warn(`ページ ${i + 1} の展開に失敗:`, err);
    }
  }

  // 現在ページ(P1)にメモがあればパネルを開く
  if ((cur.memo || '').trim().length > 0) {
    els.memoPanel.hidden = false;
  }

  refreshPageView();
  updatePageIndicator();
  syncMemoFromPage();
}

// --- メモパネル(付箋風フローティング) ---

els.memoToggle.addEventListener('click', () => {
  els.memoPanel.hidden = !els.memoPanel.hidden;
});
els.memoClose.addEventListener('click', () => {
  els.memoPanel.hidden = true;
});

// textarea への入力を現在ページのメモに反映
els.memoText.addEventListener('input', () => {
  cur.memo = els.memoText.value;
});

function loadMemoFile(file) {
  if ((cur.memo || '').trim() && !confirm(`ページ ${state.currentPageIndex + 1} の現在のメモを上書きします。よろしいですか?`)) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const buf = ev.target.result;
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      // UTF-8 として読めない場合は Shift_JIS にフォールバック
      text = new TextDecoder('shift_jis').decode(buf);
    }
    cur.memo = text;
    els.memoText.value = text;
    els.memoPanel.hidden = false;
  };
  reader.readAsArrayBuffer(file);
}

els.memoHeader.addEventListener('mousedown', (e) => {
  if (e.target.closest('.memo-actions')) return;
  e.preventDefault();
  const rect = els.memoPanel.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const origLeft = rect.left;
  const origTop = rect.top;
  els.memoPanel.style.left = `${origLeft}px`;
  els.memoPanel.style.top = `${origTop}px`;

  const onMove = (ev) => {
    const nx = origLeft + (ev.clientX - startX);
    const ny = origTop + (ev.clientY - startY);
    const maxX = window.innerWidth - 40;
    const maxY = window.innerHeight - 40;
    els.memoPanel.style.left = `${Math.min(Math.max(nx, -rect.width + 40), maxX)}px`;
    els.memoPanel.style.top = `${Math.min(Math.max(ny, 0), maxY)}px`;
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

els.exportBtn.addEventListener('click', async () => {
  if (!hasPageContent(cur)) return;
  els.exportBtn.disabled = true;
  try {
    await ensureExportFontsReady();

    const pageW = cur.canvasWidth;
    const pageH = cur.canvasHeight;
    const canvas = document.createElement('canvas');
    canvas.width = pageW;
    canvas.height = pageH;
    const ctx = canvas.getContext('2d');
    // 背景は白いページとして塗りつぶす
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, pageW, pageH);
    await drawPanelsAndMaterials(ctx, cur, pageW, pageH);
    // ステッカー(吹き出し画像)を先に並列ロードして、レイヤー順通りに描く
    const stickerImgs = await Promise.all(
      cur.layers.map((l) => (l.kind === 'sticker' ? loadImageElement(l.src).catch(() => null) : null))
    );
    cur.layers.forEach((layer, i) => {
      if (layer.kind === 'sticker') {
        const img = stickerImgs[i];
        if (img && layer.width > 0 && layer.height > 0) {
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
        }
      } else {
        drawTextLayer(ctx, layer);
      }
    });

    const pngBlob = await canvasToPngBlob(canvas);
    await saveBlob(pngBlob, `gina-p${state.currentPageIndex + 1}.png`, {
      description: 'PNG画像',
      mimeType: 'image/png',
      extension: '.png',
    });
  } catch (err) {
    console.error(err);
    alert('PNG 書き出しに失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    els.exportBtn.disabled = !hasPageContent(cur);
  }
});
