# soū nail atelier · v4 写实化改版需求书

> 写于 2026-11-22 夜。依据三份材料：
> 1. 用户当晚的新要求（本文件第 0–2 节）
> 2. Grok 质量与美术把关的修改单 `docs/review-grok-b8c4078.md`
> 3. 线上 `b8c4078` 的实测结果
>
> **优先级：用户 > Grok 修改单 > 旧需求书（`docs/redesign-3d-brief.md`，已作废）。**
>
> **2026-11-22 23 点更新**：按 Grok 的 v4 补充规格（`docs/review-grok-v4-self-design.md`）修改了以下内容：
> - 舞台从"粉色缎面 + 珍珠"改成**哑光日式台面**（第 4.2 节）。
> - セルフデザイン 改以 Grok 的补充规格为准（第 3 节镜头 6）。
> - 新增「母版长图」，用来保证从花到手是同一个空间（第 4.3 节）。
>
> 第一批素材的审核意见见 `docs/v4-assets-review/REVIEW.md`。
>
> **执行时请看 `docs/v4-execute.md`**：它是按顺序做完全部素材和代码的唯一任务清单。
> Grok 修改单里提到的 `/workspace/atelier-ui-guide.md` 不在本仓库里。如果有，请把它放到 `docs/` 下；没有的话，以本文件为准。

---

## 0. 一句话

**全站写实：真花、真手、真指甲、真甲油瓶。**
所有画面都是写实的照片和视频（用图像 / 视频模型生成）。代码**不画任何物体**，只负责镜头运动、过渡和交互。整站一镜到底。

---

## 1. 为什么 b8c4078 看起来"不像真的"

- 花苞由 3D 甲片拼成，呈塑料 / 玻璃质感。甲油瓶是网页里实时渲染的 CG：描边硬，瓶盖像模型。甲片环是金圈插着 CG 片，像饰品架。
- **实时 3D 在网页里做不到照片级**，而且很重（`Lightformer` 分包约 875KB）。
- **结论**：
  - 物体一律用写实照片和视频，网页里不再实时渲染物体。删掉 `three`、`@react-three/*` 渲染物体的代码和灯光预设。
  - 代码只做这几件事：滚动或滑动驱动视频帧、遮罩过渡、景深虚化、光扫过、视差、拖动惯性。
- **可以保留的**：`public/media/hands/` 里那组手部照片（底图 + 12 款）。它们是写实的，手也是女性的手，12 张已经对齐，Grok 也要求以它作为全站甲型和光线的基准。但有两个问题要补：
  - 分辨率只有 1200×896，手在画面里偏小，指甲太小，看不清款式细节。需要按第 4 节重新出一版 4K、手占画面更大的图。
  - 12 款里有 7 款（01 / 04 / 05 / 06 / 08 / 09 / 12）肉眼几乎分不出来。款式要拉开差别。

---

## 2. 用户新要求和 Grok 修改单的冲突：裁决结果

| 项目 | Grok 修改单 | 用户新要求 | 结论 |
|---|---|---|---|
| 首屏的花 | 花瓣要做成短甲形 | 花是**真花**，不要用美甲拼；花瓣落到手上以后再变成美甲 | **按用户**：写实的真花 → 花瓣飘落 → 落到指甲上 → 变成短凝胶甲 |
| 选款的道具 | 禁止 CG 转盘和金环展架 | 一排**写实甲油瓶**，左右滑动来选 | **写实甲油瓶一排，左右滑**。不做转盘，不做展架 |
| 页面感 | 一镜到底，不能硬切 | "往下滑，到下一个页面，花瓣慢慢落到手上" | **一镜到底**：往下滚动时，镜头跟着花瓣往下移，落到手上。看起来像"到了下一屏"，但中间不切换 |
| 说明文字 | 零说明文字 | 未提 | 沿用 Grok 的规定（第 6 节） |
| 三档 | 定番 / セルフデザイン / オーダーメイド | 低档 = 12 款现成的，中档 = 自己设计，高档这里不展示 | 两边一致：定番 = 12 瓶，セルフデザイン = 分步自己设计，オーダーメイド 只在设计卡之后轻轻出现 |
| 交互方式 | 只用轻点或滑动，不做小游戏 | 滑动选瓶，"无论如何都是动画交互" | 一致：滑动 + 轻点，每次选择都用动画揭晓 |

