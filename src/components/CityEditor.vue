<template>
  <Transition name="panel-slide">
    <div v-if="visible" class="city-editor-overlay" @click.self="close">
      <div class="city-editor" @click.stop>
        <div class="editor-close" @click="close">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M4,4 L12,12 M12,4 L4,12" stroke="rgba(100,130,170,0.4)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="editor-header">
          <h2 class="editor-title">添加新城市</h2>
          <p class="editor-subtitle">记录你下一个旅行的目的地</p>
        </div>

        <form class="editor-form" @submit.prevent="handleSubmit">
          <!-- 城市名称 + 自动识别 -->
          <div class="form-row">
            <div class="label-row">
              <label class="form-label">城市名称 *</label>
              <button type="button" class="geo-btn" @click="detectLocation" :disabled="geoLoading || !form.name.trim()">
                <span v-if="geoLoading" class="geo-spinner"></span>
                <svg v-else viewBox="0 0 16 16" width="13" height="13">
                  <circle cx="8" cy="8" r="5" stroke="rgba(100,150,180,0.5)" stroke-width="1.2" fill="none"/>
                  <line x1="8" y1="1" x2="8" y2="2.5" stroke="rgba(100,150,180,0.4)" stroke-width="1"/>
                  <line x1="8" y1="13.5" x2="8" y2="15" stroke="rgba(100,150,180,0.4)" stroke-width="1"/>
                  <line x1="1" y1="8" x2="2.5" y2="8" stroke="rgba(100,150,180,0.4)" stroke-width="1"/>
                  <line x1="13.5" y1="8" x2="15" y2="8" stroke="rgba(100,150,180,0.4)" stroke-width="1"/>
                </svg>
                <span>{{ geoLoading ? "识别中..." : "自动识别" }}</span>
              </button>
            </div>
            <input v-model="form.name" type="text" class="form-input" placeholder="例如 北京" @keyup.enter="detectLocation" required />
          </div>

          <!-- 识别结果提示 -->
          <div v-if="geoResult" class="geo-result">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M2,8 L6,12 L14,4" stroke="rgba(100,160,130,0.5)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ geoResult }}</span>
          </div>
          <div v-if="geoError" class="geo-error">{{ geoError }}</div>

          <!-- 纬度 / 经度 同行 -->
          <div class="form-row row-duo">
            <div class="duo-field">
              <label class="form-label">纬度 *</label>
              <input v-model.number="form.lat" type="number" class="form-input" step="0.01" placeholder="-90 ~ 90" required />
            </div>
            <div class="duo-field">
              <label class="form-label">经度 *</label>
              <input v-model.number="form.lng" type="number" class="form-input" step="0.01" placeholder="-180 ~ 180" required />
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">旅行时间</label>
            <input v-model="form.date" type="text" class="form-input" placeholder="例如 2025.04" />
          </div>

          <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

          <button type="submit" class="submit-btn" :disabled="submitting">
            <span v-if="submitting">添加中...</span>
            <span v-else>添加城市</span>
          </button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, watch } from "vue"
import { useMemoryStore } from "../stores/memory.js"

const store = useMemoryStore()
const emit = defineEmits(["closed", "city-added"])

defineProps({
  visible: { type: Boolean, default: false },
})

const submitting = ref(false)
const errorMsg = ref("")

const form = reactive({
  name: "",
  lat: null,
  lng: null,
  date: "",
})

// ========== 自动识别经纬度 ==========
const geoLoading = ref(false)
const geoResult = ref("")
const geoError = ref("")

