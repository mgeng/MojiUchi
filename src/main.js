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
  exportAllBtn: document.getElementById('exportAllBtn'),
  stageWrapper: document.getElementById('stageWrapper'),
  stage: document.getElementById('stage'),
  layerContainer: document.getElementById('layerContainer'),
  panelContainer: document.getElementById('panelContainer'),
  templateSelect: document.getElementById('templateSelect'),
  panelBorderInput: document.getElementById('panelBorderInput'),
  panelBorderValue: document.getElementById('panelBorderValue'),
  panelGutterInput: document.getElementById('panelGutterInput'),
  panelGutterValue: document.getElementById('panelGutterValue'),
  canvasSizeFields: document.getElementById('canvasSizeFields'),
  canvasWidthInput: document.getElementById('canvasWidthInput'),
  canvasHeightInput: document.getElementById('canvasHeightInput'),
  splitTopBottomBtn: document.getElementById('splitTopBottomBtn'),
  splitLeftRightBtn: document.getElementById('splitLeftRightBtn'),
  deletePanelBtn: document.getElementById('deletePanelBtn'),
  panelMaterialProps: document.getElementById('panelMaterialProps'),
  materialResetBtn: document.getElementById('materialResetBtn'),
  materialRemoveBtn: document.getElementById('materialRemoveBtn'),
  panelFocusProps: document.getElementById('panelFocusProps'),
  focusPicker: document.getElementById('focusPicker'),
  focusScaleInput: document.getElementById('focusScaleInput'),
  focusScaleValue: document.getElementById('focusScaleValue'),
  focusRotationInput: document.getElementById('focusRotationInput'),
  focusRotationValue: document.getElementById('focusRotationValue'),
  focusResetBtn: document.getElementById('focusResetBtn'),
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
  stickerTitle: document.getElementById('stickerTitle'),
  stickerDelete: document.getElementById('stickerDelete'),
  stickerFlipH: document.getElementById('stickerFlipH'),
  stickerFlipV: document.getElementById('stickerFlipV'),
  bubblePickerField: document.getElementById('bubblePickerField'),
  bubblePicker: document.getElementById('bubblePicker'),
  overlayFileInput: document.getElementById('overlayFileInput'),
  panelOverlayFileInput: document.getElementById('panelOverlayFileInput'),
  memoToggle: document.getElementById('memoToggle'),
  memoPanel: document.getElementById('memoPanel'),
  memoHeader: document.getElementById('memoHeader'),
  memoTitle: document.getElementById('memoTitle'),
  memoClose: document.getElementById('memoClose'),
  memoText: document.getElementById('memoText'),
  helpToggle: document.getElementById('helpToggle'),
  helpPanel: document.getElementById('helpPanel'),
  helpClose: document.getElementById('helpClose'),
  shortcutsPanel: document.getElementById('shortcutsPanel'),
  shortcutsClose: document.getElementById('shortcutsClose'),
  saveProjectBtn: document.getElementById('saveProjectBtn'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageIndicator: document.getElementById('pageIndicator'),
  insertPageBtn: document.getElementById('insertPageBtn'),
  deletePageBtn: document.getElementById('deletePageBtn'),
  contextMenu: document.getElementById('contextMenu'),
  themeToggle: document.getElementById('themeToggle'),
  inspectorResizeHandle: document.getElementById('inspectorResizeHandle'),
};

const THEME_STORAGE_KEY = 'gina-theme';
const INSPECTOR_WIDTH_STORAGE_KEY = 'gina-inspector-width';
const INSPECTOR_MIN_WIDTH = 240;
const INSPECTOR_MAX_WIDTH = 640;
const STAGE_MIN_WIDTH = 360;

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in some local-file or privacy modes.
  }
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('theme-dark', isDark);
  if (els.themeToggle) {
    els.themeToggle.classList.toggle('active', isDark);
    els.themeToggle.setAttribute('aria-pressed', String(isDark));
    els.themeToggle.textContent = isDark ? 'Light' : 'Dark';
  }
}

function initTheme() {
  const saved = getStoredTheme();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
}

initTheme();

function getInspectorMaxWidth() {
  return Math.max(
    INSPECTOR_MIN_WIDTH,
    Math.min(INSPECTOR_MAX_WIDTH, window.innerWidth - STAGE_MIN_WIDTH)
  );
}

function clampInspectorWidth(width) {
  return Math.min(Math.max(width, INSPECTOR_MIN_WIDTH), getInspectorMaxWidth());
}

function storeInspectorWidth(width) {
  try {
    localStorage.setItem(INSPECTOR_WIDTH_STORAGE_KEY, String(Math.round(width)));
  } catch {
    // Storage can be unavailable in some local-file or privacy modes.
  }
}

function applyInspectorWidth(width, { persist = false, refresh = true } = {}) {
  const nextWidth = clampInspectorWidth(width);
  document.documentElement.style.setProperty('--inspector-width', `${nextWidth}px`);
  if (persist) storeInspectorWidth(nextWidth);
  if (refresh) refreshStageResponsiveLayout();
  return nextWidth;
}

function getStoredInspectorWidth() {
  try {
    const value = Number(localStorage.getItem(INSPECTOR_WIDTH_STORAGE_KEY));
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function initInspectorResize() {
  applyInspectorWidth(getStoredInspectorWidth() || 320, { refresh: false });
  if (!els.inspectorResizeHandle) return;

  let startX = 0;
  let startWidth = 0;

  els.inspectorResizeHandle.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    startX = e.clientX;
    startWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--inspector-width')) || 320;
    els.inspectorResizeHandle.classList.add('dragging');
    els.inspectorResizeHandle.setPointerCapture(e.pointerId);
  });

  els.inspectorResizeHandle.addEventListener('pointermove', (e) => {
    if (!els.inspectorResizeHandle.classList.contains('dragging')) return;
    applyInspectorWidth(startWidth - (e.clientX - startX));
  });

  const finishDrag = (e) => {
    if (!els.inspectorResizeHandle.classList.contains('dragging')) return;
    els.inspectorResizeHandle.classList.remove('dragging');
    if (els.inspectorResizeHandle.hasPointerCapture(e.pointerId)) {
      els.inspectorResizeHandle.releasePointerCapture(e.pointerId);
    }
    const width = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--inspector-width')) || 320;
    storeInspectorWidth(width);
  };

  els.inspectorResizeHandle.addEventListener('pointerup', finishDrag);
  els.inspectorResizeHandle.addEventListener('pointercancel', finishDrag);
}

initInspectorResize();

function toggleHelpPanel() {
  els.helpPanel.hidden = !els.helpPanel.hidden;
}

function toggleShortcutsPanel() {
  els.shortcutsPanel.hidden = !els.shortcutsPanel.hidden;
}

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
const CANVAS_MIN_PX = 200;
const CANVAS_MAX_PX = 4000;

const OPPOSITE_EDGE = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
const MIN_PANEL_DIM = 0.05; // コマがゼロサイズにならないよう正規化座標での最小寸法

const MONOLOGUE_PADDING = 12;
const MONOLOGUE_BORDER = 2;

// 吹き出しステッカー(画像)の既定値
const STICKER_DEFAULT_SRC = 'assets/bubbles/vertical/bubble-01-oval.png';

// 集中線(コマに被せる効果線)のサムネ一覧。コマ単位で 1 枚を差し替え式で持つ。
// blend は素材ごとの合成モード:
//   'multiply' = 暗い線+暗い背景の素材を「コマの周囲を暗く落とす」効果として使う
//   'screen'   = 明るい線+暗い背景の素材を「コマに白い光線を被せる」効果として使う
const FOCUS_CATALOG = [
  { src: 'assets/focus-lines/focus-01.png', blend: 'multiply' },
  { src: 'assets/focus-lines/focus-02.png', blend: 'multiply' },
  { src: 'assets/focus-lines/focus-03.png', blend: 'screen' },
];
const FOCUS_SCALE_MIN = 0.5;
const FOCUS_SCALE_MAX = 3.0;

function getFocusBlend(src) {
  const item = FOCUS_CATALOG.find((c) => c.src === src);
  return (item && item.blend) || 'multiply';
}

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
    'bubble-17-oval-tail-bl', 'bubble-18-oval-tail-l-thin', 'bubble-19-oval-tail-l-wide',
    'bubble-20-oval-tail-tl', 'bubble-21-oval-tail-t',
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

function sortFilesByName(files) {
  return [...files].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja', {
    numeric: true,
    sensitivity: 'base',
  }));
}

function openFiles(files) {
  const list = Array.from(files || []).filter(Boolean);
  if (list.length === 0) return;
  if (list.length === 1) {
    openFile(list[0]);
    return;
  }

  const memoFiles = list.filter((file) => detectFileKind(file) === 'memo');
  if (memoFiles.length !== list.length) {
    alert('複数読み込みできるのは .txt ファイルのみです。');
    return;
  }
  loadMemoFiles(sortFilesByName(memoFiles));
}

const MAX_PAGES = 16;

