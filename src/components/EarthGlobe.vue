<template>
  <div class="earth-globe" :class="{ focusing: isFocusing }" @mousemove="onMouseMove" @click="onCanvasClick">
    <!-- Dreamcore 装饰层 -->
    <FloatingDecorations />
    <DreamParticles />


    <!-- Decorative bear photos -->
    <div class="deco-bears">
      <div v-for="(url, idx) in bearUrls" :key="'bear-'+idx"
        class="deco-bear" :class="'layer-'+((idx % 3) + 1)"
        :style="bearStyle(idx)">
        <img :src="url" alt="" class="deco-bear-img" draggable="false" />
      </div>
    </div>

    <!-- Three.js canvas -->
    <canvas ref="canvasRef" class="earth-canvas" />

    <!-- 城市光点悬停提示 -->
    <Transition name="tooltip-fade">
      <div v-if="hoveredCity" class="city-tooltip" :style="tooltipStyle">
        <div class="tooltip-dot" />
        <div class="tooltip-content">
          <span class="tooltip-name">{{ hoveredCity.name }}</span>
          <span class="tooltip-hint">Click Memory</span>
        </div>
      </div>
    </Transition>

    <!-- 点击粒子特效 -->
    <Teleport to="body">
      <div class="click-particle-container">
        <div
          v-for="p in clickParticles"
          :key="p.id"
          class="click-particle"
          :style="{
            left: p.x + 'px',
            top: p.y + 'px',
            '--dx': (Math.random() - 0.5) * 60 + 'px',
            '--dy': -(30 + Math.random() * 40) + 'px'
          }"
        >
          <svg viewBox="0 0 12 12" width="10" height="10">
            <circle cx="6" cy="6" r="4" fill="rgba(200,215,245,0.3)"/>
            <circle cx="6" cy="6" r="1.5" fill="rgba(200,215,245,0.5)"/>
          </svg>
        </div>
      </div>
    </Teleport>

    <!-- 城市记忆爆发：星光 / 碎片 / 纸片 -->
    <Teleport to="body">
      <div class="burst-container">
        <div
          v-for="it in burstItems"
          :key="it.id"
          class="burst-item"
          :class="'burst-' + it.shape"
          :style="{
            left: it.x + 'px',
            top: it.y + 'px',
            width: it.size + 'px',
            height: it.size + 'px',
            opacity: it.opacity,
            transform: 'translate(-50%,-50%) rotate(' + it.rot + 'deg) scale(' + it.scale + ')'
          }"
        >
          <span v-html="burstMarkup(it.shape)" />
        </div>
      </div>
    </Teleport>

    <!-- DEBUG: click counter -->
    <!-- 记忆卡片 -->
    <MemoryCard />
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { useMemoryStore } from '../stores/memory.js'
import { CameraController } from '../utils/CameraController.js'
import DreamParticles from './DreamParticles.vue'
import FloatingDecorations from './FloatingDecorations.vue'
import MemoryCard from './MemoryCard.vue'

const store = useMemoryStore()

// ========== CONFIG ==========
const CONFIG = {
  earthRadius: 1,
  rotationSpeed: 0.12,
  breatheAmplitude: 0.015,
  breathePeriod: 6,
  markerSize: 0.03,
  markerBreathAmp: 0.12,
  markerBreathPeriod: 2.5
}


// ========== DECORATIVE BEAR IMAGES ==========
const bearModules = import.meta.glob('../assets/imgs/*.jpg', { eager: true, query: '?url', import: 'default' })
const bearUrls = Object.values(bearModules)

// ========== STATE ==========
const canvasRef = ref(null)
const hoveredCity = ref(null)
const tooltipStyle = ref({})
const clickParticles = computed(() => store.clickParticles)
const isFocusing = computed(() => store.isTransitioning || store.showMemoryCard)


function bearStyle(idx) {
  const posList = [
    { a: -25, r: 82 }, { a: 35, r: 78 }, { a: 110, r: 85 },
    { a: 145, r: 80 }, { a: 200, r: 88 }, { a: 260, r: 82 },
    { a: 310, r: 86 }, { a: 350, r: 84 }, { a: 65, r: 90 },
    { a: 235, r: 92 }
  ]
  const p = posList[idx % posList.length]
  const rad = p.r / 100.0; const deg = p.a * 3.14159 / 180.0
  const sz = 7.5 + (idx % 3) * 0.65
  const dl = (idx * 0.3) + 's'
  const dr = 5 + (idx % 4) * 1.5
  return {
    left: 'calc(50% + ' + (Math.cos(deg) * rad * 50) + '%)',
    top: 'calc(50% + ' + (Math.sin(deg) * rad * 50) + '%)',
    width: sz + 'vh', height: sz + 'vh',
    animationDelay: dl,
    '--float-dur': dr + 's',
  }
}

