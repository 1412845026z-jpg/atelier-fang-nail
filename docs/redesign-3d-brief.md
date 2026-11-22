# soū nail atelier · 3D 交互改版需求书（v3）

> ⚠️ **已作废（2026-11-22 夜）**：请改看 `docs/v4-photoreal-brief.md`。v4 改为全站写实（真花、真手、真甲油瓶），不再用实时 3D 渲染物体。本文件只作历史参考。

> 给负责美甲部分的模型 / 开发者。写于 2026-11-22，依据是用户的口述需求，以及线上 v2（gh-pages）的实测结果。
> 本文件取代 `docs/gemini-v2-优化指令.md` 里「試着室」那一节。其余工程约定（单一 config、LINE / Instagram 预约消息、designCodec、性能优化）继续有效。

---

## 0. 一句话说清楚要做什么

这不是"带试戴功能的美甲店官网"，而是**一个可以上手玩的指尖化妆台**：
1. 首页：亲手拨开一朵由"花瓣"组成的花苞，花瓣飘落到一只手的指尖上，变成美甲（原创钩子，见 4 · 01）。
2. 化妆台：转动 3D 甲油瓶托盘，手上的美甲跟着变（卖点）。
3. チップ見本：转动 3D 美甲样品环，看这家店能做哪些美甲（产品页）。
4. カウンセリングカード：像填一张漂亮的卡片一样，把想要的款式发给美甲师（咨询 / 预约）。

网站功能本来就不多，核心作用是**展示 + 咨询**。所有操作都是**直接用手（鼠标 / 手指）去拖、转、拉物体**，不是点选项按钮。

**原创要求**：不照搬任何已知广告或品牌的创意。用户之前给过的参考视频（比如从袖口拉出丝带、露出美甲的短视频），只用来说明想要的**感受**——好奇 → 亲手参与 → 惊喜揭晓，以及那种动态和交互的质感。**画面和点子必须是我们自己的**，不能出现"袖口 + 丝带 + 拉出手"这一类组合。

---

## 1. v2 的问题（2026-11-22 线上实测）

1. **交互方向错了**：试着室做成了传统配置器——标签页（形 / 長さ / 色・質感 / アート）、按钮网格、一排"小指 / 薬指 / 中指…"按钮。用户要的是直接操作物体的 3D 交互，不是点按钮切换。
2. **美甲不好看，不像市面上的美甲**：指甲是代码画的白色长条色块，没有凝胶的厚度和光泽；而且没对齐，小指和拇指的甲片浮在手指外面。
3. **手不对**：底图里的手骨节粗、青筋明显、手掌宽，五指张开摊平在粗糙的洞石上，像 X 光片的摆法，不像女性的手，也没有美感。
4. **首页没有钩子**：只是把品牌名压在一只模糊的手上，"揭纸"效果几乎看不出来。用户要的是一个能亲手参与、带来好奇和惊喜的**原创**钩子。
5. **风格不对**：燕麦米色 + 深可可 + 雾蓝，是中性的北欧 / Aesop 风。用户要的是**日本美容行业的女性向高级感**。
6. **菜单区和 5 层构造区**：菜单还是"左文字右大图"的传统排版；5 层构造是一叠半透明的抽象片，和"能做哪些美甲"没有关系。

**保留**：React + Vite + TS 工程、Lenis、`src/config.ts` 单一数据来源、LINE / Instagram 预约消息拼接、`designCodec`（设计编码进网址）、`exportDesignCard`、JP / EN 双语、AVIF / WebP 图片优化。

---

## 2. 风格：日本美容行业的女性向高级感

**参考的气质**（只参考气质，不抄设计）：uka（日本的美甲护理品牌和沙龙）、SUQQU、Clé de Peau Beauté、ADDICTION，再加三成 JILL STUART Beauty 的"甜"，以及日本高级美甲沙龙的 Instagram。

**关键词**：やわらかい光、透明感、ちゅるん、上品、大人可愛い、余白。

**不要**：大面积粉色渐变、爱心、满屏闪粉、堆砌的手写花体字、卡通、霓虹色、廉价的"公主风"。

