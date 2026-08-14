<template>
  <div class="journal-wrapper">
    <!-- 折叠状态：便签预览 -->
    <div v-if="!isOpen" class="journal-teaser" @click="isOpen = true">
      <div class="teaser-icon">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M4,4 L20,4 L20,20 L4,20 Z" fill="none" stroke="rgba(160,185,215,0.3)" stroke-width="0.8"/>
          <line x1="7" y1="9" x2="17" y2="9" stroke="rgba(160,185,215,0.15)" stroke-width="0.6"/>
          <line x1="7" y1="12" x2="14" y2="12" stroke="rgba(160,185,215,0.15)" stroke-width="0.6"/>
          <line x1="7" y1="15" x2="12" y2="15" stroke="rgba(160,185,215,0.15)" stroke-width="0.6"/>
        </svg>
      </div>
      <span class="teaser-text">旅行手账</span>
      <div class="teaser-corner" />
    </div>

    <!-- 展开状态：翻页手账 -->
    <Transition name="journal-open">
      <div v-if="isOpen" class="journal-notebook">
        <div class="notebook-spine" />
        <div class="notebook-content">
          <!-- 查看模式 -->
          <template v-if="!isEditing">
            <div class="notebook-header">
              <h3 class="notebook-title">{{ journal?.title || "旅行记录" }}</h3>
              <div class="notebook-meta">
                <span v-if="date" class="meta-item">📅 {{ date }}</span>
                <span v-if="journal?.weather" class="meta-item">{{ journal.weather }}</span>
                <span v-if="journal?.mood" class="meta-item mood">{{ journal.mood }}</span>
              </div>
            </div>
            <div class="notebook-body">
              <div class="lined-bg" />
              <p class="notebook-text">{{ journal?.content || "还没有记录旅行故事，点击编辑写下你的回忆吧。" }}</p>
            </div>
            <button class="edit-btn" @click="startEdit">✏️ 编辑手账</button>
          </template>

          <!-- 编辑模式 -->
          <template v-else>
            <div class="edit-form">
              <div class="edit-field">
                <label class="edit-label">标题</label>
                <input v-model="editForm.title" class="edit-input" placeholder="给这段旅行取个名字" />
              </div>
              <div class="edit-row">
                <div class="edit-field half">
                  <label class="edit-label">天气</label>
                  <input v-model="editForm.weather" class="edit-input" placeholder="晴/多云/小雨..." />
                </div>
                <div class="edit-field half">
                  <label class="edit-label">心情</label>
                  <input v-model="editForm.mood" class="edit-input" placeholder="☀️ 🧸 🌙" />
                </div>
              </div>
              <div class="edit-field">
                <label class="edit-label">旅行故事</label>
                <textarea v-model="editForm.content" class="edit-textarea" rows="5" placeholder="写下你的旅行回忆..." />
              </div>
              <div class="edit-actions">
                <button class="save-btn" @click="saveEdit">💾 保存</button>
                <button class="cancel-btn" @click="cancelEdit">取消</button>
              </div>
            </div>
          </template>

          <div class="notebook-close" @click="closeAll">
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
import { ref, reactive, watch } from "vue"
import { useMemoryStore } from "../stores/memory.js"

const store = useMemoryStore()

const props = defineProps({
  journal: { type: Object, default: () => ({}) },
  cityName: { type: String, default: "" },
  cityId: { type: [Number, String], default: null },
  date: { type: String, default: "" },
})

const isOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)

const editForm = reactive({
  title: "",
  weather: "",
  mood: "",
  content: "",
})

function startEdit() {
  editForm.title = props.journal?.title || ""
  editForm.weather = props.journal?.weather || ""
  editForm.mood = props.journal?.mood || ""
  editForm.content = props.journal?.content || ""
  isEditing.value = true
}