let scene, camera, renderer, controls
let earthGroup, earth, cloudLayer, glowSprite
let stars, animId, clock, breathePhase = 0
let markerSprites = []
let orbitBears = []
let dandelions = []
let starTrailGroup
let hoveredHalo = null
let raycaster, mouse, camController
let composer, bloomPass

// 城市记忆爆发粒子（DOM 层，GSAP 驱动）
const burstItems = ref([])
let burstSeq = 0

// 鼠标跟踪
let mouseX = 0, mouseY = 0
let targetRotX = 0, targetRotY = 0

// ========== CITY DATA ==========
// 从 store 动态获取城市数据（响应式，登录后从后端加载）
const activeCities = computed(() => store.unlockedCities)

// ========== IMAGE HELPER ==========
function getImageUrl(folder, filename) {
  try {
    return new URL(`../assets/photo/${folder}/${filename}`, import.meta.url).href
  } catch {
    return ''
  }
}

// ========== TEXTURE GENERATORS ==========
function generateEarthTexture() {
  const w = 2048, h = 1024
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const px = c.getContext('2d')
  px.fillStyle = '#bcdce0'; px.fillRect(0, 0, w, h)

  function blob(ltMin, ltMax, lnMin, lnMax, col) {
    const x1 = (lnMin + 180) / 360 * w, x2 = (lnMax + 180) / 360 * w
    const y1 = (90 - ltMax) / 180 * h, y2 = (90 - ltMin) / 180 * h
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2
    const rx = (x2 - x1) / 2, ry = (y2 - y1) / 2
    px.save(); px.beginPath(); px.ellipse(cx, cy, Math.max(rx, 8), Math.max(ry, 8), 0, 0, Math.PI * 2)
    px.fillStyle = col; px.fill(); px.restore()
  }

  blob(25, 70, -130, -70, '#9fc3de'); blob(10, 25, -105, -80, '#96bdda')
  blob(-55, 10, -80, -35, '#a6c9e2'); blob(35, 65, -10, 40, '#9bc1dc')
  blob(-35, 35, -15, 50, '#9fc3de'); blob(10, 75, 40, 170, '#aecfe4')
  blob(-10, 15, 95, 140, '#96bdda'); blob(-40, -10, 115, 155, '#9fc3de')
  blob(60, 82, -70, -20, '#9fc3de'); blob(-90, -70, -180, 180, '#d4e8f2')
  blob(75, 90, -180, 180, '#b8d8ec')

  const imgData = px.getImageData(0, 0, w, h)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n))
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n))
  }
  px.putImageData(imgData, 0, 0)
  return new THREE.CanvasTexture(c)
}

function generateCloudTexture() {
  const w = 1024, h = 512
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const px = c.getContext('2d')
  px.fillStyle = 'rgba(0,0,0,0)'; px.fillRect(0, 0, w, h)
  function noise(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return n - Math.floor(n)
  }
  for (let i = 0; i < 180; i++) {
    const cx = noise(i * 7.3, 42) * w
    const cy = noise(i * 13.7, 43) * h
    const rx = 30 + noise(i * 19.1, 44) * 80
    const ry = 15 + noise(i * 23.5, 45) * 50
    const alpha = 0.15 + noise(i * 29.7, 46) * 0.35
    const g = px.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
    g.addColorStop(0, 'rgba(255,255,255,' + (alpha * 0.6).toFixed(2) + ')')
    g.addColorStop(0.5, 'rgba(255,255,255,' + (alpha * 0.3).toFixed(2) + ')')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    px.save(); px.beginPath(); px.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    px.fillStyle = g; px.fill(); px.restore()
  }
  for (let i = 0; i < 60; i++) {
    const cy = noise(i * 31.1, 47) * h
    const cx = noise(i * 37.3, 48) * w
    const len = 100 + noise(i * 41.9, 49) * 200
    const alpha = 0.05 + noise(i * 47.3, 50) * 0.1
    px.save(); px.globalAlpha = alpha
    px.strokeStyle = 'rgba(255,255,255,0.3)'
    px.lineWidth = 3 + noise(i * 53.1, 51) * 8
    px.beginPath(); px.moveTo(cx - len / 2, cy); px.lineTo(cx + len / 2, cy + noise(i * 59.7, 52) * 15)
    px.stroke(); px.restore()
  }
  const imgData = px.getImageData(0, 0, w, h)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 20
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n))
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n))
  }
  px.putImageData(imgData, 0, 0)
  return new THREE.CanvasTexture(c)
}

