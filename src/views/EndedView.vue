<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const restart = () => {
  router.push({ name: 'home' });
};
</script>

<template>
  <section class="screen active flex-center">
    <div class="card text-center animate-fade">
      <div class="end-icon">👋</div>
      <h2 class="card-section-title">Serviço Finalizado</h2>
      <p class="card-sub-modern">O aplicativo pode ser fechado com segurança.</p>
      
      <div class="divider mt-24 mb-24"></div>
      
      <button class="btn btn-primary btn-full" @click="restart">
        Voltar ao Início
      </button>
    </div>
    
    <div class="footer-note mt-24">
      Pmrv · Otimização & Agilidade
    </div>
  </section>
</template>

<style scoped>
.flex-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 20px;
}

.text-center { text-align: center; }

.end-icon { font-size: 64px; margin-bottom: 20px; }

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 40px 24px;
  width: 100%;
  max-width: 350px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.card-section-title { font-size: 22px; margin-bottom: 12px; }
.card-sub-modern { font-size: 14px; color: var(--text-dim); }

.divider { height: 1px; background: var(--border-color); width: 100%; }

.footer-note { font-size: 12px; color: var(--text-dim); }

.animate-fade { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