---

## 3. 一镜到底的分镜（全部写实，滚动驱动）

整站是一条连续的镜头，发生在同一个世界里：**同一张哑光台面（米白亚麻、和纸、浅木或石材）、同一只手、同一束从左侧来的柔和窗光、同一个色温**。

### 镜头 1 · 花（首屏）
- 画面：柔和的侧光里，一只小陶瓶插着一枝写实的淡粉色花（芍药、毛茛或雪柳，选一种），立在台面上，花瓣有细微的脉络和通透感。这个陶瓶和后面的手在**同一张台面上**（见 4.3 的母版长图）。
- 动态：花在轻轻"呼吸"，花瓣微微颤动，光线缓慢流动。用一段 4 秒的写实视频，正放和倒放交替，做成无缝循环。
- 文字：只有「ひらいてみてください。」（Grok 定稿）。
- LCP：首屏先显示这一帧的静态图。

### 镜头 2 · 花开，花瓣飘落（滚动进度 0 → 40%）
- 滚动驱动一段写实视频：花慢慢完全绽放，几片花瓣脱落，往下飘。
- 镜头跟着花瓣往下移。

### 镜头 3 · 落到手上（40 → 70%）
- 视频接着走：镜头继续下移，来到台面上一只女性的手。5 片花瓣轻轻落下，**每一片正好落在一个指甲上**。

### 镜头 4 · 花瓣变成美甲（70 → 100%）
- 视频：指甲上的花瓣慢慢变软、融化，颜色沉进指甲里，变成饱满有光泽的短凝胶甲（ちゅるん），最后一道柔光扫过。
- 文字：「花びらが、指先に。」 主行动：「ネイルを選ぶ」。
- 这里的美甲就是定番里和花瓣同色的那一款（くすみピンク，或者新增一款「桜ちゅるん」）。

### 镜头 5 · 甲油瓶出现（定番，12 款）
- 镜头 4 的最后一帧就是"舞台底图"：手 + 台面。继续滚动或点「ネイルを選ぶ」后，一排**写实的甲油瓶**立在台面上，在手的前方从景深里浮现：由虚到实，轻轻升起，依次错开出现。
- **左右滑动这排瓶子**（手机用手指，电脑用鼠标拖或触控板横滑），带惯性，停下时自动吸附到最近的一瓶。
- **正中那瓶在焦点上**：清晰、略大、轻轻抬起。越往两边越虚（模糊 2 → 8px），也越暗，像相机的追焦。
- 停稳后，手上的美甲切换成这一款：在指甲遮罩里，新款式像甲油一样从甲根流到甲尖（5 根手指依次进行，间隔 60ms），然后一道光扫过指甲。
- 瓶子下方用小字显示款名、价格、时间（允许的文字）。
- 轻点指甲：镜头推近到指甲特写，看清光泽和细节，然后进入镜头 7（设计卡）。

