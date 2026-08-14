<template>
  <div class="floating-decorations" ref="rootRef">
    <!-- 柔和彩虹渐变光 + 梦幻光晕 -->
    <div class="dream-glow" />
    <div class="dream-veil" />

    <!-- 远景层：鼠标跟随较弱 -->
    <div class="parallax-far" ref="farRef">
    <!-- 飘动小云朵 -->
    <div v-for="n in 5" :key="'cloud-'+n" class="float-cloud" :style="cloudStyle(n)" />

    <!-- 纸飞机 -->
    <div v-for="n in 2" :key="'plane-'+n" class="float-plane" :style="planeStyle(n)">
      <svg viewBox="0 0 40 40" width="28" height="28">
        <path d="M2,18 L36,2 L28,20 L20,38 Z" fill="rgba(200,215,245,0.25)" stroke="rgba(200,215,245,0.3)" stroke-width="0.5"/>
        <line x1="20" y1="20" x2="28" y2="8" stroke="rgba(200,215,245,0.15)" stroke-width="0.5"/>
      </svg>
    </div>

    <!-- 信封 -->
    <div v-for="n in 2" :key="'env-'+n" class="float-envelope" :style="envelopeStyle(n)">
      <svg viewBox="0 0 40 30" width="24" height="18">
        <rect x="2" y="4" width="36" height="24" rx="2" fill="rgba(200,215,245,0.15)" stroke="rgba(200,215,245,0.2)" stroke-width="0.5"/>
        <polyline points="2,4 20,18 38,4" fill="none" stroke="rgba(200,215,245,0.15)" stroke-width="0.5"/>
      </svg>
    </div>

    <!-- 邮票装饰 -->
    <div class="stamp stamp-tl" :style="randomStampStyle(1)">
      <svg viewBox="0 0 40 40" width="32" height="32">
        <rect x="2" y="2" width="36" height="36" fill="rgba(180,200,235,0.08)" stroke="rgba(180,200,235,0.15)" stroke-width="0.5" stroke-dasharray="3,3"/>
        <circle cx="20" cy="20" r="8" fill="none" stroke="rgba(180,200,235,0.12)" stroke-width="0.5"/>
        <text x="20" y="24" text-anchor="middle" fill="rgba(180,200,235,0.15)" font-size="6">梦</text>
      </svg>
    </div>
    <div class="stamp stamp-br" :style="randomStampStyle(2)">
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect x="2" y="2" width="36" height="36" fill="rgba(180,200,235,0.08)" stroke="rgba(180,200,235,0.15)" stroke-width="0.5" stroke-dasharray="3,3"/>
        <circle cx="20" cy="20" r="8" fill="none" stroke="rgba(180,200,235,0.12)" stroke-width="0.5"/>
        <text x="20" y="24" text-anchor="middle" fill="rgba(180,200,235,0.15)" font-size="6">旅</text>
      </svg>
    </div>

    <!-- 纸片/便签碎片 -->
    <div v-for="n in 3" :key="'scrap-'+n" class="scrap" :style="scrapStyle(n)" />

    <!-- 地图碎片 -->
    <div class="map-fragment map-fr" :style="randomMapStyle()">
      <svg viewBox="0 0 60 40" width="50" height="34">
        <path d="M2,2 L50,5 L58,30 L8,38 Z" fill="rgba(180,200,235,0.06)" stroke="rgba(180,200,235,0.1)" stroke-width="0.5"/>
        <line x1="10" y1="15" x2="30" y2="18" stroke="rgba(180,200,235,0.08)" stroke-width="0.5" stroke-dasharray="2,3"/>
        <circle cx="25" cy="20" r="2" fill="rgba(180,200,235,0.08)"/>
      </svg>
    </div>

    <!-- 小月亮 -->
    <div class="float-moon" :style="moonStyle()">
      <svg viewBox="0 0 40 40" width="36" height="36">
        <circle cx="20" cy="20" r="16" fill="rgba(240,235,220,0.15)"/>
        <circle cx="14" cy="16" r="10" fill="rgba(210,220,245,0.12)"/>
      </svg>
    </div>
    </div>

    <!-- 近景层：鼠标跟随较强 -->
    <div class="parallax-near" ref="nearRef">
      <!-- 远处漂浮的小岛 -->
      <div v-for="n in 2" :key="'island-' + n" class="float-island" :style="islandStyle(n)">
        <svg viewBox="0 0 100 60" width="120" height="72">
          <path d="M10,48 Q25,30 45,34 Q65,22 85,30 Q95,38 92,48 Z" fill="rgba(180,205,235,0.10)"/>
          <path d="M45,34 Q55,20 65,22 Q70,28 65,32 Q58,36 50,34 Z" fill="rgba(150,190,215,0.14)"/>
          <circle cx="62" cy="18" r="6" fill="rgba(180,215,235,0.12)"/>
          <path d="M60,22 Q58,14 52,10" fill="none" stroke="rgba(180,210,240,0.12)" stroke-width="1"/>
          <path d="M60,22 Q68,14 74,12" fill="none" stroke="rgba(180,210,240,0.12)" stroke-width="1"/>
        </svg>
      </div>

      <!-- 飘动羽毛 -->
      <div v-for="n in 2" :key="'feather-' + n" class="float-feather" :style="featherStyle(n)">
        <svg viewBox="0 0 40 90" width="26" height="58">
          <path d="M20,2 C26,14 30,28 24,44 C32,38 34,48 28,58 C36,52 36,64 26,72 C22,78 20,84 20,88 C20,84 18,78 14,72 C4,64 4,52 12,58 C6,48 8,38 16,44 C10,28 14,14 20,2 Z" fill="rgba(210,225,250,0.10)" stroke="rgba(190,210,245,0.16)" stroke-width="0.5"/>
          <line x1="20" y1="6" x2="20" y2="84" stroke="rgba(190,210,245,0.12)" stroke-width="0.5"/>
        </svg>
      </div>

      <!-- 旅行车票装饰 -->
      <div class="deco-ticket">
        <div class="deco-ticket-body">
          <span class="deco-ticket-label">Oyster Park · 旅行车票</span>
          <span class="deco-ticket-date">2024 → ∞</span>
        </div>
        <div class="deco-ticket-hole" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const rootRef = ref(null)
