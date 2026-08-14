import { gsap } from 'gsap'
import * as THREE from 'three'

/**
 * ç¸æºæ§å¶å?
 * å¤çå°çåºæ¯çå¹³æ»ç¸æºè¿å¨ååå¸ç¦ç¹è¿æ¸¡
 */
export class CameraController {
  constructor(camera, controls) {
    this.camera = camera
    this.controls = controls
    this._targetPosition = null
    this._targetLookAt = null
    this._animation = null
    this._originalPosition = null
  }

  /**
   * å¹³æ»ç§»å¨ç¸æºå°ç®æ ä½ç½?
   * @param {THREE.Vector3} targetPos - ç®æ ç¸æºä½ç½®
   * @param {object} options
   * @param {number} options.duration - å¨ç»æ¶é¿ï¼ç§ï¼?
   * @param {function} options.onComplete - å®æåè°
   */
  moveTo(targetPos, options = {}) {
    const { duration = 1.2, onComplete = null } = options

    if (this._animation) {
      this._animation.kill()
    }

    const startPos = this.camera.position.clone()

    // Disable controls during animation to prevent OrbitControls fighting with manual camera movement
    if (this.controls) {
      this.controls.enabled = false
    }

    const proxy = { p: 0 }
    this._animation = gsap.to(proxy, {
      p: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.position.lerpVectors(startPos, targetPos, proxy.p)
      },
      onComplete: () => {
        this._animation = null
        this.camera.position.copy(targetPos)
        // Re-enable controls and reset target to earth center
        if (this.controls) {
          this.controls.target.set(0, 0, 0)
          this.controls.enabled = true
          this.controls.update()
        }
        if (onComplete) onComplete()
      }
    })

    this._targetPosition = targetPos.clone()
  }

  /**
   * å°ç¸æºç§»å¨å°æä¸ªç»çº¬åº¦ä¸æ¹ï¼èç¦åå¸
   * @param {number} lat - çº¬åº¦
   * @param {number} lng - ç»åº¦
   * @param {object} options
   */
  focusOnLatLng(lat, lng, options = {}) {
    const { distance = 2.2, duration = 1.0, onComplete = null } = options
    const phi = (90 - lat) * Math.PI / 180
    const theta = lng * Math.PI / 180

    const targetPos = new THREE.Vector3(
      distance * Math.sin(phi) * Math.cos(theta),
      distance * Math.cos(phi),
      distance * Math.sin(phi) * Math.sin(theta)
    )

    if (this.controls) {
      this.controls.autoRotate = false
    }

    this.moveTo(targetPos, { duration, onComplete })
  }

  /**
   * éç½®ç¸æºå°åå§ä½ç½?
   */
  reset(options = {}) {
    const { duration = 1.5, onComplete = null } = options
    const defaultPos = new THREE.Vector3(0, 0.5, 3.5)

    if (this._animation) {
      this._animation.kill()
    }

    const startPos = this.camera.position.clone()

    // Disable controls during animation
    if (this.controls) {
      this.controls.enabled = false
    }

    const proxy = { p: 0 }
    this._animation = gsap.to(proxy, {
      p: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.position.lerpVectors(startPos, defaultPos, proxy.p)
      },
      onComplete: () => {
        this._animation = null
        this.camera.position.copy(defaultPos)
        if (this.controls) {
          this.controls.target.set(0, 0, 0)
          this.controls.enabled = true
          this.controls.autoRotate = true
          this.controls.update()
        }
        if (onComplete) onComplete()
      }
    })
  }

  /**
   * éå¤´å¼å¸è¿å¨ï¼è½»å¾®çç¼æ¢æå¨ï¼?
   */
  startBreathing() {
    // è½»åº¦çå¼å¸æç?Three.js å¨ç»å¾ªç¯å¤ç
  }

  /**
   * ææ­»å½åå¨ç?
   */
  kill() {
    if (this._animation) {
      this._animation.kill()
      this._animation = null
    }
  }

  /**
   * æ¸ç
   */
  dispose() {
    this.kill()
    this.camera = null
    this.controls = null
  }
}