function createMarkerTexture() {
  const size = 128
  const c = document.createElement('canvas'); c.width = size; c.height = size
  const ctx = c.getContext('2d')
  const cx = size / 2, cy = size / 2
  const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2)
  g1.addColorStop(0, 'rgba(255,250,245,0.9)')
  g1.addColorStop(0.2, 'rgba(255,248,240,0.75)')
  g1.addColorStop(0.4, 'rgba(235,238,250,0.4)')
  g1.addColorStop(0.65, 'rgba(200,215,240,0.16)')
  g1.addColorStop(1, 'rgba(180,200,235,0)')
  ctx.fillStyle = g1; ctx.fillRect(0, 0, size, size)
  const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.15)
  g2.addColorStop(0, 'rgba(255,252,248,0.9)')
  g2.addColorStop(1, 'rgba(255,248,240,0)')
  ctx.fillStyle = g2; ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

// 悬停光晕纹理
function createHaloTexture() {
  const size = 128
  const c = document.createElement('canvas'); c.width = size; c.height = size
  const ctx = c.getContext('2d')
  const cx = size / 2, cy = size / 2
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2)
  g.addColorStop(0, 'rgba(225,238,255,0.4)')
  g.addColorStop(0.3, 'rgba(215,232,252,0.15)')
  g.addColorStop(1, 'rgba(205,225,248,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

// ========== COORDINATE HELPER ==========
function latLngToPos(lat, lng, radius) {
  const phi = (90 - lat) * Math.PI / 180
  const theta = lng * Math.PI / 180
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// ========== 流星系统 ==========
let meteorMeshes = []

function createMeteorTexture() {
  const size = 64
  const c = document.createElement('canvas'); c.width = size; c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, size, size)
  g.addColorStop(0, 'rgba(255,245,235,0)')
  g.addColorStop(0.4, 'rgba(255,245,235,0.15)')
  g.addColorStop(0.7, 'rgba(255,245,235,0.4)')
  g.addColorStop(1, 'rgba(255,245,235,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

function addMeteorShower(scene) {
  const tex = createMeteorTexture()
  const count = 8
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(0.15, 0.03, 1)
    sprite.position.set(
      (Math.random() - 0.5) * 8,
      Math.random() * 4 + 1,
      -4
    )
    sprite.userData = {
      speed: 0.3 + Math.random() * 0.4,
      delay: Math.random() * 20,
      active: false,
      startX: sprite.position.x,
      startY: sprite.position.y,
      life: 0
    }
    scene.add(sprite)
    meteorMeshes.push(sprite)
  }
}

// ========== 纸飞机系统 ==========
let paperPlanes = []

function addPaperPlanes(scene) {
  const size = 32
  const c = document.createElement('canvas'); c.width = size; c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(200,215,245,0.15)'
  ctx.beginPath()
  ctx.moveTo(2, size - 2)
  ctx.lineTo(2, size * 0.3)
  ctx.lineTo(size - 2, size * 0.5)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(200,215,245,0.2)'
  ctx.lineWidth = 0.5
  ctx.stroke()
  const tex = new THREE.CanvasTexture(c)

  for (let i = 0; i < 2; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(mat)
    const side = Math.random() > 0.5 ? 1 : -1
    sprite.scale.set(0.2, 0.12, 1)
    sprite.position.set(
      side * 4,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 3
    )
    sprite.userData = {
      side,
      speed: 1.5 + Math.random() * 0.5,
      delay: 10 + Math.random() * 15,
      life: 0,
      yPhase: Math.random() * Math.PI * 2
    }
    scene.add(sprite)
    paperPlanes.push(sprite)
  }
}

// ========== 小熊公转系统 ==========
function createBearTexture(url) {
  const size = 160
  const c = document.createElement('canvas'); c.width = size; c.height = size
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, size, size)
    const s = Math.min(size / img.width, size / img.height)
    const dw = img.width * s, dh = img.height * s
    const dx = (size - dw) / 2, dy = (size - dh) / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    tex.needsUpdate = true
  }
  img.src = url
  return tex
}

function addOrbitBears() {
  const bearKeys = Object.keys(bearModules).filter((k) => k.toLowerCase().includes('bear'))
  const picks = [bearKeys[0], bearKeys[2], bearKeys[4]].map((k) => bearModules[k]).filter(Boolean)
  picks.forEach((url, i) => {
    const tex = createBearTexture(url)
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0.8, depthWrite: false
    })
    const spr = new THREE.Sprite(mat)
    spr.scale.set(0.2 + i * 0.015, 0.2 + i * 0.015, 1)
    spr.userData = {
      angle: (i / picks.length) * Math.PI * 2,
      radius: 1.52 + (i % 2) * 0.1,
      height: 0.15 + i * 0.22,
      speed: 0.16 + i * 0.04,
      bobPhase: i * 2.3
    }
    scene.add(spr)
    orbitBears.push(spr)
  })
}

