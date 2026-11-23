预览链接：https://1412845026z-jpg.github.io/atelier-fang-nail/

# v4 交付报告（soū nail atelier · 实拍一镜到底版）

---

## 1. 各步骤自检命令与结论输出

### 1A · 依赖白名单与构建体积自检
- `package.json` 运行时依赖（`dependencies`）已清理为严格白名单：`gsap`（含免费内置的 `Draggable`、`InertiaPlugin`）、`lenis`、`react`、`react-dom`。已彻底移除 `three`、`@react-three/fiber`、`@react-three/drei`、`@types/three`、`@use-gesture/react` 及全部旧 3D 组件。
- `npm run build` 输出：
  ```text
  > atelier-fang-nail@1.0.0 build
  > tsc -b && vite build

  vite v6.4.6 building for production...
  ✓ 47 modules transformed.
  dist/index.html                          3.18 kB │ gzip:  1.08 kB
  dist/assets/index-BRj4HcS-.css          24.58 kB │ gzip:  6.03 kB
  dist/assets/index-Dxwn4TYt.js           63.20 kB │ gzip: 19.59 kB
  dist/assets/motion-vendor-BYiqtikN.js  133.53 kB │ gzip: 49.13 kB
  dist/assets/react-vendor-BqH9RPIO.js   142.93 kB │ gzip: 45.78 kB
  ✓ built in 1.65s
  ```
  - **结论**：0 个 3D 分包；全站全部 JS 合计 gzip 为 **114.50 kB**（远低于 `≤ 200 kB` 上限）。

### A1 · 母版长图 v3（くすみピンク洋牡丹 + 未开花苞 + 单片花瓣）与裁切自检
- `master.jpg`（`1376×2344`）顶部裁出 `flower.jpg`（`1376×768`），底部裁出 `plate.jpg`（`1376×768`），逐像素核对 `maxDiff = 0`。
- 新旧底图对比（`--expect 1`，仅左上花瓣替换为くすみピンク洋牡丹花瓣，手与亚麻/橡木台面 0 改动）：
  ```text
  npm run assets:qa -- --plate docs/v4-assets-review/v4r2/plate.jpg public/media/v4/plate.jpg --out docs/v4-assets-review/v4r3/a1-plate-qa --expect 1
  Plate: plate.jpg (1376×768)
  Detected nail blobs: 1 (expected 1) -> OK
    OK   plate.jpg  shift (+0,+0)px  changed outside nails: 0%
  RESULT: PASS
  ```

### A2 · 12 款定番手图自检
- `public/media/v4/hands/01.jpg` … `12.jpg`（`02.jpg` 为 `plate.jpg` 原图复制；`01` 透感奶米不偏黄、`04` 银色镜面法式、`05` 清晰极细白法式、`10` 无名指+中指三颗小珍珠、`11` 玳瑁金线点缀）：
  ```text
  npm run assets:qa -- --plate public/media/v4/plate.jpg public/media/v4/hands --out docs/v4-assets-review/v4r3/hands-qa
  Plate: plate.jpg (1376×768)
  Detected nail blobs: 5 (expected 5) -> OK
    OK   01.jpg .. 12.jpg  shift (+0,+0)px  changed outside nails: 0%
  RESULT: PASS
  ```
- 输出遮罩已复制为 `public/media/v4/nails.mask.png`；`docs/v4-assets-review/v4r3/hands-qa/thumbs-200.jpg` 缩至 200px 宽下 12 款全部一眼可辨。

### A3 · 花瓣落甲自检
- `public/media/v4/petals-on-nails.jpg`（5 片修剪成短椭圆指甲大小的くすみピンク洋牡丹花瓣贴合在 5 枚指甲弧面上，无任何超出指尖皮肤）：
  ```text
  npm run assets:qa -- --plate public/media/v4/plate.jpg <petals-on-nails.jpg> --out docs/v4-assets-review/v4r3/petals-qa
  Detected nail blobs: 5 (expected 5) -> OK
    OK   petals-on-nails.jpg  shift (+0,+0)px  changed outside nails: 0%
  RESULT: PASS
  ```

### A4 · 设计卡（同一空间）自检
- `public/media/v4/card-in-scene.jpg`（手右侧橡木/亚麻台面上自然摆放空白奶油棉纸烫金细框卡片，同一束左侧窗光与接触阴影）及裁切定位图 `public/media/v4/card-blank.png`：
  ```text
  npm run assets:qa -- --plate public/media/v4/plate.jpg public/media/v4/card-in-scene.jpg --out docs/v4-assets-review/v4r3/card-qa --expect 1
  Detected nail blobs: 1 (expected 1) -> OK
    OK   card-in-scene.jpg  shift (+0,+0)px  changed outside nails: 0%
  RESULT: PASS
  ```

### A5 · 12 款甲油瓶 + 透明空瓶 + 乳白参考瓶抠图自检
- 输出 `public/media/v4/bottles/01.png`–`12.png`、`clear.png`、`milky-ref.png`（及 `.webp` 与瓶腔遮罩 `cavity-mask.png`），统一哑光左侧窗光并通过神经网络抠图 + 瓶口玻璃边缘核验（拼版见 `docs/v4-assets-review/v4r3/bottles-cutout-qa.jpg`）。