### 配色（替换现有 5 色）
| 用途 | 名称 | 色值 |
|---|---|---|
| 底色 | シアーミルク | `#F7F1EE` |
| 第二底色 | ピンクベージュ | `#EFE3DE` |
| 主文字 | ローズブラウン | `#3B2B2C` |
| 次要文字 | | `#7E6B6C` |
| 强调色（按钮、选中、细线） | くすみローズ | `#C9989A` |
| 点缀（只用在 1px 线、编号、瓶盖） | シャンパンゴールド | `#C7A97F` |
| 深色段（可选） | ボルドーブラウン | `#2A1D1F` |

### 字体
- 日文标题：Zen Old Mincho 或 Shippori Mincho B1，用细字重。
- 英文：Cormorant Garamond，斜体只用来点缀。
- 正文：Zen Kaku Gothic New 或 Noto Sans JP，字重 300–400。
- 编号：不再用等宽字体，改用 Cormorant Garamond 的数字，字距 0.12em。

### 画面质感
- 光：高调、柔和的窗光，带一点粉色的暖。
- 道具和材质：缎面、欧根纱、薄纱、珍珠、玻璃、镜面托盘、白色或浅粉色的花（毛茛、香豌豆）。

### 文案语气
柔和的丁宁语，句子要短。例如：
- 「そっと、引いてみてください。」
- 「指先に、季節をひとつ。」
- 「迷ったら、まず相談だけでも。」

---

## 3. 手和美甲的审美标准（全站通用，最重要的一节）

### 手
- **日本女性的手**：手指纤长、骨节小、指尖略细；皮肤细腻有透明感，肤色明亮、带一点粉；不能有明显的青筋和干纹。
- **姿势要优雅**：手指微微弯曲，自然并拢或轻轻错开，手腕略转。不要五指张开摊平在桌面上。
- **配饰**：细金链手链、细戒指，不能抢指甲的风头。

### 美甲：必须像日本沙龙里的凝胶美甲
- 是**凝胶（ジェル）**：有厚度，表面像水一样饱满（ちゅるん、うる艶），甲根边缘干净，没有溢胶。
- **长度**：日本主流是ショート～ミディアム（自由边超出指尖 1–3mm）。
- **形状**：ラウンド / オーバル / スクエアオフ / ショートアーモンド。长尖甲最多做 1–2 款。
- **款式**：见第 5 节的 12 款，都是市面上真实流行的款式。
- **绝对不能**：代码画的平面色块；贴纸感；指甲浮在手指外面；所有款式都是同一种长杏仁形。

### 结论（技术路线）
**指甲由图像模型生成真实照片，代码只负责交互。**不要再用 SVG 或 Canvas 画指甲本体。
唯一的例外：マグネット、パール、ミラー这几款的"会动的高光"，可以用代码叠加一层，并且只限在指甲遮罩范围内。

---

## 4. 页面结构和交互

整体流程：**01 花苞 → 02 化妆台 → 03 チップ見本 → 04 美甲师与沙龙 → 05 カウンセリングカード → 页脚**

顶栏只保留 4 个入口：ネイルを選ぶ / デザイン / サロン / 相談・予約。

### 01 首页钩子：花びらが、ネイルになる（原创）

**要给人的感受**：好奇（这是什么？）→ 亲手参与（是我在打开它）→ 惊喜揭晓（原来花瓣就是指甲）。

**画面**：浅粉米色的空间正中，浮着一朵闭合的花苞。它由 15–20 片饱满有光泽的"花瓣"组成，颜色是半透明的乳白、裸粉和淡玫瑰色。这些花瓣其实就是美甲甲片：和 03 チップ見本用的是同一种 3D 甲片几何体和凝胶材质。花苞像呼吸一样轻轻起伏。画面上的文字只有一行「ひらいてみてください。」。

**交互**：
- 在花苞上拖动（电脑用鼠标，手机用手指），方向不限。拖动的距离累积成"绽放进度"（0–1）。拖动要有阻力，用阻尼曲线（例如 `progress = 1 - exp(-d / k)`）。花瓣从外层到内层依次松开。
- 松开的花瓣带物理效果脱落：轻微旋转，受重力和一点"风"的影响，像花瓣一样缓缓飘落，翻面时会反光。风向就是手指或鼠标划过的方向。
- 花苞开到一半时，中心露出一只女性的手（真实照片），手指轻轻搭在缎面上，指甲还是素甲。
- 松手：
  - 进度 < 0.5：花瓣慢慢合拢回去。用 spring，但不能弹过头。
  - 进度 ≥ 0.5：自动绽放到底。
