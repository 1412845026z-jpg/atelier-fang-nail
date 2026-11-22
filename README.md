# atelier fang — Independent Nail Artist Scrollytelling & Booking Site

面向独立美甲师个人预约转化的**沉浸式滚动叙事（Scrollytelling）**纯前端网站。  
放弃传统卡片堆叠与说明文字，以**日语（JP）/ 英语（EN）**极简视觉交互引导访客直接完成预约。

- **Live Preview (GitHub Pages)**: https://1412845026z-jpg.github.io/atelier-fang-nail/
- **Repository**: https://github.com/1412845026z-jpg/atelier-fang-nail

---

## 一、设计理念与核心特性

- **100% 原创开场叙事「揭纸见甲」**：俯拍洞石台面上，半透明磨砂和纸覆于女性手背之上；随着滚动条下移，磨砂纸柔和褪开，显露自然晨光下的微法式美甲（不使用任何衍生/雷同的袖口丝带创意）。
- **零说明文，纯视觉交互引导**：全站移除冗长介绍与文案堆砌，通过动态滚动细线、水平滑动圆点、时长比例条、斜线禁用日历与可交互玻璃层片直接传达信息。
- **克制画廊美学**：
  - 全站严格限定 5 色：`#F2EEE8` 燕麦白底 / `#241E1A` 深可可字 / `#8A8178` 次要灰 / `#A7C1D9` 雾蓝点缀（≤5% 面积）/ `#1C1917` 深色段。
  - 字体组合：`Instrument Serif` + `Shippori Mincho`（衬线大标题）、`Geist` + `Noto Sans JP`（正文）、`Geist Mono`（编号与极小标签）。
  - 全站 3% 胶片颗粒叠加、1px 细线分隔、零阴影、零毛玻璃、桌面端延迟跟随自定义光标（作品悬停 `View` / 拖拽区 `Drag`）。
- **双语切换**：右上角即时切换 **JP / EN**。

---

## 二、页面 8 大结构（自上而下）

| 序号 | 模块 | 源码文件 | 交互与动效 |
|---|---|---|---|
| 01 | **开场 · 滚动序列** | `src/sections/HeroVeil.tsx` | 400vh 钉住全屏 `<canvas>`；`atelier fang` 字距拉开淡出；原创磨砂和纸随滚动揭开；末段遮罩滑出预约按钮。 |
| 02 | **作品 · 3D 弧形悬浮轮播** | `src/sections/WorksCoverflow.tsx` | 8 组 3:4 自然日光实拍沿 CSS 3D 弧线排布（`perspective: 1400px`），底部同色柔光平滑过渡；支持拖拽 / 触控板横滑 / 键盘 `← →` / 点击放大详情；手机端自动切为横滑。 |
| 03 | **服务 · 钉住四屏擦除** | `src/sections/ServicesPinned.tsx` | 4 屏钉住；右侧 55% 大图由下往上 `clip-path` 擦出（旧图 `1 → 1.08` 放大），左侧展示编号、名称、价格与时长比例条，最右竖排圆点可点击跳转。 |
| 04 | **五层结构 · 3D 交互分解** | `src/sections/ExplodedNail.tsx` | 300vh 钉住；纯 CSS 3D 等距 5 层半透玻璃甲片随滚动沿 Z 轴展开并绘制 1px SVG 牵引线，支持悬停/点击单层抽出高亮，滚至末尾重新合为一片。 |
| 05 | **深色宣言 · 速度跑马灯** | `src/sections/StatementDark.tsx` | `#1C1917` 深色段；背景 22vw 衬线跑马灯随 Lenis 滚动速度加速并在回滚时反向；前景透明抠图贴底随滚动轻微视差与偏转；下方 3 条细线分隔的服务原则。 |
| 06 | **可选结尾转场** | `src/sections/FinaleSequence.tsx` | 复用 `<ScrollSequence>`；当 `public/media/finale.mp4` 不存在时自动跳过，不留白、不报错。 |
| 07 | **页内 4 步预约** | `src/sections/BookingSection.tsx` | 顶部 1px 进度细线 + 水平滑动 4 步：选服务（雾蓝左竖线）→ 21 天极简月历（休息日斜线禁用）→ 选时段 → 填信息并一键跳转 WhatsApp / Instagram DM / 复制预约文本。 |
| 08 | **页脚** | `src/sections/FooterSection.tsx` | 地址（Maps 链接）、营业时间、Instagram 账号，以及底部铺满屏宽、随滚动自下而上浮现的品牌大字。 |

---

## 三、核心引擎：`ScrollSequence` 工作原理

位于 `src/components/ScrollSequence.tsx`，统一支撑 `HeroVeil` 与 `FinaleSequence`：

