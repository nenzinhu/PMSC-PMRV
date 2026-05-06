<script setup>
import { toastState } from '../js/utils';

const getIcon = (type) => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
};
</script>

<template>
  <transition name="toast-slide">
    <div v-if="toastState.show" class="app-toast" :class="'toast-' + toastState.type">
      <span class="toast-icon">{{ getIcon(toastState.type) }}</span>
      <span class="toast-message">{{ toastState.message }}</span>
    </div>
  </transition>
</template>

<style scoped>
.app-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 12px 20px;
  border-radius: 12px;
  background: #1e293b;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  min-width: 280px;
  max-width: 90%;
}

.toast-success { border-left: 5px solid #22c55e; }
.toast-error { border-left: 5px solid #ef4444; }
.toast-warning { border-left: 5px solid #eab308; }
.toast-info { border-left: 5px solid #3b82f6; }

.toast-message {
  font-size: 14px;
  font-weight: 600;
}

/* ANIMATION */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -40px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -40px);
}
</style>
