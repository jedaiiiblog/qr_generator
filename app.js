'use strict';
const form = document.getElementById('url-form');
const input = document.getElementById('url-input');
const error = document.getElementById('form-error');
const canvas = document.getElementById('qr-canvas');
const download = document.getElementById('qr-download');
const submit = document.getElementById('submit-button');
let currentUrl = null;
let toastTimer;

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('QR 코드로 만들 URL을 입력해 주세요.');
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try { url = new URL(candidate); } catch { throw new Error('올바른 URL을 입력해 주세요. 예: https://example.com'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || /\s/.test(trimmed)) throw new Error('http 또는 https 웹 주소를 입력해 주세요.');
  if (url.username || url.password) throw new Error('로그인 정보가 포함되지 않은 URL을 입력해 주세요.');
  if (new TextEncoder().encode(url.href).length > 2000) throw new Error('URL이 너무 길어요. 2,000바이트 이하의 주소를 입력해 주세요.');
  return url;
}

function drawQR(url) {
  if (typeof qrcode !== 'function') throw new Error('QR 생성 기능을 불러오지 못했어요. 페이지를 새로고침해 주세요.');
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, 'M');
  qr.addData(url, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  const margin = 4;
  const scale = Math.floor(1200 / (count + margin * 2));
  const size = (count + margin * 2) * scale;
  // Whole pixel modules and the standard four-module quiet zone keep scans crisp.
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#17251b';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale);
    }
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  error.textContent = '';
  input.removeAttribute('aria-invalid');
  submit.disabled = true;
  try {
    const url = normalizeUrl(input.value);
    drawQR(url.href);
    currentUrl = url;
    input.value = url.href;
    document.getElementById('result-url').textContent = url.href;
    document.getElementById('result-url').title = url.href;
    const formWrap = document.querySelector('.form-wrap');
    const before = formWrap.getBoundingClientRect();
    const wasGenerated = document.getElementById('workspace').classList.contains('generated');
    document.getElementById('result').hidden = false;
    document.getElementById('workspace').classList.add('generated');
    const after = formWrap.getBoundingClientRect();
    if (!wasGenerated && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      formWrap.animate([{ transform: `translateY(${before.top - after.top}px)` }, { transform: 'translateY(0)' }], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    showToast('QR 코드가 완성됐어요. 클릭해서 저장해 보세요.');
  } catch (err) {
    error.textContent = err.message || 'QR 코드를 생성하지 못했어요. URL을 확인해 주세요.';
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  } finally { submit.disabled = false; }
});

download.addEventListener('click', () => {
  if (!currentUrl) return;
  canvas.toBlob((blob) => {
    if (!blob) { showToast('파일을 만들지 못했어요. 다시 시도해 주세요.'); return; }
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `smart-qr-${currentUrl.hostname.replace(/[^a-z0-9.-]/gi, '-')}.jpg`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    showToast('JPG 다운로드를 시작했어요.');
  }, 'image/jpeg', 1);
});

function showToast(message) {
  const toast = document.getElementById('toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}
