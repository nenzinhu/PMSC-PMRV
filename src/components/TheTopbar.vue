<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const go = (name) => {
  router.push({ name });
};
</script>

<template>
  <header class="topbar" role="banner">
    <div class="brand" @click="go('home')" style="cursor: pointer;">
      <img src="/img/principal.png" alt="Logo Principal" class="brand-logo" aria-hidden="true" />
      
      <span class="brand-pill" aria-label="Sistema Pmrv - Online">
        <span class="brand-dot" aria-hidden="true"></span>
        Pmrv
      </span>
      <span class="brand-title">Otimização & Agilidade</span>
    </div>
    <nav class="topbar-actions" aria-label="Navegação principal">
      <button class="btn" @click="go('home')" aria-label="Ir para o menu principal">Menu</button>
      <button class="btn" @click="go('help')" aria-label="Abrir ajuda">Ajuda</button>
      <button class="btn btn-danger" @click="go('ended')" aria-label="Encerrar sessão">Sair</button>
    </nav>
  </header>
</template>