- **揭晓（高潮）**：最后 5 片花瓣不落下，而是在空中翻转、缩小，依次准确地落到 5 根手指的指甲上。落点用 02 化妆台校准好的指甲坐标。每落定一片，就在那个指甲遮罩里淡入真实照片里的美甲，同时一道柔光扫过；手机端如果支持，调用 `navigator.vibrate(8)`。到这里，观众才意识到：花瓣就是指甲。
- 5 片都落定后，出现品牌名 soū 和一句话（例：「花びらが、指先に。」），下面两个入口：「ネイルを選ぶ」跳到 02，「相談する」跳到 05。
- **第二次访问**：用 localStorage 记住，直接显示完成状态，角落放一个「もう一度」。
- **兜底**：开启 `prefers-reduced-motion`、或者没有 WebGL 时，直接显示完成状态的静态图。
- **键盘**：焦点在花苞上时，按 Enter 自动绽放。

**为什么选这个**：
- **原创**：甲片和花瓣的形状本来就像（杏仁形、椭圆形），"花瓣变成指甲"是我们自己的视觉比喻，不借用任何广告。
- **和日本女性向审美一致**：花、柔光、透明感。
- **技术上复用**：花瓣 = 03 的 3D 甲片，落点 = 02 的指甲校准坐标，手 = 02 的同一张底图和变体照片。不需要 AI 视频。

**备选方向**（如果用户想换，都保持"好奇 → 参与 → 揭晓"这个结构）：
- **くもりガラス**：画面是一块起雾的玻璃，像泡完澡的浴室镜子，水珠缓缓流下。用户用手指或鼠标擦掉雾气，玻璃后面是一只轻贴在玻璃上的手，指甲刚做好。擦得越多越清楚，擦到一定面积，雾气整体散开。
- **ミルクの水面**：一池乳粉色、像凝胶一样的液面。手指划过会泛起涟漪（WebGL 水波着色器）。划得越多，一只手就从液面下慢慢浮上来，指甲带着"ちゅるん"的水光。
- **ボトルを回す**：一只巨大的甲油瓶。用户用画圈的手势拧开瓶盖，把刷子拉出来，一滴甲油落下，在手上晕开成美甲。

### 02 化妆台：くるくるパレット（转动甲油瓶，换美甲）—— 卖点

**画面**：上半部分是一只优雅摆放的女性手（真实照片），手指搭在一块浅粉色缎面软垫上。下半部分是一个**真 3D** 的镜面圆形托盘，像香水柜台上的旋转托盘，边缘立着一圈 12 瓶甲油（Three.js 实时渲染的玻璃瓶）。

**交互**：
- 左右拖动托盘（手机横滑），托盘带惯性旋转，停下时自动吸附到最近的一瓶。正对镜头的那一瓶就是当前选中。
- 选中的那瓶轻轻升起 8px，瓶盖旋开一点；瓶身标签显示设计名（例：No.03 マグネット・ラベンダー）。
- 手上的美甲同时切换：用"刷子刷过"的遮罩从甲根刷到甲尖，5 根手指依次刷，间隔 60ms，把照片换成这一款。
- マグネット、パール、ミラー款：手指或鼠标在手上移动时（手机用陀螺仪），指甲上的高光或猫眼光带跟着移动。这层由代码叠加，只在指甲遮罩里显示。
- 托盘角落只放 3 个文字链接：「このネイルで相談」「画像を保存」「詳しく見る」（跳到 03 里对应的那片甲片）。
- **不要**：标签页、颜色网格、手指选择按钮条、形状按钮。

**3D 实现**：
- 依赖：`three`、`@react-three/fiber`、`@react-three/drei`、`@use-gesture/react`。
- 瓶身：`LatheGeometry` 做玻璃瓶，材质 `MeshPhysicalMaterial`（transmission 1、roughness 0.05、ior 1.5、thickness 0.6）；瓶内一层液体网格，颜色用该款的主色。瓶盖用金色金属（roughness 0.25）或黑色。
- 托盘：drei 的 `<MeshReflectorMaterial>` 做镜面。环境用 `<Environment preset="studio">`，再加柔和的 `<ContactShadows>`。
- 手势：`useDrag`，带惯性和吸附。

