<script setup>
import { ref, onMounted } from "vue"
import { useMemoryStore } from "../stores/memory.js"
import DreamParkLoader from "../components/DreamParkLoader.vue"
import EarthGlobe from "../components/EarthGlobe.vue"
import LoginModal from "../components/LoginModal.vue"
import CityEditor from "../components/CityEditor.vue"

const store = useMemoryStore()

const showLoader = ref(true)
const showEarth = ref(false)
const showLogin = ref(false)
const showCityEditor = ref(false)

/** 用户点击 ENTER → 弹出登录框 */
function onLoaderComplete() {
  showLoader.value = false
  // 如果已登录直接进入地球，否则弹出登录
  if (store.isLoggedIn) {
    showEarth.value = true
    store.fetchCities()
  } else {
    showLogin.value = true
  }
}

/** 登录成功 → 显示地球 */
function onLoggedIn() {
  showLogin.value = false
  showEarth.value = true
  store.fetchCities()
}

/** 关闭登录框 → 回到首页（重新显示 Loader） */
function closeLogin() {
  showLogin.value = false
  showLoader.value = true
}

function openCityEditor() { showCityEditor.value = true }
function closeCityEditor() { showCityEditor.value = false }
function onCityAdded() { closeCityEditor() }

function handleLogout() {
  store.logout()
  showEarth.value = false
  showLoader.value = true
}

onMounted(() => {
  // 已登录的用户直接跳过 loader，进入地球
  if (store.isLoggedIn) {
    showLoader.value = false
    showEarth.value = true
    store.fetchCities()
  }
})
</script>

<template>
  <div class="home">
    <!-- 地球顶部操作栏 -->
    <div v-if="showEarth" class="top-bar">
      <div class="top-bar-left">
        <span class="brand-text">梦幻旅行记忆馆</span>
      </div>
      <div class="top-bar-right">
        <button v-if="store.isLoggedIn" class="top-btn add-city-btn" @click="openCityEditor">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8,3 L8,13 M3,8 L13,8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
          <span>新增城市</span>
        </button>

        <template v-if="!store.isLoggedIn">
          <button class="top-btn login-btn" @click="showLogin = true">登录</button>
        </template>
        <template v-else>
          <span class="user-name">{{ store.currentUser?.username }}</span>
          <button class="top-btn logout-btn" @click="handleLogout">退出</button>
        </template>
      </div>
    </div>

    <DreamParkLoader v-if="showLoader" @complete="onLoaderComplete" />
    <EarthGlobe v-if="showEarth" />

    <!-- 弹窗 -->
    <LoginModal :visible="showLogin" @closed="closeLogin" @logged-in="onLoggedIn" />
    <CityEditor :visible="showCityEditor" @closed="closeCityEditor" @city-added="onCityAdded" />
  </div>
</template>

<style scoped>
.home { width: 100%; height: 100%; position: relative; }

.top-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  pointer-events: none;
}

.top-bar-left, .top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
}

.brand-text {
  font-family: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  font-size: 14px;
  color: rgba(100, 130, 170, 0.45);
  letter-spacing: 2px;
}

.top-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(200, 215, 245, 0.15);
  border-radius: 16px;
  color: rgba(100, 130, 170, 0.5);
  font-size: 12px;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.top-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(200, 215, 245, 0.25);
  color: rgba(80, 110, 150, 0.6);
}

.add-city-btn { color: rgba(100, 150, 180, 0.55); }

.user-name {
  font-size: 12px;
  color: rgba(100, 130, 170, 0.5);
  letter-spacing: 0.5px;
}

.logout-btn { font-size: 11px; }
</style>