// ========== 蒲公英系统 ==========
function createDandelionTexture() {
  const size = 128
  const c = document.createElement('canvas'); c.width = size; c.height = size
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2, cy = size / 2
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2
    const len = 30 + Math.random() * 22
    const x = cx + Math.cos(a) * len
    const y = cy + Math.sin(a) * len
    ctx.strokeStyle = 'rgba(255,250,240,0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,252,248,0.8)'
    ctx.beginPath()
    ctx.arc(x, y, 1.6 + Math.random() * 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(255,250,245,0.5)'
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(c)
}

function addDandelions() {
  const tex = createDandelionTexture()
  for (let i = 0; i < 2; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(mat)
    const s = 0.18 + i * 0.04
    sprite.scale.set(s, s, 1)
    sprite.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2, -2.5)
    sprite.userData = {
      delay: 8 + i * 10 + Math.random() * 8,
      life: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.2,
      active: false
    }
    scene.add(sprite)
    dandelions.push(sprite)
  }
}

// ========== 星轨 ==========
function addStarTrails() {
  starTrailGroup = new THREE.Group()
  const rings = [
    { radius: 2.6, y: 1.1, count: 48, size: 0.035, opacity: 0.26 },
    { radius: 3.1, y: 1.7, count: 54, size: 0.03, opacity: 0.2 },
    { radius: 3.6, y: 2.4, count: 60, size: 0.026, opacity: 0.16 }
  ]
  rings.forEach((r) => {
    const pos = new Float32Array(r.count * 3)
    for (let i = 0; i < r.count; i++) {
      const a = (i / r.count) * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r.radius
      pos[i * 3 + 1] = r.y + Math.sin(a) * 0.22
      pos[i * 3 + 2] = Math.sin(a) * r.radius * 0.4
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: r.size, transparent: true, opacity: r.opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    }))
    starTrailGroup.add(pts)
  })
  starTrailGroup.position.set(0, 0.3, -3)
  scene.add(starTrailGroup)
}

// ========== 城市记忆爆发（DOM 层） ==========
function burstMarkup(shape) {
  const stroke = 'rgba(255,246,240,0.9)'
  switch (shape) {
    case 'star':
      return '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4 Z" fill="' + stroke + '"/></svg>'
    case 'spark':
      return '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0 L13.8 10.2 L24 12 L13.8 13.8 L12 24 L10.2 13.8 L0 12 L10.2 10.2 Z" fill="' + stroke + '"/></svg>'
    case 'paper':
      return '<svg viewBox="0 0 16 20" width="100%" height="100%"><rect x="1" y="1" width="14" height="18" rx="1" fill="rgba(255,250,245,0.85)" stroke="rgba(255,240,235,0.5)"/><line x1="4" y1="6" x2="12" y2="6" stroke="rgba(210,215,245,0.45)"/><line x1="4" y1="10" x2="12" y2="10" stroke="rgba(210,215,245,0.45)"/></svg>'
    case 'ring':
      return '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="7" fill="none" stroke="rgba(255,240,235,0.7)" stroke-width="1.5"/></svg>'
    default:
      return '<svg viewBox="0 0 12 12" width="100%" height="100%"><circle cx="6" cy="6" r="5" fill="' + stroke + '"/></svg>'
  }
}

function spawnCityBurst(city) {
  const marker = markerSprites.find((s) => s.userData.city === city)
  if (!marker || !camera) return
  const worldPos = new THREE.Vector3()
  marker.getWorldPosition(worldPos)
  const ndc = worldPos.project(camera)
  const cx = (ndc.x * 0.5 + 0.5) * window.innerWidth
  const cy = (-ndc.y * 0.5 + 0.5) * window.innerHeight
  const shapes = ['star', 'circle', 'spark', 'paper']
  const count = 22
  for (let i = 0; i < count; i++) {
    const item = reactive({
      id: 'burst-' + (++burstSeq),
      shape: i === 0 ? 'ring' : shapes[i % shapes.length],
      x: cx, y: cy, rot: 0, scale: 1,
      opacity: 1, size: i === 0 ? 46 : 8 + Math.random() * 14
    })
    burstItems.value.push(item)
    const angle = Math.random() * Math.PI * 2
    const dist = 40 + Math.random() * 110
    const targetX = cx + Math.cos(angle) * dist
    const targetY = cy + Math.sin(angle) * dist - 18
    const rotDelta = i === 0 ? 0 : Math.random() * 360 - 180
    const proxy = { p: 0 }
    gsap.to(proxy, {
      p: 1,
      duration: i === 0 ? 1.0 : 1.4 + Math.random() * 0.7,
      ease: i === 0 ? 'power2.out' : 'power3.out',
      onUpdate: () => {
        item.x = cx + (targetX - cx) * proxy.p
        item.y = cy + (targetY - cy) * proxy.p
        item.opacity = 1 - proxy.p
        item.rot = rotDelta * proxy.p
        item.scale = i === 0 ? 0.4 + proxy.p * 2.4 : 1 - proxy.p * 0.55
      },
      onComplete: () => {
        const idx = burstItems.value.indexOf(item)
        if (idx > -1) burstItems.value.splice(idx, 1)
      }
    })
  }
}