**美甲切换的实现（决定好不好看的关键）**：
- 同一只手、同一个姿势，用图像模型生成 12 张"只换指甲"的照片（第 6 节有提示词）。这样每一款都是真实、好看、像市面上的凝胶美甲。
- 生成时手可能有细微位移。解决办法：预先为 5 根手指画好**带羽化的指甲遮罩**（SVG path，比指甲略大），每张变体照片只把遮罩里的指甲部分贴到底图上；切换时只在遮罩里做刷子擦除过渡。
- 做一个 `?calibrate` 模式，可以拖动调整 5 个遮罩的位置和形状。
- 12 张生成好以后人工检查对齐，对不齐的重新生成。

### 03 能做哪些美甲：チップ見本（产品页）

**概念**：日本的美甲沙龙都有"ネイルチップ見本"——贴满样品甲片的展示板，或者扇形的样品环。把它做成 3D。

**画面**：一个 3D 的扇形或环形样品架，整齐排着几十片甲片（每片贴的都是真实的设计图），按类别分组：ワンカラー / フレンチ / マグネット / ニュアンス / アート / パーツ / ケア。

**交互**：
- 拖动旋转样品环（或滑动扇面）。鼠标悬停的那一片微微抬起，并转向镜头。
- 点一片：镜头推近，这片甲片放大到屏幕中央，缓慢自转展示光泽。旁边浮出：设计名、菜单类别、目安時間、料金、「このデザインで相談」「化粧台で試す」（02 里有这一款时才显示）。
- 切换类别也是在环上拖动或用滚轮，不做筛选按钮。小屏幕上用一行可以横滑的类别文字。

**实现**：
- 甲片几何体是一块弯曲的平面：横向有 C 弧，纵向轻微弯曲，边缘按甲型裁出圆角。正面贴设计图（来自第 6 节的样品图），材质加 clearcoat 1，做出凝胶的光泽。
- 价格和时间只从 config 读取（单一数据来源）。
- 页面 HTML 里同时输出一份**普通文字的菜单表**，放在「一覧で見る」折叠里，供 SEO、GEO 和读屏软件使用。

### 04 美甲师与沙龙（静态，但要精致）
- 美甲师不露脸，只出现她工作中的手（拿着笔刷、正在涂甲）。
- 一段简短的第一人称自我介绍、资格（JNEC / JNA 检定等，按真实情况填写）、沙龙照片（预约制、一对一、卫生）。
- 用户说过功能不多，这一节简单即可。

### 05 咨询表：カウンセリングカード

**概念**：日本沙龙在客人第一次到店时，都会请对方填"カウンセリングシート"。把它做成一张有质感的卡片（像高级信纸，带烫金细线）。一次只问一个问题，像翻页一样往下走。

**问题**（尽量用点选大图或卡片回答，最后才需要打字）：
1. 想做的设计：自动带入在 02 或 03 里最后选的那一款（显示缩略图），可以更换，也可以选「相談して決めたい」。
2. 长度和形状：5 个小甲型剪影 + 一条长度滑块，拖动时剪影实时变长。
3. 爪のお悩み（可多选）：薄い・割れやすい・二枚爪・自爪が短い・特になし。
4. 職場や生活：オフィス向け・指先をよく使う・特になし。
5. 希望日：日历选择，也可以选「未定」。
6. 名前（可以用昵称）+ 联系方式（LINE / Instagram）。

**最后一步**：生成消息预览。LINE 走预填消息；Instagram 先复制文字，再打开私信。消息里附上设计链接（designCodec）。

**翻页动画**：卡片像纸一样翻过去（3D rotateY，带纸张阴影）。

### 页脚
FAQ（卸甲费用、能保持多久、预约变更和取消、支付方式）、交通、营业时间。FAQ 同时输出 JSON-LD `FAQPage`。

---

## 5. 12 款美甲（化妆台和チップ見本共用）