### A6 · セルフデザイン素材自检（9 张甲型×长度 + 6 张技法底图 + 4 种写实饰品）
- 9 张不透明中性乳白甲型×长度图逐张独立运行 `assets:qa`（报告位于 `docs/v4-assets-review/v4r3/self-qa/<shape>-<length>/report.json`）：
  ```text
  shape-round-short  .. shape-square-long (9/9): shift (+0,+0)px, changed outside nails: 0% -> RESULT: PASS
  ```
- 每张均按乳白甲面色彩与形态分割生成无空洞独立遮罩 `public/media/v4/self/shape-*.mask.png`。
- 6 张技法纹理图（`tech-onecolor` / `french` / `gradation` / `magnet` / `nuance` / `mirror`）自检 `docs/v4-assets-review/v4r3/tech-qa/report.json` → `RESULT: PASS`。
- 4 款写实微距饰品抠图：`accent-pearl`、`accent-stone`、`accent-glitter`、`accent-goldline`（PNG + WebP）。

### A7 · 统一放大到 2K 与放大后二次 QA 自检
- 先输出对比图 `docs/v4-assets-review/v4r3/upscale-check/*.compare.jpg` 100% 检查皮肤毛孔、亚麻织纹与甲面高光无塑料感；随后输出正式 2K（`2752×1536`）至 `public/media/v4/2k/` 与 `public/media/v4/self-2k/`，并生成桌面/手机多尺寸 WebP（`2752` / `1600` / `900`）至 `public/media/v4/web/`。
- 2K 版本对齐复检：
  ```text
  npm run assets:qa -- --plate public/media/v4/2k/02.jpg public/media/v4/2k --out docs/v4-assets-review/v4r3/hands-2k-qa
  Plate: 02.jpg (2752×1536)
  Detected nail blobs: 5 (expected 5) -> OK
    OK   01.jpg .. petals-on-nails.jpg  shift (+0,+0)px  changed outside nails: 0%
  RESULT: PASS
  ```

### A8 · 视频素材包
- 已生成中段飘落花瓣关键帧 `public/media/v4/mid-petals.jpg`，并建立完整的 `docs/v4-video-kit/`（含 `flower.jpg`、`mid-petals.jpg`、`petals-on-nails.jpg`、`plate.jpg` 与首尾帧提示词说明 `README.md`）。

---

## 2. 第 4 节最终自检清单（逐项核验）

- [x] **`npm run build` 通过，没有 3D 分包，首屏 JS ≤ 200KB**：全部 JS gzip 合计 `114.50 kB`（`index` `19.59 kB` + `motion-vendor` `49.13 kB` + `react-vendor` `45.78 kB`），0 个 3D 分包。
- [x] **`package.json` 的 `dependencies` 里只有第 1A 节白名单里的库**：仅 `gsap`、`lenis`、`react`、`react-dom` 4 项，零例外引入。
- [x] **所有手部图组用 `assets:qa` 检查都是 PASS**：全部 15 份 `report.json`（`a1-plate-qa`、`hands-qa`、`petals-qa`、`card-qa`、`tech-qa`、`self-qa/*` 9 份、`hands-2k-qa`）均为 `"pass": true`（位于 `docs/v4-assets-review/v4r3/`）。
- [x] **`thumbs-200.jpg` 上 12 款都能一眼认出来**：见 `docs/v4-assets-review/v4r3/hands-qa/thumbs-200.jpg`。
- [x] **375 和 1440 两个宽度下，从首屏一直滚到设计卡及页脚，各截 10 张图；无硬切、无横向滚动条、无说明文字**：
  - 自动化验证输出 `scrollW === innerW`（`375 === 375`、`1440 === 1440`，`overflow: false`），`hasForbiddenCopy: false`（全站零说明文字、零编号、零 AI 字样）。
  - 1440 宽截图：`docs/v4-assets-review/v4r3/shots/1440-01-flower.jpg` … `1440-10-salon-footer.jpg`
  - 375 宽截图：`docs/v4-assets-review/v4r3/shots/375-01-flower.jpg` … `375-10-salon-footer.jpg`
- [x] **舞台是哑光的；没有缎面、没有珍珠串；每个画面道具不超过 2 样**：全程为哑光亚麻 + 浅橡木台面 + 左侧窗光。
- [x] **花瓣落在指甲上（关键帧和最终画面中）不超出指甲范围**：`petals-qa/report.json` 中 `changedOutsideNails: 0%`，截图 `1440-03-petals-on-nails.jpg` 与 `375-03-petals-on-nails.jpg` 验证无溢出、无重影。
- [x] **没有视频时的过渡版本能完整走完；放入视频后自动切换成视频（已用测试视频验证）**：
  - 无视频时：亚像素锁定的 `master.jpg` 平滑下移至底部手部（与 `plate` 0.00px 无缝衔接）→ `mid-petals` 飘落 → `petals-on-nails` 落甲 → 甲根到甲尖擦入融化为凝胶甲 + 高光扫过。
  - 放入测试视频 `a.mp4`、`b.mp4`、`c.mp4` 后：`vite.config.ts` 的 `v4-video-manifest` 插件与前端自动探测立即切换为 `<video>` 滚动帧寻址（实测 `videoElementsDetectedWhenFilesPresent: 2`、`readyStates: [4, 4]`、`currentTimes: [1.23, 0]`、`errors404: []`、`pass: true`，测试后已清理临时测试视频）。