// ========== THREE.JS SETUP ==========
function init() {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = canvas.clientWidth, h = canvas.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xb7c7db)
  clock = new THREE.Timer()

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000)
  camera.position.set(0, 0.5, 3.5)

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  // 梦幻光斑 Light Bloom
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.4, 0.85)
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  // --- Earth group ---
  earthGroup = new THREE.Group()
  scene.add(earthGroup)

  // Earth mesh
  const earthTex = generateEarthTexture()
  earth = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.earthRadius, 64, 64),
    new THREE.MeshPhongMaterial({
      map: earthTex,
      emissive: new THREE.Color(0x9fc8ee),
      emissiveIntensity: 0.1,
      specular: new THREE.Color(0x99ccee),
      shininess: 6
    })
  )
  earthGroup.add(earth)

  // Cloud layer
  const cloudTex = generateCloudTexture()
  cloudLayer = new THREE.Mesh(
    new THREE.SphereGeometry(1.008, 48, 48),
    new THREE.MeshPhongMaterial({ map: cloudTex, transparent: true, opacity: 0.12, depthWrite: false })
  )
  earthGroup.add(cloudLayer)

  // Glow sprite
  const gc = document.createElement('canvas'); gc.width = 256; gc.height = 256
  const gctx = gc.getContext('2d')
  const gg = gctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gg.addColorStop(0, 'rgba(225,238,255,0.38)')
  gg.addColorStop(0.3, 'rgba(215,232,252,0.16)')
  gg.addColorStop(1, 'rgba(205,225,248,0)')
  gctx.fillStyle = gg; gctx.fillRect(0, 0, 256, 256)
  glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(gc), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false
  }))
  glowSprite.scale.set(3.4, 3.4, 1)
  earthGroup.add(glowSprite)

  // Markers
  addMarkers()

  // Lighting
  const light1 = new THREE.DirectionalLight(0xffeee0, 1.3); light1.position.set(5, 3, 5); scene.add(light1)
  const light2 = new THREE.DirectionalLight(0xccddff, 0.45); light2.position.set(-5, -2, -3); scene.add(light2)
  scene.add(new THREE.AmbientLight(0xddeeff, 0.62))

  // Stars
  const n = 500, pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const r = 4 + Math.random() * 12
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    pos[i*3] = r * Math.sin(phi) * Math.cos(theta)
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i*3+2] = r * Math.cos(phi)
  }
  const sg = new THREE.BufferGeometry()
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  sg.computeBoundingSphere()
  stars = new THREE.Points(sg, new THREE.PointsMaterial({
    color: 0xbbccdd, size: 0.06, transparent: true, opacity: 0.32,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }))
  scene.add(stars)

  // Dream elements: meteors & paper planes
  addMeteorShower(scene)
  addPaperPlanes(scene)

  // Dream elements: orbit bears, dandelions, star trails
  addOrbitBears()
  addDandelions()
  addStarTrails()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5
  controls.minDistance = 2
  controls.maxDistance = 6
  controls.enablePan = false
  controls.update()

  // Camera Controller
  camController = new CameraController(camera, controls)

  // Raycaster for interaction
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // Events
  canvas.addEventListener('click', onThreeClick)
  canvas.addEventListener('mousemove', onThreeHover)

  animate()

  // 自动流星触发
  setInterval(() => {
    triggerMeteor()
  }, 8000 + Math.random() * 12000)
}

function addMarkers() {
  const markerTex = createMarkerTexture()
  const haloTex = createHaloTexture()

  activeCities.value.forEach((city) => {
    const pos = latLngToPos(city.lat, city.lng, CONFIG.earthRadius * 1.012)

    // 光环（默认隐藏）
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0
    })
    const halo = new THREE.Sprite(haloMat)
    halo.scale.set(0.18, 0.18, 1)
    halo.position.copy(pos)
    halo.userData = { city, isHalo: true }
    earthGroup.add(halo)

    // 主标记点
    const mat = new THREE.SpriteMaterial({
      map: markerTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.7
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(CONFIG.markerSize, CONFIG.markerSize, 1)
    sprite.position.copy(pos)
    sprite.userData = { city, halo }
    earthGroup.add(sprite)
    markerSprites.push(sprite)
  })
}

/** 清除所有标记点 */
function clearMarkers() {
  if (!earthGroup || !markerSprites) return
  markerSprites.forEach(s => {
    if (s.userData.halo) earthGroup.remove(s.userData.halo)
    earthGroup.remove(s)
  })
  markerSprites = []
}

/** 根据当前城市数据重建标记点 */
function rebuildMarkers() {
  clearMarkers()
  addMarkers()
}

