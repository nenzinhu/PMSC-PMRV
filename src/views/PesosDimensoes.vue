<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import VisualAxleSelector from '../components/VisualAxleSelector.vue';
import { 
  VEHICLE_PRESETS, 
  PES_LIMITES_EIXOS,
  DIMENSION_TYPES
} from '../js/pesos-config';
import { 
  calcularPBT, 
  calcularEixos,
  calcularMulta,
  calcularDimensoes
} from '../js/pesos-logic';
import {
  formatarInfracaoPeso,
  formatarInfracaoDimensoes,
  formatKg,
  formatM
} from '../js/pesos-formatter';

const router = useRouter();

// Tabs
const activeTab = ref('pbt'); // 'pbt' or 'dim'

// PBT/Peso State
const metodo = ref('nf'); // 'nf' or 'balanca'
const configValue = ref('16000');
const manualLimite = ref(0);
const tara = ref(0);
const cargaNF = ref(0);
const pbtMedido = ref(0);
const eixos = ref([]); // { tipo, peso, id }
const copiedPBT = ref(false);

// Dimensions State
const dimTipo = ref(14.00);
const dimLargura = ref(0);
const dimAltura = ref(0);
const dimComprimento = ref(0);
const dimEntreEixos = ref(0);
const dimBalanco = ref(0);
const copiedDim = ref(false);

// --- PERSISTÊNCIA ---
onMounted(() => {
  const saved = localStorage.getItem('pmrv_pesos_data');
  if (saved) {
    const data = JSON.parse(saved);
    metodo.value = data.metodo || 'nf';
    configValue.value = data.configValue || '16000';
    manualLimite.value = data.manualLimite || 0;
    tara.value = data.tara || 0;
    cargaNF.value = data.cargaNF || 0;
    pbtMedido.value = data.pbtMedido || 0;
    eixos.value = data.eixos || [];
  }
});

watch([metodo, configValue, manualLimite, tara, cargaNF, pbtMedido, eixos], () => {
  const data = {
    metodo: metodo.value,
    configValue: configValue.value,
    manualLimite: manualLimite.value,
    tara: tara.value,
    cargaNF: cargaNF.value,
    pbtMedido: pbtMedido.value,
    eixos: eixos.value
  };
  localStorage.setItem('pmrv_pesos_data', JSON.stringify(data));
}, { deep: true });

// Computed Properties
const isManual = computed(() => configValue.value === 'MANUAL');
const currentSchema = computed(() => {
  if (isManual.value) return [];
  const preset = VEHICLE_PRESETS.find(p => String(p.value) === String(configValue.value));
  return preset?.schema || [];
});

const limiteLegalPBT = computed(() => isManual.value ? parseFloat(manualLimite.value || 0) : parseFloat(configValue.value));
const pbtApurado = computed(() => metodo.value === 'nf' ? (parseFloat(tara.value || 0) + parseFloat(cargaNF.value || 0)) : parseFloat(pbtMedido.value || 0));

const resultadosPBT = computed(() => calcularPBT({ apurado: pbtApurado.value, limiteLegal: limiteLegalPBT.value }));
const resultadosEixos = computed(() => metodo.value !== 'balanca' ? { temExcesso: false, detalhes: [], maiorExcessoEixo: 0 } : calcularEixos(eixos.value));
const multaTotal = computed(() => calcularMulta(Math.max(resultadosPBT.value.excessoTotal, resultadosEixos.value.maiorExcessoEixo)));

const resultadosDim = computed(() => calcularDimensoes({
  largura: parseFloat(dimLargura.value || 0),
  altura: parseFloat(dimAltura.value || 0),
  comprimento: parseFloat(dimComprimento.value || 0),
  entreEixos: parseFloat(dimEntreEixos.value || 0),
  balancoTraseiro: parseFloat(dimBalanco.value || 0),
  limiteComprimento: parseFloat(dimTipo.value)
}));

// Actions
const goBack = () => router.push({ name: 'home' });
const addEixo = () => eixos.value.push({ id: Date.now(), tipo: 'simples_2', peso: 0 });
const copiarPBT = () => { navigator.clipboard.writeText(formatarInfracaoPeso({ pbt: resultadosPBT.value, eixos: resultadosEixos.value, multa: multaTotal.value, metodo: metodo.value })); copiedPBT.value = true; setTimeout(() => (copiedPBT.value = false), 2000); };
const copiarDim = () => { navigator.clipboard.writeText(formatarInfracaoDimensoes(resultadosDim.value.erros)); copiedDim.value = true; setTimeout(() => (copiedDim.value = false), 2000); };
</script>