### 镜头 6 · セルフデザイン（自己设计）—— 以 `docs/review-grok-v4-self-design.md` 为准
- **定位**：让客人用中档的价格，"参与一次高端设计的过程"。不咨询也能完整玩完；玩完有了投入感，自然想要 オーダーメイド。
- **入口**：瓶子那一排的最后，放一只空的透明瓶（素材 `clear-self-design`）。
- **同一部片子的下半场**：同一只手、同一个台面、同一束光，从定番无缝接进来，不切走、不跳页。甲面从素甲开始，每做一个选择，就当场落在这只手上；镜头随之推近、对焦。
- **空瓶是主角，也是进度条**：每选完一步，瓶里多一层。用"瓶子被慢慢装满"表达进度，不出现「STEP 1/6」之类的文字。轻点瓶中的某一层，镜头退回到那一步，可以修改。
- **顺序**：甲型（3 种）→ 长度（3 种）→ 底色（16–20 色，有日文名，偏日式くすみ和透感）→ 技法（5–6 种：ワンカラー、フレンチ、グラデーション、マグネット、ニュアンス、ミラー）→ 点缀（4–5 种：パール、ラメ、ストーン、ゴールドライン、なし）→ 设计卡。选完一项，下一项立刻自然浮现。
- **选项怎么呈现**：由实现者决定，可以是"一排写实的小物件，左右滑动"（和甲油瓶操作一致），也可以是安静的文字选项。但必须遵守 Grok 的禁令：不出现捏、刷、镊子、转盘、拖拽涂色、得分、音效奖励等小游戏感操作。
- **有限的自由**：推荐的组合更亮，搭不上的选项自动变淡，客人挑不出难看的组合。
- **收尾**：瓶子封口 → 镜头拉远 → 变成设计卡（自动生成诗性款名、预计价格、预计时长、卡号）。

### 镜头 7 · 设计卡
- 镜头稍微后退。在同一张台面上，手旁边滑进来一张**写实的厚纸卡片**：奶油色，带细细的烫金边。
- 卡片上的内容由代码叠加：指甲特写、番号、设计名、价格、时间。
- 卡片上的操作：保存 / 分享 / 用 LINE 发送。导出一张 1080×1350 的图片。

### 镜头 8 · オーダーメイド
- 只在设计卡生成之后出现：「もっと、あなただけの一枚を。」，点了进入 LINE 咨询。

### サロン、页脚
- 只有一瞬：美甲师工作中的手（不露脸）。页脚极薄地收住。

---

## 4. 写实素材的制作方法（最关键的一节）

### 4.1 谁来生成
- 照片和视频由**图像 / 视频模型**生成：推荐 Google Flow（静态图用 Nano Banana / Imagen，视频用 Veo），也可以用可灵。
- Claude 在这个环境里**不能直接生成图片**。如果实现模型自己能生图，可以直接用下面的提示词；否则请用户在 Flow 里生成，再把文件放进仓库。
- 生成后的处理（对齐、做遮罩、抠图、拆帧、压缩）全部用开源工具在本地完成，见 4.5。

### 4.2 全站统一的"世界设定"（每条提示词都要带上）
**改动（Grok v4 补充规格）**：第一版写的是粉色缎面 + 珍珠，这更像欧美或中式婚礼、珠宝广告的"名媛风"，甜、亮、满。日本高端沙龙作品图的气质是素、静、留白。所以：
- 底材用哑光材质：米白亚麻、和纸、浅木、石材之一或组合。**禁止反光缎面。**
- 光是柔和的窗边侧光，有自然阴影。**禁止棚拍式均匀打光。**
- 每个画面最多 1–2 样道具（一两片花瓣、一枝雪柳或小花、一只陶器）。**去掉珍珠串。**
- 同一只手贯穿全片。戒指可以留也可以去，但全片统一。

```text
WORLD: matte off-white linen and pale washi paper on a light wood table, soft natural side light from a window on the left with gentle natural shadows, calm and quiet, generous negative space, at most one or two small props, warm 5000K, shallow depth of field, shot on a 100mm lens, photorealistic, the portfolio photography style of a high-end Japanese nail salon, no satin, no pearls, no text, no logo, no watermark.
HAND: a slender young Japanese woman's hand, long delicate fingers, small knuckles, smooth luminous skin with a soft pink undertone, natural fine skin texture, no visible veins, realistic proportions, exactly five fingers.
NAILS: professional Japanese gel manicure, short to medium length, soft oval or round shape, thick smooth glossy "churun" surface, clean cuticle line.
```

