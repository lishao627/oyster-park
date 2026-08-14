<template>
  <div v-if="visible" class="dream-park-loader" :class="{ 'fade-out': isFading }">
    <div class="bg-layer"></div>
    <div class="deco-stars" :class="{ show: showStage >= 3 }">
      <span v-for="n in 30" :key="'star-'+n" class="star" :style="starStyle(n)"></span>
    </div>
    <div class="deco-bow bow-left" :class="{ show: showStage >= 4 }">
      <svg viewBox="0 0 60 40" width="60" height="40">
        <path d="M30,20 Q15,0 30,5 Q45,0 30,20" fill="rgba(200,215,245,0.3)" stroke="none"/>
        <circle cx="30" cy="12" r="3" fill="rgba(200,215,245,0.35)"/>
      </svg>
    </div>
    <div class="deco-bow bow-right" :class="{ show: showStage >= 4 }">
      <svg viewBox="0 0 60 40" width="60" height="40">
        <path d="M30,20 Q15,0 30,5 Q45,0 30,20" fill="rgba(200,215,245,0.3)" stroke="none"/>
        <circle cx="30" cy="12" r="3" fill="rgba(200,215,245,0.35)"/>
      </svg>
    </div>
    <div class="deco-lace lace-tl" :class="{ show: showStage >= 4 }">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <path d="M0,80 Q20,60 40,40 Q60,20 80,0" stroke="rgba(200,215,245,0.18)" stroke-width="1.5" fill="none"/>
        <circle cx="40" cy="40" r="4" fill="rgba(200,215,245,0.12)"/>
      </svg>
    </div>
    <div class="deco-lace lace-tr" :class="{ show: showStage >= 4 }">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <path d="M0,0 Q20,20 40,40 Q60,60 80,80" stroke="rgba(200,215,245,0.18)" stroke-width="1.5" fill="none"/>
        <circle cx="40" cy="40" r="4" fill="rgba(200,215,245,0.12)"/>
      </svg>
    </div>
    <div class="bears-wrap" :class="{ show: showStage >= 1 }">
      <img :src="bearsImg" alt="" class="bears-img" draggable="false" />
    </div>
    <div class="title-wrap" :class="{ show: showStage >= 2 }">
      <h1 class="title-en">Oyster Park</h1>
      <h2 class="title-cn">梦幻旅行记忆馆</h2>
    </div>
    <div class="enter-wrap" :class="{ show: showStage >= 3 }">
      <button class="enter-btn" @click="skip">ENTER</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const visible = ref(true)
const showStage = ref(-1)
const isFading = ref(false)
const emit = defineEmits(["complete"])

const bearsImg = new URL("../assets/imgs/little background.jpg", import.meta.url).href
let timers = []

function starStyle(n) {
  const size = 2 + (n % 5) * 1.5
  const top = 2 + (n * 17) % 96
  const left = 3 + (n * 13) % 94
  const delay = (n % 8) * 0.5
  const duration = 2 + (n % 4) * 0.5
  return { width: size + "px", height: size + "px", top: top + "%", left: left + "%", animationDelay: delay + "s", animationDuration: duration + "s" }
}

function skip() {
  timers.forEach(t => clearTimeout(t))
  timers = []
  isFading.value = true
  // 通知父组件：弹出登录框
  emit("complete")
}

onMounted(() => {
  // 逐步展示装饰元素，但不自动过渡到地球
  const delays = [200, 800, 1800, 2800, 3800]
  delays.forEach((d, i) => {
    const t = setTimeout(() => { showStage.value = i }, d)
    timers.push(t)
  })
})
</script>

