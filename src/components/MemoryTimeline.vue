<template>
  <div v-if="timeline.length" class="timeline-wrapper">
    <!-- 折叠状态：时间胶囊预览 -->
    <div v-if="!isOpen" class="timeline-teaser" @click="isOpen = true">
      <div class="teaser-icon">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(160,185,215,0.35)" stroke-width="0.9"/>
          <path d="M12,7 L12,12 L15.5,14" fill="none" stroke="rgba(160,185,215,0.35)" stroke-width="0.9" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="1.4" fill="rgba(160,185,215,0.35)"/>
        </svg>
      </div>
      <div class="teaser-texts">
        <span class="teaser-title">时间胶囊</span>
        <span class="teaser-sub">Memory Timeline · 出发到回程</span>
      </div>
      <div class="teaser-corner" />
    </div>

    <!-- 展开状态：翻页时间轴 -->
    <Transition name="journal-open">
      <div v-if="isOpen" class="timeline-book">
        <div class="notebook-spine" />
        <div class="timeline-content">
          <div class="timeline-header">
            <h3 class="timeline-title">🕰️ {{ cityName }} · 时间胶囊</h3>
            <span class="timeline-sub">把一路的故事，按时间收好</span>
          </div>

          <div class="timeline-track">
            <div
              v-for="(node, idx) in nodes"
              :key="'node-' + idx"
              class="timeline-node"
              :class="{ right: idx % 2 === 1 }"
            >
              <div class="node-marker">
                <span class="node-emoji">{{ stageIcon(node.stage) }}</span>
              </div>
              <div class="node-card">
                <div class="node-stage">{{ node.stage }}</div>
                <p class="node-caption">{{ node.caption }}</p>
                <div v-if="node.photoUrl" class="node-photo-wrap">
                  <img :src="node.photoUrl" :alt="node.stage" class="node-photo" loading="lazy" />
                  <div class="photo-tape" />
                </div>
              </div>
            </div>
          </div>

          <div class="timeline-close" @click="isOpen = false">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path d="M4,4 L12,12 M12,4 L4,12" stroke="rgba(100,130,170,0.3)" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useMemoryStore } from "../stores/memory.js"

const store = useMemoryStore()

const props = defineProps({
  city: { type: Object, default: null },
  timeline: { type: Array, default: () => [] },
})

const isOpen = ref(false)

const cityName = computed(() => props.city?.name || "旅行")

const nodes = computed(() =>
  props.timeline.map((node) => ({
    ...node,
    photoUrl: node.photo ? store.getPhotoUrl(props.city, node.photo) : "",
  }))
)

function stageIcon(stage) {
  const map = {
    出发: "✈️",
    到达: "📍",
    游玩: "🎡",
    夜景: "🌙",
    回程: "🧳",
  }
  for (const key of Object.keys(map)) {
    if (String(stage || "").includes(key)) return map[key]
  }
  return "⭐"
}
</script>

<style scoped>
.timeline-wrapper { position: relative; margin-top: 10px; }

/* Teaser */
.timeline-teaser {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  background: rgba(240, 235, 255, 0.22);
  border: 1px dashed rgba(190, 180, 235, 0.28);
  border-radius: 8px;
  cursor: pointer;
  position: relative; overflow: hidden;
  transition: all 0.3s ease;
}
.timeline-teaser:hover {
  background: rgba(240, 235, 255, 0.32);
  border-color: rgba(190, 180, 235, 0.4);
}
.teaser-icon { flex-shrink: 0; display: flex; }
.teaser-texts { display: flex; flex-direction: column; gap: 1px; }
.teaser-title {
  font-family: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  font-size: 12px; color: rgba(110, 100, 160, 0.55);
  letter-spacing: 1px;
}
.teaser-sub { font-size: 10px; color: rgba(130, 125, 175, 0.4); letter-spacing: 0.5px; }
.teaser-corner {
  position: absolute; top: 0; right: 0;
  width: 0; height: 0; border-style: solid;
  border-width: 0 12px 12px 0;
  border-color: transparent rgba(190, 180, 235, 0.1) transparent transparent;
}

