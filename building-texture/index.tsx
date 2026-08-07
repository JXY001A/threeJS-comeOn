import * as THREE from 'three'
// 轨道控制：使相机能够围绕目标旋转、缩放、平移
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// EXR 加载器：Three.js 的 TextureLoader 不支持 .exr 格式，需要专用加载器
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { useEffect, useRef, useState } from 'react'

// ==================== 纹理资源 ====================
// 静态资源统一放在 public/textures/ 下，dumi 构建后映射到根路径 /textures/
const TEXTURE_BASE = '/textures'

// JPG/PNG 等常规图片格式使用 TextureLoader
const textureLoader = new THREE.TextureLoader()

// EXR（OpenEXR）是 HDR 格式，常用于法线贴图、粗糙度贴图等需要高精度数据的场景
const exrLoader = new EXRLoader()

/** 纹理缓存：只加载一次，所有建筑共享 */
interface TexturesPack {
  diffMap: THREE.Texture
  normalMap: THREE.Texture
  roughnessMap: THREE.Texture
}

/**
 * 将 Three.js 加载器的 callback 风格转为 Promise
 *
 * TextureLoader.load() 和 EXRLoader.load() 都是回调风格，
 * 不支持 async/await。需要手动包装为 Promise 才能在 preloadTextures 中使用。
 */
function loadTextureAsync(url: string, loader: THREE.Loader): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    (loader as any).load(url, resolve, undefined, reject)
  })
}

/** 异步预加载所有贴图，三张并行加载，返回纹理对象 */
async function preloadTextures(): Promise<TexturesPack> {
  const [diffMap, normalMap, roughnessMap] = await Promise.all([
    loadTextureAsync(`${TEXTURE_BASE}/square_brick_floor_diff_4k.jpg`, textureLoader),
    loadTextureAsync(`${TEXTURE_BASE}/square_brick_floor_nor_gl_4k.exr`, exrLoader),
    loadTextureAsync(`${TEXTURE_BASE}/square_brick_floor_rough_4k.exr`, exrLoader),
  ])

  // 颜色贴图常见配置
  diffMap.wrapS = diffMap.wrapT = THREE.RepeatWrapping
  diffMap.colorSpace = THREE.SRGBColorSpace

  // 数据贴图配置
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping

  return { diffMap, normalMap, roughnessMap }
}

// ==================== 场景构建函数 ====================

/**
 * 创建带 PBR 贴图的建筑
 *
 * PBR（Physically Based Rendering，基于物理的渲染）工作流中，
 * 材质的外观由多张贴图共同决定，而非单一颜色：
 *
 *   map          → 漫反射/反照率贴图（物体本身的颜色）
 *   normalMap    → 法线贴图（模拟表面凹凸细节，不增加几何面数）
 *   roughnessMap → 粗糙度贴图（控制表面光滑程度，逐像素变化）
 *   metalnessMap → 金属度贴图（控制金属/非金属区域，本例未使用）
 *
 * @param x      建筑中心 X 坐标
 * @param z      建筑中心 Z 坐标
 * @param width  建筑宽度（X 轴）
 * @param depth  建筑深度（Z 轴）
 * @param height 建筑高度（Y 轴）
 * @param tex    预加载的纹理包（所有建筑共享同一组纹理）
 */
const createBuilding = (
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  tex: TexturesPack
) => {
  const geo = new THREE.BoxGeometry(width, height, depth)

  // ---- 克隆纹理以设置每栋建筑独立的 repeat ----
  const diffMap = tex.diffMap.clone()
  diffMap.repeat.set(width / 2, height / 2)
  diffMap.needsUpdate = true

  const normalMap = tex.normalMap.clone()
  normalMap.repeat.set(width / 2, height / 2)
  normalMap.needsUpdate = true

  const roughnessMap = tex.roughnessMap.clone()
  roughnessMap.repeat.set(width / 2, height / 2)
  roughnessMap.needsUpdate = true

  // ---- 组装 PBR 材质 ----
  const mat = new THREE.MeshStandardMaterial({
    map: diffMap,             // 颜色贴图
    normalMap: normalMap,     // 法线贴图
    roughnessMap: roughnessMap, // 粗糙度贴图
    // 金属度：砖墙属于电介质（非金属），用 0.1 即可
    // 若设为 0.8+ 且无环境贴图（envMap），建筑会一片漆黑
    // 原因：高金属度下 80% 颜色来自环境反射，无 envMap = 无反射光源
    metalness: 0.2,
    // 粗糙度基础值设 1.0，让 roughnessMap 完全接管逐像素控制
    roughness: 1.0
  })

  const building = new THREE.Mesh(geo, mat)
  // 几何体位置以其中心为原点，Y 轴偏移 height/2 使建筑底部贴地
  building.position.set(x, height / 2, z)
  building.castShadow = true
  building.receiveShadow = true
  return building
}
//  路灯（CylinderGeometry 杆 + SphereGeometry 灯泡 + PointLight 点光源）
const createStreetLight = (x: number, z: number) => {
  const group = new THREE.Group()

  // 灯杆：圆柱体，金属质感
  const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 5, 8)
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    metalness: 0.5,
    roughness: 0.8
  })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.y = 2.5
  pole.castShadow = true
  group.add(pole)

  // 灯泡：球体，自发光材质模拟发光效果
  const bulbGeo = new THREE.SphereGeometry(0.3, 16, 16)
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0xffdd88,      // 自发光颜色
    emissiveIntensity: 1      // 自发光强度
  })
  const bulb = new THREE.Mesh(bulbGeo, bulbMat)
  bulb.position.y = 5
  group.add(bulb)

  // 点光源：模拟灯泡向外辐射光线
  const pointLight = new THREE.PointLight(0xffcc66, 50, 15)
  pointLight.position.y = 5
  pointLight.castShadow = true
  pointLight.shadow.mapSize.set(512, 512)
  group.add(pointLight)

  group.position.set(x, 0, z)
  return group
}

