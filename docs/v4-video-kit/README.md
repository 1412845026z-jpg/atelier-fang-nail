# soū nail atelier · v4 视频生成素材包（Google Flow / 可灵首尾帧）

本文件夹包含一镜到底开场（镜头 1–4）所需的全部静态首尾关键帧。所有关键帧均裁切或编辑自同一张连续母版长图 `public/media/v4/master.jpg`，保证台面、光线、色温与手部位置 100% 连续无跳切。

---

## 1. 首尾帧对应表

| 视频 | 输出文件名 | 首帧（Start Frame） | 尾帧（End Frame） | 建议时长 |
|---|---|---|---|---|
| **视频 A**：花苞绽放，花瓣飘落，镜头下移 | `a.mp4` | `flower.jpg` | `mid-petals.jpg` | 6 秒 |
| **视频 B**：花瓣继续飘落，落到 5 个指甲上 | `b.mp4` | `mid-petals.jpg` | `petals-on-nails.jpg` | 5 秒 |
| **视频 C**：花瓣融化成凝胶甲，一道柔光扫过 | `c.mp4` | `petals-on-nails.jpg` | `plate.jpg` | 4 秒 |

*(可选首屏呼吸循环视频 `loop.mp4`：仅上传 `flower.jpg` 作为首帧，生成 4 秒花朵在窗光里极轻微呼吸颤动的画面即可。)*

---

## 2. 逐段提示词（直接复制到 Google Flow / 可灵）

### 视频 A（`flower.jpg` → `mid-petals.jpg`，6 秒）
```text
Slow, elegant, photorealistic. The dusty rose-mauve ranunculus flower in the matte ceramic vase slowly blooms open; several dusty rose petals gently detach and drift downward through the air; the camera smoothly tilts down along the matte off-white linen table, following the falling petals. Soft side window light from the left, warm 5000K, no cuts. 6 seconds.
```

### 视频 B（`mid-petals.jpg` → `petals-on-nails.jpg`，5 秒）
```text
The camera continues to tilt down smoothly along the matte linen table, following the drifting dusty rose ranunculus petals, and arrives at a woman's hand resting naturally on the linen and washi paper; five petals float down and settle softly, one onto each of the five fingernails. Smooth continuous motion, constant speed, photorealistic, soft left window light, no cuts. 5 seconds.
```

### 视频 C（`petals-on-nails.jpg` → `plate.jpg`，4 秒）
```text
Static camera, no camera movement. The five dusty rose ranunculus petals resting on the fingernails slowly soften and melt seamlessly into a smooth, plump, glossy "churun" dusty rose gel manicure, their color sinking naturally into the nails; finally a gentle glint of window light sweeps across the five nails. Photorealistic, calm, no cuts. 4 seconds.
```

---

## 3. 生成后如何接入网站（零改代码自动切换）

将生成的视频文件命名为：
- `public/media/v4/video/a.mp4`
- `public/media/v4/video/b.mp4`
- `public/media/v4/video/c.mp4`
- *(可选首屏呼吸)* `public/media/v4/video/loop.mp4`

直接放入仓库 `public/media/v4/video/` 目录即可。前端在启动时会自动探测这些视频文件：
- **未放入视频时（当前默认）**：自动使用连续母版长图下移 + 关键帧柔化过渡 + 指甲遮罩从甲根到甲尖的融化擦入与扫光。
- **放入视频后**：无需修改任何代码，自动无缝切换为滚动驱动的三段连续写实视频序列。
