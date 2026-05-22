// 漫画吹き出し文字入れツール

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
  exportBtn: document.getElementById('exportBtn'),
  stageWrapper: document.getElementById('stageWrapper'),
  dropHint: document.getElementById('dropHint'),
  stage: document.getElementById('stage'),
  baseImage: document.getElementById('baseImage'),
  layerContainer: document.getElementById('layerContainer'),
  textProps: document.getElementById('textProps'),
  propText: document.getElementById('propText'),
  propFont: document.getElementById('propFont'),
  propSize: document.getElementById('propSize'),
  propSizeValue: document.getElementById('propSizeValue'),
  propOrientation: document.getElementById('propOrientation'),
  propLineHeight: document.getElementById('propLineHeight'),
  propLineHeightValue: document.getElementById('propLineHeightValue'),
  propDelete: document.getElementById('propDelete'),
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

const IMAGE_SELECTION = 'image';

const MONOLOGUE_PADDING = 12;
const MONOLOGUE_BORDER = 2;

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|avif|svg)$/i;
const BUNDLE_EXT = '.mj';
const BUNDLE_IMAGE_PREFIX = 'image';
const BUNDLE_TEXT_NAME = 'text.json';
const BUNDLE_MEMO_NAME = 'memo.txt';

function detectFileKind(file) {
  const name = file.name || '';
  const type = file.type || '';
  if (/\.mj$/i.test(name)) return 'bundle';
  if (type.startsWith('image/') || IMAGE_EXT_RE.test(name)) return 'image';
  if (type === 'application/json' || /\.json$/i.test(name)) return 'project';
  if (type.startsWith('text/') || /\.txt$/i.test(name)) return 'memo';
  return null;
}

function openFile(file) {
  if (!file) return;
  const kind = detectFileKind(file);
  if (kind === 'image') {
    loadImageFile(file);
  } else if (kind === 'bundle') {
    loadBundleFile(file);
  } else if (kind === 'project') {
    loadProjectFile(file);
  } else if (kind === 'memo') {
    loadMemoFile(file);
  } else {
    alert(`対応していないファイル形式です: ${file.name}`);
  }
}

const MAX_PAGES = 4;

function createEmptyPage() {
  return {
    imageLoaded: false,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    imageBlob: null,
    imageName: '',
    imageDataUrl: '',
    layers: [], // { id, el, x, y, text, font, size, orientation, lineHeight }
    selectedId: null,
    nextId: 1,
    memo: '',
  };
}

const state = {
  pages: Array.from({ length: MAX_PAGES }, createEmptyPage),
  currentPageIndex: 0,
};

let cur = state.pages[0];

function anyPageHasImage() {
  return state.pages.some((p) => p.imageLoaded);
}