// 马路：细长的 PlaneGeometry，水平放置
const createRoad = () => {
  const roadGeo = new THREE.PlaneGeometry(4, 60)
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0xffeedd,
    metalness: 0.5,
    roughness: 0.95,
    side: THREE.DoubleSide  // 双面渲染，从下方也能看到路面
  })

  const road = new THREE.Mesh(roadGeo, roadMat)
  // PlaneGeometry 默认竖立在 XY 平面，绕 X 轴旋转 -90° 使其平放在 XZ 地面
  road.rotation.x = -Math.PI / 2
  road.position.set(-4, 0.005, 0)
  road.castShadow = true
  road.receiveShadow = true
  return road
}


/**
 * 初始化“城市一角”3D 场景
 *
 * 包含：场景背景与雾化 → 相机 → 渲染器 → 灯光 → 辅助元素 → 建筑/路灯/马路
 *
 * @param container  挂载 canvas 的容器元素
 * @param cameraType 相机投影方式：perspective（透视）| orthographic（正交）
 * @returns {{ camera, dispose }} 相机实例与销毁函数
 */
export function initScene(
  container: HTMLElement,
  cameraType?: 'perspective' | 'orthographic',
  tex?: TexturesPack
) {
  // ========== 场景 ==========
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)       // 天空蓝
  scene.fog = new THREE.Fog(0x87ceeb, 30, 100)       // 远处雾化，增加景深感

  // ========== 相机 ==========
  let camera = new THREE.PerspectiveCamera(
    75,                                             // FOV 垂直视野角
    container.clientWidth / container.clientHeight,  // aspect 宽高比
    0.1,                                            // near 近裁剪面
    2000                                            // far 远裁剪面
  )
  if (cameraType === 'orthographic') {
    // 正交相机：平行投影，物体不随距离缩放
    // @ts-ignore
    camera = new THREE.OrthographicCamera(-15, 15, 10, -10, 0.1, 200)
  }
  camera.position.set(10, 10, 20)
  camera.lookAt(0, 0, 0)

  // ========== 渲染器 ==========
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true                  // 启用阴影映射
  renderer.shadowMap.type = THREE.PCFSoftShadowMap   // 软阴影，边缘柔和
  renderer.toneMapping = THREE.ACESFilmicToneMapping  // 电影级色调映射
  renderer.toneMappingExposure = 1
  container.appendChild(renderer.domElement)

  // ========== 轨道控制器 ==========
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true       // 惯性旋转
  controls.dampingFactor = 0.05       // 阻尼系数，越小惯性越大
  controls.target.set(0, 2, 0)        // 观察目标点
  controls.update()

  // ========== 光照 ==========
  // 环境光：均匀照亮整个场景，模拟间接光照
  const ambient = new THREE.AmbientLight(0x404060, 1)
  scene.add(ambient)

  // 方向光：模拟太阳，产生明暗对比和阴影
  const sun = new THREE.DirectionalLight(0xffeedd, 2)
  sun.position.set(20, 30, 30)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.far = 100
  sun.shadow.camera.near = 0.5// wrapS/wrapT 控制 UV 坐标超
  sun.shadow.camera.left = -10
  sun.shadow.camera.right = 10
  sun.shadow.camera.top = 10
  sun.shadow.camera.bottom = -10
  sun.shadow.bias = -0.0001
  scene.add(sun)

  // ========== 辅助元素 ==========
  // 坐标轴辅助线（红=X，绿=Y，蓝=Z）
  const axesHelper = new THREE.AxesHelper(150)
  scene.add(axesHelper)

  // 地面
  const groundGeo = new THREE.PlaneGeometry(60, 60)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.7,
    roughness: 0.2
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2     // 从 XY 平面旋转到 XZ 水平面
  ground.rotation.y = -0.01
  ground.receiveShadow = true           // 接收阴影
  scene.add(ground)

  // ========== 建筑群 ==========
  // 参数：x, z, width, depth, height, tex
  if (tex) {
    scene.add(createBuilding(-6, 5, 3, 3, 8, tex))
    scene.add(createBuilding(0, 5, 4, 4, 14, tex))
    scene.add(createBuilding(7, 5, 2.5, 2.5, 5, tex))
  }

  // ========== 街景 ==========
  scene.add(createStreetLight(-8, 10))
  scene.add(createStreetLight(5, 5))
  scene.add(createRoad())

  // ========== 动画循环 ==========
  let animationId: number
  function animate() {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  // 窗口大小变化时更新相机和渲染器
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  animate()
  window.addEventListener('resize', handleResize)

  return {
    camera,
    // 销毁函数：组件卸载时清理资源
    dispose: () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }
}


