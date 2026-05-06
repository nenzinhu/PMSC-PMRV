<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { INFRACOES_RAW } from '../js/infracoes-data';

const router = useRouter();

const state = reactive({
  records: [],
  search: '',
  selectedGravity: '',
  tab: 'search',
  loading: true,
  visibleLimit: 15
});

const gravities = ['Gravíssima', 'Grave', 'Média', 'Leve'];

const frequentSearches = [
  { label: 'Cinto', term: 'cinto', icon: '👤' },
  { label: 'Celular', term: 'celular', icon: '📱' },
  { label: 'Licenciamento', term: 'licenciam', icon: '📄' },
  { label: 'Sem CNH', term: 'sem possuir', icon: '🚫' },
  { label: 'Embriaguez', term: 'alcool', icon: '🍺' },
  { label: 'Ultrapassagem', term: 'ultrapass', icon: '🔄' },
  { label: 'Capacete', term: 'capacete', icon: '🪖' },
  { label: 'Farol', term: 'farol', icon: '💡' }
];

const normalizeText = (val) => {
  return String(val || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
};

onMounted(() => {
  state.records = INFRACOES_RAW.map(r => ({
    ...r,
    searchIndex: normalizeText(`${r.codigo} ${r.descricao} ${r.artigo} ${r.categoria}`)
  }));
  state.loading = false;
});

const filteredRecords = computed(() => {
  const query = normalizeText(state.search);
  const terms = query.split(/\s+/).filter(Boolean);
  
  return state.records.filter(r => {
    const matchesSearch = terms.length === 0 || terms.every(t => r.searchIndex.includes(t));
    const matchesGravity = !state.selectedGravity || normalizeText(r.categoria).includes(normalizeText(state.selectedGravity));
    return matchesSearch && matchesGravity;
  }).slice(0, state.visibleLimit);
});

const getBadgeColor = (cat) => {
  const c = normalizeText(cat);
  if (c.includes('graviss')) return 'var(--danger)';
  if (c.includes('grave')) return 'var(--warning)';
  if (c.includes('media')) return 'var(--info)';
  if (c.includes('leve')) return 'var(--success)';
  return 'var(--text-dim)';
};

const applyFrequent = (term) => {
  state.search = term;
  state.tab = 'search';
};
</script>

<template>
  <section class="screen active p-4" aria-label="Consulta de Infrações">
    <div class="flex items-center gap-4 mb-6">
      <button class="btn-ghost text-lg" @click="router.push('/')">←</button>
      <div class="flex items-center gap-3">
        <img src="/img/new_icons/infracoes.png" alt="Infrações" class="w-8 h-8" />
        <h2 class="text-xl font-bold text-white">Consulta de Infrações</h2>
      </div>
    </div>

    <div class="card p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl">
      <!-- Tabs -->
      <div class="flex gap-2 p-1 bg-slate-800 rounded-xl mb-6">
        <button 
          class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all" 
          :class="state.tab === 'search' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'" 
          @click="state.tab = 'search'"
        >
          🔍 Busca
        </button>
        <button 
          class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all" 
          :class="state.tab === 'frequent' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'" 
          @click="state.tab = 'frequent'"
        >
          ⭐ Atalhos
        </button>
      </div>

      <!-- SEARCH -->
      <div v-if="state.tab === 'search'" class="space-y-4">
        <input 
          v-model="state.search" 
          type="text" 
          placeholder="Pesquisar por código ou descrição..." 
          class="w-full bg-slate-800 border-none rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
        >
        
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="g in gravities" :key="g"
            class="px-3 py-1 text-xs font-bold rounded-full transition-all"
            :class="state.selectedGravity === g ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'"
            @click="state.selectedGravity = state.selectedGravity === g ? '' : g"
          >
            {{ g }}
          </button>
        </div>

        <div class="mt-4 space-y-3">
          <div v-for="r in filteredRecords" :key="r.codigo" class="p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-mono font-bold text-blue-400">#{{ r.codigo }}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded" :style="{ backgroundColor: getBadgeColor(r.categoria) + '40', color: getBadgeColor(r.categoria) }">
                {{ r.categoria }}
              </span>
            </div>
            <p class="text-sm text-slate-200 leading-tight mb-3">{{ r.descricao }}</p>
            <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div class="text-slate-500">Art: <span class="text-slate-300">{{ r.artigo }}</span></div>
              <div class="text-slate-500">Infrator: <span class="text-slate-300">{{ r.infrator }}</span></div>
              <div class="text-slate-500">Valor: <span class="text-emerald-400 font-bold">R$ {{ r.valor }}</span></div>
              <div v-if="r.medida" class="text-slate-500">Medida: <span class="text-amber-400">{{ r.medida }}</span></div>
            </div>
          </div>
          
          <button v-if="filteredRecords.length >= state.visibleLimit" class="w-full p-3 text-xs font-bold text-slate-400 bg-slate-800 rounded-xl hover:bg-slate-700" @click="state.visibleLimit += 15">
            Carregar mais resultados...
          </button>
        </div>
      </div>

      <!-- FREQUENT -->
      <div v-if="state.tab === 'frequent'" class="grid grid-cols-2 gap-3">
        <button 
          v-for="f in frequentSearches" :key="f.term" 
          class="p-4 bg-slate-800 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-700"
          @click="applyFrequent(f.term)"
        >
          <span class="text-2xl">{{ f.icon }}</span>
          <span class="text-xs font-bold text-white">{{ f.label }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.btn-ghost { background: none; border: none; color: #94a3b8; cursor: pointer; }
.btn-ghost:hover { color: white; }
</style>
