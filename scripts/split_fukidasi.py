"""
fukidasi.png (1536x1024, 2x5 グリッド) を吹き出しごとに分割して assets/bubbles/ に保存する。

各セル内の黒い線画を 8-連結で連結成分にグループ化し、小さなノイズ(セル境界付近の
1〜数px の孤立点)を捨ててから本体だけで bounding box を取る。
"""
from PIL import Image
from pathlib import Path
from collections import deque

SRC = Path(__file__).resolve().parent.parent / 'fukidasi.png'
OUT_DIR = Path(__file__).resolve().parent.parent / 'assets' / 'bubbles'

COLS = 5
ROWS = 2
PADDING = 8           # 切り出し後のフチに残す余白(px)
INK_THRESHOLD = 180   # この明度より暗い & 不透明な画素を「線」とみなす
MIN_COMPONENT = 30    # この未満のサイズの連結成分はノイズとして無視

NAMES = [
    'bubble-01-oval',
    'bubble-02-oval-thin',
    'bubble-03-spiky',
    'bubble-04-spiky-angular',
    'bubble-05-dashed-oval',
    'bubble-06-cloud',
    'bubble-07-rect',
    'bubble-08-poly',
    'bubble-09-poly-marked',
    'bubble-10-dashed-poly',
]


def build_ink_mask(img: Image.Image):
    """1=ink, 0=else の二値マスクを返す(行優先のリスト)。"""
    w, h = img.size
    px = img.load()
    mask = [[0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and (r + g + b) / 3 < INK_THRESHOLD:
                mask[y][x] = 1
    return mask


def bbox_of_significant_components(mask, w, h, min_size):
    """8-連結の連結成分のうちサイズ >= min_size のものすべてを覆う bbox を返す。"""
    visited = [[False] * w for _ in range(h)]
    min_x, min_y, max_x, max_y = w, h, -1, -1
    neighbors = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1))
    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0][x0] or visited[y0][x0]:
                continue
            # BFS で連結成分を集める
            queue = deque([(x0, y0)])
            visited[y0][x0] = True
            comp = []
            while queue:
                x, y = queue.popleft()
                comp.append((x, y))
                for dx, dy in neighbors:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not visited[ny][nx]:
                        visited[ny][nx] = True
                        queue.append((nx, ny))
            if len(comp) < min_size:
                continue
            for x, y in comp:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    if max_x < 0:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert('RGBA')
    W, H = src.size
    cell_w = W // COLS
    cell_h = H // ROWS

    idx = 0
    for r in range(ROWS):
        for c in range(COLS):
            cell = src.crop((c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h))
            mask = build_ink_mask(cell)
            bbox = bbox_of_significant_components(mask, cell.width, cell.height, MIN_COMPONENT)
            if bbox is None:
                print(f'[skip] cell r{r} c{c}: no significant ink')
                idx += 1
                continue
            x0, y0, x1, y1 = bbox
            x0 = max(0, x0 - PADDING)
            y0 = max(0, y0 - PADDING)
            x1 = min(cell.width, x1 + PADDING)
            y1 = min(cell.height, y1 + PADDING)
            tight = cell.crop((x0, y0, x1, y1))
            name = NAMES[idx]
            out_path = OUT_DIR / f'{name}.png'
            tight.save(out_path)
            print(f'[ok] {name}.png  {tight.size}')
            idx += 1


if __name__ == '__main__':
    main()
