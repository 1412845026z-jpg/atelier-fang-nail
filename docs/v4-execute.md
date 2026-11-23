# v4 一次到位执行单（给实现模型）

> 写于 2026-11-23。**这是唯一的任务清单。**按顺序从头做到尾：每一步做完先跑自检，自检通过就直接进入下一步，**不用停下来等人工确认**。全部完成后，交一份报告（第 5 节）。
>
> 参考文件（需要细节时再查）：
> - `docs/v4-photoreal-brief.md`：分镜、交互、技术方案
> - `docs/review-grok-b8c4078.md`、`docs/review-grok-v4-self-design.md`：Grok 的硬规则
> - `docs/v4-assets-review/REVIEW.md`：第一批素材的问题
>
> **已作废，不要看**：`docs/redesign-3d-brief.md`、`docs/gemini-v2-优化指令.md`。
> 如果几份文件之间有冲突，以本文件为准。

---

## 0. 已经定下来的事（不要再改）

| 项目 | 决定 |
|---|---|
| 舞台 | 哑光亚麻 + 浅橡木台面，左侧窗边侧光。没有缎面、没有珍珠串，每个画面道具不超过 2 样 |
| 底图 | 用 v4r2 的 `plate.jpg`（手指微弯的那张），不用零道具版 |
| 母版长图 | 用方案 B（洋牡丹 + 未开的花苞 + 灰白素陶瓶） |
| 花色 | 洋牡丹改成**くすみピンク系**：外层花瓣是灰玫瑰色，中心更浅。和手上的甲色属于同一个色系 |
| 分辨率 | 全部按原生 1376 宽出图。定稿后用仓库里的脚本统一放大到 2K。**不要用 Flow 重新生成高清版** |
| 视频 | 由用户本人在 Google Flow / 可灵用首尾帧生成。你只负责准备"视频素材包"（第 2 节 A8）。不配置 API Key |
| 文字 | 零说明文字。允许出现的文字见 `docs/v4-photoreal-brief.md` 第 6 节。网站上完全不提 AI |
| 三档 | 定番（12 瓶）/ セルフデザイン（空瓶逐层装满）/ オーダーメイド（只在设计卡之后出现） |

---

## 1. 工具（仓库里已经有，先装好）

```bash
npm install
npm run assets:setup-upscaler      # 安装 Real-ESRGAN 到 .tools/（不进 git）
```

| 命令 | 用途 |
|---|---|
| `npm run assets:qa -- --plate <底图> <变体文件夹> --out <输出文件夹>` | **同一只手的一组图自检**：检查有没有位移、手和台面有没有被改动、自动生成指甲遮罩、输出热力图和 200px 缩略图。不通过时退出码为 1 |
| `npm run assets:upscale -- <图片或文件夹> --out <输出文件夹> --mask <指甲遮罩>` | 放大到 2K。指甲区域用 Real-ESRGAN，皮肤和台面用混合 + 颗粒，避免塑料感 |

详细说明见 `scripts/assets/README.md`。

---

## 2. 阶段 A：素材（一次出完，每步自检）

所有素材放在 `public/media/v4/`，自检输出放在 `docs/v4-assets-review/v4r3/`。

### A1 · 母版长图 v3 → 裁出底图和花
- 以 v4r2 的 `master-alt-ranunculus.jpg`（方案 B）为基础编辑，只改两处：
  1. 洋牡丹和花苞改成くすみピンク系（外层灰玫瑰色，中心更浅），花苞保持未开。
  2. 台面上那朵小樱花，换成一片同一种洋牡丹的花瓣（くすみピンク），或者直接删掉。
- 提示词：
  ```text
  Keep this photo exactly the same: same composition, table, linen, vase, hand, nails, ring and light. Change ONLY: the ranunculus flower and its closed bud become a dusty rose-mauve ("kusumi pink") variety, outer petals greyish rose, the center paler. Replace the small cherry blossom lying on the linen with a single petal of the same dusty rose ranunculus. Do not change anything else.
  ```
- 输出：`public/media/v4/master.jpg`；从它裁出 `flower.jpg`（顶部 768px）和 `plate.jpg`（底部 768px）。
- **自检**：
  - 两张裁切和长图对应区域逐像素相同（maxDiff = 0）。
  - 用 `assets:qa` 对比新旧 `plate.jpg`（v4r2 的 plate 作为底图，新的作为变体，`--expect 1`）：手和台面不能有变化，只有花瓣那一小块可以不同（如果是删掉花瓣，也算 1 处变化）。