async function saveEdit() {
  if (!props.cityId) return
  saving.value = true
  try {
    await store.saveJournal(props.cityId, {
      title: editForm.title,
      weather: editForm.weather,
      mood: editForm.mood,
      content: editForm.content,
    })
    // 更新本地 journal 数据
    if (props.journal) {
      props.journal.title = editForm.title
      props.journal.weather = editForm.weather
      props.journal.mood = editForm.mood
      props.journal.content = editForm.content
    }
    isEditing.value = false
  } catch (err) {
    console.error("保存手账失败:", err)
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  isEditing.value = false
}

function closeAll() {
  isEditing.value = false
  isOpen.value = false
}
</script>

<style scoped>
.journal-wrapper { position: relative; margin-top: 4px; }

/* Teaser */
.journal-teaser {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: rgba(230, 240, 255, 0.25);
  border: 1px solid rgba(200, 215, 245, 0.12); border-radius: 8px;
  cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;
}
.journal-teaser:hover { background: rgba(230, 240, 255, 0.35); border-color: rgba(200, 215, 245, 0.2); }
.teaser-icon { flex-shrink: 0; display: flex; }
.teaser-text {
  font-family: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  font-size: 12px; color: rgba(100, 130, 170, 0.5); letter-spacing: 1px;
}
.teaser-corner {
  position: absolute; top: 0; right: 0;
  width: 0; height: 0; border-style: solid;
  border-width: 0 12px 12px 0;
  border-color: transparent rgba(200, 215, 245, 0.08) transparent transparent;
}

/* Notebook */
.journal-notebook {
  position: relative; min-height: 140px; margin-top: 4px; display: flex;
  animation: notebookFlip 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes notebookFlip {
  from { opacity: 0; transform: rotateX(-5deg) scaleY(0.95); transform-origin: top center; }
  to { opacity: 1; transform: rotateX(0) scaleY(1); }
}
.notebook-spine {
  width: 6px; min-height: 100%;
  background: linear-gradient(180deg, rgba(180,200,235,0.12), rgba(180,200,235,0.06));
  border-radius: 3px 0 0 3px; flex-shrink: 0; margin-right: 8px; position: relative;
}
.notebook-spine::after {
  content: ""; position: absolute; top: 12px; bottom: 12px; left: 2px; width: 2px;
  background: rgba(180,200,235,0.08); border-radius: 1px;
}
.notebook-content {
  flex: 1; padding: 12px 14px 10px;
  background: rgba(245, 248, 255, 0.35);
  border: 1px solid rgba(200, 215, 245, 0.08);
  border-radius: 0 8px 8px 0; position: relative;
}
.lined-bg {
  position: absolute; inset: 0; pointer-events: none; border-radius: 0 8px 8px 0;
  background-image: repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(180,200,235,0.04) 24px, rgba(180,200,235,0.04) 25px);
}
.notebook-header { margin-bottom: 10px; position: relative; }
.notebook-title {
  font-family: "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px; font-weight: 400; color: rgba(70,100,135,0.7);
  margin: 0 0 6px; letter-spacing: 0.5px;
}
.notebook-meta { display: flex; align-items: center; gap: 10px; }
.meta-item { font-size: 11px; color: rgba(110,140,175,0.45); }
.meta-item.mood { font-size: 14px; }
.notebook-body { position: relative; }
.notebook-text {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px; line-height: 1.9; color: rgba(80,110,145,0.55);
  margin: 0; position: relative; letter-spacing: 0.3px; white-space: pre-wrap;
}

.edit-btn {
  margin-top: 10px; padding: 5px 12px;
  background: rgba(160, 190, 220, 0.12);
  border: 1px solid rgba(160, 190, 220, 0.15);
  border-radius: 6px; color: rgba(80, 110, 145, 0.5);
  font-size: 11px; cursor: pointer; transition: all 0.2s ease;
}
.edit-btn:hover { background: rgba(160, 190, 220, 0.2); }

.edit-form { display: flex; flex-direction: column; gap: 10px; }
.edit-label { font-size: 11px; color: rgba(100,130,170,0.45); display: block; margin-bottom: 2px; }
.edit-input {
  width: 100%; padding: 7px 10px;
  border: 1px solid rgba(200, 215, 245, 0.2); border-radius: 8px;
  background: rgba(255, 255, 255, 0.3);
  font-size: 13px; color: rgba(70, 100, 135, 0.7); outline: none;
  transition: all 0.2s ease;
}
.edit-input:focus {
  border-color: rgba(160, 190, 220, 0.35);
  background: rgba(255, 255, 255, 0.5);
}
.edit-textarea {
  width: 100%; padding: 8px 10px; resize: vertical;
  border: 1px solid rgba(200, 215, 245, 0.2); border-radius: 8px;
  background: rgba(255, 255, 255, 0.3);
  font-size: 13px; color: rgba(70, 100, 135, 0.7);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.8; outline: none; transition: all 0.2s ease;
}
.edit-textarea:focus { border-color: rgba(160, 190, 220, 0.35); background: rgba(255, 255, 255, 0.5); }
.edit-row { display: flex; gap: 10px; }
.edit-field.half { flex: 1; }
.edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
.save-btn, .cancel-btn {
  padding: 6px 14px; border-radius: 6px;
  font-size: 12px; cursor: pointer; transition: all 0.2s ease;
  border: 1px solid transparent;
}
.save-btn {
  background: rgba(160, 190, 220, 0.2);
  color: rgba(70, 100, 135, 0.6);
}
.save-btn:hover { background: rgba(160, 190, 220, 0.3); }
.cancel-btn {
  background: transparent;
  color: rgba(110, 140, 175, 0.4);
  border-color: rgba(200, 215, 245, 0.12);
}
.cancel-btn:hover { background: rgba(200, 215, 245, 0.06); }

.notebook-close {
  position: absolute; top: 6px; right: 6px;
  width: 24px; height: 24px; display: flex;
  align-items: center; justify-content: center;
  cursor: pointer; border-radius: 50%;
  transition: background 0.2s ease;
}
.notebook-close:hover { background: rgba(200, 215, 245, 0.1); }

.journal-open-enter-active { transition: opacity 0.4s ease; }
.journal-open-leave-active { transition: opacity 0.3s ease; }
.journal-open-enter-from,
.journal-open-leave-to { opacity: 0; }
</style>
