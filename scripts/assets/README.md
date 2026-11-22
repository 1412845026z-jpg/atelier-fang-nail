# 素材处理脚本

## 放大：`upscale.mjs`

把 1376 宽的手部照片放大到 2K（2752×1536），同时避免 Real-ESRGAN 常见的"塑料皮肤"。

### 为什么这样做（2026-11-22 用 v4r2 的 `plate.jpg` 实测）
对比图在 `docs/v4-assets-review/v4r2/upscale-test/`。

| 方法 | 指甲 | 皮肤 | 亚麻台面 |
|---|---|---|---|
| 普通放大（Lanczos） | 发软 | 有纹理但糊 | 有纹理但糊 |
| 只用 Real-ESRGAN | **最清楚**，高光利落 | **塑料感**，毛孔被磨平 | 布纹被磨平 |
| **本脚本** | 指甲区域用 Real-ESRGAN | 60% Real-ESRGAN + 40% 普通放大 + 2% 颗粒 | 同皮肤 |

- 颗粒用固定的随机种子，每张图完全相同。同一组对齐图里没变的像素放大后仍然一致，切换款式时不会"闪"。
- 结果是确定的：同样的输入和参数，每次输出逐字节相同。

### 第一次使用：安装 Real-ESRGAN
```bash
npm run assets:setup-upscaler
```
从 GitHub 下载开源的 Real-ESRGAN（ncnn-vulkan 版，约 45–52MB，BSD-3 许可），装进 `.tools/realesrgan/`。这个文件夹不进 git，每台电脑运行一次。
如果已经下载过压缩包：`npm run assets:setup-upscaler -- --from-zip 路径/realesrgan-ncnn-vulkan-20220424-macos.zip`

### 用法
```bash
# 一个文件夹里的全部图片（推荐：同一组对齐图一次处理完）
npm run assets:upscale -- public/media/hands --out public/media/hands-2k --mask public/media/hands/nails.mask.png

# 只处理一张，并输出对比图
npm run assets:upscale -- docs/v4-assets-review/v4r2/plate.jpg --out /tmp/up --compare
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--out` | `<输入文件夹>/upscaled` | 输出文件夹 |
| `--width` | `2752` | 输出宽度（16:9 的 2K） |
| `--mix` | `0.6` | 指甲以外 Real-ESRGAN 的比例 |
| `--grain` | `0.02` | 颗粒强度 |
| `--seed` | `20261122` | 颗粒种子。**同一组图必须用同一个值** |
| `--mask` | 无 | 指甲遮罩（白色 = 指甲），整组共用。所有输入必须和它对齐 |
| `--mask-dir` | 无 | 每张图单独的遮罩，命名为 `<文件名>.mask.png` |
| `--feather` | `2` | 遮罩边缘羽化（输出尺寸下的像素） |
| `--compare [区域]` | 关 | 另外输出 `<文件名>.compare.jpg`：普通放大 / Real-ESRGAN / 结果，100% 局部。区域格式 `x,y,w,h;…`（图片宽高的比例），不写时用 plate 的 3 个默认位置 |

### 注意
- **同一组对齐图（plate、12 款、花瓣落甲、9 张甲型图）必须用同一组参数一次处理完**，处理完再跑一次对齐热力图。
- 没有指甲遮罩时，整张图都用 60/40 混合，效果也比单独用任何一种方法好。指甲遮罩做好以后（OpenCV 对比变体和底图自动生成），加上 `--mask` 指甲会更清楚。
- Real-ESRGAN 的原始 4 倍结果每张约 20MB，缓存在 `.tools/cache/esrgan/`（不进 git）。同一张图第二次处理只需约 1 秒，调整参数时不用重跑。
- 在 Apple M1 上，首次处理一张约 1–3 分钟。
- 2K 已经够用：桌面端镜头推近 1.3 倍以内都是清楚的。视频首尾帧不需要放大，保持 1376 原图即可。
