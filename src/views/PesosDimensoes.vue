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
  
  // Salvar resumo para o Relatório Completo
  const resumo = {
    apurado: pbtApurado.value,
    limite: limiteLegalPBT.value,
    excesso: resultadosPBT.value.excessoTotal
  };
  localStorage.setItem('pmrv_pesos_last', JSON.stringify(resumo));
}, { deep: true });

// Auto-populate axles when config changes
watch(configValue, (newVal) => {
  if (newVal !== 'MANUAL') {
    const preset = VEHICLE_PRESETS.find(p => String(p.value) === String(newVal));
    if (preset && preset.schema) {
      eixos.value = preset.schema.map((tipo, index) => ({
        id: Date.now() + index,
        tipo: tipo,
        peso: 0
      }));
    }
  }
});

// Dimensions State
const dimTipo = ref(14.00);
const dimLargura = ref(0);
const dimAltura = ref(0);
const dimComprimento = ref(0);
const dimEntreEixos = ref(0);
const dimBalanco = ref(0);
const copiedDim = ref(false);

// PBT Computed
const isManual = computed(() => configValue.value === 'MANUAL');
const currentSchema = computed(() => {
  if (isManual.value) return [];
  const preset = VEHICLE_PRESETS.find(p => String(p.value) === String(configValue.value));
  return preset?.schema || [];
});
const limiteLegalPBT = computed(() => {
  if (isManual.value) return parseFloat(manualLimite.value || 0);
  return parseFloat(configValue.value);
});

const pbtApurado = computed(() => {
  if (metodo.value === 'nf') {
    return parseFloat(tara.value || 0) + parseFloat(cargaNF.value || 0);
  }
  return parseFloat(pbtMedido.value || 0);
});

const resultadosPBT = computed(() => {
  return calcularPBT({
    apurado: pbtApurado.value,
    limiteLegal: limiteLegalPBT.value
  });
});

const resultadosEixos = computed(() => {
  if (metodo.value !== 'balanca') return { temExcesso: false, detalhes: [], maiorExcessoEixo: 0 };
  return calcularEixos(eixos.value);
});

const multaTotal = computed(() => {
  const excesso = Math.max(resultadosPBT.value.excessoTotal, resultadosEixos.value.maiorExcessoEixo);
  return calcularMulta(excesso);
});

const infracaoTextoPeso = computed(() => {
  return formatarInfracaoPeso({
    pbt: resultadosPBT.value,
    eixos: resultadosEixos.value,
    multa: multaTotal.value,
    metodo: metodo.value
  });
});

// Dimensions Computed
const resultadosDim = computed(() => {
  return calcularDimensoes({
    largura: parseFloat(dimLargura.value || 0),
    altura: parseFloat(dimAltura.value || 0),
    comprimento: parseFloat(dimComprimento.value || 0),
    entreEixos: parseFloat(dimEntreEixos.value || 0),
    balancoTraseiro: parseFloat(dimBalanco.value || 0),
    limiteComprimento: parseFloat(dimTipo.value)
  });
});

const infracaoTextoDim = computed(() => formatarInfracaoDimensoes(resultadosDim.value.erros));

// Actions
const goBack = () => router.push({ name: 'home' });

const addEixo = () => {
  eixos.value.push({
    id: Date.now(),
    tipo: 'simples_2',
    peso: 0
  });
};

const removeEixo = (id) => {
  eixos.value = eixos.value.filter(e => e.id !== id);
};

const copiarPBT = () => {
  navigator.clipboard.writeText(infracaoTextoPeso.value).then(() => {
    copiedPBT.value = true;
    setTimeout(() => (copiedPBT.value = false), 2000);
  });
};

const copiarDim = () => {
  navigator.clipboard.writeText(infracaoTextoDim.value).then(() => {
    copiedDim.value = true;
    setTimeout(() => (copiedDim.value = false), 2000);
  });
};

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
      <!-- Tabs Navigation -->
      <div class="flex gap-2 p-1 bg-slate-800 rounded-xl mb-8">
        <button 
          class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all" 
          :class="activeTab === 'pbt' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'" 
          @click="activeTab = 'pbt'"
        >
          <img src="/img/new_icons/pesos.png" alt="Peso" class="icon-sm" /> Peso (PBT/Eixo)
        </button>
        <button 
          class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all" 
          :class="activeTab === 'dim' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'" 
          @click="activeTab = 'dim'"
        >
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
              <optgroup label="Caminhão Simples">
                <option v-for="p in VEHICLE_PRESETS.slice(0, 3)" :key="p.value" :value="p.value">{{ p.label }}</option>
              </optgroup>
              <optgroup label="Caminhão Trator + Semirreboque">
                <option v-for="p in VEHICLE_PRESETS.slice(3, 7)" :key="p.value" :value="p.value">{{ p.label }}</option>
              </optgroup>
              <optgroup label="Combinações (CVC)">
                <option v-for="p in VEHICLE_PRESETS.slice(7)" :key="p.value" :value="p.value">{{ p.label }}</option>
              </optgroup>
              <option value="MANUAL">✏️ Outro limite (Manual)</option>
            </select>
          </div>
          
          <div v-if="metodo === 'nf'" class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Tara (KG)</label>
              <input type="number" v-model="tara" class="w-full bg-slate-800 rounded-lg p-3 text-white" />
            </div>
            <div class="form-group">
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Carga NF (KG)</label>
              <input type="number" v-model="cargaNF" class="w-full bg-slate-800 rounded-lg p-3 text-white" />
            </div>
          </div>
          
          <div v-if="metodo === 'balanca'" class="form-group">
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">PBT Apurado (KG)</label>
            <input type="number" v-model="pbtMedido" class="w-full bg-slate-800 rounded-lg p-3 text-white" />
          </div>
        </div>

        <div v-if="metodo === 'balanca'">
          <div class="flex items-center justify-between mb-4">
            <label class="text-xs font-bold text-slate-400 uppercase">Pesagem por Eixo</label>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500" @click="addEixo">+ Eixo</button>
          </div>
          <VisualAxleSelector v-if="eixos.length > 0 && currentSchema.length > 0" :schema="currentSchema" v-model:eixos="eixos" />
        </div>

        <!-- Result Section -->
        <div v-if="pbtApurado > 0" class="mt-8 pt-6 border-t border-slate-700">
           <div class="flex justify-between items-center mb-6">
              <span class="text-slate-400">Total Apurado</span>
              <span class="text-2xl font-bold text-white">{{ formatKg(pbtApurado) }}</span>
           </div>
           <div class="p-4 rounded-xl" :class="resultadosPBT.status === 'EXCESSO' ? 'bg-red-900/30 border border-red-500' : 'bg-emerald-900/30 border border-emerald-500'">
             <p class="text-sm font-bold" :class="resultadosPBT.status === 'EXCESSO' ? 'text-red-400' : 'text-emerald-400'">
               {{ resultadosPBT.status === 'EXCESSO' ? '⚠️ EXCESSO DETECTADO' : '✅ DENTRO DOS LIMITES' }}
             </p>
           </div>
        </div>
      </div>
      <!-- End PBT -->
    </div>
  </section>
