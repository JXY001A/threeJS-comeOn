import * as THREE from 'three'
// 引入 OrbitControls
// 轨道控制使相机能够围绕目标旋转
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useEffect, useRef, useState } from 'react'

// 创建建筑
const createBuilding = (x: number, z: number, width: number, depth: number, height: number, color: any) => {
  const geo = new THREE.BoxGeometry(width,height,depth);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.4,
    roughness: 0.6
  });
  const building = new THREE.Mesh(geo, mat);
  // 所有的几何体的位置设定是在于其中心点，设置的位置也是对应几何体的中心点
  building.position.set(x,height/2,z);
  building.castShadow = true;
  building.receiveShadow = true;
  return building;
}
//  路灯（CylinderGeometry 杆 + SphereGeometry 灯泡）
const createStreetLight = (x: number, z: number) => {
  // 创建一个组
  const group = new THREE.Group();

  // 创建杆 geometry
  const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 5, 8);  
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    metalness: 0.5,
    roughness: 0.8
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.5;
  pole.castShadow = true;
  group.add(pole);

  // 创建灯泡 geometry
  const bulbGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    // 金属度
    metalness: 0.7,
    // 粗糙度
    roughness: 0.2,
    // 发射光颜色
    emissive: 0xffdd88,
    // 发射光强度
    emissiveIntensity: 1
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = 5;
  group.add(bulb);

  // 创建点光源
  const pointLight = new THREE.PointLight(0xffcc66, 50, 15);
  pointLight.position.y=5;
  pointLight.castShadow = true;
  // 阴影贴图分辨率
  pointLight.shadow.mapSize.set(512, 512);
  group.add(pointLight);
  group.position.set(x, 0, z);
  return group;
}

// 创建马路
const createRoad = () => {
  const roadGeo = new THREE.PlaneGeometry(4,60);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0xffeedd,
    metalness: 0.5,
    roughness: 0.95,
    side: THREE.DoubleSide,  // 正反面都渲染
  });

  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  // road.rotation.y = -Math.PI/2;
  road.position.set(-4, 0.005, 0);
  road.castShadow = true;
  road.receiveShadow=true;
  return road;
}


/**
 * 初始化“城市一角”3D 场景
 * @param container 挂载 canvas 的容器元素
 * @returns {{ camera: THREE.PerspectiveCamera, dispose: () => void }} 相机实例与销毁函数
 */
export function initScene(container: HTMLElement,cameraType?:"perspective"|"orthographic") {
  const scene = new THREE.Scene();
  // 场景背景
  scene.background = new THREE.Color(0x87ceeb); // 天空蓝
  scene.fog = new THREE.Fog(0x87ceeb, 30, 100); // 远处的雾化

  // 相机
  let camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
  if(cameraType==="orthographic") {
    // �正交相机
    // @ts-ignore
    camera = new THREE.OrthographicCamera(-15, 15, 10, -10, 0.1, 200);
  }
  // 相机位置
  camera.position.set(10, 10, 20);
  // camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, 0);

  // 渲染器
  const renderer = new THREE.WebGLRenderer({antialias:true});
  // 设置渲染器大小
  renderer.setSize(container.clientWidth, container.clientHeight);
  // 设置渲染器像素比
  renderer.setPixelRatio(window.devicePixelRatio);
  // 启用阴影
  renderer.shadowMap.enabled = true;
  // 阴影类型: 软阴影
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // 色调映射: ACESFilmicToneMapping
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // 色调映射强度
  renderer.toneMappingExposure = 1;
  // 将渲染器添加到容器中
  container.appendChild(renderer.domElement); 

  // 鼠标控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  // 启用阻尼效果，使控制器更流畅
  controls.enableDamping = true;
  // 阻尼效果的 dampingFactor 值越小，阻尼效果越明显
  controls.dampingFactor = 0.05;
  // 设置控制器目标位置
  controls.target.set(0, 2, 0);
  controls.update();

  // 环境光照系统
  const ambient = new THREE.AmbientLight(0x404060, 1);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffeedd, 1);
  // 光源位置 
  sun.position.set(20, 30, 30);
  // 启用阴影
  sun.castShadow = true;
  // 阴影贴图分辨率
  sun.shadow.mapSize.set(2048, 2048);

  // 阴影相机远裁剪面
  sun.shadow.camera.far = 100;
  // 阴影相机近裁剪面
  sun.shadow.camera.near = 0.5;
  // 阴影相机水平和垂直方向的视野范围
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  // 阴影偏移
  sun.shadow.bias = -0.0001;
  scene.add(sun);

  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  // 地面几何体：60x60
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  // 地面材质
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    // 金属度
    metalness: 0.7,
    // 粗糙度
    roughness: 0.2
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2; // 平面默认竖着的，旋转到水平
  ground.rotation.y = -0.01; // 旋转到水平
  // 接收阴影
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(createBuilding(-6, 5, 3, 3, 8, 0x3498db));
  scene.add(createBuilding(0, 5, 4, 4, 14, 0xe74c3c)); 
  scene.add(createBuilding(7, 5, 2.5, 2.5, 5, 0x2ecc71)); 

  // 添加路灯
  scene.add(createStreetLight(-8, 10));
  scene.add(createStreetLight(5, 5));
  scene.add(createRoad())

  // 动画循环
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  animate();
  window.addEventListener('resize', handleResize);

  return {
    camera,
    dispose: () => {
      window.removeEventListener('resize', handleResize);
    }
  };
}


