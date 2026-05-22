# Gina — 漫画オーサリングツール

漫画やイラストの吹き出しに、ブラウザ上でテキストを置いて PNG として書き出せる軽量ツールです。
ビルドや依存ライブラリは不要で、`index.html` を開けばそのまま動きます。

## 特徴

- 画像のドラッグ&ドロップ、またはファイル選択で読み込み
- 画像上の任意の位置をクリックしてテキストレイヤーを追加
- 横書き / 縦書き、フォントサイズ、行間、フォントの切り替え
- レイヤーのドラッグ移動、ダブルクリックで本文を直接編集
- 編集結果を元画像と同じ解像度の PNG として書き出し
- 漫画用に定番の **源暎アンチック** (Pv6 / Nv6) を同梱

## デモ

GitHub Pages を有効化すると、ブラウザから直接利用できます。

```
https://<your-github-username>.github.io/<repository-name>/
```

リポジトリの **Settings → Pages → Build and deployment** で
*Source: Deploy from a branch*、*Branch: `main` / `/ (root)`* を指定してください。

## ローカルで使う

このリポジトリは純粋な静的ファイル構成です。

```bash
git clone https://github.com/<your-github-username>/<repository-name>.git
cd <repository-name>
```

そのまま `index.html` をダブルクリックでも動きますが、`file://` ではブラウザによって
ローカルフォントの読み込みが制限される場合があります。確実に動かすなら、ローカル HTTP サーバーで開いてください。

```bash
# Python が入っている場合
python -m http.server 8080
# → http://localhost:8080/ にアクセス
```

または、VS Code の Live Server 拡張など、任意の静的ファイルサーバーで OK です。

## 使い方

1. 上部の **画像を開く** ボタン、または中央の領域に画像をドラッグ&ドロップして読み込みます。
2. 画像の好きな位置をクリックすると、テキストレイヤーが追加されます。
3. 右側のインスペクターで本文・フォント・サイズ・行間・縦/横を変更できます。
4. テキストはドラッグで移動、ダブルクリックで本文を直接編集できます。
5. **PNG書き出し** ボタンで、元画像と同じ解像度の PNG を保存できます。

## ディレクトリ構成

```
.
├── index.html          # エントリポイント
├── src/
│   └── main.js         # アプリ本体 (バニラ JS)
├── styles/
│   └── style.css       # スタイル
└── assets/
    └── fonts/          # 同梱フォント (源暎アンチック v6)
        ├── GenEiAntiqueNv6-M.ttf
        └── GenEiAntiquePv6-M.ttf
```

## 動作要件

- 最近の Chrome / Edge / Firefox / Safari
- 画像処理はすべてブラウザ内で完結します。サーバーに画像はアップロードされません。

## ライセンス

- 本ソフトウェアのソースコード: [MIT License](./LICENSE)
- 同梱フォント **源暎アンチック Pv6 / Nv6**:
  [海星社 (Genjusha)](https://okoneya.jp/font/) による配布物です。
  ライセンスは配布元の規約に従います。詳細は [NOTICE.md](./NOTICE.md) を参照してください。

## クレジット

- フォント: **源暎アンチック Pv6 / Nv6** (海星社) — <https://okoneya.jp/font/genei-antique.html>
