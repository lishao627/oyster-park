<template>
  <canvas ref="canvasRef" class="dream-particles-canvas" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const canvasRef = ref(null)
let scene, camera, renderer, animId
let particles = []
let butterflies = []
let petals = []
let bubbles = []
let mx = 0, my = 0, camX = 0, camY = 0

function onMouseMove(e) {
  mx = (e.clientX / window.innerWidth - 0.5) * 2
  my = (e.clientY / window.innerHeight - 0.5) * 2
}

const COLORS = {
  particle: [0xffd6e0, 0xe0d6ff, 0xd6f0ff, 0xfff0d6, 0xd6ffe0],
  bubble: [0xd6f0ff, 0xe8d6ff, 0xffd6e8, 0xd6ffe8],
  petal: [0xffd6e0, 0xffe0d6, 0xfff0d6, 0xe0d6ff],
  butterfly: [0xd6f0ff, 0xffd6e0, 0xe0d6ff]
}

function rand(min, max) { return Math.random() * (max - min) + min }

function createGlowTexture(color, size) {
  const c = document.createElement('canvas'); c.width = size; c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
  const r = (color >> 16) & 0xff
  const g2 = (color >> 8) & 0xff
  const b = color & 0xff
  g.addColorStop(0, `rgba(${r},${g2},${b},1)`)
  g.addColorStop(0.3, `rgba(${r},${g2},${b},0.6)`)
  g.addColorStop(1, `rgba(${r},${g2},${b},0)`)
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

function createParticleSystem(count, spread, opts = {}) {
  const color = opts.color || COLORS.particle[Math.floor(Math.random() * COLORS.particle.length)]
  const size = opts.size || 64
  const tex = createGlowTexture(color, size)
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const vel = []
  const lifespan = opts.lifespan || 8

  for (let i = 0; i < count; i++) {
    pos[i*3] = rand(-spread, spread)
    pos[i*3+1] = rand(-spread * 0.6, spread * 0.6)
    pos[i*3+2] = rand(-spread * 0.4, spread * 0.4)
    vel.push({
      x: rand(-0.003, 0.003),
      y: rand(0.001, 0.005),
      z: rand(-0.002, 0.002),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.005, 0.005),
      scale: rand(0.3, 1),
      phase: rand(0, Math.PI * 2),
      birth: Date.now(),
      lifespan: rand(lifespan * 0.5, lifespan)
    })
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

  const mat = new THREE.PointsMaterial({
    map: tex,
    size: opts.particleSize || 0.12,
    transparent: true,
    opacity: opts.opacity || 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  })

  const mesh = new THREE.Points(geo, mat)
  mesh.userData.velocities = vel
  return mesh
}

function createButterfly(scene) {
  const group = new THREE.Group()
  const color = COLORS.butterfly[Math.floor(Math.random() * COLORS.butterfly.length)]
  const tex = createGlowTexture(color, 32)
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  // Left wing
  const left = new THREE.Sprite(mat.clone())
  left.scale.set(0.08, 0.06, 1)

  // Right wing
  const right = new THREE.Sprite(mat.clone())
  right.scale.set(0.08, 0.06, 1)

  group.add(left)
  group.add(right)

  // Position in dream space
  group.position.set(
    rand(-3, 3),
    rand(-1, 2),
    rand(-2, 2)
  )

  group.userData = {
    left, right,
    wingAngle: 0,
    wingSpeed: rand(0.02, 0.05),
    moveSpeed: rand(0.001, 0.003),
    direction: new THREE.Vector3(rand(-1,1), rand(-0.3,0.3), rand(-1,1)).normalize(),
    phase: rand(0, Math.PI * 2)
  }

  return group
}

function createBubble(scene) {
  const size = rand(0.05, 0.15)
  const geo = new THREE.SphereGeometry(size, 16, 16)
  const color = COLORS.bubble[Math.floor(Math.random() * COLORS.bubble.length)]
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff

  const mat = new THREE.MeshPhongMaterial({
    color,
    transparent: true,
    opacity: rand(0.2, 0.34),
    emissive: color,
    emissiveIntensity: 0.4,
    depthWrite: false
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(
    rand(-2.5, 2.5),
    rand(-1.5, 1.5),
    rand(-2, 2)
  )

  mesh.userData = {
    floatSpeed: rand(0.002, 0.006),
    floatPhase: rand(0, Math.PI * 2),
    maxY: mesh.position.y + rand(0.3, 0.8),
    minY: mesh.position.y - rand(0.1, 0.3)
  }

  return mesh
}

function createPetal(scene) {
  const tex = createGlowTexture(COLORS.petal[Math.floor(Math.random() * COLORS.petal.length)], 32)
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const sprite = new THREE.Sprite(mat)
  const s = rand(0.04, 0.1)
  sprite.scale.set(s, s * 0.6, 1)

  sprite.position.set(
    rand(-2.5, 2.5),
    rand(-1.5, 1.5),
    rand(-2, 2)
  )

  sprite.userData = {
    fallSpeed: rand(0.002, 0.005),
    swayPhase: rand(0, Math.PI * 2),
    swaySpeed: rand(0.01, 0.02),
    swayAmount: rand(0.1, 0.3),
    rotation: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.01, 0.01)
  }

  return sprite
}

function init() {
  const canvas = canvasRef.value
  const w = window.innerWidth
  const h = window.innerHeight

  scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0x6688aa, 1.5))
  scene.add(new THREE.DirectionalLight(0xffffff, 0.4))
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Create dreamscape elements
  // 1. Glowing particles
  for (let i = 0; i < 3; i++) {
    const system = createParticleSystem(80, 3.5, {
      particleSize: rand(0.06, 0.15),
      opacity: rand(0.15, 0.32),
      color: COLORS.particle[Math.floor(Math.random() * COLORS.particle.length)]
    })
    scene.add(system)
    particles.push(system)
  }

  // 2. Butterflies
  for (let i = 0; i < 4; i++) {
    const butterfly = createButterfly()
    scene.add(butterfly)
    butterflies.push(butterfly)
  }

  // 3. Bubbles
  for (let i = 0; i < 8; i++) {
    const bubble = createBubble()
    scene.add(bubble)
    bubbles.push(bubble)
  }

  // 4. Petals
  for (let i = 0; i < 6; i++) {
    const petal = createPetal()
    scene.add(petal)
    petals.push(petal)
  }

  // 5. Star fragments (tiny bright points)
  const starCount = 60
  const starGeo = new THREE.BufferGeometry()
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    starPos[i*3] = rand(-4, 4)
    starPos[i*3+1] = rand(-2.5, 2.5)
    starPos[i*3+2] = rand(-3, 3)
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.02,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  })
  const starPoints = new THREE.Points(starGeo, starMat)
  starPoints.userData.velocities = []
  for (let i = 0; i < starCount; i++) {
    starPoints.userData.velocities.push({
      speed: rand(0.0005, 0.002),
      phase: rand(0, Math.PI * 2)
    })
  }
  scene.add(starPoints)
  particles.push(starPoints)

  animate()
}