### A2 · 12 款定番手图
- 每款都用 `public/media/v4/plate.jpg` 编辑。模板：
  ```text
  Keep this photo exactly the same: same hand, pose, fingers, skin, ring, linen, table, light and framing. Change ONLY the nails to: [design]. Professional Japanese gel manicure: smooth, thick, glossy "churun" surface, clean cuticle line, same nail shape and length as now. Do not change anything else.
  ```
- 12 款的 `[design]`（已经加入第一批审核时的修改）：

| No. | 名称 | design |
|---|---|---|
| 01 | ちゅるんミルクベージュ | sheer milky beige jelly gel that lets the pink nail bed show through, very glossy, not yellow, not opaque |
| 02 | くすみピンク | 直接用 plate，不需要重出 |
| 03 | マグネット ラベンダー | lavender magnetic cat-eye gel with a soft diagonal shimmer band |
| 04 | ミラーフレンチ | sheer nude base with silver mirror-chrome French tips about one fifth of the nail length |
| 05 | 極細フレンチ | very sheer pale pink base with a crisp white French tip line about one eighth of the nail length, clearly visible |
| 06 | ニュアンスマーブル | milky white and greige marble with a few flakes of gold foil |
| 07 | うる艶ボルドー | deep glossy bordeaux one-color |
| 08 | シアーグレージュ | sheer greige one-color, glossy |
| 09 | オーロラパール | sheer white with iridescent aurora powder, pearly pink-blue shimmer |
| 10 | パールパーツ | sheer pink base; the ring finger and the middle finger each have a small cluster of three white pearls near the cuticle, clearly visible |
| 11 | べっ甲アクセント | sheer beige base; two accent nails with tortoiseshell pattern and a thin gold line |
| 12 | ラメグラデーション | sheer nude with dense champagne-gold glitter at the tips fading toward the middle of the nail |

- 输出：`public/media/v4/hands/01.jpg` … `12.jpg`（02 = plate 的复制）。
- **自检**：
  ```bash
  npm run assets:qa -- --plate public/media/v4/plate.jpg public/media/v4/hands --out docs/v4-assets-review/v4r3/hands-qa
  ```
  - 结果必须是 `RESULT: PASS`：正好 5 个指甲，每张"指甲以外的变化"≤ 0.5%，没有位移。
  - 打开 `thumbs-200.jpg`：12 张都能一眼认出来。
  - 不通过的那一张重新编辑，直到通过。
  - 通过后，把输出的 `nails.mask.png` 复制到 `public/media/v4/nails.mask.png`。后面合成和放大都用它。

### A3 · 花瓣落甲
- 用 `plate.jpg` 编辑：
  ```text
  Keep this photo exactly the same. Change ONLY this: on each of the five fingernails rests one real dusty rose ranunculus petal, trimmed to exactly the size and short oval shape of the nail, gently curved to follow the nail's curvature, its edge slightly translucent, with a very fine contact shadow where it meets the nail. No petal extends beyond the nail onto the fingertip or the sides of the finger. It should look as if the petal is becoming the nail, not like a sticker. Do not change anything else.
  ```
- 输出：`public/media/v4/petals-on-nails.jpg`
- **自检**：把它放进一个临时文件夹，用 `assets:qa` 和 plate 对比，必须 PASS。如果花瓣盖出了指甲，"指甲以外的变化"会超过 0.5%，这时要重出。

### A4 · 设计卡（同一空间）
- 用 `plate.jpg` 编辑：在手的右侧台面上，放一张空白厚纸卡（奶油色，细烫金边，没有任何文字），同一束光、自然的接触阴影。
- 输出：`public/media/v4/card-in-scene.jpg`，再单独裁出卡片区域，存为 `card-blank.png`，供代码叠加文字时定位使用。
- **自检**：除了卡片区域，手和台面不能有变化（用 `assets:qa`，`--expect 1`）。

### A5 · 甲油瓶
- 以 v4 第一批的 `bottles/01.jpg` 为准瓶，编辑背景：
  ```text
  Keep the bottle exactly the same. Change ONLY the background and light: the bottle stands on the same matte off-white linen over a light oak table, soft side window light from the left, natural soft contact shadow. Do not change the bottle.
  ```