| No. | 名称 | 给图像模型的描述 | 菜单类别 |
|---|---|---|---|
| 01 | ちゅるんミルクベージュ | sheer milky beige jelly gel, ultra glossy, short round | ワンカラー |
| 02 | くすみピンク | dusty rose pink one-color gel, glossy, short oval | ワンカラー |
| 03 | マグネット ラベンダー | lavender magnetic cat-eye gel with a soft diagonal shimmer band, medium oval | マグネット |
| 04 | ミラーフレンチ | sheer nude base with thin silver mirror-chrome French tips, short square-off | フレンチ |
| 05 | 極細フレンチ | sheer pale pink base with an ultra-thin white French tip line, short round | フレンチ |
| 06 | ニュアンスマーブル | milky white and greige marble with a few flakes of gold foil, medium oval | ニュアンス |
| 07 | うる艶ボルドー | deep glossy bordeaux one-color, medium round | ワンカラー |
| 08 | シアーグレージュ | sheer greige one-color, glossy, short oval | ワンカラー |
| 09 | オーロラパール | sheer white with iridescent aurora powder (pearly pink-blue shimmer), short oval | オーロラ |
| 10 | パールパーツ | sheer pink base; ring finger has three small pearls and a tiny gold stud near the cuticle | パーツ |
| 11 | べっ甲アクセント | sheer beige base; two accent nails with tortoiseshell pattern and a thin gold line | ニュアンス |
| 12 | ラメグラデーション | sheer nude with a fine champagne-gold glitter gradient from the tip | グラデーション |

价格和时间写在 `src/config.ts`，按菜单类别计算，不要写死在组件里。

---

## 6. 素材清单和生成提示词

**原则**：先做素材，用户确认好看以后再写代码。素材不好看，代码做得再好也没用。

### 6.1 首页花苞（不需要视频）
- **手**：直接用 6.2 的 `hand-base.jpg`（素甲），揭晓后的美甲用其中一张变体。默认用 No.01 ちゅるんミルクベージュ 或 No.05 極細フレンチ。
- **花瓣**：由代码生成（3D 甲片 + 凝胶材质），颜色从 12 款里取 3–4 种柔和的颜色。
- **首屏静态图**：3D 加载完之前先显示它，同时作为 LCP 图片。可以按 6.4「01 花苞」的效果参考图生成，也可以直接从 3D 画面导出一帧。

### 6.2 化妆台的手（1 张底图 + 12 张变体）

**hand-base.jpg（底图）**
```text
Photorealistic high-end Japanese nail salon advertisement photo, 4:3 landscape, very high resolution. A slender young Japanese woman's left hand resting gracefully on a pale blush satin cushion, back of the hand facing the camera, fingers gently extended and slightly fanned with soft natural curves, wrist turned slightly, all five nails clearly visible and not overlapping. Shot from slightly above (about 60 degrees). Short soft-oval natural nails with clean cuticles and only a clear glossy top coat. Delicate slim fingers, small knuckles, smooth luminous skin with a soft pink undertone, no visible veins. A thin gold ring on the index finger. Soft high-key diffused light, light pink-beige background with out-of-focus sweet pea flowers and a strand of pearls at the edge. Airy, translucent, elegant. Realistic, exactly five fingers. No text, no watermark.
```

**变体模板（每款一次：上传底图，把 [ ] 换成第 5 节里对应的描述）**
```text
Keep this photo exactly the same: same hand, same pose, same fingers, same skin, same ring, same lighting, same background, same framing. Change ONLY the nails to: [design description]. The nails are a professional Japanese gel manicure: smooth, thick, glossy surface with a liquid "churun" shine, a clean cuticle line, even thickness, and a natural free edge about 2 mm beyond the fingertip, [shape]. Do not change anything else.
```

### 6.3 チップ見本的甲片贴图（每款 1 张）
```text
A single gel press-on nail tip, [shape], designed as: [design description]. Photographed straight on from above on a pure white seamless background, soft even studio light, sharp focus, high resolution. No hand, no text.
```
生成后抠图，作为 3D 甲片的贴图。

### 6.4 效果参考图（写代码前先生成，用来统一"目标长什么样"）
**01 花苞**
```text
Photorealistic concept visual for a luxury Japanese nail salon website hero: a closed flower bud floating in a soft blush-beige space, its petals made of glossy translucent gel nail tips in milky white, nude pink and pale rose, a few petals drifting away; behind it, softly out of focus, a slender woman's hand resting on blush satin. High-key soft light, airy, elegant, feminine. No text.
```