// ========== ANIMATION LOOP ==========
function animate() {
  animId = requestAnimationFrame(animate)
  const dt = clock.getDelta()
  const t = clock.getElapsed()

  // Earth rotation (only when not frozen)
  if (earthGroup && !store.isGlobeFrozen) {
    earthGroup.rotation.y += CONFIG.rotationSpeed * dt
  }

  // 鼠标跟随（轻微偏移）
  if (earthGroup && !store.isGlobeFrozen) {
    targetRotX += (mouseX * 0.02 - targetRotX) * 0.02
    targetRotY += (-mouseY * 0.02 - targetRotY) * 0.02
    earthGroup.rotation.x = targetRotY
    earthGroup.rotation.z += (targetRotX - earthGroup.rotation.z) * 0.01
  }

 // Breathing
  breathePhase += dt / CONFIG.breathePeriod * Math.PI * 2
  const scale = 1 + Math.sin(breathePhase) * CONFIG.breatheAmplitude
 if (earthGroup) {
    earthGroup.scale.set(scale, scale, scale)
 }

  // Clouds
  if (cloudLayer && earth) {
    cloudLayer.rotation.y += 0.0008
  }
  if (stars) stars.rotation.y += 0.00015

  // Marker breathing glow
  markerSprites.forEach((sprite, i) => {
    if (sprite.userData._locked) return
    const isHovered = hoveredCity.value && sprite.userData.city === hoveredCity.value
    const amp = isHovered ? CONFIG.markerBreathAmp * 1.7 : CONFIG.markerBreathAmp
    const breath = 1 + Math.sin(t * (Math.PI * 2 / CONFIG.markerBreathPeriod) + i * 1.2) * amp
    const base = CONFIG.markerSize
    sprite.scale.set(base * breath, base * breath, 1)
    sprite.material.opacity = 0.55 + Math.sin(t * (Math.PI * 2 / CONFIG.markerBreathPeriod) + i * 1.2) * 0.2
  })

  // 公转小熊（聚焦时放慢，像在等你看它）
  const orbitScale = store.isGlobeFrozen ? 0.15 : 1
  orbitBears.forEach((b) => {
    const d = b.userData
    d.angle += d.speed * orbitScale * dt
    const bob = Math.sin(t * 0.7 + d.bobPhase) * 0.06
    b.position.set(
      Math.cos(d.angle) * d.radius,
      d.height + bob,
      Math.sin(d.angle) * d.radius
    )
    b.material.opacity = 0.45 + Math.sin(t * 0.9 + d.bobPhase) * 0.12
  })

  // 蒲公英
  dandelions.forEach((d) => {
    const u = d.userData
    u.life += dt
    if (!u.active && u.life > u.delay) {
      u.active = true
      u.life = 0
      d.position.set(-4 - Math.random() * 2, (Math.random() - 0.3) * 1.5, -2.5 - Math.random())
    }
    if (u.active) {
      const progress = Math.min(u.life / 7, 1)
      d.position.x += u.speed * dt * (0.8 + Math.sin(t * 0.6 + u.phase) * 0.25)
      d.position.y += Math.sin(t * 0.8 + u.phase) * dt * 0.12
      d.material.opacity = progress < 0.08
        ? (progress / 0.08) * 0.55
        : progress > 0.82
          ? ((1 - progress) / 0.18) * 0.55
          : 0.55
      d.material.rotation += dt * 0.2
      if (progress >= 1) {
        u.active = false
        u.life = 0
        u.delay = 12 + Math.random() * 16
        d.material.opacity = 0
      }
    }
  })

  // 星轨
  if (starTrailGroup) {
    starTrailGroup.rotation.y += dt * 0.05
  }

  // 悬停城市的光圈缓慢闪烁
  if (hoveredHalo && hoveredHalo.material) {
    hoveredHalo.material.opacity = 0.18 + Math.sin(t * 3.2) * 0.08
    const hs = 0.24 + Math.sin(t * 3.2) * 0.03
    hoveredHalo.scale.set(hs, hs, 1)
  }

  // Meteors
  meteorMeshes.forEach(m => {
    const d = m.userData
    d.life += dt

    if (!d.active && d.life > d.delay) {
      d.active = true
      d.life = 0
      // Reset position
      m.position.set(
        (Math.random() - 0.5) * 8,
        2 + Math.random() * 2,
        -4 - Math.random() * 2
      )
      m.material.opacity = 0
    }

    if (d.active) {
      m.position.x -= d.speed * dt * 2
      m.position.y -= d.speed * dt * 1.2
      m.position.z += d.speed * dt * 0.5
      d.life += dt

      const progress = Math.min(d.life / 1.5, 1)
      m.material.opacity = progress < 0.2
        ? progress / 0.2 * 0.5
        : (1 - (progress - 0.2) / 0.8) * 0.5

      if (d.life > 1.5) {
        d.active = false
        d.delay = 10 + Math.random() * 15
        d.life = 0
      }
    }
  })

  // Paper planes
  paperPlanes.forEach(p => {
    const d = p.userData
    d.life += dt

    if (d.life > d.delay) {
      const progress = (d.life - d.delay) / 5
      const clampedProgress = Math.min(progress, 1)
      p.material.opacity = clampedProgress < 0.1
        ? clampedProgress / 0.1 * 0.4
        : (1 - (clampedProgress - 0.1) / 0.9) * 0.4

      p.position.x -= d.side * d.speed * dt * 0.8
      p.position.y += Math.sin(d.life * 0.5 + d.yPhase) * dt * 0.3
      p.position.z += Math.cos(d.life * 0.3 + d.yPhase) * dt * 0.2

      // 旋转
      p.material.rotation += dt * 0.3

      if (clampedProgress >= 1) {
        d.life = 0
        p.material.opacity = 0
        d.side = Math.random() > 0.5 ? 1 : -1
        p.position.set(d.side * 4, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3)
      }
    }
  })

  controls.update()
  if (composer) composer.render()
  else renderer.render(scene, camera)
}

