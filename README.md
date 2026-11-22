# soū nail atelier — 指先の化粧台（v3）

東京・目黒区青葉台の完全予約制プライベートネイルアトリエ **soū nail atelier** のインタラクティブ 3D Web サイトです。
「花びらが、指先に。」をコンセプトに、**花苞の開花 → 3D 化粧台トレイ → 3D ネイルチップ見本 → カウンセリングカード**を一つのやわらかな体験としてつないでいます。

- **Live Preview (GitHub Pages)**: https://1412845026z-jpg.github.io/atelier-fang-nail/
- **Mask Calibration Mode**: https://1412845026z-jpg.github.io/atelier-fang-nail/?calibrate

---

## 主な体験構成

1. **01 首页花苞 (`#hero`)**
   - 14 枚の曲面 3D ジェルチップで構成された花苞をマウス／指でドラッグして開花（`Enter` キー対応）。
   - 最後の 5 枚の花びらが 5 本の爪座標へ着地し、素爪から本物のジェル写真へ溶け込みます。
   - 2 回目以降の訪問では `localStorage` により完成状態を即時表示し、右上の「もう一度」から再体験できます。
2. **02 指先の化粧台 (`#vanity`)**
   - 上部に固定された手元写真、下部に 12 本の 3D ガラス甲油ボトルが並ぶ鏡面円形トレイ。
   - ドラッグ慣性＋スナップ（または `← / →` キー）でボトルを回すと、5 本の爪が甘皮から先端へ 60ms ずれて塗り替わります。
   - マグネット／オーロラ／ミラー／ラメは、爪マスク内だけでポインターや端末傾きに反応して光がゆらぎます。
   - 「このネイルで相談」「画像を保存（1080×1350 PNG カード）」「詳しく見る」の 3 つのみ配置。
3. **03 ネイルチップ見本 (`#tips`)**
   - 化粧台と 1 対 1 で対応する全 12 デザインの 3D 曲面ジェルチップリング。
   - タップで中央へズームし、ゆっくり回転しながらジェルの艶を確認。「このデザインで相談」「化粧台で試す」「一覧で見る（SEO/GEO 対応のテキストメニュー表）」を装備。
4. **04 サロンについて (`#salon`)**
   - 手元のみ・顔出しなしの静かなエディトリアル紹介。
5. **05 カウンセリングカード (`#counseling`)**
   - クリーム紙＋シャンパンゴールド 1px 罫線の一問一答カード（紙めくり `rotateY` トランジション）。
   - 化粧台／チップ見本で選んだデザインを自動連携（「相談して決めたい」選択可）。日本の主流ショート〜ミディアム 5 シェイプ＋長さスライダー、お悩み、希望日を入力し、デザイン URL (`?d=...`) 付きの LINE / Instagram DM 相談文面を作成します。
6. **フッター**
   - アクセス、営業時間、占位 FAQ アコーディオン（`NailSalon` + `FAQPage` JSON-LD 出力）。

---

## 店舗・メニュー設定の差し替え

ブランド名、住所、営業時間、LINE ID (`@sou.aobadai`)、Instagram (`sou.nail.tokyo`)、12 デザイン、料金（`¥6,000–¥9,000`）、占位 FAQ はすべて **`src/config.ts`** に集約されています。

- すべての展示画像には「イメージ」表記を付与しています。
- 実写ベースへ差し替える場合は `public/media/hands/` と `public/media/tips/` を置き換え、`?calibrate` で 5 本の爪マスク座標を調整して JSON を `src/config.ts` の `fingerCalibrations` へ反映してください。

---

## 開発・ビルド

```bash
npm install
npm run dev      # ローカル開発 (http://localhost:5173)
npm run build    # 型チェック + 本番ビルド (dist/)
npm run preview  # ビルド確認 (http://localhost:4173)
```

- **技術スタック**: React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · Three.js · `@react-three/fiber` · `@react-three/drei` · `@use-gesture/react` · Lenis
- **パフォーマンス**: 3D キャンバスはすべて `React.lazy`＋近接ビューポート遅延ロード、モバイル DPR 上限 `1.5`、AVIF / WebP 最適化、WebGL 非対応／`prefers-reduced-motion` 時は 2D へ自動フォールバック。