### 4.3 生成顺序（顺序决定能不能对齐）
**先出"舞台底图"，其他图都在它的基础上编辑出来**，这样所有图都对齐。下载时选 **4K**（至少 2K）。第一批素材只有 1376×768，镜头推近到指甲时会糊。

0. **母版长图 `master.jpg`**（竖版，约 9:24，例如 2160×5760）——保证"花 → 手"是同一个空间
   先出 `plate.jpg`，再用扩图（向上扩展画布）把画面往上延伸：手的后方、同一张台面上，立着一只小陶瓶，插着一枝淡粉色的花。
   ```text
   Extend this photo upward, keeping everything already in the frame exactly the same. Above and behind the hand, on the same table, a small matte ceramic vase holds a single pale blush flower (peony / ranunculus / snowbell branch). Same surface, same side window light from the left, same color temperature, calm negative space between the vase and the hand.
   ```
   然后：`flower.jpg` = 长图的上部裁切，`plate.jpg` = 下部裁切（像素完全一致）。视频 A、B 的首尾帧都从长图里裁，镜头"往下摇"就是在同一个空间里移动，不会跳色、跳光。

1. **舞台底图 `plate.jpg`**（4K，16:9；手占画面约 55%，五个指甲都清楚）
```text
[WORLD] [HAND] Her left hand rests naturally and relaxed on the linen, back of the hand facing the camera, fingers softly curved and slightly apart, all five nails clearly visible and not overlapping, shot from about 60 degrees above. A thin gold ring on the ring finger. [NAILS] in sheer dusty blush pink. One small prop at most at the far edge (a single petal or a small ceramic dish).
```
2. **12 款定番变体**（上传 `plate.jpg`，每款编辑一次）
```text
Keep this photo exactly the same: same hand, pose, fingers, skin, ring, lighting, background and framing. Change ONLY the nails to: [design]. [NAILS] Do not change anything else.
```
   12 款沿用 `docs/redesign-3d-brief.md` 第 5 节的名称和描述，但要**拉开差别**：至少 3 款深色或高饱和色，至少 4 款带明显的技法（マグネット、ミラーフレンチ、ニュアンス箔、べっ甲、パール）。
   **验收**：12 张缩到 200px 宽排在一起，每张都能一眼认出来（尤其是 01、02、05、10、12）。
3. **花瓣落在指甲上 `petals-on-nails.jpg`**（上传 `plate.jpg` 编辑）
```text
Keep this photo exactly the same. Change ONLY this: on each of the five fingernails rests one real pale blush flower petal, trimmed to exactly the size and short oval shape of the nail, gently curved to follow the nail's curvature, its edge slightly translucent, with a very fine contact shadow where it meets the nail. No petal extends beyond the nail onto the fingertip or the sides of the finger. It should look as if the petal is becoming the nail, not like a sticker. Do not change anything else.
```
4. **花 `flower.jpg`**：从母版长图的上部裁切（见第 0 步），不要单独生成。
5. **视频 A：花开 → 花瓣飘落**（图生视频，首帧 = `flower.jpg`）
```text
Slow, elegant, photorealistic. The flower in the ceramic vase slowly blooms fully open; several petals gently detach and drift downward through the air; the camera smoothly tilts down, following the falling petals. Soft side window light, no cuts. 6 seconds.
```
6. **视频 B：花瓣落到手上**（首尾帧模式：首帧 = 视频 A 的最后一帧，尾帧 = `petals-on-nails.jpg`）
```text
The camera continues to tilt down, following the drifting petals, and arrives at a woman's hand resting on the linen; each petal floats down and settles softly onto one fingernail. Smooth continuous motion, constant speed, photorealistic, no cuts. 5 seconds.
```
   视频由用户本人在 Google Flow 或可灵里用首尾帧生成，再放进仓库。不配置 API Key 自动调用。
