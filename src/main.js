import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

// 全局错误捕获
window.onerror = function(msg, url, line) {
  var el = document.createElement("div")
  el.style.cssText = "padding:40px;background:#f5f0e8;min-height:100vh"
  el.innerHTML = "<h2 style='color:#b55'>页面出了点问题</h2><pre style='font-size:13px;color:#555;white-space:pre-wrap'>" + msg + " at " + url + ":" + line + "</pre>"
  document.body.innerHTML = ""
  document.body.appendChild(el)
}
window.addEventListener("unhandledrejection", function(e) {
  console.error("Unhandled:", e.reason)
})

const app = createApp(App)
app.use(createPinia())
app.mount("#app")
