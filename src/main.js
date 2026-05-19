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

els.exportBtn.addEventListener('click', async () => {
  if (!state.imageLoaded) return;
  // フォント読み込み完了を待つ
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
  const canvas = document.createElement('canvas');
  canvas.width = state.imageNaturalWidth;
  canvas.height = state.imageNaturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(els.baseImage, 0, 0, canvas.width, canvas.height);

  state.layers.forEach((layer) => drawLayerOnCanvas(ctx, layer));

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mojiuchi.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
});

function drawLayerOnCanvas(ctx, layer) {
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'top';
  ctx.font = `${layer.size}px '${layer.font}', sans-serif`;

  // DOM 表示と一致させるため、要素の content box の位置を画像座標で取得する。
  // (CSS の padding / border / 行ボックス内の半行送りを反映)
  const containerRect = els.layerContainer.getBoundingClientRect();
  const scale = state.imageNaturalWidth / containerRect.width;
  const elRect = layer.el.getBoundingClientRect();
  const style = window.getComputedStyle(layer.el);
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padTop = parseFloat(style.paddingTop) || 0;
  const padRight = parseFloat(style.paddingRight) || 0;
  const bdLeft = parseFloat(style.borderLeftWidth) || 0;
  const bdTop = parseFloat(style.borderTopWidth) || 0;
  const bdRight = parseFloat(style.borderRightWidth) || 0;

  const contentLeft = ((elRect.left - containerRect.left) + bdLeft + padLeft) * scale;
  const contentTop = ((elRect.top - containerRect.top) + bdTop + padTop) * scale;
  const contentRight = ((elRect.right - containerRect.left) - bdRight - padRight) * scale;

  const lines = String(layer.text).split('\n');
  const halfLeading = layer.size * (layer.lineHeight - 1) / 2;
  const colGap = layer.size * layer.lineHeight;

  if (layer.orientation === 'vertical') {
    // writing-mode: vertical-rl では最初の列が content box の右端。
    // 列の line box 幅 = size × line-height、EM box はその中央に置かれるので
    // 最初の列のグリフ左端 = contentRight - halfLeading - 1em。
    // 列内のグリフ送りは 1em、列間は line-height。
    let colX = contentRight - halfLeading - layer.size;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      let y = contentTop;
      for (const ch of Array.from(line)) {
        ctx.fillText(ch, colX, y);
        y += layer.size;
      }
      colX -= colGap;
    }
  } else {
    // 横書き: line box の上端から halfLeading 下に EM box が来る。
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], contentLeft, contentTop + halfLeading + i * colGap);
    }
  }
  ctx.restore();
}