function isPageEmpty(page) {
  return !page.imageLoaded && page.layers.length === 0;
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

// 表示中ページの画像・レイヤー・有効状態をいまの cur に同期する。
// ページ切替時と一括読み込み(.mj)後の初期表示の両方から使う。
function refreshPageView() {
  if (cur.imageLoaded && cur.imageDataUrl) {
    if (els.baseImage.getAttribute('src') !== cur.imageDataUrl) {
      els.baseImage.src = cur.imageDataUrl;
    }
    els.dropHint.hidden = true;
    els.stage.hidden = false;
    els.exportBtn.disabled = false;
  } else {
    els.baseImage.removeAttribute('src');
    els.dropHint.hidden = false;
    els.stage.hidden = true;
    els.exportBtn.disabled = true;
  }
  els.saveProjectBtn.disabled = !anyPageHasImage();
  els.deletePageBtn.disabled = isPageEmpty(cur);
  els.stage.classList.toggle('image-selected', cur.selectedId === IMAGE_SELECTION && cur.imageLoaded);
  // 現在ページのレイヤー DOM を layerContainer に並べ直す
  for (const l of cur.layers) {
    if (l.el.parentNode !== els.layerContainer) {
      els.layerContainer.appendChild(l.el);
    }
  }
  applyAllLayerStyles();
  updateInspector();
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

els.deletePageBtn.addEventListener('click', () => {
  if (isPageEmpty(cur)) return;
  if (!confirm(`ページ ${state.currentPageIndex + 1} の画像とテキストを消去します。よろしいですか?`)) return;
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

// --- 画像読み込み ---

els.fileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) openFile(file);
  els.fileInput.value = '';
});

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
  if (file) openFile(file);
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

async function loadImageBlobToPage(page, blob, name) {
  // 既に画像があるページに別画像を開く場合は画像差し替えとして既存レイヤーをクリア。
  // 画像が無いページ(新規 or 画像削除後)では既存テキストを保持して載せ替える。
  const hadImage = page.imageLoaded;
  page.imageBlob = blob;
  page.imageName = name || 'image';
  page.imageDataUrl = await blobToDataUrl(blob);
  const sz = await getImageNaturalSize(page.imageDataUrl);
  page.imageNaturalWidth = sz.width;
  page.imageNaturalHeight = sz.height;
  page.imageLoaded = true;
  if (hadImage) {
    for (const l of page.layers) l.el.remove();
    page.layers = [];
    page.selectedId = null;
    page.nextId = 1;
  }
}

async function loadImageFile(file) {
  await loadImageBlobToPage(cur, file, file.name);
  refreshPageView();
}

// --- ステージ上の選択 / 右クリックメニュー ---

// 何もないところを左クリックしたら画像を選択
els.layerContainer.addEventListener('click', (e) => {
  if (e.target !== els.layerContainer) return;
  if (!cur.imageLoaded) return;
  selectImage();
});

// クリック位置(画像ネイティブ座標)を覚えておき、メニューの「テキストを追加」で使う
let contextMenuTargetCoords = { x: 0, y: 0 };

els.layerContainer.addEventListener('contextmenu', (e) => {
  if (!cur.imageLoaded) return;
  e.preventDefault();
  const rect = els.layerContainer.getBoundingClientRect();
  const scaleX = cur.imageNaturalWidth / rect.width;
  const scaleY = cur.imageNaturalHeight / rect.height;
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
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  if (e.altKey || e.shiftKey) return;
  const key = e.key.toLowerCase();
  if (key === 's') {
    e.preventDefault();
    if (!els.saveProjectBtn.disabled) els.saveProjectBtn.click();
  } else if (key === 'o') {
    e.preventDefault();
    els.fileInput.click();
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
  }
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
    const scaleX = cur.imageNaturalWidth / rect.width;
    const scaleY = cur.imageNaturalHeight / rect.height;
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

function selectLayer(id) {
  cur.selectedId = id;
  cur.layers.forEach((l) => {
    l.el.classList.toggle('selected', l.id === id);
  });
  els.stage.classList.remove('image-selected');
  updateInspector();
}

function selectImage() {
  cur.selectedId = IMAGE_SELECTION;
  cur.layers.forEach((l) => l.el.classList.remove('selected'));
  els.stage.classList.add('image-selected');
  updateInspector();
}

function deselect() {
  cur.selectedId = null;
  cur.layers.forEach((l) => l.el.classList.remove('selected'));
  els.stage.classList.remove('image-selected');
  updateInspector();
}

function isImageSelected() {
  return cur.selectedId === IMAGE_SELECTION;
}

// 画像外をクリックしたら選択解除
els.stageWrapper.addEventListener('click', (e) => {
  if (e.target === els.stageWrapper || e.target === els.dropHint) {
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
}

function deleteCurrentImage() {
  if (!cur.imageLoaded) return;
  // 画像のみクリアし、テキストレイヤー(およびそれが依存する画像ネイティブ寸法)は保持する。
  // 同じサイズの画像を再度開けば元の位置で文字が復活する。
  cur.imageLoaded = false;
  cur.imageBlob = null;
  cur.imageName = '';
  cur.imageDataUrl = '';
  if (cur.selectedId === IMAGE_SELECTION) cur.selectedId = null;
  refreshPageView();
}

document.addEventListener('keydown', (e) => {
  if (isEditableTarget()) return;

  // Ctrl+←/→ でページ移動(選択状態に関係なく動作)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    switchToPage(state.currentPageIndex + (e.key === 'ArrowRight' ? 1 : -1));
    return;
  }

  if (isImageSelected()) {
    if (e.key === 'Delete') {
      e.preventDefault();
      deleteCurrentImage();
    }
    return;
  }

  const layer = getSelectedLayer();
  if (!layer) return;

  // Ctrl+↑/↓ で文字サイズを変更(スライダーと同じ 8〜120 の範囲)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
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
  const el = layer.el;
  // 画像ネイティブ座標 → 表示座標
  const displayWidth = els.baseImage.clientWidth;
  const scale = displayWidth / cur.imageNaturalWidth;
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

// 画像のリサイズ(ウィンドウサイズ変更等)に追随
window.addEventListener('resize', applyAllLayerStyles);
els.baseImage.addEventListener('load', applyAllLayerStyles);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(applyAllLayerStyles).catch(() => {});
}

// --- インスペクター ---

function updateInspector() {
  const layer = getSelectedLayer();
  if (!layer) {
    els.textProps.hidden = true;
    return;
  }
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

// --- PNG 書き出し ---
// Canvas に元画像とテキストを直接描画して、tainted canvas を避ける方式。

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
  if (!cur.imageLoaded) {
    previewCanvas.width = 0;
    previewCanvas.height = 0;
    return false;
  }
  previewCanvas.width = cur.imageNaturalWidth;
  previewCanvas.height = cur.imageNaturalHeight;
  previewCanvas.style.width = `${els.baseImage.clientWidth}px`;
  previewCanvas.style.height = `${els.baseImage.clientHeight}px`;
  return previewCanvas.width > 0 && previewCanvas.height > 0;
}

function renderTextPreview() {
  if (!syncPreviewCanvasSize()) return;
  const ctx = previewCanvas.getContext('2d');
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  cur.layers.forEach((layer) => {
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

const PROJECT_VERSION = 1;

function buildProjectData(page = cur) {
  return {
    version: PROJECT_VERSION,
    image: {
      width: page.imageNaturalWidth,
      height: page.imageNaturalHeight,
    },
    layers: page.layers.map((l) => ({
      text: l.text,
      x: l.x,
      y: l.y,
      font: l.font,
      size: l.size,
      orientation: l.orientation,
      lineHeight: l.lineHeight,
      kind: l.kind || 'text',
    })),
  };
}

function applyProjectData(data, targetPage = cur) {
  for (const l of targetPage.layers) l.el.remove();
  targetPage.layers = [];
  targetPage.selectedId = null;
  targetPage.nextId = 1;
  for (const l of data.layers) {
    addTextLayer({
      x: Number(l.x) || 0,
      y: Number(l.y) || 0,
      text: typeof l.text === 'string' ? l.text : '',
      font: l.font,
      size: typeof l.size === 'number' ? l.size : undefined,
      orientation: l.orientation,
      lineHeight: typeof l.lineHeight === 'number' ? l.lineHeight : undefined,
      kind: l.kind === 'monologue' ? 'monologue' : 'text',
    }, targetPage);
  }
  if (targetPage === cur) deselect();
}

function imageExtensionFromName(name) {
  const m = String(name || '').match(IMAGE_EXT_RE);
  return m ? m[0].toLowerCase() : '.png';
}

const BUNDLE_VERSION = 2;

async function buildBundleBlob() {
  if (typeof JSZip === 'undefined') throw new Error('JSZip ライブラリが読み込まれていません');
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify({ version: BUNDLE_VERSION, pages: state.pages.length }));
  state.pages.forEach((page, i) => {
    const idx = i + 1;
    if (page.imageBlob) {
      const ext = imageExtensionFromName(page.imageName);
      zip.file(`pages/${idx}/${BUNDLE_IMAGE_PREFIX}${ext}`, page.imageBlob);
    }
    zip.file(`pages/${idx}/${BUNDLE_TEXT_NAME}`, JSON.stringify(buildProjectData(page), null, 2));
    const memo = page.memo || '';
    if (memo.length > 0) {
      zip.file(`pages/${idx}/${BUNDLE_MEMO_NAME}`, memo);
    }
  });
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

els.saveProjectBtn.addEventListener('click', async () => {
  if (!anyPageHasImage()) return;
  els.saveProjectBtn.disabled = true;
  try {
    const blob = await buildBundleBlob();
    await saveBlob(blob, 'mojiuchi.mj', {
      description: 'MojiUchi プロジェクト',
      mimeType: 'application/zip',
      extension: BUNDLE_EXT,
    });
  } catch (err) {
    console.error(err);
    alert('保存に失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    els.saveProjectBtn.disabled = !anyPageHasImage();
  }
});

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

async function loadPageFromBundle(pageIndex, imageEntry, textEntry, memoEntry) {
  const page = state.pages[pageIndex];
  if (imageEntry) {
    const imgBlob = await imageEntry.async('blob');
    const name = imageEntry.name.split('/').pop();
    await loadImageBlobToPage(page, imgBlob, name);
  }
  if (textEntry) {
    try {
      const data = JSON.parse(await textEntry.async('string'));
      if (data && Array.isArray(data.layers)) {
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
}

async function loadBundleFile(file) {
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

  if (anyPageHasImage() && !confirm('現在のページ・テキスト・メモをすべて置き換えます。よろしいですか?')) return;

  // 新形式(pages/N/...)を検出
  const pageEntries = []; // index → { imageEntry, textEntry, memoEntry }
  for (let i = 0; i < MAX_PAGES; i++) {
    pageEntries.push({ imageEntry: null, textEntry: null, memoEntry: null });
  }
  let hasNewFormat = false;
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const m = path.match(/^pages\/(\d+)\/(.+)$/);
    if (!m) return;
    const idx = parseInt(m[1], 10) - 1;
    if (idx < 0 || idx >= MAX_PAGES) return;
    const name = m[2];
    if (IMAGE_EXT_RE.test(name)) {
      pageEntries[idx].imageEntry = entry;
      hasNewFormat = true;
    } else if (name === BUNDLE_TEXT_NAME) {
      pageEntries[idx].textEntry = entry;
      hasNewFormat = true;
    } else if (name === BUNDLE_MEMO_NAME) {
      pageEntries[idx].memoEntry = entry;
      hasNewFormat = true;
    }
  });

  // 旧形式(ルートに image.* と text.json)の場合はページ 1 として扱う
  if (!hasNewFormat) {
    let oldImage = null;
    zip.forEach((path, entry) => {
      if (entry.dir) return;
      if (path.includes('/')) return;
      if (!oldImage && IMAGE_EXT_RE.test(path)) oldImage = entry;
    });
    pageEntries[0] = {
      imageEntry: oldImage,
      textEntry: zip.file(BUNDLE_TEXT_NAME),
      memoEntry: null,
    };
  }

  // 旧形式のルート memo.txt はページ 1 のメモとして扱う(後方互換)
  const rootMemoEntry = zip.file(BUNDLE_MEMO_NAME);
  if (rootMemoEntry && !pageEntries[0].memoEntry) {
    pageEntries[0].memoEntry = rootMemoEntry;
  }

  resetAllPagesForBundle();

  for (let i = 0; i < MAX_PAGES; i++) {
    const { imageEntry, textEntry, memoEntry } = pageEntries[i];
    if (!imageEntry && !textEntry && !memoEntry) continue;
    try {
      await loadPageFromBundle(i, imageEntry, textEntry, memoEntry);
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

function loadProjectFile(file) {
  if (!cur.imageLoaded) {
    alert('テキストデータを読み込む前に、画像を開いてください。');
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    let data;
    try {
      data = JSON.parse(String(ev.target.result || ''));
    } catch {
      alert('JSON の読み込みに失敗しました。ファイル形式が正しいか確認してください。');
      return;
    }
    if (!data || !Array.isArray(data.layers)) {
      alert('テキストデータが見つかりません。');
      return;
    }
    if (cur.layers.length > 0 && !confirm('既存のテキストをすべて置き換えます。よろしいですか?')) return;
    if (data.image && (data.image.width !== cur.imageNaturalWidth || data.image.height !== cur.imageNaturalHeight)) {
      const ok = confirm(
        `画像サイズが保存時と異なります(保存: ${data.image.width}x${data.image.height} / 現在: ${cur.imageNaturalWidth}x${cur.imageNaturalHeight})。\n位置がずれる可能性があります。続行しますか?`
      );
      if (!ok) return;
    }
    applyProjectData(data);
  };
  reader.readAsText(file);
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
  if (!cur.imageLoaded) return;
  els.exportBtn.disabled = true;
  try {
    await ensureExportFontsReady();

    const canvas = document.createElement('canvas');
    canvas.width = cur.imageNaturalWidth;
    canvas.height = cur.imageNaturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(els.baseImage, 0, 0, canvas.width, canvas.height);
    cur.layers.forEach((layer) => drawTextLayer(ctx, layer));

    const pngBlob = await canvasToPngBlob(canvas);
    await saveBlob(pngBlob, `mojiuchi-p${state.currentPageIndex + 1}.png`, {
      description: 'PNG画像',
      mimeType: 'image/png',
      extension: '.png',
    });
  } catch (err) {
    console.error(err);
    alert('PNG 書き出しに失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    els.exportBtn.disabled = !cur.imageLoaded;
  }
});
