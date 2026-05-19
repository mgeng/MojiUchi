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
  memoClose: document.getElementById('memoClose'),
  memoText: document.getElementById('memoText'),
  memoFileInput: document.getElementById('memoFileInput'),
  saveProjectBtn: document.getElementById('saveProjectBtn'),
  loadProjectBtn: document.getElementById('loadProjectBtn'),
  loadProjectInput: document.getElementById('loadProjectInput'),
};

const state = {
  imageLoaded: false,
  imageNaturalWidth: 0,
  imageNaturalHeight: 0,
  layers: [], // { id, el, x, y, text, font, size, orientation, lineHeight }
  selectedId: null,
  nextId: 1,
};

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
  if (file) loadImageFile(file);
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
  if (file && file.type.startsWith('image/')) loadImageFile(file);
});

function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    els.baseImage.onload = () => {
      state.imageLoaded = true;
      state.imageNaturalWidth = els.baseImage.naturalWidth;
      state.imageNaturalHeight = els.baseImage.naturalHeight;
      els.dropHint.hidden = true;
      els.stage.hidden = false;
      els.exportBtn.disabled = false;
      els.saveProjectBtn.disabled = false;
      els.loadProjectBtn.disabled = false;
      // 既存レイヤーをクリア
      state.layers.forEach((l) => l.el.remove());
      state.layers = [];
      state.selectedId = null;
      renderTextPreview();
      updateInspector();
    };
    els.baseImage.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// --- テキスト追加(ステージクリック) ---

els.layerContainer.addEventListener('click', (e) => {
  // 子テキストレイヤーがクリックされたときは新規追加しない
  if (e.target !== els.layerContainer) return;
  const rect = els.layerContainer.getBoundingClientRect();
  // 表示座標 → 画像ネイティブ座標
  const scaleX = state.imageNaturalWidth / rect.width;
  const scaleY = state.imageNaturalHeight / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  addTextLayer({ x, y });
});

function addTextLayer({ x, y, text = 'テキスト', font, size, orientation, lineHeight }) {
  const id = state.nextId++;
  const layer = {
    id,
    text,
    x,
    y,
    font: font || els.propFont.value || 'GenEiAntiquePv6',
    size: size ?? 24,
    orientation: orientation || 'horizontal',
    lineHeight: lineHeight ?? 1.1,
    el: null,
  };
  const el = document.createElement('div');
  el.className = 'text-layer';
  el.dataset.id = String(id);
  el.textContent = text;
  els.layerContainer.appendChild(el);
  layer.el = el;
  state.layers.push(layer);

  attachLayerHandlers(layer);
  applyLayerStyle(layer);
  renderTextPreview();

  selectLayer(id);
}

// --- レイヤーのドラッグ・選択・編集 ---

