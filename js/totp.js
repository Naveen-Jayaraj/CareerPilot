/**
 * Lightweight RFC 6238 TOTP (Time-based One-Time Password) implementation
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, and Apple Keychain.
 * Uses Web Crypto API for high security.
 */

export class TOTP {
  // Generate a random 16-character Base32 secret key
  static generateSecret(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += chars[array[i] % 32];
    }
    return secret;
  }

  // Generate Google Authenticator URI format for QR Code
  static getOtpauthUrl(secret, accountName = 'User', issuer = 'CareerPilot') {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  // Base32 decode string to Uint8Array
  static base32ToBytes(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let cleaned = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = '';
    let bytes = [];

    for (let i = 0; i < cleaned.length; i++) {
      const val = alphabet.indexOf(cleaned[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }

    return new Uint8Array(bytes);
  }

  // Generate 6-digit TOTP code for a given timestamp (default: current time)
  static async generateCode(secret, timestamp = Date.now(), period = 30) {
    const counter = Math.floor(timestamp / 1000 / period);
    const keyBytes = this.base32ToBytes(secret);

    // Buffer counter as 8-byte big-endian integer
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, 0, false);
    view.setUint32(4, counter, false);

    // Import key for HMAC-SHA1 using Web Crypto API
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
    const signatureBytes = new Uint8Array(signature);

    // Dynamic truncation
    const offset = signatureBytes[signatureBytes.length - 1] & 0xf;
    const binary =
      ((signatureBytes[offset] & 0x7f) << 24) |
      ((signatureBytes[offset + 1] & 0xff) << 16) |
      ((signatureBytes[offset + 2] & 0xff) << 8) |
      (signatureBytes[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  }

  // Verify code allowing clock skew (+/- 1 time step = 30s tolerance window)
  static async verifyCode(secret, code, period = 30) {
    if (!secret || !code) return false;
    const sanitizedCode = String(code).trim().replace(/\s+/g, '');
    if (sanitizedCode.length !== 6 || !/^\d{6}$/.test(sanitizedCode)) return false;

    const now = Date.now();
    const timeSteps = [-1, 0, 1]; // Current, previous, and next 30-second windows

    for (const step of timeSteps) {
      const testTime = now + step * period * 1000;
      const expectedCode = await this.generateCode(secret, testTime, period);
      if (expectedCode === sanitizedCode) {
        return true;
      }
    }

    return false;
  }
}
