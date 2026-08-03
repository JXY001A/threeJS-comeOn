---
title: 场景、相机、渲染器
order: 1
group:
  title: 核心概念
  order: 1
---

# 场景(Scene)、相机(Camera)、渲染器(Renderer)

Three.js 的三要素：**场景**、**相机**、**渲染器**，构成了所有 3D 应用的基础。

## 在线 Demo

<code src="../../scene-camera-renderer/index.tsx"></code>

## 核心概念

### Scene（场景）

场景是所有 3D 物体的容器。你可以把它想象成一个**舞台**，所有物体、光源都要添加到场景中才能被渲染。

```typescript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
```

### Camera（相机）

相机决定了**从哪个角度观察场景**。`PerspectiveCamera`（透视相机）模拟人眼效果——近大远小。

```typescript
const camera = new THREE.PerspectiveCamera(
  75,                                    // 视野角度（FOV）
  window.innerWidth / window.innerHeight, // 宽高比（aspect）
  0.1,                                   // 近裁剪面（near）
  1000,                                  // 远裁剪面（far）
);
camera.position.z = 5;
```

参数说明：
| 参数 | 说明 | 默认建议 |
|------|------|---------|
| FOV | 视野角度，度数 | 45~75 |
| aspect | 宽高比 | 通常用窗口宽/高 |
| near | 近裁剪面 | 0.1 |
| far | 远裁剪面 | 1000 |

#### 近裁剪面（near）与远裁剪面（far）详解

`near` 和 `far` 定义了相机**能看到多近和多远**。只有位于 `near` 和 `far` 之间的物体才会被渲染，之外的物体会被裁剪掉（不绘制）。

```
       near                   far
  ──────┼──────────────────────┼──────▶
  相机   │    可见区域（被渲染）   │
 位置  0.1                   1000
  （裁剪掉）                 （裁剪掉）
```

- **near（近裁剪面）**：相机镜头前方最近能看到多远。小于此距离的物体会被裁掉。
  - 值过小（如 `0.0001`）：导致**深度冲突**（z-fighting），远近物体重叠闪烁。
  - 值过大（如 `10`）：离相机近的物体会被裁掉，看起来像是"穿模"了。

- **far（远裁剪面）**：相机能看到的最远距离。超出此距离的物体会消失。
  - 值过大（如 `100000`）：降低深度缓冲区精度，同样会引发 z-fighting。
  - 值过小（如 `50`）：远处的物体会突然消失，出现"远景裁剪"现象。

> 经验法则：`near` 设大一点（`0.1`~`1`），`far` 不要太夸张（`1000`~`5000`），两者比值控制在 `10000` 以内以保证深度精度。

### Renderer（渲染器）

渲染器将场景和相机结合起来，输出到 `<canvas>` 元素上。

```typescript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```

### 动画循环

通过 `requestAnimationFrame` 实现连续渲染，让物体动起来。

```typescript
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

## 阶段一：图形学基础

> 理解下面的图形学知识，能帮你真正看懂 Three.js 每一行代码在做什么，而不是"照着写"。

### 1. 坐标系（Coordinate Systems）

3D 渲染中，一个顶点从定义到最终显示在屏幕上，需要经历多次坐标变换。每个阶段都有自己独立的坐标系：

```
模型空间        世界空间         相机空间        裁剪空间        屏幕空间
┌──────┐      ┌──────┐        ┌──────┐        ┌──────┐        ┌──────┐
│ 顶点  │ ───▶ │ 世界  │  ───▶  │ 相机  │  ───▶  │ 裁剪  │  ───▶  │ 屏幕  │
│ 坐标  │  M   │ 坐标  │   V   │ 坐标  │   P   │ 坐标  │ 视口  │ 坐标  │
└──────┘      └──────┘        └──────┘        └──────┘        └──────┘
 Model          World           View           Clip           Screen
 Matrix         Matrix          Matrix         Space          Space
