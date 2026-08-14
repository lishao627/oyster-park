<template>
  <div class="photo-uploader">
    <div class="upload-dropzone" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop" :class="{ dragging }">
      <svg viewBox="0 0 24 24" width="24" height="24" class="upload-icon">
        <path d="M12,4 L12,16 M8,8 L12,4 L16,8" stroke="rgba(160,185,215,0.4)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4,16 L4,20 L20,20 L20,16" stroke="rgba(160,185,215,0.4)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      </svg>
      <span class="dropzone-text">点击或拖拽上传照片（JPG/PNG/WebP）</span>
      <span class="dropzone-hint">最多 10 张，单张不超过 5MB</span>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="file-input-hidden"
      @change="onFileChange"
    />

    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar"><div class="progress-fill" /></div>
      <span class="progress-text">上传中...</span>
    </div>

    <div v-if="uploadedCount > 0" class="upload-success">
      <span>✓ 成功上传 {{ uploadedCount }} 张照片</span>
    </div>

    <div v-if="error" class="upload-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useMemoryStore } from "../stores/memory.js"

const store = useMemoryStore()
const emit = defineEmits(["uploaded"])

const props = defineProps({
  cityId: { type: [Number, String], required: true },
})

const fileInputRef = ref(null)
const uploading = ref(false)
const uploadedCount = ref(0)
const dragging = ref(false)
const error = ref("")

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onDrop(e) {
  dragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    uploadFiles(Array.from(files))
  }
}

function onFileChange(e) {
  const files = e.target?.files
  if (files?.length) {
    uploadFiles(Array.from(files))
  }
  // 重置 input 以便重复选择同一文件
  if (fileInputRef.value) fileInputRef.value.value = ""
}

async function uploadFiles(files) {
  const validFiles = files.filter((f) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    return validTypes.includes(f.type)
  })

  if (validFiles.length === 0) {
    error.value = "请选择 JPG/PNG/WebP/GIF 格式的图片文件"
    return
  }

  if (validFiles.length > 10) {
    error.value = "单次最多上传 10 张照片"
    return
  }

  error.value = ""
  uploading.value = true
  try {
    await store.uploadPhotos(props.cityId, validFiles)
    uploadedCount.value = validFiles.length
    emit("uploaded")
    // 3秒后消除提示
    setTimeout(() => { uploadedCount.value = 0 }, 3000)
  } catch (err) {
    error.value = err.response?.data?.error || "上传失败，请稍后再试"
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.photo-uploader { margin: 8px 0; }
.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px;
  border: 1.5px dashed rgba(200, 215, 245, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
}
.upload-dropzone:hover, .upload-dropzone.dragging {
  border-color: rgba(160, 190, 220, 0.4);
  background: rgba(255, 255, 255, 0.25);
}
.upload-icon { opacity: 0.5; }
.dropzone-text {
  font-size: 12px; color: rgba(100, 130, 170, 0.5);
  letter-spacing: 0.3px;
}
.dropzone-hint {
  font-size: 10px; color: rgba(160, 185, 215, 0.35);
}
.file-input-hidden { display: none; }
.upload-progress {
  display: flex; align-items: center; gap: 8px;
  margin-top: 8px;
}
.progress-bar {
  flex: 1; height: 4px;
  background: rgba(200, 215, 245, 0.1);
  border-radius: 4px; overflow: hidden;
}
.progress-fill {
  width: 100%; height: 100%;
  background: rgba(160, 190, 220, 0.3);
  animation: progressAnim 2s ease-in-out infinite;
}
@keyframes progressAnim {
  0% { width: 0; }
  100% { width: 100%; }
}
.progress-text { font-size: 11px; color: rgba(100, 130, 170, 0.4); }
.upload-success {
  margin-top: 8px; font-size: 12px;
  color: rgba(100, 160, 130, 0.6);
  text-align: center;
}
.upload-error {
  margin-top: 6px; font-size: 11px;
  color: rgba(200, 130, 130, 0.6);
  text-align: center;
}
</style>