function animate() {
  animId = requestAnimationFrame(animate)
  const t = Date.now() * 0.001

  // 鼠标视差：粒子场轻微跟随
  camX += (mx * 0.35 - camX) * 0.03
  camY += (-my * 0.25 - camY) * 0.03
  camera.position.x = camX
  camera.position.y = camY
  camera.lookAt(0, 0, 0)

  // Animate particle systems
  particles.forEach(system => {
    const pos = system.geometry.attributes.position.array
    const vel = system.userData.velocities
    if (!vel) return
    // 星碎片只是点缀点（velocities 不含 x/y/z），跳过漂移累加，避免 NaN
    if (typeof vel[0]?.x !== 'number') return
    for (let i = 0; i < vel.length; i++) {
      const v = vel[i]
      pos[i*3] += v.x
      pos[i*3+1] += v.y * Math.sin(t * 0.5 + v.phase)
      pos[i*3+2] += v.z

      // Wrap around
      if (pos[i*3+1] > 2) pos[i*3+1] = -2
      if (Math.abs(pos[i*3]) > 4) pos[i*3] *= -0.9
    }
    system.geometry.attributes.position.needsUpdate = true
  })

  // Animate butterflies
  butterflies.forEach(b => {
    const d = b.userData
    d.wingAngle += d.wingSpeed
    const wingFlap = Math.sin(d.wingAngle) * 0.02

    d.left.position.x = -0.035 + wingFlap * 2
    d.right.position.x = 0.035 - wingFlap * 2

    // Movement
    const drift = Math.sin(t * 0.3 + d.phase) * 0.002
    b.position.x += d.direction.x * d.moveSpeed + drift
    b.position.y += d.direction.y * d.moveSpeed + Math.sin(t * 0.5 + d.phase) * 0.003
    b.position.z += d.direction.z * d.moveSpeed

    // Rotate
    b.rotation.y = Math.sin(t * 0.2 + d.phase) * 0.3

    // Bounds
    if (Math.abs(b.position.x) > 4) d.direction.x *= -1
    if (Math.abs(b.position.y) > 2.5) d.direction.y *= -1
    if (Math.abs(b.position.z) > 3) d.direction.z *= -1
  })

  // Animate bubbles
  bubbles.forEach(b => {
    const d = b.userData
    const float = Math.sin(t * d.floatSpeed * 10 + d.floatPhase) * 0.005
    b.position.y += d.floatSpeed + float

    if (b.position.y > d.maxY) {
      b.position.y = d.minY
      b.position.x = rand(-2.5, 2.5)
      b.position.z = rand(-2, 2)
    }
  })

  // Animate petals
  petals.forEach(p => {
    const d = p.userData
    p.position.y -= d.fallSpeed
    p.position.x += Math.sin(t * d.swaySpeed + d.swayPhase) * d.swayAmount * 0.002
    p.material.rotation = d.rotation + t * d.rotSpeed

    if (p.position.y < -2) {
      p.position.y = 1.5
      p.position.x = rand(-2.5, 2.5)
      p.position.z = rand(-2, 2)
    }
  })

  renderer.render(scene, camera)
}

function resize() {
  if (!renderer) return
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  init()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMouseMove)
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss?.()
  }
})
</script>

<style scoped>
.dream-particles-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
</style>