/** 常用城市坐标兜底（离线可用，保证东京等城市稳定识别） */
const CITY_COORDS = {
  "东京": { lat: 35.6762, lng: 139.6503, display: "东京 · 日本" },
  "tokyo": { lat: 35.6762, lng: 139.6503, display: "Tokyo · Japan" },
  "大阪": { lat: 34.6937, lng: 135.5023, display: "大阪 · 日本" },
  "osaka": { lat: 34.6937, lng: 135.5023, display: "Osaka · Japan" },
  "京都": { lat: 35.0116, lng: 135.7681, display: "京都 · 日本" },
  "kyoto": { lat: 35.0116, lng: 135.7681, display: "Kyoto · Japan" },
  "北京": { lat: 39.9042, lng: 116.4074, display: "北京 · 中国" },
  "beijing": { lat: 39.9042, lng: 116.4074, display: "Beijing · China" },
  "上海": { lat: 31.2304, lng: 121.4737, display: "上海 · 中国" },
  "shanghai": { lat: 31.2304, lng: 121.4737, display: "Shanghai · China" },
  "广州": { lat: 23.1291, lng: 113.2644, display: "广州 · 中国" },
  "深圳": { lat: 22.5431, lng: 114.0579, display: "深圳 · 中国" },
  "成都": { lat: 30.5728, lng: 104.0668, display: "成都 · 中国" },
  "重庆": { lat: 29.563, lng: 106.5516, display: "重庆 · 中国" },
  "杭州": { lat: 30.2741, lng: 120.1551, display: "杭州 · 中国" },
  "武汉": { lat: 30.5928, lng: 114.3055, display: "武汉 · 中国" },
  "西安": { lat: 34.3416, lng: 108.9398, display: "西安 · 中国" },
  "南京": { lat: 32.0603, lng: 118.7969, display: "南京 · 中国" },
  "天津": { lat: 39.3434, lng: 117.3616, display: "天津 · 中国" },
  "青岛": { lat: 36.0671, lng: 120.3826, display: "青岛 · 中国" },
  "大连": { lat: 38.914, lng: 121.6147, display: "大连 · 中国" },
  "厦门": { lat: 24.4798, lng: 118.0894, display: "厦门 · 中国" },
  "昆明": { lat: 24.8801, lng: 102.8329, display: "昆明 · 中国" },
  "拉萨": { lat: 29.652, lng: 91.1721, display: "拉萨 · 中国" },
  "哈尔滨": { lat: 45.8038, lng: 126.5349, display: "哈尔滨 · 中国" },
  "沈阳": { lat: 41.8057, lng: 123.4315, display: "沈阳 · 中国" },
  "长沙": { lat: 28.2282, lng: 112.9388, display: "长沙 · 中国" },
  "郑州": { lat: 34.7466, lng: 113.6254, display: "郑州 · 中国" },
  "济南": { lat: 36.6512, lng: 117.1201, display: "济南 · 中国" },
  "贵阳": { lat: 26.647, lng: 106.6302, display: "贵阳 · 中国" },
  "南宁": { lat: 22.817, lng: 108.3665, display: "南宁 · 中国" },
  "海口": { lat: 20.044, lng: 110.1999, display: "海口 · 中国" },
  "兰州": { lat: 36.0611, lng: 103.8343, display: "兰州 · 中国" },
  "西宁": { lat: 36.6171, lng: 101.7782, display: "西宁 · 中国" },
  "银川": { lat: 38.4872, lng: 106.2309, display: "银川 · 中国" },
  "乌鲁木齐": { lat: 43.8256, lng: 87.6168, display: "乌鲁木齐 · 中国" },
  "呼和浩特": { lat: 40.8424, lng: 111.75, display: "呼和浩特 · 中国" },
  "石家庄": { lat: 38.0428, lng: 114.5149, display: "石家庄 · 中国" },
  "太原": { lat: 37.8706, lng: 112.5489, display: "太原 · 中国" },
  "香港": { lat: 22.3193, lng: 114.1694, display: "香港 · 中国" },
  "hongkong": { lat: 22.3193, lng: 114.1694, display: "Hong Kong · China" },
  "澳门": { lat: 22.1987, lng: 113.5439, display: "澳门 · 中国" },
  "macau": { lat: 22.1987, lng: 113.5439, display: "Macau · China" },
  "台北": { lat: 25.033, lng: 121.5654, display: "台北 · 中国台湾" },
  "taipei": { lat: 25.033, lng: 121.5654, display: "Taipei · Taiwan" },
  "首尔": { lat: 37.5665, lng: 126.978, display: "首尔 · 韩国" },
  "seoul": { lat: 37.5665, lng: 126.978, display: "Seoul · South Korea" },
  "新加坡": { lat: 1.3521, lng: 103.8198, display: "新加坡" },
  "singapore": { lat: 1.3521, lng: 103.8198, display: "Singapore" },
  "曼谷": { lat: 13.7563, lng: 100.5018, display: "曼谷 · 泰国" },
  "bangkok": { lat: 13.7563, lng: 100.5018, display: "Bangkok · Thailand" },
  "巴黎": { lat: 48.8566, lng: 2.3522, display: "巴黎 · 法国" },
  "paris": { lat: 48.8566, lng: 2.3522, display: "Paris · France" },
  "伦敦": { lat: 51.5074, lng: -0.1278, display: "伦敦 · 英国" },
  "london": { lat: 51.5074, lng: -0.1278, display: "London · UK" },
  "纽约": { lat: 40.7128, lng: -74.006, display: "纽约 · 美国" },
  "newyork": { lat: 40.7128, lng: -74.006, display: "New York · USA" },
  "newyorkcity": { lat: 40.7128, lng: -74.006, display: "New York · USA" },
  "洛杉矶": { lat: 34.0522, lng: -118.2437, display: "洛杉矶 · 美国" },
  "losangeles": { lat: 34.0522, lng: -118.2437, display: "Los Angeles · USA" },
  "悉尼": { lat: -33.8688, lng: 151.2093, display: "悉尼 · 澳大利亚" },
  "sydney": { lat: -33.8688, lng: 151.2093, display: "Sydney · Australia" },
  "墨尔本": { lat: -37.8136, lng: 144.9631, display: "墨尔本 · 澳大利亚" },
  "melbourne": { lat: -37.8136, lng: 144.9631, display: "Melbourne · Australia" },
  "莫斯科": { lat: 55.7558, lng: 37.6173, display: "莫斯科 · 俄罗斯" },
  "moscow": { lat: 55.7558, lng: 37.6173, display: "Moscow · Russia" },
  "迪拜": { lat: 25.2048, lng: 55.2708, display: "迪拜 · 阿联酋" },
  "dubai": { lat: 25.2048, lng: 55.2708, display: "Dubai · UAE" },
  "罗马": { lat: 41.9028, lng: 12.4964, display: "罗马 · 意大利" },
  "rome": { lat: 41.9028, lng: 12.4964, display: "Rome · Italy" },
  "柏林": { lat: 52.52, lng: 13.405, display: "柏林 · 德国" },
  "berlin": { lat: 52.52, lng: 13.405, display: "Berlin · Germany" },
}

