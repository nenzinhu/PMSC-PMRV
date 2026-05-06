<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TheTopbar from './components/TheTopbar.vue';
import TheFooter from './components/TheFooter.vue';
import ToastNotification from './components/ToastNotification.vue';

const route = useRoute();
const router = useRouter();

const appClass = computed(() => {
  const wideScreens = ['infracoes', 'croqui'];
  return {
    'app': true,
    'app-wide': wideScreens.includes(route.name)
  };
});
</script>

<template>
  <div :class="appClass" role="main">
    <TheTopbar />
    <ToastNotification />
    
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade-up" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <TheFooter />
  </div>
</template>

<style>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