// 手动触发流星
function triggerMeteor() {
  const inactive = meteorMeshes.filter(m => !m.userData.active)
  if (inactive.length > 0) {
    const m = inactive[Math.floor(Math.random() * inactive.length)]
    m.userData.active = true
    m.userData.life = 0
    m.userData.delay = 0
    m.position.set(
      (Math.random() - 0.5) * 8,
      2 + Math.random() * 2,
      -4 - Math.random() * 2
    )
  }
}

// ========== INTERACTION: HOVER ==========
function onThreeHover(e) {
  if (!canvasRef.value || !camera || !raycaster) return
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(markerSprites)
  if (intersects.length > 0) {
    const obj = intersects[0].object
    const city = obj.userData.city
    if (city) {
      hoveredCity.value = city
      tooltipStyle.value = {
        left: e.clientX + 14 + 'px',
        top: e.clientY - 10 + 'px'
      }

      // 高亮光晕
      markerSprites.forEach(s => {
        if (s.userData.halo) {
          s.userData.halo.material.opacity = s.userData.city === city ? 0.22 : 0
          const haloScale = s.userData.city === city ? 0.26 : 0.18
          s.userData.halo.scale.set(haloScale, haloScale, 1)
        }
      })
      hoveredHalo = obj.userData.halo || null
      canvasRef.value.style.cursor = 'pointer'
      return
    }
  }

  hoveredCity.value = null
  hoveredHalo = null
  markerSprites.forEach(s => {
    if (s.userData.halo) {
      s.userData.halo.material.opacity = 0
    }
  })
  canvasRef.value.style.cursor = 'grab'
}

// ========== INTERACTION: CLICK ==========
function onThreeClick(e) {
  if (store.isTransitioning || store.showMemoryCard) return

  if (!canvasRef.value || !camera || !raycaster) return
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(markerSprites)
  if (intersects.length > 0) {
    const obj = intersects[0].object
    const city = obj.userData.city
    if (city) {
      handleCityClick(city)
      return
    }
  }

  // 点击空白处：粒子扩散效果
  store.emitClickParticle(e.clientX, e.clientY)
}

function handleCityClick(city) {
  // 停止自动旋转
  controls.autoRotate = false
  // 存储触发
  store.selectCity(city)

  // 锁定标记呼吸动画
  markerSprites.forEach(s => {
    s.userData._locked = true
  })

  // 镜头平滑移动到城市
  camController.focusOnLatLng(city.lat, city.lng, {
    distance: 2.0,
    duration: 1.0,
    onComplete: () => {
      // 城市光晕放大
      markerSprites.forEach(s => {
        if (s.userData.city === city && s.userData.halo) {
          gsap.to(s.userData.halo.scale, {
            x: 0.36, y: 0.36, duration: 0.6, ease: 'power2.out'
          })
          gsap.to(s.userData.halo.material, {
            opacity: 0.35, duration: 0.6, ease: 'power2.out'
          })
        }
      })
      // 触发星星碎片和粒子效果（动画之后显示）
      setTimeout(() => {
        spawnCityBurst(city)
        store.onCameraArrived()
      }, 400)
    }
  })
}

// ========== GLOBAL MOUSE TRACKING ==========
function onMouseMove(e) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2
}

function onCanvasClick(e) {
  // handled in onThreeClick instead
}

// ========== WATCH GLOBE FROZEN ==========
watch(() => store.isGlobeFrozen, (frozen) => {
  if (!frozen) {
    controls.autoRotate = true
    markerSprites.forEach(s => {
      s.userData._locked = false
    })
    // Reset halo
    markerSprites.forEach(s => {
      if (s.userData.halo) {
        gsap.to(s.userData.halo.scale, {
          x: 0.18, y: 0.18, duration: 0.5, ease: 'power2.out'
        })
        gsap.to(s.userData.halo.material, {
          opacity: 0, duration: 0.5, ease: 'power2.out'
        })
      }
    })
    // Reset camera
    camController.reset({ duration: 1.0 })
  }
})

