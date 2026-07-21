/**
 * encryption.js
 * ─────────────────────────────────────
 * AES 암호화/복호화 유틸리티
 * EPR 관련 사이트 계정 비밀번호를 localStorage에 안전하게 저장하기 위해 사용
 */
import CryptoJS from 'crypto-js';

// 암호화에 사용할 비밀 키 (실제 운영 시에는 환경변수 등에서 가져와야 합니다)
const SECRET_KEY = 'JANYTREE-PKG-2026-SECURE-KEY';

/**
 * 평문 텍스트를 AES로 암호화합니다
 * @param {string} plainText - 암호화할 평문 (예: 비밀번호)
 * @returns {string} 암호화된 문자열
 */
export function encrypt(plainText) {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
}

/**
 * AES로 암호화된 문자열을 복호화합니다
 * @param {string} cipherText - 암호화된 문자열
 * @returns {string} 복호화된 평문
 */
export function decrypt(cipherText) {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}
