import { reactive } from 'vue';

// --- NOTIFICATION SYSTEM ---
export const toastState = reactive({
  show: false,
  message: '',
  type: 'info' // 'success', 'error', 'info', 'warning'
});

export function showToast(message, type = 'info') {
  toastState.message = message;
  toastState.type = type;
  toastState.show = true;
  
  // Vibration feedback for mobile
  if (navigator.vibrate) {
    if (type === 'error') navigator.vibrate([100, 50, 100]);
    else navigator.vibrate(50);
  }

  setTimeout(() => {
    toastState.show = false;
  }, 3000);
}

// --- MASCARAS E FORMATADORES ---
export function mascaraTelefone(v) {
  v = v.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
}

export function capitalize(val, isRelato = false) {
  if (!val) return "";
  if (isRelato) {
    return val.charAt(0).toUpperCase() + val.slice(1);
  } else {
    return val.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
  }
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
