import * as THREE from 'three'

export function createScene(canvas) {
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
  camera.position.z = 3

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  return { scene, camera, renderer }
}

export function createEarth(scene) {
  const geo = new THREE.SphereGeometry(1, 64, 64)
  const tex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg')
  const mat = new THREE.MeshPhongMaterial({ map: tex, specular: new THREE.Color(0x333333), shininess: 5 })
  const earth = new THREE.Mesh(geo, mat)
  scene.add(earth)

  const sun = new THREE.DirectionalLight(0xffffff, 1.5)
  sun.position.set(5, 3, 5)
  scene.add(sun)
  scene.add(new THREE.AmbientLight(0x404060))

  return earth
}

export function createStars(scene) {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(3000 * 3)
  for (let i = 0; i < 3000 * 3; i++) positions[i] = (Math.random() - 0.5) * 200
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true }))
  scene.add(stars)
  return stars
}