"""
fukidasi_horizontal.png (1536x1024) を横書き用吹き出しごとに分割して
assets/bubbles/horizontal/ に保存する。

レイアウトは 4 段(上から順に 5/3/5/3 個)。破線吹き出しは線が連続していない
ので連結成分が複数に分かれる。そのため:
  1. 連結成分を全部抽出 (小さなノイズは除外)
  2. 縦方向に 4 段にバンディング
  3. 各段内で X 区間が近いものをまとめて 1 個の吹き出しとみなす
  4. まとまった成分群の bounding box で切り抜く
"""
from PIL import Image
from pathlib import Path
from collections import deque

SRC = Path(__file__).resolve().parent.parent / 'fukidasi_horizontal.png'
OUT_DIR = Path(__file__).resolve().parent.parent / 'assets' / 'bubbles' / 'horizontal'

PADDING = 8
INK_THRESHOLD = 180
MIN_COMPONENT = 80   # ノイズ判定。横書き画像はセル境界線が無いのでやや緩めに
CLUSTER_GAP = 30     # 同じ吹き出しとみなす X 方向の最大ギャップ

# 段ごとの (Y_min, Y_max, 個数, 名前リスト)。Y は事前解析(連結成分の重心位置)で決定。
ROWS = [
    (0,   335,  5, [
        'bubble-01-oval',
        'bubble-02-oval-thin',
        'bubble-03-spiky',
        'bubble-04-spiky-angular',
        'bubble-05-dashed-oval',
    ]),
    (335, 569,  3, [
        'bubble-11-long-oval',
        'bubble-12-long-oval-2',
        'bubble-13-long-oval-3',
    ]),
    (569, 820,  5, [
        'bubble-06-cloud',
        'bubble-07-rect',
        'bubble-08-poly',
        'bubble-09-poly-marked',
        'bubble-10-dashed-poly',
    ]),
    (820, 1024, 3, [
        'bubble-14-long-oval-tail',
        'bubble-15-long-rect',
        'bubble-16-long-rect-dashed',
    ]),
]


def build_ink_mask(img):
    w, h = img.size
    px = img.load()
    mask = [[0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and (r + g + b) / 3 < INK_THRESHOLD:
                mask[y][x] = 1
    return mask


def find_components(mask, w, h, min_size):
    """min_size 以上の連結成分の bbox とサイズを返す。"""
    visited = [[False] * w for _ in range(h)]
    neighbors = ((1, 0), (-1, 0), (0, 1), (0, -1),
                 (1, 1), (-1, 1), (1, -1), (-1, -1))
    comps = []
    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0][x0] or visited[y0][x0]:
                continue
            q = deque([(x0, y0)])
            visited[y0][x0] = True
            pts = []
            while q:
                x, y = q.popleft()
                pts.append((x, y))
                for dx, dy in neighbors:
                    nx, ny = x + dx, y + dy
                    if (0 <= nx < w and 0 <= ny < h
                            and mask[ny][nx] and not visited[ny][nx]):
                        visited[ny][nx] = True
                        q.append((nx, ny))
            if len(pts) < min_size:
                continue
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            comps.append({
                'min_x': min(xs), 'min_y': min(ys),
                'max_x': max(xs), 'max_y': max(ys),
                'size': len(pts),
            })
    return comps


def cluster_by_x(comps, gap):
    """min_x 順にスキャンし、現在のクラスタの max_x + gap 以内に来る成分を吸収。"""
    if not comps:
        return []
    sc = sorted(comps, key=lambda c: c['min_x'])
    clusters = [[sc[0]]]
    cur_max_x = sc[0]['max_x']
    for c in sc[1:]:
        if c['min_x'] <= cur_max_x + gap:
            clusters[-1].append(c)
            cur_max_x = max(cur_max_x, c['max_x'])
        else:
            clusters.append([c])
            cur_max_x = c['max_x']
    return clusters


def union_bbox(cluster):
    return (
        min(c['min_x'] for c in cluster),
        min(c['min_y'] for c in cluster),
        max(c['max_x'] for c in cluster) + 1,
        max(c['max_y'] for c in cluster) + 1,
    )


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert('RGBA')
    W, H = src.size
    mask = build_ink_mask(src)
    all_comps = find_components(mask, W, H, MIN_COMPONENT)
    print(f'detected {len(all_comps)} large components')

    for y0, y1, expected, names in ROWS:
        # 重心 Y がこの段に入る成分を抽出
        row_comps = [c for c in all_comps
                     if y0 <= (c['min_y'] + c['max_y']) / 2 < y1]
        clusters = cluster_by_x(row_comps, CLUSTER_GAP)
        if len(clusters) != expected:
            print(f'[warn] row y={y0}-{y1}: expected {expected} '
                  f'bubbles but got {len(clusters)}')
        for cluster, name in zip(clusters, names):
            x0, yy0, x1, yy1 = union_bbox(cluster)
            x0 = max(0, x0 - PADDING)
            yy0 = max(0, yy0 - PADDING)
            x1 = min(W, x1 + PADDING)
            yy1 = min(H, yy1 + PADDING)
            tight = src.crop((x0, yy0, x1, yy1))
            out_path = OUT_DIR / f'{name}.png'
            tight.save(out_path)
            print(f'[ok] {name}.png  {tight.size}')


if __name__ == '__main__':
    main()
