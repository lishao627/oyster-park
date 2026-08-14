import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { cityAPI, photoAPI, journalAPI } from "../api/index.js"
import { cityList } from "../data/cities.js"

const photoModules = import.meta.glob('../assets/photo/**/*.jpg', { eager: true, query: '?url', import: 'default' })

function assetUrl(folder, file) {
  if (!folder || !file) return ""
  const key = `../assets/photo/${folder}/${file}`
  return photoModules[key] || ""
}

export const useMemoryStore = defineStore("memory", () => {
  const selectedCity = ref(null)
  const isTransitioning = ref(false)
  const showMemoryCard = ref(false)
  const isGlobeFrozen = ref(false)

  // 静态城市配置作为兜底数据源：后端不可用/未登录时也能浏览预设城市
  const cities = ref(cityList.filter((c) => c.unlocked))
  const isLoggedIn = ref(!!localStorage.getItem("token"))
  const currentUser = ref(JSON.parse(localStorage.getItem("user") || "null"))
  const isLoading = ref(false)

  const unlockedCities = computed(() => {
    return cities.value.filter((c) => c.unlocked)
  })

  function selectCity(city) {
    if (isTransitioning.value || showMemoryCard.value) return
    selectedCity.value = city
    isTransitioning.value = true
    isGlobeFrozen.value = true
  }

  function onCameraArrived() {
    isTransitioning.value = false
    showMemoryCard.value = true
  }

  function closeMemoryCard() {
    showMemoryCard.value = false
    isGlobeFrozen.value = false
    selectedCity.value = null
  }

  const clickParticles = ref([])

  function emitClickParticle(x, y) {
    const id = Date.now() + Math.random()
    clickParticles.value.push({ id, x, y, time: Date.now() })
    setTimeout(() => {
      clickParticles.value = clickParticles.value.filter((p) => p.id !== id)
    }, 1500)
  }

  function getPhotoUrl(city, filename) {
    if (!city || !filename) return ""
    // 优先使用后端上传的图片（photoData 来自 API 响应）
    if (city.photoData && city.photoData.length > 0) {
      const found = city.photoData.find(p => p.filename === filename)
      if (found && found.url) return found.url
    }
    // 回退到本地静态图片
    return assetUrl(city.folder, filename)
  }

  function getCoverUrl(city) {
    if (!city) return ""
    if (city.cover) return getPhotoUrl(city, city.cover)
    if (city.photos && city.photos.length > 0) return getPhotoUrl(city, city.photos[0])
    return ""
  }

  function getPhotos(city) {
    if (!city || !city.photos) return []
    return city.photos.map((f) => ({
      url: getPhotoUrl(city, f),
      filename: f,
      errored: false,
    }))
  }

  /** 时间胶囊：优先使用城市对象内联的 timeline，否则返回空（组件自动隐藏） */
  function getTimeline(city) {
    if (!city) return []
    return Array.isArray(city.timeline) ? city.timeline : []
  }

  // ========== API 方法 ==========

  /** 从后端加载用户的所有城市数据 */
  async function fetchCities() {
    if (!isLoggedIn.value) return
    isLoading.value = true
    try {
      const res = await cityAPI.getAll()
      const data = res.data.cities.map((c) => {
        // 与静态配置按 id/name 合并，保证 preset 城市的照片、封面、手账、时间胶囊开箱即用
        const preset =
          cityList.find((s) => s.id === c.id) ||
          cityList.find((s) => s.name === c.name)
        const photoFiles = c.photos?.length
          ? c.photos.map((p) => p.filename)
          : preset?.photos || []
        return {
          ...c,
          photos: photoFiles,
          photoData: c.photos || [],
          folder: c.folder || preset?.folder || `city_${c.id}`,
          cover: c.cover || preset?.cover || "",
          journal: c.journal || preset?.journal || null,
          timeline: c.timeline || preset?.timeline || [],
        }
      })
      cities.value = data
      // 同步当前选中的城市对象：上传照片/编辑手账后让卡片立即展示最新数据
      if (selectedCity.value) {
        selectedCity.value =
          cities.value.find((c) => c.id === selectedCity.value.id) || selectedCity.value
      }
    } catch (err) {
      console.error("加载城市数据失败:", err)
    } finally {
      isLoading.value = false
    }
  }

  /** 新增城市 */
  async function addCity(data) {
    const res = await cityAPI.create(data)
    cities.value.push(res.data.city)
    return res.data.city
  }

  /** 删除城市 */
  async function removeCity(id) {
    await cityAPI.remove(id)
    cities.value = cities.value.filter((c) => c.id !== id)
  }

  /** 上传照片 */
  async function uploadPhotos(cityId, files) {
    const res = await photoAPI.upload(cityId, files)
    return res.data.photos
  }

  /** 保存手账 */
  async function saveJournal(cityId, data) {
    const res = await journalAPI.save(cityId, data)
    return res.data.journal
  }

  /** 设置登录态 */
  function setLogin(user, token) {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    currentUser.value = user
    isLoggedIn.value = true
  }

  /** 登出 */
  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    currentUser.value = null
    isLoggedIn.value = false
    cities.value = []
  }

  return {
    selectedCity,
    isTransitioning,
    showMemoryCard,
    isGlobeFrozen,
    cities,
    unlockedCities,
    isLoggedIn,
    currentUser,
    isLoading,
    getPhotoUrl,
    getCoverUrl,
    getPhotos,
    getTimeline,
    selectCity,
    onCameraArrived,
    closeMemoryCard,
    clickParticles,
    emitClickParticle,
    fetchCities,
    addCity,
    removeCity,
    uploadPhotos,
    saveJournal,
    setLogin,
    logout,
  }
})