</template>

<style scoped>
.btn-ghost { background: none; border: none; color: #94a3b8; cursor: pointer; }
.btn-ghost:hover { color: white; }
.icon-sm { width: 20px; height: 20px; }
</style>
      <!-- DIMENSIONS CONTENT -->
      <div v-else class="tab-content">
        <p class="card-sub mb-16">Limites de Dimensões (Res. 210/06 e 882/21)</p>

        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">Tipo de Veículo / Comprimento</label>
            <select v-model="dimTipo">
              <option v-for="t in DIMENSION_TYPES" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>

          <div class="form-row form-row-3">
            <div class="form-field">
              <label class="field-label">Largura (m)</label>
              <input type="number" step="0.01" v-model="dimLargura" placeholder="Máx 2.60" />
            </div>
            <div class="form-field">
              <label class="field-label">Altura (m)</label>
              <input type="number" step="0.01" v-model="dimAltura" placeholder="Máx 4.40" />
            </div>
            <div class="form-field">
              <label class="field-label">Comprimento (m)</label>
              <input type="number" step="0.01" v-model="dimComprimento" :placeholder="'Máx ' + dimTipo" />
            </div>
          </div>

          <div class="form-row form-row-2">
            <div class="form-field">
              <label class="field-label">Dist. Entre-Eixos (m)</label>
              <input type="number" step="0.01" v-model="dimEntreEixos" placeholder="P/ cálculo balanço" />
            </div>
            <div class="form-field">
              <label class="field-label">Balanço Traseiro (m)</label>
              <input type="number" step="0.01" v-model="dimBalanco" placeholder="Medido" />
            </div>
          </div>
        </div>

        <!-- Resultados Dimensões -->
        <div v-if="dimLargura > 0 || dimAltura > 0 || dimComprimento > 0" class="result-box visible">
          <div class="divider mt-16 mb-16"></div>
          
          <div class="infra-stat mb-12" v-if="dimEntreEixos > 0">
            <span class="infra-stat-label">Limite de Balanço Traseiro</span>
            <strong>{{ formatM(resultadosDim.limiteBalanco) }}</strong>
            <span class="card-sub">Menor entre 60% do entre-eixos e 3,50m.</span>
          </div>

          <!-- Alertas -->
          <div v-if="resultadosDim.isLegal" class="sub-box mt-12" style="background: var(--green-dim); border-color: var(--green);">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">✅</span>
              <div>
                <strong style="color: var(--green); display: block;">DIMENSÕES LEGAIS</strong>
                <span class="card-sub">Veículo dentro dos limites permitidos.</span>
              </div>
            </div>
          </div>

          <div v-else class="sub-box sub-box-red mt-12">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">⚠️</span>
              <div>
                <strong style="color: var(--red); display: block;">DIMENSÃO EXCEDENTE!</strong>
                <span class="card-sub">
                  <div v-for="err in resultadosDim.erros" :key="err.type">
                    • {{ {
                      'LARGURA': 'Largura',
                      'ALTURA': 'Altura',
                      'COMPRIMENTO': 'Comprimento',
                      'BALANCO': 'Balanço Traseiro'
                    }[err.type] }} excedente ({{ formatM(err.medido) }} > {{ formatM(err.limite) }})
                  </div>
                </span>
              </div>
            </div>
          </div>

          <div v-if="!resultadosDim.isLegal" class="mt-16">
            <label class="result-label">📑 Enquadramento Sugerido</label>
            <div class="result-text" style="white-space: pre-wrap;">{{ infracaoTextoDim }}</div>
            <div class="result-actions">
              <button class="btn btn-primary btn-full" @click="copiarDim">
                {{ copiedDim ? '✅ Copiado!' : '📋 Copiar Dados' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer class="footer-signature mt-16">
        Polícia Militar Rodoviária de Santa Catarina<br>
        Ferramenta de Apoio Operacional
      </footer>
    </div>
  </section>
</template>

<style scoped>
.icon-sm {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  vertical-align: middle;
}
.mb-16 { margin-bottom: 16px; }
.mb-12 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 8px; }
.mt-4 { margin-top: 4px; }
.m-0 { margin: 0; }
.py-16 { padding-top: 16px; padding-bottom: 16px; }
.align-center { align-items: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.tab-content { animation: fadeIn 0.3s ease; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
