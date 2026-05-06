import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  // ... (mantendo o restante das rotas igual)
  { path: '/assumir', name: 'assumir', component: () => import('../views/AssumirServico.vue') },
  { path: '/envolvidos', name: 'envolvidos', component: () => import('../views/EnvolvidosView.vue') },
  { path: '/pmrv', name: 'pmrv', component: () => import('../views/RelatoPolicial.vue') },
  { path: '/danos', name: 'danos', component: () => import('../views/DanosAparentes.vue') },
  { path: '/relatorio', name: 'relatorio', component: () => import('../views/RelatorioCompleto.vue') },
  { path: '/infracoes', name: 'infracoes', component: () => import('../views/ConsultaInfracoes.vue') },
  { path: '/patrulhamento', name: 'patrulhamento', component: () => import('../views/PatrulhamentoView.vue') },
  { path: '/pesos', name: 'pesos', component: () => import('../views/PesosDimensoes.vue') },
  { path: '/tacografo', name: 'tacografo', component: () => import('../views/TacografoView.vue') },
  { path: '/croqui', name: 'croqui', component: () => import('../views/CroquiDinamico.vue') },
  { path: '/rodovias-ref', name: 'rodovias-ref', component: () => import('../views/RodoviasRef.vue') },
  { path: '/prazos-transito', name: 'prazos-transito', component: () => import('../views/PrazosLicenciamento.vue') },
  { path: '/docs', name: 'docs', component: () => import('../views/DocumentosTransito.vue') },
  { path: '/telefones', name: 'telefones', component: () => import('../views/TelefonesUteis.vue') },
  { path: '/help', name: 'help', component: () => import('../views/HelpView.vue') },
  { path: '/ended', name: 'ended', component: () => import('../views/EndedView.vue') },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

export default router;