const farRef = ref(null)
const nearRef = ref(null)

// 鼠标视差：漂浮物轻微跟随
let rafId = null
let mx = 0, my = 0, curX = 0, curY = 0

function onMouseMove(e) {
  mx = (e.clientX / window.innerWidth - 0.5) * 2
  my = (e.clientY / window.innerHeight - 0.5) * 2
}

function parallaxTick() {
  curX += (mx - curX) * 0.04
  curY += (my - curY) * 0.04
  if (farRef.value) {
    farRef.value.style.transform = "translate3d(" + curX * 7 + "px," + curY * 5 + "px,0)"
  }
  if (nearRef.value) {
    nearRef.value.style.transform = "translate3d(" + curX * 14 + "px," + curY * 9 + "px,0)"
  }
  rafId = requestAnimationFrame(parallaxTick)
}

onMounted(() => {
  window.addEventListener("mousemove", onMouseMove)
  rafId = requestAnimationFrame(parallaxTick)
})

onUnmounted(() => {
  window.removeEventListener("mousemove", onMouseMove)
  cancelAnimationFrame(rafId)
})

function rand(min, max) { return Math.random() * (max - min) + min }

function cloudStyle(n) {
  const sides = [
    { t: '10%', l: '5%' },
    { t: '18%', l: '38%' },
    { t: '8%', r: '12%' },
    { t: '35%', l: '2%' },
    { t: '5%', l: '65%' }
  ]
  const side = sides[(n - 1) % sides.length]
  return {
    ...side,
    width: rand(60, 120) + 'px',
    height: rand(24, 38) + 'px',
    '--anim-duration': rand(18, 30) + 's',
    '--anim-delay': rand(0, 10) + 's',
    opacity: rand(0.08, 0.18)
  }
}

function planeStyle(n) {
  const sides = [
    { top: rand(15, 25) + '%', right: rand(-5, 5) + '%' },
    { top: rand(40, 50) + '%', right: rand(-5, 5) + '%' }
  ]
  return {
    ...sides[(n - 1) % sides.length],
    animationDelay: rand(0, 8) + 's',
    animationDuration: rand(12, 18) + 's'
  }
}

function envelopeStyle(n) {
  const sides = [
    { top: rand(60, 70) + '%', left: rand(3, 8) + '%', transform: 'rotate(' + rand(-10, 10) + 'deg)' },
    { top: rand(75, 82) + '%', right: rand(5, 10) + '%', transform: 'rotate(' + rand(-15, 5) + 'deg)' }
  ]
  return {
    ...sides[(n - 1) % sides.length],
    animationDelay: rand(0, 5) + 's'
  }
}