function normalizeCityName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[市都县区省州郡府]$/, "")
}

function findLocalCity(name) {
  const key = normalizeCityName(name)
  return CITY_COORDS[key] || null
}

const round2 = (n) => Math.round(n * 100) / 100

function applyGeoResult(lat, lng, display) {
  form.lat = round2(lat)
  form.lng = round2(lng)
  geoResult.value = display || form.name
}

async function detectLocation() {
  const name = form.name.trim()
  if (!name) return

  geoLoading.value = true
  geoResult.value = ""
  geoError.value = ""

  try {
    // 1) 本地常用城市兜底：离线可用、结果稳定（东京等）
    const local = findLocalCity(name)
    if (local) {
      applyGeoResult(local.lat, local.lng, local.display)
      return
    }

    // 2) Nominatim 在线识别
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=5&accept-language=zh`
    const res = await fetch(url, { headers: { "User-Agent": "DreamTravelApp/1.0" } })

    if (!res.ok) throw new Error("查询服务暂时不可用")

    const data = await res.json()

    if (!data || data.length === 0) {
      geoError.value = "未找到该城市，请手动输入经纬度"
      return
    }

    // 优先选“城市/城镇”级别结果，避免匹配到省/国家等大区域
    const preferred = data.filter((p) => {
      const t = (p.type || "") + "|" + (p.addresstype || "")
      return /city|town|municipality|administrative/.test(t)
    })
    const pool = preferred.length ? preferred : data
    const place = pool[0]
    applyGeoResult(parseFloat(place.lat), parseFloat(place.lon), place.display_name || name)
  } catch (err) {
    // 3) 网络失败时再兜底一次本地字典
    const local = findLocalCity(name)
    if (local) {
      applyGeoResult(local.lat, local.lng, local.display)
      return
    }
    if (err.message === "Failed to fetch") {
      geoError.value = "网络请求失败，请检查网络连接"
    } else {
      geoError.value = err.message || "识别失败，请手动输入"
    }
  } finally {
    geoLoading.value = false
  }
}

// 输入城市名时清除上次的识别结果和经纬度
watch(() => form.name, () => {
  geoResult.value = ""
  geoError.value = ""
})

async function handleSubmit() {
  errorMsg.value = ""
  if (!form.name || form.lat === null || form.lng === null) {
    errorMsg.value = "请填写完整信息"
    return
  }
  submitting.value = true
  try {
    await store.addCity({
      name: form.name,
      lat: form.lat,
      lng: form.lng,
      date: form.date,
    })
    emit("city-added")
    close()
  } catch (err) {
    errorMsg.value = err.response?.data?.error || "添加失败，请稍后再试"
  } finally {
    submitting.value = false
  }
}

function close() {
  form.name = ""
  form.lat = null
  form.lng = null
  form.date = ""
  errorMsg.value = ""
  geoResult.value = ""
  geoError.value = ""
  emit("closed")
}
</script>

<style scoped>
.city-editor-overlay {
  position: fixed; inset: 0; z-index: 999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(180, 200, 225, 0.12);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.city-editor {
  position: relative; width: 380px; max-width: 88vw;
  background: linear-gradient(160deg, rgba(245, 248, 255, 0.95), rgba(238, 243, 255, 0.92));
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 20px; padding: 36px 28px 28px;
  box-shadow: 0 8px 60px rgba(160, 195, 230, 0.12), 0 0 120px rgba(160, 195, 230, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
}
.editor-close {
  position: absolute; top: 12px; right: 12px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; cursor: pointer; transition: background 0.2s ease;
}
.editor-close:hover { background: rgba(200, 215, 245, 0.1); }
.editor-header { margin-bottom: 20px; text-align: center; }
.editor-title {
  font-family: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  font-size: 20px; font-weight: 400;
  color: rgba(70, 100, 135, 0.7); margin: 0 0 4px; letter-spacing: 1px;
}
.editor-subtitle { font-size: 12px; color: rgba(110, 140, 175, 0.4); margin: 0; }
.editor-form { display: flex; flex-direction: column; gap: 14px; }

/* Label row with auto-detect button */
.label-row {
  display: flex; align-items: center; justify-content: space-between;
}
.form-label {
  font-size: 12px; color: rgba(100, 130, 170, 0.5); letter-spacing: 0.5px;
}

/* Auto-detect button */
.geo-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 9px;
  background: rgba(160, 195, 220, 0.1);
  border: 1px solid rgba(160, 195, 220, 0.15);
  border-radius: 10px;
  color: rgba(100, 150, 180, 0.5);
  font-size: 10px; letter-spacing: 0.3px;
  cursor: pointer; transition: all 0.2s ease;
}
.geo-btn:hover:not(:disabled) {
  background: rgba(160, 195, 220, 0.18);
  color: rgba(80, 130, 165, 0.6);
}
.geo-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.geo-spinner {
  width: 11px; height: 11px;
  border: 1.5px solid rgba(160, 195, 220, 0.2);
  border-top-color: rgba(100, 150, 180, 0.5);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Geo result / error */
.geo-result {
  display: flex; align-items: flex-start; gap: 5px;
  font-size: 11px; color: rgba(100, 160, 130, 0.55);
  line-height: 1.4; padding: 0 2px;
}
.geo-error {
  font-size: 11px; color: rgba(200, 130, 130, 0.55);
  padding: 0 2px;
}

/* Latitude / Longitude side by side */
.form-row.row-duo {
  flex-direction: row; gap: 10px;
}
.duo-field {
  flex: 1; display: flex; flex-direction: column; gap: 5px;
}

.form-input {
  padding: 9px 12px;
  border: 1px solid rgba(200, 215, 245, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.4);
  font-size: 14px; color: rgba(70, 100, 135, 0.7);
  outline: none; transition: all 0.2s ease;
}
.form-input:focus {
  border-color: rgba(160, 190, 220, 0.4);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(160, 190, 220, 0.08);
}
.form-input::placeholder { color: rgba(160, 185, 215, 0.3); }

.form-error {
  font-size: 12px; color: rgba(200, 130, 130, 0.6);
  text-align: center; padding: 4px;
}
.submit-btn {
  padding: 10px; border: none; border-radius: 10px;
  background: rgba(160, 190, 220, 0.2);
  color: rgba(70, 100, 135, 0.7);
  font-size: 14px; letter-spacing: 1px;
  cursor: pointer; transition: all 0.3s ease;
}
.submit-btn:hover { background: rgba(160, 190, 220, 0.3); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.panel-slide-enter-active { transition: opacity 0.3s ease; }
.panel-slide-leave-active { transition: opacity 0.2s ease; }
.panel-slide-enter-from,
.panel-slide-leave-to { opacity: 0; }
</style>