<template>
  <section class="screen active p-4" aria-label="Pesos e Dimensões">
    <div class="flex items-center gap-4 mb-6">
      <button class="btn-ghost text-lg" @click="goBack">←</button>
      <div class="flex items-center gap-3">
        <img src="/img/new_icons/pesos.png" alt="Peso" class="w-8 h-8" />
        <h2 class="text-xl font-bold text-white">Pesos e Dimensões</h2>
      </div>
    </div>

    <div class="card p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl">
      <div class="flex gap-2 p-1 bg-slate-800 rounded-xl mb-8">
        <button class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all" :class="activeTab === 'pbt' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'" @click="activeTab = 'pbt'">
          <img src="/img/new_icons/pesos.png" alt="Peso" class="icon-sm" /> Peso (PBT/Eixo)
        </button>
        <button class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all" :class="activeTab === 'dim' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'" @click="activeTab = 'dim'">
          <img src="/img/new_icons/croqui.png" alt="Dimensões" class="icon-sm" /> Dimensões
        </button>
      </div>

      <!-- PBT CONTENT -->
      <div v-if="activeTab === 'pbt'" class="space-y-6">
        <div class="form-group">
          <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Método de Fiscalização</label>
          <select v-model="metodo" class="w-full bg-slate-800 border-none rounded-lg p-3 text-white">
            <option value="nf">Nota Fiscal (Tolerância 5% PBT)</option>
            <option value="balanca">Balança (Tol. 5% PBT / 12.5% Eixos)</option>
          </select>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Configuração (PBT)</label>
            <select v-model="configValue" class="w-full bg-slate-800 border-none rounded-lg p-3 text-white">
              <optgroup label="Caminhão Simples"><option v-for="p in VEHICLE_PRESETS.slice(0, 3)" :key="p.value" :value="p.value">{{ p.label }}</option></optgroup>
              <optgroup label="Caminhão Trator + Semirreboque"><option v-for="p in VEHICLE_PRESETS.slice(3, 7)" :key="p.value" :value="p.value">{{ p.label }}</option></optgroup>
              <optgroup label="Combinações (CVC)"><option v-for="p in VEHICLE_PRESETS.slice(7)" :key="p.value" :value="p.value">{{ p.label }}</option></optgroup>
              <option value="MANUAL">✏️ Outro limite (Manual)</option>
            </select>
          </div>
          <div v-if="metodo === 'nf'" class="grid grid-cols-2 gap-4">
            <div class="form-group"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Tara (KG)</label><input type="number" v-model="tara" class="w-full bg-slate-800 rounded-lg p-3 text-white" /></div>
            <div class="form-group"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Carga NF (KG)</label><input type="number" v-model="cargaNF" class="w-full bg-slate-800 rounded-lg p-3 text-white" /></div>
          </div>
          <div v-if="metodo === 'balanca'" class="form-group"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">PBT Apurado (KG)</label><input type="number" v-model="pbtMedido" class="w-full bg-slate-800 rounded-lg p-3 text-white" /></div>
        </div>
        <div v-if="metodo === 'balanca'">
          <div class="flex items-center justify-between mb-4"><label class="text-xs font-bold text-slate-400 uppercase">Pesagem por Eixo</label><button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500" @click="addEixo">+ Eixo</button></div>
          <VisualAxleSelector v-if="eixos.length > 0 && currentSchema.length > 0" :schema="currentSchema" v-model:eixos="eixos" />
        </div>
        <div v-if="pbtApurado > 0" class="mt-8 pt-6 border-t border-slate-700">
           <div class="flex justify-between items-center mb-6"><span class="text-slate-400">Total Apurado</span><span class="text-2xl font-bold text-white">{{ formatKg(pbtApurado) }}</span></div>
           <div class="p-4 rounded-xl" :class="resultadosPBT.status === 'EXCESSO' ? 'bg-red-900/30 border border-red-500' : 'bg-emerald-900/30 border border-emerald-500'">
             <p class="text-sm font-bold" :class="resultadosPBT.status === 'EXCESSO' ? 'text-red-400' : 'text-emerald-400'">{{ resultadosPBT.status === 'EXCESSO' ? '⚠️ EXCESSO DETECTADO' : '✅ DENTRO DOS LIMITES' }}</p>
           </div>
        </div>
      </div>

      <!-- DIMENSIONS CONTENT -->
      <div v-else class="space-y-6">
        <p class="text-sm text-slate-400">Limites de Dimensões (Res. 210/06 e 882/21)</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo de Veículo</label>
            <select v-model="dimTipo" class="w-full bg-slate-800 border-none rounded-lg p-3 text-white">
              <option v-for="t in DIMENSION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="form-group"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Larg (m)</label><input type="number" step="0.01" v-model="dimLargura" class="w-full bg-slate-800 rounded-lg p-3 text-white" /></div>
            <div class="form-group"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Alt (m)</label><input type="number" step="0.01" v-model="dimAltura" class="w-full bg-slate-800 rounded-lg p-3 text-white" /></div>
            <div class="form-group"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Comp (m)</label><input type="number" step="0.01" v-model="dimComprimento" class="w-full bg-slate-800 rounded-lg p-3 text-white" /></div>
          </div>
        </div>
        <div v-if="dimLargura > 0 || dimAltura > 0 || dimComprimento > 0" class="mt-8 pt-6 border-t border-slate-700 space-y-4">
           <div class="p-4 rounded-xl" :class="resultadosDim.isLegal ? 'bg-emerald-900/30 border border-emerald-500' : 'bg-red-900/30 border border-red-500'">
             <p class="text-sm font-bold" :class="resultadosDim.isLegal ? 'text-emerald-400' : 'text-red-400'">{{ resultadosDim.isLegal ? '✅ DIMENSÕES LEGAIS' : '⚠️ DIMENSÃO EXCEDENTE!' }}</p>
             <ul v-if="!resultadosDim.isLegal" class="mt-2 text-xs text-red-300"><li v-for="err in resultadosDim.erros" :key="err.type">• {{ err.type }}: {{ formatM(err.medido) }} / Limite {{ formatM(err.limite) }}</li></ul>
           </div>
           <button v-if="!resultadosDim.isLegal" class="w-full py-2 bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-600" @click="copiarDim">{{ copiedDim ? '✅ Copiado!' : '📋 Copiar Infração' }}</button>
        </div>
      </div>
    </div>
    <footer class="mt-8 text-center text-xs text-slate-500">Polícia Militar Rodoviária de Santa Catarina<br>Ferramenta de Apoio Operacional</footer>
  </section>
</template>

<style scoped>
.btn-ghost { background: none; border: none; color: #94a3b8; cursor: pointer; }
.btn-ghost:hover { color: white; }
.icon-sm { width: 20px; height: 20px; }
</style>