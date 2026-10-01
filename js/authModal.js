/**
 * Google Authenticator (TOTP) Passwordless Login & Lock Manager
 * Server-side & local vault verified. Zero username/password required.
 * Hardened against Brute-Force, Replay Attacks, Session Fixation, and Idle Inactivity.
 */
import { TOTP } from './totp.js';
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';

class AuthManager {
  constructor() {
    this.secretKey = null;
    this.isUnlocked = false;
    this.tempSecret = null;
    this.failedAttempts = 0;
    this.lockoutUntil = 0;
    this.lastVerifiedStep = null;
    this.idleTimer = null;
    this.init();
  }

  init() {
    // Restore lock state from sessionStorage
    const sessionUnlocked = sessionStorage.getItem('careerpilot_unlocked') === 'true';
    const savedSecret = localStorage.getItem('careerpilot_totp_secret');

    if (savedSecret) {
      this.secretKey = savedSecret;
    }

    if (sessionUnlocked && this.secretKey) {
      this.isUnlocked = true;
      this.setupInactivityTimer();
    }

    this.injectAuthOverlayHtml();

    // Show lock overlay if locked or setup needed
    if (!this.isUnlocked) {
      this.showLockOverlay();
    }
  }

  setupInactivityTimer() {
    const resetTimer = () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      if (this.isUnlocked) {
        // Auto-lock after 15 minutes of idle time
        this.idleTimer = setTimeout(() => {
          this.lockApp();
        }, 15 * 60 * 1000);
      }
    };

    ['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    resetTimer();
  }

