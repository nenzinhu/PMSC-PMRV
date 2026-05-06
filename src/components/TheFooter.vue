<script setup>
const limparCache = () => {
  if (confirm('Limpar os dados locais salvos do app?')) {
    Object.keys(window.localStorage || {})
      .filter(key => key.startsWith('pmrv_'))
      .forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};
</script>

<template>
  <footer class="app-footer" role="contentinfo">
    <div class="app-footer-badge">PMRv · PMRV-SC</div>
    <div class="app-footer-text">Desenvolvido por <span class="app-footer-author">Cabo Jeferson</span></div>
    <div style="margin-top:10px;">
      <button class="btn-clear-cache" type="button" @click="limparCache">Limpar cache</button>
    </div>
  </footer>
</template>