function createEmptyPage() {
  const page = {
    layers: [], // { id, el, x, y, text, font, size, orientation, lineHeight }
    selectedId: null,
    nextId: 1,
    memo: '',
    template: DEFAULT_TEMPLATE,
    panels: [], // { id, x, y, w, h, material, focus } 0-1 正規化
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
    focus: null,
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

const UNDO_LIMIT = 5;
const undoStack = [];
let isRestoringUndo = false;

function clonePlain(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

function snapshotLayer(layer) {
  const base = {
    id: layer.id,
    kind: layer.kind || 'text',
    x: layer.x,
    y: layer.y,
  };
  if (isStickerLike(layer)) {
    return {
      ...base,
      panelId: layer.panelId,
      src: layer.src,
      width: layer.width,
      height: layer.height,
      naturalWidth: layer.naturalWidth || 0,
      naturalHeight: layer.naturalHeight || 0,
      flipH: !!layer.flipH,
      flipV: !!layer.flipV,
    };
  }
  return {
    ...base,
    text: layer.text,
    font: layer.font,
    size: layer.size,
    orientation: layer.orientation,
    lineHeight: layer.lineHeight,
  };
}

function snapshotPage(page = cur) {
  return {
    currentPageIndex: state.currentPageIndex,
    page: {
      layers: page.layers.map(snapshotLayer),
      selectedId: page.selectedId,
      nextId: page.nextId,
      memo: page.memo,
      template: page.template,
      panels: page.panels.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h,
        material: clonePlain(p.material),
        focus: clonePlain(p.focus),
      })),
      nextPanelId: page.nextPanelId,
      selectedPanelId: page.selectedPanelId,
      canvasWidth: page.canvasWidth,
      canvasHeight: page.canvasHeight,
    },
  };
}

function recordUndo() {
  if (isRestoringUndo) return;
  const snapshot = snapshotPage();
  const serialized = JSON.stringify(snapshot);
  const last = undoStack[undoStack.length - 1];
  if (last && last.serialized === serialized) return;
  undoStack.push({ snapshot, serialized });
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
}

function restoreCurrentPageSnapshot(snapshot) {
  const data = snapshot.page;
  for (const l of cur.layers) {
    if (isStickerLike(l)) removeStickerHandles(l);
    if (l.el) l.el.remove();
  }
  cur.layers = [];
  cur.selectedId = null;
  cur.nextId = 1;
  cur.memo = data.memo || '';
  cur.template = data.template || DEFAULT_TEMPLATE;
  cur.panels = (data.panels || []).map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    material: clonePlain(p.material),
    focus: clonePlain(p.focus),
  }));
  cur.nextPanelId = data.nextPanelId || 1;
  cur.selectedPanelId = data.selectedPanelId ?? null;
  cur.canvasWidth = data.canvasWidth || DEFAULT_CANVAS_WIDTH;
  cur.canvasHeight = data.canvasHeight || DEFAULT_CANVAS_HEIGHT;

  for (const layer of data.layers || []) {
    if (layer.kind === 'sticker') {
      addStickerLayer(layer);
    } else if (layer.kind === 'overlay') {
      addOverlayLayer(layer);
    } else if (layer.kind === 'panelOverlay') {
      addPanelOverlayLayer(layer);
    } else {
      addTextLayer(layer);
    }
  }
  cur.nextId = data.nextId || cur.nextId;
  cur.selectedId = data.selectedId ?? null;
  cur.selectedPanelId = data.selectedPanelId ?? null;
  refreshPageView();
  updatePageIndicator();
  syncMemoFromPage();
  if (cur.selectedId != null) {
    selectLayer(cur.selectedId);
  } else if (cur.selectedPanelId != null) {
    selectPanel(cur.selectedPanelId);
  } else {
    updateInspector();
  }
}

function undoLastChange() {
  const entry = undoStack.pop();
  if (!entry) return false;
  isRestoringUndo = true;
  try {
    if (entry.snapshot.currentPageIndex !== state.currentPageIndex) {
      switchToPage(entry.snapshot.currentPageIndex);
    }
    restoreCurrentPageSnapshot(entry.snapshot);
  } finally {
    isRestoringUndo = false;
  }
  return true;
}

// 何か書き出す/保存する価値があるかどうか。コマ割りは常に存在する前提なので、
// 「素材かテキストが何か置かれているか」で判定する。
function hasPageVisualContent(page) {
  return page.panels.some((p) => p.material || p.focus) || page.layers.length > 0;
}

function hasPageContent(page) {
  return hasPageVisualContent(page) || (page.memo || '').trim().length > 0;
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
  els.exportBtn.disabled = !hasPageVisualContent(cur);
  els.exportAllBtn.disabled = !anyPageHasContent();
  els.saveProjectBtn.disabled = !anyPageHasContent();
  els.deletePageBtn.disabled = !hasPageContent(cur);
}