// ==================== dumi 文档嵌入组件 ====================
// 直接使用上面的 initScene 渲染，不重复写 Three.js 逻辑
const SceneDemo = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null)
  const [cameraType, setCameraType] = useState<'perspective' | 'orthographic'>('perspective')
  const isPerspective = cameraType === 'perspective'

  useEffect(() => {
    if (!containerRef.current) return
    const { camera, dispose } = initScene(containerRef.current, cameraType)
    cameraRef.current = camera
    return dispose
  }, [cameraType])

  // 切换相机 FOV（仅透视相机支持）
  const handleFovChange = (fov: number) => {
    if (cameraRef.current && cameraRef.current instanceof THREE.PerspectiveCamera) {
      cameraRef.current.fov = fov
      cameraRef.current.updateProjectionMatrix()
    }
  }

  const handleNearFarChange = (type: 'extreme' | 'normal') => {
    if (cameraRef.current) {
      if (type === 'extreme') {
        // 极限情况缩放后远处建筑物会出现闪烁（far/near 比值太大，深度精度不够）
        cameraRef.current.near = 0.001
        cameraRef.current.far = 10000
      } else {
        cameraRef.current.near = 0.1
        cameraRef.current.far = 200
      }
      cameraRef.current.updateProjectionMatrix()
    }
  }

  // 按钮公共样式
  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    background: disabled ? '#f5f5f5' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    color: disabled ? '#bbb' : '#333',
    opacity: disabled ? 0.6 : 1
  })

  // 分组标签样式
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
      {/* ---- 控制面板 ---- */}
      <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fafafa', borderRadius: 8 }}>

        {/* 相机类型 */}
        <div style={groupStyle}>
          <span style={groupLabelStyle}>相机类型</span>
          <button
            style={btnStyle(!isPerspective)}
            onClick={() => setCameraType('perspective')}
          >
            📷 透视相机
          </button>
          <button
            style={btnStyle(isPerspective)}
            onClick={() => setCameraType('orthographic')}
          >
            📐 正交相机
          </button>
        </div>

        {/* FOV 视角（仅透视相机有效） */}
        <div style={groupStyle}>
          <span style={groupLabelStyle}>FOV 视角</span>
          <button style={btnStyle(!isPerspective)} disabled={!isPerspective} onClick={() => handleFovChange(120)}>🔭 广角 120°</button>
          <button style={btnStyle(!isPerspective)} disabled={!isPerspective} onClick={() => handleFovChange(60)}>📷 标准 60°</button>
          <button style={btnStyle(!isPerspective)} disabled={!isPerspective} onClick={() => handleFovChange(20)}>🔎 长焦 20°</button>
        </div>

        {/* 近远裁剪面 */}
        <div style={groupStyle}>
          <span style={groupLabelStyle}>裁剪面</span>
          <button style={btnStyle()} onClick={() => handleNearFarChange('extreme')}>
            🌍 极限 near=0.001 far=10000
          </button>
          <button style={btnStyle()} onClick={() => handleNearFarChange('normal')}>
            📐 常规 near=0.1 far=200
          </button>
        </div>

      </div>

      <div
        ref={containerRef}
        style={{ width: '100%', height: 400 }}
      />
    </div>
  )
}

export default SceneDemo