function attachLayerHandlers(layer) {
  const el = layer.el;

  el.addEventListener('mousedown', (e) => {
    if (el.classList.contains('editing')) return;
    e.stopPropagation();
    selectLayer(layer.id);

    const rect = els.layerContainer.getBoundingClientRect();
    const scaleX = state.imageNaturalWidth / rect.width;
    const scaleY = state.imageNaturalHeight / rect.height;
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
  state.selectedId = id;
  state.layers.forEach((l) => {
    l.el.classList.toggle('selected', l.id === id);
  });
  updateInspector();
}

function deselect() {
  state.selectedId = null;
  state.layers.forEach((l) => l.el.classList.remove('selected'));
  updateInspector();
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
  state.layers = state.layers.filter((l) => l.id !== layer.id);
  renderTextPreview();
  deselect();
}

document.addEventListener('keydown', (e) => {
  const layer = getSelectedLayer();
  if (!layer) return;
  if (isEditableTarget()) return;

  const delta = ARROW_DELTAS[e.key];
  if (delta) {
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
  return state.layers.find((l) => l.id === state.selectedId) || null;
}

// --- スタイル反映 ---

function applyLayerStyle(layer) {
  const el = layer.el;
  // 画像ネイティブ座標 → 表示座標
  const displayWidth = els.baseImage.clientWidth;
  const scale = displayWidth / state.imageNaturalWidth;
  const bounds = measureTextLayerBounds(layer);
  el.style.left = `${(layer.x + bounds.x) * scale}px`;
  el.style.top = `${(layer.y + bounds.y) * scale}px`;
  el.style.width = `${Math.max(bounds.width * scale, layer.size * scale)}px`;
  el.style.height = `${Math.max(bounds.height * scale, layer.size * scale)}px`;
  el.style.fontFamily = `'${layer.font}', sans-serif`;
  el.style.fontSize = `${layer.size * scale}px`;
  el.style.lineHeight = String(layer.lineHeight);
  el.classList.toggle('vertical', layer.orientation === 'vertical');
}

function applyAllLayerStyles() {
  state.layers.forEach(applyLayerStyle);
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
  for (const layer of state.layers) {
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

function syncPreviewCanvasSize() {
  if (!state.imageLoaded) {
    previewCanvas.width = 0;
    previewCanvas.height = 0;
    return false;
  }
  previewCanvas.width = state.imageNaturalWidth;
  previewCanvas.height = state.imageNaturalHeight;
  previewCanvas.style.width = `${els.baseImage.clientWidth}px`;
  previewCanvas.style.height = `${els.baseImage.clientHeight}px`;
  return previewCanvas.width > 0 && previewCanvas.height > 0;
}

function renderTextPreview() {
  if (!syncPreviewCanvasSize()) return;
  const ctx = previewCanvas.getContext('2d');
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  state.layers.forEach((layer) => {
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

function drawTextLayer(ctx, layer) {
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

// --- プロジェクト保存・読み込み(テキストレイヤー) ---

const PROJECT_VERSION = 1;

function buildProjectData() {
  return {
    version: PROJECT_VERSION,
    image: {
      width: state.imageNaturalWidth,
      height: state.imageNaturalHeight,
    },
    layers: state.layers.map((l) => ({
      text: l.text,
      x: l.x,
      y: l.y,
      font: l.font,
      size: l.size,
      orientation: l.orientation,
      lineHeight: l.lineHeight,
    })),
  };
}

function applyProjectData(data) {
  state.layers.forEach((l) => l.el.remove());
  state.layers = [];
  state.selectedId = null;
  state.nextId = 1;
  for (const l of data.layers) {
    addTextLayer({
      x: Number(l.x) || 0,
      y: Number(l.y) || 0,
      text: typeof l.text === 'string' ? l.text : '',
      font: l.font,
      size: typeof l.size === 'number' ? l.size : undefined,
      orientation: l.orientation,
      lineHeight: typeof l.lineHeight === 'number' ? l.lineHeight : undefined,
    });
  }
  deselect();
}

els.saveProjectBtn.addEventListener('click', () => {
  if (!state.imageLoaded) return;
  const json = JSON.stringify(buildProjectData(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, 'mojiuchi-text.json');
});

els.loadProjectBtn.addEventListener('click', () => {
  if (!state.imageLoaded) return;
  els.loadProjectInput.click();
});

els.loadProjectInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  els.loadProjectInput.value = '';
  if (!file) return;
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
    if (state.layers.length > 0 && !confirm('既存のテキストをすべて置き換えます。よろしいですか?')) return;
    if (data.image && (data.image.width !== state.imageNaturalWidth || data.image.height !== state.imageNaturalHeight)) {
      const ok = confirm(
        `画像サイズが保存時と異なります(保存: ${data.image.width}x${data.image.height} / 現在: ${state.imageNaturalWidth}x${state.imageNaturalHeight})。\n位置がずれる可能性があります。続行しますか?`
      );
      if (!ok) return;
    }
    applyProjectData(data);
  };
  reader.readAsText(file);
});

// --- メモパネル(付箋風フローティング) ---

els.memoToggle.addEventListener('click', () => {
  els.memoPanel.hidden = !els.memoPanel.hidden;
});
els.memoClose.addEventListener('click', () => {
  els.memoPanel.hidden = true;
});

els.memoFileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  els.memoFileInput.value = '';
  if (!file) return;
  if (els.memoText.value.trim() && !confirm('現在のメモを上書きします。よろしいですか?')) return;
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
    els.memoText.value = text;
  };
  reader.readAsArrayBuffer(file);
});

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
  if (!state.imageLoaded) return;
  els.exportBtn.disabled = true;
  try {
    await ensureExportFontsReady();

    const canvas = document.createElement('canvas');
    canvas.width = state.imageNaturalWidth;
    canvas.height = state.imageNaturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(els.baseImage, 0, 0, canvas.width, canvas.height);
    state.layers.forEach((layer) => drawTextLayer(ctx, layer));

    const pngBlob = await canvasToPngBlob(canvas);
    downloadBlob(pngBlob, 'mojiuchi.png');
  } catch (err) {
    console.error(err);
    alert('PNG 書き出しに失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    els.exportBtn.disabled = false;
  }
});