// 表示中ページのレイヤー・有効状態をいまの cur に同期する。
// ページ切替時と一括読み込み(.mj)後の初期表示の両方から使う。
function refreshPageView() {
  // ステージは常に canvasWidth × canvasHeight の白いページとして表示
  els.stage.style.width = `${cur.canvasWidth}px`;
  els.stage.style.height = `${cur.canvasHeight}px`;
  updateActionButtons();
  renderPanels();
  updateCanvasSizeControls();
  if (els.templateSelect) els.templateSelect.value = cur.template;
  // 現在ページのレイヤー DOM を layerContainer に並べ直す。
  // 描画順(奥→手前): panelOverlay → overlay → sticker → previewCanvas → text。
  // すべて previewCanvas の前に積み、テキストは canvas の後に置く。
  for (const l of cur.layers) {
    if (l.kind === 'panelOverlay') {
      els.layerContainer.insertBefore(l.el, previewCanvas);
    }
  }
  for (const l of cur.layers) {
    if (l.kind === 'overlay') {
      els.layerContainer.insertBefore(l.el, previewCanvas);
    }
  }
  for (const l of cur.layers) {
    if (l.kind === 'sticker') {
      els.layerContainer.insertBefore(l.el, previewCanvas);
    } else if (!isOverlayLike(l)) {
      els.layerContainer.appendChild(l.el);
    }
  }
  applyAllLayerStyles();
  syncStickerHandles();
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
  recordUndo();
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
        const fimg = el.querySelector('.panel-focus');
        if (fimg) applyFocusTransform(fimg, s.panel, el);
      }
    }
    // コマに重ねた画像レイヤーのクリップ範囲もコマの新しい矩形に追随させる。
    for (const l of cur.layers) {
      if (l.kind === 'panelOverlay') applyPanelOverlayClip(l);
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

// 集中線 img を「コマ全体を contain(コマに収まる最小スケール) フィット」を基準に、
// user の scale/rotation で動かす。位置は中央固定(tx/ty 無し)。コマの overflow:hidden
// で枠外がトリミングされる。
function applyFocusTransform(img, panel, panelEl) {
  const f = panel.focus;
  if (!f) return;
  const pw = panelEl.clientWidth;
  const ph = panelEl.clientHeight;
  const nw = img.naturalWidth || 0;
  const nh = img.naturalHeight || 0;
  if (pw === 0 || ph === 0 || nw === 0 || nh === 0) return;
  // 集中線素材は中央が抜けたデザイン。コマを覆い切る cover フィットを基準に、
  // 任意の scale を掛ける。
  const coverScale = Math.max(pw / nw, ph / nh);
  const finalW = nw * coverScale * (f.scale || 1);
  const finalH = nh * coverScale * (f.scale || 1);
  const cx = pw / 2;
  const cy = ph / 2;
  img.style.width = `${finalW}px`;
  img.style.height = `${finalH}px`;
  img.style.left = `${cx - finalW / 2}px`;
  img.style.top = `${cy - finalH / 2}px`;
  img.style.transform = `rotate(${f.rotation || 0}deg)`;
}

function mountFocusOnPanel(panelEl, panel) {
  if (!panel.focus) return;
  const img = document.createElement('img');
  img.className = 'panel-focus';
  img.src = panel.focus.src;
  img.draggable = false;
  // 素材ごとに合成モードが違うため、インラインで上書きする
  img.style.mixBlendMode = getFocusBlend(panel.focus.src);
  panelEl.appendChild(img);
  // natural size が確定してから transform を当てる必要があるため、load を待つ。
  const apply = () => applyFocusTransform(img, panel, panelEl);
  if (img.complete && img.naturalWidth > 0) apply();
  else img.addEventListener('load', apply, { once: true });
  requestAnimationFrame(apply);
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
  recordUndo();
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
  recordUndo();
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
      recordUndo();
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
    mountFocusOnPanel(el, p);
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
  els.panelFocusProps.hidden = !hasSelection;
  updateFocusControls();
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
  recordUndo();
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
  updateCanvasSizeControls();
}

function splitSelectedPanel(direction) {
  const panel = getSelectedPanel();
  if (!panel) return;
  recordUndo();
  const idx = cur.panels.indexOf(panel);
  // 素材は元コマ（先頭側）にだけ引き継ぐ。もう一方は空のコマになる。
  let a, b;
  if (direction === 'topBottom') {
    a = { id: cur.nextPanelId++, x: panel.x, y: panel.y,             w: panel.w, h: panel.h / 2, material: panel.material, focus: panel.focus };
    b = { id: cur.nextPanelId++, x: panel.x, y: panel.y + panel.h / 2, w: panel.w, h: panel.h / 2, material: null, focus: null };
  } else {
    a = { id: cur.nextPanelId++, x: panel.x,             y: panel.y, w: panel.w / 2, h: panel.h, material: panel.material, focus: panel.focus };
    b = { id: cur.nextPanelId++, x: panel.x + panel.w / 2, y: panel.y, w: panel.w / 2, h: panel.h, material: null, focus: null };
  }
  cur.panels.splice(idx, 1, a, b);
  cur.selectedPanelId = a.id;
  renderPanels();
  updateCanvasSizeControls();
}

function applyTemplate(templateId) {
  const tmpl = TEMPLATES[templateId];
  if (!tmpl) return;
  recordUndo();
  cur.template = templateId;
  cur.panels = tmpl.panels.map((p) => ({
    id: cur.nextPanelId++,
    x: p.x, y: p.y, w: p.w, h: p.h,
    material: null,
    focus: null,
  }));
  cur.selectedPanelId = null;
  refreshPageView();
}

function switchToPage(index) {
  if (index < 0 || index >= state.pages.length) return;
  if (index === state.currentPageIndex) return;
  // いまのページのレイヤー DOM を退避(削除はしない、要素は残す)
  for (const l of cur.layers) {
    if (isStickerLike(l)) removeStickerHandles(l);
    l.el.remove();
  }
  state.currentPageIndex = index;
  cur = state.pages[index];
  refreshPageView();
  updatePageIndicator();
  syncMemoFromPage();
}

els.prevPageBtn.addEventListener('click', () => switchToPage(state.currentPageIndex - 1));
els.nextPageBtn.addEventListener('click', () => switchToPage(state.currentPageIndex + 1));

function insertPage() {
  if (!isPageEmpty(state.pages[MAX_PAGES - 1])) {
    alert(`ページ数が上限 (${MAX_PAGES}) に達しているため、挿入できません。`);
    return;
  }
  const insertAt = state.currentPageIndex;
  // 現在ページのレイヤー DOM を退避
  for (const l of cur.layers) {
    if (isStickerLike(l)) removeStickerHandles(l);
    l.el.remove();
  }
  // 現在ページ以降を1つ後ろへシフト
  for (let i = MAX_PAGES - 1; i > insertAt; i--) {
    state.pages[i] = state.pages[i - 1];
  }
  state.pages[insertAt] = createEmptyPage();
  cur = state.pages[insertAt];
  refreshPageView();
  updatePageIndicator();
  syncMemoFromPage();
}

els.insertPageBtn.addEventListener('click', insertPage);

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

// 1コマしかないページではアスペクト比を自由に変更できる UI を出す。
// 2コマ以上に分割された後は、コマが正規化座標で残っているのでサイズは保持したまま UI だけ畳む。
function updateCanvasSizeControls() {
  const singlePanel = cur.panels.length === 1;
  els.canvasSizeFields.hidden = !singlePanel;
  els.canvasWidthInput.value = String(cur.canvasWidth);
  els.canvasHeightInput.value = String(cur.canvasHeight);
}

function applyCanvasSize(w, h) {
  recordUndo();
  cur.canvasWidth = w;
  cur.canvasHeight = h;
  els.stage.style.width = `${w}px`;
  els.stage.style.height = `${h}px`;
  // 素材・集中線・吹き出し・テキストは表示幅依存なので再適用が必要
  for (const p of cur.panels) {
    const el = els.panelContainer.querySelector(`[data-panel-id="${p.id}"]`);
    if (!el) continue;
    const img = el.querySelector('.panel-material');
    if (img) applyMaterialTransform(img, p, el);
    const fimg = el.querySelector('.panel-focus');
    if (fimg) applyFocusTransform(fimg, p, el);
  }
  applyAllLayerStyles();
}

function onCanvasSizeInput() {
  const raw = (input, fallback) => {
    const n = Math.round(Number(input.value));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(CANVAS_MIN_PX, Math.min(CANVAS_MAX_PX, n));
  };
  const w = raw(els.canvasWidthInput, cur.canvasWidth);
  const h = raw(els.canvasHeightInput, cur.canvasHeight);
  applyCanvasSize(w, h);
}

function onCanvasSizeChange() {
  // 入力確定時にクランプ結果を入力欄へ反映
  onCanvasSizeInput();
  els.canvasWidthInput.value = String(cur.canvasWidth);
  els.canvasHeightInput.value = String(cur.canvasHeight);
}

els.canvasWidthInput.addEventListener('input', onCanvasSizeInput);
els.canvasHeightInput.addEventListener('input', onCanvasSizeInput);
els.canvasWidthInput.addEventListener('change', onCanvasSizeChange);
els.canvasHeightInput.addEventListener('change', onCanvasSizeChange);

els.splitTopBottomBtn.addEventListener('click', () => splitSelectedPanel('topBottom'));
els.splitLeftRightBtn.addEventListener('click', () => splitSelectedPanel('leftRight'));
els.deletePanelBtn.addEventListener('click', () => deleteSelectedPanel());

els.materialResetBtn.addEventListener('click', () => {
  const sel = getSelectedPanel();
  if (!sel || !sel.material) return;
  recordUndo();
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
  recordUndo();
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
  recordUndo();
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
  openFiles(e.target.files);
  els.fileInput.value = '';
});

// 「開く」ボタン。showOpenFilePicker が使えればハンドル付きで開く（→ 以降 Ctrl+S で上書き保存可能）。
// 非対応ブラウザは従来通り <input type=file> にフォールバック。
async function openProject() {
  if (window.showOpenFilePicker) {
    let handle;
    try {
      const handles = await window.showOpenFilePicker({
        types: [
          {
            description: 'Gina プロジェクト / メモ',
            accept: {
              'application/zip': [BUNDLE_EXT],
              'text/plain': ['.txt'],
            },
          },
        ],
        multiple: true,
      });
      if (handles.length === 1) {
        [handle] = handles;
      } else {
        const files = await Promise.all(handles.map((h) => h.getFile()));
        openFiles(files);
        return;
      }
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
  const files = Array.from(e.dataTransfer.files || []);
  const file = files[0];
  if (!file) return;
  if (files.length > 1) {
    openFiles(files);
    return;
  }
  // 画像ドロップは常に「上重ね画像」として追加。
  // コマへの素材セットはコマのダブルクリックから行う。
  if (detectFileKind(file) === 'image') {
    const rect = els.stage.getBoundingClientRect();
    let coords = null;
    if (rect.width > 0 && rect.height > 0) {
      const scaleX = cur.canvasWidth / rect.width;
      const scaleY = cur.canvasHeight / rect.height;
      coords = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
    addOverlayFromFile(file, coords).catch((err) => {
      console.error(err);
      alert('画像の読み込みに失敗しました: ' + (err && err.message ? err.message : err));
    });
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
    const { x, y } = contextMenuTargetCoords;
    addStickerLayer({ x, y, src: STICKER_DEFAULT_SRC });
    // 吹き出しの中央付近にテキストを同時追加する。文字組みは右側パネルの
    // 直前選択値(propOrientation)に従う。bubble 画像の高さはロード後にしか
    // 確定しないため、既定の縦オーバル(ほぼ正方形)前提で STICKER_DEFAULT_WIDTH
    // を縦横ともに代用して中央へ寄せる。
    const orientation = els.propOrientation.value === 'vertical' ? 'vertical' : 'horizontal';
    const DEFAULT_TEXT = 'テキスト';
    const DEFAULT_SIZE = 24;
    const DEFAULT_LINE_HEIGHT = 1.1;
    const charCount = [...DEFAULT_TEXT].length;
    const bubbleCenterX = x + STICKER_DEFAULT_WIDTH / 2;
    const bubbleCenterY = y + STICKER_DEFAULT_WIDTH / 2;
    let textX;
    let textY;
    if (orientation === 'vertical') {
      // 縦書き 1 列の場合、layer.x は列の左端 (列中心 = layer.x + size/2)
      const textHeight = DEFAULT_SIZE * DEFAULT_LINE_HEIGHT * charCount;
      textX = bubbleCenterX - DEFAULT_SIZE / 2;
      textY = bubbleCenterY - textHeight / 2;
    } else {
      // 横書きは layer.x が左上。日本語全角は概ね 1em 幅として概算
      const textWidth = DEFAULT_SIZE * charCount;
      const textHeight = DEFAULT_SIZE * DEFAULT_LINE_HEIGHT;
      textX = bubbleCenterX - textWidth / 2;
      textY = bubbleCenterY - textHeight / 2;
    }
    addTextLayer({ x: textX, y: textY, orientation });
  } else if (action === 'add-overlay') {
    pendingOverlayCoords = { ...contextMenuTargetCoords };
    els.overlayFileInput.value = '';
    els.overlayFileInput.click();
  } else if (action === 'add-panel-overlay') {
    const panel = findPanelAtCanvasCoords(contextMenuTargetCoords.x, contextMenuTargetCoords.y);
    if (!panel) {
      alert('コマの上で右クリックしてください。');
      return;
    }
    pendingPanelOverlay = { coords: { ...contextMenuTargetCoords }, panelId: panel.id };
    els.panelOverlayFileInput.value = '';
    els.panelOverlayFileInput.click();
  }
});

// キャンバス座標(canvasWidth/Height 基準)を含むコマを返す。コマ間の gutter にあたる
// 隙間に乗っているときは null。
function findPanelAtCanvasCoords(x, y) {
  const w = cur.canvasWidth;
  const h = cur.canvasHeight;
  if (w === 0 || h === 0) return null;
  const previewW = els.panelContainer.clientWidth || w;
  const displayScale = previewW / w;
  const gutterCss = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-gutter')) || 0;
  const gutterPx = displayScale > 0 ? gutterCss / displayScale : 0;
  const half = gutterPx / 2;
  for (const p of cur.panels) {
    const left = p.x * w + half;
    const top = p.y * h + half;
    const right = (p.x + p.w) * w - half;
    const bottom = (p.y + p.h) * h - half;
    if (x >= left && x <= right && y >= top && y <= bottom) return p;
  }
  return null;
}

let pendingOverlayCoords = null;
els.overlayFileInput.addEventListener('change', () => {
  const file = els.overlayFileInput.files && els.overlayFileInput.files[0];
  els.overlayFileInput.value = '';
  if (!file) { pendingOverlayCoords = null; return; }
  const coords = pendingOverlayCoords;
  pendingOverlayCoords = null;
  if (detectFileKind(file) !== 'image') {
    alert('画像ファイルを指定してください。');
    return;
  }
  addOverlayFromFile(file, coords).catch((err) => {
    console.error(err);
    alert('画像の読み込みに失敗しました: ' + (err && err.message ? err.message : err));
  });
});

let pendingPanelOverlay = null;
els.panelOverlayFileInput.addEventListener('change', () => {
  const file = els.panelOverlayFileInput.files && els.panelOverlayFileInput.files[0];
  els.panelOverlayFileInput.value = '';
  if (!file) { pendingPanelOverlay = null; return; }
  const pending = pendingPanelOverlay;
  pendingPanelOverlay = null;
  if (!pending) return;
  if (detectFileKind(file) !== 'image') {
    alert('画像ファイルを指定してください。');
    return;
  }
  addPanelOverlayFromFile(file, pending.coords, pending.panelId).catch((err) => {
    console.error(err);
    alert('画像の読み込みに失敗しました: ' + (err && err.message ? err.message : err));
  });
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
  } else if (e.key === 'Escape' && !els.helpPanel.hidden) {
    els.helpPanel.hidden = true;
  } else if (e.key === 'Escape' && !els.shortcutsPanel.hidden) {
    els.shortcutsPanel.hidden = true;
  }
});

// Ctrl(または Cmd)+S/O/E のグローバルショートカット。
// ブラウザ標準動作(ページ保存・ファイル選択)を抑止して各ボタンに割り当てる。
// Ctrl+S = 上書き保存（ハンドル有なら無確認、無ければダイアログ） / Ctrl+Shift+S = 名前を付けて保存。
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  if (e.altKey) return;
  const key = e.key.toLowerCase();
  if (key === 'h' && !e.shiftKey) {
    e.preventDefault();
    toggleHelpPanel();
    return;
  }
  if ((key === '/' || e.code === 'Slash') && !e.shiftKey) {
    e.preventDefault();
    toggleShortcutsPanel();
    return;
  }
  if (key === 'z' && !e.shiftKey && !isEditableTarget()) {
    if (undoLastChange()) e.preventDefault();
    return;
  }
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

function addTextLayer({ id: requestedId, x, y, text = 'テキスト', font, size, orientation, lineHeight, kind = 'text' }, targetPage = cur) {
  recordUndo();
  const id = Number.isFinite(requestedId) ? requestedId : targetPage.nextId++;
  targetPage.nextId = Math.max(targetPage.nextId, id + 1);
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
function isStickerLike(layer) {
  return layer && (layer.kind === 'sticker' || layer.kind === 'overlay' || layer.kind === 'panelOverlay');
}

function isOverlayLike(layer) {
  return layer && (layer.kind === 'overlay' || layer.kind === 'panelOverlay');
}

function addStickerLayer({ id: requestedId, x, y, src, width, height, flipH, flipV }, targetPage = cur) {
  recordUndo();
  const id = Number.isFinite(requestedId) ? requestedId : targetPage.nextId++;
  targetPage.nextId = Math.max(targetPage.nextId, id + 1);
  const layer = {
    id,
    kind: 'sticker',
    src,
    x,
    y,
    width: width || 0,
    height: height || 0,
    flipH: !!flipH,
    flipV: !!flipV,
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

// 上重ね画像レイヤー(コマをまたぐ効果音や演出画像)。sticker と同じ DOM/ハンドラを再利用するが、
// 描画順は sticker より背面、サイズ変更時はアスペクト比固定、画像は dataUrl で持つ。
function addOverlayLayer({ id: requestedId, x, y, src, width, height, naturalWidth, naturalHeight, flipH, flipV }, targetPage = cur) {
  recordUndo();
  const id = Number.isFinite(requestedId) ? requestedId : targetPage.nextId++;
  targetPage.nextId = Math.max(targetPage.nextId, id + 1);
  const layer = {
    id,
    kind: 'overlay',
    src,
    x,
    y,
    width: width || 0,
    height: height || 0,
    naturalWidth: naturalWidth || 0,
    naturalHeight: naturalHeight || 0,
    flipH: !!flipH,
    flipV: !!flipV,
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
    // sticker よりさらに背面に挿入。既存 sticker があればその前、無ければ previewCanvas の前。
    const firstSticker = cur.layers.find((l) => l.kind === 'sticker');
    const anchor = firstSticker ? firstSticker.el : previewCanvas;
    els.layerContainer.insertBefore(el, anchor);
    applyStickerStyle(layer);
    selectLayer(id);
    updateActionButtons();
  }
}

// 画像ファイルから上重ね画像レイヤーを作る。デフォルトサイズはページ幅の 50%(アスペクト比維持)。
// ドロップ座標(またはクリック座標)を中心にして配置。
async function addOverlayFromFile(file, dropCoords) {
  const dataUrl = await blobToDataUrl(file);
  const sz = await getImageNaturalSize(dataUrl);
  const pageW = cur.canvasWidth;
  const w = pageW * 0.5;
  const aspect = sz.width === 0 ? 1 : sz.height / sz.width;
  const h = w * aspect;
  const cx = dropCoords ? dropCoords.x : cur.canvasWidth / 2;
  const cy = dropCoords ? dropCoords.y : cur.canvasHeight / 2;
  addOverlayLayer({
    x: cx - w / 2,
    y: cy - h / 2,
    src: dataUrl,
    width: w,
    height: h,
    naturalWidth: sz.width,
    naturalHeight: sz.height,
  });
}

// コマに重ねる画像レイヤー(panelOverlay)。挙動は overlay とほぼ同じだが、
// 描画時に指定コマの矩形でクリップされる。コマ自体は移動せず、ユーザが画像を
// 動かさない限り、コマからはみ出した部分は見えない。
function addPanelOverlayLayer({ id: requestedId, x, y, src, width, height, naturalWidth, naturalHeight, flipH, flipV, panelId }, targetPage = cur) {
  recordUndo();
  const id = Number.isFinite(requestedId) ? requestedId : targetPage.nextId++;
  targetPage.nextId = Math.max(targetPage.nextId, id + 1);
  const layer = {
    id,
    kind: 'panelOverlay',
    panelId,
    src,
    x,
    y,
    width: width || 0,
    height: height || 0,
    naturalWidth: naturalWidth || 0,
    naturalHeight: naturalHeight || 0,
    flipH: !!flipH,
    flipV: !!flipV,
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
    // panelOverlay は overlay と同じく previewCanvas の前に挿入(背面寄り)。
    // 既存 overlay/sticker よりさらに背面に置きたいので、最も先頭の overlay/sticker
    // を見つけ、その前に挿入する。
    const firstImg = cur.layers.find((l) => l !== layer && (l.kind === 'overlay' || l.kind === 'sticker'));
    const anchor = firstImg ? firstImg.el : previewCanvas;
    els.layerContainer.insertBefore(el, anchor);
    applyStickerStyle(layer);
    selectLayer(id);
    updateActionButtons();
  }
}

// 画像ファイルから panelOverlay を作る。指定コマの中心に、コマ幅の 80% で配置。
async function addPanelOverlayFromFile(file, dropCoords, panelId) {
  const panel = cur.panels.find((p) => p.id === panelId);
  if (!panel) {
    alert('対象のコマが見つかりませんでした。');
    return;
  }
  const dataUrl = await blobToDataUrl(file);
  const sz = await getImageNaturalSize(dataUrl);
  const panelW = panel.w * cur.canvasWidth;
  const panelH = panel.h * cur.canvasHeight;
  // コマに収まりやすいよう、コマの短辺を基準に 80% を初期幅とする(アスペクト維持)
  const aspect = sz.width === 0 ? 1 : sz.height / sz.width;
  let w = panelW * 0.8;
  let h = w * aspect;
  if (h > panelH * 0.8) {
    h = panelH * 0.8;
    w = aspect === 0 ? w : h / aspect;
  }
  const cx = dropCoords ? dropCoords.x : (panel.x + panel.w / 2) * cur.canvasWidth;
  const cy = dropCoords ? dropCoords.y : (panel.y + panel.h / 2) * cur.canvasHeight;
  addPanelOverlayLayer({
    x: cx - w / 2,
    y: cy - h / 2,
    src: dataUrl,
    width: w,
    height: h,
    naturalWidth: sz.width,
    naturalHeight: sz.height,
    panelId,
  });
}

function attachStickerHandlers(layer) {
  const el = layer.el;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectLayer(layer.id);
    recordUndo();
    const rect = els.layerContainer.getBoundingClientRect();
    const scaleX = cur.canvasWidth / rect.width;
    const scaleY = cur.canvasHeight / rect.height;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = layer.x;
    const origY = layer.y;
    // 吹き出し本体をドラッグするときは内包テキストも追従させる。
    // ドラッグ中に sticker 矩形が動くと findTextChildrenInSticker の判定がブレるので、
    // 開始時点での子レイヤーと原点を凍結しておく。
    const children = layer.kind === 'sticker'
      ? findTextChildrenInSticker(layer).map((c) => ({ layer: c, x: c.x, y: c.y }))
      : [];
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) * scaleX;
      const dy = (ev.clientY - startY) * scaleY;
      layer.x = origX + dx;
      layer.y = origY + dy;
      applyStickerStyle(layer);
      for (const c of children) {
        c.layer.x = c.x + dx;
        c.layer.y = c.y + dy;
        applyLayerStyle(c.layer);
      }
      if (children.length > 0) renderTextPreview();
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
    recordUndo();
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
  const sx = layer.flipH ? -1 : 1;
  const sy = layer.flipV ? -1 : 1;
  el.style.transform = (sx === 1 && sy === 1) ? '' : `scale(${sx}, ${sy})`;
  applyPanelOverlayClip(layer);
  positionStickerHandles(layer, scale);
}

// panelOverlay レイヤーを参照コマの矩形でクリップする。clip-path は要素自身の
// ボックス基準の inset 値(top right bottom left)で指定する。flip による rotate/scale
// transform 後に clip-path が効くため、flipH/V を考慮して左右・上下の inset を入れ替える。
function applyPanelOverlayClip(layer) {
  if (!layer || layer.kind !== 'panelOverlay') return;
  const el = layer.el;
  if (!el) return;
  const panel = cur.panels.find((p) => p.id === layer.panelId);
  if (!panel) {
    el.style.clipPath = '';
    return;
  }
  const lw = layer.width || 0;
  const lh = layer.height || 0;
  if (lw <= 0 || lh <= 0) {
    el.style.clipPath = '';
    return;
  }
  // キャンバス座標系(canvasWidth/Height 基準)でコマの内接矩形を gutter 込みで計算。
  const w = cur.canvasWidth;
  const h = cur.canvasHeight;
  const previewW = els.panelContainer.clientWidth || w;
  const displayScale = previewW / w;
  const gutterCss = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-gutter')) || 0;
  const gutterCanvas = displayScale > 0 ? gutterCss / displayScale : 0;
  const half = gutterCanvas / 2;
  const panelLeft = panel.x * w + half;
  const panelTop = panel.y * h + half;
  const panelRight = (panel.x + panel.w) * w - half;
  const panelBottom = (panel.y + panel.h) * h - half;
  // 画像のレイヤー座標における各辺のはみ出し量。負(panel が外側)は 0 にクランプ。
  let topIn = Math.max(0, panelTop - layer.y);
  let leftIn = Math.max(0, panelLeft - layer.x);
  let rightIn = Math.max(0, (layer.x + lw) - panelRight);
  let bottomIn = Math.max(0, (layer.y + lh) - panelBottom);
  // 画像より大きく食い込んだら全クリップ
  if (topIn >= lh || bottomIn >= lh || leftIn >= lw || rightIn >= lw) {
    el.style.clipPath = 'inset(50%)';
    return;
  }
  // flip transform は要素の中心軸で起きるが clip-path は transform 前のボックス基準で
  // 評価される(=画面上で同じ方向の辺を切り取る)ため、flip 適用時は左右/上下を入れ替える。
  if (layer.flipH) [leftIn, rightIn] = [rightIn, leftIn];
  if (layer.flipV) [topIn, bottomIn] = [bottomIn, topIn];
  // displayScale を掛けて CSS px に変換。
  const t = topIn * displayScale;
  const r = rightIn * displayScale;
  const b = bottomIn * displayScale;
  const l = leftIn * displayScale;
  el.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px)`;
}

const STICKER_HANDLE_CORNERS = ['nw', 'ne', 'sw', 'se'];
const STICKER_MIN_SIZE = 20;

function ensureStickerHandles(layer) {
  if (!isStickerLike(layer) || layer.handles) return;
  layer.handles = {};
  for (const corner of STICKER_HANDLE_CORNERS) {
    const h = document.createElement('div');
    h.className = `sticker-handle sticker-handle-${corner}`;
    attachStickerHandleDrag(layer, h, corner);
    els.layerContainer.appendChild(h);
    layer.handles[corner] = h;
  }
  applyStickerStyle(layer);
}

function removeStickerHandles(layer) {
  if (!layer || !layer.handles) return;
  for (const c of STICKER_HANDLE_CORNERS) {
    if (layer.handles[c]) layer.handles[c].remove();
  }
  layer.handles = null;
}

function syncStickerHandles() {
  const selected = getSelectedLayer();
  for (const l of cur.layers) {
    if (!isStickerLike(l)) continue;
    if (l === selected) ensureStickerHandles(l);
    else removeStickerHandles(l);
  }
}

function positionStickerHandles(layer, scale) {
  if (!layer.handles) return;
  const w = (layer.width || 0) * scale;
  const h = (layer.height || 0) * scale;
  const x = layer.x * scale;
  const y = layer.y * scale;
  const sz = 10;
  const off = sz / 2;
  const pos = {
    nw: [x - off, y - off],
    ne: [x + w - off, y - off],
    sw: [x - off, y + h - off],
    se: [x + w - off, y + h - off],
  };
  for (const c of STICKER_HANDLE_CORNERS) {
    const el = layer.handles[c];
    el.style.left = `${pos[c][0]}px`;
    el.style.top = `${pos[c][1]}px`;
  }
}

function attachStickerHandleDrag(layer, el, corner) {
  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    recordUndo();
    const rect = els.layerContainer.getBoundingClientRect();
    const scaleX = cur.canvasWidth / rect.width;
    const scaleY = cur.canvasHeight / rect.height;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = layer.x;
    const origY = layer.y;
    const origW = layer.width;
    const origH = layer.height;
    const aspectLocked = isOverlayLike(layer);
    const aspect = origW > 0 ? origH / origW : 1;
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) * scaleX;
      const dy = (ev.clientY - startY) * scaleY;
      let nx = origX, ny = origY, nw = origW, nh = origH;
      if (aspectLocked) {
        // 各角における「拡大方向の符号」に合わせて dx/dy を符号反転し、
        // 横/縦どちらの動きが大きい方を採用してアスペクト比を保つ。
        const expandX = (corner === 'se' || corner === 'ne') ? dx : -dx;
        const expandY = (corner === 'se' || corner === 'sw') ? dy : -dy;
        const candW1 = origW + expandX;
        const candW2 = aspect === 0 ? candW1 : (origH + expandY) / aspect;
        nw = Math.max(STICKER_MIN_SIZE, Math.max(candW1, candW2));
        nh = nw * aspect;
        // 対角を固定: 掴んだ角と反対側の角を動かさない
        if (corner === 'nw') { nx = origX + (origW - nw); ny = origY + (origH - nh); }
        else if (corner === 'ne') { ny = origY + (origH - nh); }
        else if (corner === 'sw') { nx = origX + (origW - nw); }
      } else if (corner === 'nw') {
        nw = Math.max(STICKER_MIN_SIZE, origW - dx);
        nh = Math.max(STICKER_MIN_SIZE, origH - dy);
        nx = origX + (origW - nw);
        ny = origY + (origH - nh);
      } else if (corner === 'ne') {
        nw = Math.max(STICKER_MIN_SIZE, origW + dx);
        nh = Math.max(STICKER_MIN_SIZE, origH - dy);
        ny = origY + (origH - nh);
      } else if (corner === 'sw') {
        nw = Math.max(STICKER_MIN_SIZE, origW - dx);
        nh = Math.max(STICKER_MIN_SIZE, origH + dy);
        nx = origX + (origW - nw);
      } else {
        nw = Math.max(STICKER_MIN_SIZE, origW + dx);
        nh = Math.max(STICKER_MIN_SIZE, origH + dy);
      }
      layer.x = nx;
      layer.y = ny;
      layer.width = nw;
      layer.height = nh;
      applyStickerStyle(layer);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// --- レイヤーのドラッグ・選択・編集 ---

function attachLayerHandlers(layer) {
  const el = layer.el;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // 左クリックのみドラッグ開始
    if (el.classList.contains('editing')) return;
    e.stopPropagation();
    selectLayer(layer.id);
    recordUndo();

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
    recordUndo();
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
  syncStickerHandles();
  updateInspector();
}

function deselect() {
  cur.selectedId = null;
  cur.layers.forEach((l) => l.el.classList.remove('selected'));
  syncStickerHandles();
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
  recordUndo();
  if (isStickerLike(layer)) removeStickerHandles(layer);
  layer.el.remove();
  cur.layers = cur.layers.filter((l) => l.id !== layer.id);
  renderTextPreview();
  deselect();
  updateActionButtons();
}

// Ctrl+C/V 用のクリップボード。アプリ内専用(OS クリップボードは経由しない)。
// el は除外し、addXxxLayer に渡せる素のデータだけ保持する。
// kind は 'text' / 'sticker' / 'overlay' のいずれか(text には monologue サブ種別を含む)。
let clipboard = null;
const PASTE_OFFSET = 20;

function serializeTextLayer(layer) {
  return {
    text: layer.text,
    x: layer.x, y: layer.y,
    font: layer.font,
    size: layer.size,
    orientation: layer.orientation,
    lineHeight: layer.lineHeight,
    kind: layer.kind, // 'text' または 'monologue'
  };
}

// 吹き出し(sticker)の矩形内に基準点を持つ text/monologue レイヤーを抽出する。
// add-bubble は吹き出し中央付近にテキストを置く設計なので、layer.x/y が矩形に
// 入っているかの簡易判定で実用上の「中身」を拾える(尾の上に偶然乗っているテキストは
// 巻き込みうるが、許容)。
function findTextChildrenInSticker(sticker, page = cur) {
  if (!sticker.width || !sticker.height) return [];
  const x0 = sticker.x;
  const y0 = sticker.y;
  const x1 = sticker.x + sticker.width;
  const y1 = sticker.y + sticker.height;
  return page.layers.filter((l) => {
    if (l.kind !== 'text' && l.kind !== 'monologue') return false;
    return l.x >= x0 && l.x <= x1 && l.y >= y0 && l.y <= y1;
  });
}

function copySelectedLayer() {
  const layer = getSelectedLayer();
  if (!layer) return false;
  if (layer.kind === 'overlay') {
    clipboard = {
      kind: 'overlay',
      data: {
        src: layer.src,
        x: layer.x, y: layer.y,
        width: layer.width, height: layer.height,
        naturalWidth: layer.naturalWidth, naturalHeight: layer.naturalHeight,
        flipH: layer.flipH, flipV: layer.flipV,
      },
    };
  } else if (layer.kind === 'panelOverlay') {
    clipboard = {
      kind: 'panelOverlay',
      data: {
        src: layer.src,
        x: layer.x, y: layer.y,
        width: layer.width, height: layer.height,
        naturalWidth: layer.naturalWidth, naturalHeight: layer.naturalHeight,
        flipH: layer.flipH, flipV: layer.flipV,
        panelId: layer.panelId,
      },
    };
  } else if (layer.kind === 'sticker') {
    clipboard = {
      kind: 'sticker',
      data: {
        src: layer.src,
        x: layer.x, y: layer.y,
        width: layer.width, height: layer.height,
        flipH: layer.flipH, flipV: layer.flipV,
      },
      // 吹き出しに内包されているテキストも一緒に複製する
      children: findTextChildrenInSticker(layer).map(serializeTextLayer),
    };
  } else {
    clipboard = {
      kind: 'text',
      data: serializeTextLayer(layer),
    };
  }
  return true;
}

function pasteFromClipboard() {
  if (!clipboard) return false;
  // 連続ペーストで重ならないよう、保存座標を毎回ずらす。
  // 子テキストにも同じオフセットを適用して相対位置を維持する。
  clipboard.data.x += PASTE_OFFSET;
  clipboard.data.y += PASTE_OFFSET;
  if (clipboard.children) {
    for (const c of clipboard.children) {
      c.x += PASTE_OFFSET;
      c.y += PASTE_OFFSET;
    }
  }
  const d = clipboard.data;
  if (clipboard.kind === 'text') {
    addTextLayer({
      x: d.x, y: d.y,
      text: d.text,
      font: d.font,
      size: d.size,
      orientation: d.orientation,
      lineHeight: d.lineHeight,
      kind: d.kind,
    });
  } else if (clipboard.kind === 'sticker') {
    addStickerLayer({
      x: d.x, y: d.y,
      src: d.src,
      width: d.width, height: d.height,
      flipH: d.flipH, flipV: d.flipV,
    });
    // addStickerLayer 内で push & selectLayer 済み。直後の layers 末尾 = 追加した sticker。
    const newStickerId = cur.layers[cur.layers.length - 1].id;
    if (clipboard.children && clipboard.children.length) {
      for (const c of clipboard.children) {
        addTextLayer({
          x: c.x, y: c.y,
          text: c.text,
          font: c.font,
          size: c.size,
          orientation: c.orientation,
          lineHeight: c.lineHeight,
          kind: c.kind,
        });
      }
      // 子テキストの addTextLayer が選択を奪うので、最後に吹き出しを再選択しておく
      selectLayer(newStickerId);
    }
  } else if (clipboard.kind === 'overlay') {
    addOverlayLayer({
      x: d.x, y: d.y,
      src: d.src,
      width: d.width, height: d.height,
      naturalWidth: d.naturalWidth, naturalHeight: d.naturalHeight,
      flipH: d.flipH, flipV: d.flipV,
    });
  } else if (clipboard.kind === 'panelOverlay') {
    addPanelOverlayLayer({
      x: d.x, y: d.y,
      src: d.src,
      width: d.width, height: d.height,
      naturalWidth: d.naturalWidth, naturalHeight: d.naturalHeight,
      flipH: d.flipH, flipV: d.flipV,
      panelId: d.panelId,
    });
  }
  return true;
}

document.addEventListener('keydown', (e) => {
  if (isEditableTarget()) return;

  // Ctrl+←/→ でページ移動(選択状態に関係なく動作)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    switchToPage(state.currentPageIndex + (e.key === 'ArrowRight' ? 1 : -1));
    return;
  }

  // Ctrl+C: 選択中レイヤーをコピー / Ctrl+V: 現在ページに複製
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 'z') {
      if (undoLastChange()) e.preventDefault();
      return;
    }
    if (k === 'c') {
      if (copySelectedLayer()) e.preventDefault();
      return;
    }
    if (k === 'v') {
      if (pasteFromClipboard()) e.preventDefault();
      return;
    }
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

  // Ctrl+↑/↓ で文字サイズを変更(スライダーと同じ 8〜120 の範囲)。画像系レイヤーには適用しない
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    if (isStickerLike(layer)) return;
    e.preventDefault();
    recordUndo();
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
    recordUndo();
    // 吹き出しを矢印キーで動かしたときも内包テキストを追従させる。
    // 子の判定は移動前の sticker 矩形で行う。
    const children = layer.kind === 'sticker' ? findTextChildrenInSticker(layer) : [];
    layer.x += delta.dx;
    layer.y += delta.dy;
    applyLayerStyle(layer);
    for (const c of children) {
      c.x += delta.dx;
      c.y += delta.dy;
      applyLayerStyle(c);
    }
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
  if (isStickerLike(layer)) {
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
  if (isStickerLike(layer)) {
    els.textProps.hidden = true;
    els.stickerProps.hidden = false;
    const isOverlay = isOverlayLike(layer);
    const isPanelOverlay = layer.kind === 'panelOverlay';
    els.stickerTitle.textContent = isPanelOverlay
      ? '選択中のコマ重ね画像'
      : (isOverlay ? '選択中の上重ね画像' : '選択中の吹き出し');
    els.bubblePickerField.hidden = isOverlay;
    els.stickerDelete.textContent = isPanelOverlay
      ? 'このコマ重ね画像を削除'
      : (isOverlay ? 'この上重ね画像を削除' : 'この吹き出しを削除');
    if (!isOverlay) updateBubblePickerSelection(layer);
    els.stickerFlipH.classList.toggle('active', !!layer.flipH);
    els.stickerFlipV.classList.toggle('active', !!layer.flipV);
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
  recordUndo();
  layer.text = els.propText.value;
  layer.el.textContent = layer.text;
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propFont.addEventListener('change', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  recordUndo();
  layer.font = els.propFont.value;
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propSize.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  recordUndo();
  layer.size = Number(els.propSize.value);
  els.propSizeValue.textContent = String(layer.size);
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propOrientation.addEventListener('change', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  recordUndo();
  layer.orientation = els.propOrientation.value;
  applyLayerStyle(layer);
  renderTextPreview();
});

els.propLineHeight.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  recordUndo();
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

els.stickerFlipH.addEventListener('click', () => {
  const layer = getSelectedLayer();
  if (!isStickerLike(layer)) return;
  recordUndo();
  layer.flipH = !layer.flipH;
  applyStickerStyle(layer);
  els.stickerFlipH.classList.toggle('active', layer.flipH);
});

els.stickerFlipV.addEventListener('click', () => {
  const layer = getSelectedLayer();
  if (!isStickerLike(layer)) return;
  recordUndo();
  layer.flipV = !layer.flipV;
  applyStickerStyle(layer);
  els.stickerFlipV.classList.toggle('active', layer.flipV);
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
  recordUndo();
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

// --- 集中線ピッカー(コマ単位で 1 枚を差し替え) ---

function initFocusPicker() {
  const picker = els.focusPicker;
  if (!picker) return;
  // 先頭に「なし」サムネを置き、続けて FOCUS_CATALOG のサムネを並べる
  const emptyBtn = document.createElement('button');
  emptyBtn.type = 'button';
  emptyBtn.className = 'bubble-thumb thumb-empty';
  emptyBtn.dataset.src = '';
  emptyBtn.textContent = 'なし';
  emptyBtn.title = '集中線を外す';
  emptyBtn.addEventListener('click', () => applyFocusPick(''));
  picker.appendChild(emptyBtn);
  for (const item of FOCUS_CATALOG) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bubble-thumb';
    btn.dataset.src = item.src;
    const parts = item.src.split('/');
    btn.title = parts[parts.length - 1];
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = '';
    img.draggable = false;
    btn.appendChild(img);
    btn.addEventListener('click', () => applyFocusPick(item.src));
    picker.appendChild(btn);
  }
}

function applyFocusPick(src) {
  const sel = getSelectedPanel();
  if (!sel) return;
  recordUndo();
  if (!src) {
    sel.focus = null;
  } else if (sel.focus && sel.focus.src === src) {
    return; // 同じ素材を選んだだけ、何もしない
  } else if (sel.focus) {
    sel.focus.src = src;
  } else {
    sel.focus = { src, scale: 1, rotation: 0 };
  }
  rerenderPanelFocus(sel);
  updateFocusControls();
  updateActionButtons();
}

// 選択中コマの集中線 img を張り替える。コマ DOM 自体は維持して .panel-focus だけ差し替える。
function rerenderPanelFocus(panel) {
  const el = els.panelContainer.querySelector(`[data-panel-id="${panel.id}"]`);
  if (!el) return;
  const old = el.querySelector('.panel-focus');
  if (old) old.remove();
  mountFocusOnPanel(el, panel);
}

function updateFocusControls() {
  const sel = getSelectedPanel();
  const f = sel ? sel.focus : null;
  // サムネの選択状態
  for (const btn of els.focusPicker.querySelectorAll('.bubble-thumb')) {
    btn.classList.toggle('selected', (f ? f.src : '') === (btn.dataset.src || ''));
  }
  // スライダー値と enable/disable
  const enabled = !!f;
  els.focusScaleInput.disabled = !enabled;
  els.focusRotationInput.disabled = !enabled;
  els.focusResetBtn.disabled = !enabled;
  const scale = f ? (f.scale || 1) : 1;
  const rot = f ? (f.rotation || 0) : 0;
  els.focusScaleInput.value = String(scale);
  els.focusScaleValue.textContent = scale.toFixed(2);
  els.focusRotationInput.value = String(rot);
  els.focusRotationValue.textContent = String(Math.round(rot));
}

function updateFocusTransformOnly(panel) {
  const el = els.panelContainer.querySelector(`[data-panel-id="${panel.id}"]`);
  const img = el && el.querySelector('.panel-focus');
  if (img) applyFocusTransform(img, panel, el);
}

initFocusPicker();

els.focusScaleInput.addEventListener('input', () => {
  const sel = getSelectedPanel();
  if (!sel || !sel.focus) return;
  recordUndo();
  const v = Math.max(FOCUS_SCALE_MIN, Math.min(FOCUS_SCALE_MAX, Number(els.focusScaleInput.value) || 1));
  sel.focus.scale = v;
  els.focusScaleValue.textContent = v.toFixed(2);
  updateFocusTransformOnly(sel);
});

els.focusRotationInput.addEventListener('input', () => {
  const sel = getSelectedPanel();
  if (!sel || !sel.focus) return;
  recordUndo();
  const v = Math.max(-180, Math.min(180, Number(els.focusRotationInput.value) || 0));
  sel.focus.rotation = v;
  els.focusRotationValue.textContent = String(Math.round(v));
  updateFocusTransformOnly(sel);
});

els.focusResetBtn.addEventListener('click', () => {
  const sel = getSelectedPanel();
  if (!sel || !sel.focus) return;
  recordUndo();
  sel.focus.scale = 1;
  sel.focus.rotation = 0;
  updateFocusControls();
  updateFocusTransformOnly(sel);
});

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

// PNG書き出し用。アセット由来の <img>(assets/bubbles/...) を直接 drawImage すると
// オリジンによっては canvas が tainted になり toBlob が失敗するので、
// 一度 fetch → dataURL に正規化してから Image にロードする。dataURL はキャッシュ。
// ただし file:// で開いた場合は fetch が CORS で拒否されるため、その時は <img> 直接ロードに
// フォールバックする(同一オリジン画像なので tainted にはならない)。
const _imageDataUrlCache = new Map();
async function loadImageForCanvas(src) {
  if (!src) throw new Error('画像のソースがありません');
  if (src.startsWith('data:')) return loadImageElement(src);
  let dataUrl = _imageDataUrlCache.get(src);
  if (!dataUrl) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`画像取得に失敗: ${src} (${res.status})`);
      const blob = await res.blob();
      dataUrl = await blobToDataUrl(blob);
      _imageDataUrlCache.set(src, dataUrl);
    } catch (err) {
      return loadImageElement(src);
    }
  }
  return loadImageElement(dataUrl);
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

  // 素材画像と集中線画像を並列ロード
  const materialImgs = await Promise.all(
    page.panels.map((p) => (p.material ? loadImageElement(p.material.src).catch(() => null) : null))
  );
  const focusImgs = await Promise.all(
    page.panels.map((p) => (p.focus ? loadImageForCanvas(p.focus.src).catch(() => null) : null))
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

    // 集中線描画(素材の上、レイヤーの下)。DOM の mix-blend-mode と同じ合成モードを使う。
    // コマ枠でクリップ。
    if (p.focus && focusImgs[i]) {
      const fimg = focusImgs[i];
      const nw = fimg.naturalWidth || 0;
      const nh = fimg.naturalHeight || 0;
      if (nw > 0 && nh > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();
        const coverScale = Math.max(rect.w / nw, rect.h / nh);
        const finalW = nw * coverScale * (p.focus.scale || 1);
        const finalH = nh * coverScale * (p.focus.scale || 1);
        ctx.globalCompositeOperation = getFocusBlend(p.focus.src);
        ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.rotate(((p.focus.rotation || 0) * Math.PI) / 180);
        ctx.drawImage(fimg, -finalW / 2, -finalH / 2, finalW, finalH);
        ctx.restore();
      }
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
    // 画像系レイヤー(sticker / overlay)は DOM の <img> として直接表示するのでプレビュー canvas には描かない
    if (isStickerLike(layer)) return;
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

function buildProjectData(page = cur, overlayFileById = new Map()) {
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
          flipH: !!l.flipH,
          flipV: !!l.flipV,
        };
      }
      if (l.kind === 'overlay') {
        return {
          kind: 'overlay',
          file: overlayFileById.get(l.id) || null,
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height,
          naturalWidth: l.naturalWidth || 0,
          naturalHeight: l.naturalHeight || 0,
          flipH: !!l.flipH,
          flipV: !!l.flipV,
        };
      }
      if (l.kind === 'panelOverlay') {
        return {
          kind: 'panelOverlay',
          file: overlayFileById.get(l.id) || null,
          panelId: l.panelId,
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height,
          naturalWidth: l.naturalWidth || 0,
          naturalHeight: l.naturalHeight || 0,
          flipH: !!l.flipH,
          flipV: !!l.flipV,
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

async function applyProjectData(data, targetPage = cur, overlayEntries = {}) {
  const wasRestoringUndo = isRestoringUndo;
  isRestoringUndo = true;
  try {
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
        flipH: !!l.flipH,
        flipV: !!l.flipV,
      }, targetPage);
      continue;
    }
    if (l.kind === 'overlay') {
      const entry = l.file ? overlayEntries[l.file] : null;
      if (!entry) {
        console.warn(`上重ね画像のファイルが見つかりません: ${l.file}`);
        continue;
      }
      try {
        const blob = await entry.async('blob');
        const dataUrl = await blobToDataUrl(blob);
        addOverlayLayer({
          x: Number(l.x) || 0,
          y: Number(l.y) || 0,
          src: dataUrl,
          width: typeof l.width === 'number' ? l.width : 0,
          height: typeof l.height === 'number' ? l.height : 0,
          naturalWidth: typeof l.naturalWidth === 'number' ? l.naturalWidth : 0,
          naturalHeight: typeof l.naturalHeight === 'number' ? l.naturalHeight : 0,
          flipH: !!l.flipH,
          flipV: !!l.flipV,
        }, targetPage);
      } catch (err) {
        console.warn(`上重ね画像の展開に失敗 (${l.file}):`, err);
      }
      continue;
    }
    if (l.kind === 'panelOverlay') {
      const entry = l.file ? overlayEntries[l.file] : null;
      if (!entry) {
        console.warn(`コマ重ね画像のファイルが見つかりません: ${l.file}`);
        continue;
      }
      try {
        const blob = await entry.async('blob');
        const dataUrl = await blobToDataUrl(blob);
        addPanelOverlayLayer({
          x: Number(l.x) || 0,
          y: Number(l.y) || 0,
          src: dataUrl,
          width: typeof l.width === 'number' ? l.width : 0,
          height: typeof l.height === 'number' ? l.height : 0,
          naturalWidth: typeof l.naturalWidth === 'number' ? l.naturalWidth : 0,
          naturalHeight: typeof l.naturalHeight === 'number' ? l.naturalHeight : 0,
          flipH: !!l.flipH,
          flipV: !!l.flipV,
          panelId: Number(l.panelId) || null,
        }, targetPage);
      } catch (err) {
        console.warn(`コマ重ね画像の展開に失敗 (${l.file}):`, err);
      }
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
  } finally {
    isRestoringUndo = wasRestoringUndo;
  }
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
    // 上重ね画像/コマ重ね画像を先に zip に書き込み、layer.id → file パスのマップを作る
    const overlayFileById = new Map();
    for (const l of page.layers) {
      if (!isOverlayLike(l) || typeof l.src !== 'string') continue;
      try {
        const blob = dataUrlToBlob(l.src);
        const ext = extFromMime(blob.type);
        const file = `overlays/${l.id}${ext}`;
        zip.file(`pages/${idx}/${file}`, blob);
        overlayFileById.set(l.id, file);
      } catch (err) {
        console.warn(`上重ね画像 layer ${l.id} の書き出しに失敗:`, err);
      }
    }
    zip.file(`pages/${idx}/${BUNDLE_TEXT_NAME}`, JSON.stringify(buildProjectData(page, overlayFileById), null, 2));
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
        const out = { id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, material: null, focus: null };
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
        if (p.focus) {
          // 集中線は同梱アセット由来。src(アセットパス)・scale・rotation のみ保存する。
          out.focus = {
            src: p.focus.src,
            scale: p.focus.scale,
            rotation: p.focus.rotation,
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
  const { textEntry, memoEntry, panelsEntry, materialEntries, overlayEntries } = entries;
  if (textEntry) {
    try {
      const data = JSON.parse(await textEntry.async('string'));
      if (data && Array.isArray(data.layers)) {
        await applyProjectData(data, page, overlayEntries || {});
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
        const panel = { id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, material: null, focus: null };
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
        if (p.focus && typeof p.focus.src === 'string' && FOCUS_CATALOG.some((c) => c.src === p.focus.src)) {
          panel.focus = {
            src: p.focus.src,
            scale: typeof p.focus.scale === 'number' ? p.focus.scale : 1,
            rotation: typeof p.focus.rotation === 'number' ? p.focus.rotation : 0,
          };
        }
        page.panels.push(panel);
      }
      // 旧 'none' で panels が空だったケースは 1コマ全面で埋める
      if (page.panels.length === 0) {
        page.panels = TEMPLATES[DEFAULT_TEMPLATE].panels.map((p) => ({
          id: page.nextPanelId++,
          x: p.x, y: p.y, w: p.w, h: p.h,
          material: null,
          focus: null,
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
    pageEntries.push({ textEntry: null, memoEntry: null, panelsEntry: null, materialEntries: {}, overlayEntries: {} });
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
    // overlays/<layerId>.<ext> は text.json の {file: ...} と突き合わせるため
    // 相対パスをキーにしてそのまま持っておく
    const ovM = name.match(/^overlays\/[^/]+$/);
    if (ovM) {
      pageEntries[idx].overlayEntries[name] = entry;
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
    if (!e.textEntry && !e.memoEntry && !e.panelsEntry
        && Object.keys(e.materialEntries).length === 0
        && Object.keys(e.overlayEntries).length === 0) continue;
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
els.helpToggle.addEventListener('click', () => {
  toggleHelpPanel();
});
if (els.themeToggle) {
  els.themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    storeTheme(nextTheme);
    setTheme(nextTheme);
  });
}
els.helpClose.addEventListener('click', () => {
  els.helpPanel.hidden = true;
});
els.shortcutsClose.addEventListener('click', () => {
  els.shortcutsPanel.hidden = true;
});

// textarea への入力を現在ページのメモに反映
els.memoText.addEventListener('input', () => {
  recordUndo();
  cur.memo = els.memoText.value;
  updateActionButtons();
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
    recordUndo();
    cur.memo = text;
    els.memoText.value = text;
    els.memoPanel.hidden = false;
    updateActionButtons();
  };
  reader.readAsArrayBuffer(file);
}

async function readMemoTextFile(file) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('shift_jis').decode(buf);
  }
}

async function loadMemoFiles(files) {
  const start = state.currentPageIndex;
  if (start + files.length > MAX_PAGES) {
    alert(`選択した .txt は ${files.length} 個あります。P${start + 1} から読み込むと ${MAX_PAGES}P を超えるため、読み込みを中止しました。`);
    return;
  }

  const overwritePages = files
    .map((_, i) => start + i)
    .filter((pageIndex) => (state.pages[pageIndex].memo || '').trim().length > 0);
  if (overwritePages.length > 0) {
    const labels = overwritePages.map((pageIndex) => `P${pageIndex + 1}`).join(', ');
    if (!confirm(`${labels} の現在のメモを上書きします。よろしいですか?`)) return;
  }

  try {
    const texts = await Promise.all(files.map(readMemoTextFile));
    recordUndo();
    texts.forEach((text, i) => {
      state.pages[start + i].memo = text;
    });
    syncMemoFromPage();
    els.memoPanel.hidden = false;
    updateActionButtons();
  } catch (err) {
    console.error(err);
    alert('テキストの読み込みに失敗しました: ' + (err && err.message ? err.message : err));
  }
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

// 現在表示中のページ(cur)を 1 枚の PNG Blob にレンダリングする。
// gutter/border のスケールは現在の DOM 表示幅(panelContainer.clientWidth)に依存するため、
// 一括書き出しでは呼び出し側で switchToPage により対象ページを表示してから呼ぶこと。
async function renderCurrentPageToPngBlob() {
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
  // 画像系レイヤー(panelOverlay / overlay / sticker)を並列ロード。
  // sticker はアセットパス由来なので tainted を避けるため fetch→dataURL 経由で読む。
  const layerImgs = await Promise.all(
    cur.layers.map((l) => (isStickerLike(l) ? loadImageForCanvas(l.src).catch(() => null) : null))
  );
  // panelOverlay は出力サイズの gutter を使ってコマ矩形を再計算する
  const previewW = els.panelContainer.clientWidth || pageW;
  const exportScale = pageW / previewW;
  const gutterCss = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-gutter')) || 0;
  const exportGutterPx = gutterCss * exportScale;
  const drawImageLayer = (layer, img) => {
    if (!img || !(layer.width > 0 && layer.height > 0)) return;
    if (layer.flipH || layer.flipV) {
      const sx = layer.flipH ? -1 : 1;
      const sy = layer.flipV ? -1 : 1;
      const tx = layer.x + (layer.flipH ? layer.width : 0);
      const ty = layer.y + (layer.flipV ? layer.height : 0);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(sx, sy);
      ctx.drawImage(img, 0, 0, layer.width, layer.height);
      ctx.restore();
    } else {
      ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
    }
  };
  const drawPanelOverlayLayer = (layer, img) => {
    if (!img || !(layer.width > 0 && layer.height > 0)) return;
    const panel = cur.panels.find((p) => p.id === layer.panelId);
    if (!panel) return;
    const rect = computePanelPixelRect(panel, pageW, pageH, exportGutterPx);
    if (rect.w <= 0 || rect.h <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    drawImageLayer(layer, img);
    ctx.restore();
  };
  // 描画順(奥→手前): panelOverlay → overlay → sticker → text。DOM の積み順と合わせる。
  cur.layers.forEach((layer, i) => {
    if (layer.kind === 'panelOverlay') drawPanelOverlayLayer(layer, layerImgs[i]);
  });
  cur.layers.forEach((layer, i) => {
    if (layer.kind === 'overlay') drawImageLayer(layer, layerImgs[i]);
  });
  cur.layers.forEach((layer, i) => {
    if (layer.kind === 'sticker') drawImageLayer(layer, layerImgs[i]);
  });
  cur.layers.forEach((layer) => {
    if (!isStickerLike(layer)) drawTextLayer(ctx, layer);
  });

  return canvasToPngBlob(canvas);
}

els.exportBtn.addEventListener('click', async () => {
  if (!hasPageVisualContent(cur)) return;
  els.exportBtn.disabled = true;
  try {
    const pngBlob = await renderCurrentPageToPngBlob();
    await saveBlob(pngBlob, `gina-p${state.currentPageIndex + 1}.png`, {
      description: 'PNG画像',
      mimeType: 'image/png',
      extension: '.png',
    });
  } catch (err) {
    console.error(err);
    alert('PNG 書き出しに失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    els.exportBtn.disabled = !hasPageVisualContent(cur);
  }
});

// 次フレームまで待ってレイアウトを確定させる(ページ切替後の DOM 計測のため)
function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

// 全ページを順に表示しながら PNG 化し、1 つの ZIP にまとめて書き出す(簡易版)。
els.exportAllBtn.addEventListener('click', async () => {
  const targets = state.pages
    .map((page, index) => ({ page, index }))
    .filter(({ page }) => hasPageVisualContent(page));
  if (targets.length === 0) {
    alert('書き出せるページがありません。素材やテキストを追加してください。');
    return;
  }
  const originalIndex = state.currentPageIndex;
  els.exportAllBtn.disabled = true;
  els.exportBtn.disabled = true;
  try {
    const zip = new JSZip();
    // ファイル名は .mj 名から拡張子を除いたものを基準にする(未保存なら既定名)
    const baseName = (state.fileName || 'gina-pages').replace(/\.mj$/i, '') || 'gina-pages';
    const digits = String(state.pages.length).length;
    for (const { index } of targets) {
      switchToPage(index);
      await nextFrame(); // 切替後のレイアウト確定を待つ
      const pngBlob = await renderCurrentPageToPngBlob();
      zip.file(`${baseName}-p${String(index + 1).padStart(digits, '0')}.png`, pngBlob);
    }
    // PNG は既圧縮なので STORE(無圧縮)で十分。zip 化の時間を節約する。
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    await saveBlob(zipBlob, `${baseName}.zip`, {
      description: 'PNG画像 (ZIP)',
      mimeType: 'application/zip',
      extension: '.zip',
    });
  } catch (err) {
    console.error(err);
    alert('一括 PNG 書き出しに失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    // 元のページに戻す(同一ページなら early return するのでボタン状態は明示的に更新)
    switchToPage(originalIndex);
    updateActionButtons();
  }
});
