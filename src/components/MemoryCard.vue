<template>
  <div v-if="city" class="memory-card-overlay" @click.self="close">
    <div class="memory-card" :class="{ 'card-visible': visible }">
      <div class="tape tape-tl" /><div class="tape tape-tr" />

      <button class="close-btn" @click="close">
        <svg viewBox="0 0 16 16" width="16" height="16">
          <path d="M4,4 L12,12 M12,4 L4,12" stroke="rgba(100,130,170,0.4)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- 封面区 -->
      <div class="card-cover">
        <div class="cover-img-wrap">
          <img :src="coverUrl" :alt="city.name" class="cover-img" @error="coverErrored = true" :class="{ 'img-hidden': coverErrored }" />
          <div v-if="coverErrored" class="cover-placeholder">
            <svg viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="16" fill="rgba(180,200,235,0.1)" stroke="rgba(180,200,235,0.15)" stroke-width="0.5"/>
              <text x="20" y="26" text-anchor="middle" fill="rgba(180,200,235,0.25)" font-size="14">📸</text>
            </svg>
          </div>
        </div>
        <div class="postmark">
          <svg viewBox="0 0 48 48" width="48" height="48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(180,200,235,0.15)" stroke-width="0.5" stroke-dasharray="3,2"/>
            <circle cx="24" cy="24" r="14" fill="none" stroke="rgba(180,200,235,0.1)" stroke-width="0.5"/>
            <text x="24" y="28" text-anchor="middle" fill="rgba(180,200,235,0.2)" font-size="6" font-family="serif">{{ city.date?.slice(-2) }}</text>
          </svg>
        </div>
      </div>

      <!-- 标题区 + 删除 -->
      <div class="card-header">
        <div class="header-top">
          <h2 class="city-name">{{ city.name }}</h2>
          <button class="delete-city-btn" @click="handleDeleteCity" title="删除城市">
            <svg viewBox="0 0 16 16" width="13" height="13">
              <path d="M3,4 L13,4 M5.5,4 L5.5,3 C5.5,2.4 6,2 6.5,2 L9.5,2 C10,2 10.5,2.4 10.5,3 L10.5,4 M6,7 L6,12 M10,7 L10,12 M4,4 L12,4 L12,13 C12,13.6 11.5,14 11,14 L5,14 C4.5,14 4,13.6 4,13 Z" stroke="rgba(160,130,130,0.35)" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <p class="city-date">{{ city.date }}</p>
      </div>

      <!-- 旅行车票（scrapbook 装饰） -->
      <div class="ticket">
        <div class="ticket-left">
          <div class="ticket-line">
            <span class="ticket-plane">✈️</span>
            <span class="ticket-label">Oyster Park · 旅行车票</span>
          </div>
          <div class="ticket-route">
            <span class="ticket-city">{{ city.name }}</span>
            <span class="ticket-arrow">→</span>
            <span class="ticket-city ticket-memory">梦境记忆馆</span>
          </div>
        </div>
        <div class="ticket-notch" />
        <div class="ticket-right">
          <div class="ticket-date">{{ city.date }}</div>
          <div class="ticket-stamp">M</div>
        </div>
      </div>

      <!-- 照片墙 -->
      <PhotoStack :photos="store.getPhotos(city)" />

      <!-- 照片上传 -->
      <PhotoUploader v-if="store.isLoggedIn" :cityId="city.id" @uploaded="onPhotosUploaded" />

      <!-- 旅行手账 -->
      <JournalNote v-if="city.journal || true" :journal="city.journal" :cityName="city.name" :cityId="city.id" :date="city.date" />

      <!-- 时间胶囊：出发 → 到达 → 游玩 → 夜景 → 回程 -->
      <MemoryTimeline :city="city" :timeline="store.getTimeline(city)" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue"
import { useMemoryStore } from "../stores/memory.js"
import PhotoStack from "./PhotoStack.vue"
import JournalNote from "./JournalNote.vue"
import PhotoUploader from "./PhotoUploader.vue"
import MemoryTimeline from "./MemoryTimeline.vue"

const store = useMemoryStore()

const visible = ref(false)
const coverErrored = ref(false)

const city = computed(() => store.selectedCity)
const coverUrl = computed(() => city.value ? store.getCoverUrl(city.value) : "")

watch(() => store.showMemoryCard, (show) => {
  if (show) {
    coverErrored.value = false
    nextTick(() => { setTimeout(() => { visible.value = true }, 50) })
  } else {
    visible.value = false
  }
})

function close() { store.closeMemoryCard() }

function onPhotosUploaded() {
  // 上传完成后重新加载城市数据
  store.fetchCities()
}

async function handleDeleteCity() {
  if (!city.value || !confirm(`确定要删除 ${city.value.name} 吗？所有照片和手账将同时删除。`)) return
  try {
    await store.removeCity(city.value.id)
    close()
  } catch (err) {
    console.error("删除城市失败:", err)
  }
}
</script>