**02 化妆台**
```text
Photorealistic concept visual for a luxury Japanese nail salon website: in the upper half, a slender woman's elegant hand rests on a blush satin cushion, showing a glossy lavender magnetic gel manicure; in the lower half, a round mirrored vanity tray holds a ring of twelve small luxury glass nail polish bottles with gold caps in soft pastel and nude colors, the front bottle slightly raised. Soft pink-beige palette, high-key light, airy and elegant. No UI text.
```

**03 チップ見本**
```text
Photorealistic concept visual: a fan-shaped display of about thirty gel nail sample tips in refined Japanese salon designs (milky beige, dusty pink, mirror French, marble with gold foil, aurora pearl, tortoiseshell), neatly arranged in an arc on a pale blush background, one tip lifted forward and slightly rotated to catch the light. Soft studio light, glossy gel surfaces, elegant and feminine. No text.
```

**05 カウンセリングカード**
```text
Photorealistic flat lay: a thick cream-colored counseling card with a thin gold foil border on blush silk, a few nail sample tips and a pearl strand beside it, soft morning light, elegant Japanese stationery aesthetic. No readable text.
```

### 6.5 美甲师工作照、沙龙照（可选）
只拍或只生成手和工作台，不出现脸。

---

## 7. 技术要求

- 在现有工程上改，新增依赖：`three`、`@react-three/fiber`、`@react-three/drei`、`@use-gesture/react`。
- 每个 3D 区块单独懒加载（`React.lazy` + `IntersectionObserver`，进入视口前一屏才开始加载）。首屏先显示花苞的静态图，3D 花苞的代码随后加载，加载完再无缝替换。
- 性能目标：手机 4G 下 LCP ≤ 2.5s；3D 区块在中端安卓手机上 ≥ 50fps；手机 dpr 上限 1.5；首屏 JS（gzip）≤ 200KB，3D 代码块不计入。
- 降级：没有 WebGL、低端设备或开启 `prefers-reduced-motion` 时，切换到 2D 版本——同样的照片和切换效果，只是没有 3D 托盘和样品环。
- 可访问性：所有拖拽交互都要有键盘替代（← → 切换瓶子、Enter 选中；首页花苞按 Enter 自动绽放）。
- SEO / GEO：菜单、价格、FAQ、店铺信息必须以文字形式出现在 HTML 里；JSON-LD 包括 `NailSalon` 和 `FAQPage`。
- 删除：
  - 用 SVG 画指甲本体的展示代码（`NailSvgLayer`、`nailGeometry` 用于展示的部分）。只保留マグネット / パール高光叠加需要的那部分。
  - 试着室的标签页和按钮网格 UI。
  - 5 层构造区（`ExplodedNail`），被 03 チップ見本取代。
- 店铺信息（东京都目黑区、¥6,000–¥9,000、LINE ID 等）上线前要请用户确认是否真实。

---

## 8. 验收标准

- **首页**：拖动能让花苞绽开；松手后合拢或自动绽放，手感自然；最后 5 片花瓣准确落到 5 个指甲上；手机和电脑都能操作。
- **原创**：全站没有照搬任何已知广告的画面或点子，没有"袖口 + 丝带 + 拉出手"这一类组合。
- **化妆台**：拖托盘转瓶子流畅；美甲切换后是真实照片、对齐、好看；12 款都像日本沙龙的真实款式。
- **チップ見本**：能旋转、能点开、能看到价格和时间、能跳到咨询。
- **咨询卡**：一题一页，最后生成 LINE / Instagram 消息，并附带设计链接。
- **整体**：女性向、高级、不俗气；所有出现的手都是纤细的女性手。
- 控制台 0 报错；375 和 1440 两个宽度都没有横向滚动条；性能达到第 7 节的目标。

---

## 9. 交付顺序（建议分 3 次提交）

1. **素材**：先生成化妆台的手（底图 + 12 张变体）和效果参考图，发给用户确认好看，再开始写代码。
2. **代码**：首页花苞 + 化妆台。
3. **代码**：チップ見本 + 咨询卡 + 全站风格统一。