function randomStampStyle(n) {
  const rotations = [rand(-8, 8), rand(-5, 5)]
  return { transform: 'rotate(' + rotations[n - 1] + 'deg)' }
}

function scrapStyle(n) {
  const positions = [
    { t: '25%', r: '8%', w: 20, h: 16, r2: rand(-8, 8) },
    { t: '55%', l: '4%', w: 16, h: 20, r2: rand(-8, 8) },
    { t: '70%', r: '3%', w: 14, h: 12, r2: rand(-5, 5) }
  ]
  const p = positions[(n - 1) % positions.length]
  const base = {
    top: p.t,
    width: p.w + 'px',
    height: p.h + 'px',
    transform: 'rotate(' + p.r2 + 'deg)',
    animationDelay: rand(0, 3) + 's'
  }
  if (p.l !== undefined) base.left = p.l
  if (p.r !== undefined) base.right = p.r
  return base
}

function randomMapStyle() {
  return {
    transform: 'rotate(' + rand(-8, 8) + 'deg)'
  }
}

function moonStyle() {
  return {
    top: rand(8, 15) + '%',
    right: rand(5, 12) + '%',
    animationDelay: rand(0, 5) + 's'
  }
}

function islandStyle(n) {
  const sides = [
    { top: '16%', left: '6%', width: 110, opacity: 0.5, delay: 0 },
    { bottom: '18%', right: '4%', width: 90, opacity: 0.4, delay: 2 }
  ]
  const base = {
    width: sides[n - 1].width + 'px',
    opacity: sides[n - 1].opacity,
    animationDelay: sides[n - 1].delay + 's',
    animationDuration: rand(14, 20) + 's',
    transform: 'rotate(' + (n === 1 ? -3 : 4) + 'deg)'
  }
  const s = sides[n - 1]
  if (s.top !== undefined) base.top = s.top
  if (s.left !== undefined) base.left = s.left
  if (s.bottom !== undefined) base.bottom = s.bottom
  if (s.right !== undefined) base.right = s.right
  return base
}

function featherStyle(n) {
  const sides = [
    { top: '12%', right: '16%', delay: 0 },
    { top: '58%', left: '8%', delay: 4 }
  ]
  const s = sides[(n - 1) % sides.length]
  return {
    top: s.top,
    right: s.right,
    left: s.left,
    animationDelay: s.delay + 's',
    '--sway': (n % 2 === 0 ? 1 : -1) * 24 + 'px'
  }
}
</script>

<style scoped>
.floating-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  overflow: hidden;
}

/* Clouds */
.float-cloud {
  position: absolute;
  background: rgba(210, 225, 250, 0.12);
  border-radius: 50%;
  filter: blur(6px);
  animation: floatCloud var(--anim-duration, 20s) ease-in-out infinite alternate;
  animation-delay: var(--anim-delay, 0s);
}

@keyframes floatCloud {
  0% { transform: translateX(-10px); }
  100% { transform: translateX(15px); }
}

/* Paper plane */
.float-plane {
  position: absolute;
  opacity: 0;
  animation: flyPlane linear infinite;
}

@keyframes flyPlane {
  0% {
    opacity: 0;
    transform: translateX(0) translateY(0) rotate(-10deg);
  }
  10% { opacity: 0.5; }
  50% {
    opacity: 0.4;
    transform: translateX(-120px) translateY(-60px) rotate(-15deg);
  }
  90% {
    opacity: 0.2;
    transform: translateX(-240px) translateY(10px) rotate(-5deg);
  }
  100% {
    opacity: 0;
    transform: translateX(-260px) translateY(30px) rotate(0deg);
  }
}

/* Envelope */
.float-envelope {
  position: absolute;
  animation: floatEnv 5s ease-in-out infinite alternate;
}

@keyframes floatEnv {
  0% { transform: translateY(0) rotate(var(--rotate, 0deg)); }
  100% { transform: translateY(-8px) rotate(var(--rotate, 0deg)); }
}

/* Stamp */
.stamp {
  position: absolute;
  pointer-events: none;
  opacity: 0.6;
}

.stamp-tl { top: 8%; left: 8%; }
.stamp-br { bottom: 12%; right: 8%; }

