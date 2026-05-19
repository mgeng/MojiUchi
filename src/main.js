// 漫画吹き出し文字入れツール

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
};

const state = {
  imageLoaded: false,
  imageNaturalWidth: 0,
  imageNaturalHeight: 0,
  layers: [], // { id, el, x, y, text, font, size, orientation, lineHeight }
  selectedId: null,
  nextId: 1,
};

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
      // 既存レイヤーをクリア
      state.layers.forEach((l) => l.el.remove());
      state.layers = [];
      state.selectedId = null;
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

function addTextLayer({ x, y, text = 'テキスト' }) {
  const id = state.nextId++;
  const layer = {
    id,
    text,
    x,
    y,
    font: els.propFont.value || 'GenEiAntiquePv6',
    size: 24,
    orientation: 'horizontal',
    lineHeight: 1.1,
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

function getSelectedLayer() {
  return state.layers.find((l) => l.id === state.selectedId) || null;
}

// --- スタイル反映 ---

function applyLayerStyle(layer) {
  const el = layer.el;
  // 画像ネイティブ座標 → 表示座標
  const displayWidth = els.baseImage.clientWidth;
  const scale = displayWidth / state.imageNaturalWidth;
  el.style.left = `${layer.x * scale}px`;
  el.style.top = `${layer.y * scale}px`;
  el.style.fontFamily = `'${layer.font}', sans-serif`;
  el.style.fontSize = `${layer.size * scale}px`;
  el.style.lineHeight = String(layer.lineHeight);
  el.classList.toggle('vertical', layer.orientation === 'vertical');
}

function applyAllLayerStyles() {
  state.layers.forEach(applyLayerStyle);
}

// 画像のリサイズ(ウィンドウサイズ変更等)に追随
window.addEventListener('resize', applyAllLayerStyles);
els.baseImage.addEventListener('load', applyAllLayerStyles);

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
});

els.propFont.addEventListener('change', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.font = els.propFont.value;
  applyLayerStyle(layer);
});

els.propSize.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.size = Number(els.propSize.value);
  els.propSizeValue.textContent = String(layer.size);
  applyLayerStyle(layer);
});

els.propOrientation.addEventListener('change', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.orientation = els.propOrientation.value;
  applyLayerStyle(layer);
});

els.propLineHeight.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.lineHeight = Number(els.propLineHeight.value);
  els.propLineHeightValue.textContent = String(layer.lineHeight);
  applyLayerStyle(layer);
});

els.propDelete.addEventListener('click', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.el.remove();
  state.layers = state.layers.filter((l) => l.id !== layer.id);
  deselect();
});

// --- PNG 書き出し ---
// SVG <foreignObject> に DOM をそのまま流し込み、ブラウザのネイティブな
// テキスト描画(縦書き / OpenType vert / 濁点合成)に任せる方式。

const FONT_FILES = {
  GenEiAntiquePv6: 'assets/fonts/GenEiAntiquePv6-M.ttf',
  GenEiAntiqueNv6: 'assets/fonts/GenEiAntiqueNv6-M.ttf',
};
const fontDataUrlCache = new Map();

async function getFontDataUrl(name) {
  if (fontDataUrlCache.has(name)) return fontDataUrlCache.get(name);
  const path = FONT_FILES[name];
  if (!path) return null;
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Failed to fetch font ${path}`);
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // 大きなフォントでも call stack を超えないよう分割して base64 化
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  const dataUrl = `data:font/ttf;base64,${btoa(binary)}`;
  fontDataUrlCache.set(name, dataUrl);
  return dataUrl;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layerToExportHtml(layer) {
  const cls = layer.orientation === 'vertical' ? 'tl v' : 'tl';
  const style = [
    `left:${layer.x}px`,
    `top:${layer.y}px`,
    `font-family:'${layer.font}',sans-serif`,
    `font-size:${layer.size}px`,
    `line-height:${layer.lineHeight}`,
  ].join(';');
  return `<div class="${cls}" style="${style}">${escapeHtml(layer.text)}</div>`;
}

async function buildExportSvg() {
  const usedFonts = new Set();
  for (const l of state.layers) {
    if (FONT_FILES[l.font]) usedFonts.add(l.font);
  }
  const fontFaceCss = (
    await Promise.all([...usedFonts].map(async (name) => {
      const url = await getFontDataUrl(name);
      return url
        ? `@font-face{font-family:'${name}';src:url(${url}) format('truetype');font-display:block;}`
        : '';
    }))
  ).join('');

  const W = state.imageNaturalWidth;
  const H = state.imageNaturalHeight;
  const layersHtml = state.layers.map(layerToExportHtml).join('');
  const css =
    `${fontFaceCss}` +
    `.tl{position:absolute;color:#000;white-space:pre-wrap;word-break:break-word;}` +
    `.tl.v{writing-mode:vertical-rl;text-orientation:upright;}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<foreignObject x="0" y="0" width="${W}" height="${H}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${W}px;height:${H}px;">` +
    `<style>${css}</style>${layersHtml}</div>` +
    `</foreignObject></svg>`
  );
}

els.exportBtn.addEventListener('click', async () => {
  if (!state.imageLoaded) return;
  els.exportBtn.disabled = true;
  let svgUrl = null;
  try {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
    const svgString = await buildExportSvg();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.src = svgUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = state.imageNaturalWidth;
    canvas.height = state.imageNaturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(els.baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    await new Promise((resolve) => {
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const url = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'mojiuchi.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        resolve();
      }, 'image/png');
    });
  } catch (err) {
    console.error(err);
    alert('PNG 書き出しに失敗しました: ' + (err && err.message ? err.message : err));
  } finally {
    if (svgUrl) URL.revokeObjectURL(svgUrl);
    els.exportBtn.disabled = false;
  }
});