```

| 空间 | 含义 | 坐标系特征 |
|------|------|-----------|
| **模型空间** | 物体自身坐标系，原点在物体中心 | 局部坐标 |
| **世界空间** | 所有物体共享的全局坐标系 | 原点统一 |
| **相机空间** | 以相机为原点的坐标系，相机看向 -Z 方向 | 相机相对 |
| **裁剪空间** | 投影后的标准化空间，超出范围的被裁掉 | 范围 [-1, 1]³ |
| **屏幕空间** | 最终显示在屏幕上的像素坐标 | 像素坐标 (x, y) |

> Three.js 中 `camera.position.z = 5` 的意思是：把相机放在世界坐标系的 Z=5 处，看向原点。相机默认朝 -Z 方向看。

### 2. MVP 变换矩阵（Model-View-Projection）

这是 3D 渲染的核心公式：

```
clipPos = P × V × M × localPos
```

（`×` 表示矩阵乘法）

三个矩阵各司其职：

#### M 矩阵（Model Matrix，模型矩阵）

将顶点的**局部坐标**变换为**世界坐标**。控制物体的位置、旋转、缩放。

```
例：cube.position.set(2, 0, 0)  →  立方体移动到世界坐标 (2, 0, 0)
   cube.rotation.y = 0.5        →  立方体绕 Y 轴旋转 0.5 弧度
   cube.scale.set(2, 2, 1)      →  立方体 X、Y 方向放大 2 倍
```

Three.js 中 `object.position/rotation/scale` 三个属性值最终会合成一个 **4×4 齐次矩阵**，用于 M 矩阵变换。

#### V 矩阵（View Matrix，视图矩阵）

将**世界坐标**变换为**相机坐标**。等价于"把整个世界反向移到相机面前"。

```
相机位置 (0, 0, 5)、看向原点：
→ V 矩阵 = 把整个世界沿 -Z 平移 5 个单位
→ 世界原点 (0,0,0) 变成相机空间的 (0, 0, -5)，正好在相机前方
```

Three.js 中 `camera.position` 和 `camera.lookAt(...)` 共同决定了 V 矩阵。

#### P 矩阵（Projection Matrix，投影矩阵）

将**相机空间的 3D 坐标**投影为**裁剪空间的 2D 坐标**，同时保留深度信息。这是 `PerspectiveCamera` 参数的核心数学所在。

**透视投影矩阵的构成**：

```
        ┌                                          ┐
        │ 1/(tan(FOV/2)·aspect)     0           0  0 │
        │           0         1/tan(FOV/2)     0  0 │
  P  =  │           0               0       A    B │
        │           0               0       -1   0 │
        └                                          ┘

其中：
  A = -(far + near) / (far - near)
  B = -2·far·near / (far - near)
```

理解这个矩阵的关键点：

- **FOV（视野角度）**出现在 `1 / tan(FOV/2)` 中 — FOV 越大，分母越大，投影后的坐标越小，画面中看到的范围越广（广角镜头效果）。
- **aspect（宽高比）**纠正 X 方向的拉伸，保证正方形在屏幕上不变形。
- **near/far** 出现在第三行 — 负责将 Z 坐标从 [near, far] 映射到 [-1, 1]（NDC 空间），这个过程是非线性的。

### 3. 透视投影的视锥体（Frustum）

```
                     far（远裁剪面）
                    ┌─────────┐
                   /         /│
                  /         / │
      near      /         /  │
     ┌────┐    ┌─────────┐   │
     │    │   / 可见区域 /   │
     │相机│  /         /     │
     │    │ /         /      │
     └────┘└─────────┘───────┘
     ──── near ─────── far ──▶