/* Scrap paper */
.scrap {
  position: absolute;
  background: rgba(210, 225, 250, 0.06);
  border: 1px solid rgba(180, 200, 235, 0.08);
  border-radius: 2px;
  animation: floatScrap 3s ease-in-out infinite alternate;
}

@keyframes floatScrap {
  0% { transform: translateY(0) rotate(var(--r, 0deg)); }
  100% { transform: translateY(-5px) rotate(var(--r, 0deg)); }
}

/* Map fragment */
.map-fragment {
  position: absolute;
  pointer-events: none;
  opacity: 0.4;
}

.map-fr { bottom: 25%; right: 5%; }

/* Moon */
.float-moon {
  position: absolute;
  animation: floatMoon 6s ease-in-out infinite alternate;
  filter: blur(1px);
}

@keyframes floatMoon {
  0% { transform: translateY(-3px) rotate(-2deg); }
  100% { transform: translateY(3px) rotate(2deg); }
}

/* ====== 彩虹渐变光 + 梦幻光晕 ====== */
.dream-glow {
  position: absolute; inset: -25%;
  z-index: 0; pointer-events: none;
  background: conic-gradient(
    from 0deg,
    rgba(255, 214, 224, 0.06),
    rgba(214, 240, 255, 0.08),
    rgba(214, 255, 232, 0.06),
    rgba(255, 240, 214, 0.06),
    rgba(224, 214, 255, 0.08),
    rgba(255, 214, 224, 0.06)
  );
  filter: blur(72px);
  animation: glowSpin 70s linear infinite;
  opacity: 0.18;
}

@keyframes glowSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dream-veil {
  position: absolute; inset: 0;
  z-index: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 42%, rgba(255, 252, 248, 0.08), transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(190, 215, 245, 0.05), transparent 55%);
}

/* ====== Parallax layers ====== */
.parallax-far,
.parallax-near {
  position: absolute; inset: 0;
  will-change: transform;
}
.parallax-far { z-index: 1; }
.parallax-near { z-index: 2; }

/* ====== Floating islands ====== */
.float-island {
  position: absolute;
  pointer-events: none;
  animation: floatIsland ease-in-out infinite alternate;
  filter: blur(1px);
}

@keyframes floatIsland {
  0% { transform: translateY(0) rotate(var(--r, 0deg)); }
  100% { transform: translateY(-10px) rotate(var(--r, 0deg)); }
}

/* ====== Feathers ====== */
.float-feather {
  position: absolute;
  pointer-events: none;
  opacity: 0.45;
  animation: floatFeather 9s ease-in-out infinite;
}

@keyframes floatFeather {
  0% { transform: translate(0, 0) rotate(0deg) scaleY(1); opacity: 0; }
  12% { opacity: 0.65; }
  45% { transform: translate(var(--sway, 20px), 22px) rotate(14deg) scaleY(0.96); }
  75% { transform: translate(calc(var(--sway, 20px) * -0.6), 44px) rotate(-10deg) scaleY(0.98); opacity: 0.45; }
  100% { transform: translate(calc(var(--sway, 20px) * 0.3), 70px) rotate(6deg) scaleY(1); opacity: 0; }
}

/* ====== Deco ticket ====== */
.deco-ticket {
  position: absolute;
  left: 4%; bottom: 8%;
  display: flex; align-items: stretch;
  background: rgba(250, 248, 255, 0.18);
  border: 1px dashed rgba(180, 180, 235, 0.2);
  border-radius: 4px;
  transform: rotate(-5deg);
  animation: floatTicket 7s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes floatTicket {
  0% { transform: rotate(-5deg) translateY(0); }
  100% { transform: rotate(-3deg) translateY(-6px); }
}

.deco-ticket-body {
  display: flex; flex-direction: column; gap: 1px;
  padding: 5px 10px;
}
.deco-ticket-label {
  font-size: 9px; letter-spacing: 1.5px;
  color: rgba(120, 115, 175, 0.35);
  text-transform: uppercase;
}
.deco-ticket-date {
  font-size: 8px; letter-spacing: 1px;
  color: rgba(140, 135, 195, 0.3);
}
.deco-ticket-hole {
  width: 1px; margin: 3px 0;
  background: repeating-linear-gradient(180deg, rgba(180,180,235,0.18) 0 3px, transparent 3px 7px);
}
</style>