- 然后用编辑模式只换瓶内颜色，出 12 款，对应 A2：
  - 05 要做成透粉瓶身，瓶口带一点白。
  - 01 是透出甲床的奶白，不能偏黄。
  - 再出一只透明空瓶（セルフデザイン），和一只装满中性乳白液体的参考瓶（给セルフデザイン的分层着色做明暗参考）。
- 抠图：用开源抠图工具（例如 `pip install rembg`）抠成透明背景的 PNG / WebP，人工检查瓶口和玻璃边缘。
- 输出：`public/media/v4/bottles/01.png` … `12.png`、`clear.png`、`milky-ref.png`

### A6 · セルフデザイン素材
- **甲型 × 长度（9 张）**：用 `plate.jpg` 编辑，指甲改成不透明的中性乳白色，形状分别是 ラウンド / オーバル / スクエアオフ，长度分别是 ショート / ミディアム / ロング。
  输出：`public/media/v4/self/shape-<形状>-<长度>.jpg`。
  每张都要用 `assets:qa` 自检手和台面有没有被改动（每张单独跑，`--out` 用不同的文件夹）。
  每张还要有自己的遮罩 `self/shape-*.mask.png`。因为这里的指甲是不透明乳白色，**直接按颜色分割**（高亮度、低饱和度、位于指尖附近）会比和 plate 做差更准：做差时，变短的那部分原指甲区域也会被算进去。
- **技法（6 种）**：ワンカラー、フレンチ、グラデーション、マグネット、ニュアンス、ミラー。每种出一张"中性乳白底 + 该技法"的 plate 编辑图，作为技法纹理层的来源。
- **点缀（4 种 + なし）**：パール、ラメ、ストーン、ゴールドライン。写实的单颗饰品，正面拍后抠图。
- **实现要求**：任意组合下，甲面都要和照片处在同一光影里（有弧度、高光、透感），不能是平涂色块。推荐做法：
  - 以对应甲型图的明暗为基础，在 Lab 色彩空间里只换色相和饱和度。
  - 技法层从技法图中提取，按每个指甲的遮罩和方向贴上去。
  - 点缀用抠好的饰品图，贴在甲根锚点上，加接触阴影。
  - 具体做法你可以自己发明，结果写实即可。

### A7 · 统一放大到 2K
先输出对比图检查（放在 docs 下，不进网站）：
```bash
npm run assets:upscale -- public/media/v4/hands public/media/v4/petals-on-nails.jpg public/media/v4/card-in-scene.jpg --out docs/v4-assets-review/v4r3/upscale-check --mask public/media/v4/nails.mask.png --compare
```
确认没问题后，再输出正式版本（Real-ESRGAN 的结果有缓存，第二次每张约 1 秒）：
```bash
npm run assets:upscale -- public/media/v4/hands public/media/v4/petals-on-nails.jpg public/media/v4/card-in-scene.jpg --out public/media/v4/2k --mask public/media/v4/nails.mask.png
```
- **同一组对齐图必须一次处理完**，参数用默认值。`hands/02.jpg` 就是 plate，不用重复放大。甲型图（A6）另跑一次，用 `--mask-dir public/media/v4/self`。
- **自检**：打开 `*.compare.jpg`，100% 看皮肤和亚麻有没有塑料感。放大后对 2k 版本再跑一次 `assets:qa`（底图用 `2k/02.jpg`），必须 PASS。
- 网站使用时，再从 2K 版本输出 WebP / AVIF 的多个尺寸（桌面 2752 / 1600、手机 900）。

### A8 · 视频素材包（交给用户生成）
- 再出一张"中段"图 `mid-petals.jpg`：从母版长图的中部裁一张 16:9，编辑加入几片在空中飘落的くすみピンク洋牡丹花瓣（不改其他任何东西）。
  它同时是视频 A 的尾帧和视频 B 的首帧，这样三段视频都从静态图出发，接得起来。
- 新建 `docs/v4-video-kit/`，放入下面的首尾帧，并写一份 `README.md`，内容是这张表和每段的提示词（提示词见 `docs/v4-photoreal-brief.md` 4.3 第 5–7 步，把花材改成洋牡丹）。用户照着上传就行。

| 视频 | 首帧 | 尾帧 | 长度 |
|---|---|---|---|
| A：花苞绽放，花瓣飘落，镜头下移 | `flower.jpg` | `mid-petals.jpg` | 6 秒 |
| B：花瓣继续飘落，落到 5 个指甲上 | `mid-petals.jpg` | `petals-on-nails.jpg` | 5 秒 |
| C：花瓣融化成凝胶甲，一道光扫过 | `petals-on-nails.jpg` | `plate.jpg` | 4 秒 |

