<template>
  <div class="photo-stack">
    <div class="photos-scattered">
      <div
        v-for="(photo, idx) in photos"
        :key="idx"
        class="polaroid"
        :class="{ 'photo-expanded': expandedIdx === idx }"
        :style="polaroidStyle(idx)"
        @click="expandedIdx = idx"
      >
        <div class="polaroid-img-wrap">
          <img
            :src="photo.url"
            :alt="'photo-' + idx"
            class="polaroid-img"
            @error="onImgError(idx)"
            :class="{ 'img-hidden': erroredMap[idx] }"
          />
          <div v-if="erroredMap[idx]" class="photo-placeholder">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="rgba(180,200,235,0.2)" stroke-width="0.8"/>
              <circle cx="10" cy="11" r="2" fill="rgba(180,200,235,0.1)"/>
              <polyline points="3,18 10,12 14,16 18,10 21,14" fill="none" stroke="rgba(180,200,235,0.1)" stroke-width="0.8"/>
            </svg>
          </div>
        </div>
        <div class="polaroid-footer" />
      </div>
    </div>

    <!-- 展开大图 -->
    <Transition name="expand">
      <div v-if="expandedIdx !== null" class="expanded-overlay" @click.self="expandedIdx = null">
        <div class="expanded-wrap">
          <img
            :src="photos[expandedIdx]?.url"
            alt="expanded"
            class="expanded-img"
            @click="onImageClick"
          />
          <div class="expanded-nav">
            <button
              v-if="expandedIdx > 0"
              class="nav-btn prev-btn"
              @click.stop="expandedIdx--"
            >
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15,4 L7,12 L15,20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button
              v-if="expandedIdx < photos.length - 1"
              class="nav-btn next-btn"
              @click.stop="expandedIdx++"
            >
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9,4 L17,12 L9,20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div class="expanded-index">{{ expandedIdx + 1 }} / {{ photos.length }}</div>
          <button class="expanded-close" @click="expandedIdx = null">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6,6 L18,18 M18,6 L6,18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
          </button>
          <div class="thumbnail-strip" v-if="photos.length > 1">
            <div
              v-for="(thumb, tidx) in photos"
              :key="'thumb-'+tidx"
              class="thumb-dot"
              :class="{ active: tidx === expandedIdx }"
              @click.stop="expandedIdx = tidx"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  photos: { type: Array, default: () => [] }
})

const expandedIdx = ref(null)
const erroredMap = ref({})

function onImgError(idx) {
  erroredMap.value[idx] = true
}

function rand(min, max) { return Math.random() * (max - min) + min }

function polaroidStyle(idx) {
  const rot = rand(-6, 6)
  const y = rand(-6, 6)
  const x = rand(-8, 8)
  return {
    transform: 'rotate(' + rot + 'deg)',
    top: 'calc(50% + ' + y + 'px)',
    left: 'calc(50% + ' + x + 'px)',
    zIndex: idx,
    '--anim-delay': (idx * 0.15) + 's'
  }
}

function onImageClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  if (x < rect.width * 0.4 && expandedIdx.value > 0) {
    expandedIdx.value--
  } else if (x > rect.width * 0.6 && expandedIdx.value < props.photos.length - 1) {
    expandedIdx.value++
  }
}

function onKeydown(e) {
  if (expandedIdx.value === null) return
  if (e.key === 'ArrowLeft' && expandedIdx.value > 0) {
    e.preventDefault()
    expandedIdx.value--
  } else if (e.key === 'ArrowRight' && expandedIdx.value < props.photos.length - 1) {
    e.preventDefault()
    expandedIdx.value++
  } else if (e.key === 'Escape') {
    expandedIdx.value = null
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.photo-stack {
  position: relative;
  width: 100%;
  min-height: 160px;
  margin: 6px 0 10px;
}

.photos-scattered {
  position: relative;
  width: 100%;
  height: 160px;
}

.polaroid {
  position: absolute;
  width: 96px;
  background: rgba(250, 250, 255, 0.6);
  border: 1px solid rgba(200, 215, 240, 0.15);
  border-radius: 3px;
  padding: 5px 5px 16px 5px;
  box-shadow: 0 2px 8px rgba(140, 170, 210, 0.06);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: polaroidIn 0.5s ease-out backwards;
  animation-delay: var(--anim-delay, 0s);
}

@keyframes polaroidIn {
  from {
    opacity: 0;
    transform: rotate(0deg) scale(0.7);
  }
  to {
    opacity: 1;
    transform: rotate(var(--r, 0deg)) scale(1);
  }
}

.polaroid:hover {
  transform: scale(1.08) !important;
  box-shadow: 0 4px 16px rgba(140, 170, 210, 0.1);
  z-index: 100 !important;
}

.polaroid.photo-expanded {
  transform: scale(2.5) !important;
  z-index: 200 !important;
  box-shadow: 0 8px 40px rgba(140, 170, 210, 0.15);
}

.polaroid-img-wrap {
  width: 100%;
  height: 70px;
  overflow: hidden;
  border-radius: 2px;
}

.polaroid-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.polaroid-img.img-hidden {
  opacity: 0;
  position: absolute;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(200, 215, 240, 0.05);
}

.polaroid-footer {
  height: 12px;
}

/* Expanded overlay */
.expanded-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(180, 200, 225, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.expanded-wrap {
  position: relative;
  max-width: 80vw;
  max-height: 80vh;
}

.expanded-img {
  max-width: 80vw;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 8px 60px rgba(140, 170, 210, 0.12);
  animation: expandIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes expandIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.expanded-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
  pointer-events: none;
  padding: 0 8px;
}

.nav-btn {
  pointer-events: auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(100, 130, 170, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  color: rgba(80, 110, 150, 0.8);
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.expanded-index {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: rgba(110, 140, 175, 0.5);
  letter-spacing: 1px;
}

/* Transition */
.expand-enter-active {
  transition: opacity 0.3s ease;
}

.expand-leave-active {
  transition: opacity 0.25s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
}

.expanded-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: rgba(100, 130, 170, 0.5);
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.expanded-close:hover {
  background: rgba(255, 255, 255, 0.7);
  color: rgba(80, 110, 150, 0.8);
  transform: rotate(90deg);
}

.thumbnail-strip {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.thumb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(200, 215, 245, 0.35);
  cursor: pointer;
  transition: all 0.3s ease;
}
.thumb-dot:hover {
  background: rgba(200, 215, 245, 0.6);
  transform: scale(1.3);
}
.thumb-dot.active {
  background: rgba(160, 190, 220, 0.7);
  transform: scale(1.2);
}

@media (max-width: 640px) {
  .polaroid {
    width: 72px;
  }
  .polaroid-img-wrap {
    height: 52px;
  }
  .expanded-img {
    max-width: 92vw;
    max-height: 70vh;
  }
  .nav-btn {
    width: 34px;
    height: 34px;
  }
  .expanded-close {
    top: -36px;
    width: 28px;
    height: 28px;
  }
  .thumbnail-strip {
    bottom: -28px;
    padding: 4px 10px;
    gap: 6px;
  }
}
</style>