<style scoped>
.memory-card-overlay {
  position: fixed; inset: 0; z-index: 40;
  display: flex; align-items: center; justify-content: flex-end;
  background: rgba(180, 200, 225, 0.08);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.memory-card {
  position: relative; width: 440px; max-width: 88vw; max-height: 92vh;
  margin-right: clamp(10px, 3vw, 40px);
  background: linear-gradient(160deg, rgba(240, 245, 255, 0.92), rgba(230, 240, 255, 0.88));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px; padding: 36px 28px 28px;
  box-shadow: 0 8px 60px rgba(160, 195, 230, 0.15), 0 0 120px rgba(160, 195, 230, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  overflow-y: auto;
  transform: translateX(120%); opacity: 0;
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease;
}
.memory-card.card-visible { transform: translateX(0); opacity: 1; }
.memory-card::-webkit-scrollbar { width: 3px; }
.memory-card::-webkit-scrollbar-track { background: transparent; }
.memory-card::-webkit-scrollbar-thumb { background: rgba(160,185,215,0.15); border-radius: 3px; }
.tape { position: absolute; width: 40px; height: 12px; background: rgba(200,215,245,0.15); border: 1px solid rgba(180,200,235,0.1); border-radius: 1px; }
.tape-tl { top: -4px; left: 50%; transform: translateX(-50%) rotate(-2deg); }
.tape-tr { top: 12px; right: -4px; width: 12px; height: 40px; transform: rotate(2deg); }
.close-btn {
  position: absolute; top: 10px; right: 10px;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.3); border: none; border-radius: 50%;
  cursor: pointer; transition: all 0.3s ease; z-index: 5;
}
.close-btn:hover { background: rgba(255, 255, 255, 0.5); transform: rotate(90deg); }
.card-cover { position: relative; width: 100%; height: 180px; border-radius: 14px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(140,170,210,0.08); }
.cover-img-wrap { width: 100%; height: 100%; }
.cover-img { display: block; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.4s ease; }
.cover-img.img-hidden { opacity: 0; position: absolute; }
.cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(200,215,240,0.08); }
.postmark { position: absolute; top: 8px; right: 8px; transform: rotate(8deg); opacity: 0.7; }
.card-header { margin-bottom: 14px; }
.header-top { display: flex; align-items: center; justify-content: space-between; }
.city-name {
  font-family: "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 22px; font-weight: 400; color: rgba(70,100,135,0.8);
  letter-spacing: 2px; margin: 0 0 4px;
}
.delete-city-btn {
  background: none; border: none; cursor: pointer;
  padding: 4px; border-radius: 4px; transition: all 0.2s ease;
}
.delete-city-btn:hover { background: rgba(200,130,130,0.06); }
.city-date {
  font-size: 13px; color: rgba(110,140,175,0.5);
  margin: 0; letter-spacing: 0.5px;
}

/* ====== 旅行车票 ====== */
.ticket {
  display: flex; align-items: stretch; gap: 0;
  margin-bottom: 16px;
  background: rgba(250, 248, 255, 0.55);
  border: 1px dashed rgba(180, 180, 235, 0.25);
  border-radius: 6px;
  transform: rotate(-1deg);
  box-shadow: 0 1px 6px rgba(150, 150, 210, 0.06);
  overflow: hidden;
}
.ticket-left {
  flex: 1; padding: 8px 12px 9px;
  display: flex; flex-direction: column; gap: 4px;
}
.ticket-line { display: flex; align-items: center; gap: 6px; }
.ticket-plane { font-size: 12px; }
.ticket-label {
  font-size: 9px; letter-spacing: 1px;
  color: rgba(120, 115, 175, 0.45);
  text-transform: uppercase;
}
.ticket-route { display: flex; align-items: baseline; gap: 8px; }
.ticket-city {
  font-family: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  font-size: 16px; color: rgba(95, 95, 160, 0.7); letter-spacing: 1px;
}
.ticket-memory { font-size: 11px; color: rgba(140, 135, 195, 0.5); }
.ticket-arrow { font-size: 11px; color: rgba(160, 155, 215, 0.5); }
.ticket-notch {
  width: 1px; position: relative;
  background: repeating-linear-gradient(180deg, rgba(180,180,235,0.25) 0 3px, transparent 3px 7px);
  margin: 4px 0;
}
.ticket-right {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 6px 12px; gap: 2px;
}
.ticket-date {
  font-size: 10px; color: rgba(120, 115, 175, 0.5); letter-spacing: 0.5px;
}
.ticket-stamp {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(190, 185, 235, 0.35);
  border-radius: 50%;
  font-family: Georgia, serif; font-size: 11px;
  color: rgba(150, 145, 205, 0.4);
  transform: rotate(-8deg);
}
@media (max-width: 640px) {
  .memory-card { width: 92vw; max-height: 88vh; padding: 24px 18px 20px; margin-right: 4vw; border-radius: 16px; }
  .card-cover { height: 130px; }
  .city-name { font-size: 18px; }
}
</style>
