# soū nail atelier — Tokyo Nail Try-on Studio & Private Salon

React 18 + Vite 6 + TypeScript + Tailwind CSS v4 + GSAP (`ScrollTrigger`) + Lenis.  
双语 **日本語 (`JP`) / English (`EN`)**，全站统一使用日元（`¥6,000–¥9,000` 区间）与日本本土预约渠道（LINE 官方账号 + Instagram DM）。

- **Online Preview**: https://1412845026z-jpg.github.io/atelier-fang-nail/
- **Repository**: https://github.com/1412845026z-jpg/atelier-fang-nail

---

## 一、核心架构与亮点

1. **首屏无跳变揭纸 + 自动上色 → 无缝接入试着室**（`src/sections/HeroTryOnSection.tsx`）
   - 磨砂和纸由代码绘制（半透白 + `backdrop-filter: blur` + 纸张纹理 + 右下角卷角光影），与素甲手部底图共用同一坐标系，滚动时对角线揭开后五指按 0.06s 间隔依次自动刷上招牌款 **霧青フレンチ**，随后直接衔接 **ネイル試着室（Nail Try-on Studio）**。
2. **ネイル試着室（Nail Try-on Studio）**（`src/components/NailSvgLayer.tsx` + `src/utils/nailGeometry.ts`）
   - **像素级锁定对齐**：手部照片与 5 枚程序化 SVG 指甲放在同一个 `<svg viewBox="0 0 1376 768" preserveAspectRatio="xMidYMid slice">` 中，任何屏幕宽度与长宽比下都不会偏移。
   - **7 种甲型 × 3 档长度 × 16 色色样卡 × 6 种真实光学质感**：
     - 甲型：`スクエア / スクエアオフ / ラウンド / オーバル / アーモンド / バレリーナ / スティレット`（统一 6 段三次贝塞尔拓扑，切换形状或 `S / M / L` 长度时 0.5s 平滑插值生长）。
     - 质感：`グロス`（纵向高光+亮点）、`マット`（4% 细噪点无锐高光）、`シアー`（半透果冻渐层）、`パール`（低透明虹彩）、`クローム`（高对比反光带）、`マグネット`（随鼠标/陀螺仪/静止微漂移实时流动的猫眼闪粉光带，60fps 零 React 重渲染）。
     - 艺术层：`フレンチ`（宽度/弧度/颜色可调，支持 micro French）、`細ライン`（4 种墨线线稿）、`真珠 / スタッズ`（1–3 颗）、单指ワンポイント编辑、8 款作品一键预设、`おまかせ`（仅从美甲师精选搭配中抽取）、素甲/试着左右分割对比、`自分の手で試す`（上传自己的手照片，每指点甘皮与爪先 2 下完成定位）。
3. **试戴 → 咨询 / 预约 / 分享卡片闭环**（`src/utils/designCodec.ts` + `src/utils/exportDesignCard.ts`）
   - 状态实时编码进网址 `?d=<base64url>`，打开链接直接进入试着室并还原该款式。
   - 实时计算目安菜单、时长与日元区间（`¥6,000–¥9,000`），附 `※最終料金はカウンセリングで確定`。
   - **このデザインで予約**：带试戴设计缩略卡跳转至预约区并自动匹配对应菜单；未点击时预约区服务/日期/时段默认均为 `未選択`。
   - **まず相談する**：不选日期，直接通过 LINE 预填消息或 Instagram DM（先自动复制再打开并提示粘贴发送）发给美甲师。
   - **画像を保存**：导出 1080×1350 竖版 Instagram 标本设计卡 PNG。
4. **动态 5 层结构分解**（`src/sections/ExplodedNail.tsx`）
   - 复用试着室同一套指甲渲染与几何引擎，直接分解用户在试着室选中的当前设计。

---

## 二、校准模式（`?calibrate`）用法

当你更换新的素甲手部底图（`public/media/bare-hand-base.webp`）时，无需手动猜测坐标：

1. 在浏览器打开：`http://localhost:5173/?calibrate`（或线上地址后加 `?calibrate`）。
2. 每根手指会显示 3 个可拖动控制点：
   - **深色圆点**：甘皮（甲根中心 `cx, cy`）
   - **雾蓝圆点**：指尖方向与自然甲长（`angleDeg, baseLength`）
   - **白色方块**：甲宽（`width`）
3. 拖动对齐 5 根指甲后，点击右下角黑色面板的 **`COPY JSON`**，直接粘贴覆盖 `src/config.ts` 中的 `fingerCalibrations` 即可。

---

## 三、素材清单与替换建议（`public/media/`）

所有图片均已预转为 **AVIF + WebP 多尺寸响应式资源**，大幅降低移动端 4G 加载体积；并在 `src/config.ts` 中通过 `hasHeroVideo: false` / `hasFinaleVideo: false` 避免产生 404 请求。

| 文件路径 | 说明 | 替换建议 |
|---|---|---|
| `public/media/bare-hand-base.webp` (+ `.avif`, `-880.*`) | 首屏与试着室共用的 16:9 俯拍素甲手部底图 | 若替换为实拍素甲图，随后打开 `?calibrate` 对齐 5 指坐标 |
| `public/media/works/01.webp` ~ `08.webp` (+ `-480.*`, `.avif`) | 作品区 8 组 3:4 竖版作品图 | **强烈建议上线前换成美甲师本人真实作品实拍**（同光源同墙面、统一色温），并在 `src/config.ts` 同步对应 `glowColor` 与 `preset` |
| `public/media/services/01.webp` ~ `04.webp` (+ `-480.*`, `.avif`) | 服务区 4 张工艺/工具/调色/塑形特写（与作品图完全独立） | 可替换为真实工作室台面、工具与操作特写 |
| `public/media/statement.webp` (+ `-440.webp`, `.avif`) | 深色跑马灯区透明底手部抠图 | 建议保留完整手腕贴底构图 |
| `public/media/og-card.jpg` | 1200×630 社交分享 OG / Twitter 卡片图 | — |
| `public/media/hero.mp4` / `finale.mp4`（可选） | 如需启用视频滚动序列，放入文件后将 `src/config.ts` 中 `hasHeroVideo` / `hasFinaleVideo` 设为 `true`（`hero.mp4` 尾帧需与素甲底图一致） | — |

---

## 四、店铺信息与价格修改（全部集中在 `src/config.ts`）

- 品牌与地址：`brandName`、`city`、`contact.address`、`contact.mapsUrl`、`contact.hours`
- 预约渠道：`contact.lineOfficialId`、`contact.instagramHandle`
- 价格与货币：`currencySymbol`（全站唯一货币 `¥`）、`services[].priceYen`（`¥6,000–¥9,000`）、`pricingRules`
- 试着室参数：`fingerCalibrations`、`palette`（16 色色样卡）、`works[].preset`、`omakaseLooks`

---

## 五、本地运行与构建

```bash
npm install
npm run dev      # 开发预览（可加 ?calibrate 进入五指校准模式）
npm run build    # TypeScript 类型检查 + 生产构建
npm run preview  # 本地预览生产包
```