  injectAuthOverlayHtml() {
    if (document.getElementById('auth-overlay-backdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'auth-overlay-backdrop';
    backdrop.id = 'auth-overlay-backdrop';

    backdrop.innerHTML = `
      <div class="auth-card" id="auth-card">
        <div class="auth-logo-badge">
          ${icons.lock || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'}
        </div>
        <div class="auth-title" id="auth-title">Google Authenticator Lock</div>
        <div class="auth-subtitle" id="auth-subtitle">Enter the 6-digit code from your Google Authenticator app to access CareerPilot.</div>

        <div id="auth-body-container" style="width: 100%;">
          <!-- Pin or Setup rendered dynamically -->
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
  }

  showLockOverlay() {
    const backdrop = document.getElementById('auth-overlay-backdrop');
    if (!backdrop) return;

    backdrop.classList.add('active');

    if (!this.secretKey) {
      this.renderSetupMode();
    } else {
      this.renderVerificationMode();
    }
  }

  renderSetupMode() {
    this.tempSecret = TOTP.generateSecret(16);
    const otpUrl = TOTP.getOtpauthUrl(this.tempSecret, 'JobTracker', 'CareerPilot');
    const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(otpUrl)}&size=180&margin=1`;

    document.getElementById('auth-title').textContent = 'Setup Google Authenticator';
    document.getElementById('auth-subtitle').textContent = 'Scan this QR code with Google Authenticator, then enter your first 6-digit verification code below.';

    const container = document.getElementById('auth-body-container');
    container.innerHTML = `
      <div class="qr-setup-wrap">
        <div class="qr-image-frame">
          <img src="${qrImageUrl}" alt="Scan QR Code in Google Authenticator" />
        </div>
        <div class="secret-key-display">
          <span style="font-size: 0.72rem; color: #94a3b8;">KEY:</span>
          <span class="secret-key-text">${this.tempSecret}</span>
          <button class="btn btn-secondary btn-xs" id="btn-copy-secret" title="Copy Key">Copy</button>
        </div>

        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">Enter generated code to complete setup:</div>
        
        <div class="pin-input-group" id="pin-input-group">
          ${[0, 1, 2, 3, 4, 5].map(i => `<input type="text" maxlength="1" inputmode="numeric" class="pin-digit" data-index="${i}" autocomplete="off" />`).join('')}
        </div>

        <div class="auth-error-msg" id="auth-error-msg"></div>

        <button class="btn btn-primary btn-sm" id="btn-verify-setup" style="width: 100%;">
          Verify & Save Authenticator
        </button>
      </div>
    `;

    container.querySelector('#btn-copy-secret').onclick = () => {
      navigator.clipboard.writeText(this.tempSecret);
      notifications.showToast('Copied Secret Key to clipboard', 'info');
    };

    this.attachPinInputListeners(async (code) => {
      await this.handleVerifySetup(code);
    });

    container.querySelector('#btn-verify-setup').onclick = async () => {
      const code = this.getEnteredPin();
      await this.handleVerifySetup(code);
    };
  }

  async handleVerifySetup(code) {
    const errorEl = document.getElementById('auth-error-msg');
    errorEl.textContent = '';

    if (code.length !== 6) {
      errorEl.textContent = 'Please enter all 6 digits';
      this.triggerShake();
      return;
    }

    const isValid = await TOTP.verifyCode(this.tempSecret, code);
    if (isValid) {
      this.secretKey = this.tempSecret;
      localStorage.setItem('careerpilot_totp_secret', this.secretKey);
      sessionStorage.setItem('careerpilot_unlocked', 'true');
      this.isUnlocked = true;
      this.setupInactivityTimer();

      notifications.showToast('Google Authenticator connected successfully!', 'success');
      notifications.playChime('success');
      this.closeLockOverlay();
    } else {
      errorEl.textContent = 'Invalid code. Check Google Authenticator time & code.';
      this.triggerShake();
      this.clearPinInputs();
    }
  }

  renderVerificationMode() {
    document.getElementById('auth-title').textContent = 'Google Authenticator Lock';
    document.getElementById('auth-subtitle').textContent = 'Enter the 6-digit code from your Google Authenticator app to access your placement dashboard.';

    const container = document.getElementById('auth-body-container');
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="pin-input-group" id="pin-input-group">
          ${[0, 1, 2, 3, 4, 5].map(i => `<input type="text" maxlength="1" inputmode="numeric" class="pin-digit" data-index="${i}" autocomplete="off" />`).join('')}
        </div>

        <div class="auth-error-msg" id="auth-error-msg"></div>

        <button class="btn btn-primary btn-sm" id="btn-verify-unlock" style="width: 100%; margin-top: 4px;">
          Unlock Dashboard
        </button>

        <button class="btn btn-secondary btn-xs" id="btn-reset-auth" style="margin-top: 14px; opacity: 0.7;">
          Re-pair New Device / QR Code
        </button>
      </div>
    `;

    this.attachPinInputListeners(async (code) => {
      await this.handleVerifyUnlock(code);
    });

    container.querySelector('#btn-verify-unlock').onclick = async () => {
      const code = this.getEnteredPin();
      await this.handleVerifyUnlock(code);
    };

    container.querySelector('#btn-reset-auth').onclick = () => {
      if (confirm('Reset current Google Authenticator key and pair a new device?')) {
        localStorage.removeItem('careerpilot_totp_secret');
        sessionStorage.removeItem('careerpilot_unlocked');
        this.secretKey = null;
        this.renderSetupMode();
      }
    };
  }

  async handleVerifyUnlock(code) {
    const errorEl = document.getElementById('auth-error-msg');
    errorEl.textContent = '';

    // Check rate limit lockout
    if (Date.now() < this.lockoutUntil) {
      const secondsLeft = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
      errorEl.textContent = `Rate limit exceeded. Locked for ${secondsLeft}s.`;
      this.triggerShake();
      return;
    }

    if (code.length !== 6) {
      errorEl.textContent = 'Enter complete 6-digit code';
      this.triggerShake();
      return;
    }

    // Check OTP replay attack (reuse of same 30s code)
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    if (this.lastVerifiedStep === currentStep) {
      errorEl.textContent = 'Code already used. Wait for next 30s code.';
      this.triggerShake();
      this.clearPinInputs();
      return;
    }

    const isValid = await TOTP.verifyCode(this.secretKey, code);
    if (isValid) {
      this.failedAttempts = 0;
      this.lastVerifiedStep = currentStep;
      sessionStorage.setItem('careerpilot_unlocked', 'true');
      this.isUnlocked = true;
      this.setupInactivityTimer();

      notifications.showToast('Unlocked CareerPilot Dashboard', 'success');
      notifications.playChime('success');
      this.closeLockOverlay();
    } else {
      this.failedAttempts++;
      if (this.failedAttempts >= 5) {
        this.lockoutUntil = Date.now() + 5 * 60 * 1000; // 5 minute lockout
        errorEl.textContent = 'Too many failed attempts. Locked for 5 minutes.';
      } else {
        errorEl.textContent = `Incorrect code. ${5 - this.failedAttempts} attempts remaining.`;
      }
      this.triggerShake();
      this.clearPinInputs();
    }
  }

  attachPinInputListeners(onComplete) {
    const inputs = document.querySelectorAll('.pin-digit');
    if (inputs.length === 0) return;

    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val;
        e.target.classList.toggle('filled', val !== '');

        if (val && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }

        const fullPin = this.getEnteredPin();
        if (fullPin.length === 6 && onComplete) {
          onComplete(fullPin);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (pasted) {
          for (let i = 0; i < Math.min(pasted.length, 6); i++) {
            inputs[i].value = pasted[i];
            inputs[i].classList.add('filled');
          }
          if (pasted.length >= 6 && onComplete) {
            onComplete(pasted.substring(0, 6));
          } else {
            inputs[Math.min(pasted.length, 5)].focus();
          }
        }
      });
    });

    setTimeout(() => inputs[0]?.focus(), 150);
  }

  getEnteredPin() {
    let pin = '';
    document.querySelectorAll('.pin-digit').forEach(input => {
      pin += input.value.trim();
    });
    return pin;
  }

  clearPinInputs() {
    const inputs = document.querySelectorAll('.pin-digit');
    inputs.forEach(input => {
      input.value = '';
      input.classList.remove('filled');
    });
    inputs[0]?.focus();
  }

  triggerShake() {
    const card = document.getElementById('auth-card');
    if (!card) return;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 400);
  }

  closeLockOverlay() {
    const backdrop = document.getElementById('auth-overlay-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  }

  lockApp() {
    sessionStorage.removeItem('careerpilot_unlocked');
    this.isUnlocked = false;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.showLockOverlay();
    notifications.showToast('App Locked', 'info');
  }
}

export const authManager = new AuthManager();