// ========== RESIZE ==========
function resize() {
  if (!renderer || !camera) return
  const w = canvasRef.value.clientWidth, h = canvasRef.value.clientHeight
  camera.aspect = w / h; camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  if (composer) composer.setSize(w, h)
}

// 监听城市数据变化，动态重建标记点
watch(() => store.cities.length, () => {
  if (earthGroup && markerSprites) {
    rebuildMarkers()
  }
}, { immediate: false })


// ========== LIFECYCLE ==========
onMounted(() => {
  nextTick(() => {
    init()
    window.addEventListener('resize', resize)
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('click', onThreeClick)
    canvasRef.value.removeEventListener('mousemove', onThreeHover)
  }
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss?.()
  }
  if (camController) {
    camController.dispose()
  }
  if (composer) {
    composer.dispose()
  }
})
</script>

<style>
/* ====== Global font import ====== */
/* ====== Container ====== */
.earth-globe {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; animation: globeIn 1.8s ease-out forwards;
}

.earth-canvas {
  width: 100%; height: 100%; display: block; position: relative; z-index: 1;
  cursor: grab; transition: filter 0.9s ease;
  filter: contrast(1.06) saturate(1.05);
}

/* 镜头聚焦城市时：背景轻微虚化（景深感） */
.earth-globe.focusing .earth-canvas {
  filter: blur(1.2px) brightness(1.01) contrast(1.06) saturate(1.05);
}

/* 轻微暗角：让地球从背景中突出来 */
.earth-globe::after {
  content: "";
  position: fixed; inset: 0;
  z-index: 2;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 52%, rgba(105, 130, 168, 0.18) 100%);
}

/* ====== City Tooltip ====== */
.city-tooltip {
  position: fixed;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.tooltip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(200, 215, 245, 0.4);
  animation: tooltipPulse 1.5s ease-in-out infinite;
}

@keyframes tooltipPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.tooltip-name {
  font-family: 'ZCOOL KuaiLe', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: rgba(100, 130, 170, 0.7);
  text-shadow: 0 0 8px rgba(180, 200, 235, 0.3);
  letter-spacing: 1px;
  line-height: 1.2;
}

.tooltip-hint {
  font-size: 9px;
  color: rgba(130, 160, 195, 0.4);
  letter-spacing: 0.5px;
}

.tooltip-fade-enter-active { transition: opacity 0.2s ease; }
.tooltip-fade-leave-active { transition: opacity 0.15s ease; }
.tooltip-fade-enter-from,
.tooltip-fade-leave-to { opacity: 0; }

/* ====== Click Particles ====== */
.click-particle-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}

.click-particle {
  position: absolute;
  animation: particleBurst 1.2s ease-out forwards;
  pointer-events: none;
}

@keyframes particleBurst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  60% {
    opacity: 0.6;
    transform: translate(var(--dx, 20px), var(--dy, -30px)) scale(0.4);
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx, 20px), var(--dy, -30px)) scale(0);
  }
}

/* ====== City Burst Particles ====== */
.burst-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 60;
}

.burst-item {
  position: absolute;
  will-change: transform, opacity;
}

.burst-item svg {
  display: block;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 6px rgba(255, 240, 235, 0.35));
}


/* ====== Decorative bear photos ====== */
.deco-bears { position: absolute; inset: 0; pointer-events: none; z-index: 2; overflow: hidden; }
.deco-bear { position: absolute; transform: translate(-50%, -50%); border-radius: 50%; overflow: hidden; opacity: 0; filter: saturate(1.05) contrast(1.04); animation: fadeInBear 2.5s ease-out forwards, floatBear var(--float-dur, 5s) ease-in-out infinite alternate; animation-delay: var(--anim-delay, 0s); }
.deco-bear-img { display: block; width: 100%; height: 100%; object-fit: cover; mask-image: radial-gradient(circle at center, black 65%, transparent 90%); -webkit-mask-image: radial-gradient(circle at center, black 65%, transparent 90%); }
.deco-bear.layer-1 { z-index: 2; }
.deco-bear.layer-2 { z-index: 1; }
.deco-bear.layer-3 { z-index: 3; }
@keyframes fadeInBear { from { opacity: 0; } to { opacity: 0.3; } }
@keyframes floatBear { 0% { transform: translate(-50%, -50%) rotate(0deg) translateY(0px); } 100% { transform: translate(-50%, -50%) rotate(4deg) translateY(-10px); } }


/* ====== Animations ====== */
@keyframes globeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>




