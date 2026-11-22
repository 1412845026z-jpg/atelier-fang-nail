# 放大测试（2026-11-22，v4r2 `plate.jpg`，1376 → 2752）

每张对比图都是 100% 局部，从左到右：普通放大 / Real-ESRGAN / 脚本结果。

- `plate-compare-blend.jpg`：没有指甲遮罩，整张图用 60% Real-ESRGAN + 40% 普通放大 + 2% 颗粒。
- `plate-compare-masked.jpg`：加了一个**粗略的测试用指甲遮罩**，指甲区域只用 Real-ESRGAN。正式的遮罩以后用 OpenCV 从变体和底图的差异自动生成。

结论：只用 Real-ESRGAN，皮肤和亚麻会出现塑料感；但指甲用它最清楚。所以分区处理。脚本和用法见 `scripts/assets/README.md`。