7. **视频 C：花瓣变成美甲**（首尾帧模式：首帧 = `petals-on-nails.jpg`，尾帧 = `plate.jpg`）
```text
Static camera, no movement. The petals resting on the fingernails slowly soften and melt into a smooth glossy gel manicure, their color sinking into the nails; finally a soft glint of light sweeps across the nails. Photorealistic, calm. 4 seconds.
```
8. **甲油瓶**：先出一只"标准瓶"，再用编辑模式只换颜色。这样所有瓶子形状、光线完全一致。
```text
[WORLD] A small luxury nail polish bottle, 10 ml, softly rounded square thick clear glass, smooth blush ceramic cap with a thin gold ring, filled with sheer dusty pink polish, standing upright on the same matte linen and wood surface, photographed straight on at eye level, light from the same left-side window as the hand photo, soft natural contact shadow, generous empty space around.
```
   第一批瓶子的外形和质感都很好，**保留瓶型**，只把背景换成哑光台面、光线方向和手的照片对齐，再按款换色。每只瓶子还要交付一张抠好的透明背景版本。
   换色时用：`Keep this photo exactly the same. Change ONLY the polish inside the bottle to: [color / glitter / magnet shimmer]. Do not change anything else.`
   定番 12 瓶对应 12 款；セルフデザイン 的颜色瓶 16–20 只。
9. **セルフデザイン 的甲型素材**：用 `plate.jpg` 编辑出 9 张"指甲是不透明乳白色、形状和长度各不相同"的图（3 种甲型 × 3 种长度）。这些图用来提取指甲遮罩和明暗，之后在代码里按颜色重新着色（见 4.5）。
10. **空瓶装满的分层**：另出一张同角度、"瓶里装满中性乳白液体"的空瓶照片，作为瓶内液体的明暗参考；每一层的颜色由代码按同样的方法重新着色。
11. **技法纹理、点缀饰品**：每样单独生成一张（同一套世界设定，正面拍），之后抠图。
12. **设计卡**：用 `plate.jpg` 编辑，在手的旁边放一张空白厚纸卡（奶油色，细烫金边），没有任何文字。这样卡片和手在同一个空间、同一束光里。文字由代码叠加，保证清晰。

### 4.4 验收素材的标准
- 把素材和一张真实的产品照片并排放，看不出哪张是生成的。
- 所有图的光线方向、色温、台面一致。哑光台面，没有缎面，没有珍珠串，每个画面道具不超过 2 样。
- 手指数量、关节、指甲形状没有变形。手是纤细的女性手，全片是同一只手。
- 12 款定番缩到 200px 宽仍能一眼分出来。
- 分辨率：手部图和母版长图是 4K（至少 2K）。
- 对齐：变体图和 `plate.jpg` 做差，只有指甲区域不同，手的轮廓没有错位（见 4.5 的 OpenCV 对齐）。

### 4.5 开源工具（本地、免费，Claude 可以帮忙搭好脚本）
| 工具 | 用途 |
|---|---|
| ffmpeg（用 npm 的 `ffmpeg-static`，不需要 Homebrew） | 视频拆帧、转 WebP / AVIF、做所有帧都是关键帧的视频 |
| `sharp`（npm） | 缩放、压缩、输出多个尺寸 |
| `rembg`（Python） | 甲油瓶、饰品、质感物件抠图 |
| OpenCV（Python） | 把变体图对齐到底图（ECC 对齐）；用变体和底图的差异自动生成指甲遮罩；检查有没有位移 |
| RIFE（可选） | 视频补帧，让滚动播放更顺 |
| Real-ESRGAN（可选） | 放大，补细节 |
| GSAP（ScrollTrigger、Draggable、InertiaPlugin、Flip）+ Lenis | 页面上的动效：滚动驱动、拖动惯性、吸附、追焦、镜头推近 |

建议目录：`scripts/assets/`，里面放 `align.py`、`masks.py`、`cutout.py`、`frames.mjs`，一条命令跑完整个流程。