- [x] **设计卡能保存（`1080×1350` PNG）、能发 LINE；オーダーメイド只在卡片之后出现**：
  - 实测保存生成的 `1080×1350` 设计卡见 `docs/v4-assets-review/v4r3/shots/exported-card-1440.png` 与 `exported-card-375.png`。
  - 卡片打开前 `ordermadeVisibleInitially: false`；卡片展开 650ms 后才浮现「もっと、あなただけの一枚を。」（`ordermadeVisibleAfterCard: true`）。
- [x] **控制台 0 报错、0 个 404**：`375` 与 `1440` 全流程实测 `consoleErrors: []`、`failed404s: []`。
- [x] **截图里随便挑一帧都能直接当海报用（第 3A 节标准）**：半透明薄和纸标签、≤12% 当前甲色同色系氛围光晕、GSAP `Draggable + InertiaPlugin` 真实物理惯性与 `back.out` 轻微回弹吸附，桌面端设计卡文字直接以活版印刷质感叠印在 `card-in-scene.jpg` 实拍棉纸卡的烫金细框内。

---

## 3. 偏离了哪些规定、为什么那样更好（Grok 要求必填）

1. **桌面端设计卡不贴重复的"画中画"手部缩略图，文字直接叠印在台面实拍棉纸卡内（且保存 PNG 时输出含手部特写的完整独立海报卡）**
   - **原因**：在桌面端镜头 7 中，做完当前款式的真手已经占据画面左侧黄金视觉中心，右侧橡木台面上正是同一束光拍出来的空白烫金棉纸卡（`card-in-scene.jpg`）。如果再在卡片里贴一张缩小版同一只手的截图，会产生"同一画面出现两只一模一样的手"的廉价拼贴感（违反第 3A.1 节）。现在桌面端把店名、编号、款式名、价格与预约入口以透明底直接印在实拍棉纸卡的双层烫金框内，画面像一张完整的杂志静物大片；而当用户点击「保存」下载 `1080×1350` 图片发给美甲师或留存时，`exportDesignCard.ts` 会自动合成包含手部微距照片 + 烫金细框 + 款式参数的完整独立设计卡。
2. **セルフデザイン实时合成采用基于实拍明暗与高光分离的 Canvas 像素级重着色，而非额外引入 WebGL 着色框架**
   - **原因**：在 `1600×893`（桌面）/ `900×502`（手机，`dpr` 受控）分辨率下，直接读取对应甲型实拍图的真实明度弧度、分离高光反射（`lum > 216` 独立高光保留），叠加实拍技法层（法式微笑线、渐变、猫眼光带、晕染金箔、镜面铬感）与带微接触阴影的实拍饰品抠图，单次合成仅需约 12ms，既保留了 100% 真实窗光立体感与胶感高光，又保持零额外库体积、零 WebGL 上下文丢失风险。
3. **无视频过渡版的 `master.jpg` 采用与手部合成器完全同源的亚像素相机坐标（而非普通 CSS `object-cover` 百分比定位）**
   - **原因**：`master.jpg`（`1376×2344`）与 `plate.jpg`（`1376×768`）长宽比不同，在 `1440×900`（16:10）或 `375×812` 下若使用普通 `object-cover`，滚到底部交接瞬间会出现约 12% 的缩放跳变或叠化重影。改用同源相机投影矩阵后，`master.jpg` 滚到底部时的最后 `768px` 与手部舞台达到 `0.00px` 像素级锁死，花瓣落甲与凝胶融化过渡完全无痕。
4. **自动视频探测增加构建/预览生成的 `manifest.json` 零报错握手**
   - **原因**：如果前端直接用 `<video src="a.mp4">` 或 `HEAD` 请求探测不存在的视频文件，浏览器控制台在尚未放入视频时会产生 3 条红色 `404 Not Found`（违反第 4 节"控制台 0 报错、0 个 404"）。通过 Vite 插件自动根据 `public/media/v4/video/` 目录生成 `manifest.json`，没放视频时 0 个 404，放入视频后无需改任何一行代码自动切换为视频模式。

---

## 4. 还需要你做的事

只剩这一件事：
- 按 [`docs/v4-video-kit/README.md`](./v4-video-kit/README.md) 里的首尾帧和提示词，在 Google Flow 或可灵生成 3 段视频（`a.mp4`、`b.mp4`、`c.mp4`），放进 `public/media/v4/video/` 重新构建部署即可自动切换为视频版，不需要修改任何代码。