<style>
.dream-park-loader {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  transition: opacity 2s ease;
  pointer-events: auto;
}
.dream-park-loader.fade-out {
  opacity: 0;
  pointer-events: none;
}
.bg-layer {
  position: absolute; inset: -10px;
  background: #c8d4e8 url("../assets/imgs/background.jpg") center/cover no-repeat;
  filter: brightness(1.05) saturate(0.85);
}
.deco-stars {
  position: absolute; inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 2.5s ease;
}
.deco-stars.show { opacity: 1; }
.star {
  position: absolute;
  background: rgba(255,255,255,0.25);
  border-radius: 50%;
  animation: twinkle ease-in-out infinite alternate;
}
@keyframes twinkle {
  0% { opacity: 0.15; transform: scale(0.6); }
  100% { opacity: 0.6; transform: scale(1.1); }
}
.deco-bow {
  position: absolute; top: 8%;
  opacity: 0;
  transition: opacity 1.5s ease, transform 1.5s ease;
  pointer-events: none;
}
.deco-bow.show { opacity: 1; }
.bow-left { left: 6%; transform: translateY(-10px) rotate(-15deg); }
.bow-left.show { transform: translateY(0) rotate(-15deg); }
.bow-right { right: 6%; transform: translateY(-10px) rotate(15deg) scaleX(-1); }
.bow-right.show { transform: translateY(0) rotate(15deg) scaleX(-1); }
.deco-lace {
  position: absolute;
  opacity: 0;
  transition: opacity 2s ease;
  pointer-events: none;
}
.deco-lace.show { opacity: 1; }
.lace-tl { top: 8px; left: 8px; }
.lace-tr { top: 8px; right: 8px; transform: scaleX(-1); }
.bears-wrap {
  position: relative; z-index: 2;
  opacity: 0; transform: translateY(15px);
  transition: opacity 1.5s ease, transform 1.5s ease;
  pointer-events: none;
  max-width: 300px; width: 70vw;
}
.bears-wrap.show { opacity: 1; transform: translateY(0); }
.bears-img {
  display: block; width: 100%; height: auto;
  border-radius: 50%;
  mask-image: radial-gradient(circle at center, black 60%, transparent 85%);
  -webkit-mask-image: radial-gradient(circle at center, black 60%, transparent 85%);
}
.title-wrap {
  position: relative; z-index: 3;
  text-align: center; margin-top: 24px;
  opacity: 0; transform: translateY(10px);
  transition: opacity 1.5s ease, transform 1.5s ease;
  pointer-events: none;
}
.title-wrap.show { opacity: 1; transform: translateY(0); }
.title-en {
  font-family: "Press Start 2P", "Courier New", monospace;
  font-size: clamp(1.2rem, 5vw, 2.2rem);
  color: rgba(200,210,230,0.7);
  text-shadow: 0 0 20px rgba(180,195,230,0.25), 0 0 40px rgba(180,195,230,0.1);
  letter-spacing: 4px; margin: 0; line-height: 1.4;
}
.title-cn {
  font-family: "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: clamp(0.9rem, 3.5vw, 1.4rem);
  color: rgba(190,200,225,0.65);
  text-shadow: 0 0 16px rgba(180,195,230,0.2), 0 0 30px rgba(180,195,230,0.08);
  margin: 8px 0 0; letter-spacing: 3px;
}
.enter-wrap {
  position: relative; z-index: 3;
  margin-top: 28px;
  opacity: 0;
  transition: opacity 1s ease;
}
.enter-wrap.show { opacity: 1; }
.enter-btn {
  font-family: "Press Start 2P", "Courier New", monospace;
  font-size: 11px;
  color: rgba(200,210,230,0.55);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(200,215,245,0.12);
  border-radius: 24px; padding: 10px 24px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  letter-spacing: 3px;
  transition: all 0.4s ease;
}
.enter-btn:hover {
  background: rgba(255,255,255,0.1);
  color: rgba(215,225,245,0.7);
  border-color: rgba(200,215,245,0.2);
  box-shadow: 0 0 20px rgba(180,195,230,0.08);
}
@media (max-width: 640px) {
  .bears-wrap { max-width: 180px; }
  .bow-left { left: 3%; }
  .bow-right { right: 3%; }
  .deco-bow svg { width: 36px; height: 24px; }
}
@media (min-width: 1200px) {
  .bears-wrap { max-width: 340px; }
}
</style>