// ==================== dumi 文档嵌入组件 ====================
// 使用上面的 initScene 渲染 3D 场景，并提供相机参数快捷控制面板
const SceneDemo = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null)
  const disposeRef = useRef<(() => void) | null>(null)
  const [cameraType, setCameraType] = useState<'perspective' | 'orthographic'>('perspective')
  const [textures, setTextures] = useState<TexturesPack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isPerspective = cameraType === 'perspective'

  // 预加载纹理（仅一次）
  useEffect(() => {
    let cancelled = false
    preloadTextures()
      .then((tex) => { if (!cancelled) { setTextures(tex); setLoading(false) } })
      .catch((e) => { if (!cancelled) { setError('贴图加载失败: ' + e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  // cameraType 变化或纹理就绪后，销毁旧场景、创建新场景
  useEffect(() => {
    if (!containerRef.current || !textures) return
    // 销毁上一个场景
    disposeRef.current?.()
    const { camera, dispose } = initScene(containerRef.current, cameraType, textures)
    cameraRef.current = camera
    disposeRef.current = dispose
    return () => { dispose() }
  }, [cameraType, textures])

  // 切换透视相机 FOV（正交相机不支持）
  const handleFovChange = (fov: number) => {
    if (cameraRef.current && cameraRef.current instanceof THREE.PerspectiveCamera) {
      cameraRef.current.fov = fov
      cameraRef.current.updateProjectionMatrix()
    }
  }

  // 切换近远裁剪面距离
  const handleNearFarChange = (type: 'extreme' | 'normal') => {
    if (cameraRef.current) {
      if (type === 'extreme') {
        // 极限配置：极大深度范围，但 far/near 比值过大会引发 Z-Fighting（远处闪烁）
        cameraRef.current.near = 0.001
        cameraRef.current.far = 10000
      } else {
        // 常规配置：合理的深度范围
        cameraRef.current.near = 0.1
        cameraRef.current.far = 200
      }
      cameraRef.current.updateProjectionMatrix()
    }
  }

  // ---- 样式定义 ----
  const btnStyle: React.CSSProperties = {
    padding: '6px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: '#333'
  }

  const groupLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#999',
    fontWeight: 600,
    minWidth: 70,
    lineHeight: '30px'
  }

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  }

  return (
    <div>
      {/* ---- 相机控制面板 ---- */}
      <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fafafa', borderRadius: 8 }}>

        {/* 投影方式 */}
        <div style={groupStyle}>
          <span style={groupLabelStyle}>相机类型</span>
          <button style={btnStyle} onClick={() => setCameraType('perspective')}>
            📷 透视相机
          </button>
          <button style={btnStyle} onClick={() => setCameraType('orthographic')}>
            📐 正交相机
          </button>
        </div>

        {/* FOV：仅透视相机时可见 */}
        {isPerspective && (
        <div style={groupStyle}>
          <span style={groupLabelStyle}>FOV 视角</span>
          <button style={btnStyle} onClick={() => handleFovChange(120)}>🔭 广角 120°</button>
          <button style={btnStyle} onClick={() => handleFovChange(60)}>📷 标准 60°</button>
          <button style={btnStyle} onClick={() => handleFovChange(20)}>🔎 长焦 20°</button>
        </div>
        )}

        {/* 裁剪面：仅透视相机时可见 */}
        {isPerspective && (
        <div style={groupStyle}>
          <span style={groupLabelStyle}>裁剪面</span>
          <button style={btnStyle} onClick={() => handleNearFarChange('extreme')}>
            🌍 极限 near=0.001 far=10000
          </button>
          <button style={btnStyle} onClick={() => handleNearFarChange('normal')}>
            📐 常规 near=0.1 far=200
          </button>
        </div>
        )}

      </div>

      {/* 3D 画布容器 */}
      {loading && (
        <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8 }}>
          <span style={{ color: '#999', fontSize: 14 }}>⏳ 正在加载贴图资源...</span>
        </div>
      )}
      {error && (
        <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff0f0', borderRadius: 8 }}>
          <span style={{ color: '#e74c3c', fontSize: 14 }}>{error}</span>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: 400, display: loading || error ? 'none' : 'block' }}
      />
    </div>
  )
}

export default SceneDemo