1. **双源加载优先级**：优先检测帧文件夹（`public/media/hero/0001.webp` …）；不存在则检测 `public/media/hero.mp4`，用隐藏 `<video muted playsinline preload="auto">` 逐帧 `seeked` 抽帧到离屏 Canvas，通过 `toBlob`（优先 `image/webp` 0.85，降级 `image/jpeg` 0.85）预解码缓存（桌面端 120 帧 / ≤1600px，手机端 72 帧 / ≤900px）。
2. **零卡顿绘制**：`<canvas>` 仅在挂载与窗口 `resize` 时重设尺寸（`dpr ≤ 2`）；GSAP `ScrollTrigger` 同步 Lenis（`lerp: 0.1`），在 `requestAnimationFrame` 中做 `0.15` 阻尼追帧，**仅在帧号变化时重绘**。
3. **无视频预览与拖拽体验**：未放入 `hero.mp4` 时自动运行原创首尾帧柔和揭纸动画；随时将任意本地 `.mp4` 拖到首屏画面上，即可通过 `URL.createObjectURL` 立即抽帧并切为视频滚动播放。
4. **无障碍降级**：开启系统 `prefers-reduced-motion` 时直接呈现最终帧与内容，关闭重度滚动动画。

---

## 四、技术栈与目录结构

- **技术栈**：React 18 + Vite 6 + TypeScript + Tailwind CSS v4 + GSAP (`ScrollTrigger`) + Lenis（纯前端，零后端，零数据库）。

```text
├── index.html
├── vite.config.ts
├── public/media/
│   ├── veo-keyframes/
│   │   ├── 01-hero-first-frame.jpg   # 原创「揭纸见甲」首帧（16:9）
│   │   └── 02-hero-last-frame.jpg    # 原创「揭纸见甲」尾帧（16:9）
│   ├── works/01.jpg ~ 08.jpg         # 3:4 自然光美甲作品实拍
│   ├── services/01.jpg ~ 04.jpg      # 服务配图
│   └── statement.png                 # 深色段透明底手部抠图
└── src/
    ├── config.ts                     # 所有可改文案、价格、休息日、联系方式、配色
    ├── App.tsx                       # Lenis + ScrollTrigger 同步与全局状态
    ├── components/
    │   ├── ScrollSequence.tsx        # 滚动帧序列核心引擎
    │   ├── Preloader.tsx             # 燕麦白 000→100 进度加载幕布
    │   ├── Header.tsx                # 固定顶栏 + 深浅底自动反色 + JP/EN 切换
    │   ├── CustomCursor.tsx          # 桌面端 8px → 64px (View / Drag) 光标
    │   ├── MediaImage.tsx            # 缺图自动纯色路径占位组件
    │   └── MaskedLines.tsx           # 按行遮罩上滑 / 向上微模糊退场组件
    └── sections/                     # 01–08 八个页面区块
```

---

## 五、素材清单与替换指南

### 1. 素材路径（放入 `public/media/`）

| 文件路径 | 是否必需 | 说明 |
|---|---|---|
| `public/media/hero.mp4` | 推荐（上线时） | 5 秒固定机位匀速视频；放入后自动接管首屏逐帧滚动播放 |
| `public/media/hero/0001.webp` … | 可选（极致性能） | 预拆帧 WebP 文件夹（可配 `manifest.json` 写 `{"count":120}`），存在时优先使用 |
| `public/media/finale.mp4` | 可选 | 第 06 段结尾转场视频，缺省时自动跳过 |
| `public/media/works/01.jpg` ~ `08.jpg` | 必需 | 3:4 竖版作品实拍 |
| `public/media/services/01.jpg` ~ `04.jpg` | 必需 | 4 项服务对应大图 |
| `public/media/statement.png` | 必需 | 透明底 PNG 手部抠图 |

> **生成原创 `hero.mp4` 的首尾帧提示词（Veo / 可灵）**：  
> 将 `public/media/veo-keyframes/01-hero-first-frame.jpg` 作为首帧、`02-hero-last-frame.jpg` 作为尾帧上传，提示词：
> ```text
> Locked-off static overhead camera. Absolutely no camera movement, no zoom, no cuts, no change in lighting or stone background. An unseen gentle hand lifts the curled bottom-right corner of the frosted translucent Japanese vellum paper and smoothly peels it diagonally to the left edge of the frame at a slow, constant, meditative speed. As the translucent paper glides aside beside the pale blue sea-glass pebble, the woman's slender resting hand and her glossy sheer milky nails with powder-blue micro-French tips are cleanly revealed in crisp daylight. Photorealistic, calm editorial motion, 5 seconds.
> ```

### 2. 修改内容（`src/config.ts`）

所有业务数据集中在 `src/config.ts`：
- `brandName` / `artistName` / `city`：工作室名与主理人信息
- `contact`：`whatsappNumber`（国际区号+号码，无 `+` 与空格）、`instagramHandle`、`address`、`mapsUrl`、`hours`
- `booking`：`daysAhead`（默认 21 天）、`closedWeekdays`（`0`=周日、`1`=周一）、`timeSlots`
- `works[]`：图片路径、`glowColor` 地面柔光色、日/英名称与时长
- `services[]`：图片路径、价格、时长与日/英名称

---

## 六、本地运行与构建

```bash
npm install
npm run dev      # 本地开发
npm run build    # TypeScript 检查 + 生产构建（输出到 dist/）
npm run preview  # 本地预览生产包
```