---

## 5. 技术方案（代码只做镜头和交互）

- **删除**：`three`、`@react-three/fiber`、`@react-three/drei` 渲染物体的部分，以及 `Lightformer` 等灯光预设。
- **镜头 1–4**：视频 A、B、C 拆成帧序列（桌面宽 1600、手机宽 900，WebP / AVIF），用现有的 `ScrollSequence` 引擎按滚动进度播放，三段接成一条时间线。首屏只加载循环视频和前 30 帧，其余边滚边加载。
- **舞台（镜头 5–7）**：用 DOM 或 Canvas 合成：
  - 底层是 `plate`。
  - 中间是 5 个带羽化的指甲遮罩（由 OpenCV 自动生成，再用 `?calibrate` 模式手动微调）。
  - 定番切换：在遮罩里把变体照片按"从甲根到甲尖"的方向擦入。
  - 瓶子：抠好的 PNG / WebP，下面加柔和的接触阴影。用 GSAP Draggable + InertiaPlugin 做惯性和吸附；追焦效果用 CSS 的 `filter: blur()` 和 `scale`。
- **セルフデザイン 的着色**：用一个轻量的 WebGL 片元着色器（不需要 three，几十行代码）。输入是甲型图的明暗、指甲遮罩、目标颜色，在 Lab 色彩空间里保留明暗、只换色相和饱和度，所以高光和阴影都是照片里真实的。质感用叠加纹理（闪粉、珠光、猫眼光带），饰品是抠好的 PNG，贴在每根手指的锚点上。
- **性能**（Grok 底线）：首屏 JS（gzip）≤ 200KB；手机 4G 下 LCP ≤ 2.5s；中端安卓 ≥ 50fps；手机 dpr 上限 1.5；控制台干净，没有无效的预加载。

---

## 6. 文字规则（沿用 Grok 修改单）
- 零说明文字：不写"请滑动""请旋转"之类的提示，不加区块编号，不写解释性副标题，不写长段说明。需要引导时只用光、轻微的动、景深和镜头。
- 允许出现的文字：
  - 品牌名
  - 不超过 3 处的诗性短句：「ひらいてみてください。」「花びらが、指先に。」「もっと、あなただけの一枚を。」（最后这句只能出现在设计卡之后）
  - 款名、价格、目安时间
  - 顶栏导航
  - 设计卡上的番号和设计名
  - 图片上克制的「イメージ」标记
- 网站上完全不提 AI。

---

## 7. 验收标准
- **写实**：花、手、指甲、甲油瓶、饰品、卡片全部像真实拍摄的。页面上没有任何 CG 质感的物体。
- **一镜到底**：从花到设计卡，是同一只手、同一个空间、同一束光、一条连续的镜头，中间没有硬切，也没有"新章节重新开场"的感觉。
- **花瓣**：是真的花瓣，准确落在 5 个指甲上，然后变成短凝胶甲。375 和 1440 两个宽度都成立。
- **定番**：滑动甲油瓶流畅，有追焦效果；美甲切换真实、对齐；12 款一眼能分出来。
- **セルフデザイン**：4 步都是"滑动一排写实物件"，选完自动进入下一步，可以返回。
- **设计卡**：有纸感，可以保存、分享、发 LINE；オーダーメイド 只在卡片之后出现。
- **文字**：符合第 6 节。
- **性能**：符合第 5 节；不再有大的 3D 分包。

---

## 8. 交付顺序
1. **素材**（第 4 节）：先出 `plate` 和 12 款变体、花、`petals-on-nails`、3 段视频、标准瓶和 12 色瓶。**发给用户和 Grok 确认写实度之后，再写代码。**
2. **代码**：镜头 1–4（一镜到底的开场）+ 镜头 5（定番甲油瓶）。
3. **代码**：镜头 6（セルフデザイン）+ 镜头 7、8（设计卡、オーダーメイド）。