---

## 3. 阶段 B：代码（素材自检全部通过后直接做）

按 `docs/v4-photoreal-brief.md` 第 3 节（镜头 1–8）和第 5 节实现，要点如下：

1. **删除**：`three`、`@react-three/*`、`src/components/three/`，以及旧的 3D 区块（花苞、镜面托盘、金环甲片展架）。删完后 `npm run build` 里不能再有 3D 分包。
2. **一镜到底**：镜头 1–4 用滚动驱动。
   - **有视频时**（`public/media/v4/video/a.mp4`、`b.mp4`、`c.mp4`，或拆好的帧文件夹）：用现有的 `ScrollSequence` 引擎播放。
   - **没有视频时（现在就是）**：用母版长图做"镜头下移"（滚动驱动的平移 + 轻微推近），在关键帧之间做柔和过渡：`flower` → `mid-petals` → `petals-on-nails` → `plate`。花瓣变成美甲这一步，在指甲遮罩内做从甲根到甲尖的擦入，再加一道光扫过。
   - 视频文件放进去后，自动切换成视频，不需要改代码。
3. **定番**：镜头 5，一排抠好的写实瓶子，左右滑动，带惯性和吸附；正中清晰，两侧虚化。美甲切换在 `nails.mask.png` 范围内做擦入。
4. **セルフデザイン**：按 `docs/review-grok-v4-self-design.md`。空瓶逐层装满表示进度，可以点某一层回退；不和谐的选项自动变淡；禁止任何小游戏式的操作。
5. **设计卡 + オーダーメイド**：卡片从 `card-in-scene.jpg` 的位置出现，文字由代码叠加。可以保存成 1080×1350 的图片，也可以发 LINE。卡片出现之后，才淡出「もっと、あなただけの一枚を。」。
6. **文字**：严格按 `docs/v4-photoreal-brief.md` 第 6 节。不写操作说明，不加编号，不出现 AI。
7. **性能**：首屏 JS（gzip）≤ 200KB；手机 4G 下 LCP ≤ 2.5s；中端安卓 ≥ 50fps；手机 dpr 上限 1.5；控制台 0 报错、0 个 404。
8. **画面完成度**：按 `docs/v4-photoreal-brief.md` 第 3A 节，以 Rondesignlab 作品集的完成度为标杆：
   - 界面做成像和纸一样的半透明小卡片，浮在照片上；
   - 氛围光只用当前甲色的极淡光晕；
   - 每一帧都像广告大片，焦点始终在指甲上；
   - 动效有真实的物理手感。
   只学完成度，不学它们的科技感：不用深色背景，不用荧光渐变，不出现设备样机，不做大块毛玻璃。

---

## 4. 最终自检（全部满足才算完成）

- [ ] `npm run build` 通过，没有 3D 分包，首屏 JS ≤ 200KB（附 build 输出）。
- [ ] 所有手部图组用 `assets:qa` 检查都是 PASS（附 `report.json`）。
- [ ] `thumbs-200.jpg` 上 12 款都能一眼认出来。
- [ ] 375 和 1440 两个宽度下，从首屏一直滚到设计卡，各截 8–10 张图。确认没有硬切，没有横向滚动条，没有说明文字。
- [ ] 舞台是哑光的；没有缎面、没有珍珠串；每个画面道具不超过 2 样。
- [ ] 花瓣落在指甲上（关键帧和最终画面中）不超出指甲范围。
- [ ] 没有视频时的过渡版本能完整走完；放入视频后自动切换成视频（用一段测试视频验证）。
- [ ] 设计卡能保存、能发 LINE；オーダーメイド只在卡片之后出现。
- [ ] 控制台 0 报错、0 个 404。
- [ ] 截图里随便挑一帧，都能直接当海报用（第 3A 节的标准）；界面和照片融为一张画面。

## 5. 交付

1. 提交并推送到 `main`。
2. 写 `docs/v4-delivery-report.md`，内容包括：
   - 每一步的自检结果（贴出命令输出的结论行）
   - 第 4 节清单逐项打勾，附截图
   - **偏离了哪些规定、为什么那样更好**（Grok 要求必须写）
   - 还需要用户做的事：只剩"按 `docs/v4-video-kit/` 生成 3 段视频，放进 `public/media/v4/video/`"
3. 部署预览站（GitHub Pages），把链接写在报告第一行。
