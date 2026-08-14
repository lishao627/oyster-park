<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="login-overlay" @click.self="handleOverlayClick">
      <div class="login-modal" @click.stop>
        <div class="modal-close" @click="close">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M4,4 L12,12 M12,4 L4,12" stroke="rgba(100,130,170,0.4)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="modal-header">
          <h2 class="modal-title">{{ isRegister ? "注册" : "登录" }}</h2>
          <p class="modal-subtitle">{{ isRegister ? "创建你的旅行记忆空间" : "回到你的旅行记忆" }}</p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              placeholder="2-20 个字符"
              maxlength="20"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="至少 6 位"
              maxlength="50"
              required
            />
          </div>

          <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

          <button type="submit" class="submit-btn" :disabled="submitting">
            <span v-if="submitting" class="btn-loading">...</span>
            <span v-else>{{ isRegister ? "注册并登录" : "登录" }}</span>
          </button>
        </form>

        <div class="modal-footer">
          <span class="footer-text">
            {{ isRegister ? "已有账号？" : "还没有账号？" }}
          </span>
          <button class="switch-btn" @click="toggleMode">
            {{ isRegister ? "去登录" : "去注册" }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive } from "vue"
import { authAPI } from "../api/index.js"
import { useMemoryStore } from "../stores/memory.js"

const store = useMemoryStore()
const emit = defineEmits(["closed", "logged-in"])

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const isRegister = ref(false)
const submitting = ref(false)
const errorMsg = ref("")

const form = reactive({
  username: "",
  password: "",
})

function toggleMode() {
  isRegister.value = !isRegister.value
  errorMsg.value = ""
}

async function handleSubmit() {
  errorMsg.value = ""
  submitting.value = true
  try {
    let res
    if (isRegister.value) {
      res = await authAPI.register(form.username, form.password)
    } else {
      res = await authAPI.login(form.username, form.password)
    }
    const { user, token } = res.data
    store.setLogin(user, token)
    // 登录成功后加载城市数据
    await store.fetchCities()
    emit("logged-in", user)
    close()
  } catch (err) {
    const msg = err.response?.data?.error || "操作失败，请稍后再试"
    errorMsg.value = msg
  } finally {
    submitting.value = false
  }
}

function close() {
  errorMsg.value = ""
  form.username = ""
  form.password = ""
  emit("closed")
}

function handleOverlayClick() {
  close()
}
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(180, 200, 225, 0.15);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.login-modal {
  position: relative;
  width: 380px;
  max-width: 88vw;
  background: linear-gradient(160deg, rgba(245, 248, 255, 0.95), rgba(238, 243, 255, 0.92));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px 32px 32px;
  box-shadow:
    0 8px 60px rgba(160, 195, 230, 0.12),
    0 0 120px rgba(160, 195, 230, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}
.modal-close:hover { background: rgba(200, 215, 245, 0.1); }

.modal-header { margin-bottom: 24px; text-align: center; }
.modal-title {
  font-family: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  font-size: 22px;
  font-weight: 400;
  color: rgba(70, 100, 135, 0.7);
  margin: 0 0 6px;
  letter-spacing: 2px;
}
.modal-subtitle {
  font-size: 13px;
  color: rgba(110, 140, 175, 0.45);
  margin: 0;
}

.login-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label {
  font-size: 12px;
  color: rgba(100, 130, 170, 0.5);
  letter-spacing: 0.5px;
}
.form-input {
  padding: 10px 14px;
  border: 1px solid rgba(200, 215, 245, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  color: rgba(70, 100, 135, 0.7);
  outline: none;
  transition: all 0.2s ease;
}
.form-input:focus {
  border-color: rgba(160, 190, 220, 0.4);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(160, 190, 220, 0.08);
}
.form-input::placeholder { color: rgba(160, 185, 215, 0.3); }

.form-error {
  font-size: 12px;
  color: rgba(200, 130, 130, 0.6);
  text-align: center;
  padding: 6px;
  background: rgba(200, 130, 130, 0.04);
  border-radius: 6px;
}

.submit-btn {
  padding: 11px;
  border: none;
  border-radius: 10px;
  background: rgba(160, 190, 220, 0.2);
  color: rgba(70, 100, 135, 0.7);
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.submit-btn:hover {
  background: rgba(160, 190, 220, 0.3);
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-loading { letter-spacing: 2px; }

.modal-footer {
  margin-top: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.footer-text {
  font-size: 12px;
  color: rgba(110, 140, 175, 0.4);
}
.switch-btn {
  font-size: 12px;
  color: rgba(100, 140, 185, 0.5);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s ease;
}
.switch-btn:hover { color: rgba(100, 140, 185, 0.7); }

/* Transition */
.modal-fade-enter-active { transition: opacity 0.3s ease; }
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