```

`PerspectiveCamera` 的四个参数定义了一个**平截头体**（frustum）：
- 相机在锥体顶点
- near 平面截出近端矩形
- far 平面截出远端矩形
- **只有在这个锥体内的物体才会被渲染**

### 4. 从裁剪空间到屏幕：NDC 与视口变换

P 矩阵投影后，GPU 自动执行**透视除法**（除以 w 分量）：

\[
\text{NDC} = \left(\frac{x_{clip}}{w}, \frac{y_{clip}}{w}, \frac{z_{clip}}{w}\right)
\]

结果称为 **NDC（Normalized Device Coordinates，标准化设备坐标）**：

| 轴 | 范围 | 含义 |
|----|------|------|
| X | [-1, 1] | -1 = 屏幕最左，1 = 屏幕最右 |
| Y | [-1, 1] | -1 = 屏幕最下，1 = 屏幕最上 |
| Z | [-1, 1] 或 [0, 1] | 深度值，用于深度测试 |

> 透视除法是"近大远小"的数学本质：w 分量与物体的相机空间 Z 相关，远的物体 Z 大、w 大，除以 w 后坐标变小。

最后**视口变换**将 NDC 映射到屏幕像素：

```
screenX = (ndcX + 1) / 2 × screenWidth
screenY = (1 - ndcY) / 2 × screenHeight   // Y 轴翻转
```

Three.js 中 `renderer.setSize(w, h)` 就是设置视口的尺寸。

### 5. 深度缓冲区（Z-Buffer）

深度缓冲区是 GPU 的一个隐式缓冲区，每个像素存储一个深度值，用于判断哪个像素可见。

```
渲染过程（逐像素）：
1. 计算当前三角形在这个像素的深度值 Z_new
2. 读取深度缓冲区中该像素的深度值 Z_old
3. 如果 Z_new < Z_old → 当前像素更近，写入颜色 + 更新 Z_old
   如果 Z_new > Z_old → 当前像素被遮挡，丢弃
```

**为什么 near 太小会导致 z-fighting？**

NDC 的 Z 值与相机空间的 Z 值不是线性的：

```
Z_NDC ≈ A + B / Z_view

其中 A = (far + near) / (far - near)，B = 2·far·near / (far - near)
```

这是一个**反比例函数**，精度在 near 附近极高、far 附近极低：

```
Z_view  |  0.1  1    10   100  500  1000
Z_NDC   | -1.0  0.8  0.96 0.998 0.9996 1.0
精度    | ████  ██    █    ▏     ▏     极低
```

- 当 `near = 0.0001`、`far = 100000`，大部分深度精度浪费在 near 附近，远处的物体会因为精度不足而"闪烁"
- 这就是为什么 `near` 不宜太小、`far/near` 比值不宜太大

### 6. 渲染管线全貌

```
  JavaScript（Three.js）          │      GPU（WebGL）
──────────────────────────────────┼──────────────────────────────
                                  │
  scene.add(cube)                 │
  camera.position.z = 5           │
  renderer.render(scene, camera) ─┼─▶ 1. 顶点着色器
                                  │      - 应用 M·V·P 矩阵
                                  │      - 输出裁剪空间坐标
                                  │
                                  │   2. 图元装配
                                  │      - 顶点 → 三角形
                                  │
                                  │   3. 光栅化
                                  │      - 三角形 → 像素片元
                                  │
                                  │   4. 片元着色器
                                  │      - 计算每个像素颜色
                                  │      - 纹理采样、光照计算
                                  │
                                  │   5. 深度测试 + 混合
                                  │      - Z-Buffer 判断可见性
                                  │      - 写入帧缓冲
                                  │
                                  │   6. 显示在 <canvas>
```

> Three.js 内部自动处理了大部分 GPU 管线，你只需操作场景中的物体（Scene）、定义观察角度（Camera）、调用 `renderer.render()`，Three.js 会帮你生成对应的 WebGL 指令。

### 7. 理解动画循环中的关键时机

```typescript
function animate() {
  requestAnimationFrame(animate);  // ① 注册下一帧回调（约 16ms 后）

  cube.rotation.x += 0.01;         // ② 更新逻辑（每帧递增旋转角）
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);  // ③ 触发 GPU 渲染管线
}
```

关键理解：
- `requestAnimationFrame` 不是定时器，它**与显示器刷新率同步**（60Hz → 约 16.67ms 一帧）
- **必须把更新逻辑放在 `render()` 之前** — 先改数据，再画画
- 在 ② 阶段更新的是宿主端的矩阵数据，③ 阶段才把这些矩阵发送到 GPU

## 总结

| 要素 | 类比 | 职责 |
|------|------|------|
| Scene | 舞台 | 存放所有物体、光源 |
| Camera | 摄像机 | 定义观察视角 |
| Renderer | 放映机 | 把画面绘制到屏幕上 |

> 三者缺一不可。**Scene** 装东西，**Camera** 选角度，**Renderer** 出画面。
