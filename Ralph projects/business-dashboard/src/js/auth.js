/**
 * Authentication Module - PIN Protection
 * Handles PIN-based authentication with SHA-256 hashing
 */

class AuthManager {
  constructor() {
    // Default PIN hash (PIN: 1234) - should be changed in production
    // Generated via: await crypto.subtle.digest('SHA-256', new TextEncoder().encode('1234'))
    this.defaultPinHash = 'a4e624d686e03ed2767c0abd85c14426b0b1157d2ce81d27bb4fe4f6f01d688a';
    this.storageKey = 'dashboard_pin_hash';
    this.sessionKey = 'dashboard_authenticated';
    this.init();
  }

  init() {
    // Ensure there's a PIN hash in storage (use default if not set)
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, this.defaultPinHash);
    }
  }

  /**
   * Hash a PIN using SHA-256
   */
  async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify if provided PIN is correct
   */
  async verifyPin(pin) {
    const inputHash = await this.hashPin(pin);
    const storedHash = localStorage.getItem(this.storageKey);
    return inputHash === storedHash;
  }

  /**
   * Check if user is authenticated in current session
   */
  isAuthenticated() {
    return sessionStorage.getItem(this.sessionKey) === 'true';
  }

  /**
   * Mark user as authenticated for this session
   */
  authenticate() {
    sessionStorage.setItem(this.sessionKey, 'true');
  }

  /**
   * Log out user (clear session)
   */
  logout() {
    sessionStorage.removeItem(this.sessionKey);
  }

  /**
   * Change PIN (requires current PIN for verification)
   */
  async changePin(currentPin, newPin) {
    const isValid = await this.verifyPin(currentPin);
    if (!isValid) {
      throw new Error('PIN atual incorreto');
    }

    if (newPin.length < 4 || newPin.length > 6) {
      throw new Error('O PIN deve ter entre 4 e 6 dígitos');
    }

    if (!/^\d+$/.test(newPin)) {
      throw new Error('O PIN deve conter apenas números');
    }

    const newHash = await this.hashPin(newPin);
    localStorage.setItem(this.storageKey, newHash);
    return true;
  }
}

// Initialize auth manager
const authManager = new AuthManager();

/**
 * PIN Input Handler
 */
class PinInput {
  constructor() {
    this.pinValue = '';
    this.maxLength = 6;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.form = document.getElementById('pin-form');
    this.display = document.getElementById('pin-display');
    this.errorMsg = document.getElementById('pin-error');
    this.keypad = document.querySelectorAll('.keypad-btn');

    if (!this.form) return;

    // Keypad button handlers
    this.keypad.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const digit = btn.dataset.digit;

        if (digit) {
          this.addDigit(digit);
        } else if (action === 'delete') {
          this.deleteDigit();
        } else if (action === 'clear') {
          this.clear();
        }
      });
    });

    // Physical keyboard support
    document.addEventListener('keydown', (e) => {
      if (!this.form || this.form.style.display === 'none') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this.addDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.deleteDigit();
      } else if (e.key === 'Enter' && this.pinValue.length >= 4) {
        e.preventDefault();
        this.submit();
      }
    });
  }

  addDigit(digit) {
    if (this.pinValue.length >= this.maxLength) return;

    this.pinValue += digit;
    this.updateDisplay();
    this.clearError();

    // Auto-submit when PIN reaches minimum length
    if (this.pinValue.length >= 4) {
      setTimeout(() => this.submit(), 300);
    }
  }

  deleteDigit() {
    if (this.pinValue.length === 0) return;
    this.pinValue = this.pinValue.slice(0, -1);
    this.updateDisplay();
    this.clearError();
  }

  clear() {
    this.pinValue = '';
    this.updateDisplay();
    this.clearError();
  }

  updateDisplay() {
    if (this.display) {
      this.display.textContent = '•'.repeat(this.pinValue.length);
    }
  }

  clearError() {
    if (this.errorMsg) {
      this.errorMsg.textContent = '';
      this.errorMsg.style.display = 'none';
    }
  }

  showError(message) {
    if (this.errorMsg) {
      this.errorMsg.textContent = message;
      this.errorMsg.style.display = 'block';
    }
  }

  async submit() {
    if (this.pinValue.length < 4) {
      this.showError('PIN deve ter pelo menos 4 dígitos');
      return;
    }

    try {
      const isValid = await authManager.verifyPin(this.pinValue);

      if (isValid) {
        authManager.authenticate();
        this.onSuccess();
      } else {
        this.showError('PIN incorreto. Tente novamente.');
        this.shake();
        this.clear();
      }
    } catch (error) {
      this.showError('Erro ao verificar PIN');
      console.error('PIN verification error:', error);
    }
  }

  shake() {
    if (this.form) {
      this.form.classList.add('shake');
      setTimeout(() => this.form.classList.remove('shake'), 500);
    }
  }

  onSuccess() {
    const pinScreen = document.getElementById('pin-screen');
    const mainApp = document.getElementById('main-app');

    if (pinScreen) {
      pinScreen.style.opacity = '0';
      setTimeout(() => {
        pinScreen.style.display = 'none';
        if (mainApp) {
          mainApp.style.display = 'block';
          setTimeout(() => {
            mainApp.style.opacity = '1';
          }, 10);
        }
      }, 300);
    }
  }
}

// Initialize PIN input
const pinInput = new PinInput();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { authManager, PinInput };
}