/* Book */
.timeline-book {
  position: relative; margin-top: 4px; display: flex;
  animation: notebookFlip 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes notebookFlip {
  from { opacity: 0; transform: rotateX(-5deg) scaleY(0.95); transform-origin: top center; }
  to { opacity: 1; transform: rotateX(0) scaleY(1); }
}
.notebook-spine {
  width: 6px; flex-shrink: 0; margin-right: 8px;
  background: linear-gradient(180deg, rgba(190,180,235,0.14), rgba(190,180,235,0.06));
  border-radius: 3px 0 0 3px; position: relative;
}
.notebook-spine::after {
  content: ""; position: absolute; top: 12px; bottom: 12px; left: 2px; width: 2px;
  background: rgba(190,180,235,0.1); border-radius: 1px;
}
.timeline-content {
  flex: 1; padding: 14px 14px 12px;
  background: rgba(247, 245, 255, 0.35);
  border: 1px solid rgba(200, 200, 245, 0.1);
  border-radius: 0 8px 8px 0; position: relative;
}
.timeline-header { margin-bottom: 14px; }
.timeline-title {
  font-family: "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px; font-weight: 400; color: rgba(95, 90, 150, 0.65);
  margin: 0 0 3px; letter-spacing: 0.5px;
}
.timeline-sub { font-size: 10px; color: rgba(130, 125, 175, 0.4); letter-spacing: 0.5px; }

/* Track */
.timeline-track { position: relative; }
.timeline-track::before {
  content: ""; position: absolute; top: 6px; bottom: 6px; left: 50%;
  width: 1px; transform: translateX(-50%);
  background: repeating-linear-gradient(180deg, rgba(190,180,235,0.22) 0 3px, transparent 3px 7px);
}
.timeline-node {
  position: relative; width: calc(50% - 14px); margin-bottom: 14px;
  animation: nodeIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.timeline-node:nth-child(1) { animation-delay: 0.05s; }
.timeline-node:nth-child(2) { animation-delay: 0.12s; }
.timeline-node:nth-child(3) { animation-delay: 0.19s; }
.timeline-node:nth-child(4) { animation-delay: 0.26s; }
.timeline-node:nth-child(5) { animation-delay: 0.33s; }
.timeline-node:nth-child(6) { animation-delay: 0.4s; }
@keyframes nodeIn {
  from { opacity: 0; transform: translateY(8px) rotate(var(--tilt, 0deg)); }
  to { opacity: 1; transform: translateY(0) rotate(var(--tilt, 0deg)); }
}

.timeline-node.right { margin-left: calc(50% + 14px); }

.node-marker {
  position: absolute; top: 4px; right: -22px;
  width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(190, 180, 235, 0.25);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(230, 225, 255, 0.25);
  z-index: 2;
}
.timeline-node.right .node-marker { right: auto; left: -22px; }
.node-emoji { font-size: 10px; line-height: 1; }

.node-card {
  padding: 8px 10px;
  background: rgba(250, 249, 255, 0.5);
  border: 1px solid rgba(210, 205, 245, 0.16);
  border-radius: 7px;
  box-shadow: 0 1px 5px rgba(150, 140, 200, 0.05);
}
.node-card:hover { background: rgba(250, 249, 255, 0.75); }
.node-stage {
  font-family: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  font-size: 12px; color: rgba(110, 100, 165, 0.6);
  letter-spacing: 1px; margin-bottom: 3px;
}
.node-caption {
  font-size: 11px; line-height: 1.65; color: rgba(105, 105, 150, 0.55);
  margin: 0 0 7px; letter-spacing: 0.2px;
}
.node-photo-wrap { position: relative; width: 74px; }
.node-photo {
  display: block; width: 74px; height: 52px;
  object-fit: cover; border-radius: 3px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(140, 150, 200, 0.12);
  transform: rotate(-1.5deg);
}
.timeline-node.right .node-photo { transform: rotate(1.5deg); }
.photo-tape {
  position: absolute; top: -5px; left: 50%; width: 26px; height: 7px;
  transform: translateX(-50%) rotate(-2deg);
  background: rgba(200, 210, 250, 0.2);
  border: 1px solid rgba(190, 200, 245, 0.12);
}

.timeline-close {
  position: absolute; top: 8px; right: 8px;
  width: 24px; height: 24px; display: flex;
  align-items: center; justify-content: center;
  cursor: pointer; border-radius: 50%;
  transition: background 0.2s ease;
}
.timeline-close:hover { background: rgba(200, 200, 245, 0.14); }

.journal-open-enter-active { transition: opacity 0.4s ease; }
.journal-open-leave-active { transition: opacity 0.3s ease; }
.journal-open-enter-from,
.journal-open-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .timeline-node { width: calc(50% - 10px); }
  .timeline-node.right { margin-left: calc(50% + 10px); }
  .node-caption { font-size: 10px; }
}
</style>
